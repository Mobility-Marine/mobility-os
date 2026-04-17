import { supabase } from "@/lib/supabaseClient";

// ── TIPOS ─────────────────────────────────────────────────────
export type EstadoResultados = {
  ingresos_facturados:  number;
  ingresos_cobrados:    number;
  costo_ventas:         number;
  utilidad_bruta:       number;
  margen_bruto_pct:     number;
  gastos_operativos:    number;
  utilidad_operativa:   number;
  isr_estimado:         number;
  utilidad_neta:        number;
  margen_neto_pct:      number;
  por_moneda:           Record<string, { ingresos: number; costo: number; gastos: number }>;
};

export type BalanceGeneral = {
  // Activos
  efectivo_bancos:      number;
  cxc_pendiente:        number;
  activos_fijos_netos:  number;
  total_activo:         number;
  // Pasivos
  cxp_pendiente:        number;
  total_pasivo:         number;
  // Capital
  capital_contable:     number;
};

export type AsientoContable = {
  id:        string;
  fecha:     string;
  concepto:  string;
  tipo:      "ingreso" | "egreso" | "cobro" | "pago" | "ajuste";
  cargo:     number;
  abono:     number;
  moneda:    string;
  referencia?: string;
  origen:    "cfdi" | "ar_payment" | "ap_payment" | "bank" | "manual";
};

export type IndicadoresFinancieros = {
  liquidez:         number;  // activo circulante / pasivo corto plazo
  endeudamiento:    number;  // pasivo total / activo total
  margen_bruto:     number;
  margen_neto:      number;
  dso:              number;  // días promedio de cobro
  dpo:              number;  // días promedio de pago
  ciclo_efectivo:   number;  // DSO - DPO
};

