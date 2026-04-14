"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
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

type Product = {
  id: string; sku: string | null; name: string; unit: string;
  cost: number; unit_price: number; category: string | null;
};

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
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [step,          setStep]         = useState<Step>("supplier");
  const [error,         setError]        = useState<string | null>(null);
  const [products,      setProducts]     = useState<Product[]>([]);
  const [productSearch, setProductSearch]= useState("");
  const [warehouses,    setWarehouses]   = useState<{ id: string; name: string; address?: string | null; city?: string | null }[]>([]);
  const [customAddress, setCustomAddress]= useState(false);

  const [form, setForm] = useState<CreatePOPayload>({
    currency: "MXN", tax_rate: 16,
    order_date: new Date().toISOString().split("T")[0],
  });

  const [items, setItems] = useState<(CreatePOItemPayload & { product_id?: string })[]>([]);

  const [itemForm, setItemForm] = useState({
    product_id: "", description: "", quantity: "1",
    unit: "pza", unit_price: "", discount_pct: "0", tax_rate: "16", notes: "",
  });

  // Cargar productos del catálogo
  useEffect(() => {
    if (open && companyId && products.length === 0) {
      supabase
        .from("products")
        .select("id, sku, name, unit, cost, unit_price, category")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name")
        .then(({ data }) => setProducts((data ?? []) as Product[]));
    }
  }, [open, companyId]);

  // Cargar almacenes
  useEffect(() => {
    if (open && companyId) {
      supabase
        .from("warehouses")
        .select("id, name, address, city")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name")
        .then(({ data }) => setWarehouses(data ?? []));
    }
  }, [open, companyId]);

  function setF(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }
  function setIF(k: string, v: any) { setItemForm((p) => ({ ...p, [k]: v })); }

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return q.length > 0 && (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  function selectProduct(p: Product) {
    setItemForm((prev) => ({
      ...prev,
      product_id:  p.id,
      description: p.name,
      unit:        p.unit,
      unit_price:  p.cost > 0 ? String(p.cost) : prev.unit_price,
    }));
    setProductSearch("");
  }

  function addItem() {
    if (!itemForm.description.trim() || !itemForm.unit_price) return;
    setItems((p) => [...p, {
      product_id:   itemForm.product_id || undefined,
      description:  itemForm.description,
      quantity:     Number(itemForm.quantity) || 1,
      unit:         itemForm.unit,
      unit_price:   Number(itemForm.unit_price),
      discount_pct: Number(itemForm.discount_pct) || 0,
      tax_rate:     Number(itemForm.tax_rate) || 16,
      notes:        itemForm.notes || undefined,
    }]);
    setItemForm({ product_id: "", description: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0", tax_rate: "16", notes: "" });
    setProductSearch("");
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
    setItemForm({ product_id: "", description: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0", tax_rate: "16", notes: "" });
    setProductSearch("");
    setCustomAddress(false);
    setError(null);
    onClose();
  }

  if (!open) return null;

  const STEPS: { key: Step; labelEs: string; labelEn: string }[] = [
    { key: "supplier", labelEs: "Proveedor",    labelEn: "Supplier" },
    { key: "items",    labelEs: "Ítems",         labelEn: "Items"    },
    { key: "config",   labelEs: "Configuración", labelEn: "Config"   },
  ];

  const selectedSupplier = suppliers.find((s) => s.id === form.supplier_id);

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(720px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Nueva Orden de Compra" : "New Purchase Order"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {STEPS.find((s) => s.key === step)?.[es ? "labelEs" : "labelEn"]}
              </div>
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

          {/* ── PASO 1: PROVEEDOR ── */}
          {step === "supplier" && (
            <>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Proveedor *" : "Supplier *"}
                </div>
                <select value={form.supplier_id ?? ""} onChange={(e) => setF("supplier_id", e.target.value)} style={SELECT}>
                  <option value="">{es ? "Selecciona un proveedor…" : "Select a supplier…"}</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedSupplier && (
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gap: "5px" }}>
                  {[
                    { l: es ? "Contacto"    : "Contact",       v: selectedSupplier.contact       },
                    { l: es ? "Email"       : "Email",         v: selectedSupplier.email         },
                    { l: es ? "RFC"         : "Tax ID",        v: selectedSupplier.tax_id        },
                    { l: es ? "Condiciones" : "Payment terms", v: selectedSupplier.payment_terms },
                    { l: es ? "Ciudad"      : "City",          v: selectedSupplier.city          },
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
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Fecha de orden" : "Order date"}
                  </div>
                  <input type="date" value={form.order_date ?? ""} onChange={(e) => setF("order_date", e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Fecha esperada de entrega" : "Expected delivery date"}
                  </div>
                  <input type="date" value={form.expected_date ?? ""} onChange={(e) => setF("expected_date", e.target.value)} style={INPUT} />
                </div>
              </div>
            </>
          )}

          {/* ── PASO 2: ÍTEMS ── */}
          {step === "items" && (
            <>
              {/* Buscador catálogo */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Buscar en catálogo de productos" : "Search product catalog"}
                </div>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={es ? "Buscar por nombre, SKU o categoría…" : "Search by name, SKU or category…"} style={{ ...INPUT, paddingLeft: "28px" }} />
                </div>

                {productSearch.trim() && (
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)" }}>
                    {filteredProducts.length === 0 ? (
                      <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>{es ? "Sin resultados" : "No results"}</div>
                    ) : filteredProducts.slice(0, 20).map((p) => (
                      <div key={p.id} onClick={() => selectProduct(p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{p.name}</div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                            {p.sku && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{p.sku}</span>}
                            {p.category && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{p.category}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", marginLeft: "12px", flexShrink: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>{p.cost > 0 ? `$${fmt(p.cost)}` : "—"}</div>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{p.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {itemForm.product_id && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", borderRadius: "var(--radius-md)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: "12px", color: "var(--color-brand-blue)", fontWeight: 600, flex: 1 }}>
                      {products.find((p) => p.id === itemForm.product_id)?.name ?? (es ? "Producto seleccionado" : "Product selected")}
                    </span>
                    <button onClick={() => setIF("product_id", "")} style={{ width: "16px", height: "16px", border: "none", background: "transparent", cursor: "pointer", color: "var(--color-brand-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}

                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "-4px" }}>
                  {es ? "Selecciona un producto para autocompletar — o llena los campos manualmente." : "Select a product to autofill — or fill fields manually."}
                </div>
              </div>

              {/* Form ítem */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Detalle del ítem" : "Item detail"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Descripción *" : "Description *"}</div>
                    <input value={itemForm.description} onChange={(e) => setIF("description", e.target.value)} placeholder={es ? "Nombre o descripción…" : "Name or description…"} style={INPUT} />
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
                  <button onClick={addItem} disabled={!itemForm.description.trim() || !itemForm.unit_price} style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: itemForm.description.trim() && itemForm.unit_price ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: itemForm.description.trim() && itemForm.unit_price ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    + {es ? "Agregar" : "Add"}
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ display: "grid", gap: "5px" }}>
                  {items.map((item, i) => {
                    const base = item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100);
                    const linked = item.product_id ? products.find((p) => p.id === item.product_id) : null;
                    return (
                      <div key={i} style={{ display: "flex", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "2px", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.quantity} {item.unit}</span>
                            {linked && (
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)" }}>
                                {es ? "Del catálogo" : "From catalog"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>${fmt(base)}</div>
                        <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <div style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "4px" }}>
                  {[
                    { l: es ? "Subtotal" : "Subtotal",     v: fmt(subtotal) },
                    { l: `IVA ${form.tax_rate ?? 16}%`,    v: fmt(taxAmt)   },
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

          {/* ── PASO 3: CONFIG ── */}
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
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Dirección de entrega" : "Delivery address"}</div>
                  <select
                    value={customAddress ? "__custom__" : (form.ship_to_address ?? "")}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setCustomAddress(true);
                        setF("ship_to_address", "");
                      } else if (e.target.value === "") {
                        setCustomAddress(false);
                        setF("ship_to_address", "");
                        setF("ship_to_warehouse_id", "");
                      } else {
                        setCustomAddress(false);
                        const wh = warehouses.find((w) => w.id === e.target.value);
                        if (wh) {
                          const addr = [wh.name, wh.address, wh.city].filter(Boolean).join(", ");
                          setF("ship_to_address", addr);
                          setF("ship_to_warehouse_id", wh.id);
                        }
                      }
                    }}
                    style={{ ...SELECT, marginBottom: customAddress ? "6px" : "0" }}
                  >
                    <option value="">{es ? "— Selecciona un almacén —" : "— Select a warehouse —"}</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}{w.city ? ` · ${w.city}` : ""}</option>
                    ))}
                    <option value="__custom__">{es ? "Otra dirección…" : "Other address…"}</option>
                  </select>
                  {customAddress && (
                    <input value={form.ship_to_address ?? ""} onChange={(e) => setF("ship_to_address", e.target.value)} placeholder={es ? "Calle, colonia, ciudad, estado…" : "Street, city, state…"} style={INPUT} />
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas" : "Notes"}</div>
                <textarea rows={3} value={form.notes ?? ""} onChange={(e) => setF("notes", e.target.value)} placeholder={es ? "Instrucciones especiales…" : "Special instructions…"} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
              </div>

              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "5px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{es ? "Resumen" : "Summary"}</div>
                {[
                  { l: es ? "Proveedor" : "Supplier", v: selectedSupplier?.name  },
                  { l: es ? "Ítems"     : "Items",    v: String(items.length)    },
                  { l: "Total",                        v: `${form.currency} $${fmt(total)}` },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>{/* fin CONTENT */}

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
