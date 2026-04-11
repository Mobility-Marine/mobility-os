import { DashboardMetrics } from "../hooks/useDashboard";
import MetricCard from "./MetricCard";
import SparkChart from "./SparkChart";

interface HeroPanelProps {
  metrics: DashboardMetrics;
}

const opsTrend =       [58, 64, 61, 72, 78, 74, 84];
const revenueTrend =   [42, 48, 51, 56, 60, 58, 67];
const logisticsTrend = [70, 68, 66, 74, 73, 79, 82];

const MONTHLY_GOAL = 100;

export default function HeroPanel({ metrics }: HeroPanelProps) {
  const pct = Math.min(Math.round((metrics.pendingInvoices / MONTHLY_GOAL) * 100), 100);
  const barColor = pct >= 80
    ? "var(--color-success-text)"
    : pct >= 50
    ? "var(--color-warning-text)"
    : "var(--color-brand-blue)";
  const daysLeft = new Date(
    new Date().getFullYear(), new Date().getMonth() + 1, 0
  ).getDate() - new Date().getDate();

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-xl)",
      padding: "20px",
      boxShadow: "var(--shadow-md)",
      display: "grid",
      gap: "16px",
      height: "100%",
      alignContent: "start",
    }}>

      {/* OBJETIVO MENSUAL — integrado */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "10px 14px",
        background: "var(--color-bg-subtle)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
            Objetivo mensual
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: barColor, lineHeight: 1.1 }}>
            {pct}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: "100%", height: "6px", borderRadius: "var(--radius-full)", background: "var(--color-border-faint)", overflow: "hidden", marginBottom: "4px" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: "var(--radius-full)", background: barColor, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{metrics.pendingInvoices} facturas emitidas</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Meta: {MONTHLY_GOAL}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Días restantes</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>{daysLeft}</div>
        </div>
      </div>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Situación operativa
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            Visión ejecutiva consolidada
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 12px", borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
          fontSize: "12px", fontWeight: 600, color: "var(--color-text-second)", flexShrink: 0,
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-success-text)", display: "inline-block" }} />
          Actividad alta
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
        <MetricCard title="Prospectos activos"  value={String(metrics.activeProspects)}  subtitle="en seguimiento" />
        <MetricCard title="Cotizaciones"        value={String(metrics.openQuotations)}   subtitle="en proceso" />
        <MetricCard title="Embarques"           value={String(metrics.activeShipments)}  subtitle="en operación" />
        <MetricCard title="Facturas pendientes" value={String(metrics.pendingInvoices)}  subtitle="requieren atención" tone={metrics.pendingInvoices > 0 ? "warning" : "default"} />
      </div>

      {/* SPARK CHARTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
        <SparkChart data={opsTrend}       title="Pulso operativo"      label="Últimos 7 días" />
        <SparkChart data={revenueTrend}   title="Ingresos / tendencia" label="Ritmo mensual" />
        <SparkChart data={logisticsTrend} title="Capacidad logística"  label="Carga vs disponibilidad" />
      </div>
    </div>
  );
}