// ── ESTADO DE RESULTADOS ──────────────────────────────────────
export async function fetchEstadoResultados(
  companyId: string, desde: string, hasta: string
): Promise<EstadoResultados> {

  const [
    { data: cfdis },
    { data: cobros },
    { data: cxpLog },
    { data: cxpPro },
    { data: cxpOpe },
  ] = await Promise.all([
    // Ingresos — CFDIs timbrados del período
    supabase.from("cfdi_documents").select("total, currency")
      .eq("company_id", companyId).eq("type", "I").eq("status", "valid")
      .gte("cfdi_date", desde).lte("cfdi_date", hasta),
    // Cobros reales del período
    supabase.from("ar_payments").select("amount, currency")
      .eq("company_id", companyId).gte("payment_date", desde).lte("payment_date", hasta),
    // Costo ventas — facturas de logística pagadas
    supabase.from("accounts_payable").select("total, currency, exchange_rate")
      .eq("company_id", companyId).eq("supplier_type", "logistics")
      .gte("document_date", desde).lte("document_date", hasta).neq("status", "cancelled"),
    // Costo ventas — facturas de abastecimiento
    supabase.from("accounts_payable").select("total, currency, exchange_rate")
      .eq("company_id", companyId).eq("supplier_type", "procurement")
      .gte("document_date", desde).lte("document_date", hasta).neq("status", "cancelled"),
    // Gastos operativos
    supabase.from("accounts_payable").select("total, currency, exchange_rate")
      .eq("company_id", companyId).eq("supplier_type", "operating")
      .gte("document_date", desde).lte("document_date", hasta).neq("status", "cancelled"),
  ]);

  // Normalizar a MXN principal (simplificado — sumamos en moneda original)
  const sum = (items: any[]) => (items ?? []).reduce((s, r) => s + (r.total ?? r.amount ?? 0), 0);

  const ingresos_facturados = sum(cfdis);
  const ingresos_cobrados   = sum(cobros);
  // Sumar depreciación posteada del período como gasto operativo
  const { data: depEntries } = await supabase
    .from("asset_depreciation_entries")
    .select("depreciation_amount")
    .eq("company_id", companyId)
    .eq("posted", true)
    .gte("period_date", desde)
    .lte("period_date", hasta);
  const depreciacion_periodo = (depEntries ?? []).reduce((s, r) => s + (r.depreciation_amount ?? 0), 0);

  const costo_ventas        = sum(cxpLog) + sum(cxpPro);
  const gastos_operativos   = sum(cxpOpe) + depreciacion_periodo;
  const utilidad_bruta      = ingresos_facturados - costo_ventas;
  const utilidad_operativa  = utilidad_bruta - gastos_operativos;
  // ISR según régimen fiscal de la empresa
  const { data: companyData } = await supabase
    .from("companies").select("tax_regime").eq("id", companyId).single();
  const taxRegime = companyData?.tax_regime ?? "moral";

  let isr_estimado = 0;
  if (taxRegime === "moral") {
    // 30% sobre utilidad
    isr_estimado = Math.max(0, utilidad_operativa * 0.30);
  } else if (taxRegime === "pfae") {
    // Tarifa progresiva simplificada mensual (Art. 96 LISR)
    const base = Math.max(0, utilidad_operativa);
    if      (base <= 7735.00)   isr_estimado = base * 0.0192;
    else if (base <= 65651.07)  isr_estimado = 148.51  + (base - 7735.00)  * 0.0640;
    else if (base <= 115375.90) isr_estimado = 3855.14 + (base - 65651.07) * 0.1088;
    else if (base <= 134003.90) isr_estimado = 9265.20 + (base - 115375.90)* 0.1600;
    else if (base <= 160052.90) isr_estimado = 12264.16+ (base - 134003.90)* 0.1792;
    else if (base <= 321507.73) isr_estimado = 16988.05+ (base - 160052.90)* 0.2136;
    else if (base <= 482760.03) isr_estimado = 51491.82+ (base - 321507.73)* 0.2352;
    else if (base <= 644013.00) isr_estimado = 89417.10+ (base - 482760.03)* 0.3000;
    else                        isr_estimado = 137746.90+ (base - 644013.00)* 0.3200;
  } else if (taxRegime === "resico_pm") {
    // RESICO PM: tasa sobre ingresos directamente
    isr_estimado = Math.max(0, ingresos_facturados * 0.01);
  } else if (taxRegime === "resico_pf") {
    // RESICO PF: tasa sobre ingresos
    const base = Math.max(0, ingresos_facturados);
    if      (base <= 300000)   isr_estimado = base * 0.010;
    else if (base <= 600000)   isr_estimado = base * 0.011;
    else if (base <= 1000000)  isr_estimado = base * 0.013;
    else if (base <= 2000000)  isr_estimado = base * 0.015;
    else if (base <= 3500000)  isr_estimado = base * 0.020;
    else                       isr_estimado = base * 0.025;
  } else {
    // other: 0, el usuario lo configura manualmente en Impuestos
    isr_estimado = 0;
  }
  const utilidad_neta       = utilidad_operativa - isr_estimado;
  const margen_bruto_pct    = ingresos_facturados > 0 ? (utilidad_bruta / ingresos_facturados) * 100 : 0;
  const margen_neto_pct     = ingresos_facturados > 0 ? (utilidad_neta  / ingresos_facturados) * 100 : 0;

  // Desglose por moneda
  const por_moneda: Record<string, { ingresos: number; costo: number; gastos: number }> = {};
  for (const r of (cfdis ?? [])) {
    const c = r.currency ?? "MXN";
    if (!por_moneda[c]) por_moneda[c] = { ingresos: 0, costo: 0, gastos: 0 };
    por_moneda[c].ingresos += r.total ?? 0;
  }
  for (const r of [...(cxpLog ?? []), ...(cxpPro ?? [])]) {
    const c = r.currency ?? "MXN";
    if (!por_moneda[c]) por_moneda[c] = { ingresos: 0, costo: 0, gastos: 0 };
    por_moneda[c].costo += r.total ?? 0;
  }
  for (const r of (cxpOpe ?? [])) {
    const c = r.currency ?? "MXN";
    if (!por_moneda[c]) por_moneda[c] = { ingresos: 0, costo: 0, gastos: 0 };
    por_moneda[c].gastos += r.total ?? 0;
  }

  return {
    ingresos_facturados, ingresos_cobrados, costo_ventas,
    utilidad_bruta, margen_bruto_pct, gastos_operativos,
    utilidad_operativa, isr_estimado, utilidad_neta, margen_neto_pct,
    por_moneda,
  };
}

