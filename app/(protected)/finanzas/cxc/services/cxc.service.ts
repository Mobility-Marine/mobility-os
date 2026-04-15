import { supabase } from "@/lib/supabaseClient";
import type {
  AccountReceivable, ARPayment, ARActivity,
  ARStats, ClientARSummary, ARFilters, ARAging,
} from "../types/cxc.types";

// ── HELPERS ──────────────────────────────────────────────────

function calcAging(dateStr: string): { days: number; bucket: ARAging } {
  const today = new Date(); today.setHours(0,0,0,0);
  const date  = new Date(dateStr);
  const days  = Math.floor((today.getTime() - date.getTime()) / 86400000);
  const bucket: ARAging =
    days <= 30 ? "0-30" :
    days <= 60 ? "31-60" :
    days <= 90 ? "61-90" : "+90";
  return { days, bucket };
}

function enrichAR(ar: AccountReceivable): AccountReceivable {
  const { days, bucket } = calcAging(ar.document_date);
  return { ...ar, days_overdue: days, aging_bucket: bucket };
}

// ── FETCH LIST ───────────────────────────────────────────────

export async function fetchAR(
  companyId: string,
  filters: ARFilters
): Promise<AccountReceivable[]> {
  let q = supabase
    .from("accounts_receivable")
    .select("*")
    .eq("company_id", companyId)
    .order("document_date", { ascending: false });

  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.collection && filters.collection !== "all") q = q.eq("collection_status", filters.collection);
  if (filters.currency) q = q.eq("currency", filters.currency);
  if (filters.from) q = q.gte("document_date", filters.from);
  if (filters.to)   q = q.lte("document_date", filters.to);
  if (filters.search) {
    q = q.or(`client_name.ilike.%${filters.search}%,client_rfc.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let result = (data ?? []).map(enrichAR) as AccountReceivable[];

  // Filtro de aging (client-side ya que depende de cálculo de fecha)
  if (filters.aging && filters.aging !== "all") {
    result = result.filter(ar => ar.aging_bucket === filters.aging);
  }

  return result;
}

// ── FETCH BY ID (con pagos y actividades) ────────────────────

export async function fetchARById(id: string): Promise<{
  ar: AccountReceivable;
  payments: ARPayment[];
  activities: ARActivity[];
} | null> {
  const [{ data: ar }, { data: payments }, { data: activities }] = await Promise.all([
    supabase.from("accounts_receivable").select("*").eq("id", id).single(),
    supabase.from("ar_payments").select("*").eq("ar_id", id).order("payment_date", { ascending: false }),
    supabase.from("ar_activities").select("*").eq("ar_id", id).order("created_at", { ascending: false }),
  ]);

  if (!ar) return null;
  return {
    ar: enrichAR(ar as AccountReceivable),
    payments: (payments ?? []) as ARPayment[],
    activities: (activities ?? []) as ARActivity[],
  };
}

// ── FETCH STATS ──────────────────────────────────────────────

export async function fetchARStats(companyId: string): Promise<ARStats> {
  const { data } = await supabase
    .from("accounts_receivable")
    .select("total, balance, paid_amount, document_date, status, currency")
    .eq("company_id", companyId)
    .neq("status", "bad_debt");

  const records = (data ?? []).map(enrichAR);
  const today   = new Date(); today.setHours(0,0,0,0);

  const first_this_month = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

  // Pagos del mes
  const { data: paymentsMonth } = await supabase
    .from("ar_payments")
    .select("amount")
    .eq("company_id", companyId)
    .gte("payment_date", first_this_month);

  const collected_month = (paymentsMonth ?? []).reduce((s, p) => s + p.amount, 0);

  const active = records.filter(r => r.status !== "paid");
  const total_balance = active.reduce((s, r) => s + r.balance, 0);
  const overdue       = active.filter(r => (r.days_overdue ?? 0) > 30);
  const total_overdue = overdue.reduce((s, r) => s + r.balance, 0);

  // Aging buckets
  const b_0_30  = active.filter(r => r.aging_bucket === "0-30");
  const b_31_60 = active.filter(r => r.aging_bucket === "31-60");
  const b_61_90 = active.filter(r => r.aging_bucket === "61-90");
  const b_90p   = active.filter(r => r.aging_bucket === "+90");

  // DSO: (total_balance / avg_monthly_revenue_90d) * 30
  const cutoff90 = new Date(today); cutoff90.setDate(today.getDate() - 90);
  const { data: revenueData } = await supabase
    .from("cfdi_documents")
    .select("total")
    .eq("company_id", companyId)
    .eq("type", "I")
    .eq("status", "valid")
    .gte("cfdi_date", cutoff90.toISOString().split("T")[0]);

  const revenue90 = (revenueData ?? []).reduce((s, r) => s + r.total, 0);
  const daily_revenue = revenue90 > 0 ? revenue90 / 90 : 1;
  const dso = Math.round(total_balance / daily_revenue);

  return {
    total_balance, total_overdue, collected_month,
    count_pending: active.length,
    count_overdue: overdue.length,
    dso: Math.min(dso, 999),
    bucket_0_30:  b_0_30.reduce((s, r) => s + r.balance, 0),
    bucket_31_60: b_31_60.reduce((s, r) => s + r.balance, 0),
    bucket_61_90: b_61_90.reduce((s, r) => s + r.balance, 0),
    bucket_90plus:b_90p.reduce((s, r) => s + r.balance, 0),
    count_0_30:   b_0_30.length,
    count_31_60:  b_31_60.length,
    count_61_90:  b_61_90.length,
    count_90plus: b_90p.length,
  };
}

// ── RESUMEN POR CLIENTE ──────────────────────────────────────

export async function fetchClientARSummaries(companyId: string): Promise<ClientARSummary[]> {
  const { data } = await supabase
    .from("accounts_receivable")
    .select("client_id, client_name, client_rfc, total, balance, document_date, currency")
    .eq("company_id", companyId)
    .in("status", ["pending", "partial", "disputed"]);

  const map: Record<string, ClientARSummary> = {};
  const today = new Date(); today.setHours(0,0,0,0);

  for (const r of (data ?? [])) {
    const key = r.client_rfc ?? r.client_name;
    const days = Math.floor((today.getTime() - new Date(r.document_date).getTime()) / 86400000);

    if (!map[key]) {
      map[key] = { client_id: r.client_id, client_name: r.client_name, client_rfc: r.client_rfc, total: 0, balance: 0, overdue: 0, count: 0, oldest_date: r.document_date, currency: r.currency, risk: "LOW" };
    }
    map[key].total   += r.total;
    map[key].balance += r.balance;
    if (days > 30) map[key].overdue += r.balance;
    map[key].count++;
    if (r.document_date < map[key].oldest_date) map[key].oldest_date = r.document_date;
  }

  return Object.values(map)
    .map(c => ({
      ...c,
      risk: c.overdue > c.balance * 0.8 ? "CRITICAL" :
            c.overdue > c.balance * 0.5 ? "HIGH" :
            c.overdue > 0                ? "MEDIUM" : "LOW" as any,
    }))
    .sort((a, b) => b.balance - a.balance);
}

// ── ACTIVIDADES DE UN CLIENTE ────────────────────────────────

export async function fetchClientActivities(
  companyId: string,
  clientId?: string,
  clientRfc?: string
): Promise<ARActivity[]> {
  let q = supabase
    .from("ar_activities")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (clientId) q = q.eq("client_id", clientId);

  const { data } = await q;
  return (data ?? []) as ARActivity[];
}

// ── REGISTRAR PAGO ───────────────────────────────────────────

export async function registerPayment(
  companyId: string,
  userId: string,
  payload: {
    ar_id:        string;
    amount:       number;
    currency:     string;
    payment_date: string;
    payment_form: string;
    reference?:   string;
    notes?:       string;
  }
): Promise<void> {
  // Obtener AR actual
  const { data: ar } = await supabase
    .from("accounts_receivable")
    .select("total, paid_amount, balance")
    .eq("id", payload.ar_id)
    .single();

  if (!ar) throw new Error("Cuenta por cobrar no encontrada");

  const new_paid    = ar.paid_amount + payload.amount;
  const new_balance = Math.max(0, ar.total - new_paid);
  const new_status  = new_balance <= 0.01 ? "paid" : "partial";

  // Registrar pago
  const { error: payErr } = await supabase
    .from("ar_payments")
    .insert({
      company_id:   companyId,
      ar_id:        payload.ar_id,
      amount:       payload.amount,
      currency:     payload.currency,
      payment_date: payload.payment_date,
      payment_form: payload.payment_form,
      reference:    payload.reference ?? null,
      notes:        payload.notes ?? null,
      created_by:   userId,
    });

  if (payErr) throw new Error(payErr.message);

  // Actualizar AR
  await supabase
    .from("accounts_receivable")
    .update({
      paid_amount: new_paid,
      balance:     new_balance,
      status:      new_status,
      updated_at:  new Date().toISOString(),
    })
    .eq("id", payload.ar_id);

  // Registrar actividad automática
  await supabase.from("ar_activities").insert({
    company_id: companyId,
    ar_id:      payload.ar_id,
    type:       "payment",
    title:      `Pago recibido: ${payload.currency} $${payload.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    description:payload.notes ?? null,
    created_by: userId,
  });
}

