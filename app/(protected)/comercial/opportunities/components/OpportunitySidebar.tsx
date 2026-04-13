"use client";

import type { Opportunity, OpportunityFilters } from "../types/opportunities.types";
import { STAGE_CONFIG, STAGE_ORDER } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getOpportunityStage, isOpenOpportunity, expectedRevenue, isStalled } from "../services/opportunities.normalization";

type Props = {
  search:       string;
  setSearch:    (v: string) => void;
  opportunities: Opportunity[];
  selected:     Opportunity | null;
  setSelected:  (o: Opportunity) => void;
  onOpenCreate: () => void;
};

export default function OpportunitySidebar({
  search, setSearch, opportunities, selected, setSelected, onOpenCreate,
}: Props) {
  const { t } = useTranslation();

  const open    = opportunities.filter(isOpenOpportunity).length;
  const atRisk  = opportunities.filter((o) => (o.probability ?? 0) < 40 && isOpenOpportunity(o)).length;
  const stalledC = opportunities.filter(isStalled).length;

  const kpis = [
    { label: (t.opportunities as any)?.open     ?? "Abiertos",  value: open,     color: "var(--color-brand-blue)"  },
    { label: (t.opportunities as any)?.atRisk   ?? "En riesgo", value: atRisk,   color: atRisk > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" },
    { label: (t.opportunities as any)?.stalledS ?? "Estanc.",   value: stalledC, color: stalledC > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)" },
    { label: (t.opportunities as any)?.total    ?? "Total",     value: opportunities.length, color: "var(--color-text-second)" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {(t.opportunities as any)?.title ?? "Oportunidades"}
          </span>
          <span style={{
            fontSize: "11px", fontWeight: 700, padding: "1px 7px",
            borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)",
          }}>
            {opportunities.length}
          </span>
        </div>
        <button
          onClick={onOpenCreate}
          style={{
            width: "100%", height: "36px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "13px", fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            marginBottom: "10px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {(t.opportunities as any)?.newOpportunity ?? "Nueva oportunidad"}
        </button>

        {/* SEARCH */}
        <div style={{ position: "relative" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={(t.opportunities as any)?.search ?? "Buscar oportunidad…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "34px", paddingLeft: "30px", paddingRight: "12px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
              fontSize: "13px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* KPIS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", flexShrink: 0 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)", padding: "8px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{k.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "6px", alignContent: "start" }}>
        {opportunities.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {(t.opportunities as any)?.noOpportunities ?? "Sin oportunidades"}
          </div>
        ) : opportunities.map((o) => {
          const isSelected = selected?.id === o.id;
          const stage      = getOpportunityStage(o);
          const cfg        = STAGE_CONFIG[stage];
          const stageLabel = (t.opportunities as any)?.[cfg.labelKey.replace("opportunities.", "")] ?? stage;
          const rev        = expectedRevenue(o);
          const stall      = isStalled(o);

          return (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              style={{
                padding: "12px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "5px",
                transition: "var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {o.company_name ?? o.name}
                </span>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  {stageLabel}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
                <span>${Number(o.value ?? 0).toLocaleString()} · {o.probability}%</span>
                <span style={{ color: "var(--color-success-text)" }}>${Math.round(rev).toLocaleString()}</span>
              </div>
              {stall && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-warning-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {(t.opportunities as any)?.stalled ?? "Estancado"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
