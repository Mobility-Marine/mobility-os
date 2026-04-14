"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { FacturacionStats } from "../types/facturacion.types";

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FacturacionStats({ stats: s }: { stats: FacturacionStats }) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const cards = [
    {
      label: es ? "Facturado este mes"   : "Invoiced this month",
      value: "$" + fmt(s.total_month),
      sub:   `${s.count_month} ${es ? "facturas" : "invoices"}`,
      color: "var(--color-brand-blue)", bg: "var(--color-info-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      label: es ? "Pago pendiente (PPD)" : "Pending payment (PPD)",
      value: "$" + fmt(s.total_pending_pay),
      sub:   `${s.count_pending_pay} ${es ? "documentos" : "documents"}`,
      color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      label: es ? "Canceladas"           : "Cancelled",
      value: String(s.count_cancelled),
      sub:   es ? "de todos los tiempos" : "all time",
      color: s.count_cancelled > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)",
      bg:    s.count_cancelled > 0 ? "var(--color-danger-bg)"   : "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    },
    {
      label: es ? "Total emitidas"       : "Total issued",
      value: String(s.count_total),
      sub:   es ? "histórico completo"   : "complete history",
      color: "var(--color-text-primary)", bg: "var(--color-bg-base)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
      {cards.map((c) => (
        <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", flex: 1 }}>{c.label}</div>
            <div style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
