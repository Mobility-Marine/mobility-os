"use client";

import type { ProductKPIs } from "../services/products.service";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { kpis: ProductKPIs | null };

export default function ProductCommandCenter({ kpis }: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";
  const fmt = (n: number) => `$${n.toLocaleString(locale, { maximumFractionDigits: 0 })}`;

  if (!kpis) return null;

  const tp = (t.products as any) ?? {};

const cards = [
    {
      label: tp.catalog           ?? "Catálogo",
      value: kpis.total,
      sub:   `${kpis.active} ${tp.active ?? "activos"} · ${kpis.inactive} ${tp.inactive ?? "inactivos"}`,
      color: "var(--color-brand-blue)",
      bar:   kpis.total > 0 ? kpis.active / kpis.total : 0,
    },
    {
      label: tp.inventoryValue    ?? "Valor de inventario",
      value: fmt(kpis.totalValue),
      sub:   `${tp.cost ?? "Costo"}: ${fmt(kpis.totalCost)}`,
      color: "var(--color-success-text)",
      bar:   kpis.totalValue > 0 ? kpis.totalCost / kpis.totalValue : 0,
    },
    {
      label: tp.avgMargin         ?? "Margen promedio",
      value: `${kpis.margin.toFixed(1)}%`,
      sub:   `${kpis.categories} ${tp.categories ?? "categorías"}`,
      color: kpis.margin >= 30 ? "var(--color-success-text)" : kpis.margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)",
      bar:   Math.min(kpis.margin / 100, 1),
    },
    {
      label: tp.stockAlerts       ?? "Alertas de stock",
      value: kpis.lowStock + kpis.noStock,
      sub:   `${kpis.noStock} ${tp.noStock ?? "sin stock"} · ${kpis.lowStock} ${tp.lowStock ?? "bajo mínimo"}`,
      color: kpis.noStock > 0 ? "var(--color-danger-text)" : kpis.lowStock > 0 ? "var(--color-warning-text)" : "var(--color-success-text)",
      bar:   kpis.total > 0 ? (kpis.lowStock + kpis.noStock) / kpis.total : 0,
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
          <div style={{ fontSize: "26px", fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{card.sub}</div>
          <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
            <div style={{
              height: "100%", borderRadius: "var(--radius-full)", background: card.color,
              width: `${Math.min(card.bar * 100, 100)}%`, transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </>
  );
}
