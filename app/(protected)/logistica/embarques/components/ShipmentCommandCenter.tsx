"use client";

import type { ShipmentKPIs } from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { kpis: ShipmentKPIs | null };

export default function ShipmentCommandCenter({ kpis }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";
  const fmt         = (n: number) => `$${n.toLocaleString(locale, { maximumFractionDigits: 0 })}`;

  if (!kpis) return null;

  const cards = [
    {
      label: tl.shipments    ?? "Embarques",
      value: kpis.total,
      sub:   `${kpis.active} activos · ${kpis.delivered} entregados`,
      color: "var(--color-brand-blue)",
      bar:   kpis.total > 0 ? kpis.active / kpis.total : 0,
    },
    {
      label: tl.revenue      ?? "Ingresos",
      value: fmt(kpis.totalRevenue),
      sub:   `${kpis.delivered} operaciones entregadas`,
      color: "var(--color-success-text)",
      bar:   0,
    },
    {
      label: tl.profit       ?? "Ganancia",
      value: fmt(kpis.totalProfit),
      sub:   `Costo: ${fmt(kpis.totalCost)}`,
      color: kpis.totalProfit >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)",
      bar:   kpis.totalRevenue > 0 ? Math.max(0, kpis.totalProfit / kpis.totalRevenue) : 0,
    },
    {
      label: tl.margin       ?? "Margen promedio",
      value: `${kpis.avgMargin.toFixed(1)}%`,
      sub:   kpis.avgMargin >= 20 ? "Margen saludable" : kpis.avgMargin >= 10 ? "Margen moderado" : "Margen bajo",
      color: kpis.avgMargin >= 20 ? "var(--color-success-text)" : kpis.avgMargin >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)",
      bar:   Math.min(kpis.avgMargin / 40, 1),
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {card.label}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: card.color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
            {card.value}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{card.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: card.color, width: `${Math.min(card.bar * 100, 100)}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </>
  );
}
