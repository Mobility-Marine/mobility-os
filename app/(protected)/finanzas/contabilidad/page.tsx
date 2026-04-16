"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  fetchEstadoResultados, fetchBalanceGeneral,
  fetchLibroDiario, fetchIndicadores,
  type EstadoResultados, type BalanceGeneral,
  type AsientoContable, type IndicadoresFinancieros,
} from "./services/contabilidad.service";
import ContabilidadEstadoResultados from "./components/ContabilidadEstadoResultados";
import ContabilidadBalance           from "./components/ContabilidadBalance";
import ContabilidadLibroDiario       from "./components/ContabilidadLibroDiario";
import ContabilidadIndicadores       from "./components/ContabilidadIndicadores";

type Tab = "estado" | "balance" | "diario" | "indicadores";

function getDefaultPeriod() {
  const hoy   = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0];
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split("T")[0];
  return { desde, hasta };
}

export default function ContabilidadPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const co  = (t as any).contabilidad ?? {};

  const { desde: d0, hasta: h0 } = getDefaultPeriod();
  const [tab,          setTab]          = useState<Tab>("estado");
  const [desde,        setDesde]        = useState(d0);
  const [hasta,        setHasta]        = useState(h0);
  const [loading,      setLoading]      = useState(false);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);

  const [estadoResultados, setEstadoResultados] = useState<EstadoResultados | null>(null);
  const [balance,          setBalance]          = useState<BalanceGeneral   | null>(null);
  const [asientos,         setAsientos]         = useState<AsientoContable[]>([]);
  const [indicadores,      setIndicadores]      = useState<IndicadoresFinancieros | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [er, bal, lib, ind] = await Promise.all([
        fetchEstadoResultados(companyId, desde, hasta),
        fetchBalanceGeneral(companyId),
        fetchLibroDiario(companyId, desde, hasta),
        fetchIndicadores(companyId, desde, hasta),
      ]);
      setEstadoResultados(er);
      setBalance(bal);
      setAsientos(lib);
      setIndicadores(ind);
      setLastUpdate(new Date());
    } finally { setLoading(false); }
  }, [companyId, desde, hasta]);

  useEffect(() => { if (companyId) load(); }, [companyId, desde, hasta]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "estado",      label: co.tabEstadoResultados ?? "Estado de Resultados",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { key: "balance",     label: co.tabBalance          ?? "Balance General",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 9l9-7 9 7"/><path d="M3 15l9 7 9-7"/></svg> },
    { key: "diario",      label: co.tabLibroDiario      ?? "Libro Diario",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { key: "indicadores", label: co.tabIndicadores      ?? "Indicadores",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
  ];

  const INPUT_S: React.CSSProperties = {
    height: "32px", padding: "0 8px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            📒 {co.title ?? "Contabilidad"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {co.subtitle ?? "Estado de resultados, balance general, libro diario e indicadores."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Selector de período */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{co.periodo ?? "Período"}:</span>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={INPUT_S} />
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={INPUT_S} />
          </div>
          {/* Períodos rápidos */}
          {[
            { label: es ? "Este mes"  : "This month",  action: () => { const { desde: d, hasta: h } = getDefaultPeriod(); setDesde(d); setHasta(h); } },
            { label: es ? "Este año"  : "This year",   action: () => { const y = new Date().getFullYear(); setDesde(`${y}-01-01`); setHasta(`${y}-12-31`); } },
          ].map(p => (
            <button key={p.label} onClick={p.action}
              style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              {p.label}
            </button>
          ))}
          {lastUpdate && (
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
              {lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={load} disabled={loading}
            style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {loading ? (es ? "Calculando…" : "Calculating…") : (es ? "Actualizar" : "Refresh")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === tb.key ? "var(--color-bg-base)" : "transparent", border: tab === tb.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === tb.key ? "1px solid var(--color-bg-base)" : "none", color: tab === tb.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer", marginBottom: tab === tb.key ? "-1px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
            {tb.icon}{tb.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "estado" && (
        <ContabilidadEstadoResultados
          data={estadoResultados ?? { ingresos_facturados: 0, ingresos_cobrados: 0, costo_ventas: 0, utilidad_bruta: 0, margen_bruto_pct: 0, gastos_operativos: 0, utilidad_operativa: 0, isr_estimado: 0, utilidad_neta: 0, margen_neto_pct: 0, por_moneda: {} }}
          loading={loading} desde={desde} hasta={hasta}
        />
      )}
      {tab === "balance" && (
        <ContabilidadBalance
          data={balance ?? { efectivo_bancos: 0, cxc_pendiente: 0, total_activo: 0, cxp_pendiente: 0, total_pasivo: 0, capital_contable: 0 }}
          loading={loading}
        />
      )}
      {tab === "diario" && (
        <ContabilidadLibroDiario asientos={asientos} loading={loading} />
      )}
      {tab === "indicadores" && (
        <ContabilidadIndicadores
          data={indicadores ?? { liquidez: 0, endeudamiento: 0, margen_bruto: 0, margen_neto: 0, dso: 0, dpo: 0, ciclo_efectivo: 0 }}
          loading={loading}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
