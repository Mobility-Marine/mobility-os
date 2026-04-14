"use client";
import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useComprasController } from "./services/compras.controller";
import ComprasKPIs      from "./components/ComprasKPIs";
import ComprasPipeline  from "./components/ComprasPipeline";
import ComprasAlertas   from "./components/ComprasAlertas";
import ComprasActividad from "./components/ComprasActividad";

export default function ComprasPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const ctrl = useComprasController(companyId ?? "");

  useEffect(() => {
    if (!companyId) return;
    ctrl.load();
  }, [companyId]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    if (!companyId) return;
    const interval = setInterval(() => ctrl.load(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [companyId]);

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            {es ? "Compras" : "Procurement"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es
              ? "Centro de mando del área de Compras & Abastecimiento."
              : "Command center for Procurement & Supply Chain."}
          </p>
        </div>
        <button onClick={ctrl.load} disabled={ctrl.loading} style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: ctrl.loading ? 0.6 : 1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: ctrl.loading ? "spin 1s linear infinite" : "none" }}>
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {ctrl.loading ? (es ? "Actualizando…" : "Refreshing…") : (es ? "Actualizar" : "Refresh")}
        </button>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* KPIs */}
      <ComprasKPIs dashboard={ctrl.dashboard} />

      {/* PIPELINE */}
      <ComprasPipeline dashboard={ctrl.dashboard} />

      {/* ALERTAS + ACTIVIDAD */}
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "16px" }}>
        <ComprasAlertas alerts={ctrl.alerts} loading={ctrl.loading} />
        <ComprasActividad activity={ctrl.activity} suppliers={ctrl.suppliers} loading={ctrl.loading} />
      </div>

    </div>
  );
}
