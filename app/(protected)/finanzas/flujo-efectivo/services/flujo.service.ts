import { supabase } from "@/lib/supabaseClient";

export type FlujoPosicion = {
  saldo_bancos:      number;
  cxc_pendiente:     number;
  cxp_pendiente:     number;
  flujo_neto_mes:    number;
  ingresos_mes:      number;
  egresos_mes:       number;
  saldo_30d:         number;
  saldo_60d:         number;
  saldo_90d:         number;
  dias_negativo:     number | null;
};

export type FlujoHistorico = {
  periodo:   string;  // "2026-04" o "2026-W15"
  label:     string;  // "Abr 2026" o "Sem 15"
  ingresos:  number;
  egresos:   number;
  neto:      number;
};

export type FlujoProyeccion = {
  fecha:           string;   // "2026-04-20"
  entradas_cxc:    number;
  salidas_cxp:     number;
  neto_dia:        number;
  saldo_acumulado: number;
};

// ── POSICIÓN ACTUAL ───────────────────────────────────────────
export async function fetchFlujoPosicion(companyId: string): Promise<FlujoPosicion> {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const [
    { data: bancos },
    { data: cxc },
    { data: cxp },
    { data: txMes },
    { data: cxcFutura },
    { data: cxpFutura },
  ] = await Promise.all([
    supabase.from("bank_accounts").select("current_balance").eq("company_id", companyId).eq("is_active", true),
    supabase.from("accounts_receivable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
    supabase.from("accounts_payable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
    supabase.from("bank_transactions").select("type, amount").eq("company_id", companyId).gte("transaction_date", firstDay).lte("transaction_date", todayStr),
    supabase.from("accounts_receivable").select("balance, due_date").eq("company_id", companyId).in("status", ["pending","partial"]).not("due_date", "is", null),
    supabase.from("accounts_payable").select("balance, due_date").eq("company_id", companyId).in("status", ["pending","partial"]).not("due_date", "is", null),
  ]);

  const saldo_bancos   = (bancos ?? []).reduce((s, b) => s + (b.current_balance ?? 0), 0);
  const cxc_pendiente  = (cxc    ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);
  const cxp_pendiente  = (cxp    ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);
  const ingresos_mes   = (txMes  ?? []).filter(t => ["income","transfer_in"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const egresos_mes    = (txMes  ?? []).filter(t => ["expense","transfer_out"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const flujo_neto_mes = ingresos_mes - egresos_mes;

  // Proyección diaria: saldo actual + entradas CXC - salidas CXP por fecha de vencimiento
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const d30 = addDays(today, 30).toISOString().split("T")[0];
  const d60 = addDays(today, 60).toISOString().split("T")[0];
  const d90 = addDays(today, 90).toISOString().split("T")[0];

  const cxc30  = (cxcFutura ?? []).filter(r => r.due_date! <= d30).reduce((s, r) => s + r.balance, 0);
  const cxc60  = (cxcFutura ?? []).filter(r => r.due_date! <= d60).reduce((s, r) => s + r.balance, 0);
  const cxc90  = (cxcFutura ?? []).filter(r => r.due_date! <= d90).reduce((s, r) => s + r.balance, 0);
  const cxp30  = (cxpFutura ?? []).filter(r => r.due_date! <= d30).reduce((s, r) => s + r.balance, 0);
  const cxp60  = (cxpFutura ?? []).filter(r => r.due_date! <= d60).reduce((s, r) => s + r.balance, 0);
  const cxp90  = (cxpFutura ?? []).filter(r => r.due_date! <= d90).reduce((s, r) => s + r.balance, 0);

  const saldo_30d = saldo_bancos + cxc30 - cxp30;
  const saldo_60d = saldo_bancos + cxc60 - cxp60;
  const saldo_90d = saldo_bancos + cxc90 - cxp90;

  // Detectar primer día que cae negativo
  let dias_negativo: number | null = null;
  if (saldo_30d < 0) dias_negativo = 30;
  else if (saldo_60d < 0) dias_negativo = 60;
  else if (saldo_90d < 0) dias_negativo = 90;

  return {
    saldo_bancos, cxc_pendiente, cxp_pendiente,
    flujo_neto_mes, ingresos_mes, egresos_mes,
    saldo_30d, saldo_60d, saldo_90d, dias_negativo,
  };
}

// ── HISTÓRICO REAL (por mes) ──────────────────────────────────
export async function fetchFlujoHistorico(
  companyId: string, meses = 6
): Promise<FlujoHistorico[]> {
  const today = new Date();
  const desde = new Date(today.getFullYear(), today.getMonth() - (meses - 1), 1);
  const desdeStr = desde.toISOString().split("T")[0];

  const { data } = await supabase
    .from("bank_transactions")
    .select("type, amount, transaction_date")
    .eq("company_id", companyId)
    .gte("transaction_date", desdeStr)
    .order("transaction_date");

  // Agrupar por mes
  const mapa: Record<string, { ingresos: number; egresos: number }> = {};
  for (const tx of (data ?? [])) {
    const d   = new Date(tx.transaction_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!mapa[key]) mapa[key] = { ingresos: 0, egresos: 0 };
    if (["income","transfer_in"].includes(tx.type))  mapa[key].ingresos += tx.amount;
    if (["expense","transfer_out"].includes(tx.type)) mapa[key].egresos  += tx.amount;
  }

  const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Generar todos los meses del rango aunque no tengan movimientos
  const result: FlujoHistorico[] = [];
  for (let i = 0; i < meses; i++) {
    const d   = new Date(today.getFullYear(), today.getMonth() - (meses - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mov = mapa[key] ?? { ingresos: 0, egresos: 0 };
    result.push({
      periodo:  key,
      label:    `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`,
      ingresos: mov.ingresos,
      egresos:  mov.egresos,
      neto:     mov.ingresos - mov.egresos,
    });
  }
  return result;
}

// ── PROYECCIÓN 90 DÍAS ────────────────────────────────────────
export async function fetchFlujoProyeccion(companyId: string): Promise<FlujoProyeccion[]> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const d90 = new Date(today); d90.setDate(d90.getDate() + 90);
  const d90Str = d90.toISOString().split("T")[0];

  const [
    { data: bancos },
    { data: cxcItems },
    { data: cxpItems },
  ] = await Promise.all([
    supabase.from("bank_accounts").select("current_balance").eq("company_id", companyId).eq("is_active", true),
    supabase.from("accounts_receivable").select("balance, due_date").eq("company_id", companyId).in("status", ["pending","partial"]).gte("due_date", todayStr).lte("due_date", d90Str),
    supabase.from("accounts_payable").select("balance, due_date").eq("company_id", companyId).in("status", ["pending","partial"]).gte("due_date", todayStr).lte("due_date", d90Str),
  ]);

  const saldo_inicial = (bancos ?? []).reduce((s, b) => s + (b.current_balance ?? 0), 0);

  // Crear mapa de entradas/salidas por fecha
  const mapa: Record<string, { entradas: number; salidas: number }> = {};
  for (const r of (cxcItems ?? [])) {
    if (!r.due_date) continue;
    if (!mapa[r.due_date]) mapa[r.due_date] = { entradas: 0, salidas: 0 };
    mapa[r.due_date].entradas += r.balance;
  }
  for (const r of (cxpItems ?? [])) {
    if (!r.due_date) continue;
    if (!mapa[r.due_date]) mapa[r.due_date] = { entradas: 0, salidas: 0 };
    mapa[r.due_date].salidas += r.balance;
  }

  // Generar proyección semanal (cada 7 días para no saturar el gráfico)
  const result: FlujoProyeccion[] = [];
  let saldo_acumulado = saldo_inicial;

  for (let i = 0; i <= 90; i += 7) {
    const d    = new Date(today); d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split("T")[0];
    // Sumar movimientos de la semana
    let entradas = 0; let salidas = 0;
    for (let j = 0; j < 7; j++) {
      const dj    = new Date(today); dj.setDate(dj.getDate() + i + j);
      const djStr = dj.toISOString().split("T")[0];
      entradas += mapa[djStr]?.entradas ?? 0;
      salidas  += mapa[djStr]?.salidas  ?? 0;
    }
    saldo_acumulado += entradas - salidas;
    result.push({
      fecha:           dStr,
      entradas_cxc:    entradas,
      salidas_cxp:     salidas,
      neto_dia:        entradas - salidas,
      saldo_acumulado,
    });
  }
  return result;
}
