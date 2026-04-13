"use client";

import type { Prospect } from "../types/prospects.types";
import { buildProspectAutomationAlerts } from "../services/prospects.automation";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  prospects: Prospect[];
  onSelect:  (p: Prospect) => void;
};

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  HIGH:     { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  MEDIUM:   { color: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  LOW:      { color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
};

export default function ProspectAutomationPanel({ prospects, onSelect }: Props) {
  const { t } = useTranslation();
  const alerts    = buildProspectAutomationAlerts(prospects);
  const criticals = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highs     = alerts.filter((a) => a.severity === "HIGH").length;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      display: "grid", gap: "14px",
      height: "100%", overflowY: "auto",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {t.prospects.automationTitle ?? "Automatización comercial"}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {criticals > 0 && (
            <span style={{
              padding: "2px 8px", borderRadius: "var(--radius-full)",
              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
              fontSize: "11px", fontWeight: 600, color: "var(--color-danger-text)",
            }}>
              {criticals} {t.dashboard.criticalItems.toLowerCase()}
            </span>
          )}
          {highs > 0 && (
            <span style={{
              padding: "2px 8px", borderRadius: "var(--radius-full)",
              background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
              fontSize: "11px", fontWeight: 600, color: "var(--color-warning-text)",
            }}>
              {highs} {t.dashboard.attentionItems.toLowerCase()}
            </span>
          )}
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length === 0 ? (
        <div style={{
          padding: "20px", borderRadius: "var(--radius-md)",
          background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
          textAlign: "center", fontSize: "13px",
          fontWeight: 500, color: "var(--color-success-text)",
        }}>
          {t.dashboard.allNormal}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {alerts.slice(0, 8).map((alert) => {
            const prospect = prospects.find((p) => p.id === alert.prospectId);
            if (!prospect) return null;
            const sev   = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.LOW;
            const title = (t.prospects as any)[alert.titleKey.replace("prospects.", "")] ?? alert.titleKey;
            const desc  = (t.prospects as any)[alert.descKey.replace("prospects.", "")]  ?? alert.descKey;

            return (
              <div
                key={alert.id}
                onClick={() => onSelect(prospect)}
                style={{
                  padding: "12px", borderRadius: "var(--radius-md)",
                  border: `1px solid ${sev.border}`,
                  background: sev.bg, cursor: "pointer",
                  display: "grid", gap: "6px",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: sev.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: sev.color }}>{title}</span>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "1px 6px", borderRadius: "var(--radius-full)",
                    background: sev.color + "20", color: sev.color,
                  }}>
                    {alert.severity}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
                  {desc}
                </div>
                <div style={{
                  fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)",
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {alert.prospectName}
                  <svg style={{ marginLeft: "auto" }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
