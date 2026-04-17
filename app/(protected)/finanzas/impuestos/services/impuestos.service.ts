import { supabase } from "@/lib/supabaseClient";

export type TaxRegime = "moral" | "pfae" | "resico_pm" | "resico_pf" | "other";

export type PosicionFiscal = {
  periodo:          string;
  regimen:          TaxRegime;
  // IVA
  iva_trasladado:   number;
  iva_acreditable:  number;
  iva_neto:         number;
  iva_favor:        boolean;
  // ISR
  ingresos:         number;
  deducciones:      number;
  utilidad_fiscal:  number;
  isr_causado:      number;
  isr_pagado_prev:  number;
  isr_a_pagar:      number;
  tasa_isr:         number;
  // Vencimiento
  fecha_vencimiento:string;
  // Estado de pagos
  iva_status:       "pending" | "paid" | "favor";
  isr_status:       "pending" | "paid" | "favor";
};

export type DeclaracionIVA = {
  periodo:         string;
  iva_cobrado:     number;    // IVA en CFDIs emitidos
  iva_pagado:      number;    // IVA en facturas de proveedores
  iva_neto:        number;
  favor:           boolean;
  cfdi_count:      number;
  ap_count:        number;
  por_moneda:      Record<string, { cobrado: number; pagado: number; neto: number }>;
};

export type DeclaracionISR = {
  periodo:         string;
  regimen:         TaxRegime;
  ingresos:        number;
  deducciones:     number;
  depreciacion:    number;
  utilidad_fiscal: number;
  isr_causado:     number;
  isr_pagado_prev: number;
  isr_a_pagar:     number;
  tasa_efectiva:   number;
  // Acumulado del año
  ingresos_anio:   number;
  isr_anio:        number;
};

export type TaxPayment = {
  id:           string;
  company_id:   string;
  tax_type:     string;
  period:       string;
  period_date:  string;
  amount_due:   number;
  amount_paid:  number;
  payment_date?:string | null;
  payment_ref?: string | null;
  status:       string;
  notes?:       string | null;
  created_at:   string;
};

// ── HELPERS ISR ───────────────────────────────────────────────
function calcISR(base: number, regime: TaxRegime, ingresos: number): number {
  if (base <= 0) return 0;
  if (regime === "moral") return base * 0.30;
  if (regime === "resico_pm") return ingresos * 0.01;
  if (regime === "resico_pf") {
    if      (ingresos <= 300000)  return ingresos * 0.010;
    else if (ingresos <= 600000)  return ingresos * 0.011;
    else if (ingresos <= 1000000) return ingresos * 0.013;
    else if (ingresos <= 2000000) return ingresos * 0.015;
    else if (ingresos <= 3500000) return ingresos * 0.020;
    else                          return ingresos * 0.025;
  }
  if (regime === "pfae") {
    // Tarifa Art. 96 LISR mensual
    if      (base <= 7735.00)   return base * 0.0192;
    else if (base <= 65651.07)  return 148.51   + (base - 7735.00)   * 0.0640;
    else if (base <= 115375.90) return 3855.14  + (base - 65651.07)  * 0.1088;
    else if (base <= 134003.90) return 9265.20  + (base - 115375.90) * 0.1600;
    else if (base <= 160052.90) return 12264.16 + (base - 134003.90) * 0.1792;
    else if (base <= 321507.73) return 16988.05 + (base - 160052.90) * 0.2136;
    else if (base <= 482760.03) return 51491.82 + (base - 321507.73) * 0.2352;
    else if (base <= 644013.00) return 89417.10 + (base - 482760.03) * 0.3000;
    else                        return 137746.90 + (base - 644013.00)* 0.3200;
  }
  return 0; // other
}

function calcTasaEfectiva(isr: number, base: number): number {
  return base > 0 ? (isr / base) * 100 : 0;
}

function fechaVencimiento(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const next   = new Date(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 17);
  return next.toISOString().split("T")[0];
}

// ── FETCH TAX REGIME ──────────────────────────────────────────
export async function fetchTaxRegime(companyId: string): Promise<TaxRegime> {
  const { data } = await supabase
    .from("companies").select("tax_regime").eq("id", companyId).single();
  return (data?.tax_regime ?? "moral") as TaxRegime;
}

