"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

type ReportPeriod = "month" | "quarter" | "year";
type ReportModule = "comercial" | "logistica" | "finanzas" | "operaciones";

type ReportData = {
  // Comercial
  prospectos_nuevos:    number;
  cotizaciones_emitidas:number;
  cotizaciones_monto:   number;
  clientes_activos:     number;
  // Logística
  embarques_total:      number;
  embarques_entregados: number;
  embarques_pendientes: number;
  ingresos_logistica:   number;
  // Finanzas
  facturado:            number;
  cobrado:              number;
  por_cobrar:           number;
  por_pagar:            number;
  // Empleados
  empleados_activos:    number;
  nomina_periodo:       number;
};

function getDateRange(period: ReportPeriod): { desde: string; hasta: string } {
  const now  = new Date();
  let desde: Date, hasta: Date;
  if (period === "month") {
    desde = new Date(now.getFullYear(), now.getMonth(), 1);
    hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === "quarter") {
    const q   = Math.floor(now.getMonth() / 3);
    desde = new Date(now.getFullYear(), q * 3, 1);
    hasta = new Date(now.getFullYear(), q * 3 + 3, 0);
  } else {
    desde = new Date(now.getFullYear(), 0, 1);
    hasta = new Date(now.getFullYear(), 11, 31);
  }
  return {
    desde: desde.toISOString().split("T")[0],
    hasta: hasta.toISOString().split("T")[0],
  };
}

