import { supabase } from "@/lib/supabaseClient";
import type {
  ReportEjecutivo, ReportComercial, ReportLogistica,
  ReportFinanzas, ReportRH, ReportAbastecimiento, CurrencyReport,
} from "../types/reports.types";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MXN_PER_USD = 17.5; // Tipo de cambio referencial para totales consolidados

function toCurrency(items: any[], amountField = "total", currField = "currency"): CurrencyReport {
  let mxn = 0, usd = 0;
  for (const r of items) {
    const amt = r[amountField] ?? 0;
    if ((r[currField] ?? "MXN") === "USD") usd += amt;
    else mxn += amt;
  }
  return { mxn, usd, total_mxn_equiv: mxn + usd * MXN_PER_USD };
}

function getMonthRange(monthsBack: number): { desde: string; hasta: string; label: string } {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  const desde = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  const hasta = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  return { desde, hasta, label: MESES[d.getMonth()] + " " + d.getFullYear() };
}

export function getPeriodRange(period: string, customDesde?: string, customHasta?: string) {
  const now = new Date();
  if (period === "month") {
    return {
      desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      hasta: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    };
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return {
      desde: new Date(now.getFullYear(), q * 3, 1).toISOString().split("T")[0],
      hasta: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().split("T")[0],
    };
  } else if (period === "year") {
    return {
      desde: `${now.getFullYear()}-01-01`,
      hasta: `${now.getFullYear()}-12-31`,
    };
  } else {
    return { desde: customDesde ?? "", hasta: customHasta ?? "" };
  }
}

// ── EJECUTIVO ─────────────────────────────────────────────────
export async function fetchReportEjecutivo(companyId: string, desde: string, hasta: string): Promise<ReportEjecutivo> {
  const [
    { data: cfdis },
    { data: cobros },
    { data: cxc },
    { data: cxp },
    { data: bancos },
    { data: embarques },
    { data: clientes },
    { data: empleados },
    { data: nomina },
  ] = await Promise.all([
    supabase.from("cfdi_documents").select("total, currency").eq("company_id", companyId).eq("type","I").eq("status","valid").gte("cfdi_date", desde).lte("cfdi_date", hasta),
    supabase.from("ar_payments").select("amount, currency").eq("company_id", companyId).gte("payment_date", desde).lte("payment_date", hasta),
    supabase.from("accounts_receivable").select("balance, currency").eq("company_id", companyId).in("status",["pending","partial"]),
    supabase.from("accounts_payable").select("balance, currency").eq("company_id", companyId).in("status",["pending","partial"]),
    supabase.from("bank_accounts").select("current_balance, currency, bank_name").eq("company_id", companyId).eq("is_active", true),
    supabase.from("shipments").select("status").eq("company_id", companyId).not("status","in","(cancelled,delivered)"),
    supabase.from("business_partners").select("id").eq("company_id", companyId).eq("is_customer", true).eq("is_active", true),
    supabase.from("employees").select("id").eq("company_id", companyId).eq("status","active"),
    supabase.from("payroll_periods").select("total_net").eq("company_id", companyId).eq("status","paid").gte("payment_date", desde).lte("payment_date", hasta),
  ]);

  // Tendencia 6 meses
  const tendencia = await Promise.all(
    Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i)).map(async ({ desde: d, hasta: h, label }) => {
      const [{ data: ing }, { data: egr }] = await Promise.all([
        supabase.from("cfdi_documents").select("total").eq("company_id", companyId).eq("type","I").eq("status","valid").gte("cfdi_date", d).lte("cfdi_date", h),
        supabase.from("accounts_payable").select("total").eq("company_id", companyId).gte("document_date", d).lte("document_date", h).neq("status","cancelled"),
      ]);
      return {
        mes:      label,
        ingresos: (ing ?? []).reduce((s, r) => s + (r.total ?? 0), 0),
        egresos:  (egr ?? []).reduce((s, r) => s + (r.total ?? 0), 0),
      };
    })
  );

  return {
    periodo:          `${desde} — ${hasta}`,
    facturado:        toCurrency(cfdis ?? []),
    cobrado:          toCurrency(cobros ?? [], "amount"),
    por_cobrar:       toCurrency(cxc   ?? [], "balance"),
    por_pagar:        toCurrency(cxp   ?? [], "balance"),
    nomina_mes:       (nomina ?? []).reduce((s, n) => s + (n.total_net ?? 0), 0),
    efectivo_bancos:  toCurrency(bancos ?? [], "current_balance"),
    embarques_activos:(embarques ?? []).length,
    clientes_activos: (clientes  ?? []).length,
    empleados_activos:(empleados ?? []).length,
    tendencia,
  };
}

