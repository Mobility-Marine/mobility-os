import { DashboardMetrics } from "../hooks/useDashboard";
import MetricCard from "./MetricCard";
import SparkChart from "./SparkChart";

interface HeroPanelProps {
  metrics: DashboardMetrics;
}

const opsTrend =       [58, 64, 61, 72, 78, 74, 84];
const revenueTrend =   [42, 48, 51, 56, 60, 58, 67];
const logisticsTrend = [70, 68, 66, 74, 73, 79, 82];

export default function HeroPanel({ metrics }: HeroPanelProps) {
  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-xl)",
      padding: "24px",
      boxShadow: "var(--shadow-md)",
      display: "grid",
      gap: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Situación operativa
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Visión ejecutiva consolidada de la empresa activa
          </div>
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "6px 14px",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-subtle)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--color-text-second)",
          flexShrink: 0,
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-success-text)", display: "inline-block" }} />
          Actividad alta
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
        <MetricCard
          title="Prospectos activos"
          value={String(metrics.activeProspects)}
          subtitle="en seguimiento"
        />
        <MetricCard
          title="Cotizaciones"
          value={String(metrics.openQuotations)}
          subtitle="en proceso"
        />
        <MetricCard
          title="Embarques"
          value={String(metrics.activeShipments)}
          subtitle="en operación"
        />
        <MetricCard
          title="Facturas pendientes"
          value={String(metrics.pendingInvoices)}
          subtitle="requieren atención"
          tone={metrics.pendingInvoices > 0 ? "warning" : "default"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
        <SparkChart data={opsTrend}       title="Pulso operativo"       label="Últimos 7 días" />
        <SparkChart data={revenueTrend}   title="Ingresos / tendencia"  label="Ritmo mensual" />
        <SparkChart data={logisticsTrend} title="Capacidad logística"   label="Carga vs disponibilidad" />
      </div>
    </div>
  );
}
