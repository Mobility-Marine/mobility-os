"use client";

import { useEffect, useState } from "react";
import { DashboardMetrics } from "../hooks/useDashboard";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CommandStripProps { metrics: DashboardMetrics; }

function Dot({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block", width: "7px", height: "7px",
      borderRadius: "50%", background: color, flexShrink: 0,
    }} />
  );
}

function LiveClock({ locale }: { locale: string }) {
  const [now, setNow] = useState(() => formatDate(new Date(), locale));
  useEffect(() => {
    const tick = () => setNow(formatDate(new Date(), locale));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);
  return (
    <div style={{
      fontSize: "12px", color: "var(--color-text-muted)",
      marginTop: "3px", textTransform: "capitalize",
      fontVariantNumeric: "tabular-nums",
    }}>
      {now}
    </div>
  );
}

function formatDate(date: Date, locale: string): string {
  const loc  = locale === "en" ? "en-US" : "es-MX";
  const day  = date.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" });
  const time = date.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${day}, ${time}`;
}

export default function CommandStrip({ metrics }: CommandStripProps) {
  const { t, lang } = useTranslation();

  const items = [
    { label: t.dashboard.status,    value: t.dashboard.operativeStatus,    dot: "var(--color-success-text)" },
    {
      label: t.dashboard.alerts,
      value: metrics.criticalPending > 0
        ? `${metrics.criticalPending} ${lang === "en" ? "active" : "activas"}`
        : t.dashboard.noAlerts,
      dot: metrics.criticalPending > 0 ? "var(--color-warning-text)" : "var(--color-success-text)",
    },
    { label: t.dashboard.prospects, value: String(metrics.activeProspects), dot: "var(--color-brand-blue)" },
    { label: t.dashboard.shipments, value: String(metrics.activeShipments), dot: "var(--color-brand-blue)" },
    { label: t.dashboard.ia,        value: t.dashboard.iaOnline,            dot: "var(--color-brand-blue)" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 24px",
      display: "flex", justifyContent: "space-between",
      alignItems: "center", gap: "16px", flexWrap: "wrap",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div>
        <div style={{
          fontSize: "10px", fontWeight: 600,
          letterSpacing: "1.2px", textTransform: "uppercase",
          color: "var(--color-text-muted)", marginBottom: "2px",
        }}>
          {t.dashboard.commandCenter}
        </div>
        <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
          Mobility OS
        </div>
        <LiveClock locale={lang} />
      </div>

      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center" }}>
        {items.map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              {item.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Dot color={item.dot} />
              <span style={{
                fontSize: "14px", fontWeight: 600,
                color: "var(--color-text-primary)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
