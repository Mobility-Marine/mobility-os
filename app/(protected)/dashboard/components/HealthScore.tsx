"use client";

import { useMemo } from "react";
import { DashboardMetrics } from "../hooks/useDashboard";

interface HealthScoreProps {
  metrics: DashboardMetrics;
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "var(--color-success-text)" : score >= 50 ? "var(--color-warning-text)" : "var(--color-danger-text)";

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border-faint)" strokeWidth="8"/>
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="700" fill={color} dominantBaseline="central">
        {score}
      </text>
      <text x="50" y="64" textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
        /100
      </text>
    </svg>
  );
}

export default function HealthScore({ metrics }: HealthScoreProps) {
  const score = useMemo(() => {
    let s = 60;
    s += Math.min(metrics.activeProspects * 3, 15);
    s += Math.min(metrics.openQuotations * 2, 10);
    s += Math.min(metrics.activeShipments * 2, 10);
    s -= Math.min(metrics.pendingInvoices * 5, 25);
    s -= metrics.criticalPending > 0 ? 10 : 0;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [metrics]);

  const label = score >= 80 ? "Excelente" : score >= 60 ? "Bueno" : score >= 40 ? "Regular" : "Crítico";
  const labelColor = score >= 80 ? "var(--color-success-text)" : score >= 60 ? "var(--color-brand-blue)" : score >= 40 ? "var(--color-warning-text)" : "var(--color-danger-text)";

  const factors = [
    { label: "Comercial",  ok: metrics.activeProspects > 0 },
    { label: "Logística",  ok: metrics.activeShipments >= 0 },
    { label: "Finanzas",   ok: metrics.pendingInvoices === 0 },
    { label: "Actividad",  ok: metrics.openQuotations > 0 },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "12px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        Health Score
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <ScoreRing score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: labelColor, marginBottom: "10px" }}>
            {label}
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {factors.map((f) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: f.ok ? "var(--color-success-text)" : "var(--color-danger-text)",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
