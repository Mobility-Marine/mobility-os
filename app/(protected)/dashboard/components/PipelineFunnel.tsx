import { DashboardMetrics } from "../hooks/useDashboard";

interface PipelineFunnelProps {
  metrics: DashboardMetrics;
}

export default function PipelineFunnel({ metrics }: PipelineFunnelProps) {
  const stages = [
    { label: "Prospectos",   value: metrics.activeProspects, color: "var(--color-brand-blue)",    bg: "var(--color-brand-blue-light)", pct: 100 },
    { label: "Cotizaciones", value: metrics.openQuotations,  color: "var(--color-info-text)",     bg: "var(--color-info-bg)",          pct: 82 },
    { label: "Embarques",    value: metrics.activeShipments, color: "var(--color-warning-text)",  bg: "var(--color-warning-bg)",       pct: 64 },
    { label: "Facturas",     value: metrics.pendingInvoices, color: "var(--color-success-text)",  bg: "var(--color-success-bg)",       pct: 46 },
  ];

  const maxVal = Math.max(...stages.map((s) => s.value), 1);
  const conversion = metrics.activeProspects > 0
    ? Math.round((metrics.openQuotations / metrics.activeProspects) * 100)
    : 0;

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
          Pipeline comercial
        </div>
        <div style={{
          padding: "2px 10px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-brand-blue-light)",
          color: "var(--color-brand-blue)",
          fontSize: "11px",
          fontWeight: 600,
        }}>
          {conversion}% conversión
        </div>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {stages.map((stage, i) => {
          const barPct = Math.max((stage.value / maxVal) * 100, 4);
          const funnelWidth = stage.pct;
          return (
            <div key={stage.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "2px",
                    background: stage.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "12px", color: "var(--color-text-second)", fontWeight: 500 }}>
                    {stage.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {i > 0 && (
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {stages[i - 1].value > 0
                        ? `${Math.round((stage.value / stages[i - 1].value) * 100)}%`
                        : "—"}
                    </span>
                  )}
                  <span style={{ fontSize: "13px", fontWeight: 700, color: stage.color }}>
                    {stage.value}
                  </span>
                </div>
              </div>
              <div style={{ width: `${funnelWidth}%`, margin: "0 auto 0 0" }}>
                <div style={{
                  width: "100%", height: "24px",
                  background: stage.bg,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: `1px solid ${stage.color}20`,
                }}>
                  <div style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: stage.color,
                    opacity: 0.8,
                    borderRadius: "var(--radius-sm)",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        borderTop: "1px solid var(--color-border-faint)",
        paddingTop: "10px",
      }}>
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>Velocidad de cierre</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            {metrics.openQuotations > 0 ? "Activa" : "Sin datos"}
          </div>
        </div>
        <div style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>Ticket promedio</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>—</div>
        </div>
      </div>
    </div>
  );
}
