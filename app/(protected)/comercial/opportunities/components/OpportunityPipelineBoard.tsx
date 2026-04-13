"use client";

import type { Opportunity, OpportunityStage } from "../types/opportunities.types";
import { STAGE_ORDER, STAGE_CONFIG } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getOpportunityStage, isStalled, expectedRevenue } from "../services/opportunities.normalization";

type Props = {
  opportunities: Opportunity[];
  onSelect:      (o: Opportunity) => void;
  onStageChange?:(id: string, stage: string) => void;
};

export default function OpportunityPipelineBoard({ opportunities, onSelect, onStageChange }: Props) {
  const { t } = useTranslation();

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("oppId", id);
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("oppId");
    if (id && onStageChange) onStageChange(id, stage);
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${STAGE_ORDER.length}, minmax(0, 1fr))`,
      gap: "10px",
      height: "100%",
    }}>
      {STAGE_ORDER.map((stage) => {
        const cfg   = STAGE_CONFIG[stage];
        const items = opportunities.filter((o) => getOpportunityStage(o) === stage);
        const value = items.reduce((s, o) => s + (o.value ?? 0), 0);
        const label = (t.opportunities as any)?.[cfg.labelKey.replace("opportunities.", "")] ?? stage;

        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              background: "var(--color-bg-base)", border: `1px solid ${cfg.border}`,
              borderRadius: "var(--radius-lg)", padding: "10px",
              display: "flex", flexDirection: "column", gap: "6px",
            }}
          >
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)", background: cfg.bg, color: cfg.color }}>{items.length}</span>
            </div>

            {value > 0 && (
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "4px", flexShrink: 0 }}>
                ${value.toLocaleString()}
              </div>
            )}

            {/* CARDS */}
            <div style={{ flex: 1, display: "grid", gap: "5px", alignContent: "start", overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{
                  padding: "12px 8px", borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--color-border-faint)",
                  textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)",
                }}>—</div>
              ) : items.map((o) => {
                const stall = isStalled(o);
                const rev   = expectedRevenue(o);
                return (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, o.id)}
                    onClick={() => onSelect(o)}
                    style={{
                      background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                      borderLeft: `3px solid ${cfg.color}`,
                      borderRadius: "var(--radius-md)", padding: "8px 10px",
                      cursor: "grab", display: "grid", gap: "3px",
                      transition: "var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.company_name ?? o.name}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                      <span style={{ color: "var(--color-success-text)" }}>${Number(o.value ?? 0).toLocaleString()}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>{o.probability}%</span>
                    </div>
                    {stall && (
                      <div style={{ fontSize: "9px", color: "var(--color-warning-text)", fontWeight: 700 }}>
                        {(t.opportunities as any)?.stalled ?? "Estancado"}
                      </div>
                    )}
                    {o.health && (
                      <div style={{ height: "2px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                        <div style={{
                          width: `${o.health.score}%`, height: "100%",
                          background: o.health.score >= 75 ? "var(--color-success-text)" : o.health.score >= 50 ? "var(--color-warning-text)" : "var(--color-danger-text)",
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
