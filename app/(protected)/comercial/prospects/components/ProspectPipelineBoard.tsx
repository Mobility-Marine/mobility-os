"use client";

import type { Prospect } from "../types/prospects.types";
import { STAGE_ORDER, STAGE_CONFIG } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getProspectStage, getPipelineValue } from "../services/prospects.normalization";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
  onStageChange?: (prospectId: string, stage: string) => void;
};

export default function ProspectPipelineBoard({ prospects, onSelect, onStageChange }: Props) {
  const { t } = useTranslation();

  function handleDragStart(e: React.DragEvent, prospectId: string) {
    e.dataTransfer.setData("prospectId", prospectId);
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    const prospectId = e.dataTransfer.getData("prospectId");
    if (prospectId && onStageChange) onStageChange(prospectId, stage);
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
        const items = prospects.filter((p) => getProspectStage(p) === stage);
        const value = getPipelineValue(items);
        const label = (t.prospects as any)[cfg.labelKey.replace("prospects.", "")] ?? stage;

        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              background: "var(--color-bg-base)",
              border: `1px solid ${cfg.border}`,
              borderRadius: "var(--radius-lg)",
              padding: "12px",
              minHeight: "320px",
              display: "flex", flexDirection: "column", gap: "8px",
              transition: "var(--transition-fast)",
            }}
          >
            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {label}
                </span>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 700,
                padding: "1px 7px", borderRadius: "var(--radius-full)",
                background: cfg.bg, color: cfg.color,
              }}>
                {items.length}
              </span>
            </div>

            {value > 0 && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                ${value.toLocaleString()}
              </div>
            )}

            {/* CARDS */}
            <div style={{ display: "grid", gap: "6px", flex: 1, alignContent: "start" }}>
              {items.length === 0 ? (
                <div style={{
                  padding: "16px 8px",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--color-border-faint)",
                  textAlign: "center",
                  fontSize: "11px", color: "var(--color-text-muted)",
                }}>
                  —
                </div>
              ) : items.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onClick={() => onSelect(p)}
                  style={{
                    background: "var(--color-bg-subtle)",
                    border: "1px solid var(--color-border-faint)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    cursor: "grab",
                    display: "grid", gap: "5px",
                    transition: "var(--transition-fast)",
                    borderLeft: `3px solid ${cfg.color}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = cfg.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-faint)";
                  }}
                >
                  <div style={{
                    fontSize: "12px", fontWeight: 700,
                    color: "var(--color-text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.company_name ?? p.name ?? t.prospects.noName}
                  </div>
                  {p.estimated_value && (
                    <div style={{ fontSize: "11px", color: "var(--color-success-text)", fontWeight: 600 }}>
                      ${Number(p.estimated_value).toLocaleString()}
                    </div>
                  )}
                  {p.email && (
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.email}
                    </div>
                  )}
                  {p.health && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <div style={{
                        flex: 1, height: "3px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-border-faint)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${p.health.score}%`, height: "100%",
                          background: p.health.score >= 75
                            ? "var(--color-success-text)"
                            : p.health.score >= 50
                            ? "var(--color-warning-text)"
                            : "var(--color-danger-text)",
                        }} />
                      </div>
                      <span style={{ fontSize: "9px", color: "var(--color-text-muted)", flexShrink: 0 }}>
                        {p.health.score}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