// ── POSICIÓN FISCAL DEL MES ───────────────────────────────────
export async function fetchPosicionFiscal(
  companyId: string, period: string
): Promise<PosicionFiscal> {
  const [y, m] = period.split("-");
  const desde  = `${y}-${m}-01`;
  const hasta  = new Date(parseInt(y), parseInt(m), 0).toISOString().split("T")[0];

  const [regime, iva, isr, payments] = await Promise.all([
    fetchTaxRegime(companyId),
    fetchDeclaracionIVA(companyId, period),
    fetchDeclaracionISR(companyId, period),
    fetchTaxPayments(companyId, period),
  ]);

  const ivaPayment = payments.find(p => p.tax_type === "iva");
  const isrPayment = payments.find(p => p.tax_type === "isr");

  const ivaStatus = iva.favor ? "favor"
    : ivaPayment?.status === "paid" ? "paid" : "pending";
  const isrStatus = isr.isr_a_pagar <= 0 ? "favor"
    : isrPayment?.status === "paid" ? "paid" : "pending";

  return {
    periodo:          period,
    regimen:          regime,
    iva_trasladado:   iva.iva_cobrado,
    iva_acreditable:  iva.iva_pagado,
    iva_neto:         Math.abs(iva.iva_neto),
    iva_favor:        iva.favor,
    ingresos:         isr.ingresos,
    deducciones:      isr.deducciones,
    utilidad_fiscal:  isr.utilidad_fiscal,
    isr_causado:      isr.isr_causado,
    isr_pagado_prev:  isr.isr_pagado_prev,
    isr_a_pagar:      isr.isr_a_pagar,
    tasa_isr:         isr.tasa_efectiva,
    fecha_vencimiento:fechaVencimiento(period),
    iva_status:       ivaStatus as any,
    isr_status:       isrStatus as any,
  };
}

// ── DECLARACIÓN IVA ───────────────────────────────────────────
export async function fetchDeclaracionIVA(
  companyId: string, period: string
): Promise<DeclaracionIVA> {
  const [y, m] = period.split("-");
  const desde  = `${y}-${m}-01`;
  const hasta  = new Date(parseInt(y), parseInt(m), 0).toISOString().split("T")[0];

  const [{ data: cfdis }, { data: apItems }] = await Promise.all([
    supabase.from("cfdi_documents")
      .select("total, subtotal, currency")
      .eq("company_id", companyId).eq("type", "I").eq("status", "valid")
      .gte("cfdi_date", desde).lte("cfdi_date", hasta),
    supabase.from("accounts_payable")
      .select("total, subtotal, tax_amount, currency")
      .eq("company_id", companyId)
      .gte("document_date", desde).lte("document_date", hasta)
      .neq("status", "cancelled"),
  ]);

  // IVA cobrado = total - subtotal de CFDIs
  const por_moneda: Record<string, { cobrado: number; pagado: number; neto: number }> = {};

  let iva_cobrado = 0;
  for (const c of (cfdis ?? [])) {
    const total    = c.total    ?? 0;
    const subtotal = c.subtotal ?? 0;
    // Si subtotal es 0 o nulo, calcularlo desde total / 1.16
    const realSub  = subtotal > 0 ? subtotal : total / 1.16;
    const iva      = total - realSub;
    iva_cobrado += iva;
    const cur = c.currency ?? "MXN";
    if (!por_moneda[cur]) por_moneda[cur] = { cobrado: 0, pagado: 0, neto: 0 };
    por_moneda[cur].cobrado += iva;
  }

  let iva_pagado = 0;
  for (const a of (apItems ?? [])) {
    const iva = a.tax_amount ?? ((a.total ?? 0) - (a.subtotal ?? 0));
    iva_pagado += iva;
    const cur = a.currency ?? "MXN";
    if (!por_moneda[cur]) por_moneda[cur] = { cobrado: 0, pagado: 0, neto: 0 };
    por_moneda[cur].pagado += iva;
  }

  for (const cur of Object.keys(por_moneda)) {
    por_moneda[cur].neto = por_moneda[cur].cobrado - por_moneda[cur].pagado;
  }

  const iva_neto = iva_cobrado - iva_pagado;

  return {
    periodo:    period,
    iva_cobrado,
    iva_pagado,
    iva_neto,
    favor:      iva_neto < 0,
    cfdi_count: (cfdis ?? []).length,
    ap_count:   (apItems ?? []).length,
    por_moneda,
  };
}

