"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { NewCFDIForm, NewConcept } from "../types/facturacion.types";
import { DEFAULT_NEW_CFDI, CFDI_USES, PAYMENT_FORMS, FISCAL_REGIMES, TAX_PRESETS, calcConceptTotals, DEFAULT_TAXES } from "../types/facturacion.types";

type CurrencyMode = "split" | "all_mxn" | "all_usd" | null;

type PreloadShipment = {
  shipment_id?:        string;
  reference:           string;
  client_id?:          string | null;
  receiver_rfc?:       string;
  receiver_name?:      string;
  receiver_email?:     string;
  receiver_zip?:       string;
  receiver_regime?:    string;
  currency?:           string;
  total?:              number;
  services?:           { description: string; price: number; currency: string; sat_product_code?: string; sat_unit_code?: string; unit?: string; product_id?: string }[];
  hasMultiCurrency?:   boolean;
  servicesByCurrency?: Record<string, any[]>;
};

type Props = {
  open:             boolean;
  saving:           boolean;
  onClose:          () => void;
  onCreate:         (form: NewCFDIForm) => Promise<any>;
  onCreated?:       (cfdi: any) => void;
  preloadShipment?: PreloadShipment | null;
};

type Step = "moneda" | "receptor" | "conceptos" | "config";
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
  value: string; onChange: (code: string) => void;
  type: "products" | "units"; placeholder?: string; inputStyle?: React.CSSProperties;
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
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} style={{ ...INPUT, ...inputStyle }} />
      {loading && <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--color-text-muted)", pointerEvents: "none" }}>...</div>}
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 999, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxHeight: "200px", overflowY: "auto" }}>
          {results.map((r) => (
            <div key={r.key} onMouseDown={(e) => e.preventDefault()}
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

  const [step,         setStep]         = useState<Step>("receptor");
  const [form,         setForm]         = useState<NewCFDIForm>(DEFAULT_NEW_CFDI);
  const [error,        setError]        = useState<string | null>(null);
  const [clients,      setClients]      = useState<Client[]>([]);
  const [products,     setProducts]     = useState<any[]>([]);
  const [editingConceptIdx, setEditingConceptIdx] = useState<number | null>(null);
  const [editConceptForm,   setEditConceptForm]   = useState<any>({});
    const [conceptForm,  setConceptForm]  = useState<Omit<NewConcept, "product_id"> & { product_id?: string }>({
    product_key: "84111506", unit_key: "E48", description: "",
    unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0,
    taxes: DEFAULT_TAXES,
  });

  // Multi-moneda
  const [currencyMode,   setCurrencyMode]   = useState<CurrencyMode>(null);
  const [splitCurrency,  setSplitCurrency]  = useState<string>("USD"); // qué moneda facturar en modo split
  const [exchangeRate,   setExchangeRate]   = useState<string>("17");
  const [splitDone,      setSplitDone]      = useState(false); // si ya se emitió la primera del par

  useEffect(() => {
    if (!open || !companyId) return;
    supabase.from("clients").select("id, name, legal_name, rfc, email, tax_regime, zip_code")
      .eq("company_id", companyId).order("name").limit(200)
      .then(({ data }) => setClients((data ?? []) as Client[]));
    supabase.from("products").select("id, name, sku, unit, unit_price, cost, tax_rate, sat_product_code, sat_unit_code")
      .eq("company_id", companyId).eq("is_active", true).order("name").limit(200)
      .then(({ data }) => setProducts(data ?? []));
  }, [open, companyId]);

  // Precargar datos del embarque
  useEffect(() => {
    if (!open || !preloadShipment) return;

    // Reset modo moneda
    setCurrencyMode(null);
    setSplitDone(false);
    setSplitCurrency("USD");
    setExchangeRate("17");

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
        product_key:  svc.sat_product_code ?? "84111506",
        unit_key:     svc.sat_unit_code    ?? "E48",
        description:  svc.description,
        unit:         svc.unit             ?? "Servicio",
        quantity:     1,
        unit_price:   svc.price,
        discount_pct: 0,
        taxes:        DEFAULT_TAXES,
      })),

    }));

    // Si hay multi-moneda → ir al paso moneda primero
    if (preloadShipment.hasMultiCurrency) {
      setStep("moneda");
    } else if ((preloadShipment.services ?? []).length > 0) {
      setStep("config");
    } else {
      setStep("conceptos");
    }
  }, [open, preloadShipment]);

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
    setCF("product_key", p.sat_product_code ?? "84111506");
    setCF("unit_key",    p.sat_unit_code    ?? "E48");
  }

    function addConcept() {
    if (!conceptForm.description || !conceptForm.unit_price) return;
    setForm((p) => ({
      ...p,
      concepts: [...p.concepts, { ...conceptForm }],
    }));
    setConceptForm({ product_key: "84111506", unit_key: "E48", description: "", unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0, taxes: DEFAULT_TAXES });
  }

  // Aplicar modo de moneda y avanzar a receptor
  function applyMonedaMode() {
    if (!preloadShipment?.servicesByCurrency) return;
    const tc = parseFloat(exchangeRate) || 17;

    if (currencyMode === "split") {
      // Filtrar solo conceptos de la moneda seleccionada
      const filtered = (preloadShipment.services ?? []).filter(s => s.currency === splitCurrency);
      setForm((p) => ({
        ...p,
        currency: splitCurrency,
        concepts: filtered.map((svc) => ({
          product_key:  svc.sat_product_code ?? "84111506",
          unit_key:     svc.sat_unit_code    ?? "E48",
          description:  svc.description,
          unit:         svc.unit             ?? "Servicio",
          quantity:     1,
          unit_price:   svc.price,
          discount_pct: 0,
          taxes:        DEFAULT_TAXES,
        })),
      }));
    } else if (currencyMode === "all_mxn") {
      // Convertir todo a MXN
      const all = (preloadShipment.services ?? []).map(svc => ({
        ...svc,
        price: svc.currency === "MXN" ? svc.price : svc.price * tc,
      }));
      setForm((p) => ({
        ...p,
        currency: "MXN",
        concepts: all.map((svc) => ({
          product_key:  svc.sat_product_code ?? "84111506",
          unit_key:     svc.sat_unit_code    ?? "E48",
          description:  svc.description,
          unit:         svc.unit             ?? "Servicio",
          quantity:     1,
          unit_price:   svc.price,
          discount_pct: 0,
          taxes:        DEFAULT_TAXES,
        })),
      }));
    } else if (currencyMode === "all_usd") {
      // Convertir todo a USD
      const all = (preloadShipment.services ?? []).map(svc => ({
        ...svc,
        price: svc.currency === "USD" ? svc.price : svc.price / tc,
      }));
      setForm((p) => ({
        ...p,
        currency: "USD",
        exchange_rate: tc,
        concepts: all.map((svc) => ({
          product_key:  svc.sat_product_code ?? "84111506",
          unit_key:     svc.sat_unit_code    ?? "E48",
          description:  svc.description,
          unit:         svc.unit             ?? "Servicio",
          quantity:     1,
          unit_price:   svc.price,
          discount_pct: 0,
          taxes:        DEFAULT_TAXES,
        })),
      }));
    }
    setStep("receptor");
  }

    const subtotal   = form.concepts.reduce((s, c) => s + calcConceptTotals(c).base, 0);
  const taxes      = form.concepts.reduce((s, c) => s + calcConceptTotals(c).trasladados, 0);
  const retenciones = form.concepts.reduce((s, c) => s + calcConceptTotals(c).retenidos, 0);
  const total      = subtotal + taxes - retenciones;

  async function handleCreate() {
    if (!form.receiver_rfc)         { setError("RFC del receptor requerido"); return; }
    if (!form.receiver_zip)         { setError("Código postal del receptor requerido"); return; }
    if (form.concepts.length === 0) { setError("Agrega al menos un concepto"); return; }
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
    setCurrencyMode(null);
    setSplitDone(false);
        setConceptForm({ product_key: "84111506", unit_key: "E48", description: "", unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0, taxes: DEFAULT_TAXES });
    onClose();
  }

  if (!open) return null;

  // Steps visibles (moneda solo si hay multi-moneda)
  const ALL_STEPS: { key: Step; labelEs: string; labelEn: string }[] = [
    { key: "moneda",    labelEs: "Moneda",     labelEn: "Currency"   },
    { key: "receptor",  labelEs: "Receptor",   labelEn: "Receiver"   },
    { key: "conceptos", labelEs: "Conceptos",  labelEn: "Concepts"   },
    { key: "config",    labelEs: "Config",     labelEn: "Config"     },
  ];
  const STEPS = preloadShipment?.hasMultiCurrency
    ? ALL_STEPS
    : ALL_STEPS.filter(s => s.key !== "moneda");

  const stepIdx = STEPS.findIndex(s => s.key === step);

  // Info de la otra moneda para modo split
  const otherSplitCurrency = preloadShipment?.servicesByCurrency
    ? Object.keys(preloadShipment.servicesByCurrency).find(c => c !== splitCurrency) ?? ""
    : "";
  const otherSplitTotal = preloadShipment?.servicesByCurrency?.[otherSplitCurrency]
    ?.reduce((s: number, sv: any) => s + sv.price, 0) ?? 0;
  const splitTotal = preloadShipment?.servicesByCurrency?.[splitCurrency]
    ?.reduce((s: number, sv: any) => s + sv.price, 0) ?? 0;

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
                {STEPS.find(s => s.key === step)?.[es ? "labelEs" : "labelEn"]}
                {preloadShipment?.reference && (
                  <span style={{ marginLeft: "6px", color: "var(--color-brand-blue)", fontWeight: 600 }}>· {preloadShipment.reference}</span>
                )}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{ flex: 1 }}>
                <div style={{ height: "3px", borderRadius: "2px", background: i <= stepIdx ? "var(--color-brand-blue)" : "var(--color-border-faint)" }} />
                <div style={{ fontSize: "9px", fontWeight: 600, color: i === stepIdx ? "var(--color-brand-blue)" : "var(--color-text-muted)", marginTop: "3px", textTransform: "uppercase" }}>
                  {es ? s.labelEs : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ margin: "0 24px", marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* ── PASO 0: MONEDA (solo multi-moneda) ── */}
          {step === "moneda" && preloadShipment?.servicesByCurrency && (
            <>
              <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "13px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
                ⚠️ Este embarque tiene servicios en <strong>múltiples monedas</strong>. Un CFDI no puede mezclar MXN y USD. Elige cómo facturar:
              </div>

              {/* Resumen por moneda */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {Object.entries(preloadShipment.servicesByCurrency).map(([cur, svcs]) => {
                  const tot = (svcs as any[]).reduce((s, sv) => s + sv.price, 0);
                  return (
                    <div key={cur} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>{cur}</div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-success-text)" }}>{cur} ${fmt(tot)}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{(svcs as any[]).length} concepto{(svcs as any[]).length !== 1 ? "s" : ""}</div>
                    </div>
                  );
                })}
              </div>

              {/* Opciones */}
              <div style={{ display: "grid", gap: "10px" }}>

                {/* Opción 1: Dos facturas */}
                <div onClick={() => setCurrencyMode("split")}
                  style={{ padding: "16px", borderRadius: "var(--radius-md)", cursor: "pointer", border: `2px solid ${currencyMode === "split" ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: currencyMode === "split" ? "var(--color-info-bg)" : "var(--color-bg-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "18px" }}>📄📄</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: currencyMode === "split" ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>Dos facturas separadas</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "28px" }}>
                    Una factura en USD + una factura en MXN. El cliente paga en ambas monedas.
                  </div>
                  {currencyMode === "split" && (
                    <div style={{ marginTop: "12px", marginLeft: "28px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>¿Cuál emites primero?</div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {Object.keys(preloadShipment.servicesByCurrency).map(cur => (
                          <button key={cur} onClick={(e) => { e.stopPropagation(); setSplitCurrency(cur); }}
                            style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 700, fontSize: "12px", background: splitCurrency === cur ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: splitCurrency === cur ? "#fff" : "var(--color-text-muted)", border: `1px solid ${splitCurrency === cur ? "var(--color-brand-blue)" : "var(--color-border)"}` }}>
                            {cur} ${fmt((preloadShipment.servicesByCurrency![cur] as any[]).reduce((s, sv) => s + sv.price, 0))}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-info-text)", marginTop: "6px", padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)" }}>
                        💡 Después de timbrar esta, regresa y emite la segunda factura en {otherSplitCurrency}.
                      </div>
                    </div>
                  )}
                </div>

                {/* Opción 2: Todo MXN */}
                <div onClick={() => setCurrencyMode("all_mxn")}
                  style={{ padding: "16px", borderRadius: "var(--radius-md)", cursor: "pointer", border: `2px solid ${currencyMode === "all_mxn" ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: currencyMode === "all_mxn" ? "var(--color-info-bg)" : "var(--color-bg-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "18px" }}>🇲🇽</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: currencyMode === "all_mxn" ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>Convertir todo a MXN</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "28px" }}>
                    Los importes en USD se convierten a MXN. Una sola factura en pesos.
                  </div>
                  {currencyMode === "all_mxn" && (
                    <div style={{ marginTop: "12px", marginLeft: "28px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>Tipo de cambio (1 USD = ___ MXN)</div>
                      <input type="number" min="0.01" step="0.01" value={exchangeRate}
                        onChange={e => setExchangeRate(e.target.value)}
                        style={{ ...INPUT, width: "160px", height: "32px", fontSize: "14px" }} />
                      {exchangeRate && (
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                          USD ${fmt(Object.entries(preloadShipment.servicesByCurrency).find(([c]) => c === "USD")?.[1].reduce((s: number, sv: any) => s + sv.price, 0) ?? 0)} → MXN ${fmt((Object.entries(preloadShipment.servicesByCurrency).find(([c]) => c === "USD")?.[1].reduce((s: number, sv: any) => s + sv.price, 0) ?? 0) * parseFloat(exchangeRate || "1"))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Opción 3: Todo USD */}
                <div onClick={() => setCurrencyMode("all_usd")}
                  style={{ padding: "16px", borderRadius: "var(--radius-md)", cursor: "pointer", border: `2px solid ${currencyMode === "all_usd" ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, background: currencyMode === "all_usd" ? "var(--color-info-bg)" : "var(--color-bg-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "18px" }}>🇺🇸</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: currencyMode === "all_usd" ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>Convertir todo a USD</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "28px" }}>
                    Los importes en MXN se convierten a USD. Una sola factura en dólares.
                  </div>
                  {currencyMode === "all_usd" && (
                    <div style={{ marginTop: "12px", marginLeft: "28px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>Tipo de cambio (1 USD = ___ MXN)</div>
                      <input type="number" min="0.01" step="0.01" value={exchangeRate}
                        onChange={e => setExchangeRate(e.target.value)}
                        style={{ ...INPUT, width: "160px", height: "32px", fontSize: "14px" }} />
                      {exchangeRate && (
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                          MXN ${fmt(Object.entries(preloadShipment.servicesByCurrency).find(([c]) => c === "MXN")?.[1].reduce((s: number, sv: any) => s + sv.price, 0) ?? 0)} → USD ${fmt((Object.entries(preloadShipment.servicesByCurrency).find(([c]) => c === "MXN")?.[1].reduce((s: number, sv: any) => s + sv.price, 0) ?? 0) / parseFloat(exchangeRate || "1"))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

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
                <select value={conceptForm.product_id ?? ""} onChange={(e) => selectProduct(e.target.value)} style={SELECT}>
                  <option value="">{es ? "— Seleccionar del catálogo —" : "— Select from catalog —"}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                </select>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Descripción *" : "Description *"}</div>
                  <input value={conceptForm.description} onChange={(e) => setCF("description", e.target.value)} placeholder={es ? "Descripción del concepto" : "Concept description"} style={INPUT} />
                </div>
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
                      value={TAX_PRESETS.find(p => JSON.stringify(p.taxes) === JSON.stringify((conceptForm as any).taxes))?.key ?? "custom"}
                      onChange={(e) => {
                        const preset = TAX_PRESETS.find(p => p.key === e.target.value);
                        if (preset) setCF("taxes", preset.taxes);
                      }}
                      style={{ ...SELECT, height: "32px", fontSize: "11px" }}
                    >
                      {TAX_PRESETS.map(p => (
                        <option key={p.key} value={p.key}>{p.labelEs}</option>
                      ))}
                    </select>
                    {/* Mostrar los impuestos activos */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                      {((conceptForm as any).taxes ?? DEFAULT_TAXES).map((t: any, i: number) => (
                        <span key={i} style={{
                          fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                          borderRadius: "var(--radius-full)",
                          background: t.withholding ? "var(--color-danger-bg)" : "var(--color-success-bg)",
                          color:      t.withholding ? "var(--color-danger-text)" : "var(--color-success-text)",
                          border:     `1px solid ${t.withholding ? "var(--color-danger-border)" : "var(--color-success-border)"}`,
                        }}>
                          {t.withholding ? "−" : "+"} {t.type} {t.factor === "Exento" ? "Exento" : `${(t.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={addConcept} disabled={!conceptForm.description || !conceptForm.unit_price}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: conceptForm.description && conceptForm.unit_price ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: conceptForm.description && conceptForm.unit_price ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    + {es ? "Agregar" : "Add"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border-faint)" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Clave producto SAT" : "SAT product key"}</div>
                    <SATSearch value={conceptForm.product_key} onChange={(code) => setCF("product_key", code)} type="products" placeholder={es ? "Buscar en catálogo SAT…" : "Search SAT catalog…"} inputStyle={{ height: "32px", fontSize: "11px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Clave unidad SAT" : "SAT unit key"}</div>
                    <SATSearch value={conceptForm.unit_key} onChange={(code) => setCF("unit_key", code)} type="units" placeholder={es ? "Buscar unidades SAT…" : "Search SAT units…"} inputStyle={{ height: "32px", fontSize: "11px" }} />
                  </div>
                </div>
              </div>

              {form.concepts.length > 0 && (
                <div style={{ display: "grid", gap: "5px" }}>
                                    {form.concepts.map((c, i) => {
                    const isEditing = editingConceptIdx === i;
                                        const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
                    const { trasladados, retenidos } = calcConceptTotals(c);
                    const ttl  = base + trasladados - retenidos;
                    if (isEditing) {
                                            const eBase = (editConceptForm.quantity ?? 1) * (editConceptForm.unit_price ?? 0) * (1 - (editConceptForm.discount_pct ?? 0) / 100);
                      const eTaxes = (editConceptForm.taxes ?? DEFAULT_TAXES);
                      const eTrasladados = eTaxes.filter((t: any) => !t.withholding).reduce((s: number, t: any) => s + (t.factor === "Exento" ? 0 : eBase * t.rate), 0);
                      const eRetenidos   = eTaxes.filter((t: any) =>  t.withholding).reduce((s: number, t: any) => s + eBase * t.rate, 0);
                      const eTtl  = eBase + eTrasladados - eRetenidos;
                      return (
                        <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gap: "8px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)" }}>Editando concepto {i + 1}</div>
                          <input value={editConceptForm.description ?? ""} onChange={e => setEditConceptForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Descripción" style={{ ...INPUT, height: "32px" }} />
                          <div style={{ display: "grid", gridTemplateColumns: "80px 100px 80px auto", gap: "8px" }}>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Cant.</div>
                              <input type="number" min="0.001" value={editConceptForm.quantity ?? 1} onChange={e => setEditConceptForm((p: any) => ({ ...p, quantity: Number(e.target.value) }))} style={{ ...INPUT, height: "30px", fontSize: "12px" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Precio</div>
                              <input type="number" min="0" value={editConceptForm.unit_price ?? 0} onChange={e => setEditConceptForm((p: any) => ({ ...p, unit_price: Number(e.target.value) }))} style={{ ...INPUT, height: "30px", fontSize: "12px" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Desc. %</div>
                              <input type="number" min="0" max="100" value={editConceptForm.discount_pct ?? 0} onChange={e => setEditConceptForm((p: any) => ({ ...p, discount_pct: Number(e.target.value) }))} style={{ ...INPUT, height: "30px", fontSize: "12px" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Impuestos</div>
                                                            <select
                                value={TAX_PRESETS.find(p => JSON.stringify(p.taxes) === JSON.stringify(editConceptForm.taxes ?? DEFAULT_TAXES))?.key ?? "iva16"}
                                onChange={e => {
                                  const preset = TAX_PRESETS.find(p => p.key === e.target.value);
                                  if (preset) setEditConceptForm((p: any) => ({ ...p, taxes: preset.taxes }));
                                }}
                                style={{ ...SELECT, height: "30px", fontSize: "11px" }}>
                                {TAX_PRESETS.map(p => (
                                  <option key={p.key} value={p.key}>{p.labelEs}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Clave SAT producto</div>
                              <SATSearch value={editConceptForm.product_key ?? ""} onChange={code => setEditConceptForm((p: any) => ({ ...p, product_key: code }))} type="products" placeholder="Buscar clave SAT…" inputStyle={{ height: "30px", fontSize: "11px" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Clave SAT unidad</div>
                              <SATSearch value={editConceptForm.unit_key ?? ""} onChange={code => setEditConceptForm((p: any) => ({ ...p, unit_key: code }))} type="units" placeholder="Buscar unidad SAT…" inputStyle={{ height: "30px", fontSize: "11px" }} />
                            </div>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-success-text)", fontWeight: 700, textAlign: "right" }}>
                            Total: {form.currency} ${fmt(eTtl)}
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => {
                              const updated = { ...c, ...editConceptForm, subtotal: eBase, tax_amount: eBase * (editConceptForm.tax_rate ?? 0.16) };
                              setForm(p => ({ ...p, concepts: p.concepts.map((cc, idx) => idx === i ? updated : cc) }));
                              setEditingConceptIdx(null); setEditConceptForm({});
                            }} style={{ flex: 1, height: "30px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                              ✓ Guardar
                            </button>
                            <button onClick={() => { setEditingConceptIdx(null); setEditConceptForm({}); }} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      );
                    }
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
                        <button onClick={() => { setEditingConceptIdx(i); setEditConceptForm({ ...c }); }}
                          style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setForm((p) => ({ ...p, concepts: p.concepts.filter((_, idx) => idx !== i) }))}
                          style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    );
                                    })}
                </div>
              )}
            </>
          )}

          {/* ── PASO 3: CONFIG CFDI ── */}
          {step === "config" && (
            <>
              {/* Aviso modo split */}
              {currencyMode === "split" && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
                  📄 Estás timbrando la factura en <strong>{splitCurrency}</strong> por <strong>{splitCurrency} ${fmt(splitTotal)}</strong>.<br/>
                  Después regresa y emite la segunda factura en <strong>{otherSplitCurrency}</strong> por <strong>{otherSplitCurrency} ${fmt(otherSplitTotal)}</strong>.
                </div>
              )}

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

                            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{es ? "Resumen CFDI" : "CFDI Summary"}</div>

                {/* Datos del receptor */}
                {[
                  { l: es ? "Receptor" : "Receiver", v: form.receiver_name },
                  { l: "RFC",                         v: form.receiver_rfc  },
                  { l: es ? "Método" : "Method",      v: form.payment_method },
                  { l: es ? "Moneda" : "Currency",    v: form.currency },
                ].map((r) => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                  </div>
                ))}

                {/* Conceptos detallados */}
                <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "8px", marginTop: "2px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    {es ? "Conceptos" : "Concepts"} ({form.concepts.length})
                  </div>
                  <div style={{ display: "grid", gap: "4px" }}>
                    {form.concepts.map((c, i) => {
                      const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
                      const tax  = base * c.tax_rate;
                      const ttl  = base + tax;
                      return (
                        <div key={i} style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.description}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <span>{c.quantity} × ${fmt(c.unit_price)}</span>
                                {c.discount_pct > 0 && <span style={{ color: "var(--color-warning-text)" }}>-{c.discount_pct}%</span>}
                                <span>IVA {(c.tax_rate * 100).toFixed(0)}%</span>
                                {c.product_key && <span style={{ fontFamily: "monospace", color: "var(--color-brand-blue)" }}>{c.product_key}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                                ${fmt(ttl)}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                                +${fmt(tax)} IVA
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total final */}
                <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "8px", display: "grid", gap: "4px" }}>
                  {[
                    { l: "Subtotal",    v: fmt(subtotal)    },
                    { l: "IVA",        v: fmt(taxes)        },
                    ...(retenciones > 0 ? [{ l: "Retenciones", v: `- ${fmt(retenciones)}` }] : []),
                  ].map((r) => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                      <span style={{ color: "var(--color-text-second)", fontVariantNumeric: "tabular-nums" }}>{form.currency} ${r.v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", marginTop: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>TOTAL</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>{form.currency} ${fmt(total)}</span>
                  </div>
                </div>
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
          {step !== "receptor" && step !== "moneda" && (
            <button onClick={() => {
              if (step === "config")    setStep("conceptos");
              else if (step === "conceptos") setStep(preloadShipment?.hasMultiCurrency ? "moneda" : "receptor");
              else setStep("receptor");
            }} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← {es ? "Atrás" : "Back"}
            </button>
          )}
          {step === "moneda" && (
            <button onClick={applyMonedaMode} disabled={!currencyMode}
              style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: currencyMode ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: currencyMode ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: currencyMode ? "pointer" : "not-allowed" }}>
              {es ? "Continuar" : "Continue"} →
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
            <button onClick={handleCreate} disabled={saving}
              style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
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