// ── COMERCIAL ─────────────────────────────────────────────────
export async function fetchReportComercial(companyId: string, desde: string, hasta: string): Promise<ReportComercial> {
  const [
    { data: prospects },
    { data: quotes },
    { data: orders },
    { data: cfdis },
    { data: clients },
  ] = await Promise.all([
    supabase.from("prospects").select("id, status").eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta),
    supabase.from("quotations").select("id, status, total, currency, client_id").eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta),
    supabase.from("orders").select("id, total, currency").eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta),
    supabase.from("cfdi_documents").select("total, currency, receiver_name").eq("company_id", companyId).eq("type","I").eq("status","valid").gte("cfdi_date", desde).lte("cfdi_date", hasta),
    supabase.from("business_partners").select("id, name").eq("company_id", companyId).eq("is_customer", true),
  ]);

  const prospectos  = prospects  ?? [];
  const cotizaciones = quotes    ?? [];
  const ganadas     = cotizaciones.filter(q => q.status === "approved" || q.status === "accepted");
  const facturas    = cfdis      ?? [];

  // Pipeline valor (cotizaciones pendientes)
  const pending = cotizaciones.filter(q => q.status === "sent" || q.status === "draft");

  // Por estado
  const estadoMap: Record<string, { count: number; monto: number }> = {};
  for (const q of cotizaciones) {
    const s = q.status ?? "draft";
    if (!estadoMap[s]) estadoMap[s] = { count: 0, monto: 0 };
    estadoMap[s].count++;
    estadoMap[s].monto += q.total ?? 0;
  }
  const por_estado = Object.entries(estadoMap).map(([estado, v]) => ({ estado, ...v }));

  // Top clientes por facturación
  const clienteMap: Record<string, { nombre: string; monto: number; currency: string; facturas: number }> = {};
  for (const f of facturas) {
    const key = f.receiver_name ?? "—";
    if (!clienteMap[key]) clienteMap[key] = { nombre: key, monto: 0, currency: "MXN", facturas: 0 };
    clienteMap[key].monto += f.total ?? 0;
    clienteMap[key].facturas++;
  }
  const top_clientes = Object.values(clienteMap).sort((a, b) => b.monto - a.monto).slice(0, 10);

  // Tendencia 6 meses
  const tendencia = await Promise.all(
    Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i)).map(async ({ desde: d, hasta: h, label }) => {
      const { data: mq } = await supabase.from("quotations").select("total, currency").eq("company_id", companyId).gte("created_at", d).lte("created_at", h);
      const qArr = mq ?? [];
      return {
        mes: label,
        cotizaciones: qArr.length,
        monto_mxn: qArr.filter(q => (q.currency ?? "MXN") === "MXN").reduce((s, q) => s + (q.total ?? 0), 0),
        monto_usd: qArr.filter(q => q.currency === "USD").reduce((s, q) => s + (q.total ?? 0), 0),
      };
    })
  );

  const tasa_cotizacion = prospectos.length > 0 ? (cotizaciones.length / prospectos.length) * 100 : 0;
  const tasa_cierre     = cotizaciones.length > 0 ? (ganadas.length / cotizaciones.length) * 100 : 0;

  return {
    prospectos_total:       prospectos.length,
    prospectos_calificados: prospectos.filter(p => p.status !== "new").length,
    cotizaciones_emitidas:  cotizaciones.length,
    cotizaciones_ganadas:   ganadas.length,
    pedidos_generados:      (orders ?? []).length,
    facturas_emitidas:      facturas.length,
    tasa_cotizacion:        Math.round(tasa_cotizacion * 10) / 10,
    tasa_cierre:            Math.round(tasa_cierre * 10) / 10,
    pipeline_valor:         toCurrency(pending),
    cotizaciones_monto:     toCurrency(cotizaciones),
    facturado:              toCurrency(facturas),
    por_estado,
    top_clientes,
    tendencia,
  };
}