const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });
const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function ReportsPage() {
  const { lang }      = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [period,  setPeriod]  = useState<ReportPeriod>("month");
  const [module,  setModule]  = useState<ReportModule>("finanzas");
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState<ReportData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { desde, hasta } = getDateRange(period);
    try {
      const [
        { data: prospectos },
        { data: cotizaciones },
        { data: clientes },
        { data: embarques },
        { data: cfdis },
        { data: cxc },
        { data: cxp },
        { data: empleados },
        { data: nomina },
      ] = await Promise.all([
        supabase.from("prospects").select("id").eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta),
        supabase.from("quotations").select("total").eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta),
        supabase.from("clients").select("id").eq("company_id", companyId).eq("is_active", true),
        supabase.from("shipments").select("status, total").eq("company_id", companyId).gte("created_at", desde).lte("created_at", hasta),
        supabase.from("cfdi_documents").select("total").eq("company_id", companyId).eq("type", "I").eq("status", "valid").gte("cfdi_date", desde).lte("cfdi_date", hasta),
        supabase.from("accounts_receivable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
        supabase.from("accounts_payable").select("balance").eq("company_id", companyId).in("status", ["pending","partial"]),
        supabase.from("employees").select("id").eq("company_id", companyId).eq("status", "active"),
        supabase.from("payroll_periods").select("total_net").eq("company_id", companyId).eq("status", "paid").gte("payment_date", desde).lte("payment_date", hasta),
      ]);

      const embarquesArr     = embarques    ?? [];
      const cotizacionesArr  = cotizaciones ?? [];

      setData({
        prospectos_nuevos:    (prospectos    ?? []).length,
        cotizaciones_emitidas:(cotizacionesArr).length,
        cotizaciones_monto:   cotizacionesArr.reduce((s, c) => s + (c.total ?? 0), 0),
        clientes_activos:     (clientes      ?? []).length,
        embarques_total:      embarquesArr.length,
        embarques_entregados: embarquesArr.filter(e => e.status === "delivered").length,
        embarques_pendientes: embarquesArr.filter(e => !["delivered","cancelled"].includes(e.status)).length,
        ingresos_logistica:   embarquesArr.filter(e => e.status === "delivered").reduce((s, e) => s + (e.total ?? 0), 0),
        facturado:            (cfdis ?? []).reduce((s, c) => s + (c.total ?? 0), 0),
        cobrado:              0,
        por_cobrar:           (cxc   ?? []).reduce((s, c) => s + (c.balance ?? 0), 0),
        por_pagar:            (cxp   ?? []).reduce((s, c) => s + (c.balance ?? 0), 0),
        empleados_activos:    (empleados ?? []).length,
        nomina_periodo:       (nomina    ?? []).reduce((s, n) => s + (n.total_net ?? 0), 0),
      });
      setLastUpdate(new Date());
    } finally { setLoading(false); }
  }, [companyId, period]);

  useEffect(() => { if (companyId) load(); }, [companyId, period]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Reporte", "Valor"],
      ["Período", period],
      ["",""],
      ["── COMERCIAL ──",""],
      ["Prospectos nuevos", data.prospectos_nuevos],
      ["Cotizaciones emitidas", data.cotizaciones_emitidas],
      ["Monto cotizaciones", data.cotizaciones_monto],
      ["Clientes activos", data.clientes_activos],
      ["",""],
      ["── LOGÍSTICA ──",""],
      ["Embarques totales", data.embarques_total],
      ["Embarques entregados", data.embarques_entregados],
      ["Embarques pendientes", data.embarques_pendientes],
      ["Ingresos logística", data.ingresos_logistica],
      ["",""],
      ["── FINANZAS ──",""],
      ["Facturado", data.facturado],
      ["Por cobrar (CXC)", data.por_cobrar],
      ["Por pagar (CXP)", data.por_pagar],
      ["",""],
      ["── RH ──",""],
      ["Empleados activos", data.empleados_activos],
      ["Nómina del período", data.nomina_periodo],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `reporte_${period}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const PERIOD_LABELS: Record<ReportPeriod, string> = {
    month:   es ? "Este mes"      : "This month",
    quarter: es ? "Este trimestre": "This quarter",
    year:    es ? "Este año"      : "This year",
  };

  const MODULES: { key: ReportModule; label: string; icon: string }[] = [
    { key: "comercial",   label: es ? "Comercial"   : "Commercial",  icon: "💼" },
    { key: "logistica",   label: es ? "Logística"   : "Logistics",   icon: "🚢" },
    { key: "finanzas",    label: es ? "Finanzas"    : "Finance",     icon: "💰" },
    { key: "operaciones", label: es ? "Operaciones" : "Operations",  icon: "⚙️" },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            📊 {es ? "Reportes" : "Reports"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es ? "Métricas ejecutivas consolidadas de todos los módulos." : "Consolidated executive metrics from all modules."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {lastUpdate && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button onClick={exportCSV} disabled={!data}
            style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            CSV
          </button>
          <button onClick={load} disabled={loading}
            style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: loading ? 0.6 : 1 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: loading ? "spin 1s linear infinite" : "none" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {loading ? (es ? "Cargando…" : "Loading…") : (es ? "Actualizar" : "Refresh")}
          </button>
        </div>
      </div>

      {/* Selector período */}
      <div style={{ display: "flex", gap: "6px" }}>
        {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: period === p ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: period === p ? "#fff" : "var(--color-text-muted)", border: period === p ? "none" : "1px solid var(--color-border-faint)", fontSize: "12px", fontWeight: period === p ? 700 : 400, cursor: "pointer" }}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPIs Globales */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          {[
            { label: es ? "Facturado"      : "Billed",         value: `$${fmt0(data.facturado)}`,           color: "var(--color-success-text)", bg: "var(--color-success-bg)", icon: "🧾" },
            { label: es ? "Por cobrar"     : "Receivable",     value: `$${fmt0(data.por_cobrar)}`,          color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", icon: "📥" },
            { label: es ? "Por pagar"      : "Payable",        value: `$${fmt0(data.por_pagar)}`,           color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  icon: "📤" },
            { label: es ? "Embarques activos":"Active shipments",value: String(data.embarques_pendientes), color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    icon: "🚢" },
          ].map(c => (
            <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
                <div style={{ width: "34px", height: "34px", borderRadius: "var(--radius-md)", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{c.icon}</div>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs módulo */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {MODULES.map(m => (
          <button key={m.key} onClick={() => setModule(m.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: module === m.key ? "var(--color-bg-base)" : "transparent", border: module === m.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: module === m.key ? "1px solid var(--color-bg-base)" : "none", color: module === m.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: module === m.key ? 700 : 400, cursor: "pointer", marginBottom: module === m.key ? "-1px" : "0" }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Contenido por módulo */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {es ? "Cargando reportes…" : "Loading reports…"}
        </div>
      ) : data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px" }}>

          {module === "comercial" && <>
            {[
              { label: es ? "Prospectos nuevos"     : "New prospects",       value: data.prospectos_nuevos,    unit: "", color: "var(--color-brand-blue)"  },
              { label: es ? "Cotizaciones emitidas" : "Quotes issued",       value: data.cotizaciones_emitidas,unit: "", color: "var(--color-success-text)" },
              { label: es ? "Monto cotizaciones"    : "Quotes amount",       value: data.cotizaciones_monto,   unit: "$",color: "var(--color-warning-text)" },
              { label: es ? "Clientes activos"      : "Active clients",      value: data.clientes_activos,     unit: "", color: "var(--color-text-primary)" },
            ].map(r => <ReportCard key={r.label} {...r} />)}
          </>}

          {module === "logistica" && <>
            {[
              { label: es ? "Embarques totales"   : "Total shipments",    value: data.embarques_total,      unit: "", color: "var(--color-brand-blue)"  },
              { label: es ? "Entregados"          : "Delivered",          value: data.embarques_entregados, unit: "", color: "var(--color-success-text)" },
              { label: es ? "En tránsito"         : "In transit",         value: data.embarques_pendientes, unit: "", color: "var(--color-warning-text)" },
              { label: es ? "Ingresos logística"  : "Logistics revenue",  value: data.ingresos_logistica,   unit: "$",color: "var(--color-success-text)" },
            ].map(r => <ReportCard key={r.label} {...r} />)}
          </>}

          {module === "finanzas" && <>
            {[
              { label: es ? "Facturado (CFDI)"  : "Billed (CFDI)",   value: data.facturado,    unit: "$", color: "var(--color-success-text)" },
              { label: es ? "Por cobrar (CXC)"  : "Receivable (AR)", value: data.por_cobrar,   unit: "$", color: "var(--color-warning-text)" },
              { label: es ? "Por pagar (CXP)"   : "Payable (AP)",    value: data.por_pagar,    unit: "$", color: "var(--color-danger-text)"  },
              { label: es ? "Nómina del período": "Period payroll",  value: data.nomina_periodo,unit: "$", color: "var(--color-brand-blue)"  },
            ].map(r => <ReportCard key={r.label} {...r} />)}
          </>}

          {module === "operaciones" && <>
            {[
              { label: es ? "Empleados activos"  : "Active employees", value: data.empleados_activos, unit: "",  color: "var(--color-brand-blue)"  },
              { label: es ? "Nómina del período" : "Period payroll",   value: data.nomina_periodo,    unit: "$", color: "var(--color-warning-text)" },
              { label: es ? "Embarques activos"  : "Active shipments", value: data.embarques_pendientes,unit:"", color: "var(--color-text-primary)" },
              { label: es ? "Clientes activos"   : "Active clients",   value: data.clientes_activos,  unit: "",  color: "var(--color-success-text)" },
            ].map(r => <ReportCard key={r.label} {...r} />)}
          </>}
        </div>
      ) : (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {es ? "Sin datos disponibles" : "No data available"}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ReportCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });
  const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {unit === "$" ? `$${fmt(value)}` : fmt0(value)}
      </div>
    </div>
  );
}
