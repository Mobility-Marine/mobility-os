"use client";

import { useEffect, useState } from "react";
import { DashboardMetrics } from "../hooks/useDashboard";

interface CommandStripProps {
  metrics: DashboardMetrics;
}

function Dot({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
    }} />
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => formatDate(new Date()));

  useEffect(() => {
    const tick = () => setNow(formatDate(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      fontSize: "12px",
      color: "var(--color-text-muted)",
      marginTop: "3px",
      textTransform: "capitalize",
      fontVariantNumeric: "tabular-nums",
    }}>
      {now}
    </div>
  );
}

function formatDate(date: Date): string {
  const day = date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const time = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${day}, ${time}`;
}

export default function CommandStrip({ metrics }: CommandStripProps) {
  const items = [
    {
      label: "Estado",
      value: "Operativo",
      dot: "var(--color-success-text)",
    },
    {
      label: "Alertas",
      value: metrics.criticalPending > 0 ? `${metrics.criticalPending} activas` : "Sin alertas",
      dot: metrics.criticalPending > 0 ? "var(--color-warning-text)" : "var(--color-success-text)",
    },
    {
      label: "Prospectos",
      value: String(metrics.activeProspects),
      dot: "var(--color-brand-blue)",
    },
    {
      label: "Embarques",
      value: String(metrics.activeShipments),
      dot: "var(--color-brand-blue)",
    },
    {
      label: "IA",
      value: "Online",
      dot: "var(--color-brand-blue)",
    },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div>
        <div style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          marginBottom: "2px",
        }}>
          Command Center
        </div>
        <div style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          lineHeight: 1,
        }}>
          Mobility OS
        </div>
        <LiveClock />
      </div>

      <div style={{
        display: "flex",
        gap: "28px",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        {items.map((item) => (
          <div key={item.label}>
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}>
              {item.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Dot color={item.dot} />
              <span style={{
                fontSize: "14px",
                fontWeight: 600,
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