// ── LOGÍSTICA ─────────────────────────────────────────────────
export async function fetchReportLogistica(companyId: string, desde: string, hasta: string): Promise<ReportLogistica> {
  const { data: shipments } = await supabase.from("shipments")
    .select("id, status, total, currency, provider_cost, service_type, client:business_partners!client_id(name)")
    .eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta);

  const sh = shipments ?? [];
  const entregados  = sh.filter(s => s.status === "delivered");
  const transito    = sh.filter(s => !["delivered","cancelled"].includes(s.status));
  const cancelados  = sh.filter(s => s.status === "cancelled");

  const ingresos    = toCurrency(entregados);
  const costos      = toCurrency(entregados, "provider_cost");
  const margenMXN   = ingresos.mxn - costos.mxn;
  const margenUSD   = ingresos.usd - costos.usd;
  const margen: import("../types/reports.types").CurrencyReport = {
    mxn: margenMXN, usd: margenUSD,
    total_mxn_equiv: margenMXN + margenUSD * MXN_PER_USD,
  };
  const tasa_entrega = sh.length > 0 ? (entregados.length / sh.length) * 100 : 0;
  const margen_pct   = ingresos.total_mxn_equiv > 0 ? (margen.total_mxn_equiv / ingresos.total_mxn_equiv) * 100 : 0;

  // Top clientes
  const cMap: Record<string, { nombre: string; embarques: number; ingreso: number; currency: string }> = {};
  for (const s of entregados) {
    const nombre = (s.client as any)?.name ?? "—";
    if (!cMap[nombre]) cMap[nombre] = { nombre, embarques: 0, ingreso: 0, currency: s.currency ?? "MXN" };
    cMap[nombre].embarques++;
    cMap[nombre].ingreso += s.total ?? 0;
  }
  const top_clientes = Object.values(cMap).sort((a, b) => b.ingreso - a.ingreso).slice(0, 8);

  // Por servicio
  const svcMap: Record<string, { tipo: string; count: number; ingreso: number }> = {};
  for (const s of entregados) {
    const t = s.service_type ?? "general";
    if (!svcMap[t]) svcMap[t] = { tipo: t, count: 0, ingreso: 0 };
    svcMap[t].count++;
    svcMap[t].ingreso += s.total ?? 0;
  }
  const por_servicio = Object.values(svcMap).sort((a, b) => b.ingreso - a.ingreso);

  // Tendencia 6 meses
  const tendencia = await Promise.all(
    Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i)).map(async ({ desde: d, hasta: h, label }) => {
      const { data: ms } = await supabase.from("shipments").select("total, currency, status").eq("company_id", companyId).gte("created_at", d).lte("created_at", h);
      const arr = (ms ?? []).filter(s => s.status === "delivered");
      return {
        mes: label,
        embarques:    arr.length,
        ingresos_mxn: arr.filter(s => (s.currency ?? "MXN") === "MXN").reduce((s, r) => s + (r.total ?? 0), 0),
        ingresos_usd: arr.filter(s => s.currency === "USD").reduce((s, r) => s + (r.total ?? 0), 0),
      };
    })
  );

  return {
    embarques_total:      sh.length,
    embarques_entregados: entregados.length,
    embarques_transito:   transito.length,
    embarques_cancelados: cancelados.length,
    tasa_entrega:         Math.round(tasa_entrega * 10) / 10,
    ingresos, costo_total: costos, margen,
    margen_pct:           Math.round(margen_pct * 10) / 10,
    top_clientes, por_servicio, tendencia,
  };
}