// ── DECLARACIÓN ISR ───────────────────────────────────────────
export async function fetchDeclaracionISR(
  companyId: string, period: string
): Promise<DeclaracionISR> {
  const [y, m] = period.split("-");
  const desde  = `${y}-${m}-01`;
  const hasta  = new Date(parseInt(y), parseInt(m), 0).toISOString().split("T")[0];
  const desdeAnio = `${y}-01-01`;

  const [regime, { data: cfdis }, { data: cxpItems }, { data: depEntries }, { data: prevPayments }, { data: cfdisAnio }] = await Promise.all([
    fetchTaxRegime(companyId),
    supabase.from("cfdi_documents").select("total, subtotal")
      .eq("company_id", companyId).eq("type", "I").eq("status", "valid")
      .gte("cfdi_date", desde).lte("cfdi_date", hasta),
    supabase.from("accounts_payable").select("subtotal, tax_amount, total")
      .eq("company_id", companyId)
      .gte("document_date", desde).lte("document_date", hasta)
      .neq("status", "cancelled"),
    supabase.from("asset_depreciation_entries").select("depreciation_amount")
      .eq("company_id", companyId).eq("posted", true)
      .gte("period_date", desde).lte("period_date", hasta),
    supabase.from("tax_payments").select("amount_paid")
      .eq("company_id", companyId).eq("tax_type", "isr")
      .eq("status", "paid").gte("period", `${y}-01`).lt("period", period),
    supabase.from("cfdi_documents").select("total, subtotal")
      .eq("company_id", companyId).eq("type", "I").eq("status", "valid")
      .gte("cfdi_date", desdeAnio).lte("cfdi_date", hasta),
  ]);

  const ingresos     = (cfdis ?? []).reduce((s, c) => {
    const total    = c.total    ?? 0;
    const subtotal = c.subtotal ?? 0;
    return s + (subtotal > 0 ? subtotal : total / 1.16);
  }, 0);
  const gastos       = (cxpItems ?? []).reduce((s, a) => s + (a.subtotal ?? 0), 0);
  const depreciacion = (depEntries ?? []).reduce((s, d) => s + (d.depreciation_amount ?? 0), 0);
  const deducciones  = gastos + depreciacion;
  const utilidad     = Math.max(0, ingresos - deducciones);
  const isr_causado  = Math.round(calcISR(utilidad, regime, ingresos) * 100) / 100;
  const isr_pagado   = (prevPayments ?? []).reduce((s, p) => s + (p.amount_paid ?? 0), 0);
  const isr_a_pagar  = Math.max(0, isr_causado - isr_pagado);
  const tasa_efectiva = calcTasaEfectiva(isr_causado, ingresos);

  // Acumulado del año
  const ingresos_anio = (cfdisAnio ?? []).reduce((s, c) => s + (c.subtotal ?? 0), 0);
  const ingresos_anio = (cfdisAnio ?? []).reduce((s, c) => {
    const total    = c.total    ?? 0;
    const subtotal = c.subtotal ?? 0;
    return s + (subtotal > 0 ? subtotal : total / 1.16);
  }, 0);

  return {
    periodo: period, regimen: regime,
    ingresos, deducciones, depreciacion,
    utilidad_fiscal: utilidad,
    isr_causado, isr_pagado_prev: isr_pagado,
    isr_a_pagar, tasa_efectiva,
    ingresos_anio, isr_anio,
  };
}

// ── HISTORIAL DE PAGOS ────────────────────────────────────────
export async function fetchTaxPayments(
  companyId: string, period?: string
): Promise<TaxPayment[]> {
  let q = supabase.from("tax_payments").select("*")
    .eq("company_id", companyId)
    .order("period", { ascending: false });
  if (period) q = q.eq("period", period);
  const { data } = await q;
  return (data ?? []) as TaxPayment[];
}

export async function fetchTaxPaymentsYear(
  companyId: string, year: string
): Promise<TaxPayment[]> {
  const { data } = await supabase.from("tax_payments").select("*")
    .eq("company_id", companyId)
    .gte("period", `${year}-01`).lte("period", `${year}-12`)
    .order("period");
  return (data ?? []) as TaxPayment[];
}

// ── REGISTRAR PAGO ────────────────────────────────────────────
export async function registerTaxPayment(
  companyId: string, userId: string,
  payload: {
    tax_type:     string;
    period:       string;
    amount_due:   number;
    amount_paid:  number;
    payment_date: string;
    payment_ref?: string;
    notes?:       string;
  }
): Promise<void> {
  const [y, m] = payload.period.split("-");
  await supabase.from("tax_payments").upsert({
    company_id:   companyId,
    tax_type:     payload.tax_type,
    period:       payload.period,
    period_date:  `${y}-${m}-01`,
    amount_due:   payload.amount_due,
    amount_paid:  payload.amount_paid,
    payment_date: payload.payment_date,
    payment_ref:  payload.payment_ref  ?? null,
    status:       "paid",
    notes:        payload.notes        ?? null,
    created_by:   userId,
    updated_at:   new Date().toISOString(),
  }, { onConflict: "company_id,tax_type,period" });
}