// ── REGISTRAR ACTIVIDAD ──────────────────────────────────────

export async function createARActivity(
  companyId: string,
  userId: string,
  payload: {
    ar_id?:           string;
    client_id?:       string;
    type:             string;
    title:            string;
    description?:     string;
    outcome?:         string;
    next_action?:     string;
    next_action_date?:string;
  }
): Promise<void> {
  const { error } = await supabase.from("ar_activities").insert({
    company_id:      companyId,
    ar_id:           payload.ar_id ?? null,
    client_id:       payload.client_id ?? null,
    type:            payload.type,
    title:           payload.title,
    description:     payload.description ?? null,
    outcome:         payload.outcome ?? null,
    next_action:     payload.next_action ?? null,
    next_action_date:payload.next_action_date ?? null,
    created_by:      userId,
  });
  if (error) throw new Error(error.message);

  // Si es promesa de pago → actualizar collection_status y promise_date
  if (payload.type === "promise" && payload.ar_id && payload.next_action_date) {
    await supabase
      .from("accounts_receivable")
      .update({ collection_status: "promised", promise_date: payload.next_action_date, updated_at: new Date().toISOString() })
      .eq("id", payload.ar_id);
  }
  if (payload.type === "call" || payload.type === "email" || payload.type === "whatsapp") {
    if (payload.ar_id) {
      await supabase
        .from("accounts_receivable")
        .update({ collection_status: "contacted", updated_at: new Date().toISOString() })
        .eq("id", payload.ar_id)
        .eq("collection_status", "not_started"); // solo si no ha avanzado más
    }
  }
  if (payload.type === "escalation" && payload.ar_id) {
    await supabase
      .from("accounts_receivable")
      .update({ collection_status: "escalated", updated_at: new Date().toISOString() })
      .eq("id", payload.ar_id);
  }
}

