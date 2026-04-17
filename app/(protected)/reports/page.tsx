"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { usePermissions } from "@/lib/auth/usePermissions";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchReportEjecutivo, fetchReportComercial, fetchReportLogistica,
  fetchReportFinanzas, fetchReportRH, fetchReportAbastecimiento,
  getPeriodRange,
} from "./services/reports.service";
import type {
  ReportEjecutivo, ReportComercial, ReportLogistica,
  ReportFinanzas, ReportRH, ReportAbastecimiento,
} from "./types/reports.types";
import ReportsEjecutivo      from "./components/ReportsEjecutivo";
import ReportsComercial      from "./components/ReportsComercial";
import ReportsLogistica      from "./components/ReportsLogistica";
import ReportsFinanzas       from "./components/ReportsFinanzas";
import ReportsRH             from "./components/ReportsRH";
import ReportsAbastecimiento from "./components/ReportsAbastecimiento";

type TabKey = "ejecutivo" | "comercial" | "logistica" | "finanzas" | "rh" | "abastecimiento";
type Period  = "month" | "quarter" | "year" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  month:   "Este mes",
  quarter: "Este trimestre",
  year:    "Este año",
  custom:  "Personalizado",
};

// Tabs visibles por rol
const ROLE_TABS: Record<string, TabKey[]> = {
  owner:    ["ejecutivo","comercial","logistica","finanzas","rh","abastecimiento"],
  admin:    ["ejecutivo","comercial","logistica","finanzas","rh","abastecimiento"],
  manager:  ["ejecutivo","comercial","logistica","finanzas","rh","abastecimiento"],
  comercial:["ejecutivo","comercial"],
  logistica:["ejecutivo","logistica"],
  finanzas: ["ejecutivo","finanzas"],
  compras:  ["ejecutivo","abastecimiento"],
  user:     ["ejecutivo"],
  viewer:   ["ejecutivo"],
};

const ALL_TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "ejecutivo",      label: "Ejecutivo",       icon: "🎯" },
  { key: "comercial",      label: "Comercial",        icon: "💼" },
  { key: "logistica",      label: "Logística",        icon: "🚢" },
  { key: "finanzas",       label: "Finanzas",         icon: "💰" },
  { key: "rh",             label: "Recursos Humanos", icon: "👥" },
  { key: "abastecimiento", label: "Abastecimiento",   icon: "🏭" },
];

