"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Quotation, QuotationItem, QuotationService,
} from "../types/quotations.types";
import { STATUS_CONFIG, SERVICE_TYPE_CONFIG } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Tab = "detail" | "items" | "totals" | "preview";

type Props = {
  quotation:      Quotation | null;
  detailLoading:  boolean;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onAccept:       (q: Quotation) => Promise<{ type: "order" | "shipment"; id: string } | undefined>;
  onRemoveItem:   (id: string, quotationId: string) => Promise<void>;
  onRemoveService:(id: string, quotationId: string) => Promise<void>;
  onOpenPDF:      (q: Quotation) => void;
  saving:         boolean;
};

export default function QuotationWorkspace({
  quotation, detailLoading, onUpdateStatus, onAccept,
  onRemoveItem, onRemoveService, onOpenPDF, saving,
}: Props) {
  const { t, lang } = useTranslation();
  const router       = useRouter();
  const locale       = lang === "en" ? "en-US" : "es-MX";
  const [tab, setTab] = useState<Tab>("detail");
  const [accepting, setAccepting] = useState(false);

  if (!quotation) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "32px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", height: "100%",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {(t.quot as any)?.workspaceEmpty ?? "Selecciona una cotización"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
          {(t.quot as any)?.workspaceEmptyDesc ?? "Aquí verás el detalle, items, totales y podrás generar el PDF."}
        </div>
      </div>
    );
  }

  const cfg         = STATUS_CONFIG[quotation.status] ?? STATUS_CONFIG.draft;
  const statusLabel = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? quotation.status;
  const isServices  = quotation.type === "services";
  const canAccept   = quotation.status === "sent" || quotation.status === "viewed";
  const canSend     = quotation.status === "draft";
  const clientName  = quotation.client?.name ?? quotation.client_name ?? "—";
  const items       = quotation.items     ?? [];
  const services    = quotation.services  ?? [];

  const TABS: { key: Tab; label: string }[] = [
    { key: "detail",  label: (t.quot as any)?.tabDetail  ?? "Detalle"  },
    { key: "items",   label: isServices ? ((t.quot as any)?.tabServices ?? "Servicios") : ((t.quot as any)?.tabItems ?? "Productos"), },
    { key: "totals",  label: (t.quot as any)?.tabTotals  ?? "Totales"  },
    { key: "preview", label: (t.quot as any)?.tabPreview ?? "PDF"      },
  ];

  async function handleAccept() {
    setAccepting(true);
    try {
      const result = await onAccept(quotation);
      if (result) {
        if (result.type === "order")    router.push("/comercial/pedidos");
        if (result.type === "shipment") router.push("/logistica/embarques");
      }
    } finally { setAccepting(false); }
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {quotation.quote_number}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: "var(--radius-full)",
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                fontSize: "10px", fontWeight: 700, color: cfg.color, textTransform: "uppercase",
              }}>
                {statusLabel}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: "var(--radius-full)",
                background: isServices ? "var(--color-info-bg)" : "var(--color-success-bg)",
                border: isServices ? "1px solid var(--color-info-border)" : "1px solid var(--color-success-border)",
                fontSize: "10px", fontWeight: 700,
                color: isServices ? "var(--color-info-text)" : "var(--color-success-text)",
                textTransform: "uppercase",
              }}>
                {isServices ? ((t.quot as any)?.typeServices ?? "Servicios") : ((t.quot as any)?.typeProducts ?? "Productos")}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {clientName}
              {quotation.client_rfc && ` · RFC: ${quotation.client_rfc}`}
            </div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {quotation.currency} ${Number(quotation.total ?? 0).toLocaleString(locale, { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {canSend && (
            <button onClick={() => onUpdateStatus(quotation.id, "sent")} style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "11px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "5px",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              {(t.quot as any)?.send ?? "Enviar"}
            </button>
          )}
          {canAccept && (
            <button onClick={handleAccept} disabled={accepting || saving} style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-success-text)", color: "#fff", border: "none",
              fontSize: "11px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "5px",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {accepting ? t.general.loading : (t.quot as any)?.accept ?? "Aceptar"}
              {" → "}
              {isServices ? ((t.quot as any)?.createShipment ?? "Embarque") : ((t.quot as any)?.createOrder ?? "Pedido")}
            </button>
          )}
          {canAccept && (
            <button onClick={() => onUpdateStatus(quotation.id, "rejected")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {(t.quot as any)?.reject ?? "Rechazar"}
            </button>
          )}
          <button onClick={() => onOpenPDF(quotation)} style={{
            height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            {(t.quot as any)?.generatePDF ?? "PDF"}
          </button>
          {quotation.order_id && (
            <button onClick={() => router.push("/comercial/pedidos")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
              color: "var(--color-success-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              → {(t.quot as any)?.viewOrder ?? "Ver pedido"}
            </button>
          )}
          {quotation.shipment_id && (
            <button onClick={() => router.push("/logistica/embarques")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
              color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              → {(t.quot as any)?.viewShipment ?? "Ver embarque"}
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
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {detailLoading && <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>}

        {/* ── DETAIL ── */}
        {tab === "detail" && (
          <div style={{ display: "grid", gap: "10px" }}>
            {/* Info */}
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                {(t.quot as any)?.clientInfo ?? "Información del cliente"}
              </div>
              {[
                { label: (t.quot as any)?.client      ?? "Cliente",    value: clientName },
                { label: "Email",                                        value: quotation.client?.email ?? quotation.client_email },
                { label: "RFC",                                          value: quotation.client?.rfc   ?? quotation.client_rfc   },
                { label: (t.quot as any)?.currency     ?? "Moneda",     value: quotation.currency },
                { label: (t.quot as any)?.template     ?? "Plantilla",  value: quotation.template },
                { label: (t.quot as any)?.validUntil   ?? "Vigencia",   value: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : null },
                { label: (t.quot as any)?.incoterm     ?? "Incoterm",   value: quotation.incoterm },
                { label: (t.quot as any)?.origin       ?? "Origen",     value: quotation.origin },
                { label: (t.quot as any)?.destination  ?? "Destino",    value: quotation.destination },
              ].map((row) => row.value ? (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
                </div>
              ) : null)}
            </div>

            {/* Notas */}
            {quotation.notes && (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  {(t.quot as any)?.notes ?? "Notas"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>{quotation.notes}</div>
              </div>
            )}

            {/* Términos */}
            {quotation.terms && (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  {(t.quot as any)?.terms ?? "Términos y condiciones"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{quotation.terms}</div>
              </div>
            )}
          </div>
        )}

        {/* ── ITEMS (Productos) ── */}
        {tab === "items" && !isServices && (
          <>
            {items.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.quot as any)?.noItems ?? "Sin productos agregados"}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)" }}>
                      {["SKU", (t.quot as any)?.description ?? "Descripción", (t.quot as any)?.quantity ?? "Cant.", (t.quot as any)?.unit ?? "Unidad",
                        (t.quot as any)?.unitPrice ?? "P. Unit.", (t.quot as any)?.discount ?? "Desc.", (t.quot as any)?.subtotal ?? "Subtotal", ""].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-faint)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border-faint)" }}>
                        <td style={{ padding: "8px 10px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{item.sku ?? "—"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--color-text-primary)", fontWeight: 600, maxWidth: "180px" }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
                          {item.details && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.details}</div>}
                        </td>
                        <td style={{ padding: "8px 10px", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{item.unit}</td>
                        <td style={{ padding: "8px 10px", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                          ${Number(item.unit_price).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>{item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                          ${Number(item.subtotal).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 6px" }}>
                          {quotation.status === "draft" && (
                            <button onClick={() => onRemoveItem(item.id, quotation.id)} style={{
                              width: "22px", height: "22px", borderRadius: "var(--radius-sm)",
                              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", color: "var(--color-danger-text)",
                            }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── SERVICES (Logística) ── */}
        {tab === "items" && isServices && (
          <>
            {services.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.quot as any)?.noServices ?? "Sin servicios agregados"}
              </div>
            ) : services.map((svc) => {
              const svcCfg   = SERVICE_TYPE_CONFIG[svc.service_type] ?? SERVICE_TYPE_CONFIG.otro;
              const svcLabel = (t.quot as any)?.[svcCfg.labelKey.replace("quot.", "")] ?? svc.service_type;
              return (
                <div key={svc.id} style={{
                  padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border-faint)", display: "grid", gap: "6px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: svcCfg.color + "20", color: svcCfg.color, border: `1px solid ${svcCfg.color}40` }}>
                        {svcLabel}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                        {svc.currency} ${Number(svc.price).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {quotation.status === "draft" && (
                        <button onClick={() => onRemoveService(svc.id, quotation.id)} style={{
                          width: "22px", height: "22px", borderRadius: "var(--radius-sm)",
                          background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "var(--color-danger-text)",
                        }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{svc.description}</div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                    {svc.origin      && <span>📍 {svc.origin} → {svc.destination}</span>}
                    {svc.incoterm    && <span>📄 {svc.incoterm}</span>}
                    {svc.transit_time && <span>⏱ {svc.transit_time}</span>}
                  </div>
                  {svc.notes && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>{svc.notes}</div>}
                </div>
              );
            })}
          </>
        )}

        {/* ── TOTALS ── */}
        {tab === "totals" && (
          <div style={{ maxWidth: "380px", marginLeft: "auto", display: "grid", gap: "6px" }}>
            {[
              { label: (t.quot as any)?.subtotal        ?? "Subtotal",       value: quotation.subtotal,        color: "var(--color-text-primary)"   },
              { label: (t.quot as any)?.discount        ?? "Descuento",      value: -quotation.discount_amount, color: "var(--color-warning-text)", hide: !quotation.discount_amount },
              { label: `IVA ${quotation.tax_rate}%`,                          value: quotation.tax_amount,       color: "var(--color-text-muted)"     },
            ].map((row) => row.hide ? null : (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", fontSize: "13px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {quotation.currency} ${Number(Math.abs(row.value ?? 0)).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "16px" }}>
              <span style={{ color: "var(--color-success-text)", fontWeight: 800 }}>{(t.quot as any)?.total ?? "TOTAL"}</span>
              <span style={{ color: "var(--color-success-text)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {quotation.currency} ${Number(quotation.total ?? 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {isServices && services.length > 1 && (
              <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {(t.quot as any)?.breakdown ?? "Desglose por servicio"}
                </div>
                {services.map((svc) => (
                  <div key={svc.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{svc.service_type}</span>
                    <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {svc.currency} ${Number(svc.price).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PDF PREVIEW ── */}
        {tab === "preview" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6, maxWidth: "380px", textAlign: "center" }}>
              {(t.quot as any)?.pdfInfo ?? "El PDF se genera con los datos actuales de la cotización usando la plantilla configurada."}
            </div>
            <button onClick={() => onOpenPDF(quotation)} style={{
              height: "44px", padding: "0 28px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "14px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {(t.quot as any)?.downloadPDF ?? "Descargar PDF"}
            </button>
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "11px", color: "var(--color-text-muted)", display: "grid", gap: "4px" }}>
              <div><strong>Plantilla:</strong> {quotation.template}</div>
              <div><strong>Tipo:</strong> {isServices ? "Servicios logísticos" : "Productos"}</div>
              <div><strong>Items:</strong> {isServices ? services.length : items.length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
