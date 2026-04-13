"use client";
import type { TransportUnit } from "../types/transport.types";
import { getUnitAlerts }      from "../types/transport.types";
import { useTranslation }     from "@/lib/i18n/useTranslation";

type Props = { units: TransportUnit[] };

export default function TransportCommandCenter({ units }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  const total       = units.length;
  const active      = units.filter((u) => u.status === "active").length;
  const maintenance = units.filter((u) => u.status === "maintenance").length;
  const withAlerts  = units.filter((u) => getUnitAlerts(u).length > 0).length;

  const cards = [
    { label: tl.totalUnits       ?? "Total unidades",    value: total,       sub: "En catálogo",               color: "var(--color-brand-blue)",   bar: 1 },
    { label: tl.activeUnits      ?? "Activas",           value: active,      sub: "Disponibles para operar",   color: "var(--color-success-text)", bar: total > 0 ? active/total : 0 },
    { label: tl.maintenanceUnits ?? "Mantenimiento",     value: maintenance, sub: "Fuera de servicio temporal", color: "#d97706",                   bar: total > 0 ? maintenance/total : 0 },
    { label: tl.docsExpiring     ?? "Docs por vencer",   value: withAlerts,  sub: "Requieren atención",         color: withAlerts > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", bar: total > 0 ? withAlerts/total : 0 },
  ];

  return (
    <>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: c.color, width: `${Math.min(c.bar * 100, 100)}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </>
  );
}