// ── ACTUALIZAR ESTADO ────────────────────────────────────────

export async function updateARStatus(
  id: string,
  companyId: string,
  status: string
): Promise<void> {
  await supabase
    .from("accounts_receivable")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function updateARCollectionStatus(
  id: string,
  companyId: string,
  collection_status: string
): Promise<void> {
  await supabase
    .from("accounts_receivable")
    .update({ collection_status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── CREAR AR MANUAL ──────────────────────────────────────────

export async function createManualAR(
  companyId: string,
  userId: string,
  payload: {
    client_name:    string;
    client_rfc?:    string;
    client_email?:  string;
    client_id?:     string;
    document_number?:string;
    document_date:  string;
    due_date?:      string;
    currency:       string;
    total:          number;
    notes?:         string;
  }
): Promise<void> {
  const { error } = await supabase.from("accounts_receivable").insert({
    company_id:     companyId,
    document_type:  "manual",
    client_id:      payload.client_id ?? null,
    client_name:    payload.client_name,
    client_rfc:     payload.client_rfc ?? null,
    client_email:   payload.client_email ?? null,
    document_number:payload.document_number ?? null,
    document_date:  payload.document_date,
    due_date:       payload.due_date ?? null,
    currency:       payload.currency,
    total:          payload.total,
    balance:        payload.total,
    subtotal:       payload.total / 1.16,
    tax_amount:     payload.total - payload.total / 1.16,
    notes:          payload.notes ?? null,
    status:         "pending",
    collection_status: "not_started",
    created_by:     userId,
  });
  if (error) throw new Error(error.message);
}

// ── SINCRONIZAR CFDIs EXISTENTES ─────────────────────────────

export async function syncCFDIsToAR(companyId: string): Promise<number> {
  const { data, error } = await supabase.rpc("sync_cfdis_to_ar", { p_company_id: companyId });
  if (error) throw new Error(error.message);
  return data as number;
}
