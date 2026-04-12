"use client";

import { useMemo } from "react";
import { DashboardMetrics } from "../hooks/useDashboard";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface HealthScoreProps { metrics: DashboardMetrics; }

function ScoreRing({ score }: { score: number }) {
  const r     = 36;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = score >= 80 ? "var(--color-success-text)"
    : score >= 50 ? "var(--color-warning-text)"
    : "var(--color-danger-text)";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border-faint)" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} dominantBaseline="central">{score}</text>
      <text x="50" y="64" textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">/100</text>
    </svg>
  );
}

export default function HealthScore({ metrics }: HealthScoreProps) {
  const { t, lang } = useTranslation();

  const score = useMemo(() => {
    let s = 60;
    s += Math.min(metrics.activeProspects * 3, 15);
    s += Math.min(metrics.openQuotations * 2, 10);
    s += Math.min(metrics.activeShipments * 2, 10);
    s -= Math.min(metrics.pendingInvoices * 5, 25);
    s -= metrics.criticalPending > 0 ? 10 : 0;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [metrics]);

  const label = score >= 80 ? t.dashboard.excellent
    : score >= 60 ? t.dashboard.good
    : score >= 40 ? t.dashboard.regular
    : t.dashboard.critical;

  const labelColor = score >= 80 ? "var(--color-success-text)"
    : score >= 60 ? "var(--color-brand-blue)"
    : score >= 40 ? "var(--color-warning-text)"
    : "var(--color-danger-text)";

  const desc = score >= 80
    ? (lang === "en" ? "Company operating at optimal conditions." : "La empresa opera en condiciones óptimas.")
    : score >= 60
    ? (lang === "en" ? "Stable operation with areas for improvement." : "Operación estable con áreas de mejora.")
    : (lang === "en" ? "Attention required in key modules." : "Se requiere atención en módulos clave.");

  const factors = [
    { label: t.dashboard.commercial, value: metrics.activeProspects > 0 ? t.general.active : lang === "en" ? "No activity" : "Sin actividad", ok: metrics.activeProspects > 0 },
    { label: t.dashboard.logistics,  value: metrics.activeShipments > 0 ? `${metrics.activeShipments} ${t.navItems.shipments.toLowerCase()}` : lang === "en" ? "No shipments" : "Sin embarques", ok: true },
    { label: t.dashboard.finances,   value: metrics.pendingInvoices === 0 ? (lang === "en" ? "Up to date" : "Al día") : `${metrics.pendingInvoices} ${lang === "en" ? "pending" : "pendientes"}`, ok: metrics.pendingInvoices === 0 },
    { label: lang === "en" ? "Activity" : "Actividad", value: metrics.openQuotations > 0 ? `${metrics.openQuotations} ${t.navItems.quotations.toLowerCase()}` : lang === "en" ? "No quotations" : "Sin cotizaciones", ok: metrics.openQuotations > 0 },
  ];

  const scoreHistory = [55, 58, 60, 57, 62, 59, score];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", boxShadow: "var(--shadow-sm)", display: "grid", gap: "14px", height: "100%", alignContent: "start" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        {t.dashboard.healthScore}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <ScoreRing score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: labelColor, marginBottom: "4px" }}>{label}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: "6px" }}>
        {factors.map((f) => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: f.ok ? "var(--color-success-text)" : "var(--color-danger-text)", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "var(--color-text-second)", fontWeight: 500 }}>{f.label}</span>
            </div>
            <span style={{ fontSize: "11px", color: f.ok ? "var(--color-success-text)" : "var(--color-danger-text)", fontWeight: 600 }}>{f.value}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "10px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          {t.dashboard.trend7days}
        </div>
        <div style={{ height: "32px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
          {scoreHistory.map((val, i) => {
            const h = Math.max((val / 100) * 100, 10);
            const isLast = i === scoreHistory.length - 1;
            return (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: `${h}%`, borderRadius: "2px 2px 0 0", background: isLast ? labelColor : "var(--color-border)", opacity: isLast ? 1 : 0.5 + (i / scoreHistory.length) * 0.5, transition: "height 0.6s ease" }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