// ── FINANZAS ──────────────────────────────────────────────────
export async function fetchReportFinanzas(companyId: string, desde: string, hasta: string): Promise<ReportFinanzas> {
  const now = new Date();

  const [
    { data: cfdis },
    { data: cxpLog },
    { data: cxpOpe },
    { data: cxcAll },
    { data: cxpAll },
    { data: bancos },
    { data: ivaData },
  ] = await Promise.all([
    supabase.from("cfdi_documents").select("total, subtotal, currency").eq("company_id", companyId).eq("type","I").eq("status","valid").gte("cfdi_date", desde).lte("cfdi_date", hasta),
    supabase.from("accounts_payable").select("total, subtotal, currency").eq("company_id", companyId).in("supplier_type",["logistics","procurement"]).gte("document_date", desde).lte("document_date", hasta).neq("status","cancelled"),
    supabase.from("accounts_payable").select("total, subtotal, currency").eq("company_id", companyId).eq("supplier_type","operating").gte("document_date", desde).lte("document_date", hasta).neq("status","cancelled"),
    supabase.from("accounts_receivable").select("balance, currency, due_date").eq("company_id", companyId).in("status",["pending","partial"]),
    supabase.from("accounts_payable").select("balance, currency, due_date").eq("company_id", companyId).in("status",["pending","partial"]),
    supabase.from("bank_accounts").select("bank_name, name, currency, current_balance").eq("company_id", companyId).eq("is_active", true),
    supabase.from("accounts_payable").select("tax_amount, total, subtotal").eq("company_id", companyId).gte("document_date", desde).lte("document_date", hasta).neq("status","cancelled"),
  ]);

  // P&L
  const ingresos     = toCurrency(cfdis  ?? []);
  const costo_ventas = toCurrency([...(cxpLog ?? [])]);
  const gastos_op    = toCurrency(cxpOpe ?? []);
  const utilidad_bruta: import("../types/reports.types").CurrencyReport = {
    mxn: ingresos.mxn - costo_ventas.mxn,
    usd: ingresos.usd - costo_ventas.usd,
    total_mxn_equiv: ingresos.total_mxn_equiv - costo_ventas.total_mxn_equiv,
  };
  const utilidad_neta: import("../types/reports.types").CurrencyReport = {
    mxn: utilidad_bruta.mxn - gastos_op.mxn,
    usd: utilidad_bruta.usd - gastos_op.usd,
    total_mxn_equiv: utilidad_bruta.total_mxn_equiv - gastos_op.total_mxn_equiv,
  };
  const margen_neto_pct = ingresos.total_mxn_equiv > 0
    ? (utilidad_neta.total_mxn_equiv / ingresos.total_mxn_equiv) * 100 : 0;

  // Aging CXC por moneda
  function calcAging(items: any[]) {
    const result = { total: 0, c0_30: 0, c31_60: 0, c61_90: 0, c90plus: 0 };
    for (const r of items) {
      const bal  = r.balance ?? 0;
      const days = r.due_date
        ? Math.floor((now.getTime() - new Date(r.due_date).getTime()) / 86400000)
        : 0;
      result.total += bal;
      if (days <= 0)       result.c0_30   += bal;
      else if (days <= 30) result.c0_30   += bal;
      else if (days <= 60) result.c31_60  += bal;
      else if (days <= 90) result.c61_90  += bal;
      else                 result.c90plus += bal;
    }
    return result;
  }

  const cxcMXN = (cxcAll ?? []).filter(r => (r.currency ?? "MXN") === "MXN");
  const cxcUSD = (cxcAll ?? []).filter(r => r.currency === "USD");
  const cxpMXN = (cxpAll ?? []).filter(r => (r.currency ?? "MXN") === "MXN");
  const cxpUSD = (cxpAll ?? []).filter(r => r.currency === "USD");

  // IVA posición
  const ivaCobrado    = (cfdis ?? []).reduce((s, c) => s + ((c.total ?? 0) - (c.subtotal > 0 ? c.subtotal : (c.total ?? 0) / 1.16)), 0);
  const ivaAcreditable= (ivaData ?? []).reduce((s, a) => s + ((a.tax_amount ?? 0) || ((a.total ?? 0) - (a.subtotal ?? 0))), 0);
  const iva_posicion  = ivaCobrado - ivaAcreditable;
  const isr_estimado  = Math.max(0, utilidad_neta.total_mxn_equiv * 0.30);

  // Tendencia P&L 6 meses
  const tendencia = await Promise.all(
    Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i)).map(async ({ desde: d, hasta: h, label }) => {
      const [{ data: ing }, { data: egr }] = await Promise.all([
        supabase.from("cfdi_documents").select("total").eq("company_id", companyId).eq("type","I").eq("status","valid").gte("cfdi_date", d).lte("cfdi_date", h),
        supabase.from("accounts_payable").select("total").eq("company_id", companyId).gte("document_date", d).lte("document_date", h).neq("status","cancelled"),
      ]);
      const ingTotal = (ing ?? []).reduce((s, r) => s + (r.total ?? 0), 0);
      const egrTotal = (egr ?? []).reduce((s, r) => s + (r.total ?? 0), 0);
      return { mes: label, ingresos: ingTotal, costos: egrTotal, utilidad: ingTotal - egrTotal, currency: "MXN" };
    })
  );

  // Bancos
  const bancosArr = (bancos ?? []).map(b => ({
    nombre: b.name, banco: b.bank_name, currency: b.currency, saldo: b.current_balance ?? 0,
  }));

  return {
    ingresos, costo_ventas, utilidad_bruta, gastos_operativos: gastos_op,
    utilidad_neta, margen_neto_pct: Math.round(margen_neto_pct * 10) / 10,
    cxc_aging: { mxn: calcAging(cxcMXN), usd: calcAging(cxcUSD) },
    cxp_aging: { mxn: calcAging(cxpMXN), usd: calcAging(cxpUSD) },
    bancos: bancosArr,
    efectivo_total: toCurrency(bancos ?? [], "current_balance"),
    iva_posicion:   Math.round(iva_posicion * 100) / 100,
    isr_estimado:   Math.round(isr_estimado * 100) / 100,
    tendencia,
  };
}

