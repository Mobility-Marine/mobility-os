"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus, POTemplate } from "../types/orders.types";
import { ORDER_STATUS_CONFIG, NEXT_STATUS, STATUS_FLOW } from "../types/orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { generateAndDownloadPO } from "../services/orders.pdf";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Tab = "detail" | "items" | "delivery" | "timeline";

type Props = {
  order:          Order | null;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
  onUpdate:       (id: string, updates: Partial<Order>) => Promise<void>;
  saving:         boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function OrderWorkspace({ order, onStatusChange, onUpdate, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const router        = useRouter();
  const locale        = lang === "en" ? "en-US" : "es-MX";
  const to            = (t.orders as any) ?? {};

  const [tab,         setTab]         = useState<Tab>("detail");
  const [editing,     setEditing]     = useState(false);
  const [form,        setForm]        = useState<Partial<Order>>({});
  const [confirmNext, setConfirmNext] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [genPDF,      setGenPDF]      = useState(false);
  const [poTemplate,  setPOTemplate]  = useState<POTemplate>("elegante");

  if (!order) return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "32px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "12px", height: "100%",
    }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {to.workspaceEmpty ?? "Selecciona un pedido"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
        {to.workspaceEmptyDesc ?? "Aquí verás el detalle, productos, entrega y podrás generar la orden de compra."}
      </div>
    </div>
  );

  const statusCfg   = ORDER_STATUS_CONFIG[order.status];
  const nextStatus  = NEXT_STATUS[order.status];
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const isDone      = isCancelled || isDelivered;
  const items       = order.items ?? [];
  const clientName  = order.client?.name ?? "—";

  const TABS: { key: Tab; label: string }[] = [
    { key: "detail",   label: to.tabDetail   ?? "Detalle"   },
    { key: "items",    label: to.tabItems    ?? "Productos" },
    { key: "delivery", label: to.tabDelivery ?? "Entrega"   },
    { key: "timeline", label: to.tabTimeline ?? "Historial" },
  ];

  // Etiquetas de acciones
  const NEXT_LABELS: Partial<Record<OrderStatus, string>> = {
    confirmed:      to.startPreparation ?? "Iniciar preparación",
    in_preparation: to.markShipped      ?? "Marcar como enviado",
    shipped:        to.markDelivered    ?? "Marcar como entregado",
    pending:        to.confirm          ?? "Confirmar pedido",
  };

  async function handleNextStatus() {
    if (!nextStatus) return;
    await onStatusChange(order.id, nextStatus);
    setConfirmNext(false);
  }

  async function handleCancel() {
    await onStatusChange(order.id, "cancelled");
    setConfirmCancel(false);
  }

  async function handleDownloadPO() {
    if (!companyId) return;
    setGenPDF(true);
    try {
      const settings = await fetchCompanySettings(companyId);
      await generateAndDownloadPO(order, settings, poTemplate);
    } finally { setGenPDF(false); }
  }

  function set(k: keyof Order, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  // Progreso del flujo
  const currentStep = statusCfg.step;

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {order.order_number}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: "var(--radius-full)",
                background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                fontSize: "10px", fontWeight: 700, color: statusCfg.color, textTransform: "uppercase",
              }}>
                {to[`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}`] ?? order.status}
              </span>
              {order.priority !== "normal" && (
                <span style={{
                  padding: "2px 7px", borderRadius: "var(--radius-full)", fontSize: "10px", fontWeight: 700,
                  background: `${(PRIORITY_CONFIG as any)[order.priority]?.color}20`,
                  color: (PRIORITY_CONFIG as any)[order.priority]?.color,
                  border: `1px solid ${(PRIORITY_CONFIG as any)[order.priority]?.color}40`,
                }}>
                  {to[`priority${order.priority.charAt(0).toUpperCase()}${order.priority.slice(1)}`] ?? order.priority}
                </span>
              )}
              {order.quotation?.quote_number && (
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  ← {order.quotation.quote_number}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{clientName}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {order.currency} ${Number(order.total).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {items.length} {to.tabItems ?? "productos"}
            </div>
          </div>
        </div>

        {/* PROGRESO VISUAL */}
        {!isCancelled && (
          <div style={{ display: "flex", gap: "0", marginBottom: "10px", alignItems: "center" }}>
            {STATUS_FLOW.map((s, i) => {
              const sCfg  = ORDER_STATUS_CONFIG[s];
              const done  = sCfg.step < currentStep;
              const cur   = s === order.status;
              const label = to[`status${s.charAt(0).toUpperCase()}${s.slice(1).replace("_p","P").replace("_preparation","Preparation")}`] ?? s;
              return (
                <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1, height: "2px", background: done || cur ? sCfg.color : "var(--color-border-faint)" }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <div style={{
                      width: "10px", height: "10px", borderRadius: "50%",
                      background: done ? "var(--color-success-text)" : cur ? sCfg.color : "var(--color-border-faint)",
                      border: `2px solid ${done ? "var(--color-success-text)" : cur ? sCfg.color : "var(--color-border-faint)"}`,
                    }} />
                    <span style={{ fontSize: "8px", color: cur ? sCfg.color : "var(--color-text-muted)", fontWeight: cur ? 700 : 400, whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{ flex: 1, height: "2px", background: done ? "var(--color-success-text)" : "var(--color-border-faint)" }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {/* Avanzar estado */}
          {nextStatus && !isDone && (
            !confirmNext ? (
              <button onClick={() => setConfirmNext(true)} disabled={saving} style={{
                height: "28px", padding: "0 14px", borderRadius: "var(--radius-md)",
                background: ORDER_STATUS_CONFIG[nextStatus].color, color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                {NEXT_LABELS[order.status] ?? "Avanzar"}
              </button>
            ) : (
              <>
                <button onClick={handleNextStatus} disabled={saving} style={{
                  height: "28px", padding: "0 14px", borderRadius: "var(--radius-md)",
                  background: "var(--color-success-text)", color: "#fff", border: "none",
                  fontSize: "11px", fontWeight: 700, cursor: "pointer",
                }}>
                  {saving ? t.general.loading : `✓ ${to.confirmAction ?? "Confirmar"}`}
                </button>
                <button onClick={() => setConfirmNext(false)} style={{
                  height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
                }}>
                  {t.general.cancel}
                </button>
              </>
            )
          )}

          {/* Editar */}
          {!isDone && !editing && (
            <button onClick={() => { setForm({ ...order }); setEditing(true); }} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t.general.edit ?? "Editar"}
            </button>
          )}

          {editing && (
            <>
              <button onClick={async () => { await onUpdate(order.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{
                height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-success-text)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
              }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{
                height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
              }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {/* PDF Orden de compra */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <select value={poTemplate} onChange={(e) => setPOTemplate(e.target.value as POTemplate)} style={{
              height: "28px", padding: "0 6px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              color: "var(--color-text-muted)", fontSize: "10px", cursor: "pointer",
            }}>
              {(["elegante", "moderna", "corporativa"] as POTemplate[]).map((tpl) => (
                <option key={tpl} value={tpl} style={{ textTransform: "capitalize" }}>{tpl}</option>
              ))}
            </select>
            <button onClick={handleDownloadPO} disabled={genPDF} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-brand-blue)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {genPDF ? t.general.loading : (to.generatePO ?? "Orden de compra")}
            </button>
          </div>

          {/* Ver cotización origen */}
          {order.quotation_id && (
            <button onClick={() => router.push("/comercial/cotizaciones")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
              color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              ← {to.viewQuotation ?? "Ver cotización"}
            </button>
          )}

          {/* Cancelar */}
          {!isDone && (
            !confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} style={{
                height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              }}>
                {to.cancelOrder ?? "Cancelar"}
              </button>
            ) : (
              <>
                <button onClick={handleCancel} style={{
                  height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                  background: "var(--color-danger-text)", color: "#fff", border: "none",
                  fontSize: "11px", fontWeight: 700, cursor: "pointer",
                }}>
                  {to.confirmCancel ?? "¿Confirmar cancelación?"}
                </button>
                <button onClick={() => setConfirmCancel(false)} style={{
                  height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
                }}>
                  {(t.general as any).no ?? "No"}
                </button>
              </>
            )
          )}

          {/* Generar factura (solo cuando entregado) */}
          {isDelivered && !order.invoice_id && (
            <button onClick={() => router.push("/finanzas/facturacion")} style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
              color: "var(--color-warning-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              {to.generateInvoice ?? "Generar factura"}
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            height: "36px", padding: "0 14px", border: "none", background: "transparent",
            borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
            color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400,
            cursor: "pointer", transition: "var(--transition-fast)",
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── DETAIL ── */}
        {tab === "detail" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { k: "priority",     label: to.priority    ?? "Prioridad" },
                  { k: "currency",     label: to.currency    ?? "Moneda"    },
                  { k: "delivery_date",label: to.deliveryDate ?? "Fecha entrega", type: "date" },
                ].map((f) => (
                  <div key={f.k}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    {f.k === "priority" ? (
                      <select value={(form as any)[f.k] ?? "normal"} onChange={(e) => set(f.k as keyof Order, e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                        {["low","normal","high","urgent"].map((p) => (
                          <option key={p} value={p}>{to[`priority${p.charAt(0).toUpperCase()}${p.slice(1)}`] ?? p}</option>
                        ))}
                      </select>
                    ) : (
                      <input type={f.type ?? "text"} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof Order, e.target.value)} style={INPUT} />
                    )}
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{to.notes ?? "Notas"}</div>
                  <textarea value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{to.internalNotes ?? "Notas internas"}</div>
                  <textarea value={(form as any).internal_notes ?? ""} onChange={(e) => set("internal_notes", e.target.value)} rows={2} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: to.orderNumber ?? "No. Pedido",      value: order.order_number },
                  { label: to.quotation   ?? "Cotización",       value: order.quotation?.quote_number },
                  { label: to.client      ?? "Cliente",          value: clientName },
                  { label: to.currency    ?? "Moneda",           value: order.currency },
                  { label: to.priority    ?? "Prioridad",        value: to[`priority${order.priority.charAt(0).toUpperCase()}${order.priority.slice(1)}`] ?? order.priority },
                  { label: to.deliveryDate ?? "Fecha entrega",   value: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString(locale) : null },
                  { label: to.confirmedAt ?? "Confirmado",       value: order.confirmed_at ? new Date(order.confirmed_at).toLocaleDateString(locale) : null },
                  { label: to.deliveredAt ?? "Entregado",        value: order.delivered_at ? new Date(order.delivered_at).toLocaleDateString(locale) : null },
                ].map((r) => r.value ? (
                  <div key={r.label}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{r.value}</div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* Totales */}
            <div style={{ maxWidth: "340px", marginLeft: "auto", display: "grid", gap: "5px" }}>
              {[
                { label: to.subtotal ?? "Subtotal", value: order.subtotal },
                ...(order.discount_amount > 0 ? [{ label: to.discount ?? "Descuento", value: -order.discount_amount }] : []),
                { label: `IVA ${order.tax_rate}%`,  value: order.tax_amount },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{r.label}</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {order.currency} ${Math.abs(r.value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>TOTAL</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                  {order.currency} ${Number(order.total).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Notas */}
            {order.notes && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{to.notes ?? "Notas"}</div>
                {order.notes}
              </div>
            )}
            {order.internal_notes && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>{to.internalNotes ?? "Notas internas"}</div>
                {order.internal_notes}
              </div>
            )}

            {/* Conexiones */}
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", display: "grid", gap: "4px" }}>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>Conexiones del sistema</div>
              <div>← {to.fromQuotation ?? "Creado desde cotización"} {order.quotation?.quote_number ?? ""}</div>
              <div>→ {to.stockDeducted ?? "Stock descontado al confirmar"}</div>
              <div>→ {to.invoiceReady  ?? "Disponible para facturar al entregar"}</div>
            </div>
          </div>
        )}

        {/* ── ITEMS ── */}
        {tab === "items" && (
          <div>
            {items.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin productos
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)" }}>
                      {[
                        to.sku ?? "SKU",
                        to.description ?? "Descripción",
                        to.quantity ?? "Cant.",
                        to.quantityDelivered ?? "Entregado",
                        to.unit ?? "Unidad",
                        to.unitPrice ?? "P. Unit.",
                        to.itemSubtotal ?? "Subtotal",
                      ].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-faint)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const pct = item.quantity > 0 ? (item.quantity_delivered / item.quantity) * 100 : 0;
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border-faint)" }}>
                          <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{item.sku ?? "—"}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                            {item.details && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.details}</div>}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{item.quantity}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <div style={{ width: "50px", height: "4px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "var(--color-success-text)" : "var(--color-warning-text)", borderRadius: "var(--radius-full)" }} />
                              </div>
                              <span style={{ fontSize: "10px", color: pct >= 100 ? "var(--color-success-text)" : "var(--color-text-muted)" }}>{item.quantity_delivered}</span>
                            </div>
                          </td>
                          <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{item.unit}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            ${Number(item.unit_price).toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                            ${Number(item.subtotal).toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DELIVERY ── */}
        {tab === "delivery" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { k: "delivery_address", label: to.deliveryAddress ?? "Dirección", cols: "1 / -1" },
                  { k: "delivery_city",    label: to.deliveryCity    ?? "Ciudad"     },
                  { k: "delivery_state",   label: to.deliveryState   ?? "Estado"     },
                  { k: "delivery_country", label: to.deliveryCountry ?? "País"       },
                  { k: "delivery_date",    label: to.deliveryDate    ?? "Fecha entrega", type: "date" },
                ].map((f) => (
                  <div key={f.k} style={{ gridColumn: (f as any).cols ?? "auto" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    <input type={(f as any).type ?? "text"} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof Order, e.target.value)} style={INPUT} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                {[
                  { label: to.deliveryAddress ?? "Dirección",       value: order.delivery_address },
                  { label: to.deliveryCity    ?? "Ciudad",           value: order.delivery_city    },
                  { label: to.deliveryState   ?? "Estado",           value: order.delivery_state   },
                  { label: to.deliveryCountry ?? "País",             value: order.delivery_country },
                  { label: to.deliveryDate    ?? "Fecha de entrega", value: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString(locale) : null },
                  { label: to.deliveredAt     ?? "Entregado el",     value: order.delivered_at  ? new Date(order.delivered_at).toLocaleDateString(locale)  : null },
                ].map((r) => r.value ? (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{r.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{r.value}</span>
                  </div>
                ) : null)}
                {!order.delivery_address && (
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    Sin dirección de entrega configurada. Haz clic en Editar para agregar.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-muted)" }}>
              Historial de cambios del pedido {order.order_number}
            </div>
            {[
              { label: "Pedido creado",       date: order.created_at,    color: "var(--color-brand-blue)",   icon: "+" },
              { label: "Pedido confirmado",   date: order.confirmed_at,  color: "var(--color-info-text)",    icon: "✓" },
              { label: "Pedido enviado",      date: order.shipped_at,    color: "var(--color-warning-text)", icon: "→" },
              { label: "Pedido entregado",    date: order.delivered_at,  color: "var(--color-success-text)", icon: "✓" },
            ].filter((e) => e.date).map((event, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: `${event.color}20`, border: `1px solid ${event.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 800, color: event.color,
                }}>
                  {event.icon}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{event.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {new Date(event.date!).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Import necesario
const PRIORITY_CONFIG = {
  low:    { color: "var(--color-text-muted)"   },
  normal: { color: "var(--color-brand-blue)"   },
  high:   { color: "var(--color-warning-text)" },
  urgent: { color: "var(--color-danger-text)"  },
};
