"use client";

import type { Opportunity } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { buildOpportunityHealth } from "../services/opportunities.intelligence";
import { getOpportunityStage, agingDays, expectedRevenue } from "../services/opportunities.normalization";
import { STAGE_CONFIG } from "../types/opportunities.types";

type Props = { opportunity: Opportunity | null };

const RISK_COLOR: Record<string, string> = {
  LOW:      "var(--color-success-text)",
  MEDIUM:   "var(--color-warning-text)",
  HIGH:     "var(--color-danger-text)",
  CRITICAL: "var(--color-danger-text)",
};

export default function OpportunityCopilot({ opportunity }: Props) {
  const { t } = useTranslation();

  if (!opportunity) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "18px",
        display: "flex", flexDirection: "column", gap: "12px",
        height: "100%",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Copilot Deals
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          {(t.opportunities as any)?.workspaceEmpty ?? "Selecciona un deal para ver inteligencia."}
        </div>
      </div>
    );
  }

  const health     = buildOpportunityHealth(opportunity);
  const stage      = getOpportunityStage(opportunity);
  const cfg        = STAGE_CONFIG[stage];
  const nextAction = (t.opportunities as any)?.[health.nextBestActionKey.replace("opportunities.", "")] ?? health.nextBestActionKey;
  const summary    = (t.opportunities as any)?.[health.summaryKey.replace("opportunities.", "")]       ?? health.summaryKey;

  const scoreColor = health.score >= 75 ? "var(--color-success-text)" : health.score >= 50 ? "var(--color-warning-text)" : "var(--color-danger-text)";

  const metrics = [
    { label: "Score",                                        value: `${health.score}/100`, color: scoreColor },
    { label: (t.opportunities as any)?.closingScore ?? "Cierre", value: `${health.closingScore}/100`, color: "var(--color-brand-blue)" },
    { label: (t.opportunities as any)?.risk ?? "Riesgo",    value: health.riskLevel, color: RISK_COLOR[health.riskLevel] },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflowY: "auto",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot Deals
      </div>

      {/* METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)", padding: "10px",
          }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>{m.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* AGING */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>{(t.opportunities as any)?.aging ?? "Antigüedad"}</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: health.isStalled ? "var(--color-warning-text)" : "var(--color-text-primary)" }}>
            {health.agingDays}d
          </div>
        </div>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>{(t.opportunities as any)?.expectedRevenue ?? "Ingreso esp."}</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-success-text)" }}>
            ${Math.round(health.expectedRevenue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* NEXT ACTION */}
      <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>
          {(t.opportunities as any)?.nextAction ?? "Siguiente acción"}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: cfg.color, lineHeight: 1.4 }}>{nextAction}</div>
      </div>

      {/* SUMMARY */}
      <div style={{ background: "var(--color-brand-blue-light)", border: "1px solid var(--color-brand-blue)30", borderRadius: "var(--radius-md)", padding: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.opportunities as any)?.executiveSummary ?? "Resumen ejecutivo"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{summary}</div>
      </div>
    </div>
  );
}
