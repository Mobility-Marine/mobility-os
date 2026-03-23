"use client";

import type {
  Prospect,
  ProspectActivity,
  ProspectTask,
  ProspectFollowup,
} from "../types/prospects.types";
import { buildProspectHealth } from "./prospects.intelligence";

type Props = {
  prospect: Prospect | null;
  activities?: ProspectActivity[];
  tasks?: ProspectTask[];
  followups?: ProspectFollowup[];
};

export default function ProspectHealthPanel({
  prospect,
  activities = [],
  tasks = [],
  followups = [],
}: Props) {
  if (!prospect) {
    return (
      <div style={container}>
        <div style={title}>Inteligencia comercial</div>
        <div style={empty}>Selecciona un prospecto para ver insights.</div>
      </div>
    );
  }

  const health = buildProspectHealth({
    prospect,
    activities,
    tasks,
    followups,
  });

  return (
    <div style={container}>
      <div style={title}>Inteligencia comercial</div>

      <div style={grid}>
        <Metric label="Score" value={`${health.score}/100`} />
        <Metric
          label="Conversión"
          value={`${health.conversionProbability}%`}
        />
        <Metric label="Riesgo" value={health.riskLevel} />
      </div>

      <div style={box}>
        <div style={boxTitle}>Siguiente mejor acción</div>
        <div style={boxText}>{health.nextBestAction}</div>
      </div>

      <div style={box}>
        <div style={boxTitle}>Resumen ejecutivo</div>
        <div style={boxText}>{health.summary}</div>
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

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 16,
  display: "grid",
  gap: 12,
};

const title: React.CSSProperties = {
  fontWeight: 800,
};

const empty: React.CSSProperties = {
  color: "#94a3b8",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
};

const metricCard: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
};

const metricLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const metricValue: React.CSSProperties = {
  fontWeight: 800,
  marginTop: 4,
};

const box: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
};

const boxTitle: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginBottom: 6,
};

const boxText: React.CSSProperties = {
  fontWeight: 600,
};
