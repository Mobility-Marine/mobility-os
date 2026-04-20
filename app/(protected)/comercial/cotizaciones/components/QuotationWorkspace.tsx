"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Quotation, QuotationItem, QuotationService } from "../types/quotations.types";
import { STATUS_CONFIG, SERVICE_TYPE_CONFIG, UNITS } from "../types/quotations.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { INCOTERMS, CURRENCIES } from "../types/quotations.types";
import type { CreateItemPayload } from "../types/quotations.types";
import { fetchProductBySearch } from "../services/quotations.service";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Tab = "detail" | "items" | "totals" | "preview";

type Props = {
  quotation:         Quotation | null;
  detailLoading:     boolean;
  onUpdateStatus:    (id: string, status: string) => Promise<void>;
  onUpdateFields:    (id: string, updates: Partial<Quotation>) => Promise<void>;
    onAccept:          (q: Quotation, deliveryInfo?: any) => Promise<{ type: "order" | "shipment"; id: string } | undefined>;
  onRemoveItem:      (id: string, quotationId: string) => Promise<void>;
  onRemoveService:   (id: string, quotationId: string) => Promise<void>;
  onUpdateItem:      (id: string, updates: Partial<QuotationItem>, quotationId: string) => Promise<void>;
  onUpdateService:   (id: string, updates: Partial<QuotationService>, quotationId: string) => Promise<void>;
  onRemoveQuotation: (id: string) => Promise<void>;
  onAddItem:         (payload: CreateItemPayload) => Promise<QuotationItem | undefined>;
  onOpenPDF:         (q: Quotation) => void;
  saving:            boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "32px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const EMPTY_ITEM = {
  sku: "", description: "", details: "",
  quantity: "1", unit: "pza", unit_price: "", discount_pct: "0",
  product_id: "" as string | undefined,
};

// ── Helpers multi-moneda ───────────────────────────────────────
function getBillingTotals(quotation: Quotation): Record<string, { subtotal: number; tax: number; total: number }> {
  const concepts = (quotation as any).billing_concepts ?? [];
  const byCurrency: Record<string, { subtotal: number; tax: number; total: number }> = {};

  if (concepts.length > 0) {
    for (const concept of concepts) {
      for (const line of (concept.lines ?? [])) {
        const cur   = line.currency ?? concept.currency ?? quotation.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const rate  = line.tax_rate;
        const tax   = (rate === null || rate === undefined || rate === -1 || rate === 0) ? 0 : price * (rate / 100);
        if (!byCurrency[cur]) byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
        byCurrency[cur].subtotal += price;
        byCurrency[cur].tax      += tax;
        byCurrency[cur].total    += price + tax;
      }
    }
    return byCurrency;
  }

  // Fallback: sin billing_concepts
  const cur = quotation.currency ?? "MXN";
  return {
    [cur]: {
      subtotal: quotation.subtotal   ?? 0,
      tax:      quotation.tax_amount ?? 0,
      total:    quotation.total      ?? 0,
    },
  };
}

