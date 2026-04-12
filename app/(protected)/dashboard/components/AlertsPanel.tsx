"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { DashboardMetrics } from "../hooks/useDashboard";

type Severity = "danger" | "warning" | "info" | "success";

interface Alert {
  title: string;
  detail: string;
  severity: Severity;
  action?: string;
  actionPath?: string;
}

const severityConfig: Record<Severity, {
  text: string; bg: string; border: string; dot: string;
}> = {
  danger:  { text: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  dot: "var(--color-danger-text)"  },
  warning: { text: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", dot: "var(--color-warning-text)" },
  info:    { text: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    dot: "var(--color-info-text)"    },
  success: { text: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)", dot: "var(--color-success-text)" },
};

export default function AlertsPanel({ metrics }: { metrics: DashboardMetrics }) {
  const { t } = useTranslation();

  const severityLabels: Record<Severity, string> = {
    danger:  t.dashboard.criticalItems,
    warning: t.dashboard.attentionItems,
    info:    "Info",
    success: "OK",
  };

  function deriveAlerts(): Alert[] {
    const alerts: Alert[] = [];
    if (metrics.pendingInvoices > 0) {
      alerts.push({
        title:    t.dashboard.criticalPending,
        detail:   `${metrics.pendingInvoices} ${metrics.pendingInvoices > 1 ? t.dashboard.criticalPendingDetailPlural : t.dashboard.criticalPendingDetail}`,
        severity: "danger",
        action:   t.dashboard.pendingInvoicesKPI,
      });
    }
    if (metrics.activeShipments > 5) {
      alerts.push({
        title:    t.dashboard.highLogistics,
        detail:   t.dashboard.highLogisticsDetail,
        severity: "warning",
        action:   t.dashboard.activeShipmentsKPI,
      });
    }
    if (metrics.openQuotations > 3) {
      alerts.push({
        title:    t.dashboard.openQuotations,
        detail:   t.dashboard.openQuotationsDetail,
        severity: "info",
        action:   t.dashboard.openQuotationsKPI,
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        title:    t.dashboard.systemOk,
        detail:   t.dashboard.allNormal,
        severity: "success",
      });
    }
    return alerts;
  }

  const alerts    = deriveAlerts();
  const criticals = alerts.filter((a) => a.severity === "danger").length;
  const warnings  = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px", boxShadow: "var(--shadow-sm)",
      display: "grid", gap: "14px",
      height: "100%", alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {t.dashboard.smartAlerts}
        </div>
        <div style={{
          padding: "2px 8px", borderRadius: "var(--radius-full)",
          background: criticals > 0 ? "var(--color-danger-bg)" : "var(--color-success-bg)",
          border: `1px solid ${criticals > 0 ? "var(--color-danger-border)" : "var(--color-success-border)"}`,
          fontSize: "11px", fontWeight: 600,
          color: criticals > 0 ? "var(--color-danger-text)" : "var(--color-success-text)",
        }}>
          {criticals > 0 ? `${criticals} ${t.dashboard.criticalItems.toLowerCase()}` : t.dashboard.noAlerts}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[
          { label: t.dashboard.criticalItems, count: criticals, color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
          { label: t.dashboard.attentionItems, count: warnings, color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
          { label: t.dashboard.stateItems,    count: criticals + warnings === 0 ? 1 : 0, color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
        ].map((item) => (
          <div key={item.label} style={{ padding: "8px", borderRadius: "var(--radius-sm)", background: item.bg, textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.count}</div>
            <div style={{ fontSize: "10px", color: item.color, marginTop: "2px", opacity: 0.8 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          return (
            <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", border: `1px solid ${cfg.border}`, background: cfg.bg, display: "grid", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: cfg.text }}>{alert.title}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "var(--radius-full)", background: cfg.text + "20", color: cfg.text }}>
                  {severityLabels[alert.severity]}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{alert.detail}</div>
              {alert.action && (
                <div style={{ fontSize: "11px", fontWeight: 600, color: cfg.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  {alert.action}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
