import { DashboardMetrics } from "../hooks/useDashboard";

type Severity = "danger" | "warning" | "info";

interface Alert {
  title: string;
  detail: string;
  severity: Severity;
}

const severityVars: Record<Severity, { text: string; bg: string; border: string }> = {
  danger:  { text: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)" },
  warning: { text: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  info:    { text: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)" },
};

function deriveAlerts(metrics: DashboardMetrics): Alert[] {
  const alerts: Alert[] = [];
  if (metrics.pendingInvoices > 0) {
    alerts.push({
      title: "Cobranza pendiente",
      detail: `${metrics.pendingInvoices} factura${metrics.pendingInvoices > 1 ? "s" : ""} requiere atención de finanzas.`,
      severity: "danger",
    });
  }
  if (metrics.activeShipments > 5) {
    alerts.push({
      title: "Carga logística",
      detail: "Presión operativa por volumen de embarques activos.",
      severity: "warning",
    });
  }
  if (metrics.openQuotations > 3) {
    alerts.push({
      title: "Pipeline comercial",
      detail: "Cotizaciones abiertas requieren seguimiento para cierre.",
      severity: "info",
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      title: "Sin alertas activas",
      detail: "Todos los módulos operan dentro de parámetros normales.",
      severity: "info",
    });
  }
  return alerts;
}

interface AlertsPanelProps {
  metrics: DashboardMetrics;
}

export default function AlertsPanel({ metrics }: AlertsPanelProps) {
  const alerts = deriveAlerts(metrics);

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
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        Alertas inteligentes
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {alerts.map((alert, i) => {
          const v = severityVars[alert.severity];
          return (
            <div key={i} style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${v.border}`,
              background: v.bg,
              display: "grid",
              gap: "4px",
            }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: v.text }}>
                {alert.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
                {alert.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
