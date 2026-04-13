"use client";

import type { Opportunity } from "../types/opportunities.types";
import { STAGE_ORDER, STAGE_CONFIG } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { buildForecastSnapshot, isOpenOpportunity, getOpportunityStage } from "../services/opportunities.normalization";
import { buildForecastHealth } from "../services/opportunities.intelligence";

type Props = { opportunities: Opportunity[] };

export default function OpportunityRevenueInsights({ opportunities }: Props) {
  const { t, lang } = useTranslation();
  const snap   = buildForecastSnapshot(opportunities, 100_000);
  const health = buildForecastHealth(snap);
  const open   = opportunities.filter(isOpenOpportunity);
  const fmt    = (n: number) => n.toLocaleString(lang === "en" ? "en-US" : "es-MX");

  const HEALTH_COLOR = {
    STRONG:   "var(--color-success-text)",
    MEDIUM:   "var(--color-info-text)",
    WEAK:     "var(--color-warning-text)",
    CRITICAL: "var(--color-danger-text)",
  };

  const metrics = [
    { label: (t.opportunities as any)?.pipeline  ?? "Pipeline",         value: `$${fmt(snap.pipeline)}`,  color: "var(--color-brand-blue)"  },
    { label: (t.opportunities as any)?.weighted  ?? "Forecast pond.",    value: `$${fmt(snap.weighted)}`,  color: "var(--color-info-text)"   },
    { label: (t.opportunities as any)?.commit    ?? "Commit",            value: `$${fmt(snap.commit)}`,    color: "var(--color-success-text)"},
    { label: (t.opportunities as any)?.gap       ?? "Gap vs objetivo",   value: `$${fmt(snap.gap)}`,       color: snap.gap > 0 ? "var(--color-danger-text)" : "var(--color-success-text)" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "14px",
      height: "100%", width: "100%",
    }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {(t.opportunities as any)?.forecastTitle ?? "CFO Forecast"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)", padding: "12px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{m.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Forecast health */}
      <div style={{
        padding: "10px 14px", borderRadius: "var(--radius-md)", flex: "0 0 auto",
        background: HEALTH_COLOR[health.level] + "15",
        border: `1px solid ${HEALTH_COLOR[health.level]}40`,
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: HEALTH_COLOR[health.level], marginBottom: "3px" }}>
          {(t.opportunities as any)?.[health.titleKey.replace("opportunities.", "")] ?? health.titleKey}
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          {(t.opportunities as any)?.[health.messageKey.replace("opportunities.", "")] ?? health.messageKey}
        </div>
      </div>

      {/* Stage funnel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", minHeight: 0, overflowY: "auto" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
          {(t.opportunities as any)?.distribution ?? "Distribución por etapa"}
        </div>
        {STAGE_ORDER.filter((s) => s !== "lost").map((stage) => {
          const cfg   = STAGE_CONFIG[stage];
          const items = open.filter((o) => getOpportunityStage(o) === stage);
          const pct   = open.length ? (items.length / open.length) * 100 : 0;
          const label = (t.opportunities as any)?.[cfg.labelKey.replace("opportunities.", "")] ?? stage;
          const val   = items.reduce((s, o) => s + (o.value ?? 0), 0);

          return (
            <div key={stage} style={{ display: "grid", gridTemplateColumns: "80px 1fr 32px 80px", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: cfg.color }}>{label}</span>
              <div style={{ height: "7px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{items.length}</span>
              {val > 0 && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", textAlign: "right" }}>${fmt(val)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
