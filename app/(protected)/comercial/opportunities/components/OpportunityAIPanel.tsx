"use client";

import type { Opportunity } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { buildRevenueAIDirective } from "../services/opportunities.intelligence";
import { isStalled, isOpenOpportunity, getTopOpportunities } from "../services/opportunities.normalization";

type Props = { opportunities: Opportunity[]; onSelect: (o: Opportunity) => void; };

const URGENCY_COLOR = {
  CRITICAL: { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  HIGH:     { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  MEDIUM:   { color: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  LOW:      { color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
};

export default function OpportunityAIPanel({ opportunities, onSelect }: Props) {
  const { t } = useTranslation();
  const directive = buildRevenueAIDirective(opportunities);
  const top       = getTopOpportunities(opportunities, 3);
  const sev       = URGENCY_COLOR[directive.urgency];

  const titleText   = (t.opportunities as any)?.[directive.titleKey.replace("opportunities.", "")]   ?? directive.titleKey;
  const messageText = (t.opportunities as any)?.[directive.messageKey.replace("opportunities.", "")] ?? directive.messageKey;
  const focusText   = (t.opportunities as any)?.[directive.focusKey.replace("opportunities.", "")]   ?? directive.focusKey;

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", width: "100%",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {(t.opportunities as any)?.aiDirector ?? "Revenue AI Director"}
      </div>

      <div style={{
        flex: top.length === 0 ? 1 : "0 0 auto",
        padding: "12px", borderRadius: "var(--radius-md)",
        background: sev.bg, border: `1px solid ${sev.border}`,
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: sev.color, marginBottom: "4px" }}>{titleText}</div>
        <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5, marginBottom: "6px" }}>{messageText}</div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: sev.color }}>
          {(t.opportunities as any)?.focus ?? "Enfoque"}: {focusText}
        </div>
      </div>

      {top.length > 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0, overflowY: "auto" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.opportunities as any)?.topDeals ?? "Prioridad hoy"}
          </div>
          {top.map((o) => (
            <div
              key={o.id}
              onClick={() => onSelect(o)}
              style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "3px",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-faint)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.company_name ?? o.name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-success-text)", flexShrink: 0, marginLeft: "8px" }}>
                  ${Number(o.value ?? 0).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {o.probability}% · {isStalled(o) ? (t.opportunities as any)?.stalled ?? "Estancado" : `${o.stage}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
