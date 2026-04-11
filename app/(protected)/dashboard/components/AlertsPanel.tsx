import { DashboardMetrics } from "../hooks/useDashboard";

type Severity = "danger" | "warning" | "info" | "success";

interface Alert {
  title: string;
  detail: string;
  severity: Severity;
  action?: string;
}

const severityConfig: Record<Severity, {
  text: string; bg: string; border: string; dot: string; label: string;
}> = {
  danger:  { text: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  dot: "var(--color-danger-text)",  label: "Crítico" },
  warning: { text: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", dot: "var(--color-warning-text)", label: "Atención" },
  info:    { text: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    dot: "var(--color-info-text)",    label: "Info" },
  success: { text: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)", dot: "var(--color-success-text)", label: "OK" },
};

function deriveAlerts(metrics: DashboardMetrics): Alert[] {
  const alerts: Alert[] = [];
  if (metrics.pendingInvoices > 0) {
    alerts.push({
      title: "Cobranza pendiente",
      detail: `${metrics.pendingInvoices} factura${metrics.pendingInvoices > 1 ? "s" : ""} sin cobrar. Riesgo de flujo.`,
      severity: "danger",
      action: "Ver facturas",
    });
  }
  if (metrics.activeShipments > 5) {
    alerts.push({
      title: "Carga logística alta",
      detail: "Volumen de embarques por encima del promedio.",
      severity: "warning",
      action: "Ver embarques",
    });
  }
  if (metrics.openQuotations > 3) {
    alerts.push({
      title: "Cotizaciones abiertas",
      detail: "Requieren seguimiento para acelerar cierres.",
      severity: "info",
      action: "Ver cotizaciones",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      title: "Sistema en orden",
      detail: "Todos los módulos operan dentro de parámetros normales.",
      severity: "success",
    });
  }
  return alerts;
}

export default function AlertsPanel({ metrics }: { metrics: DashboardMetrics }) {
  const alerts = deriveAlerts(metrics);
  const criticals = alerts.filter((a) => a.severity === "danger").length;
  const warnings  = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "14px",
      height: "100%",
      alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Alertas inteligentes
        </div>
        <div style={{
          padding: "2px 8px",
          borderRadius: "var(--radius-full)",
          background: criticals > 0 ? "var(--color-danger-bg)" : "var(--color-success-bg)",
          border: `1px solid ${criticals > 0 ? "var(--color-danger-border)" : "var(--color-success-border)"}`,
          fontSize: "11px",
          fontWeight: 600,
          color: criticals > 0 ? "var(--color-danger-text)" : "var(--color-success-text)",
        }}>
          {criticals > 0 ? `${criticals} crítica${criticals > 1 ? "s" : ""}` : "Sin alertas"}
        </div>
      </div>

      {/* RESUMEN */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[
          { label: "Críticas", count: criticals, color: "var(--color-danger-text)", bg: "var(--color-danger-bg)" },
          { label: "Atención", count: warnings,  color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
          { label: "Estado",   count: criticals + warnings === 0 ? 1 : 0, color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
        ].map((item) => (
          <div key={item.label} style={{
            padding: "8px",
            borderRadius: "var(--radius-sm)",
            background: item.bg,
            textAlign: "center",
          }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: item.color, lineHeight: 1 }}>
              {item.count}
            </div>
            <div style={{ fontSize: "10px", color: item.color, marginTop: "2px", opacity: 0.8 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          return (
            <div key={i} style={{
              padding: "12px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              display: "grid",
              gap: "6px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: cfg.text }}>{alert.title}</span>
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: 600,
                  padding: "1px 6px", borderRadius: "var(--radius-full)",
                  background: cfg.text + "20", color: cfg.text,
                }}>
                  {cfg.label}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
                {alert.detail}
              </div>
              {alert.action && (
                <div style={{
                  fontSize: "11px", fontWeight: 600, color: cfg.text,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px",
                }}>
                  {alert.action}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
