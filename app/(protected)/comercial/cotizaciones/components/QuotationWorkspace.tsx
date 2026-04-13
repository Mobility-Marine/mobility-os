"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Quotation, QuotationItem, QuotationService } from "../types/quotations.types";
import { STATUS_CONFIG, SERVICE_TYPE_CONFIG } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { INCOTERMS, CURRENCIES, UNITS } from "../types/quotations.types";

type Tab = "detail" | "items" | "totals" | "preview";

type Props = {
  quotation:       Quotation | null;
  detailLoading:   boolean;
  onUpdateStatus:  (id: string, status: string) => Promise<void>;
  onUpdateFields:  (id: string, updates: Partial<Quotation>) => Promise<void>;
  onAccept:        (q: Quotation) => Promise<{ type: "order" | "shipment"; id: string } | undefined>;
  onRemoveItem:    (id: string, quotationId: string) => Promise<void>;
  onRemoveService: (id: string, quotationId: string) => Promise<void>;
  onUpdateItem:    (id: string, updates: Partial<QuotationItem>, quotationId: string) => Promise<void>;
  onUpdateService: (id: string, updates: Partial<QuotationService>, quotationId: string) => Promise<void>;
  onOpenPDF:       (q: Quotation) => void;
  saving:          boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "32px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function QuotationWorkspace({
  quotation, detailLoading, onUpdateStatus, onUpdateFields, onAccept,
  onRemoveItem, onRemoveService, onUpdateItem, onUpdateService, onOpenPDF, saving,
}: Props) {
  const { t, lang } = useTranslation();
  const router       = useRouter();
  const locale       = lang === "en" ? "en-US" : "es-MX";

  const [tab,         setTab]         = useState<Tab>("detail");
  const [accepting,   setAccepting]   = useState(false);
  const [editingDetail, setEditingDetail] = useState(false);
  const [detailForm,  setDetailForm]  = useState<Partial<Quotation>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm,    setItemForm]    = useState<Partial<QuotationItem>>({});
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

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
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
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
  const isDraft     = quotation.status === "draft";
  const isSent      = quotation.status === "sent" || quotation.status === "viewed";
  const isOpen      = isDraft || isSent;
  const clientName  = quotation.client?.name ?? quotation.client_name ?? "—";
  const items       = quotation.items    ?? [];
  const services    = quotation.services ?? [];

  const TABS: { key: Tab; label: string }[] = [
    { key: "detail",  label: (t.quot as any)?.tabDetail  ?? "Detalle"   },
    { key: "items",   label: isServices ? ((t.quot as any)?.tabServices ?? "Servicios") : `${(t.quot as any)?.tabItems ?? "Productos"} (${items.length})` },
    { key: "totals",  label: (t.quot as any)?.tabTotals  ?? "Totales"   },
    { key: "preview", label: (t.quot as any)?.tabPreview ?? "PDF"       },
  ];

  async function handleAccept() {
    setAccepting(true);
    setConfirmAccept(false);
    try {
      const result = await onAccept(quotation);
      if (result) {
        if (result.type === "order")    router.push("/comercial/pedidos");
        if (result.type === "shipment") router.push("/logistica/embarques");
      }
    } finally { setAccepting(false); }
  }

  // ── DETAIL EDITING ─────────────────────────────────────────

  function startEditDetail() {
    setDetailForm({
      notes:           quotation.notes           ?? "",
      terms:           quotation.terms           ?? "",
      valid_until:     quotation.valid_until      ?? "",
      discount_amount: quotation.discount_amount ?? 0,
      tax_rate:        quotation.tax_rate        ?? 16,
      currency:        quotation.currency        ?? "MXN",
      incoterm:        quotation.incoterm        ?? "",
      origin:          quotation.origin          ?? "",
      destination:     quotation.destination     ?? "",
    });
    setEditingDetail(true);
  }

  async function saveDetail() {
    await onUpdateFields(quotation.id, detailForm);
    setEditingDetail(false);
  }

  // ── ITEM EDITING ───────────────────────────────────────────

  function startEditItem(item: QuotationItem) {
    setEditingItemId(item.id);
    setItemForm({ quantity: item.quantity, unit_price: item.unit_price, discount_pct: item.discount_pct, unit: item.unit, description: item.description, details: item.details });
  }

  async function saveItem() {
    if (!editingItemId) return;
    await onUpdateItem(editingItemId, itemForm, quotation.id);
    setEditingItemId(null);
    setItemForm({});
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {quotation.quote_number}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: "10px", fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>
                {statusLabel}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: isServices ? "var(--color-info-bg)" : "var(--color-success-bg)", border: isServices ? "1px solid var(--color-info-border)" : "1px solid var(--color-success-border)", fontSize: "10px", fontWeight: 700, color: isServices ? "var(--color-info-text)" : "var(--color-success-text)", textTransform: "uppercase" }}>
                {isServices ? ((t.quot as any)?.typeServices ?? "Servicios") : ((t.quot as any)?.typeProducts ?? "Productos")}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {clientName}{quotation.client_rfc && ` · RFC: ${quotation.client_rfc}`}
              {quotation.valid_until && ` · Vence: ${new Date(quotation.valid_until).toLocaleDateString(locale)}`}
            </div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {quotation.currency} ${Number(quotation.total ?? 0).toLocaleString(locale, { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>

          {/* Editar (solo borrador) */}
          {isDraft && !editingDetail && (
            <button onClick={() => { startEditDetail(); setTab("detail"); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
          )}

          {/* Marcar como enviada (borrador) */}
          {isDraft && (
            <button onClick={() => onUpdateStatus(quotation.id, "sent")} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Marcar enviada
            </button>
          )}

          {/* Aceptar (borrador o enviada) */}
          {isOpen && !confirmAccept && !confirmReject && (
            <button onClick={() => setConfirmAccept(true)} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Aceptada →{isServices ? " Embarque" : " Pedido"}
            </button>
          )}

          {/* Confirmar aceptar */}
          {confirmAccept && (
            <>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center" }}>¿Confirmar?</span>
              <button onClick={handleAccept} disabled={accepting || saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {accepting ? t.general.loading : "Sí, aceptar"}
              </button>
              <button onClick={() => setConfirmAccept(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                No
              </button>
            </>
          )}

          {/* Rechazar (borrador o enviada) */}
          {isOpen && !confirmReject && !confirmAccept && (
            <button onClick={() => setConfirmReject(true)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              Rechazada
            </button>
          )}

          {/* Confirmar rechazar */}
          {confirmReject && (
            <>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center" }}>¿Confirmar rechazo?</span>
              <button onClick={async () => { await onUpdateStatus(quotation.id, "rejected"); setConfirmReject(false); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                Sí, rechazar
              </button>
              <button onClick={() => setConfirmReject(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                No
              </button>
            </>
          )}

          {/* PDF */}
          <button onClick={() => onOpenPDF(quotation)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            PDF
          </button>

          {/* Ver pedido / embarque vinculado */}
          {quotation.order_id && (
            <button onClick={() => router.push("/comercial/pedidos")} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              → Ver pedido
            </button>
          )}
          {quotation.shipment_id && (
            <button onClick={() => router.push("/logistica/embarques")} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              → Ver embarque
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ height: "36px", padding: "0 14px", border: "none", background: "transparent", borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent", color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {detailLoading && <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>}

        {/* ── DETALLE ── */}
        {tab === "detail" && !editingDetail && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                Información de la cotización
              </div>
              {[
                { label: "Cliente",    value: clientName },
                { label: "Email",      value: quotation.client?.email ?? quotation.client_email },
                { label: "RFC",        value: quotation.client?.rfc   ?? quotation.client_rfc   },
                { label: "Moneda",     value: quotation.currency },
                { label: "Plantilla",  value: quotation.template },
                { label: "Vigencia",   value: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : null },
                { label: "Descuento",  value: quotation.discount_amount ? `${quotation.currency} $${quotation.discount_amount}` : null },
                { label: "IVA",        value: `${quotation.tax_rate ?? 16}%` },
                { label: "Incoterm",   value: quotation.incoterm },
                { label: "Origen",     value: quotation.origin },
                { label: "Destino",    value: quotation.destination },
              ].map((row) => row.value ? (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
                </div>
              ) : null)}
            </div>
            {quotation.notes && (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>Notas</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>{quotation.notes}</div>
              </div>
            )}
            {quotation.terms && (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>Términos y condiciones</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{quotation.terms}</div>
              </div>
            )}
            {isDraft && (
              <button onClick={startEditDetail} style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Editar detalles
              </button>
            )}
          </div>
        )}

        {/* ── DETALLE EN MODO EDICIÓN ── */}
        {tab === "detail" && editingDetail && (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                <select value={(detailForm.currency as string) ?? "MXN"} onChange={(e) => setDetailForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, height: "32px", cursor: "pointer" }}>
                  {(CURRENCIES ?? [{ value: "MXN", label: "MXN" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }]).map((c: any) => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Vigencia</div>
                <input type="date" value={(detailForm.valid_until as string) ?? ""} onChange={(e) => setDetailForm((p) => ({ ...p, valid_until: e.target.value }))} style={INPUT} />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Descuento global ($)</div>
                <input type="number" min="0" value={(detailForm.discount_amount as number) ?? 0} onChange={(e) => setDetailForm((p) => ({ ...p, discount_amount: Number(e.target.value) }))} style={INPUT} />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>IVA (%)</div>
                <input type="number" min="0" max="100" value={(detailForm.tax_rate as number) ?? 16} onChange={(e) => setDetailForm((p) => ({ ...p, tax_rate: Number(e.target.value) }))} style={INPUT} />
              </div>
              {isServices && (
                <>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Incoterm</div>
                    <select value={(detailForm.incoterm as string) ?? ""} onChange={(e) => setDetailForm((p) => ({ ...p, incoterm: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      <option value="">—</option>
                      {(INCOTERMS ?? []).map((inc: string) => <option key={inc} value={inc}>{inc}</option>)}
                    </select>
                  </div>
                  <div />
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Origen</div>
                    <input value={(detailForm.origin as string) ?? ""} onChange={(e) => setDetailForm((p) => ({ ...p, origin: e.target.value }))} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Destino</div>
                    <input value={(detailForm.destination as string) ?? ""} onChange={(e) => setDetailForm((p) => ({ ...p, destination: e.target.value }))} style={INPUT} />
                  </div>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
              <textarea rows={3} value={(detailForm.notes as string) ?? ""} onChange={(e) => setDetailForm((p) => ({ ...p, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Términos y condiciones</div>
              <textarea rows={4} value={(detailForm.terms as string) ?? ""} onChange={(e) => setDetailForm((p) => ({ ...p, terms: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={saveDetail} disabled={saving} style={{ height: "34px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => setEditingDetail(false)} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </div>
          </div>
        )}

        {/* ── PRODUCTOS ── */}
        {tab === "items" && !isServices && (
          <>
            {items.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                Sin productos
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)" }}>
                      {["SKU","Descripción","Cant.","Unidad","P. Unit.","Desc.%","Subtotal",""].map((h) => (
                        <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-faint)", whiteSpace: "nowrap", fontSize: "10px", textTransform: "uppercase" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const isEditingThis = editingItemId === item.id;
                      return (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border-faint)", background: isEditingThis ? "var(--color-info-bg)" : "transparent" }}>
                          <td style={{ padding: "7px 8px", color: "var(--color-text-muted)" }}>{item.sku ?? "—"}</td>
                          <td style={{ padding: "7px 8px", maxWidth: "160px" }}>
                            {isEditingThis ? (
                              <input value={(itemForm.description as string) ?? ""} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} style={{ ...INPUT, height: "28px" }} />
                            ) : (
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                            )}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}>
                            {isEditingThis ? (
                              <input type="number" min="0.001" value={(itemForm.quantity as number) ?? 1} onChange={(e) => setItemForm((p) => ({ ...p, quantity: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "70px" }} />
                            ) : item.quantity}
                          </td>
                          <td style={{ padding: "7px 8px" }}>
                            {isEditingThis ? (
                              <select value={(itemForm.unit as string) ?? "pza"} onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))} style={{ ...INPUT, height: "28px", width: "70px", cursor: "pointer" }}>
                                {(UNITS ?? ["pza","kg","lt","m","m2","m3","caja","pallet"]).map((u: string) => <option key={u} value={u}>{u}</option>)}
                              </select>
                            ) : item.unit}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}>
                            {isEditingThis ? (
                              <input type="number" min="0" step="0.01" value={(itemForm.unit_price as number) ?? 0} onChange={(e) => setItemForm((p) => ({ ...p, unit_price: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "90px" }} />
                            ) : `$${Number(item.unit_price).toLocaleString(locale, { minimumFractionDigits: 2 })}`}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}>
                            {isEditingThis ? (
                              <input type="number" min="0" max="100" value={(itemForm.discount_pct as number) ?? 0} onChange={(e) => setItemForm((p) => ({ ...p, discount_pct: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "60px" }} />
                            ) : (item.discount_pct > 0 ? `${item.discount_pct}%` : "—")}
                          </td>
                          <td style={{ padding: "7px 8px", fontWeight: 700, color: "var(--color-success-text)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            ${Number(item.subtotal).toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "7px 6px" }}>
                            {isOpen && (
                              <div style={{ display: "flex", gap: "3px" }}>
                                {isEditingThis ? (
                                  <>
                                    <button onClick={saveItem} style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", cursor: "pointer", color: "var(--color-success-text)", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                                    <button onClick={() => { setEditingItemId(null); setItemForm({}); }} style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditItem(item)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", color: "var(--color-brand-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button onClick={() => onRemoveItem(item.id, quotation.id)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── SERVICIOS ── */}
        {tab === "items" && isServices && (
          <>
            {services.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                Sin servicios
              </div>
            ) : services.map((svc) => {
              const svcCfg   = SERVICE_TYPE_CONFIG[svc.service_type] ?? SERVICE_TYPE_CONFIG.otro;
              const svcLabel = (t.quot as any)?.[svcCfg.labelKey.replace("quot.", "")] ?? svc.service_type;
              const isEditingThis = editingItemId === svc.id;
              return (
                <div key={svc.id} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: isEditingThis ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `1px solid ${isEditingThis ? "var(--color-info-border)" : "var(--color-border-faint)"}`, display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: svcCfg.color + "20", color: svcCfg.color, border: `1px solid ${svcCfg.color}40` }}>
                      {svcLabel}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isEditingThis ? (
                        <input type="number" min="0" step="0.01" value={(itemForm as any).price ?? svc.price} onChange={(e) => setItemForm((p: any) => ({ ...p, price: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "120px" }} />
                      ) : (
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>
                          {svc.currency} ${Number(svc.price).toLocaleString(locale, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {isOpen && (
                        <div style={{ display: "flex", gap: "3px" }}>
                          {isEditingThis ? (
                            <>
                              <button onClick={async () => { await onUpdateService(svc.id, itemForm as any, quotation.id); setEditingItemId(null); setItemForm({}); }} style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", cursor: "pointer", color: "var(--color-success-text)", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                              <button onClick={() => { setEditingItemId(null); setItemForm({}); }} style={{ width: "24px", height: "24px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingItemId(svc.id); setItemForm({ price: svc.price, notes: svc.notes, description: svc.description } as any); }} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", color: "var(--color-brand-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button onClick={() => onRemoveService(svc.id, quotation.id)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditingThis ? (
                    <input value={(itemForm as any).description ?? svc.description} onChange={(e) => setItemForm((p: any) => ({ ...p, description: e.target.value }))} style={INPUT} />
                  ) : (
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{svc.description}</div>
                  )}
                  {!isEditingThis && (
                    <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                      {svc.origin      && <span>📍 {svc.origin} → {svc.destination}</span>}
                      {svc.incoterm    && <span>📄 {svc.incoterm}</span>}
                      {svc.transit_time && <span>⏱ {svc.transit_time}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── TOTALES ── */}
        {tab === "totals" && (
          <div style={{ maxWidth: "380px", marginLeft: "auto", display: "grid", gap: "6px" }}>
            {[
              { label: "Subtotal",                                          value: quotation.subtotal,         color: "var(--color-text-primary)" },
              { label: "Descuento", hide: !quotation.discount_amount,       value: -quotation.discount_amount, color: "var(--color-warning-text)" },
              { label: `IVA ${quotation.tax_rate ?? 16}%`,                  value: quotation.tax_amount,       color: "var(--color-text-muted)"   },
            ].map((row) => (row as any).hide ? null : (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", fontSize: "13px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {quotation.currency} ${Number(Math.abs(row.value ?? 0)).toLocaleString(locale, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "16px" }}>
              <span style={{ color: "var(--color-success-text)", fontWeight: 800 }}>TOTAL</span>
              <span style={{ color: "var(--color-success-text)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {quotation.currency} ${Number(quotation.total ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* ── PDF ── */}
        {tab === "preview" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6, maxWidth: "380px", textAlign: "center" }}>
              El PDF se genera con los datos actuales usando la plantilla configurada.
            </div>
            <button onClick={() => onOpenPDF(quotation)} style={{ height: "44px", padding: "0 28px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar PDF
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
