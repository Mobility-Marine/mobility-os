"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import type { ComprasDashboard } from "../types/compras.types";

type Props = { dashboard: ComprasDashboard };

export default function ComprasPipeline({ dashboard: d }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const router = useRouter();

  const stages = [
    {
      label:   es ? "Requisiciones"    : "Requisitions",
      total:   d.req_total,
      active:  d.req_pending,
      activeLabel: es ? "pendientes"  : "pending",
      color:   "var(--color-text-muted)",
      bg:      "var(--color-bg-subtle)",
      path:    "/abastecimiento/requisiciones",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
    },
    {
      label:   es ? "Cotizaciones RFQ" : "RFQs",
      total:   d.rfq_total,
      active:  d.rfq_open,
      activeLabel: es ? "abiertas"    : "open",
      color:   "var(--color-warning-text)",
      bg:      "var(--color-warning-bg)",
      path:    "/abastecimiento/cotizaciones",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      label:   es ? "Órdenes de Compra": "Purchase Orders",
      total:   d.po_total,
      active:  d.po_active,
      activeLabel: es ? "activas"     : "active",
      color:   "var(--color-brand-blue)",
      bg:      "var(--color-info-bg)",
      path:    "/abastecimiento/ordenes-compra",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    },
    {
      label:   es ? "Recepciones"      : "Receptions",
      total:   d.rec_pending + (d.po_total - d.po_active - d.po_pending_approval),
      active:  d.rec_pending,
      activeLabel: es ? "en proceso"  : "in progress",
      color:   "var(--color-success-text)",
      bg:      "var(--color-success-bg)",
      path:    "/abastecimiento/recepciones",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    },
  ];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>
        {es ? "Pipeline de compras" : "Procurement pipeline"}
      </div>

      <div style={{ display: "flex", alignItems: "stretch", gap: "0" }}>
        {stages.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            {/* Stage box */}
            <div onClick={() => router.push(s.path)}
              style={{ flex: 1, padding: "16px 14px", borderRadius: "var(--radius-md)", background: s.bg, border: `1px solid ${s.color}25`, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = s.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${s.color}25`)}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: "4px" }}>
                {s.total}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                <span style={{ fontWeight: 700, color: s.color }}>{s.active}</span> {s.activeLabel}
              </div>
            </div>

            {/* Arrow */}
            {i < stages.length - 1 && (
              <div style={{ padding: "0 8px", color: "var(--color-border-faint)", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Barra de progreso del pipeline */}
      <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
        {stages.map((s) => (
          <div key={s.label} style={{ height: "4px", borderRadius: "2px", background: s.color, opacity: s.total > 0 ? 1 : 0.15 }} />
        ))}
      </div>
    </div>
  );
}
