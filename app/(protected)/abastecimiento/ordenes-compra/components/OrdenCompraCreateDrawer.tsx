"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Supplier, CreatePOPayload, CreatePOItemPayload } from "../types/ordenes-compra.types";
import { CURRENCIES, UNITS, PAYMENT_TERMS_OPTIONS, DELIVERY_TERMS_OPTIONS } from "../types/ordenes-compra.types";

type Props = {
  open:      boolean;
  suppliers: Supplier[];
  saving:    boolean;
  onClose:   () => void;
  onCreate:  (payload: CreatePOPayload, items: CreatePOItemPayload[]) => Promise<void>;
};

type Step = "supplier" | "items" | "config";

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrdenCompraCreateDrawer({ open, suppliers, saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [step, setStep] = useState<Step>("supplier");
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreatePOPayload>({
    currency: "MXN", tax_rate: 16,
    order_date: new Date().toISOString().split("T")[0],
  });

  const [items, setItems] = useState<CreatePOItemPayload[]>([]);
  const [itemForm, setItemForm] = useState({
    description: "", quantity: "1", unit: "pza",
    unit_price: "", discount_pct: "0", tax_rate: "16", notes: "",
  });

  function setF(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }
  function setIF(k: string, v: any) { setItemForm((p) => ({ ...p, [k]: v })); }

  function addItem() {
    if (!itemForm.description.trim() || !itemForm.unit_price) return;
    setItems((p) => [...p, {
      description:  itemForm.description,
      quantity:     Number(itemForm.quantity) || 1,
      unit:         itemForm.unit,
      unit_price:   Number(itemForm.unit_price),
      discount_pct: Number(itemForm.discount_pct) || 0,
      tax_rate:     Number(itemForm.tax_rate) || 16,
      notes:        itemForm.notes || undefined,
    }]);
    setItemForm({ description: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0", tax_rate: "16", notes: "" });
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100), 0);
  const taxBase  = subtotal - (form.discount_amount ?? 0);
  const taxAmt   = taxBase * ((form.tax_rate ?? 16) / 100);
  const total    = taxBase + taxAmt;

  async function handleCreate() {
    if (!form.supplier_id) { setError(es ? "Selecciona un proveedor" : "Select a supplier"); return; }
    if (items.length === 0) { setError(es ? "Agrega al menos un ítem" : "Add at least one item"); return; }
    setError(null);
    try {
      await onCreate(form, items);
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setStep("supplier");
    setForm({ currency: "MXN", tax_rate: 16, order_date: new Date().toISOString().split("T")[0] });
    setItems([]);
    setError(null);
    onClose();
  }

  if (!open) return null;

  const STEPS: { key: Step; labelEs: string; labelEn: string }[] = [
    { key: "supplier", labelEs: "Proveedor",     labelEn: "Supplier" },
    { key: "items",    labelEs: "Ítems",          labelEn: "Items"    },
    { key: "config",   labelEs: "Configuración",  labelEn: "Config"   },
  ];

  const selectedSupplier = suppliers.find((s) => s.id === form.supplier_id);

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(680px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{es ? "Nueva Orden de Compra" : "New Purchase Order"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{STEPS.find((s) => s.key === step)?.[es ? "labelEs" : "labelEn"]}</div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {STEPS.map((s, i) => {
              const idx = STEPS.findIndex((x) => x.key === step);
              return (
                <div key={s.key} style={{ flex: 1 }}>
                  <div style={{ height: "3px", borderRadius: "2px", background: i <= idx ? "var(--color-brand-blue)" : "var(--color-border-faint)" }} />
                  <div style={{ fontSize: "9px", fontWeight: 600, color: i === idx ? "var(--color-brand-blue)" : "var(--color-text-muted)", marginTop: "3px", textTransform: "uppercase" }}>
                    {es ? s.labelEs : s.labelEn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ margin: "0 24px", marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* STEP 1: PROVEEDOR */}
          {step === "supplier" && (
            <>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Proveedor *" : "Supplier *"}</div>
                <select value={form.supplier_id ?? ""} onChange={(e) => setF("supplier_id", e.target.value)} style={SELECT}>
                  <option value="">{es ? "Selecciona un proveedor…" : "Select a supplier…"}</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedSupplier && (
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gap: "5px" }}>
                  {[
                    { l: es ? "Contacto"      : "Contact",       v: selectedSupplier.contact     },
                    { l: es ? "Email"         : "Email",         v: selectedSupplier.email       },
                    { l: es ? "RFC"           : "Tax ID",        v: selectedSupplier.tax_id      },
                    { l: es ? "Condiciones"   : "Payment terms", v: selectedSupplier.payment_terms},
                    { l: es ? "Ciudad"        : "City",          v: selectedSupplier.city        },
                  ].map((r) => r.v ? (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-info-text)" }}>{r.l}</span>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                    </div>
                  ) : null)}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Fecha de orden" : "Order date"}</div>
                  <input type="date" value={form.order_date ?? ""} onChange={(e) => setF("order_date", e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Fecha esperada de entrega" : "Expected delivery date"}</div>
                  <input type="date" value={form.expected_date ?? ""} onChange={(e) => setF("expected_date", e.target.value)} style={INPUT} />
                </div>
              </div>
            </>
          )}

          {/* STEP 2: ÍTEMS */}
          {step === "items" && (
            <>
              {/* Form agregar ítem */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Agregar ítem" : "Add item"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Descripción *" : "Description *"}</div>
                    <input value={itemForm.description} onChange={(e) => setIF("description", e.target.value)} placeholder={es ? "Tornillo M6 × 20mm…" : "M6 × 20mm screw…"} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Unidad" : "Unit"}</div>
                    <select value={itemForm.unit} onChange={(e) => setIF("unit", e.target.value)} style={{ ...SELECT, height: "36px" }}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Cantidad *" : "Qty *"}</div>
                    <input type="number" min="0.001" value={itemForm.quantity} onChange={(e) => setIF("quantity", e.target.value)} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Precio unit. *" : "Unit price *"}</div>
                    <input type="number" min="0" value={itemForm.unit_price} onChange={(e) => setIF("unit_price", e.target.value)} placeholder="0.00" style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Desc. %" : "Disc. %"}</div>
                    <input type="number" min="0" max="100" value={itemForm.discount_pct} onChange={(e) => setIF("discount_pct", e.target.value)} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "IVA %" : "Tax %"}</div>
                    <input type="number" min="0" max="100" value={itemForm.tax_rate} onChange={(e) => setIF("tax_rate", e.target.value)} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <button onClick={addItem} disabled={!itemForm.description.trim() || !itemForm.unit_price} style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    + {es ? "Agregar" : "Add"}
                  </button>
                </div>
              </div>

              {/* Lista de ítems */}
              {items.length > 0 && (
                <div style={{ display: "grid", gap: "5px" }}>
                  {items.map((item, i) => {
                    const base = item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100);
                    return (
                      <div key={i} style={{ display: "flex", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                        <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.quantity} {item.unit}</div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(base)}</div>
                        <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totales preview */}
              {items.length > 0 && (
                <div style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "4px", marginTop: "4px" }}>
                  {[
                    { l: es ? "Subtotal" : "Subtotal", v: fmt(subtotal) },
                    { l: `IVA ${form.tax_rate ?? 16}%`, v: fmt(taxAmt) },
                  ].map((r) => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{form.currency} ${r.v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 800, paddingTop: "6px", borderTop: "1px solid var(--color-border-faint)", marginTop: "4px" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>TOTAL</span>
                    <span style={{ color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>{form.currency} ${fmt(total)}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3: CONFIG */}
          {step === "config" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Moneda" : "Currency"}</div>
                  <select value={form.currency ?? "MXN"} onChange={(e) => setF("currency", e.target.value)} style={SELECT}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "IVA %" : "Tax %"}</div>
                  <input type="number" min="0" max="100" value={form.tax_rate ?? 16} onChange={(e) => setF("tax_rate", Number(e.target.value))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Condiciones de pago" : "Payment terms"}</div>
                  <select value={form.payment_terms ?? ""} onChange={(e) => setF("payment_terms", e.target.value)} style={SELECT}>
                    <option value="">—</option>
                    {PAYMENT_TERMS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Términos de entrega" : "Delivery terms"}</div>
                  <select value={form.delivery_terms ?? ""} onChange={(e) => setF("delivery_terms", e.target.value)} style={SELECT}>
                    <option value="">—</option>
                    {DELIVERY_TERMS_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Descuento global ($)" : "Global discount ($)"}</div>
                  <input type="number" min="0" value={form.discount_amount ?? 0} onChange={(e) => setF("discount_amount", Number(e.target.value))} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Dirección de entrega" : "Ship to address"}</div>
                  <input value={form.ship_to_address ?? ""} onChange={(e) => setF("ship_to_address", e.target.value)} placeholder={es ? "Almacén principal…" : "Main warehouse…"} style={INPUT} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas" : "Notes"}</div>
                <textarea rows={3} value={form.notes ?? ""} onChange={(e) => setF("notes", e.target.value)} placeholder={es ? "Instrucciones especiales…" : "Special instructions…"} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
              </div>

              {/* Resumen final */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "5px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{es ? "Resumen" : "Summary"}</div>
                {[
                  { l: es ? "Proveedor" : "Supplier", v: selectedSupplier?.name },
                  { l: es ? "Ítems"     : "Items",    v: String(items.length)  },
                  { l: "Total",                        v: form.currency + " $" + fmt(total) },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {step !== "supplier" && (
            <button onClick={() => setStep(step === "config" ? "items" : "supplier")} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← {es ? "Atrás" : "Back"}
            </button>
          )}
          {step === "supplier" && (
            <button onClick={() => { if (!form.supplier_id) { setError(es ? "Selecciona un proveedor" : "Select a supplier"); return; } setError(null); setStep("items"); }} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Siguiente" : "Next"} →
            </button>
          )}
          {step === "items" && (
            <button onClick={() => { if (items.length === 0) { setError(es ? "Agrega al menos un ítem" : "Add at least one item"); return; } setError(null); setStep("config"); }} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Siguiente" : "Next"} →
            </button>
          )}
          {step === "config" && (
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? (es ? "Creando…" : "Creating…") : (es ? "Crear Orden de Compra" : "Create Purchase Order")}
            </button>
          )}
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
