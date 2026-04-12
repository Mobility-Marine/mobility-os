"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { DashboardMetrics } from "../hooks/useDashboard";
import MetricCard from "./MetricCard";
import SparkChart from "./SparkChart";

interface HeroPanelProps { metrics: DashboardMetrics; }

const opsTrend       = [58, 64, 61, 72, 78, 74, 84];
const revenueTrend   = [42, 48, 51, 56, 60, 58, 67];
const logisticsTrend = [70, 68, 66, 74, 73, 79, 82];

const MONTHLY_GOAL = 100;

export default function HeroPanel({ metrics }: HeroPanelProps) {
  const { t, lang } = useTranslation();

  const pct = Math.min(Math.round((metrics.pendingInvoices / MONTHLY_GOAL) * 100), 100);
  const barColor = pct >= 80 ? "var(--color-success-text)"
    : pct >= 50 ? "var(--color-warning-text)"
    : "var(--color-brand-blue)";
  const daysLeft = new Date(
    new Date().getFullYear(), new Date().getMonth() + 1, 0
  ).getDate() - new Date().getDate();

  const summaryText = (() => {
    const inv = metrics.pendingInvoices;
    const pro = metrics.activeProspects;
    const shi = metrics.activeShipments;
    if (lang === "en") {
      return (
        (inv > 0 ? `${inv} pending invoice${inv > 1 ? "s" : ""} requiring attention. ` : "Collections up to date. ")
        + (pro > 0 ? `${pro} active prospect${pro > 1 ? "s" : ""} in commercial follow-up. ` : "No active prospects. ")
        + (shi > 0 ? `${shi} shipment${shi > 1 ? "s" : ""} in logistics operation.` : "No active shipments today.")
      );
    }
    return (
      (inv > 0 ? `Hay ${inv} factura${inv > 1 ? "s" : ""} pendiente${inv > 1 ? "s" : ""} que requieren atención. ` : "Cobranza al día, sin facturas pendientes. ")
      + (pro > 0 ? `${pro} prospecto${pro > 1 ? "s" : ""} activo${pro > 1 ? "s" : ""} en seguimiento comercial. ` : "Sin prospectos activos en este momento. ")
      + (shi > 0 ? `${shi} embarque${shi > 1 ? "s" : ""} en operación logística.` : "Sin embarques activos hoy.")
    );
  })();

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-xl)", padding: "20px", boxShadow: "var(--shadow-md)", display: "grid", gap: "16px", height: "100%", alignContent: "start" }}>

      {/* OBJETIVO MENSUAL */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
            {t.dashboard.monthlyGoal}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: barColor, lineHeight: 1.1 }}>{pct}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: "100%", height: "6px", borderRadius: "var(--radius-full)", background: "var(--color-border-faint)", overflow: "hidden", marginBottom: "4px" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: "var(--radius-full)", background: barColor, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{metrics.pendingInvoices} {t.dashboard.invoicesIssued}</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{t.dashboard.goal}: {MONTHLY_GOAL}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{t.dashboard.daysLeft}</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>{daysLeft}</div>
        </div>
      </div>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t.dashboard.operationalStatus}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{t.dashboard.executiveView}</div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontSize: "12px", fontWeight: 600, color: "var(--color-text-second)", flexShrink: 0 }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-success-text)", display: "inline-block" }} />
          {t.dashboard.activityHigh}
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
        <MetricCard title={t.dashboard.activeProspects}  value={String(metrics.activeProspects)} subtitle={t.dashboard.inTracking} />
        <MetricCard title={t.dashboard.quotations}       value={String(metrics.openQuotations)}  subtitle={t.dashboard.inProcess} />
        <MetricCard title={t.dashboard.activeShipments}  value={String(metrics.activeShipments)} subtitle={t.dashboard.inOperation} />
        <MetricCard title={t.dashboard.pendingInvoices}  value={String(metrics.pendingInvoices)} subtitle={t.dashboard.needAttention} tone={metrics.pendingInvoices > 0 ? "warning" : "default"} />
      </div>

      {/* SPARK CHARTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
        <SparkChart data={opsTrend}       title={t.dashboard.operationalPulse}  label={t.dashboard.last7days} />
        <SparkChart data={revenueTrend}   title={t.dashboard.revenueTrend}      label={t.dashboard.monthlyRhythm} />
        <SparkChart data={logisticsTrend} title={t.dashboard.logisticsCapacity} label={t.dashboard.loadVsAvailability} />
      </div>

      {/* RESUMEN OPERATIVO */}
      <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "6px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
          {t.dashboard.operationalSummary}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-second)", lineHeight: 1.6 }}>{summaryText}</div>
        <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
          {[
            { label: t.dashboard.commercial, ok: metrics.activeProspects > 0 || metrics.openQuotations > 0 },
            { label: t.dashboard.logistics,  ok: metrics.activeShipments >= 0 },
            { label: t.dashboard.finances,   ok: metrics.pendingInvoices === 0 },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.ok ? "var(--color-success-text)" : "var(--color-danger-text)" }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
