"use client";

import type { Prospect } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getProspectStage, isProspectActive, isHighValue, isOverdue, daysSince,
} from "../services/prospects.normalization";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
};

export default function ProspectCommandCenter({ prospects, onSelect }: Props) {
  const { t } = useTranslation();
  const now   = new Date();

  const hot = prospects
    .filter((p) => isHighValue(p, 50_000) && isProspectActive(p))
    .sort((a, b) => (b.estimated_value ?? 0) - (a.estimated_value ?? 0));

  const overdue = prospects
    .filter((p) => isOverdue(p) && isProspectActive(p))
    .sort((a, b) =>
      new Date(a.next_follow_up ?? a.next_contact_date ?? "").getTime() -
      new Date(b.next_follow_up ?? b.next_contact_date ?? "").getTime()
    );

  const inactive = prospects.filter((p) => {
    const days = daysSince(p.next_follow_up ?? p.created_at);
    return days !== null && days > 30 && isProspectActive(p);
  });

  const convertible = prospects
    .filter((p) => {
      const s = getProspectStage(p);
      return ["qualified", "proposal", "negotiation"].includes(s) && isProspectActive(p);
    })
    .sort((a, b) => (b.estimated_value ?? 0) - (a.estimated_value ?? 0));

  const cards = [
    {
      key:      "hot",
      labelKey: t.prospects.hotProspects ?? "Calientes",
      hint:     t.prospects.hotProspectsHint ?? "Alto valor y activos",
      count:    hot.length,
      color:    "var(--color-danger-text)",
      bg:       "var(--color-danger-bg)",
      border:   "var(--color-danger-border)",
      icon:     "🔥",
      first:    hot[0],
    },
    {
      key:      "overdue",
      labelKey: t.prospects.overdueProspects ?? "Vencidos",
      hint:     t.prospects.overdueProspectsHint ?? "Seguimientos atrasados",
      count:    overdue.length,
      color:    "var(--color-warning-text)",
      bg:       "var(--color-warning-bg)",
      border:   "var(--color-warning-border)",
      icon:     "⏰",
      first:    overdue[0],
    },
    {
      key:      "inactive",
      labelKey: t.prospects.inactiveProspects ?? "Sin actividad",
      hint:     t.prospects.inactiveProspectsHint ?? "Riesgo de abandono",
      count:    inactive.length,
      color:    "var(--color-info-text)",
      bg:       "var(--color-info-bg)",
      border:   "var(--color-info-border)",
      icon:     "💤",
      first:    inactive[0],
    },
    {
      key:      "convertible",
      labelKey: t.prospects.convertibleProspects ?? "Convertibles",
      hint:     t.prospects.convertibleProspectsHint ?? "Listos para avanzar",
      count:    convertible.length,
      color:    "var(--color-success-text)",
      bg:       "var(--color-success-bg)",
      border:   "var(--color-success-border)",
      icon:     "🎯",
      first:    convertible[0],
    },
  ];

  return (
  <>
    {cards.map((card) => (
      <div
        key={card.key}
        onClick={() => card.first && onSelect(card.first)}
        style={{
          background: card.count > 0 ? card.bg : "var(--color-bg-base)",
          border: `1px solid ${card.count > 0 ? card.border : "var(--color-border-faint)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "16px",
          cursor: card.first ? "pointer" : "default",
          transition: "var(--transition-fast)",
          display: "grid", gap: "8px",
        }}
        onMouseEnter={(e) => {
          if (card.first) (e.currentTarget as HTMLDivElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "1";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>{card.icon}</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: card.count > 0 ? card.color : "var(--color-text-muted)" }}>
              {card.labelKey}
            </span>
          </div>
          <div style={{
            fontSize: "26px", fontWeight: 800,
            color: card.count > 0 ? card.color : "var(--color-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {card.count}
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
          {card.hint}
        </div>
        {card.first && (
          <div style={{ fontSize: "11px", fontWeight: 600, color: card.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {card.first.company_name ?? card.first.name ?? "—"}
          </div>
        )}
      </div>
    ))}
  </>
);