// ── RH ────────────────────────────────────────────────────────
export async function fetchReportRH(companyId: string, desde: string, hasta: string): Promise<ReportRH> {
  const [{ data: employees }, { data: nominas }] = await Promise.all([
    supabase.from("employees").select("id, status, department, contract_type, integrated_salary").eq("company_id", companyId),
    supabase.from("payroll_periods").select("period_number, year, total_net, total_perceptions, total_deductions, payment_date").eq("company_id", companyId).eq("status","paid").order("year").order("period_number"),
  ]);

  const emps    = employees ?? [];
  const activos = emps.filter(e => e.status === "active");
  const IMSS_RATES = 0.0315 + 0.0200 + 0.0105 + 0.0070 + 0.0175 + 0.0100; // cuotas patrón
  const INFONAVIT_RATE = 0.05;

  // Por departamento
  const deptMap: Record<string, { dept: string; count: number; costo: number }> = {};
  for (const e of activos) {
    const d = e.department ?? "Sin departamento";
    if (!deptMap[d]) deptMap[d] = { dept: d, count: 0, costo: 0 };
    deptMap[d].count++;
    const sbc = e.integrated_salary ?? 0;
    deptMap[d].costo += sbc * (IMSS_RATES + INFONAVIT_RATE) * 30;
  }
  const por_departamento = Object.values(deptMap).sort((a, b) => b.count - a.count);

  // Por contrato
  const contratoMap: Record<string, number> = {};
  for (const e of activos) { const c = e.contract_type ?? "other"; contratoMap[c] = (contratoMap[c] ?? 0) + 1; }
  const por_contrato = Object.entries(contratoMap).map(([tipo, count]) => ({ tipo, count }));

  // Costo patronal
  const nominaReciente = nominas?.slice(-1)[0];
  const imss_patron    = activos.reduce((s, e) => s + (e.integrated_salary ?? 0) * IMSS_RATES * 30, 0);
  const infonavit      = activos.reduce((s, e) => s + (e.integrated_salary ?? 0) * INFONAVIT_RATE * 30, 0);

  // Historial nóminas
  const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const historial = (nominas ?? []).slice(-12).map(n => ({
    periodo:      `P${n.period_number}/${n.year}`,
    neto:         n.total_net         ?? 0,
    percepciones: n.total_perceptions ?? 0,
    deducciones:  n.total_deductions  ?? 0,
  }));

  return {
    headcount:          emps.length,
    activos:            activos.length,
    en_vacaciones:      emps.filter(e => e.status === "vacation").length,
    bajas_ytd:          emps.filter(e => e.status === "terminated").length,
    nomina_periodo:     nominaReciente?.total_net ?? 0,
    costo_total_patron: (nominaReciente?.total_net ?? 0) + imss_patron + infonavit,
    imss_patron:        Math.round(imss_patron),
    infonavit:          Math.round(infonavit),
    por_departamento, por_contrato, historial,
  };
}

