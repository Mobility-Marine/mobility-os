"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  stats: { total: number; complete: number; partial: number; pending: number; discrepancies: number };
};

export default function RecepcionStats({ stats }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const cards = [
    {
      label: es ? "Total recepciones"  : "Total receptions",
      value: stats.total,
      color: "var(--color-text-primary)",
      bg:    "var(--color-bg-base)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
    },
    {
      label: es ? "Completadas"  : "Complete",
      value: stats.complete,
      color: "var(--color-success-text)",
      bg:    "var(--color-success-bg)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
    {
      label: es ? "Parciales"  : "Partial",
      value: stats.partial,
      color: "var(--color-warning-text)",
      bg:    "var(--color-warning-bg)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: es ? "En proceso"  : "In Progress",
      value: stats.pending,
      color: "var(--color-brand-blue)",
      bg:    "var(--color-info-bg)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
        </svg>
      ),
    },
    {
      label: es ? "Con diferencias"  : "Discrepancies",
      value: stats.discrepancies,
      color: "var(--color-danger-text)",
      bg:    "var(--color-danger-bg)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {c.label}
            </div>
            <div style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.icon}
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: c.color, fontVariantNumeric: "tabular-nums" }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