// ── BALANCE GENERAL ───────────────────────────────────────────
export async function fetchBalanceGeneral(companyId: string): Promise<BalanceGeneral> {
  const [{ data: bancos }, { data: cxc }, { data: cxp }] = await Promise.all([
    supabase.from("bank_accounts").select("current_balance").eq("company_id", companyId).eq("is_active", true),
    supabase.from("accounts_receivable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
    supabase.from("accounts_payable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
  ]);

  // Activos fijos netos
  const { data: activos } = await supabase
    .from("fixed_assets")
    .select("book_value")
    .eq("company_id", companyId)
    .neq("status", "disposed");
  const activos_fijos_netos = (activos ?? []).reduce((s, a) => s + (a.book_value ?? 0), 0);

  const efectivo_bancos = (bancos ?? []).reduce((s, b) => s + (b.current_balance ?? 0), 0);
  const cxc_pendiente   = (cxc    ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);
  const cxp_pendiente   = (cxp    ?? []).reduce((s, r) => s + (r.balance ?? 0), 0);
  const total_activo    = efectivo_bancos + cxc_pendiente + activos_fijos_netos;
  const total_pasivo    = cxp_pendiente;
  const capital_contable = total_activo - total_pasivo;

  return { efectivo_bancos, cxc_pendiente, activos_fijos_netos, total_activo, cxp_pendiente, total_pasivo, capital_contable };
}

// ── LIBRO DIARIO ──────────────────────────────────────────────
export async function fetchLibroDiario(
  companyId: string, desde: string, hasta: string
): Promise<AsientoContable[]> {
  const [
    { data: cfdis },
    { data: cobros },
    { data: pagos },
    { data: txBancos },
  ] = await Promise.all([
    supabase.from("cfdi_documents").select("id, cfdi_date, total, currency, folio_fiscal, client_name")
      .eq("company_id", companyId).eq("type", "I").eq("status", "valid")
      .gte("cfdi_date", desde).lte("cfdi_date", hasta).order("cfdi_date"),
    supabase.from("ar_payments").select("id, payment_date, amount, currency, reference, ar_id")
      .eq("company_id", companyId).gte("payment_date", desde).lte("payment_date", hasta).order("payment_date"),
    supabase.from("ap_payments").select("id, payment_date, amount, currency, reference, ap_id")
      .eq("company_id", companyId).gte("payment_date", desde).lte("payment_date", hasta).order("payment_date"),
    supabase.from("bank_transactions").select("id, transaction_date, amount, currency, concept, type, reference")
      .eq("company_id", companyId).eq("is_manual", true)
      .gte("transaction_date", desde).lte("transaction_date", hasta).order("transaction_date"),
  ]);

  const asientos: AsientoContable[] = [];

  for (const c of (cfdis ?? [])) {
    asientos.push({
      id: c.id, fecha: c.cfdi_date,
      concepto: `Factura — ${c.client_name ?? ""}`,
      tipo: "ingreso", cargo: c.total, abono: 0,
      moneda: c.currency ?? "MXN",
      referencia: c.folio_fiscal?.substring(0, 8), origen: "cfdi",
    });
  }
  for (const p of (cobros ?? [])) {
    asientos.push({
      id: p.id, fecha: p.payment_date,
      concepto: "Cobro a cliente",
      tipo: "cobro", cargo: 0, abono: p.amount,
      moneda: p.currency ?? "MXN",
      referencia: p.reference, origen: "ar_payment",
    });
  }
  for (const p of (pagos ?? [])) {
    asientos.push({
      id: p.id, fecha: p.payment_date,
      concepto: "Pago a proveedor",
      tipo: "pago", cargo: p.amount, abono: 0,
      moneda: p.currency ?? "MXN",
      referencia: p.reference, origen: "ap_payment",
    });
  }
  for (const t of (txBancos ?? [])) {
    const esIngreso = ["income","transfer_in"].includes(t.type);
    asientos.push({
      id: t.id, fecha: t.transaction_date,
      concepto: t.concept,
      tipo: "ajuste", cargo: esIngreso ? 0 : t.amount, abono: esIngreso ? t.amount : 0,
      moneda: t.currency ?? "MXN",
      referencia: t.reference, origen: "bank",
    });
  }

  return asientos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ── INDICADORES ───────────────────────────────────────────────
export async function fetchIndicadores(
  companyId: string, desde: string, hasta: string
): Promise<IndicadoresFinancieros> {
  const [balance, er] = await Promise.all([
    fetchBalanceGeneral(companyId),
    fetchEstadoResultados(companyId, desde, hasta),
  ]);

  const liquidez      = balance.total_pasivo > 0 ? balance.total_activo / balance.total_pasivo : 999;
  const endeudamiento = balance.total_activo  > 0 ? balance.total_pasivo / balance.total_activo : 0;

  // DSO y DPO basados en el período
  const dias = Math.max(1, Math.floor((new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000));
  const dso  = er.ingresos_facturados > 0 ? (balance.cxc_pendiente / er.ingresos_facturados) * dias : 0;
  const dpo  = er.costo_ventas        > 0 ? (balance.cxp_pendiente / er.costo_ventas)        * dias : 0;

  return {
    liquidez:       Math.round(liquidez * 100) / 100,
    endeudamiento:  Math.round(endeudamiento * 100) / 100,
    margen_bruto:   Math.round(er.margen_bruto_pct * 10) / 10,
    margen_neto:    Math.round(er.margen_neto_pct  * 10) / 10,
    dso:            Math.round(dso),
    dpo:            Math.round(dpo),
    ciclo_efectivo: Math.round(dso - dpo),
  };
}