// ── ABASTECIMIENTO ────────────────────────────────────────────
export async function fetchReportAbastecimiento(companyId: string, desde: string, hasta: string): Promise<ReportAbastecimiento> {
  const [{ data: orders }, { data: suppliers }, { data: inventory }] = await Promise.all([
    supabase.from("purchase_orders").select("id, status, total, currency, supplier:business_partners!supplier_id(name)").eq("company_id", companyId).neq("status","cancelled").gte("order_date", desde).lte("order_date", hasta),
    supabase.from("business_partners").select("id").eq("company_id", companyId).eq("is_supplier", true).eq("is_active", true),
    supabase.from("inventory_items").select("id, unit_cost, quantity").eq("company_id", companyId),
  ]);

  const ords = orders ?? [];
  const abiertas  = ords.filter(o => !["received","cancelled"].includes(o.status));
  const recibidas = ords.filter(o => o.status === "received");

  // Top proveedores
  const provMap: Record<string, { nombre: string; monto: number; ordenes: number; currency: string }> = {};
  for (const o of ords) {
    const nombre = (o.supplier as any)?.name ?? "—";
    if (!provMap[nombre]) provMap[nombre] = { nombre, monto: 0, ordenes: 0, currency: o.currency ?? "MXN" };
    provMap[nombre].monto += o.total ?? 0;
    provMap[nombre].ordenes++;
  }
  const top_proveedores = Object.values(provMap).sort((a, b) => b.monto - a.monto).slice(0, 8);

  const inv = inventory ?? [];
  const valor_inventario = inv.reduce((s, i) => s + (i.unit_cost ?? 0) * (i.quantity ?? 0), 0);

  return {
    ordenes_total:       ords.length,
    ordenes_abiertas:    abiertas.length,
    ordenes_recibidas:   recibidas.length,
    monto_oc:            toCurrency(ords),
    proveedores_activos: (suppliers ?? []).length,
    top_proveedores,
    por_categoria:       [],
    items_inventario:    inv.length,
    valor_inventario:    Math.round(valor_inventario),
  };
}
