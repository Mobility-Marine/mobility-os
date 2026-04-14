"use client";
import { useState, useEffect } from "react";
import type { Requisition, RequisitionItem, RequisitionStatus, RequisitionPriority } from "../types/requisition.types";
import { REQUISITION_STATUS_CONFIG, PRIORITY_CONFIG, calcRequisitionTotal } from "../types/requisition.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchProductCatalog, type CatalogProduct } from "@/lib/services/products.service";

type Props = {
  requisition:   Requisition | null;
  saving:        boolean;
  onUpdate:      (id: string, updates: Partial<Requisition>) => Promise<void>;
  onStatusChange:(id: string, status: RequisitionStatus, extra?: { rejection_reason?: string }) => Promise<void>;
  onDelete:      (id: string) => Promise<void>;
  onUpsertItem:  (requisitionId: string, item: Partial<RequisitionItem>) => Promise<void>;
  onDeleteItem:  (itemId: string) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border-faint)", marginBottom: "10px", gridColumn: "1 / -1" }}>
      {children}
    </div>
  );
}

const NEXT_STATUS: Partial<Record<RequisitionStatus, { next: RequisitionStatus; label: string; color: string; bg: string; border: string }[]>> = {
  draft:            [{ next: "pending_approval", label: "Enviar a aprobación", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" }],
  pending_approval: [
    { next: "approved",  label: "Aprobar",  color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
    { next: "rejected",  label: "Rechazar", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  ],
  approved: [{ next: "in_quotation", label: "Solicitar cotizaciones", color: "#7c3aed", bg: "#f3e8ff", border: "#d8b4fe" }],
};

export default function RequisitionWorkspace({ requisition, saving, onUpdate, onStatusChange, onDelete, onUpsertItem, onDeleteItem }: Props) {
  const { t, lang } = useTranslation();
  const { companyId } = useTenant();
  const tp = (t.procurement as any) ?? {};
  const locale = lang === "en" ? "en-US" : "es-MX";
  const es = lang !== "en";

  const [editing,     setEditing]     = useState(false);
  const [form,        setForm]        = useState<Partial<Requisition>>({});
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason,setRejectReason]= useState("");

  // Item form
  const [addingItem,        setAddingItem]        = useState(false);
  const [itemDesc,          setItemDesc]          = useState("");
  const [itemQty,           setItemQty]           = useState("1");
  const [itemUnit,          setItemUnit]          = useState("pza");
  const [itemPrice,         setItemPrice]         = useState("");
  const [itemCurrency,      setItemCurrency]      = useState("MXN");
  const [itemNotes,         setItemNotes]         = useState("");
  const [itemProductId,     setItemProductId]     = useState("");

  // Catálogo de productos
  const [products,       setProducts]       = useState<CatalogProduct[]>([]);
  const [productSearch,  setProductSearch]  = useState("");

  useEffect(() => {
    if (addingItem && companyId && products.length === 0) {
      fetchProductCatalog(companyId).then(setProducts);
    }
  }, [addingItem, companyId]);

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return q && (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  function selectProduct(p: CatalogProduct) {
    setItemDesc(p.name);
    setItemUnit(p.unit);
    if (p.cost > 0) setItemPrice(String(p.cost));
    setItemProductId(p.id);
    setProductSearch("");
  }

  if (!requisition) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tp.reqWorkspaceEmpty ?? "Selecciona una requisición"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>Aquí verás el detalle, ítems y flujo de aprobación.</div>
    </div>
  );

  const stCfg   = REQUISITION_STATUS_CONFIG[requisition.status];
  const prCfg   = PRIORITY_CONFIG[requisition.priority];
  const stLabel = tp[stCfg.labelKey.replace("procurement.", "")] ?? requisition.status;
  const prLabel = tp[prCfg.labelKey.replace("procurement.", "")] ?? requisition.priority;
  const items   = requisition.items ?? [];
  const total   = calcRequisitionTotal(items);
  const nextOpts= NEXT_STATUS[requisition.status] ?? [];

  function set(k: keyof Requisition, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() { await onUpdate(requisition.id, form); setEditing(false); setForm({}); }

  async function handleSaveItem() {
    if (!itemDesc.trim()) return;
    await onUpsertItem(requisition.id, {
      description:     itemDesc.trim(),
      quantity:        parseFloat(itemQty) || 1,
      unit:            itemUnit,
      estimated_price: itemPrice ? parseFloat(itemPrice) : null,
      currency:        itemCurrency,
      notes:           itemNotes || null,
      sort_order:      items.length,
      product_id:      itemProductId || undefined,
    });
    setAddingItem(false);
    setItemDesc(""); setItemQty("1"); setItemUnit("pza");
    setItemPrice(""); setItemNotes(""); setItemProductId("");
    setProductSearch("");
  }

  async function handleReject() {
    await onStatusChange(requisition.id, "rejected", { rejection_reason: rejectReason });
    setRejectModal(false); setRejectReason("");
  }

  const canEdit = ["draft", "approved"].includes(requisition.status);

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", fontFamily: "monospace" }}>{requisition.requisition_number}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: prCfg.bg, border: `1px solid ${prCfg.border}`, color: prCfg.color }}>{prLabel}</span>
              {requisition.auto_generated && (
                <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>{tp.autoGenerated ?? "Auto"}</span>
              )}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{requisition.title}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {requisition.department && `${requisition.department} · `}
              {requisition.needed_by && `Requerido: ${new Date(requisition.needed_by).toLocaleDateString(locale)}`}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--color-brand-blue)" }}>
              {new Intl.NumberFormat(locale, { style: "currency", currency: "MXN" }).format(total)}
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{items.length} ítems</div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {canEdit && !editing && (
            <button onClick={() => { setForm({ ...requisition }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
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
          {!editing && nextOpts.map((opt) => (
            <button key={opt.next} onClick={() => { if (opt.next === "rejected") { setRejectModal(true); return; } onStatusChange(requisition.id, opt.next); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: opt.bg, border: `1px solid ${opt.border}`, color: opt.color, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {opt.label} →
            </button>
          ))}
          {!["cancelled","received","rejected"].includes(requisition.status) && !editing && (
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>{t.general.delete}</button>
              ) : (
                <>
                  <button onClick={() => onDelete(requisition.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
                  <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>{(t.general as any).no ?? "No"}</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        <div style={{ display: "grid", gap: "18px" }}>

          {requisition.status === "rejected" && requisition.rejection_reason && (
            <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", marginBottom: "4px", textTransform: "uppercase" }}>{tp.rejectionReason ?? "Motivo de rechazo"}</div>
              <div style={{ fontSize: "13px", color: "var(--color-danger-text)" }}>{requisition.rejection_reason}</div>
            </div>
          )}

          {/* DATOS GENERALES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <SectionTitle>Datos de la requisición</SectionTitle>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={tp.requisitionTitle ?? "Título"}>
                {editing ? <input value={(form as any).title ?? ""} onChange={(e) => set("title", e.target.value)} style={INPUT} /> : <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{requisition.title}</div>}
              </Field>
            </div>
            <Field label="Prioridad">
              {editing ? (
                <select value={(form as any).priority ?? requisition.priority} onChange={(e) => set("priority", e.target.value as RequisitionPriority)} style={{ ...INPUT, cursor: "pointer" }}>
                  {(["low","normal","high","urgent"] as RequisitionPriority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return <option key={p} value={p}>{tp[cfg.labelKey.replace("procurement.", "")] ?? p}</option>;
                  })}
                </select>
              ) : <span style={{ fontSize: "12px", fontWeight: 700, color: prCfg.color }}>{prLabel}</span>}
            </Field>
            <Field label={tp.neededBy ?? "Fecha requerida"}>
              {editing ? <input type="date" value={(form as any).needed_by ?? ""} onChange={(e) => set("needed_by", e.target.value)} style={INPUT} /> : <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>{requisition.needed_by ? new Date(requisition.needed_by).toLocaleDateString(locale) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>}
            </Field>
            <Field label={tp.department ?? "Área"}>
              {editing ? <input value={(form as any).department ?? ""} onChange={(e) => set("department", e.target.value)} style={INPUT} /> : <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>{requisition.department ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</div>}
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={tp.justification ?? "Justificación"}>
                {editing ? (
                  <textarea rows={3} value={(form as any).justification ?? ""} onChange={(e) => set("justification", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
                ) : (
                  <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: requisition.justification ? "var(--color-text-primary)" : "var(--color-text-muted)", lineHeight: 1.6, minHeight: "50px" }}>
                    {requisition.justification ?? "Sin justificación."}
                  </div>
                )}
              </Field>
            </div>
          </div>

          {/* ÍTEMS */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ítems solicitados</div>
              {canEdit && !addingItem && (
                <button onClick={() => setAddingItem(true)} style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {es ? "Agregar ítem" : "Add item"}
                </button>
              )}
            </div>

            {addingItem && (
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px", marginBottom: "8px" }}>

                {/* BUSCADOR CATÁLOGO */}
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                    {es ? "Buscar en catálogo (opcional)" : "Search catalog (optional)"}
                  </div>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: "7px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={es ? "Nombre, SKU o categoría…" : "Name, SKU or category…"}
                      style={{ ...INPUT, height: "30px", fontSize: "11px", paddingLeft: "24px" }}
                    />
                  </div>

                  {productSearch.trim() && filteredProducts.length > 0 && (
                    <div style={{ border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-sm)", marginTop: "4px", maxHeight: "160px", overflowY: "auto", background: "var(--color-bg-base)" }}>
                      {filteredProducts.slice(0, 15).map((p) => (
                        <div key={p.id} onClick={() => selectProduct(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", transition: "background 0.1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{p.name}</div>
                            <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{p.sku && `${p.sku} · `}{p.category ?? ""}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                            {p.cost > 0 && <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)" }}>${p.cost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>}
                            <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{p.unit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {itemProductId && (
                    <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "5px", padding: "4px 8px", background: "var(--color-info-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-info-border)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 600, flex: 1 }}>
                        {products.find((p) => p.id === itemProductId)?.name ?? (es ? "Del catálogo" : "From catalog")}
                      </span>
                      <button onClick={() => setItemProductId("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-brand-blue)", lineHeight: 1 }}>✕</button>
                    </div>
                  )}
                </div>

                {/* CAMPOS DEL ÍTEM */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 100px 70px", gap: "8px", alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Descripción *" : "Description *"}</div>
                    <input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Cant." : "Qty"}</div>
                    <input type="number" min="0.001" step="0.001" value={itemQty} onChange={(e) => setItemQty(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Unidad" : "Unit"}</div>
                    <input value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Precio est." : "Est. price"}</div>
                    <input type="number" min="0" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="0.00" style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={handleSaveItem} disabled={!itemDesc.trim()} style={{ flex: 1, height: "30px", borderRadius: "var(--radius-sm)", background: itemDesc.trim() ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: itemDesc.trim() ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>✓</button>
                    <button onClick={() => { setAddingItem(false); setItemDesc(""); setItemQty("1"); setItemUnit("pza"); setItemPrice(""); setItemProductId(""); setProductSearch(""); }} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {es ? "Sin ítems. Agrega lo que necesitas comprar." : "No items. Add what you need to purchase."}
              </div>
            ) : (
              <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 100px 24px", gap: "8px", padding: "7px 12px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
                  {[es ? "Descripción" : "Description", es ? "Cant." : "Qty", es ? "Unidad" : "Unit", es ? "Precio est." : "Est. price", ""].map((h) => (
                    <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{h}</div>
                  ))}
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 100px 24px", gap: "8px", padding: "8px 12px", borderBottom: idx < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                      {item.notes && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.notes}</div>}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-primary)", textAlign: "right" }}>{item.quantity}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.unit}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-success-text)", textAlign: "right" }}>
                      {item.estimated_price != null
                        ? new Intl.NumberFormat(locale, { style: "currency", currency: item.currency }).format(item.estimated_price * item.quantity)
                        : <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>—</span>}
                    </div>
                    {canEdit ? (
                      <button onClick={() => onDeleteItem(item.id)} style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    ) : <div />}
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "8px 12px", background: "var(--color-bg-subtle)", borderTop: "2px solid var(--color-border-faint)", gap: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{es ? "Total estimado" : "Estimated total"}</span>
                  <span style={{ fontSize: "16px", fontWeight: 900, color: "var(--color-brand-blue)" }}>
                    {new Intl.NumberFormat(locale, { style: "currency", currency: "MXN" }).format(total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL RECHAZO */}
      {rejectModal && (
        <>
          <div onClick={() => setRejectModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500 }} />
          <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", padding: "24px", width: "min(440px, 90vw)", boxShadow: "var(--shadow-xl)", zIndex: 501, display: "grid", gap: "14px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tp.rejectReq ?? "Rechazar requisición"}</div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.rejectionReason ?? "Motivo de rechazo"}</div>
              <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explica el motivo del rechazo…" style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.5 }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setRejectModal(false)} style={{ flex: 1, height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>{t.general.cancel}</button>
              <button onClick={handleReject} disabled={saving} style={{ flex: 1, height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : (tp.rejectReq ?? "Rechazar")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
