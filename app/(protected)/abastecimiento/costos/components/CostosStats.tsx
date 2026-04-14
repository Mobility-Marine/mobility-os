"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CostStats } from "../types/costos.types";

type Props = { stats: CostStats };

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function CostosStats({ stats }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const cards = [
    {
      label: es ? "Total artículos"      : "Total items",
      value: String(stats.total_items),
      color: "var(--color-text-primary)",
      bg:    "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    },
    {
      label: es ? "Valor inventario"     : "Inventory value",
      value: "$" + fmt(stats.total_stock_value),
      color: "var(--color-success-text)",
      bg:    "var(--color-success-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: es ? "Margen promedio"      : "Average margin",
      value: fmtP(stats.avg_margin) + "%",
      color: stats.avg_margin < 20 ? "var(--color-warning-text)" : stats.avg_margin < 0 ? "var(--color-danger-text)" : "var(--color-brand-blue)",
      bg:    stats.avg_margin < 20 ? "var(--color-warning-bg)"  : stats.avg_margin < 0 ? "var(--color-danger-bg)"  : "var(--color-info-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
    {
      label: es ? "Margen negativo"      : "Negative margin",
      value: String(stats.negative_margin),
      color: stats.negative_margin > 0 ? "var(--color-danger-text)"  : "var(--color-text-muted)",
      bg:    stats.negative_margin > 0 ? "var(--color-danger-bg)"    : "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
    },
    {
      label: es ? "Margen bajo (<20%)"   : "Low margin (<20%)",
      value: String(stats.low_margin),
      color: stats.low_margin > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)",
      bg:    stats.low_margin > 0 ? "var(--color-warning-bg)"   : "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    },
    {
      label: es ? "Sin precio de venta"  : "No sale price",
      value: String(stats.no_price),
      color: stats.no_price > 0 ? "var(--color-text-muted)"    : "var(--color-text-muted)",
      bg:    "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>{c.label}</div>
            <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
