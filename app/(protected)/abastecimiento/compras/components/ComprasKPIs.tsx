"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import type { ComprasDashboard } from "../types/compras.types";

type Props = { dashboard: ComprasDashboard };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ComprasKPIs({ dashboard: d }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const router = useRouter();

  const cards = [
    {
      label: es ? "Gasto del mes"        : "This month spend",
      value: "$" + fmt(d.po_value_month),
      sub:   es ? "en órdenes de compra" : "in purchase orders",
      color: "var(--color-brand-blue)",
      bg:    "var(--color-info-bg)",
      path:  "/abastecimiento/ordenes-compra",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: es ? "OCs activas"          : "Active POs",
      value: String(d.po_active),
      sub:   `$${fmt(d.po_value_active)} ${es ? "pendiente de recibir" : "pending receipt"}`,
      color: "var(--color-success-text)",
      bg:    "var(--color-success-bg)",
      path:  "/abastecimiento/ordenes-compra",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
    },
    {
      label: es ? "OCs por aprobar"      : "POs to approve",
      value: String(d.po_pending_approval),
      sub:   d.po_overdue > 0 ? `${d.po_overdue} ${es ? "atrasadas" : "overdue"}` : (es ? "Al día" : "On time"),
      color: d.po_pending_approval > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)",
      bg:    d.po_pending_approval > 0 ? "var(--color-warning-bg)"   : "var(--color-bg-base)",
      path:  "/abastecimiento/ordenes-compra",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      label: es ? "Recepciones pendientes": "Pending receipts",
      value: String(d.rec_pending),
      sub:   d.rec_discrepancies > 0 ? `${d.rec_discrepancies} ${es ? "con discrepancias" : "with discrepancies"}` : (es ? "Sin discrepancias" : "No discrepancies"),
      color: d.rec_pending > 0 ? "var(--color-brand-blue)" : "var(--color-text-muted)",
      bg:    d.rec_pending > 0 ? "var(--color-info-bg)"    : "var(--color-bg-base)",
      path:  "/abastecimiento/recepciones",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    },
    {
      label: es ? "Alertas de stock"     : "Stock alerts",
      value: String(d.stock_alerts),
      sub:   es ? "artículos bajo mínimo" : "items below minimum",
      color: d.stock_alerts > 0 ? "var(--color-danger-text)"  : "var(--color-text-muted)",
      bg:    d.stock_alerts > 0 ? "var(--color-danger-bg)"    : "var(--color-bg-base)",
      path:  "/abastecimiento/inventarios",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
    },
    {
      label: es ? "Proveedores activos"  : "Active suppliers",
      value: String(d.suppliers_active),
      sub:   `${d.rfq_open} ${es ? "cotizaciones abiertas" : "open RFQs"}`,
      color: "var(--color-text-primary)",
      bg:    "var(--color-bg-base)",
      path:  "/comercial/partners?role=supplier",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>
      {cards.map((c) => (
        <div key={c.label} onClick={() => router.push(c.path)}
          style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px", cursor: "pointer", transition: "border-color 0.15s", display: "flex", flexDirection: "column", gap: "10px" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.color)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-faint)")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3, flex: 1 }}>{c.label}</div>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.3 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
