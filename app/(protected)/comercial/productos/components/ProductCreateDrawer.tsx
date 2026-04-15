"use client";
import { useState, useEffect, useRef } from "react";
import type { CreateProductPayload } from "../types/products.types";
import { PRODUCT_UNITS, SERVICE_UNITS, CURRENCIES } from "../types/products.types";
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

// ── SAT SEARCH ────────────────────────────────────────────────
function SATSearch({ value, onChange, type, placeholder, style }: {
  value: string; onChange: (code: string) => void;
  type: "products" | "units"; placeholder?: string; style?: React.CSSProperties;
}) {
  const [input,   setInput]   = useState(value);
  const [results, setResults] = useState<{ key: string; name: string }[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    if (!input || input.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/sat?type=${type}&q=${encodeURIComponent(input)}`);
        const data = await res.json();
        setResults((data.data ?? []).slice(0, 10));
        setOpen(true);
      } catch {} finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [input, type]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} style={{ ...INPUT, ...style }} />
        {loading && <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--color-text-muted)" }}>...</div>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 999, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxHeight: "220px", overflowY: "auto" }}>
          {results.map((r) => (
            <div key={r.key} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(r.key); setInput(`${r.key} — ${r.name}`); setOpen(false); }}
              style={{ padding: "9px 12px", cursor: "pointer", fontSize: "12px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: 800, color: "var(--color-brand-blue)", fontFamily: "monospace", flexShrink: 0 }}>{r.key}</span>
              <span style={{ color: "var(--color-text-second)", fontSize: "11px" }}>{r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}{required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>{hint}</div>}
    </div>
  );
}

const EMPTY_FORM = (): Partial<CreateProductPayload> => ({
  sku: "", name: "", description: "", category: "",
  product_type: "product",
  unit: "pza", unit_price: 0, cost: 0, currency: "MXN",
  tax_rate: 16, stock: 0, stock_min: 0, is_active: true,
  sat_product_code: "", sat_unit_code: "",
  tariff_code: "", tariff_description: "", country_of_origin: "México",
  notes: "",
});

export default function ProductCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t, lang } = useTranslation();
  const tp          = (t.products as any) ?? {};
  const es          = lang !== "en";

  const STEP_LABELS: Record<Step, string> = {
    basic:   tp.stepBasic   ?? "Básico",
    pricing: tp.stepPricing ?? "Precios",
    fiscal:  tp.stepFiscal  ?? "Fiscal / SAT",
  };

  const [step,   setStep]   = useState<Step>("basic");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [form,   setForm]   = useState<Partial<CreateProductPayload>>(EMPTY_FORM());

  const isService = form.product_type === "service";

  function set(k: keyof CreateProductPayload, v: any) {
    setForm((p) => {
      const next = { ...p, [k]: v };
      // Cuando cambia a servicio: ajustar defaults
      if (k === "product_type") {
        if (v === "service") {
          next.unit      = "servicio";
          next.stock     = 0;
          next.stock_min = 0;
        } else {
          next.unit = "pza";
        }
      }
      return next;
    });
  }

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
    setStep("basic"); setForm(EMPTY_FORM()); setError(null); onClose();
  }

  if (!open) return null;

  // Unidades disponibles según tipo
  const availableUnits = isService ? SERVICE_UNITS : PRODUCT_UNITS;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(520px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {isService ? (es ? "Nuevo servicio" : "New service") : (tp.newProduct ?? "Nuevo producto")}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{STEP_LABELS[step]}</div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {STEPS.map((s, i) => {
              const idx = STEPS.indexOf(step);
              return (
                <div key={s} style={{ flex: 1 }}>
                  <div style={{ height: "3px", borderRadius: "var(--radius-full)", background: i <= idx ? "var(--color-brand-blue)" : "var(--color-border-faint)", transition: "background 0.3s" }} />
                  <div style={{ fontSize: "9px", fontWeight: 600, color: s === step ? "var(--color-brand-blue)" : "var(--color-text-muted)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {STEP_LABELS[s]}
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

          {/* ── STEP 1: BÁSICO ── */}
          {step === "basic" && (
            <>
              {/* SELECTOR TIPO — primero y más prominente */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Tipo *" : "Type *"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    {
                      value: "product",
                      icon: "📦",
                      label: es ? "Producto" : "Product",
                      desc:  es ? "Artículo físico con inventario" : "Physical item with inventory",
                    },
                    {
                      value: "service",
                      icon: "⚙️",
                      label: es ? "Servicio" : "Service",
                      desc:  es ? "Sin inventario ni abastecimiento" : "No inventory or procurement",
                    },
                  ].map((opt) => {
                    const selected = (form.product_type ?? "product") === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => set("product_type", opt.value as any)}
                        style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", border: `2px solid ${selected ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: selected ? "rgba(59,130,246,0.08)" : "var(--color-bg-subtle)", cursor: "pointer", transition: "all 0.15s" }}
                      >
                        <div style={{ fontSize: "20px", marginBottom: "6px" }}>{opt.icon}</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: selected ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{opt.label}</div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px", lineHeight: 1.4 }}>{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SKU + NOMBRE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                <Field label={tp.sku ?? "SKU"} required>
                  <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder={isService ? "SRV-001" : "SKU-001"} style={INPUT} />
                </Field>
                <Field label={isService ? (es ? "Nombre del servicio" : "Service name") : (tp.name ?? "Nombre")} required>
                  <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder={isService ? (es ? "Nombre del servicio" : "Service name") : (es ? "Nombre del producto" : "Product name")} style={INPUT} />
                </Field>
              </div>

              <Field label={tp.description ?? (isService ? "Descripción del servicio" : "Descripción / Especificaciones")}>
                <textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
                  placeholder={isService ? (es ? "¿Qué incluye este servicio?" : "What does this service include?") : (es ? "Medidas, calibre, material…" : "Dimensions, material, specs…")}
                  style={{ ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" }} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label={tp.category ?? "Categoría"}>
                  <input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)}
                    placeholder={isService ? (es ? "Consultoría, Instalación…" : "Consulting, Installation…") : (es ? "Embalaje, Refacciones…" : "Packaging, Spare parts…")}
                    style={INPUT} />
                </Field>
                <Field label={tp.unit ?? (isService ? "Unidad" : "Unidad de medida")}>
                  <select value={form.unit ?? (isService ? "servicio" : "pza")} onChange={(e) => set("unit", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {availableUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
              </div>

              <Field label={tp.notes ?? "Notas internas"}>
                <input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
                  placeholder={isService ? (es ? "Condiciones, tiempo de entrega, observaciones…" : "Terms, delivery time, observations…") : (es ? "Proveedor habitual, observaciones…" : "Usual supplier, observations…")}
                  style={INPUT} />
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
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: margin >= 30 ? "var(--color-success-bg)" : margin >= 15 ? "var(--color-warning-bg)" : "var(--color-danger-bg)", border: `1px solid ${margin >= 30 ? "var(--color-success-border)" : margin >= 15 ? "var(--color-warning-border)" : "var(--color-danger-border)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: margin >= 30 ? "var(--color-success-text)" : margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                      {tp.marginGain ?? "Margen de ganancia"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {tp.gainPerUnit ?? "Ganancia"}: ${(form.unit_price - (form.cost ?? 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })} / {form.unit ?? "unidad"}
                    </div>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: margin >= 30 ? "var(--color-success-text)" : margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                    {margin.toFixed(1)}%
                  </div>
                </div>
              )}

              {/* STOCK — solo para productos físicos */}
              {!isService && (
                <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Stock inicial" : "Initial stock"}
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
              )}

              {/* AVISO para servicios */}
              {isService && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                  {es
                    ? "Los servicios no tienen inventario ni aparecen en Abastecimiento. Solo se usan en Cotizaciones y Facturación."
                    : "Services have no inventory and do not appear in Procurement. They are only used in Quotes and Invoicing."}
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: FISCAL ── */}
          {step === "fiscal" && (
            <>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                {es
                  ? "Los datos fiscales son opcionales al crear, pero obligatorios para facturar. Busca por nombre o clave del catálogo oficial SAT."
                  : "Fiscal data is optional when creating, but required for invoicing. Search by name or code from the official SAT catalog."}
              </div>

              <Field
                label={tp.satProductCode ?? "Clave de producto SAT"}
                hint={es ? "Busca por nombre o clave: 'caja', 'servicio', '84111506'…" : "Search by name or code: 'service', '84111506'…"}
              >
                <SATSearch
                  value={form.sat_product_code ?? ""}
                  onChange={(code) => set("sat_product_code", code)}
                  type="products"
                  placeholder={isService ? (es ? "Buscar servicio en catálogo SAT…" : "Search service in SAT catalog…") : (es ? "Buscar producto en catálogo SAT…" : "Search product in SAT catalog…")}
                />
              </Field>

              <Field
                label={tp.satUnitCode ?? "Clave de unidad SAT"}
                hint={es ? "Busca: 'pieza', 'kilogramo', 'servicio', 'hora'…" : "Search: 'piece', 'kilogram', 'service', 'hour'…"}
              >
                <SATSearch
                  value={form.sat_unit_code ?? ""}
                  onChange={(code) => set("sat_unit_code", code)}
                  type="units"
                  placeholder={isService ? (es ? "Buscar: E48 Servicio, HUR Hora…" : "Search: E48 Service, HUR Hour…") : (es ? "Buscar unidades SAT…" : "Search SAT units…")}
                />
              </Field>

              {/* Comercio Exterior solo para productos */}
              {!isService && (
                <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Comercio Exterior / Carta Porte (opcional)" : "Foreign Trade / Bill of Lading (optional)"}
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
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
                </div>
              )}
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
            <button onClick={next} disabled={!canAdvance()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: canAdvance() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: canAdvance() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed" }}>
              {(t.general as any).next ?? "Siguiente"} →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? t.general.loading : (isService ? (es ? "Crear servicio" : "Create service") : (tp.createProduct ?? "Crear producto"))}
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
