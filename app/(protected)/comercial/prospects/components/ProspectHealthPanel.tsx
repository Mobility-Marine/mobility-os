"use client";

import type {
  Prospect,
  ProspectActivity,
  ProspectTask,
  ProspectFollowup,
} from "../types/prospects.types";
import { buildProspectHealth } from "./prospects.intelligence";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  prospect:   Prospect | null;
  activities?: ProspectActivity[];
  tasks?:      ProspectTask[];
  followups?:  ProspectFollowup[];
};

const RISK_COLOR: Record<string, string> = {
  LOW:      "var(--color-success-text)",
  MEDIUM:   "var(--color-warning-text)",
  HIGH:     "var(--color-danger-text)",
  CRITICAL: "var(--color-danger-text)",
};

export default function ProspectHealthPanel({
  prospect, activities = [], tasks = [], followups = [],
}: Props) {
  const { t } = useTranslation();

  if (!prospect) {
    return (
      <div style={container}>
        <div style={titleStyle}>{t.prospects.intelligence ?? "Inteligencia comercial"}</div>
        <div style={empty}>{t.prospects.selectToSeeInsights ?? "Selecciona un prospecto para ver insights."}</div>
      </div>
    );
  }

  const health = buildProspectHealth({ prospect, activities, tasks, followups });
  const nextAction = (t.prospects as any)[health.nextBestActionKey.replace("prospects.", "")] ?? health.nextBestActionKey;
  const summary    = (t.prospects as any)[health.summaryKey.replace("prospects.", "")]       ?? health.summaryKey;

  const scoreColor = health.score >= 75
    ? "var(--color-success-text)"
    : health.score >= 50
    ? "var(--color-warning-text)"
    : "var(--color-danger-text)";

  return (
    <div style={container}>
      <div style={titleStyle}>{t.prospects.intelligence ?? "Inteligencia comercial"}</div>

      <div style={grid}>
        <Metric
          label="Score"
          value={`${health.score}/100`}
          color={scoreColor}
        />
        <Metric
          label={t.prospects.conversion ?? "Conversión"}
          value={`${health.conversionProbability}%`}
          color="var(--color-brand-blue)"
        />
        <Metric
          label={t.prospects.risk ?? "Riesgo"}
          value={health.riskLevel}
          color={RISK_COLOR[health.riskLevel] ?? "var(--color-text-primary)"}
        />
      </div>

      {health.isOverdue && (
        <div style={{
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-danger-bg)",
          border: "1px solid var(--color-danger-border)",
          fontSize: "12px",
          color: "var(--color-danger-text)",
          fontWeight: 600,
        }}>
          {t.prospects.overdueWarning ?? "Seguimiento vencido — contactar hoy"}
        </div>
      )}

      <div style={box}>
        <div style={boxTitle}>{t.prospects.nextAction ?? "Siguiente mejor acción"}</div>
        <div style={boxText}>{nextAction}</div>
      </div>

      <div style={box}>
        <div style={boxTitle}>{t.prospects.executiveSummary ?? "Resumen ejecutivo"}</div>
        <div style={boxText}>{summary}</div>
      </div>

      {health.daysSinceActivity !== null && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "right" }}>
          {health.daysSinceActivity === 0
            ? (t.prospects.activityToday ?? "Actividad hoy")
            : `${health.daysSinceActivity}d ${t.prospects.sinceLastActivity ?? "desde última actividad"}`}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>
      <div style={{ ...metricValue, color }}>{value}</div>
    </div>
  );
}

const container: React.CSSProperties = {
  background:   "var(--color-bg-base)",
  border:       "1px solid var(--color-border-faint)",
  borderRadius: "var(--radius-lg)",
  padding:      16,
  display:      "grid",
  gap:          12,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize:   13,
  color:      "var(--color-text-primary)",
};

const empty: React.CSSProperties = {
  fontSize: 12,
  color:    "var(--color-text-muted)",
};

const grid: React.CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap:                 10,
};

const metricCard: React.CSSProperties = {
  background:   "var(--color-bg-subtle)",
  border:       "1px solid var(--color-border-faint)",
  borderRadius: "var(--radius-md)",
  padding:      12,
};

const metricLabel: React.CSSProperties = {
  fontSize: 11,
  color:    "var(--color-text-muted)",
};

const metricValue: React.CSSProperties = {
  fontWeight: 700,
  marginTop:  4,
  fontSize:   14,
};

const box: React.CSSProperties = {
  background:   "var(--color-bg-subtle)",
  border:       "1px solid var(--color-border-faint)",
  borderRadius: "var(--radius-md)",
  padding:      12,
};

const boxTitle: React.CSSProperties = {
  fontSize:     11,
  fontWeight:   600,
  color:        "var(--color-text-muted)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const boxText: React.CSSProperties = {
  fontWeight: 600,
  fontSize:   13,
  color:      "var(--color-text-primary)",
  lineHeight: 1.5,
};
