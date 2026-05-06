import { supabase } from "@/lib/supabaseClient";
import type {
  AccountPayable, APPayment, APStats, SupplierAPSummary, APFilters, APAging,
} from "../types/cxp.types";

// ── HELPERS ───────────────────────────────────────────────────
function calcAging(dueDateStr: string | null | undefined): { days: number; bucket: APAging } {
  if (!dueDateStr) return { days: 0, bucket: "0-30" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr);
  const days  = Math.floor((today.getTime() - due.getTime()) / 86400000);
  const bucket: APAging = days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "+90";
  return { days: Math.max(0, days), bucket };
}

function enrichAP(ap: AccountPayable): AccountPayable {
  const { days, bucket } = calcAging(ap.due_date);
  return { ...ap, days_due: days, aging_bucket: bucket };
}

// ── FETCH LIST ────────────────────────────────────────────────
export async function fetchAP(companyId: string, filters: APFilters): Promise<AccountPayable[]> {
  let q = supabase
    .from("accounts_payable")
    .select(`*, 
      supplier:business_partners!supplier_id(name, tax_id:rfc),
      logistics_provider:business_partners!logistics_provider_id(name),
      po:purchase_orders(po_number),
      shipment:shipments(reference)
    `)
    .eq("company_id", companyId)
    .order("document_date", { ascending: false });

  if (filters.status !== "all")        q = q.eq("status", filters.status);
  if (filters.supplier_type !== "all") q = q.eq("supplier_type", filters.supplier_type);
  if (filters.from)                    q = q.gte("document_date", filters.from);
  if (filters.to)                      q = q.lte("document_date", filters.to);
  if (filters.search) {
    q = q.or(`supplier_name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%,supplier_rfc.ilike.%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let result = (data ?? []).map(enrichAP) as AccountPayable[];
  if (filters.aging !== "all") result = result.filter(ap => ap.aging_bucket === filters.aging);
  return result;
}

// ── FETCH BY ID ───────────────────────────────────────────────
export async function fetchAPById(id: string): Promise<{ ap: AccountPayable; payments: APPayment[] } | null> {
  const [{ data: ap }, { data: payments }] = await Promise.all([
    supabase.from("accounts_payable")
      .select(`*, supplier:business_partners!supplier_id(name, tax_id:rfc), logistics_provider:business_partners!logistics_provider_id(name), po:purchase_orders(po_number), shipment:shipments(reference)`)
      .eq("id", id).single(),
    supabase.from("ap_payments").select("*").eq("ap_id", id).order("payment_date", { ascending: false }),
  ]);
  if (!ap) return null;
  return { ap: enrichAP(ap as AccountPayable), payments: (payments ?? []) as APPayment[] };
}

// ── FETCH STATS ───────────────────────────────────────────────
export async function fetchAPStats(companyId: string): Promise<APStats> {
  const { data } = await supabase
    .from("accounts_payable")
    .select("total, balance, paid_amount, due_date, status, supplier_type, currency")
    .eq("company_id", companyId)
    .neq("status", "cancelled");

  const records = (data ?? []).map(r => enrichAP(r as AccountPayable));
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const first   = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

  const { data: paidMonth } = await supabase
    .from("ap_payments").select("amount, currency")
    .eq("company_id", companyId).gte("payment_date", first);

  const paid_month   = (paidMonth ?? []).reduce((s, p) => s + p.amount, 0);
  const active       = records.filter(r => r.status !== "paid");
  const total_balance= active.reduce((s, r) => s + r.balance, 0);
  const overdue      = active.filter(r => (r.days_due ?? 0) > 0);
  const total_overdue= overdue.reduce((s, r) => s + r.balance, 0);

  const b0  = active.filter(r => r.aging_bucket === "0-30");
  const b1  = active.filter(r => r.aging_bucket === "31-60");
  const b2  = active.filter(r => r.aging_bucket === "61-90");
  const b3  = active.filter(r => r.aging_bucket === "+90");
  // Agrupar por moneda
  const por_moneda: Record<string, { balance: number; overdue: number; paid: number; count: number }> = {};
  for (const r of records) {
    const cur = (r as any).currency ?? "MXN";
    if (!por_moneda[cur]) por_moneda[cur] = { balance: 0, overdue: 0, paid: 0, count: 0 };
    por_moneda[cur].balance += r.balance;
    if ((r.days_due ?? 0) > 0) por_moneda[cur].overdue += r.balance;
    por_moneda[cur].count++;
  }
  for (const p of (paidMonth ?? [])) {
    const cur = (p as any).currency ?? "MXN";
    if (!por_moneda[cur]) por_moneda[cur] = { balance: 0, overdue: 0, paid: 0, count: 0 };
    por_moneda[cur].paid += p.amount;
  }
  return {
    total_balance, total_overdue, paid_month,
    count_pending:  active.length,
    count_overdue:  overdue.length,
    bucket_0_30:    b0.reduce((s, r) => s + r.balance, 0),
    bucket_31_60:   b1.reduce((s, r) => s + r.balance, 0),
    bucket_61_90:   b2.reduce((s, r) => s + r.balance, 0),
    bucket_90plus:  b3.reduce((s, r) => s + r.balance, 0),
    count_0_30: b0.length, count_31_60: b1.length,
    count_61_90: b2.length, count_90plus: b3.length,
    by_type: {
      procurement: active.filter(r => r.supplier_type === "procurement").reduce((s, r) => s + r.balance, 0),
      logistics:   active.filter(r => r.supplier_type === "logistics").reduce((s, r) => s + r.balance, 0),
      operating:   active.filter(r => r.supplier_type === "operating").reduce((s, r) => s + r.balance, 0),
    },
    por_moneda,
  };
}

// ── RESUMEN POR PROVEEDOR ──────────────────────────────────────
export async function fetchSupplierAPSummaries(companyId: string): Promise<SupplierAPSummary[]> {
  const { data } = await supabase
    .from("accounts_payable")
    .select("supplier_id, supplier_name, supplier_rfc, supplier_type, total, balance, due_date, currency")
    .eq("company_id", companyId)
    .in("status", ["pending", "partial", "disputed"]);

  const map: Record<string, SupplierAPSummary> = {};
  for (const r of (data ?? [])) {
    const key = r.supplier_rfc ?? r.supplier_name;
    const { days } = calcAging(r.due_date);
    if (!map[key]) {
      map[key] = {
        supplier_id: r.supplier_id, supplier_name: r.supplier_name,
        supplier_rfc: r.supplier_rfc, supplier_type: r.supplier_type,
        total: 0, balance: 0, overdue: 0, count: 0,
        oldest_date: r.due_date ?? r.due_date, currency: r.currency, risk: "LOW",
      };
    }
    map[key].total   += r.total;
    map[key].balance += r.balance;
    if (days > 0) map[key].overdue += r.balance;
    map[key].count++;
    if ((r.due_date ?? "") < (map[key].oldest_date ?? "")) map[key].oldest_date = r.due_date ?? "";
  }

  return Object.values(map).map(s => ({
    ...s,
    risk: s.overdue > s.balance * 0.8 ? "CRITICAL"
        : s.overdue > s.balance * 0.5 ? "HIGH"
        : s.overdue > 0               ? "MEDIUM" : "LOW" as any,
  })).sort((a, b) => b.balance - a.balance);
}

// ── PENDIENTES DE REGISTRAR ───────────────────────────────────
/**
 * Lista embarques que requieren captura de costos para CXP.
 * Filtra por:
 *   - requires_supplier_invoice = true (consultoría/seguro NO aparecen)
 *   - status delivered / invoiced
 *
 * Modelo multi-factura: NO excluye los que ya tienen AP — la UI decide qué
 * mostrar según el conteo de invoices/cost_pending por embarque.
 */
export async function fetchPendingFromShipments(companyId: string) {
  const { data: shipments } = await supabase
    .from("shipments")
    .select(`
      id, reference, service_type, currency, total, status,
      requires_supplier_invoice,
      provider:business_partners!provider_id(id, name),
      client:business_partners!client_id(name)
    `)
    .eq("company_id", companyId)
    .eq("requires_supplier_invoice", true)
    .in("status", ["delivered", "invoiced"]);

  const ids = (shipments ?? []).map(s => s.id);
  if (!ids.length) return [];

  // Conteo de AP relacionados por embarque (no cancelados)
  const { data: ap } = await supabase
    .from("accounts_payable")
    .select("related_shipment_id, document_type, total")
    .eq("company_id", companyId)
    .in("related_shipment_id", ids)
    .neq("status", "cancelled");

  const apMap: Record<string, { invoices_count: number; pending_count: number; total_captured: number }> = {};
  for (const row of (ap ?? [])) {
    const sid = row.related_shipment_id!;
    if (!apMap[sid]) apMap[sid] = { invoices_count: 0, pending_count: 0, total_captured: 0 };
    if      (row.document_type === "invoice")      apMap[sid].invoices_count++;
    else if (row.document_type === "cost_pending") apMap[sid].pending_count++;
    apMap[sid].total_captured += Number(row.total ?? 0);
  }

  return (shipments ?? []).map(s => ({
    ...s,
    invoices_count: apMap[s.id]?.invoices_count ?? 0,
    pending_count:  apMap[s.id]?.pending_count  ?? 0,
    total_captured: apMap[s.id]?.total_captured ?? 0,
  }));
}

export async function fetchPendingFromPOs(companyId: string) {
  const { data } = await supabase
    .from("purchase_orders")
    .select("id, po_number, total, currency, supplier:business_partners!supplier_id(id,name), order_date")
    .eq("company_id", companyId)
    .eq("status", "received");

  const ids = (data ?? []).map(p => p.id);
  if (!ids.length) return [];
  const { data: existing } = await supabase
    .from("accounts_payable")
    .select("related_po_id")
    .eq("company_id", companyId)
    .in("related_po_id", ids);
  const existingIds = new Set((existing ?? []).map(e => e.related_po_id));
  return (data ?? []).filter(p => !existingIds.has(p.id));
}

// ── CREATE AP ─────────────────────────────────────────────────
export async function createAP(companyId: string, userId: string, payload: {
  supplier_id?:          string;
  logistics_provider_id?:string;
  supplier_type:         string;
  supplier_name:         string;
  supplier_rfc?:         string;
  supplier_email?:       string;
  document_type:         string;
  document_number?:      string;
  document_date:         string;
  due_date?:             string;
  expense_category?:     string;
  currency:              string;
  has_tax?:              boolean;          // ← NUEVO: si false, total = subtotal (sin IVA)
  subtotal:              number;
  tax_amount:            number;
  total:                 number;
  related_po_id?:        string;
  related_shipment_id?:  string;
  notes?:                string;
  xml_url?:              string;           // ← NUEVO
  pdf_url?:              string;           // ← NUEVO
}): Promise<AccountPayable> {
  const { data, error } = await supabase
    .from("accounts_payable")
    .insert({
      company_id: companyId,
      created_by: userId,
      ...payload,
      // Después del spread para no ser sobreescritos por payload:
      has_tax:        payload.has_tax ?? (payload.currency === "MXN"),
      balance:        payload.total,
      status:         "pending",
      payment_status: "not_scheduled",
    })
    .select("*").single();
  if (error) throw new Error(error.message);
  return enrichAP(data as AccountPayable);
}

// ── REGISTER PAYMENT ──────────────────────────────────────────
export async function registerAPPayment(companyId: string, userId: string, payload: {
  ap_id: string; amount: number; currency: string;
  payment_date: string; payment_form: string; reference?: string; notes?: string;
}): Promise<void> {
  const { data: ap } = await supabase
    .from("accounts_payable").select("total, paid_amount")
    .eq("id", payload.ap_id).single();
  if (!ap) throw new Error("Cuenta por pagar no encontrada");

  const new_paid    = ap.paid_amount + payload.amount;
  const new_balance = Math.max(0, ap.total - new_paid);
  const new_status  = new_balance <= 0.01 ? "paid" : "partial";

  await supabase.from("ap_payments").insert({
    company_id: companyId, ap_id: payload.ap_id,
    amount: payload.amount, currency: payload.currency,
    payment_date: payload.payment_date, payment_form: payload.payment_form,
    reference: payload.reference ?? null, notes: payload.notes ?? null,
    created_by: userId,
  });

  await supabase.from("accounts_payable").update({
    paid_amount: new_paid, balance: new_balance,
    status: new_status, payment_status: "paid",
    updated_at: new Date().toISOString(),
  }).eq("id", payload.ap_id);
}

// ── UPDATE STATUS ─────────────────────────────────────────────
export async function updateAPStatus(id: string, companyId: string, status: string): Promise<void> {
  await supabase.from("accounts_payable")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

// ── FETCH SUPPLIERS + PROVIDERS para dropdown ─────────────────
/**
 * Trae proveedores de compras + proveedores logísticos para dropdown del drawer "Nueva CXP".
 * Lee desde business_partners filtrando por flag de rol.
 */
export async function fetchSuppliersForAP(companyId: string) {
  const [{ data: suppliers }, { data: providers }] = await Promise.all([
    supabase.from("business_partners")
      .select("id, name, tax_id:rfc, email")
      .eq("company_id", companyId)
      .eq("is_supplier", true)
      .eq("is_active", true)
      .order("name"),
    supabase.from("business_partners")
      .select("id, name, rfc, contact_email:email")
      .eq("company_id", companyId)
      .eq("is_logistics_provider", true)
      .eq("is_active", true)
      .order("name"),
  ]);
  return { suppliers: suppliers ?? [], providers: providers ?? [] };
}

// ── TODOS LOS PROVEEDORES (para vista Por Proveedor) ──────────
export async function fetchAllProvidersForView(companyId: string): Promise<SupplierAPSummary[]> {
  // 1. Traer todos los partners (logísticos + de compras) desde la tabla unificada
  const [{ data: logProviders }, { data: suppliers }] = await Promise.all([
    supabase.from("business_partners")
      .select("id, name, rfc")
      .eq("company_id", companyId)
      .eq("is_logistics_provider", true)
      .eq("is_active", true)
      .order("name"),
    supabase.from("business_partners")
      .select("id, name, tax_id:rfc")
      .eq("company_id", companyId)
      .eq("is_supplier", true)
      .eq("is_active", true)
      .order("name"),
  ]);

  // 2. Traer los AP existentes para calcular balances
  const { data: apData } = await supabase
    .from("accounts_payable")
    .select("supplier_id, logistics_provider_id, supplier_name, supplier_rfc, supplier_type, total, balance, due_date, currency")
    .eq("company_id", companyId)
    .in("status", ["pending", "partial", "disputed"]);

  // Mapas de balance por proveedor
  const balanceMap: Record<string, { total: number; balance: number; overdue: number; count: number; oldest: string; currency: string }> = {};
  for (const ap of (apData ?? [])) {
    const key = ap.logistics_provider_id ?? ap.supplier_id ?? ap.supplier_name;
    const { days } = calcAging(ap.due_date);
    if (!balanceMap[key]) balanceMap[key] = { total: 0, balance: 0, overdue: 0, count: 0, oldest: ap.due_date ?? "", currency: ap.currency };
    balanceMap[key].total   += ap.total;
    balanceMap[key].balance += ap.balance;
    if (days > 0) balanceMap[key].overdue += ap.balance;
    balanceMap[key].count++;
    if ((ap.due_date ?? "") < balanceMap[key].oldest) balanceMap[key].oldest = ap.due_date ?? "";
  }

  const result: SupplierAPSummary[] = [];

  // Proveedores logísticos
  for (const lp of (logProviders ?? [])) {
    const b = balanceMap[lp.id] ?? { total: 0, balance: 0, overdue: 0, count: 0, oldest: new Date().toISOString().split("T")[0], currency: "MXN" };
    result.push({
      supplier_id:   lp.id,
      supplier_name: lp.name,
      supplier_rfc:  lp.rfc ?? null,
      supplier_type: "logistics",
      total:         b.total,
      balance:       b.balance,
      overdue:       b.overdue,
      count:         b.count,
      oldest_date:   b.oldest,
      currency:      b.currency,
      risk: b.overdue > b.balance * 0.8 ? "CRITICAL" : b.overdue > b.balance * 0.5 ? "HIGH" : b.overdue > 0 ? "MEDIUM" : "LOW",
    });
  }

  // Proveedores de abastecimiento
  for (const sp of (suppliers ?? [])) {
    const b = balanceMap[sp.id] ?? { total: 0, balance: 0, overdue: 0, count: 0, oldest: new Date().toISOString().split("T")[0], currency: "MXN" };
    result.push({
      supplier_id:   sp.id,
      supplier_name: sp.name,
      supplier_rfc:  sp.tax_id ?? null,
            supplier_type: "procurement" as any,
      total:         b.total,
      balance:       b.balance,
      overdue:       b.overdue,
      count:         b.count,
      oldest_date:   b.oldest,
      currency:      b.currency,
      risk: b.overdue > b.balance * 0.8 ? "CRITICAL" : b.overdue > b.balance * 0.5 ? "HIGH" : b.overdue > 0 ? "MEDIUM" : "LOW",
    });
  }

  return result.sort((a, b) => b.balance - a.balance);
}

// ── CONVERSIÓN COST_PENDING → INVOICE ─────────────────────────
/**
 * Convierte un costo provisional (cost_pending) en factura recibida (invoice).
 * Caso típico: primero se registra el monto estimado del proveedor, después
 * llega el CFDI con número de folio + fecha real.
 * Mantiene los pagos previos si los hubiera y recalcula balance/status.
 */
export async function convertCostPendingToInvoice(
  companyId: string,
  costId:    string,
  invoice: {
    document_number: string;
    document_date:   string;
    due_date?:       string | null;
    has_tax?:        boolean;
    subtotal:        number;
    tax_amount:      number;
    total:           number;
    xml_url?:        string | null;
    pdf_url?:        string | null;
    notes?:          string | null;
  },
): Promise<void> {
  const { data: current, error: e1 } = await supabase
    .from("accounts_payable")
    .select("document_type, paid_amount, currency")
    .eq("id", costId)
    .eq("company_id", companyId)
    .single();
  if (e1 || !current) throw new Error("Costo no encontrado");
  if (current.document_type !== "cost_pending") {
    throw new Error("Este registro ya no es un costo provisional");
  }

  const paid    = Number(current.paid_amount ?? 0);
  const balance = Math.max(0, invoice.total - paid);
  const status  = balance <= 0.01 ? "paid"
                : paid > 0        ? "partial"
                : "pending";

  const { error } = await supabase.from("accounts_payable").update({
    document_type:   "invoice",
    document_number: invoice.document_number,
    document_date:   invoice.document_date,
    due_date:        invoice.due_date ?? null,
    has_tax:         invoice.has_tax  ?? (current.currency === "MXN"),
    subtotal:        invoice.subtotal,
    tax_amount:      invoice.tax_amount,
    total:           invoice.total,
    balance,
    status,
    xml_url:         invoice.xml_url ?? null,
    pdf_url:         invoice.pdf_url ?? null,
    notes:           invoice.notes   ?? null,
    updated_at:      new Date().toISOString(),
  })
  .eq("id", costId)
  .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}