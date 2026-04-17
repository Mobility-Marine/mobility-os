"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

function getActions(t: any) {
  return [
    {
      label: t.dashboard.newProspect,
      hint:  t.dashboard.newProspectHint,
      path:  "/comercial/prospects",
      color: "var(--color-brand-blue)",
      bg:    "var(--color-brand-blue-light)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      ),
    },
    {
      label: t.dashboard.scheduleEvent,
      hint:  t.dashboard.scheduleEventHint,
      path:  "/agenda",
      color: "var(--color-info-text)",
      bg:    "var(--color-info-bg)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: t.dashboard.newQuotation,
      hint:  t.dashboard.newQuotationHint,
      path:  "/comercial/cotizaciones",
      color: "var(--color-warning-text)",
      bg:    "var(--color-warning-bg)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
    },
    {
      label: t.dashboard.scheduleShipment,
      hint:  t.dashboard.scheduleShipmentHint,
      path:  "/logistica/embarques",
      color: "var(--color-success-text)",
      bg:    "var(--color-success-bg)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    },
    {
      label: t.dashboard.viewCRM,
      hint:  t.dashboard.viewCRMHint,
      path:  "/comercial/crm",
      color: "var(--color-brand-blue)",
      bg:    "var(--color-brand-blue-light)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: t.dashboard.executiveSummaryIA,
      hint:  t.dashboard.executiveSummaryIAHint,
      path:  "/dashboard",
      color: "var(--color-brand-orange)",
      bg:    "var(--color-brand-orange-light)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      ),
    },
  ];
}

export default function QuickActions() {
  const router = useRouter();
  const { t }  = useTranslation();
  const actions = getActions(t);

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid", gap: "14px",
      height: "100%", alignContent: "start",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
        {t.dashboard.quickActions}
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.path)}
            style={{
              textAlign: "left", padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-faint)",
              background: "var(--color-bg-subtle)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "12px",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background    = action.bg;
              el.style.borderColor   = action.color + "40";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background    = "var(--color-bg-subtle)";
              el.style.borderColor   = "var(--color-border-faint)";
            }}
          >
            <div style={{
              width: "32px", height: "32px",
              borderRadius: "var(--radius-md)",
              background: `${action.color}18`,
              border: `1px solid ${action.color}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: action.color, flexShrink: 0,
            }}>
              {action.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                {action.label}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                {action.hint}
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
