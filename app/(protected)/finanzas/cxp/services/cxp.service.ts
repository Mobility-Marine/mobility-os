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
      supplier:business_partners!supplier_id(name, tax_id:rfc)
      logistics_provider:business_partners!logistics_provider_id(name)
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
      .select(`*, supplier:suppliers(name, tax_id), logistics_provider:logistics_providers(name), po:purchase_orders(po_number), shipment:shipments(reference)`)
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
export async function fetchPendingFromShipments(companyId: string) {
  const { data } = await supabase
    .from("shipments")
    .select("id, reference, service_type, provider_cost, currency, provider:business_partners!provider_id(id,name), client:business_partners!client_id(name)")
    .eq("company_id", companyId)
    .in("status", ["delivered", "invoiced"]);  // sin filtrar por provider_cost ni provider_id

  // Filtrar los que ya tienen AP
  const ids = (data ?? []).map(s => s.id);
  if (!ids.length) return [];
  const { data: existing } = await supabase
    .from("accounts_payable")
    .select("related_shipment_id")
    .eq("company_id", companyId)
    .in("related_shipment_id", ids);
  const existingIds = new Set((existing ?? []).map(e => e.related_shipment_id));
  return (data ?? []).filter(s => !existingIds.has(s.id));
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
  subtotal:              number;
  tax_amount:            number;
  total:                 number;
  related_po_id?:        string;
  related_shipment_id?:  string;
  notes?:                string;
}): Promise<AccountPayable> {
  const { data, error } = await supabase
    .from("accounts_payable")
    .insert({
      company_id: companyId, created_by: userId,
      balance: payload.total, status: "pending", payment_status: "not_scheduled",
      ...payload,
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
