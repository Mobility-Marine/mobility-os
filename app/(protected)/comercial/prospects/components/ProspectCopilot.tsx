"use client";

import type { Prospect } from "../types/prospects.types";
import ProspectHealthPanel from "./ProspectHealthPanel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProspectStage, hasContact, isHighValue } from "../services/prospects.normalization";

type Props = { prospect: Prospect | null; };

export default function ProspectCopilot({ prospect }: Props) {
  const { t } = useTranslation();

  if (!prospect) {
    return (
      <div style={shell}>
        <div style={container}>
          <div style={titleStyle}>Copilot Prospecting</div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {t.prospects.workspaceEmpty}
          </div>
        </div>
        <ProspectHealthPanel prospect={null} />
      </div>
    );
  }

  const stage   = getProspectStage(prospect);
  const contact = hasContact(prospect);
  const highVal = isHighValue(prospect);

  const recommendation = contact && highVal
    ? (t.prospects.actionPrepareProposal  ?? "Preparar propuesta")
    : !contact
    ? (t.prospects.actionGetContact       ?? "Conseguir datos de contacto")
    : (t.prospects.actionQualify          ?? "Calificar necesidad y presupuesto");

  const priority = (prospect.estimated_value ?? 0) >= 100_000
    ? t.dashboard.criticalItems
    : (prospect.estimated_value ?? 0) >= 50_000
    ? t.dashboard.attentionItems
    : t.general.active;

  const risk = !contact
    ? (t.prospects.alertMissingContact ?? "Sin contacto")
    : stage === "lost"
    ? t.prospects.stageLost
    : stage === "negotiation" || stage === "proposal"
    ? "Bajo"
    : "Medio";

  const cards = [
    { label: t.prospects.nextAction ?? "Siguiente acción", value: recommendation, color: "var(--color-brand-blue)"   },
    { label: t.prospects.stage,                            value: (t.prospects as any)[`stage${stage.charAt(0).toUpperCase() + stage.slice(1)}`] ?? stage, color: "var(--color-info-text)"     },
    { label: t.prospects.estimatedValue,                   value: prospect.estimated_value ? `$${Number(prospect.estimated_value).toLocaleString()}` : t.prospects.noEstimation, color: "var(--color-success-text)" },
    { label: t.prospects.risk ?? "Riesgo",                 value: risk, color: "var(--color-warning-text)"  },
  ];

  return (
    <div style={shell}>
      <div style={container}>
        <div style={titleStyle}>Copilot Prospecting</div>

        <div style={{ display: "grid", gap: "8px" }}>
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border-faint)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                {card.label}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: card.color, lineHeight: 1.4 }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* CONTEXTO */}
        <div style={{
          padding: "12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue-light)",
          border: "1px solid var(--color-brand-blue)30",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {t.prospects.source}
          </div>
          <div style={{ display: "grid", gap: "4px" }}>
            {[
              { label: t.prospects.interestedService, value: prospect.interested_service || t.prospects.noEstimation },
              { label: t.prospects.leadSource,        value: prospect.lead_source || "Manual" },
              { label: t.prospects.stage,             value: (t.prospects as any)[`stage${stage.charAt(0).toUpperCase() + stage.slice(1)}`] ?? stage },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProspectHealthPanel
        prospect={prospect}
        activities={prospect.activities ?? []}
        tasks={prospect.tasks ?? []}
        followups={prospect.followups ?? []}
      />
    </div>
  );
}

const shell: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "16px",
  height: "100%", minHeight: 0, overflow: "hidden",
};

const container: React.CSSProperties = {
  background: "var(--color-bg-base)",
  border: "1px solid var(--color-border-faint)",
  borderRadius: "var(--radius-lg)",
  padding: "16px",
  display: "flex", flexDirection: "column", gap: "12px",
  flex: "1 1 auto", minHeight: 0, overflowY: "auto",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 800, fontSize: "13px",
  letterSpacing: "0.5px", textTransform: "uppercase",
  color: "var(--color-text-primary)",
};
