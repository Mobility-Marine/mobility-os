"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  fetchFlujoPosicion, fetchFlujoHistorico, fetchFlujoProyeccion,
  type FlujoPosicion, type FlujoHistorico, type FlujoProyeccion,
} from "./services/flujo.service";
import FlujoPosicionView   from "./components/FlujoPosicion";
import FlujoHistoricoView  from "./components/FlujoHistorico";
import FlujoProyeccionView from "./components/FlujoProyeccion";

type Tab = "posicion" | "historico" | "proyeccion";

export default function FlujoEfectivoPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const es  = lang !== "en";
  const fl  = (t as any).flujo ?? {};

  const [tab,        setTab]        = useState<Tab>("posicion");
  const [posicion,   setPosicion]   = useState<FlujoPosicion | null>(null);
  const [historico,  setHistorico]  = useState<FlujoHistorico[]>([]);
  const [proyeccion, setProyeccion] = useState<FlujoProyeccion[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [pos, hist, proy] = await Promise.all([
        fetchFlujoPosicion(companyId),
        fetchFlujoHistorico(companyId),
        fetchFlujoProyeccion(companyId),
      ]);
      setPosicion(pos);
      setHistorico(hist);
      setProyeccion(proy);
      setLastUpdate(new Date());
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { if (companyId) load(); }, [companyId]);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "posicion",   label: fl.tabPosicion   ?? "Posición actual",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { key: "historico",  label: fl.tabHistorico  ?? "Histórico real",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { key: "proyeccion", label: fl.tabProyeccion ?? "Proyección 90d",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            💧 {fl.title ?? "Flujo de Efectivo"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {fl.subtitle ?? "Posición de liquidez actual, histórico real y proyección a 90 días."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {lastUpdate && (
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {es ? "Actualizado:" : "Updated:"} {lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <button onClick={load} disabled={loading}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: loading ? 0.6 : 1 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
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
      {tab === "posicion" && (
        <FlujoPosicionView
          posicion={posicion ?? {
            saldo_bancos: 0, saldo_por_moneda: {},
            cxc_pendiente: 0, cxp_pendiente: 0,
            flujo_neto_mes: 0, ingresos_mes: 0, egresos_mes: 0,
            saldo_30d: 0, saldo_60d: 0, saldo_90d: 0, dias_negativo: null,
          }}
          loading={loading}
        />
      )}
      {tab === "historico" && (
        <FlujoHistoricoView historico={historico} loading={loading} />
      )}
      {tab === "proyeccion" && (
        <FlujoProyeccionView
          proyeccion={proyeccion}
          saldoInicial={posicion?.saldo_bancos ?? 0}
          loading={loading}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
