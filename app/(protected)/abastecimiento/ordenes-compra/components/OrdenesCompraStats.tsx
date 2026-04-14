"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { POStats } from "../types/ordenes-compra.types";

type Props = { stats: POStats };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrdenesCompraStats({ stats }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const cards = [
    {
      label: es ? "Total OCs"          : "Total POs",
      value: String(stats.total),
      color: "var(--color-text-primary)",
      bg:    "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      label: es ? "Pend. aprobación"   : "Pending approval",
      value: String(stats.pending_approval),
      color: "var(--color-warning-text)",
      bg:    "var(--color-warning-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      label: es ? "Aprobadas / Enviadas": "Approved / Sent",
      value: String(stats.approved + stats.sent),
      color: "var(--color-brand-blue)",
      bg:    "var(--color-info-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>,
    },
    {
      label: es ? "Recep. parcial"      : "Partial receipt",
      value: String(stats.partial),
      color: "#a78bfa",
      bg:    "#ede9fe",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    },
    {
      label: es ? "Valor total"         : "Total value",
      value: "$" + fmt(stats.total_value),
      color: "var(--color-success-text)",
      bg:    "var(--color-success-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: es ? "Valor pendiente"     : "Pending value",
      value: "$" + fmt(stats.pending_value),
      color: "var(--color-warning-text)",
      bg:    "var(--color-warning-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
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
