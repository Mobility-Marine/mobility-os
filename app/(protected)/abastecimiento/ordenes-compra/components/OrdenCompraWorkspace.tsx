"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PurchaseOrder, POFilters, UpdatePOPayload } from "../types/ordenes-compra.types";
import { PO_STATUS_CONFIG } from "../types/ordenes-compra.types";
import { generateAndDownloadPOPDF } from "../services/ordenes-compra.pdf";
import { fetchPO } from "../services/ordenes-compra.service";

type Props = {
  order:       PurchaseOrder;
  saving:      boolean;
  filters:     POFilters;
  settings:    any;
  onUpdate:    (id: string, payload: UpdatePOPayload, filters: POFilters) => Promise<void>;
  onApprove:   (id: string, filters: POFilters) => Promise<void>;
  onSend:      (id: string, filters: POFilters) => Promise<void>;
  onCancel:    (id: string, reason: string, filters: POFilters) => Promise<void>;
  onClose:     () => void;
};

type Tab = "items" | "info" | "recepciones";

const fmt = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrdenCompraWorkspace({ order, saving, filters, settings, onUpdate, onApprove, onSend, onCancel, onClose }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [tab,          setTab]          = useState<Tab>("items");
  const [showCancel,   setShowCancel]   = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [downloading,  setDownloading]  = useState(false);

  const sc      = PO_STATUS_CONFIG[order.status];
  const items   = order.items ?? [];
  const canEdit = ["draft"].includes(order.status);
  const canApprove = order.status === "draft" || order.status === "pending_approval";
  const canSend    = order.status === "approved";
  const canCancel  = !["complete", "cancelled"].includes(order.status);

  const totalQty    = items.reduce((s, i) => s + Number(i.quantity), 0);
  const receivedQty = items.reduce((s, i) => s + Number(i.quantity_received ?? 0), 0);
  const pct = totalQty > 0 ? Math.round((receivedQty / totalQty) * 100) : 0;

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const fresh = await fetchPO(order.id);
      if (fresh) await generateAndDownloadPOPDF(fresh, settings);
    } catch (e: any) { console.error(e); }
    finally { setDownloading(false); }
  }

  const TABS: { key: Tab; labelEs: string; labelEn: string }[] = [
    { key: "items",       labelEs: "Ítems",      labelEn: "Items"     },
    { key: "recepciones", labelEs: "Recepciones", labelEn: "Receptions"},
    { key: "info",        labelEs: "Información", labelEn: "Info"      },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>{order.po_number}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                {es ? sc.labelEs : sc.labelEn}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{order.supplier?.name ?? "—"}</span>
              {order.currency && <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{order.currency}</span>}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* PDF */}
          <button onClick={handleDownloadPDF} disabled={downloading} style={{ height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {downloading ? (es ? "Generando…" : "Generating…") : "PDF"}
          </button>

          {/* Aprobar */}
          {canApprove && (
            <button onClick={() => onApprove(order.id, filters)} disabled={saving} style={{ height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Aprobar" : "Approve"}
            </button>
          )}

          {/* Enviar */}
          {canSend && (
            <button onClick={() => onSend(order.id, filters)} disabled={saving} style={{ height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-brand-blue)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Marcar enviada" : "Mark as sent"}
            </button>
          )}

          {/* Cancelar */}
          {canCancel && !showCancel && (
            <button onClick={() => setShowCancel(true)} style={{ height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {es ? "Cancelar OC" : "Cancel PO"}
            </button>
          )}
        </div>
      </div>

      {/* Panel cancelación */}
      {showCancel && (
        <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", display: "grid", gap: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-danger-text)" }}>
            {es ? "¿Cancelar esta OC?" : "Cancel this PO?"}
          </div>
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={es ? "Motivo de cancelación…" : "Cancellation reason…"}
            style={{ height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { await onCancel(order.id, cancelReason, filters); setShowCancel(false); }} disabled={saving} style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Confirmar cancelación" : "Confirm cancel"}
            </button>
            <button onClick={() => setShowCancel(false)} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
              {es ? "Volver" : "Back"}
            </button>
          </div>
        </div>
      )}

      {/* Barra de progreso de recepción */}
      {totalQty > 0 && (
        <div style={{ padding: "12px 16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{es ? "Progreso de recepción" : "Reception progress"}</span>
            <span style={{ fontWeight: 700, color: pct === 100 ? "var(--color-success-text)" : "var(--color-brand-blue)" }}>{pct}% ({fmt(receivedQty)} / {fmt(totalQty)})</span>
          </div>
          <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? "var(--color-success-text)" : "var(--color-brand-blue)", borderRadius: "3px", transition: "width 0.4s" }} />
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "1px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === t.key ? "var(--color-bg-base)" : "transparent", border: tab === t.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0" }}>
            {es ? t.labelEs : t.labelEn}
          </button>
        ))}
      </div>

      {/* TAB: ÍTEMS */}
      {tab === "items" && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 100px 90px 90px 90px 90px", padding: "8px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>{es ? "Descripción" : "Description"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Cant." : "Qty"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Unidad" : "Unit"}</span>
            <span style={{ textAlign: "right" }}>{es ? "P. Unit." : "Unit price"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Desc." : "Disc."}</span>
            <span style={{ textAlign: "right" }}>{es ? "Subtotal" : "Subtotal"}</span>
            <span style={{ textAlign: "right" }}>{es ? "Recibido" : "Received"}</span>
            <span style={{ textAlign: "right" }}>{es ? "Pendiente" : "Pending"}</span>
          </div>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 80px 80px 100px 90px 90px 90px 90px", padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
              <div style={{ textAlign: "center", fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>{item.quantity}</div>
              <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)" }}>{item.unit}</div>
              <div style={{ textAlign: "right", fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>${fmt(item.unit_price)}</div>
              <div style={{ textAlign: "center", fontSize: "11px", color: (item.discount_pct ?? 0) > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)" }}>
                {(item.discount_pct ?? 0) > 0 ? item.discount_pct + "%" : "—"}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(item.subtotal)}</div>
              <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>{fmt(item.quantity_received ?? 0)}</div>
              <div style={{ textAlign: "right", fontSize: "11px", color: (item.quantity_pending ?? 0) > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmt(item.quantity_pending ?? 0)}</div>
            </div>
          ))}
          {/* Totales */}
          <div style={{ padding: "12px 16px", background: "var(--color-bg-subtle)", borderTop: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: "240px", display: "grid", gap: "4px" }}>
              {[
                { l: es ? "Subtotal" : "Subtotal",      v: order.currency + " $" + fmt(order.subtotal)      },
                { l: `IVA ${order.tax_rate ?? 16}%`,    v: order.currency + " $" + fmt(order.tax_amount)    },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, paddingTop: "6px", borderTop: "1px solid var(--color-border-faint)", marginTop: "4px" }}>
                <span>TOTAL</span>
                <span style={{ color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>{order.currency} ${fmt(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RECEPCIONES */}
      {tab === "recepciones" && (
        <div style={{ padding: "20px", textAlign: "center", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Recepciones vinculadas" : "Linked receptions"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {es ? "Ve a Recepciones de Compras para ver y crear recepciones de esta OC." : "Go to Purchase Receptions to view and create receptions for this PO."}
          </div>
        </div>
      )}

      {/* TAB: INFO */}
      {tab === "info" && (
        <div style={{ display: "grid", gap: "8px" }}>
          {[
            { l: es ? "Número"             : "Number",          v: order.po_number },
            { l: es ? "Proveedor"          : "Supplier",        v: order.supplier?.name },
            { l: es ? "RFC proveedor"      : "Supplier tax ID", v: order.supplier?.tax_id },
            { l: es ? "Fecha de orden"     : "Order date",      v: order.order_date ? new Date(order.order_date).toLocaleDateString(es ? "es-MX" : "en-US") : undefined },
            { l: es ? "Fecha esperada"     : "Expected date",   v: order.expected_date ? new Date(order.expected_date).toLocaleDateString(es ? "es-MX" : "en-US") : undefined },
            { l: es ? "Moneda"             : "Currency",        v: order.currency },
            { l: es ? "Cond. pago"         : "Payment terms",   v: order.payment_terms },
            { l: es ? "Términos entrega"   : "Delivery terms",  v: order.delivery_terms },
            { l: es ? "Dirección entrega"  : "Ship to",         v: order.ship_to_address },
            { l: es ? "Aprobado"           : "Approved at",     v: order.approved_at ? new Date(order.approved_at).toLocaleDateString(es ? "es-MX" : "en-US") : undefined },
            { l: es ? "Motivo cancelación" : "Cancel reason",   v: order.cancel_reason },
          ].map((r) => r.v ? (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12px" }}>
              <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>{r.l}</span>
              <span style={{ color: "var(--color-text-primary)" }}>{r.v}</span>
            </div>
          ) : null)}
          {order.notes && (
            <div style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--color-brand-blue)" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Notas" : "Notes"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>{order.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
