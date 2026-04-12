"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface AIPanelProps { companyState?: any; }

export default function AIPanel({ companyState }: AIPanelProps) {
  const router = useRouter();
  const { t }  = useTranslation();

  const suggestions = [
    { label: t.dashboard.criticalItems,   path: "/comercial/prospects" },
    { label: t.dashboard.scheduleEvent,   path: "/agenda" },
    { label: t.dashboard.toCollect,       path: "/finanzas/cxc" },
    { label: t.dashboard.activeShipmentsKPI, path: "/logistica/embarques" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-xl)",
      padding: "22px", boxShadow: "var(--shadow-md)",
      display: "grid", gap: "16px", alignContent: "start",
    }}>
      <div>
        <div style={{
          display: "inline-flex", alignItems: "center",
          padding: "3px 10px", borderRadius: "var(--radius-full)",
          background: "var(--color-brand-blue-light)",
          fontSize: "11px", fontWeight: 600,
          color: "var(--color-brand-blue)", marginBottom: "8px",
        }}>
          {t.dashboard.ia} Activa
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Mobility AI
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
          {t.nav.general} — {t.dashboard.operativeStatus}
        </div>
      </div>

      <div style={{
        padding: "14px", borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-subtle)",
        fontSize: "13px", color: "var(--color-text-second)",
        fontWeight: 500, lineHeight: 1.5,
      }}>
        {t.dashboard.criticalPending}?
      </div>

      <div>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          {t.dashboard.quickActions}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {suggestions.map((s) => (
            <button
              key={s.path}
              onClick={() => router.push(s.path)}
              style={{
                textAlign: "left", padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-faint)",
                background: "var(--color-bg-subtle)",
                color: "var(--color-text-second)",
                fontSize: "13px", fontWeight: 500,
                cursor: "pointer", transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background   = "var(--color-bg-hover)";
                el.style.borderColor  = "var(--color-brand-blue)";
                el.style.color        = "var(--color-brand-blue)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background   = "var(--color-bg-subtle)";
                el.style.borderColor  = "var(--color-border-faint)";
                el.style.color        = "var(--color-text-second)";
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        padding: "14px", borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-info-border)",
        background: "var(--color-info-bg)",
        display: "grid", gap: "6px",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-info-text)" }}>
          Insight {t.dashboard.ia}
        </div>
        <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--color-text-second)" }}>
          {companyState?.executive_summary ?? t.dashboard.openQuotationsDetail}
        </div>
      </div>
    </div>
  );
}
