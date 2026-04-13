"use client";

import type { Prospect } from "../types/prospects.types";
import { STAGE_ORDER, STAGE_CONFIG } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getProspectStage, isProspectActive,
  getPipelineValue, getConversionRate, isOverdue,
} from "../services/prospects.normalization";

type Props = { prospects: Prospect[] };

const PROBABILITY: Record<string, number> = {
  new: 0.05, contacted: 0.15, qualified: 0.40,
  proposal: 0.60, negotiation: 0.80, converted: 1, lost: 0,
};

export default function ProspectRevenueInsights({ prospects }: Props) {
  const { t, lang } = useTranslation();

  const active = prospects.filter(isProspectActive);

  const totalValue    = getPipelineValue(active);
  const convRate      = getConversionRate(prospects);
  const overdueCount  = active.filter(isOverdue).length;
  const weightedValue = active.reduce((sum, p) => {
    const stage = getProspectStage(p);
    return sum + (p.estimated_value ?? 0) * (PROBABILITY[stage] ?? 0.05);
  }, 0);

  const avgDays = active.length === 0 ? 0 : Math.round(
    active.reduce((sum, p) => {
      if (!p.created_at) return sum;
      return sum + (Date.now() - new Date(p.created_at).getTime()) / 86_400_000;
    }, 0) / active.length
  );

  const fmt = (n: number) => n.toLocaleString(lang === "en" ? "en-US" : "es-MX");

  const metrics = [
    { label: t.prospects.pipelineValue ?? "Valor potencial",       value: `$${fmt(totalValue)}`,         color: "var(--color-brand-blue)"   },
    { label: t.prospects.weightedForecast ?? "Forecast ponderado", value: `$${fmt(weightedValue)}`,      color: "var(--color-success-text)" },
    { label: t.prospects.conversionRate ?? "Tasa de conversión",   value: `${convRate}%`,                color: "var(--color-info-text)"    },
    { label: t.prospects.alertOverdue ?? "Vencidos",               value: String(overdueCount),          color: overdueCount > 0 ? "var(--color-danger-text)" : "var(--color-success-text)" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      display: "grid", gap: "16px",
      height: "100%", overflowY: "auto",
    }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {t.prospects.pipelineTitle ?? "Pipeline Insights"}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)",
            padding: "14px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              {m.label}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* FUNNEL */}
      <div style={{
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-md)",
        padding: "14px",
        display: "grid", gap: "8px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
          {t.prospects.distributionByStage ?? "Distribución por etapa"}
        </div>
        {STAGE_ORDER.filter((s) => s !== "converted" && s !== "lost").map((stage) => {
          const cfg   = STAGE_CONFIG[stage];
          const count = active.filter((p) => getProspectStage(p) === stage).length;
          const pct   = active.length ? (count / active.length) * 100 : 0;
          const label = (t.prospects as any)[cfg.labelKey.replace("prospects.", "")] ?? stage;
          const val   = getPipelineValue(active.filter((p) => getProspectStage(p) === stage));

          return (
            <div key={stage} style={{ display: "grid", gridTemplateColumns: "90px 1fr 36px 100px", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: cfg.color }}>{label}</span>
              <div style={{ height: "8px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%",
                  background: cfg.color,
                  borderRadius: "var(--radius-full)",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {count}
              </span>
              {val > 0 && (
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)", textAlign: "right" }}>
                  ${fmt(val)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