export default function QuotationWorkspace({
  quotation, detailLoading, onUpdateStatus, onUpdateFields, onAccept,
  onRemoveItem, onRemoveService, onUpdateItem, onUpdateService,
  onRemoveQuotation, onAddItem, onOpenPDF, saving,
}: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const router        = useRouter();
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,             setTab]            = useState<Tab>("detail");
  const [accepting,       setAccepting]      = useState(false);
  const [editingDetail,   setEditingDetail]  = useState(false);
  const [detailForm,      setDetailForm]     = useState<Partial<Quotation>>({});
  const [editingItemId,   setEditingItemId]  = useState<string | null>(null);
  const [itemForm,        setItemForm]       = useState<Partial<QuotationItem>>({});
  const [confirmAccept,   setConfirmAccept]  = useState(false);
  const [confirmReject,   setConfirmReject]  = useState(false);
  const [confirmDelete,   setConfirmDelete]  = useState(false);
  const [showAddItem,     setShowAddItem]    = useState(false);
  const [newItem,         setNewItem]        = useState(EMPTY_ITEM);
  const [prodSuggestions, setProdSuggestions] = useState<any[]>([]);
  const [addingItem,      setAddingItem]     = useState(false);
  // Email en tab PDF
  const [ccEmails,        setCcEmails]       = useState("");
    // Modal de entrega antes de aceptar cotización de productos
  const [deliveryModal,    setDeliveryModal]    = useState(false);
  const [deliveryDate,     setDeliveryDate]     = useState("");
  const [deliveryType,     setDeliveryType]     = useState<"client_address" | "custom">("client_address");
  const [deliveryAddress,  setDeliveryAddress]  = useState("");
  const [deliveryCity,     setDeliveryCity]     = useState("");
  const [deliveryState,    setDeliveryState]    = useState("");
  const [deliveryNotes,    setDeliveryNotes]    = useState("");
  const [sendingEmail,    setSendingEmail]   = useState(false);

  if (!quotation) {
    return (
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>Selecciona una cotización</div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
          Aquí verás el detalle, items, totales y podrás generar el PDF.
        </div>
      </div>
    );
  }

  const cfg        = STATUS_CONFIG[quotation.status] ?? STATUS_CONFIG.draft;
  const isServices = quotation.type === "services";
  const isDraft    = quotation.status === "draft";
  const isSent     = quotation.status === "sent" || quotation.status === "viewed";
  const isOpen     = isDraft || isSent;
  const clientName = quotation.client?.name ?? quotation.client_name ?? "—";
  const contactEmail = quotation.contact_email ?? quotation.client?.email ?? quotation.client_email;
  const items      = quotation.items    ?? [];
  const services   = quotation.services ?? [];

  // Totales multi-moneda
  const billingTotals = getBillingTotals(quotation);
  const currencyEntries = Object.entries(billingTotals).filter(([, v]) => v.total > 0);

  const TABS = [
    { key: "detail"  as Tab, label: "Detalle" },
    { key: "items"   as Tab, label: isServices ? "Servicios" : `Productos (${items.length})` },
    { key: "totals"  as Tab, label: "Totales" },
    { key: "preview" as Tab, label: "PDF / Envío" },
  ];

      async function handleAccept() {
    setAccepting(true); setConfirmAccept(false);
    try {
      const result = await onAccept(quotation, {
        delivery_date:    deliveryDate    || undefined,
        delivery_type:    deliveryType,
        delivery_address: deliveryType === "custom" ? deliveryAddress  : undefined,
        delivery_city:    deliveryType === "custom" ? deliveryCity     : undefined,
        delivery_state:   deliveryType === "custom" ? deliveryState    : undefined,
        delivery_notes:   deliveryNotes  || undefined,
      });
      if (result?.type === "shipment") router.push("/logistica/embarques");
    } finally { setAccepting(false); setDeliveryModal(false); }
  }

  function startEditDetail() {
    setDetailForm({
      notes: quotation.notes ?? "", terms: quotation.terms ?? "",
      valid_until: quotation.valid_until ?? "",
      discount_amount: quotation.discount_amount ?? 0,
      tax_rate: quotation.tax_rate ?? 16,
      currency: quotation.currency ?? "MXN",
      incoterm: quotation.incoterm ?? "",
      origin: quotation.origin ?? "", destination: quotation.destination ?? "",
    });
    setEditingDetail(true);
  }

  async function saveDetail() {
    await onUpdateFields(quotation.id, detailForm);
    setEditingDetail(false);
  }

  function startEditItem(item: QuotationItem) {
    setEditingItemId(item.id);
    setItemForm({ quantity: item.quantity, unit_price: item.unit_price, discount_pct: item.discount_pct, unit: item.unit, description: item.description, details: item.details });
  }

  async function saveItem() {
    if (!editingItemId) return;
    await onUpdateItem(editingItemId, itemForm, quotation.id);
    setEditingItemId(null); setItemForm({});
  }

  async function searchProducts(q: string) {
    if (!q.trim() || !companyId) { setProdSuggestions([]); return; }
    const prods = await fetchProductBySearch(companyId, q);
    setProdSuggestions(prods);
  }

    function selectSuggestion(prod: any) {
    setNewItem(p => ({ ...p, product_id: prod.id, sku: prod.sku ?? "", description: prod.name, unit: prod.unit ?? "pza", unit_price: String(prod.unit_price ?? "") }));
    setProdSuggestions([]);
  }

  async function handleAddItem() {
    if (!newItem.description.trim() || !newItem.unit_price || !companyId) return;
    setAddingItem(true);
    try {
            await onAddItem({
        quotation_id: quotation.id,
        product_id:   newItem.product_id  || undefined,
        sku:          newItem.sku         || undefined,
        description:  newItem.description,
        details:      newItem.details     || undefined,
        quantity:     Number(newItem.quantity)    || 1,
        unit:         newItem.unit,
        unit_price:   Number(newItem.unit_price)  || 0,
        discount_pct: Number(newItem.discount_pct)|| 0,
      });
      setNewItem(EMPTY_ITEM); setProdSuggestions([]); setShowAddItem(false);
    } finally { setAddingItem(false); }
  }

  const fmtCur = (val: number, cur: string) => {
    const prefix = cur === "MXN" ? "$" : `${cur} $`;
    return `${prefix}${val.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{quotation.quote_number}</span>
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: "10px", fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>
                {(t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? quotation.status}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: isServices ? "var(--color-info-bg)" : "var(--color-success-bg)", border: isServices ? "1px solid var(--color-info-border)" : "1px solid var(--color-success-border)", fontSize: "10px", fontWeight: 700, color: isServices ? "var(--color-info-text)" : "var(--color-success-text)", textTransform: "uppercase" }}>
                {isServices ? ((quotation as any).service_subtype?.replace(/_/g, " ").toUpperCase() ?? "Servicios") : "Productos"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {clientName}{quotation.client_rfc && ` · RFC: ${quotation.client_rfc}`}
              {quotation.valid_until && ` · Vence: ${new Date(quotation.valid_until).toLocaleDateString(locale)}`}
            </div>
          </div>

          {/* Totales multi-moneda en header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
            {currencyEntries.length > 0 ? currencyEntries.map(([cur, vals]) => (
              <div key={cur} style={{ fontSize: currencyEntries.length > 1 ? "16px" : "20px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
                {fmtCur(vals.total, cur)}
              </div>
            )) : (
              <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success-text)" }}>$0</div>
            )}
          </div>
        </div>

        {/* ── ACCIONES ── */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {isDraft && !editingDetail && (
            <button onClick={() => { startEditDetail(); setTab("detail"); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
          )}
          {isDraft && (
            <button onClick={() => onUpdateStatus(quotation.id, "sent")} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Marcar enviada
            </button>
          )}
                    {isOpen && !confirmAccept && !confirmReject && !confirmDelete && (
            <button onClick={() => {
              if (!isServices) { setDeliveryModal(true); }
              else { setConfirmAccept(true); }
            }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Aceptada →{isServices ? " Embarque" : " Pedido"}
            </button>
          )}
          {confirmAccept && (
            <>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center" }}>¿Confirmar?</span>
              <button onClick={handleAccept} disabled={accepting || saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {accepting ? t.general.loading : "Sí, aceptar"}
              </button>
              <button onClick={() => setConfirmAccept(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>No</button>
            </>
          )}
          {isOpen && !confirmReject && !confirmAccept && !confirmDelete && (
            <button onClick={() => setConfirmReject(true)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              Rechazada
            </button>
          )}
          {confirmReject && (
            <>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center" }}>¿Confirmar rechazo?</span>
              <button onClick={async () => { await onUpdateStatus(quotation.id, "rejected"); setConfirmReject(false); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                Sí, rechazar
              </button>
              <button onClick={() => setConfirmReject(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>No</button>
            </>
          )}
          {/* PDF rápido */}
          <button onClick={() => { onOpenPDF(quotation); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            PDF
          </button>
          {/* Eliminar */}
          {!confirmDelete && !confirmAccept && !confirmReject && (
            <button onClick={() => setConfirmDelete(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Eliminar
            </button>
          )}
          {confirmDelete && (
            <>
              <span style={{ fontSize: "11px", color: "var(--color-danger-text)", fontWeight: 600, alignSelf: "center" }}>¿Eliminar permanentemente?</span>
              <button onClick={async () => { await onRemoveQuotation(quotation.id); setConfirmDelete(false); }} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : "Sí, eliminar"}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>No</button>
            </>
          )}
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

      {/* ── TABS ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ height: "36px", padding: "0 14px", border: "none", background: "transparent", borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent", color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {detailLoading && <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>}

        {/* ── DETALLE (vista) ── */}
        {tab === "detail" && !editingDetail && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Información</div>
              {[
                { label: "Cliente",   value: clientName },
                { label: "Email",     value: quotation.client?.email ?? quotation.client_email },
                { label: "RFC",       value: quotation.client?.rfc   ?? quotation.client_rfc },
                { label: "Contacto",  value: quotation.contact_name  ?? null },
                { label: "Email contacto", value: contactEmail ?? null },
                { label: "Plantilla", value: "Mobility OS" },
                { label: "Vigencia",  value: quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString(locale) : null },
                { label: "Descuento", value: (quotation.discount_amount ?? 0) > 0 ? `${quotation.currency} $${quotation.discount_amount}` : null },
                { label: "IVA",       value: `${quotation.tax_rate ?? 16}%` },
                { label: "Incoterm",  value: quotation.incoterm },
                { label: "Origen",    value: quotation.origin },
                { label: "Destino",   value: quotation.destination },
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

        {/* ── DETALLE (edición) ── */}
        {tab === "detail" && editingDetail && (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                <select value={(detailForm.currency as string) ?? "MXN"} onChange={(e) => setDetailForm(p => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, height: "32px", cursor: "pointer" }}>
                  {CURRENCIES.map((c: any) => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Vigencia</div>
                <input type="date" value={(detailForm.valid_until as string) ?? ""} onChange={(e) => setDetailForm(p => ({ ...p, valid_until: e.target.value }))} style={INPUT} />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Descuento global ($)</div>
                <input type="number" min="0" value={(detailForm.discount_amount as number) ?? 0} onChange={(e) => setDetailForm(p => ({ ...p, discount_amount: Number(e.target.value) }))} style={INPUT} />
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>IVA (%)</div>
                <input type="number" min="0" max="100" value={(detailForm.tax_rate as number) ?? 16} onChange={(e) => setDetailForm(p => ({ ...p, tax_rate: Number(e.target.value) }))} style={INPUT} />
              </div>
              {isServices && (
                <>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Incoterm</div>
                    <select value={(detailForm.incoterm as string) ?? ""} onChange={(e) => setDetailForm(p => ({ ...p, incoterm: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      <option value="">—</option>
                      {INCOTERMS.map((inc: string) => <option key={inc} value={inc}>{inc}</option>)}
                    </select>
                  </div>
                  <div />
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Origen</div>
                    <input value={(detailForm.origin as string) ?? ""} onChange={(e) => setDetailForm(p => ({ ...p, origin: e.target.value }))} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Destino</div>
                    <input value={(detailForm.destination as string) ?? ""} onChange={(e) => setDetailForm(p => ({ ...p, destination: e.target.value }))} style={INPUT} />
                  </div>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
              <textarea rows={3} value={(detailForm.notes as string) ?? ""} onChange={(e) => setDetailForm(p => ({ ...p, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Términos y condiciones</div>
              <textarea rows={4} value={(detailForm.terms as string) ?? ""} onChange={(e) => setDetailForm(p => ({ ...p, terms: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
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
            {isOpen && (
              <div style={{ marginBottom: "4px" }}>
                {!showAddItem ? (
                  <button onClick={() => setShowAddItem(true)} style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar producto
                  </button>
                ) : (
                  <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-brand-blue)40", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "8px" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Buscar en catálogo (opcional)</div>
                      <input placeholder="SKU o nombre del producto…" style={INPUT} onChange={(e) => searchProducts(e.target.value)} />
                      {prodSuggestions.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                          {prodSuggestions.map((p) => (
                            <div key={p.id} onClick={() => selectSuggestion(p)} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                              <span style={{ fontWeight: 600 }}>{p.name} {p.sku && <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>({p.sku})</span>}</span>
                              <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>${Number(p.unit_price).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>SKU</div>
                        <input value={newItem.sku} onChange={(e) => setNewItem(p => ({ ...p, sku: e.target.value }))} placeholder="SKU-001" style={INPUT} />
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Descripción *</div>
                        <input value={newItem.description} onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Nombre del producto" style={INPUT} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Cant.</div>
                        <input type="number" min="0.001" value={newItem.quantity} onChange={(e) => setNewItem(p => ({ ...p, quantity: e.target.value }))} style={INPUT} />
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Unidad</div>
                        <select value={newItem.unit} onChange={(e) => setNewItem(p => ({ ...p, unit: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                          {UNITS.map((u: string) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>P. Unit. *</div>
                        <input type="number" min="0" step="0.01" value={newItem.unit_price} onChange={(e) => setNewItem(p => ({ ...p, unit_price: e.target.value }))} placeholder="0.00" style={INPUT} />
                      </div>
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Desc. %</div>
                        <input type="number" min="0" max="100" value={newItem.discount_pct} onChange={(e) => setNewItem(p => ({ ...p, discount_pct: e.target.value }))} style={INPUT} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleAddItem} disabled={addingItem || !newItem.description.trim() || !newItem.unit_price} style={{ height: "30px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        {addingItem ? t.general.loading : "+ Agregar"}
                      </button>
                      <button onClick={() => { setShowAddItem(false); setNewItem(EMPTY_ITEM); setProdSuggestions([]); }} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                        {t.general.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {items.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Sin productos</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)" }}>
                      {["SKU","Descripción","Cant.","Unidad","P. Unit.","Desc.%","Subtotal",""].map((h) => (
                        <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
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
                            {isEditingThis ? <input value={(itemForm.description as string) ?? ""} onChange={(e) => setItemForm(p => ({ ...p, description: e.target.value }))} style={{ ...INPUT, height: "28px" }} /> : <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}>
                            {isEditingThis ? <input type="number" min="0.001" value={(itemForm.quantity as number) ?? 1} onChange={(e) => setItemForm(p => ({ ...p, quantity: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "70px" }} /> : item.quantity}
                          </td>
                          <td style={{ padding: "7px 8px" }}>
                            {isEditingThis ? <select value={(itemForm.unit as string) ?? "pza"} onChange={(e) => setItemForm(p => ({ ...p, unit: e.target.value }))} style={{ ...INPUT, height: "28px", width: "70px", cursor: "pointer" }}>{UNITS.map((u: string) => <option key={u} value={u}>{u}</option>)}</select> : item.unit}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}>
                            {isEditingThis ? <input type="number" min="0" step="0.01" value={(itemForm.unit_price as number) ?? 0} onChange={(e) => setItemForm(p => ({ ...p, unit_price: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "90px" }} /> : `$${Number(item.unit_price).toLocaleString(locale, { minimumFractionDigits: 2 })}`}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}>
                            {isEditingThis ? <input type="number" min="0" max="100" value={(itemForm.discount_pct as number) ?? 0} onChange={(e) => setItemForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "60px" }} /> : (item.discount_pct > 0 ? `${item.discount_pct}%` : "—")}
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

        {/* ── SERVICIOS (billing_concepts con líneas de detalle) ── */}
        {tab === "items" && isServices && (
          <>
            {(() => {
              const concepts = (quotation as any).billing_concepts ?? [];
              if (concepts.length > 0) {
                return concepts.map((concept: any, ci: number) => {
                  const conceptTotal: Record<string, number> = {};
                  (concept.lines ?? []).forEach((l: any) => {
                    const cur = l.currency ?? concept.currency ?? "MXN";
                    conceptTotal[cur] = (conceptTotal[cur] ?? 0) + Number(l.price ?? 0);
                  });
                  return (
                    <div key={ci} style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
                      {/* Header concepto */}
                      <div style={{ padding: "10px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", border: "1px solid var(--color-brand-blue)30" }}>CFDI</span>
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{concept.description}</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {Object.entries(conceptTotal).map(([cur, val]) => (
                            <span key={cur} style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-success-text)" }}>
                              {fmtCur(val, cur)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Líneas de detalle */}
                      <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(concept.lines ?? []).map((line: any, li: number) => {
                          const taxLabel = line.tax_rate === -1 ? "Exento" : line.tax_rate === 0 ? "0%" : `IVA ${line.tax_rate ?? 16}%`;
                          return (
                            <div key={li} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line.description}</div>
                                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                                  {line.quantity} {line.unit_label} × {line.currency} ${Number(line.unit_price).toLocaleString(locale, { minimumFractionDigits: 2 })} · {taxLabel}
                                  {line.notes && ` · ${line.notes}`}
                                </div>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", flexShrink: 0, marginLeft: "12px" }}>
                                {fmtCur(Number(line.price), line.currency ?? "MXN")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              }
              // Fallback: servicios viejos
              if (services.length === 0) {
                return <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Sin servicios</div>;
              }
              return services.map((svc) => {
                const svcCfg   = SERVICE_TYPE_CONFIG[svc.service_type] ?? SERVICE_TYPE_CONFIG.otro;
                const svcLabel = (t.quot as any)?.[svcCfg.labelKey.replace("quot.", "")] ?? svc.service_type;
                const isEditingThis = editingItemId === svc.id;
                return (
                  <div key={svc.id} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: isEditingThis ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `1px solid ${isEditingThis ? "var(--color-info-border)" : "var(--color-border-faint)"}`, display: "grid", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: svcCfg.color + "20", color: svcCfg.color, border: `1px solid ${svcCfg.color}40` }}>{svcLabel}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isEditingThis ? (
                          <input type="number" min="0" step="0.01" value={(itemForm as any).price ?? svc.price} onChange={(e) => setItemForm((p: any) => ({ ...p, price: Number(e.target.value) }))} style={{ ...INPUT, height: "28px", width: "120px" }} />
                        ) : (
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>{svc.currency} ${Number(svc.price).toLocaleString(locale, { minimumFractionDigits: 2 })}</span>
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
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{svc.description}</div>
                    {!isEditingThis && (
                      <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                        {svc.origin && <span>📍 {svc.origin} → {svc.destination}</span>}
                        {svc.incoterm && <span>📄 {svc.incoterm}</span>}
                        {svc.transit_time && <span>⏱ {svc.transit_time}</span>}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </>
        )}

        {/* ── TOTALES ── */}
        {tab === "totals" && (
          <div style={{ maxWidth: "420px", marginLeft: "auto", display: "grid", gap: "8px" }}>
            {currencyEntries.map(([cur, vals], i) => (
              <div key={cur}>
                {currencyEntries.length > 1 && (
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    {cur}
                  </div>
                )}
                <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--color-border-faint)", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCur(vals.subtotal, cur)}</span>
                  </div>
                  {(quotation.discount_amount ?? 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--color-border-faint)", fontSize: "13px" }}>
                      <span style={{ color: "var(--color-warning-text)" }}>Descuento</span>
                      <span style={{ color: "var(--color-warning-text)", fontWeight: 600 }}>- {fmtCur(quotation.discount_amount ?? 0, cur)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--color-border-faint)", fontSize: "13px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>IVA</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtCur(vals.tax, cur)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-success-bg)", fontSize: "16px" }}>
                    <span style={{ color: "var(--color-success-text)", fontWeight: 800 }}>TOTAL {currencyEntries.length > 1 ? cur : ""}</span>
                    <span style={{ color: "var(--color-success-text)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtCur(vals.total, cur)}</span>
                  </div>
                </div>
                {i < currencyEntries.length - 1 && <div style={{ height: "8px" }} />}
              </div>
            ))}
          </div>
        )}

        {/* ── PDF / ENVÍO ── */}
        {tab === "preview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px" }}>

            {/* Botón descargar */}
            <button onClick={() => onOpenPDF(quotation)} style={{ height: "48px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar PDF
            </button>

            {/* Info plantilla */}
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "11px", color: "var(--color-text-muted)", display: "grid", gap: "3px" }}>
              <div><strong>Plantilla:</strong> Mobility OS</div>
              <div><strong>Tipo:</strong> {isServices ? ((quotation as any).service_subtype?.replace(/_/g, " ").toUpperCase() ?? "Servicios") : "Productos"}</div>
              <div><strong>Items:</strong> {isServices ? (((quotation as any).billing_concepts ?? services).length) : items.length}</div>
              {currencyEntries.map(([cur, vals]) => (
                <div key={cur}><strong>Total {cur}:</strong> {fmtCur(vals.total, cur)}</div>
              ))}
            </div>

            {/* Envío por correo */}
            <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Enviar por correo</div>

              {contactEmail ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span style={{ fontSize: "12px", color: "var(--color-info-text)", fontWeight: 600 }}>Para: {contactEmail}</span>
                </div>
              ) : (
                <div style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)" }}>
                  ⚠ Sin correo de contacto asignado en esta cotización
                </div>
              )}

              <div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>CC (opcional, separar con comas)</div>
                <input
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="correo1@empresa.com, correo2@empresa.com"
                  style={{ ...INPUT, height: "34px" }}
                />
              </div>

              <button
                disabled={sendingEmail || !contactEmail}
                onClick={() => setSendingEmail(true)}
                style={{ height: "40px", borderRadius: "var(--radius-md)", background: contactEmail ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: contactEmail ? "#fff" : "var(--color-text-muted)", border: contactEmail ? "none" : "1px solid var(--color-border)", fontSize: "13px", fontWeight: 700, cursor: contactEmail ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {sendingEmail ? "Enviando…" : "Enviar cotización por correo"}
              </button>
            </div>

            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "11px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
              💡 El PDF se genera con los datos actuales. Puedes reenviar la cotización en cualquier momento desde esta pantalla.
            </div>
          </div>
        )}
           </div>

      {/* ── MODAL ENTREGA ── */}
      {deliveryModal && (
        <>
          <div onClick={() => setDeliveryModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px, 94vw)", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", padding: "24px", zIndex: 501, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>Confirmar pedido — Datos de entrega</div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Fecha de entrega *</div>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box" as any }} />
            </div>

            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Dirección de entrega</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { v: "client_address", l: "📍 Dirección del cliente", d: "La registrada en el perfil del cliente" },
                  { v: "custom",         l: "✏️ Otra dirección",         d: "Capturar dirección diferente" },
                ].map(opt => (
                  <div key={opt.v} onClick={() => setDeliveryType(opt.v as any)}
                    style={{ padding: "12px", borderRadius: "var(--radius-md)", cursor: "pointer", border: `2px solid ${deliveryType === opt.v ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: deliveryType === opt.v ? "var(--color-info-bg)" : "var(--color-bg-subtle)" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: deliveryType === opt.v ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{opt.l}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>{opt.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {deliveryType === "custom" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { k: "address", l: "Calle y número", v: deliveryAddress, fn: setDeliveryAddress, cols: "1 / -1" },
                  { k: "city",    l: "Ciudad",          v: deliveryCity,    fn: setDeliveryCity,    cols: undefined },
                  { k: "state",   l: "Estado",          v: deliveryState,   fn: setDeliveryState,   cols: undefined },
                ].map(f => (
                  <div key={f.k} style={{ gridColumn: f.cols ?? "auto" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{f.l}</div>
                    <input value={f.v} onChange={e => f.fn(e.target.value)}
                      style={{ width: "100%", height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" as any }} />
                  </div>
                ))}
              </div>
            )}

            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas de entrega (opcional)</div>
              <input value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder="Instrucciones especiales, horario, contacto…"
                style={{ width: "100%", height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" as any }} />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setDeliveryModal(false)} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleAccept} disabled={!deliveryDate || accepting}
                style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: deliveryDate ? "var(--color-success-text)" : "var(--color-bg-subtle)", color: deliveryDate ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: deliveryDate ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {accepting ? "Creando pedido…" : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Confirmar y crear pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

