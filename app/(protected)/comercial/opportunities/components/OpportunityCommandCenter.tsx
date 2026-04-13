"use client";

import type { Opportunity } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { isOpenOpportunity, isStalled, expectedRevenue, buildForecastSnapshot } from "../services/opportunities.normalization";

type Props = { opportunities: Opportunity[]; onSelect: (o: Opportunity) => void; };

export default function OpportunityCommandCenter({ opportunities, onSelect }: Props) {
  const { t } = useTranslation();

  const open       = opportunities.filter(isOpenOpportunity);
  const atRisk     = open.filter((o) => (o.probability ?? 0) < 40);
  const stalled    = open.filter(isStalled);
  const snap       = buildForecastSnapshot(opportunities);
  const won        = opportunities.filter((o) => o.stage === "won");

  const cards = [
    {
      key:   "open",
      label: (t.opportunities as any)?.openDeals ?? "Deals abiertos",
      hint:  (t.opportunities as any)?.openDealsHint ?? "En pipeline activo",
      value: String(open.length),
      sub:   `$${snap.pipeline.toLocaleString()}`,
      color: "var(--color-brand-blue)",
      bg:    "var(--color-info-bg)",
      border:"var(--color-info-border)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      first: open[0],
    },
    {
      key:   "risk",
      label: (t.opportunities as any)?.atRisk ?? "En riesgo",
      hint:  (t.opportunities as any)?.atRiskHint ?? "Probabilidad baja",
      value: String(atRisk.length),
      sub:   atRisk.length > 0 ? `$${atRisk.reduce((s,o) => s + (o.value ?? 0), 0).toLocaleString()}` : "—",
      color: "var(--color-danger-text)",
      bg:    "var(--color-danger-bg)",
      border:"var(--color-danger-border)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      first: atRisk[0],
    },
    {
      key:   "stalled",
      label: (t.opportunities as any)?.stalled ?? "Estancados",
      hint:  (t.opportunities as any)?.stalledHint ?? "Sin movimiento",
      value: String(stalled.length),
      sub:   stalled.length > 0 ? `${Math.round(stalled.reduce((s,o) => s + (Date.now() - new Date(o.created_at).getTime()) / 86400000, 0) / stalled.length)}d avg` : "—",
      color: "var(--color-warning-text)",
      bg:    "var(--color-warning-bg)",
      border:"var(--color-warning-border)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      first: stalled[0],
    },
    {
      key:   "won",
      label: (t.opportunities as any)?.wonDeals ?? "Ganados",
      hint:  (t.opportunities as any)?.wonDealsHint ?? "Cerrados exitosamente",
      value: String(won.length),
      sub:   `$${won.reduce((s,o) => s + (o.value ?? 0), 0).toLocaleString()}`,
      color: "var(--color-success-text)",
      bg:    "var(--color-success-bg)",
      border:"var(--color-success-border)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      first: won[0],
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.key}
          onClick={() => card.first && onSelect(card.first)}
          style={{
            background:   Number(card.value) > 0 ? card.bg   : "var(--color-bg-base)",
            border:       `1px solid ${Number(card.value) > 0 ? card.border : "var(--color-border-faint)"}`,
            borderRadius: "var(--radius-lg)",
            padding:      "16px",
            cursor:       card.first ? "pointer" : "default",
            transition:   "var(--transition-fast)",
            display:      "grid", gap: "8px",
          }}
          onMouseEnter={(e) => { if (card.first) (e.currentTarget as HTMLDivElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: Number(card.value) > 0 ? card.color : "var(--color-text-muted)" }}>{card.icon}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: Number(card.value) > 0 ? card.color : "var(--color-text-muted)" }}>
                {card.label}
              </span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: Number(card.value) > 0 ? card.color : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {card.value}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{card.hint}</div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: card.color }}>{card.sub}</div>
        </div>
      ))}
    </>
  );
}
