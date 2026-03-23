"use client";

import type { Prospect } from "../types/prospects.types";

type Props = {
  prospects: Prospect[];
};

export default function ProspectRevenueInsights({
  prospects,
}: Props) {
  const active = prospects.filter(
    (p) => p.is_active && p.stage !== "lost"
  );

  // ==========================================================
  // 📊 FUNNEL POR ETAPA
  // ==========================================================

  const stages = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "negotiation",
  ];

  const funnel = stages.map((stage) => ({
    stage,
    count: active.filter(
      (p) => (p.stage || p.status) === stage
    ).length,
  }));

  // ==========================================================
  // 💰 FORECAST
  // ==========================================================

  const totalValue = active.reduce(
    (sum, p) => sum + (p.estimated_value || 0),
    0
  );

  const probabilityMap: Record<string, number> = {
    new: 0.1,
    contacted: 0.2,
    qualified: 0.4,
    proposal: 0.6,
    negotiation: 0.8,
  };

  const weightedValue = active.reduce((sum, p) => {
    const prob =
      probabilityMap[
        (p.stage || p.status || "new").toLowerCase()
      ] || 0.1;

    return sum + (p.estimated_value || 0) * prob;
  }, 0);

  // ==========================================================
  // ⚡ VELOCIDAD — días promedio
  // ==========================================================

  const avgDays =
    active.length === 0
      ? 0
      : active.reduce((sum, p) => {
          if (!p.created_at) return sum;
          const days =
            (Date.now() -
              new Date(p.created_at).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / active.length;

  // ==========================================================
  // ⏰ SLA — seguimientos vencidos
  // ==========================================================

  const overdue = active.filter((p) => {
    if (!p.next_follow_up) return false;
    return new Date(p.next_follow_up) < new Date();
  });

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={container}>
      <div style={title}>Pipeline Insights</div>

      {/* FORECAST */}
      <div style={grid}>
        <Metric
          label="Valor potencial"
          value={`$${format(totalValue)}`}
        />

        <Metric
          label="Forecast ponderado"
          value={`$${format(weightedValue)}`}
        />

        <Metric
          label="Días promedio"
          value={`${avgDays.toFixed(1)} días`}
        />

        <Metric
          label="Seguimientos vencidos"
          value={`${overdue.length}`}
        />
      </div>

      {/* FUNNEL */}
      <div style={funnelBox}>
        <div style={subtitle}>Distribución por etapa</div>

        {funnel.map((f) => (
          <FunnelRow
            key={f.stage}
            label={f.stage.toUpperCase()}
            value={f.count}
            max={active.length}
          />
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max ? (value / max) * 100 : 0;

  return (
    <div style={funnelRow}>
      <div style={funnelLabel}>{label}</div>

      <div style={barTrack}>
        <div
          style={{
            ...barFill,
            width: `${pct}%`,
          }}
        />
      </div>

      <div style={funnelValue}>{value}</div>
    </div>
  );
}

function format(n: number) {
  return n.toLocaleString("es-MX");
}

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: 18,
  display: "grid",
  gap: 16,
};

const title: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 16,
};

const subtitle: React.CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
  marginBottom: 8,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 12,
};

const metricCard: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 14,
};

const metricLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const metricValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginTop: 4,
};

const funnelBox: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 14,
};

const funnelRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 1fr 40px",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const funnelLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#cbd5f5",
};

const funnelValue: React.CSSProperties = {
  fontSize: 12,
  textAlign: "right",
};

const barTrack: React.CSSProperties = {
  height: 8,
  background: "#020617",
  borderRadius: 6,
};

const barFill: React.CSSProperties = {
  height: 8,
  background: "#3b82f6",
  borderRadius: 6,
};
