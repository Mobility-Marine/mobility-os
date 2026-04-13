"use client";

import { useState } from "react";
import type { CreateProductPayload } from "../types/products.types";
import { PRODUCT_UNITS, SAT_UNITS, CURRENCIES } from "../types/products.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (payload: CreateProductPayload) => Promise<void>;
};

type Step = "basic" | "pricing" | "fiscal";
const STEPS: Step[] = ["basic", "pricing", "fiscal"];

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}{required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

export default function ProductCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t, lang } = useTranslation();
  const tp          = (t.products as any) ?? {};

  const STEP_LABELS: Record<Step, string> = {
    basic:   tp.stepBasic   ?? "Básico",
    pricing: tp.stepPricing ?? "Precios",
    fiscal:  tp.stepFiscal  ?? "Fiscal / SAT",
  };

  const [step,   setStep]   = useState<Step>("basic");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState<Partial<CreateProductPayload>>({
    sku: "", name: "", description: "", category: "",
    unit: "pza", unit_price: 0, cost: 0, currency: "MXN",
    tax_rate: 16, stock: 0, stock_min: 0, is_active: true,
    sat_product_code: "", sat_unit_code: "H87",
    tariff_code: "", tariff_description: "", country_of_origin: "México",
    notes: "",
  });

  function set(k: keyof CreateProductPayload, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  const margin = form.unit_price && form.unit_price > 0
    ? ((form.unit_price - (form.cost ?? 0)) / form.unit_price) * 100
    : 0;

  function canAdvance(): boolean {
    if (step === "basic")   return !!(form.sku?.trim() && form.name?.trim());
    if (step === "pricing") return !!(form.unit_price !== undefined && form.unit_price >= 0);
    return true;
  }

  function next() { const idx = STEPS.indexOf(step); if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]); }
  function prev() { const idx = STEPS.indexOf(step); if (idx > 0) setStep(STEPS[idx - 1]); }

  async function handleCreate() {
    if (!form.sku?.trim() || !form.name?.trim()) return;
    setSaving(true); setError(null);
    try {
      await onCreate(form as CreateProductPayload);
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setStep("basic");
    setForm({
      sku: "", name: "", description: "", category: "",
      unit: "pza", unit_price: 0, cost: 0, currency: "MXN",
      tax_rate: 16, stock: 0, stock_min: 0, is_active: true,
      sat_product_code: "", sat_unit_code: "H87",
      tariff_code: "", tariff_description: "", country_of_origin: "México",
      notes: "",
    });
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(520px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {tp.newProduct ?? "Nuevo producto"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {STEP_LABELS[step]}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* PROGRESS */}
          <div style={{ display: "flex", gap: "3px" }}>
            {STEPS.map((s, i) => {
              const idx    = STEPS.indexOf(step);
              const done   = i < idx;
              const active = s === step;
              return (
                <div key={s} style={{ flex: 1 }}>
                  <div style={{ height: "3px", borderRadius: "var(--radius-full)", background: done || active ? "var(--color-brand-blue)" : "var(--color-border-faint)", transition: "background 0.3s" }} />
                  <div style={{ fontSize: "9px", fontWeight: 600, color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {STEP_LABELS[s]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin: "0 24px", marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* ── STEP 1: BÁSICO ── */}
          {step === "basic" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                <Field label={tp.sku ?? "SKU"} required>
                  <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="SKU-001" style={INPUT} />
                </Field>
                <Field label={tp.name ?? "Nombre"} required>
                  <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder={lang === "en" ? "Product name" : "Nombre del producto"} style={INPUT} />
                </Field>
              </div>
              <Field label={tp.description ?? "Descripción / Especificaciones"}>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={lang === "en" ? "Dimensions, material, technical specs…" : "Medidas, calibre, material, especificaciones técnicas…"}
                  style={{ ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" }}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label={tp.category ?? "Categoría"}>
                  <input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} placeholder={lang === "en" ? "Packaging, Spare parts…" : "Embalaje, Refacciones…"} style={INPUT} />
                </Field>
                <Field label={tp.unit ?? "Unidad de medida"}>
                  <select value={form.unit ?? "pza"} onChange={(e) => set("unit", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={tp.notes ?? "Notas internas"}>
                <input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder={lang === "en" ? "Usual supplier, observations…" : "Proveedor habitual, observaciones…"} style={INPUT} />
              </Field>
            </>
          )}

          {/* ── STEP 2: PRECIOS ── */}
          {step === "pricing" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label={`${tp.unitPrice ?? "Precio de venta"} *`}>
                  <input type="number" value={form.unit_price ?? 0} onChange={(e) => set("unit_price", Number(e.target.value))} min="0" placeholder="0.00" style={INPUT} />
                </Field>
                <Field label={tp.cost ?? "Costo"}>
                  <input type="number" value={form.cost ?? 0} onChange={(e) => set("cost", Number(e.target.value))} min="0" placeholder="0.00" style={INPUT} />
                </Field>
                <Field label={tp.currency ?? "Moneda"}>
                  <select value={form.currency ?? "MXN"} onChange={(e) => set("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={tp.taxRate ?? "IVA %"}>
                  <input type="number" value={form.tax_rate ?? 16} onChange={(e) => set("tax_rate", Number(e.target.value))} min="0" max="100" style={INPUT} />
                </Field>
              </div>

              {form.unit_price && form.unit_price > 0 && (
                <div style={{
                  padding: "12px 14px", borderRadius: "var(--radius-md)",
                  background: margin >= 30 ? "var(--color-success-bg)" : margin >= 15 ? "var(--color-warning-bg)" : "var(--color-danger-bg)",
                  border: `1px solid ${margin >= 30 ? "var(--color-success-border)" : margin >= 15 ? "var(--color-warning-border)" : "var(--color-danger-border)"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: margin >= 30 ? "var(--color-success-text)" : margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                      {tp.marginGain ?? "Margen de ganancia"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {tp.gainPerUnit ?? "Ganancia"}: ${(form.unit_price - (form.cost ?? 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })} / {tp.unit ?? "unidad"}
                    </div>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: margin >= 30 ? "var(--color-success-text)" : margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                    {margin.toFixed(1)}%
                  </div>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {lang === "en" ? "Initial stock" : "Stock inicial"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <Field label={tp.stockCurrent ?? "Stock actual"}>
                    <input type="number" value={form.stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} min="0" style={INPUT} />
                  </Field>
                  <Field label={tp.stockMinLabel ?? "Stock mínimo (alerta)"}>
                    <input type="number" value={form.stock_min ?? 0} onChange={(e) => set("stock_min", Number(e.target.value))} min="0" style={INPUT} />
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: FISCAL ── */}
          {step === "fiscal" && (
            <>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                {lang === "en"
                  ? "Fiscal data is optional when creating a product, but required for invoicing. You can complete it later from the product workspace."
                  : "Los datos fiscales son opcionales al crear el producto, pero obligatorios para facturar. Puedes completarlos después desde el workspace del producto."}
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <Field label={tp.satProductCode ?? "Clave de producto SAT"}>
                  <input value={form.sat_product_code ?? ""} onChange={(e) => set("sat_product_code", e.target.value)} placeholder="ej: 14111500" style={INPUT} />
                </Field>
                <Field label={tp.satUnitCode ?? "Clave de unidad SAT"}>
                  <select value={form.sat_unit_code ?? "H87"} onChange={(e) => set("sat_unit_code", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {SAT_UNITS.map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
                  </select>
                </Field>
                <Field label={tp.tariffCode ?? "Fracción arancelaria"}>
                  <input value={form.tariff_code ?? ""} onChange={(e) => set("tariff_code", e.target.value)} placeholder="ej: 4819.10.01" style={{ ...INPUT, fontFamily: "monospace" }} />
                </Field>
                <Field label={tp.tariffDescription ?? "Descripción de la fracción"}>
                  <input value={form.tariff_description ?? ""} onChange={(e) => set("tariff_description", e.target.value)} placeholder="ej: Cajas de cartón corrugado" style={INPUT} />
                </Field>
                <Field label={tp.countryOfOrigin ?? "País de origen"}>
                  <input value={form.country_of_origin ?? "México"} onChange={(e) => set("country_of_origin", e.target.value)} style={INPUT} />
                </Field>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {step !== "basic" && (
            <button onClick={prev} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← {(t.general as any).back ?? "Atrás"}
            </button>
          )}
          {step !== "fiscal" ? (
            <button onClick={next} disabled={!canAdvance()} style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: canAdvance() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              color: canAdvance() ? "#fff" : "var(--color-text-muted)", border: "none",
              fontSize: "13px", fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed",
            }}>
              {t.general.next ?? "Siguiente"} →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: "var(--color-success-text)", color: "#fff", border: "none",
              fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? t.general.loading : (tp.createProduct ?? "Crear producto")}
            </button>
          )}
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
        </div>
      </div>
    </>
  );
}
