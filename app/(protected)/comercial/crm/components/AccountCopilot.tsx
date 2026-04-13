"use client";

import type { CrmAccount, AiDirectorAdvice, CrmAccountInsights } from "../types/crm.types";
import { LIFECYCLE_CONFIG } from "../types/crm.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  account:  CrmAccount | null;
  insights: CrmAccountInsights | null;
  director: AiDirectorAdvice | null;
};

const URGENCY_COLOR: Record<string, string> = {
  CRITICA: "var(--color-danger-text)",
  ALTA:    "var(--color-warning-text)",
  MEDIA:   "var(--color-info-text)",
  BAJA:    "var(--color-success-text)",
};

const TEMP_COLOR: Record<string, string> = {
  FRIA:     "var(--color-info-text)",
  TIBIA:    "var(--color-warning-text)",
  CALIENTE: "var(--color-danger-text)",
};

export default function AccountCopilot({ account, insights, director }: Props) {
  const { t } = useTranslation();

  if (!account) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "18px",
        display: "flex", flexDirection: "column", gap: "12px", height: "100%",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Copilot CRM
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          {(t.crm as any)?.workspaceEmpty ?? "Selecciona una cuenta para ver inteligencia comercial."}
        </div>
      </div>
    );
  }

  const stage    = (account.lifecycle_stage ?? "customer") as any;
  const cfg      = LIFECYCLE_CONFIG[stage] ?? LIFECYCLE_CONFIG.customer;
  const stageLabel = (t.crm as any)?.[cfg.labelKey.replace("crm.", "")] ?? stage;
  const scoreColor = insights
    ? (insights.healthScore >= 70 ? "var(--color-success-text)" : insights.healthScore >= 40 ? "var(--color-warning-text)" : "var(--color-danger-text)")
    : "var(--color-text-muted)";

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflowY: "auto",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Copilot CRM
      </div>

      {/* HEALTH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>Health</div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: scoreColor }}>
            {insights ? `${insights.healthScore}/100` : "—"}
          </div>
        </div>
        <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px" }}>
            {(t.crm as any)?.churnRisk ?? "Churn Risk"}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: insights?.churnRisk === "ALTO" ? "var(--color-danger-text)" : insights?.churnRisk === "MEDIO" ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
            {insights?.churnRisk ?? "—"}
          </div>
        </div>
      </div>

      {/* DIRECTOR IA */}
      {director && (
        <div style={{
          padding: "12px", borderRadius: "var(--radius-md)",
          background: URGENCY_COLOR[director.urgency] + "15",
          border: `1px solid ${URGENCY_COLOR[director.urgency]}40`,
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: URGENCY_COLOR[director.urgency], marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.crm as any)?.aiDirector ?? "Revenue AI Director"} · {director.urgency}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-full)", background: TEMP_COLOR[director.accountTemperature] + "20", color: TEMP_COLOR[director.accountTemperature] }}>
              {director.accountTemperature}
            </span>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.4 }}>
            {director.recommendedAction}
          </div>
        </div>
      )}

      {/* NEXT ACTION */}
      {insights?.nextBestAction && (
        <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.crm as any)?.nextAction ?? "Siguiente acción"}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", lineHeight: 1.4 }}>
            {insights.nextBestAction}
          </div>
        </div>
      )}

      {/* LIFECYCLE */}
      <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.crm as any)?.lifecycleStage ?? "Etapa del cliente"}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: cfg.color }}>{stageLabel}</div>
      </div>

      {/* ALERTS */}
      {director?.alerts && director.alerts.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.crm as any)?.alerts ?? "Alertas"}
          </div>
          {director.alerts.slice(0, 3).map((alert, i) => (
            <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)", lineHeight: 1.4 }}>
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* RISKS */}
      {director?.risksDetected && director.risksDetected.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.crm as any)?.risks ?? "Riesgos"}
          </div>
          {director.risksDetected.slice(0, 2).map((r, i) => (
            <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", fontSize: "11px", color: "var(--color-danger-text)" }}>
              {r}
            </div>
          ))}
        </div>
      )}

      {/* OPPORTUNITIES DETECTED */}
      {director?.opportunitiesDetected && director.opportunitiesDetected.length > 0 && (
        <div style={{ display: "grid", gap: "6px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.crm as any)?.opportunitiesDetected ?? "Oportunidades detectadas"}
          </div>
          {director.opportunitiesDetected.slice(0, 2).map((o, i) => (
            <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "11px", color: "var(--color-success-text)" }}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
