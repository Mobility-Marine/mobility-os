"use client";

import type { OrderKPIs } from "../types/orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { kpis: OrderKPIs | null };

export default function OrderCommandCenter({ kpis }: Props) {
  const { t, lang } = useTranslation();
  const locale      = lang === "en" ? "en-US" : "es-MX";
  const to          = (t.orders as any) ?? {};
  const fmt         = (n: number) => `$${n.toLocaleString(locale, { maximumFractionDigits: 0 })}`;

  if (!kpis) return null;

  const cards = [
    {
      label: to.totalOrders  ?? "Total pedidos",
      value: kpis.total,
      sub:   `${kpis.pending} ${to.statusPending ?? "pendientes"} · ${kpis.active} ${to.filterActive ?? "activos"}`,
      color: "var(--color-brand-blue)",
      bar:   kpis.total > 0 ? kpis.active / kpis.total : 0,
    },
    {
      label: to.totalValue   ?? "Valor total",
      value: fmt(kpis.totalValue),
      sub:   `${to.pendingValue ?? "Pendiente"}: ${fmt(kpis.pendingValue)}`,
      color: "var(--color-success-text)",
      bar:   kpis.totalValue > 0 ? kpis.deliveredValue / kpis.totalValue : 0,
    },
    {
      label: to.pendingValue  ?? "Valor pendiente",
      value: fmt(kpis.pendingValue),
      sub:   `${kpis.active} ${to.filterActive ?? "activos"}`,
      color: "var(--color-warning-text)",
      bar:   kpis.totalValue > 0 ? kpis.pendingValue / kpis.totalValue : 0,
    },
    {
      label: to.deliveredValue ?? "Valor entregado",
      value: fmt(kpis.deliveredValue),
      sub:   `${kpis.delivered} ${to.statusDelivered ?? "entregados"}`,
      color: "#a78bfa",
      bar:   kpis.totalValue > 0 ? kpis.deliveredValue / kpis.totalValue : 0,
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
