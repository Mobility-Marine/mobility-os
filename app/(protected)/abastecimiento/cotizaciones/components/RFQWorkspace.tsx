"use client";
import { useState, useEffect } from "react";
import type { RFQ, RFQItem, RFQResponse, RFQStatus } from "../types/rfq.types";
import { RFQ_STATUS_CONFIG, buildComparative } from "../types/rfq.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }      from "@/lib/tenant/TenantProvider";
import { supabase }       from "@/lib/supabaseClient";

type Tab = "items" | "comparative" | "suppliers";

type Props = {
  rfq:                    RFQ | null;
  saving:                 boolean;
  onUpdate:               (id: string, u: Partial<RFQ>) => Promise<void>;
  onStatusChange:         (id: string, s: RFQStatus) => Promise<void>;
  onDelete:               (id: string) => Promise<void>;
  onUpsertItem:           (rfqId: string, item: Partial<RFQItem>) => Promise<void>;
  onDeleteItem:           (rfqId: string, itemId: string) => Promise<void>;
  onAddSupplier:          (rfqId: string, supplierId: string) => Promise<void>;
  onRemoveSupplier:       (rfqId: string, responseId: string) => Promise<void>;
  onUpsertResponseItem:   (rfqId: string, responseId: string, rfqItemId: string, price: number, currency: string) => Promise<void>;
  onAward:                (rfqId: string, supplierId: string) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const NEXT_STATUS: Partial<Record<RFQStatus, { next: RFQStatus; label: string; color: string; bg: string; border: string }>> = {
  draft:              { next: "sent",               label: "Marcar enviada a proveedores", color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  sent:               { next: "responses_received", label: "Marcar respuestas recibidas",  color: "#7c3aed",                   bg: "#f3e8ff",                 border: "#d8b4fe"                     },
  responses_received: { next: "evaluated",          label: "Marcar evaluada",              color: "#d97706",                   bg: "#fef3c7",                 border: "#fcd34d"                     },
};

export default function RFQWorkspace({
  rfq, saving, onUpdate, onStatusChange, onDelete,
  onUpsertItem, onDeleteItem, onAddSupplier, onRemoveSupplier,
  onUpsertResponseItem, onAward,
}: Props) {
  const { t, lang } = useTranslation();
  const { companyId } = useTenant();
  const tp     = (t.procurement as any) ?? {};
  const locale = lang === "en" ? "en-US" : "es-MX";

  const [tab,         setTab]        = useState<Tab>("items");
  const [editing,     setEditing]    = useState(false);
  const [form,        setForm]       = useState<Partial<RFQ>>({});
  const [confirmDel,  setConfirmDel] = useState(false);

  // Item form
  const [addingItem,  setAddingItem]  = useState(false);
  const [itemDesc,    setItemDesc]    = useState("");
  const [itemQty,     setItemQty]     = useState("1");
  const [itemUnit,    setItemUnit]    = useState("pza");

  // Supplier picker
  const [supplierSearch,   setSupplierSearch]   = useState("");
  const [supplierResults,  setSupplierResults]  = useState<{ id: string; name: string }[]>([]);
  const [showSupplierPick, setShowSupplierPick] = useState(false);

  // Precio inline en comparativo
  const [editingPrice, setEditingPrice] = useState<{ responseId: string; itemId: string; value: string } | null>(null);

  // Award confirm
  const [awardingSupplier, setAwardingSupplier] = useState<{ id: string; name: string } | null>(null);

  // Búsqueda de proveedores
  useEffect(() => {
    if (!supplierSearch.trim() || !companyId) { setSupplierResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("business_partners")
        .select("id, name, rfc")
        .eq("company_id", companyId)
        .eq("is_supplier", true)
        .eq("is_active", true)
        .or(`name.ilike.%${supplierSearch}%,rfc.ilike.%${supplierSearch}%`)
        .limit(8);
      setSupplierResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierSearch, companyId]);

  if (!rfq) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tp.rfqWorkspaceEmpty ?? "Selecciona una solicitud"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>Aquí verás los ítems, proveedores y el comparativo de precios.</div>
    </div>
  );

  const stCfg      = RFQ_STATUS_CONFIG[rfq.status];
  const stLabel    = tp[stCfg.labelKey.replace("procurement.", "")] ?? rfq.status;
  const items      = rfq.items     ?? [];
  const responses  = rfq.responses ?? [];
  const nextOpt    = NEXT_STATUS[rfq.status];
  const comparative = buildComparative(rfq);
  const awarded    = responses.find((r) => r.status === "awarded");

  function set(k: keyof RFQ, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    await onUpdate(rfq.id, form);
    setEditing(false); setForm({});
  }

  async function handleSaveItem() {
    if (!itemDesc.trim()) return;
    await onUpsertItem(rfq.id, {
      description: itemDesc.trim(),
      quantity:    parseFloat(itemQty) || 1,
      unit:        itemUnit,
      sort_order:  items.length,
    });
    setAddingItem(false);
    setItemDesc(""); setItemQty("1"); setItemUnit("pza");
  }

  async function handleSavePrice() {
    if (!editingPrice) return;
    const price = parseFloat(editingPrice.value);
    if (isNaN(price) || price < 0) { setEditingPrice(null); return; }
    await onUpsertResponseItem(rfq.id, editingPrice.responseId, editingPrice.itemId, price, rfq.currency);
    setEditingPrice(null);
  }

  const canEdit = ["draft"].includes(rfq.status);

  const TABS: { key: Tab; label: string }[] = [
    { key: "items",       label: `Ítems (${items.length})` },
    { key: "suppliers",   label: `${tp.rfqAddSupplier ?? "Proveedores"} (${responses.length})` },
    { key: "comparative", label: tp.rfqComparative ?? "Comparativo" },
  ];

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", fontFamily: "monospace" }}>{rfq.rfq_number}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
              {awarded && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-success-text)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                  Adjudicado: {awarded.supplier?.name}
                </span>
              )}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {editing
                ? <input value={(form as any).title ?? rfq.title} onChange={(e) => set("title", e.target.value)} style={{ ...INPUT, fontSize: "15px", fontWeight: 800, height: "36px" }} />
                : rfq.title
              }
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {rfq.deadline && `Límite: ${new Date(rfq.deadline).toLocaleDateString(locale)}`}
              {rfq.deadline && rfq.currency && " · "}
              {rfq.currency}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {canEdit && !editing && (
            <button onClick={() => { setForm({ ...rfq }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          )}
          {editing && (
            <>
              <button onClick={handleSave} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {!editing && nextOpt && (
            <button onClick={() => onStatusChange(rfq.id, nextOpt.next)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: nextOpt.bg, border: `1px solid ${nextOpt.border}`, color: nextOpt.color, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {nextOpt.label} →
            </button>
          )}

          {!editing && !["cancelled","awarded"].includes(rfq.status) && (
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>
                  {t.general.delete}
                </button>
              ) : (
                <>
                  <button onClick={() => onDelete(rfq.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
                  <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>{(t.general as any).no ?? "No"}</button>
                </>
              )}
            </div>
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
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── ÍTEMS ── */}
        {tab === "items" && (
          <div style={{ display: "grid", gap: "10px" }}>
            {canEdit && !addingItem && (
              <button onClick={() => setAddingItem(true)} style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar ítem
              </button>
            )}

            {addingItem && (
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 80px 80px auto", gap: "8px", alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Descripción *</div>
                  <input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Cant.</div>
                  <input type="number" min="0" value={itemQty} onChange={(e) => setItemQty(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Unidad</div>
                  <input value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={handleSaveItem} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>✓</button>
                  <button onClick={() => { setAddingItem(false); setItemDesc(""); setItemQty("1"); setItemUnit("pza"); }} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Agrega los ítems que quieres cotizar.
              </div>
            ) : (
              <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 24px", gap: "8px", padding: "7px 12px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
                  {["Descripción","Cantidad","Unidad",""].map((h) => (
                    <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</div>
                  ))}
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 24px", gap: "8px", padding: "8px 12px", borderBottom: idx < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-primary)", textAlign: "right" }}>{item.quantity}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.unit}</div>
                    {canEdit ? (
                      <button onClick={() => onDeleteItem(rfq.id, item.id)} style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROVEEDORES ── */}
        {tab === "suppliers" && (
          <div style={{ display: "grid", gap: "10px" }}>
            {rfq.status !== "awarded" && (
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.rfqAddSupplier ?? "Agregar proveedor"}</div>
                <div style={{ position: "relative" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    value={supplierSearch}
                    onChange={(e) => { setSupplierSearch(e.target.value); setShowSupplierPick(true); }}
                    onFocus={() => setShowSupplierPick(true)}
                    placeholder="Buscar proveedor para agregar…"
                    style={{ ...INPUT, paddingLeft: "30px" }}
                  />
                </div>
                {showSupplierPick && supplierResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", zIndex: 50, maxHeight: "200px", overflowY: "auto", marginTop: "4px" }}>
                    {supplierResults
                      .filter((s) => !responses.find((r) => r.supplier_id === s.id))
                      .map((s) => (
                        <button key={s.id} onClick={async () => {
                          await onAddSupplier(rfq.id, s.id);
                          setSupplierSearch(""); setShowSupplierPick(false);
                        }} style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: "13px", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          {s.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {responses.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Agrega proveedores para solicitar sus precios.
              </div>
            ) : responses.map((resp) => {
              const isAwarded = resp.status === "awarded";
              const hasItems  = (resp.items?.length ?? 0) > 0;

              return (
                <div key={resp.id} style={{ borderRadius: "var(--radius-md)", background: isAwarded ? "var(--color-success-bg)" : "var(--color-bg-subtle)", border: `1px solid ${isAwarded ? "var(--color-success-border)" : "var(--color-border-faint)"}`, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: isAwarded ? "var(--color-success-text)" : "var(--color-text-primary)", flex: 1 }}>
                      {resp.supplier?.name ?? "Proveedor"}
                    </span>
                    {isAwarded && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-success-text)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", padding: "2px 7px", borderRadius: "var(--radius-full)" }}>
                        {tp.rfqAwardedTo ?? "Adjudicado"}
                      </span>
                    )}
                    {hasItems && !isAwarded && rfq.status === "evaluated" && (
                      <button onClick={() => setAwardingSupplier({ id: resp.supplier_id, name: resp.supplier?.name ?? "" })} style={{ height: "24px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        {tp.rfqAward ?? "Adjudicar"}
                      </button>
                    )}
                    {!isAwarded && rfq.status !== "awarded" && (
                      <button onClick={() => onRemoveSupplier(rfq.id, resp.id)} style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                  {resp.delivery_days && (
                    <div style={{ padding: "0 14px 8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                      Entrega: {resp.delivery_days} días · {resp.payment_terms}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── COMPARATIVO ── */}
        {tab === "comparative" && (
          <div style={{ display: "grid", gap: "14px" }}>
            {responses.length === 0 || items.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {responses.length === 0 ? "Agrega proveedores en la pestaña Proveedores." : "Agrega ítems para comparar."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-subtle)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", borderBottom: "2px solid var(--color-border-faint)", whiteSpace: "nowrap" }}>
                        Ítem
                      </th>
                      {responses.map((r) => (
                        <th key={r.id} style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: r.status === "awarded" ? "var(--color-success-text)" : "var(--color-text-primary)", fontSize: "11px", borderBottom: "2px solid var(--color-border-faint)", whiteSpace: "nowrap", background: r.status === "awarded" ? "var(--color-success-bg)" : "var(--color-bg-subtle)" }}>
                          {r.supplier?.name ?? "Proveedor"}
                          {r.status === "awarded" && " ★"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparative.map((row) => (
                      <tr key={row.item.id} style={{ borderBottom: "1px solid var(--color-border-faint)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          <div>{row.item.description}</div>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{row.item.quantity} {row.item.unit}</div>
                        </td>
                        {responses.map((resp) => {
                          const priceData = row.prices[resp.supplier_id];
                          const isBest    = row.bestSupplierId === resp.supplier_id && row.bestPrice !== null;
                          const isEditing = editingPrice?.responseId === resp.id && editingPrice?.itemId === row.item.id;

                          return (
                            <td key={resp.id} style={{ padding: "8px 12px", textAlign: "center", background: isBest ? "rgba(22,163,74,0.05)" : "transparent" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={editingPrice.value}
                                    onChange={(e) => setEditingPrice({ ...editingPrice, value: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSavePrice(); if (e.key === "Escape") setEditingPrice(null); }}
                                    autoFocus
                                    style={{ width: "80px", height: "28px", padding: "0 6px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none" }}
                                  />
                                  <button onClick={handleSavePrice} style={{ height: "28px", padding: "0 6px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-blue)", color: "#fff", border: "none", cursor: "pointer", fontSize: "11px" }}>✓</button>
                                </div>
                              ) : (
                                <button onClick={() => setEditingPrice({ responseId: resp.id, itemId: row.item.id, value: priceData ? String(priceData.price) : "" })} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", padding: "4px" }}>
                                  {priceData ? (
                                    <div>
                                      <div style={{ fontSize: "13px", fontWeight: isBest ? 800 : 600, color: isBest ? "var(--color-success-text)" : "var(--color-text-primary)" }}>
                                        {new Intl.NumberFormat(locale, { style: "currency", currency: priceData.currency }).format(priceData.price)}
                                      </div>
                                      {isBest && <div style={{ fontSize: "9px", color: "var(--color-success-text)", fontWeight: 700 }}>MEJOR PRECIO</div>}
                                      {!isBest && row.bestPrice !== null && (
                                        <div style={{ fontSize: "9px", color: "var(--color-danger-text)" }}>
                                          +{((priceData.price - row.bestPrice) / row.bestPrice * 100).toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", borderBottom: "1px dashed var(--color-border)" }}>— ingresar</span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Fila de totales */}
                    <tr style={{ background: "var(--color-bg-subtle)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--color-text-primary)", fontSize: "11px", textTransform: "uppercase" }}>Total</td>
                      {responses.map((resp) => {
                        const total = comparative.reduce((sum, row) => {
                          const p = row.prices[resp.supplier_id];
                          return sum + (p ? p.price * row.item.quantity : 0);
                        }, 0);
                        const isLowest = responses.every((r2) => {
                          if (r2.id === resp.id) return true;
                          const t2 = comparative.reduce((s, row) => { const p = row.prices[r2.supplier_id]; return s + (p ? p.price * row.item.quantity : 0); }, 0);
                          return total <= t2;
                        });

                        return (
                          <td key={resp.id} style={{ padding: "10px 12px", textAlign: "center", background: isLowest && total > 0 ? "var(--color-success-bg)" : "transparent" }}>
                            <div style={{ fontSize: "14px", fontWeight: 900, color: isLowest && total > 0 ? "var(--color-success-text)" : "var(--color-text-primary)" }}>
                              {total > 0 ? new Intl.NumberFormat(locale, { style: "currency", currency: rfq.currency }).format(total) : "—"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL ADJUDICACIÓN */}
      {awardingSupplier && (
        <>
          <div onClick={() => setAwardingSupplier(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500 }} />
          <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", padding: "24px", width: "min(400px, 90vw)", boxShadow: "var(--shadow-xl)", zIndex: 501, display: "grid", gap: "16px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tp.rfqAward ?? "Adjudicar RFQ"}</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-second)", lineHeight: 1.6 }}>
              ¿Confirmas adjudicar esta solicitud a <strong>{awardingSupplier.name}</strong>?<br/>
              Los demás proveedores quedarán marcados como no adjudicados.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setAwardingSupplier(null)} style={{ flex: 1, height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
              <button onClick={async () => { await onAward(rfq.id, awardingSupplier.id); setAwardingSupplier(null); }} disabled={saving} style={{ flex: 1, height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : (tp.rfqAward ?? "Adjudicar")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