export default function ReportsPage() {
  const { lang }            = useTranslation();
  const { companyId }       = useTenant();
  const { canManageCompany} = usePermissions();
  const es = lang !== "en";

  const [role,         setRole]         = useState<string>("user");
  const [tab,          setTab]          = useState<TabKey>("ejecutivo");
  const [period,       setPeriod]       = useState<Period>("month");
  const [customDesde,  setCustomDesde]  = useState("");
  const [customHasta,  setCustomHasta]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);

  const [ejecutivo,      setEjecutivo]      = useState<ReportEjecutivo | null>(null);
  const [comercial,      setComercial]      = useState<ReportComercial | null>(null);
  const [logistica,      setLogistica]      = useState<ReportLogistica | null>(null);
  const [finanzas,       setFinanzas]       = useState<ReportFinanzas  | null>(null);
  const [rh,             setRH]             = useState<ReportRH        | null>(null);
  const [abastecimiento, setAbastecimiento] = useState<ReportAbastecimiento | null>(null);

  // Obtener rol real
  useEffect(() => {
    if (!companyId) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: cu } = await supabase.from("company_users").select("role")
        .eq("company_id", companyId).eq("user_id", data.user.id).single();
      if (cu?.role) setRole(cu.role);
    });
  }, [companyId]);

  const visibleTabs = ALL_TABS.filter(t => (ROLE_TABS[role] ?? ["ejecutivo"]).includes(t.key));

  // Si el tab actual no está permitido, ir al primero
  useEffect(() => {
    const allowed = ROLE_TABS[role] ?? ["ejecutivo"];
    if (!allowed.includes(tab)) setTab(allowed[0] as TabKey);
  }, [role]);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { desde, hasta } = getPeriodRange(period, customDesde, customHasta);
    if (!desde || !hasta) { setLoading(false); return; }

    const allowed = ROLE_TABS[role] ?? ["ejecutivo"];
    try {
      const promises: Promise<void>[] = [];

      if (allowed.includes("ejecutivo"))
        promises.push(fetchReportEjecutivo(companyId, desde, hasta).then(setEjecutivo));
      if (allowed.includes("comercial"))
        promises.push(fetchReportComercial(companyId, desde, hasta).then(setComercial));
      if (allowed.includes("logistica"))
        promises.push(fetchReportLogistica(companyId, desde, hasta).then(setLogistica));
      if (allowed.includes("finanzas"))
        promises.push(fetchReportFinanzas(companyId, desde, hasta).then(setFinanzas));
      if (allowed.includes("rh"))
        promises.push(fetchReportRH(companyId, desde, hasta).then(setRH));
      if (allowed.includes("abastecimiento"))
        promises.push(fetchReportAbastecimiento(companyId, desde, hasta).then(setAbastecimiento));

      await Promise.all(promises);
      setLastUpdate(new Date());
    } finally { setLoading(false); }
  }, [companyId, period, customDesde, customHasta, role]);

  useEffect(() => { if (companyId && role) load(); }, [companyId, period, role]);

  const INPUT_S: React.CSSProperties = {
    height: "32px", padding: "0 8px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none",
  };

  // Solo el reporte ejecutivo se muestra limitado para roles no-admin
  const esLimitado = !["owner","admin","manager"].includes(role);

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            📊 {es ? "Reportes" : "Reports"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es ? "Análisis ejecutivo por módulo con separación por moneda." : "Executive analysis per module with currency breakdown."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Selector período */}
          {(Object.keys(PERIOD_LABELS) as Period[]).filter(p => p !== "custom").map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: period === p ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: period === p ? "#fff" : "var(--color-text-muted)", border: period === p ? "none" : "1px solid var(--color-border-faint)", fontSize: "11px", fontWeight: period === p ? 700 : 400, cursor: "pointer" }}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
          {/* Fecha personalizada */}
          <button onClick={() => setPeriod("custom")}
            style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: period === "custom" ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: period === "custom" ? "#fff" : "var(--color-text-muted)", border: period === "custom" ? "none" : "1px solid var(--color-border-faint)", fontSize: "11px", fontWeight: period === "custom" ? 700 : 400, cursor: "pointer" }}>
            📅 {PERIOD_LABELS.custom}
          </button>
          {period === "custom" && (
            <>
              <input type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)} style={INPUT_S} />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>
              <input type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)} style={INPUT_S} />
              <button onClick={load} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                Aplicar
              </button>
            </>
          )}
          {lastUpdate && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button onClick={load} disabled={loading}
            style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: loading ? "var(--color-bg-subtle)" : "var(--color-brand-blue)", color: loading ? "var(--color-text-muted)" : "#fff", border: loading ? "1px solid var(--color-border)" : "none", fontSize: "11px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {loading ? "Calculando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Badge rol */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{es ? "Viendo como:" : "Viewing as:"}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)", textTransform: "capitalize" }}>
          {role}
        </span>
        <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
          · {visibleTabs.length} {es ? "módulos disponibles" : "modules available"}
        </span>
      </div>

      {/* Tabs por rol */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === t.key ? "var(--color-bg-base)" : "transparent", border: tab === t.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "ejecutivo" && (
        <ReportsEjecutivo data={ejecutivo ?? getEmptyEjecutivo()} loading={loading && !ejecutivo} limitado={esLimitado} />
      )}
      {tab === "comercial" && (
        <ReportsComercial data={comercial ?? getEmptyComercial()} loading={loading && !comercial} />
      )}
      {tab === "logistica" && (
        <ReportsLogistica data={logistica ?? getEmptyLogistica()} loading={loading && !logistica} />
      )}
      {tab === "finanzas" && (
        <ReportsFinanzas data={finanzas ?? getEmptyFinanzas()} loading={loading && !finanzas} />
      )}
      {tab === "rh" && (
        <ReportsRH data={rh ?? getEmptyRH()} loading={loading && !rh} />
      )}
      {tab === "abastecimiento" && (
        <ReportsAbastecimiento data={abastecimiento ?? getEmptyAbastecimiento()} loading={loading && !abastecimiento} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────
const emptyCurrency = () => ({ mxn: 0, usd: 0, total_mxn_equiv: 0 });
const emptyAging    = () => ({ total: 0, c0_30: 0, c31_60: 0, c61_90: 0, c90plus: 0 });

function getEmptyEjecutivo(): ReportEjecutivo {
  return { periodo: "", facturado: emptyCurrency(), cobrado: emptyCurrency(), por_cobrar: emptyCurrency(), por_pagar: emptyCurrency(), nomina_mes: 0, efectivo_bancos: emptyCurrency(), embarques_activos: 0, clientes_activos: 0, empleados_activos: 0, tendencia: [] };
}
function getEmptyComercial(): ReportComercial {
  return { prospectos_total: 0, prospectos_calificados: 0, cotizaciones_emitidas: 0, cotizaciones_ganadas: 0, pedidos_generados: 0, facturas_emitidas: 0, tasa_cotizacion: 0, tasa_cierre: 0, pipeline_valor: emptyCurrency(), cotizaciones_monto: emptyCurrency(), facturado: emptyCurrency(), por_estado: [], top_clientes: [], tendencia: [] };
}
function getEmptyLogistica(): ReportLogistica {
  return { embarques_total: 0, embarques_entregados: 0, embarques_transito: 0, embarques_cancelados: 0, tasa_entrega: 0, ingresos: emptyCurrency(), costo_total: emptyCurrency(), margen: emptyCurrency(), margen_pct: 0, top_clientes: [], por_servicio: [], tendencia: [] };
}
function getEmptyFinanzas(): ReportFinanzas {
  return { ingresos: emptyCurrency(), costo_ventas: emptyCurrency(), utilidad_bruta: emptyCurrency(), gastos_operativos: emptyCurrency(), utilidad_neta: emptyCurrency(), margen_neto_pct: 0, cxc_aging: { mxn: emptyAging(), usd: emptyAging() }, cxp_aging: { mxn: emptyAging(), usd: emptyAging() }, bancos: [], efectivo_total: emptyCurrency(), iva_posicion: 0, isr_estimado: 0, tendencia: [] };
}
function getEmptyRH(): ReportRH {
  return { headcount: 0, activos: 0, en_vacaciones: 0, bajas_ytd: 0, nomina_periodo: 0, costo_total_patron: 0, imss_patron: 0, infonavit: 0, por_departamento: [], por_contrato: [], historial: [] };
}
function getEmptyAbastecimiento(): ReportAbastecimiento {
  return { ordenes_total: 0, ordenes_abiertas: 0, ordenes_recibidas: 0, monto_oc: emptyCurrency(), proveedores_activos: 0, top_proveedores: [], por_categoria: [], items_inventario: 0, valor_inventario: 0 };
}
