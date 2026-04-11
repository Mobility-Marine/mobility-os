import { DashboardMetrics } from "../hooks/useDashboard";

interface PipelineFunnelProps {
  metrics: DashboardMetrics;
}

export default function PipelineFunnel({ metrics }: PipelineFunnelProps) {
  const stages = [
    { label: "Prospectos",   value: metrics.activeProspects,  color: "var(--color-brand-blue)" },
    { label: "Cotizaciones", value: metrics.openQuotations,   color: "var(--color-info-text)" },
    { label: "Embarques",    value: metrics.activeShipments,  color: "var(--color-warning-text)" },
    { label: "Facturas",     value: metrics.pendingInvoices,  color: "var(--color-success-text)" },
  ];

  const maxVal = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "14px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        Pipeline comercial
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {stages.map((stage, i) => {
          const pct = Math.max((stage.value / maxVal) * 100, 4);
          const widthPct = 100 - i * 12;
          return (
            <div key={stage.label}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {stage.label}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: stage.color }}>
                  {stage.value}
                </span>
              </div>
              <div style={{
                width: `${widthPct}%`,
                height: "28px",
                background: "var(--color-bg-subtle)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                margin: "0 auto 0 0",
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: stage.color,
                  opacity: 0.7,
                  borderRadius: "var(--radius-sm)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        fontSize: "11px",
        color: "var(--color-text-muted)",
        borderTop: "1px solid var(--color-border-faint)",
        paddingTop: "8px",
      }}>
        Conversión estimada: {metrics.activeProspects > 0
          ? `${Math.round((metrics.openQuotations / metrics.activeProspects) * 100)}%`
          : "—"}
      </div>
    </div>
  );
}
