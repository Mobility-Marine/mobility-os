"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { NewCFDIForm, NewConcept } from "../types/facturacion.types";
import { DEFAULT_NEW_CFDI, CFDI_USES, PAYMENT_FORMS, FISCAL_REGIMES } from "../types/facturacion.types";

type PreloadShipment = {
  reference:       string;
  client_id?:      string | null;
  receiver_rfc?:   string;
  receiver_name?:  string;
  receiver_email?: string;
  receiver_zip?:   string;
  receiver_regime?:string;
  currency?:       string;
  total?:          number;
  services?:       { description: string; price: number; currency: string }[];
};

type Props = {
  open:             boolean;
  saving:           boolean;
  onClose:          () => void;
  onCreate:         (form: NewCFDIForm) => Promise<any>;
  onCreated?:       (cfdi: any) => void;
  preloadShipment?: PreloadShipment | null;
};

type Step  = "receptor" | "conceptos" | "config";
type Client = { id: string; name: string; legal_name?: string; rfc?: string; email?: string; tax_regime?: string; zip_code?: string };

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── SAT SEARCH ───────────────────────────────────────────────
function SATSearch({ value, onChange, type, placeholder, inputStyle }: {
  value:       string;
  onChange:    (code: string) => void;
  type:        "products" | "units";
  placeholder?:string;
  inputStyle?: React.CSSProperties;
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
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        style={{ ...INPUT, ...inputStyle }}
      />
      {loading && (
        <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--color-text-muted)", pointerEvents: "none" }}>...</div>
      )}
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 999, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxHeight: "200px", overflowY: "auto" }}>
          {results.map((r) => (
            <div
              key={r.key}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(r.key); setInput(`${r.key} — ${r.name}`); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "11px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", gap: "8px", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontWeight: 800, color: "var(--color-brand-blue)", fontFamily: "monospace", flexShrink: 0 }}>{r.key}</span>
              <span style={{ color: "var(--color-text-second)" }}>{r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CFDICreateDrawer({ open, saving, onClose, onCreate, onCreated, preloadShipment }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [step,        setStep]        = useState<Step>("receptor");
  const [form,        setForm]        = useState<NewCFDIForm>(DEFAULT_NEW_CFDI);
  const [error,       setError]       = useState<string | null>(null);
  const [clients,     setClients]     = useState<Client[]>([]);
  const [products,    setProducts]    = useState<any[]>([]);
  const [conceptForm, setConceptForm] = useState<Omit<NewConcept, "product_id"> & { product_id?: string }>({
    product_key: "84111506",
    unit_key:    "E48",
    description: "",
    unit:        "Servicio",
    quantity:    1,
    unit_price:  0,
    discount_pct:0,
    tax_rate:    0.16,
  });

  useEffect(() => {
    if (!open || !companyId) return;
    // Precargar desde embarque si viene de logística
    if (preloadShipment) {
      setForm((p) => ({
        ...p,
        client_id:       preloadShipment.client_id       ?? "",
        receiver_rfc:    preloadShipment.receiver_rfc    ?? "",
        receiver_name:   preloadShipment.receiver_name   ?? "",
        receiver_email:  preloadShipment.receiver_email  ?? "",
        receiver_zip:    preloadShipment.receiver_zip    ?? "",
        receiver_regime: preloadShipment.receiver_regime ?? "601",
        currency:        preloadShipment.currency        ?? "MXN",
        notes:           `Ref. ${preloadShipment.reference}`,
        concepts: (preloadShipment.services ?? []).map((svc) => ({
          product_key:  "84111506",
          unit_key:     "E48",
          description:  svc.description,
          unit:         "Servicio",
          quantity:     1,
          unit_price:   svc.price,
          discount_pct: 0,
          tax_rate:     0.16,
          subtotal:     svc.price,
          tax_amount:   svc.price * 0.16,
        })),
      }));
      if ((preloadShipment.services ?? []).length > 0) setStep("config");
      else setStep("conceptos");
    }
    // Clientes
    supabase
      .from("clients")
      .select("id, name, legal_name, rfc, email, tax_regime, zip_code")
      .eq("company_id", companyId)
      .order("name")
      .limit(200)
      .then(({ data }) => setClients((data ?? []) as Client[]));
    // Productos — incluir sat_product_code y sat_unit_code
    supabase
      .from("products")
      .select("id, name, sku, unit, unit_price, cost, tax_rate, sat_product_code, sat_unit_code")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name")
      .limit(200)
      .then(({ data }) => setProducts(data ?? []));
  }, [open, companyId]);

  function setF(k: keyof NewCFDIForm, v: any) { setForm((p) => ({ ...p, [k]: v })); }
  function setCF(k: string, v: any) { setConceptForm((p) => ({ ...p, [k]: v })); }

  function selectClient(clientId: string) {
    const c = clients.find((cl) => cl.id === clientId);
    if (!c) return setF("client_id", clientId);
    setForm((p) => ({
      ...p,
      client_id:       c.id,
      receiver_rfc:    c.rfc,
      receiver_name:   c.legal_name ?? c.name,
      receiver_email:  c.email ?? "",
      receiver_regime: c.tax_regime ?? "601",
      receiver_zip:    c.zip_code ?? "",
    }));
  }

  function selectProduct(productId: string) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;
    setCF("product_id",  p.id);
    setCF("description", p.name);
    setCF("unit",        p.unit        ?? "Servicio");
    setCF("unit_price",  p.unit_price  ?? p.cost ?? 0);
    // Usar sat_product_code y sat_unit_code de la tabla products
    setCF("product_key", p.sat_product_code ?? "84111506");
    setCF("unit_key",    p.sat_unit_code    ?? "E48");
  }

  function addConcept() {
    if (!conceptForm.description || !conceptForm.unit_price) return;
    const subtotal = conceptForm.quantity * conceptForm.unit_price * (1 - conceptForm.discount_pct / 100);
    setForm((p) => ({
      ...p,
      concepts: [...p.concepts, {
        ...conceptForm,
        subtotal,
        tax_amount: subtotal * conceptForm.tax_rate,
      }],
    }));
    setConceptForm({ product_key: "84111506", unit_key: "E48", description: "", unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0, tax_rate: 0.16 });
  }

  const subtotal = form.concepts.reduce((s, c) => s + c.quantity * c.unit_price * (1 - c.discount_pct / 100), 0);
  const taxes    = form.concepts.reduce((s, c) => { const b = c.quantity * c.unit_price * (1 - c.discount_pct / 100); return s + b * c.tax_rate; }, 0);
  const total    = subtotal + taxes;

  async function handleCreate() {
    if (!form.receiver_rfc)  { setError(es ? "RFC del receptor requerido"            : "Receiver RFC required");    return; }
    if (!form.receiver_zip)  { setError(es ? "Código postal del receptor requerido"  : "Receiver zip required");    return; }
    if (form.concepts.length === 0) { setError(es ? "Agrega al menos un concepto"   : "Add at least one concept"); return; }
    setError(null);
    try {
      const result = await onCreate(form);
      handleClose();
      if (result && onCreated) onCreated(result);
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setStep("receptor");
    setForm(DEFAULT_NEW_CFDI);
    setError(null);
    setConceptForm({ product_key: "84111506", unit_key: "E48", description: "", unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0, tax_rate: 0.16 });
    onClose();
  }

  if (!open) return null;

  const STEPS: { key: Step; labelEs: string; labelEn: string }[] = [
    { key: "receptor",  labelEs: "Receptor",   labelEn: "Receiver"   },
    { key: "conceptos", labelEs: "Conceptos",  labelEn: "Concepts"   },
    { key: "config",    labelEs: "Config CFDI",labelEn: "CFDI Config" },
  ];

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(760px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Nueva Factura CFDI 4.0" : "New Invoice CFDI 4.0"}
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

          {/* ── PASO 1: RECEPTOR ── */}
          {step === "receptor" && (
            <>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Seleccionar cliente registrado" : "Select registered client"}
                </div>
                <select value={form.client_id} onChange={(e) => selectClient(e.target.value)} style={SELECT}>
                  <option value="">{es ? "— Buscar en clientes —" : "— Search in clients —"}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name ?? c.name} · {c.rfc ?? ""}</option>)}
                </select>
              </div>
              <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Datos del receptor CFDI 4.0" : "CFDI 4.0 Receiver data"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>RFC *</div>
                    <input value={form.receiver_rfc} onChange={(e) => setF("receiver_rfc", e.target.value.toUpperCase())} placeholder="RFC del receptor" style={INPUT} maxLength={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Razón social *" : "Legal name *"}</div>
                    <input value={form.receiver_name} onChange={(e) => setF("receiver_name", e.target.value)} placeholder={es ? "Nombre o razón social" : "Legal name"} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Código postal *" : "Zip code *"}</div>
                    <input value={form.receiver_zip} onChange={(e) => setF("receiver_zip", e.target.value)} placeholder="00000" style={INPUT} maxLength={5} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Uso de CFDI *" : "CFDI use *"}</div>
                    <select value={form.receiver_cfdi_use} onChange={(e) => setF("receiver_cfdi_use", e.target.value)} style={SELECT}>
                      {CFDI_USES.map((u) => <option key={u.key} value={u.key}>{u.key} — {u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Régimen fiscal receptor *" : "Receiver tax regime *"}</div>
                    <select value={form.receiver_regime} onChange={(e) => setF("receiver_regime", e.target.value)} style={SELECT}>
                      {FISCAL_REGIMES.map((r) => <option key={r.key} value={r.key}>{r.key} — {r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Email</div>
                    <input type="email" value={form.receiver_email} onChange={(e) => setF("receiver_email", e.target.value)} placeholder="correo@receptor.com" style={INPUT} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PASO 2: CONCEPTOS ── */}
          {step === "conceptos" && (
            <>
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Agregar concepto" : "Add concept"}
                </div>

                {/* Selector catálogo */}
                <select
                  value={conceptForm.product_id ?? ""}
                  onChange={(e) => selectProduct(e.target.value)}
                  style={SELECT}
                >
                  <option value="">{es ? "— Seleccionar del catálogo —" : "— Select from catalog —"}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                </select>

                {/* Descripción */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Descripción *" : "Description *"}</div>
                  <input value={conceptForm.description} onChange={(e) => setCF("description", e.target.value)} placeholder={es ? "Descripción del concepto" : "Concept description"} style={INPUT} />
                </div>

                {/* Campos numéricos */}
                <div style={{ display: "grid", gridTemplateColumns: "80px 100px 80px 80px auto", gap: "8px", alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Cant." : "Qty"}</div>
                    <input type="number" min="0.001" value={conceptForm.quantity} onChange={(e) => setCF("quantity", Number(e.target.value))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Precio" : "Price"}</div>
                    <input type="number" min="0" value={conceptForm.unit_price} onChange={(e) => setCF("unit_price", Number(e.target.value))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Desc. %" : "Disc. %"}</div>
                    <input type="number" min="0" max="100" value={conceptForm.discount_pct} onChange={(e) => setCF("discount_pct", Number(e.target.value))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Impuestos</div>
                    <select
                      value={`${conceptForm.tax_rate ?? 0.16}_${(conceptForm as any).tax_type ?? "IVA_T"}`}
                      onChange={(e) => {
                        const [rate, type] = e.target.value.split("_");
                        setCF("tax_rate",  parseFloat(rate));
                        setCF("tax_type",  type);
                      }}
                      style={{ ...SELECT, height: "32px", fontSize: "11px" }}
                    >
                      <optgroup label="── IVA Trasladado ──">
                        <option value="0.16_IVA_T">IVA Trasladado 16%</option>
                        <option value="0.08_IVA_T">IVA Trasladado 8%</option>
                        <option value="0_IVA_T0">IVA Trasladado 0%</option>
                        <option value="0_EXENTO">Exento de IVA</option>
                      </optgroup>
                      <optgroup label="── Retenciones ──">
                        <option value="0.106_IVA_R">IVA Retenido 10.6%</option>
                        <option value="0.04_IVA_R">IVA Retenido 4%</option>
                        <option value="0.10_ISR_R">ISR Retenido 10%</option>
                        <option value="0.0125_ISR_R">ISR Retenido 1.25%</option>
                      </optgroup>
                      <optgroup label="── Combinados ──">
                        <option value="0.16_IVA_T+0.10_ISR_R">IVA 16% + ISR Ret. 10%</option>
                        <option value="0.16_IVA_T+0.106_IVA_R">IVA 16% + IVA Ret. 10.6%</option>
                      </optgroup>
                    </select>
                  </div>
                  <button onClick={addConcept} disabled={!conceptForm.description || !conceptForm.unit_price}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: conceptForm.description && conceptForm.unit_price ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: conceptForm.description && conceptForm.unit_price ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    + {es ? "Agregar" : "Add"}
                  </button>
                </div>

                {/* Claves SAT */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border-faint)" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                      {es ? "Clave producto SAT" : "SAT product key"}
                    </div>
                    <SATSearch
                      value={conceptForm.product_key}
                      onChange={(code) => setCF("product_key", code)}
                      type="products"
                      placeholder={es ? "Buscar en catálogo SAT…" : "Search SAT catalog…"}
                      inputStyle={{ height: "32px", fontSize: "11px" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                      {es ? "Clave unidad SAT" : "SAT unit key"}
                    </div>
                    <SATSearch
                      value={conceptForm.unit_key}
                      onChange={(code) => setCF("unit_key", code)}
                      type="units"
                      placeholder={es ? "Buscar unidades SAT…" : "Search SAT units…"}
                      inputStyle={{ height: "32px", fontSize: "11px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Lista conceptos */}
              {form.concepts.length > 0 && (
                <div style={{ display: "grid", gap: "5px" }}>
                  {form.concepts.map((c, i) => {
                    const base  = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
                    const ttl   = base + base * c.tax_rate;
                    return (
                      <div key={i} style={{ display: "flex", gap: "10px", padding: "9px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.description}</div>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                            {c.quantity} × ${fmt(c.unit_price)} · IVA {(c.tax_rate * 100).toFixed(0)}%
                            {c.discount_pct > 0 && ` · Desc. ${c.discount_pct}%`}
                            {" · "}<span style={{ fontFamily: "monospace" }}>{c.product_key}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>${fmt(ttl)}</div>
                        <button onClick={() => setForm((p) => ({ ...p, concepts: p.concepts.filter((_, idx) => idx !== i) }))}
                          style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    );
                  })}
                  <div style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "grid", gap: "4px", marginTop: "4px" }}>
                    {[
                      { l: es ? "Subtotal" : "Subtotal", v: fmt(subtotal) },
                      { l: "IVA",                        v: fmt(taxes)    },
                    ].map((r) => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>MXN ${r.v}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 900, paddingTop: "6px", borderTop: "1px solid var(--color-border-faint)", marginTop: "4px" }}>
                      <span style={{ color: "var(--color-text-primary)" }}>TOTAL</span>
                      <span style={{ color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>MXN ${fmt(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PASO 3: CONFIG CFDI ── */}
          {step === "config" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Fecha de emisión" : "Issue date"}</div>
                  <input type="date" value={form.cfdi_date} onChange={(e) => setF("cfdi_date", e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Serie</div>
                  <input value={form.serie} onChange={(e) => setF("serie", e.target.value.toUpperCase())} maxLength={10} placeholder="A" style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Método de pago" : "Payment method"}</div>
                  <select value={form.payment_method} onChange={(e) => setF("payment_method", e.target.value)} style={SELECT}>
                    <option value="PUE">PUE — {es ? "Pago en una sola exhibición" : "Single payment"}</option>
                    <option value="PPD">PPD — {es ? "Pago en parcialidades o diferido" : "Partial/deferred payment"}</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Forma de pago" : "Payment form"}</div>
                  <select value={form.payment_form} onChange={(e) => setF("payment_form", e.target.value)} style={SELECT}>
                    {form.payment_method === "PPD"
                      ? <option value="99">99 — Por definir</option>
                      : PAYMENT_FORMS.filter((f) => f.key !== "99").map((pf) => <option key={pf.key} value={pf.key}>{pf.key} — {pf.label}</option>)
                    }
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Moneda" : "Currency"}</div>
                  <select value={form.currency} onChange={(e) => setF("currency", e.target.value)} style={SELECT}>
                    {["MXN","USD","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {form.currency !== "MXN" && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Tipo de cambio" : "Exchange rate"}</div>
                    <input type="number" min="0.01" step="0.01" value={form.exchange_rate} onChange={(e) => setF("exchange_rate", Number(e.target.value))} style={INPUT} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas" : "Notes"}</div>
                <textarea rows={2} value={form.notes} onChange={(e) => setF("notes", e.target.value)} placeholder={es ? "Descripción adicional o número de referencia…" : "Additional description or reference number…"} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
              </div>

              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "5px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{es ? "Resumen CFDI" : "CFDI Summary"}</div>
                {[
                  { l: es ? "Receptor" : "Receiver",   v: form.receiver_name  },
                  { l: "RFC",                           v: form.receiver_rfc   },
                  { l: es ? "Conceptos" : "Concepts",  v: String(form.concepts.length) },
                  { l: "Total",                         v: `${form.currency} $${fmt(total)}` },
                  { l: es ? "Método" : "Method",        v: form.payment_method },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                  </div>
                ))}
              </div>

              {form.payment_method === "PPD" && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                  <strong>PPD:</strong> {es ? "Deberás emitir un Complemento de Pago (REP) cuando recibas cada pago." : "You'll need to issue a Payment Supplement (REP) when you receive each payment."}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {step !== "receptor" && (
            <button onClick={() => setStep(step === "config" ? "conceptos" : "receptor")} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← {es ? "Atrás" : "Back"}
            </button>
          )}
          {step === "receptor" && (
            <button onClick={() => {
              if (!form.receiver_rfc || !form.receiver_zip) { setError(es ? "RFC y código postal son requeridos" : "RFC and zip are required"); return; }
              setError(null); setStep("conceptos");
            }} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Siguiente" : "Next"} →
            </button>
          )}
          {step === "conceptos" && (
            <button onClick={() => {
              if (form.concepts.length === 0) { setError(es ? "Agrega al menos un concepto" : "Add at least one concept"); return; }
              setError(null); setStep("config");
            }} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Siguiente" : "Next"} →
            </button>
          )}
          {step === "config" && (
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? (es ? "Timbrando con SAT…" : "Stamping with SAT…") : (es ? "Timbrar Factura CFDI 4.0" : "Stamp Invoice CFDI 4.0")}
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
