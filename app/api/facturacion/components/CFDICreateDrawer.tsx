"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { NewCFDIForm, NewConcept } from "../types/facturacion.types";
import {
  DEFAULT_NEW_CFDI, CFDI_USES, PAYMENT_FORMS,
  FISCAL_REGIMES, UNIT_KEYS,
} from "../types/facturacion.types";

type Props = {
  open:    boolean;
  saving:  boolean;
  onClose: () => void;
  onCreate:(form: NewCFDIForm) => Promise<void>;
};

type Step = "receptor" | "conceptos" | "config";

type Client = { id: string; legal_name: string; rfc: string; email?: string; fiscal_regime?: string; address_zip?: string };

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };
const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CFDICreateDrawer({ open, saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [step,     setStep]    = useState<Step>("receptor");
  const [form,     setForm]    = useState<NewCFDIForm>(DEFAULT_NEW_CFDI);
  const [error,    setError]   = useState<string | null>(null);
  const [clients,  setClients] = useState<Client[]>([]);
  const [products, setProducts]= useState<any[]>([]);
  const [conceptForm, setConceptForm] = useState<Omit<NewConcept, "product_id"> & { product_id?: string }>({
    product_key: "84111506", unit_key: "E48", description: "",
    unit: "Servicio", quantity: 1, unit_price: 0,
    discount_pct: 0, tax_rate: 0.16,
  });

  useEffect(() => {
    if (!open || !companyId) return;
    supabase.from("clients").select("id, legal_name, rfc, email, fiscal_regime, address_zip").eq("company_id", companyId).order("legal_name").limit(200).then(({ data }) => setClients((data ?? []) as Client[]));
    supabase.from("products").select("id, name, sku, unit, unit_price, cost, tax_rate").eq("company_id", companyId).eq("is_active", true).order("name").limit(200).then(({ data }) => setProducts(data ?? []));
  }, [open, companyId]);

  function setF(k: keyof NewCFDIForm, v: any) { setForm((p) => ({ ...p, [k]: v })); }
  function setCF(k: string, v: any) { setConceptForm((p) => ({ ...p, [k]: v })); }

  function selectClient(clientId: string) {
    const c = clients.find((cl) => cl.id === clientId);
    if (!c) return setF("client_id", clientId);
    setForm((p) => ({
      ...p,
      client_id:        c.id,
      receiver_rfc:     c.rfc,
      receiver_name:    c.legal_name,
      receiver_email:   c.email ?? "",
      receiver_regime:  c.fiscal_regime ?? "601",
      receiver_zip:     c.address_zip ?? "",
    }));
  }

  function addConcept() {
    if (!conceptForm.description || !conceptForm.unit_price) return;
    const subtotal = conceptForm.quantity * conceptForm.unit_price * (1 - conceptForm.discount_pct / 100);
    setForm((p) => ({
      ...p,
      concepts: [...p.concepts, { ...conceptForm, subtotal, tax_amount: subtotal * conceptForm.tax_rate }],
    }));
    setConceptForm({ product_key: "84111506", unit_key: "E48", description: "", unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0, tax_rate: 0.16 });
  }

  const subtotal = form.concepts.reduce((s, c) => {
    const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
    return s + base;
  }, 0);
  const taxes   = form.concepts.reduce((s, c) => {
    const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
    return s + base * c.tax_rate;
  }, 0);
  const total = subtotal + taxes;

  async function handleCreate() {
    if (!form.receiver_rfc) { setError(es ? "RFC del receptor requerido" : "Receiver RFC required"); return; }
    if (!form.receiver_zip) { setError(es ? "Código postal del receptor requerido" : "Receiver zip required"); return; }
    if (form.concepts.length === 0) { setError(es ? "Agrega al menos un concepto" : "Add at least one concept"); return; }
    setError(null);
    try {
      await onCreate(form);
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setStep("receptor"); setForm(DEFAULT_NEW_CFDI); setError(null);
    setConceptForm({ product_key: "84111506", unit_key: "E48", description: "", unit: "Servicio", quantity: 1, unit_price: 0, discount_pct: 0, tax_rate: 0.16 });
    onClose();
  }

  if (!open) return null;

  const STEPS: { key: Step; labelEs: string; labelEn: string }[] = [
    { key: "receptor",  labelEs: "Receptor",   labelEn: "Receiver"  },
    { key: "conceptos", labelEs: "Conceptos",  labelEn: "Concepts"  },
    { key: "config",    labelEs: "Config CFDI", labelEn: "CFDI Config"},
  ];

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(760px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{es ? "Nueva Factura CFDI 4.0" : "New Invoice CFDI 4.0"}</div>
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
              {/* Selector de cliente */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Seleccionar cliente registrado" : "Select registered client"}
                </div>
                <select value={form.client_id} onChange={(e) => selectClient(e.target.value)} style={SELECT}>
                  <option value="">{es ? "— Buscar en clientes —" : "— Search in clients —"}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name} · {c.rfc}</option>)}
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
              {/* Form agregar concepto */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Agregar concepto" : "Add concept"}</div>

                {/* Selector de producto */}
                <select value={conceptForm.product_id ?? ""} onChange={(e) => {
                  const p = products.find((pr) => pr.id === e.target.value);
                  if (!p) return;
                  setCF("product_id", p.id);
                  setCF("description", p.name);
                  setCF("unit", p.unit ?? "Servicio");
                  setCF("unit_price", p.unit_price ?? p.cost ?? 0);
                }} style={SELECT}>
                  <option value="">{es ? "— Seleccionar del catálogo —" : "— Select from catalog —"}</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                </select>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Descripción *" : "Description *"}</div>
                  <input value={conceptForm.description} onChange={(e) => setCF("description", e.target.value)} placeholder={es ? "Descripción del concepto" : "Concept description"} style={INPUT} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 80px 100px 80px auto", gap: "8px", alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Clave SAT" : "SAT Key"}</div>
                    <input value={conceptForm.product_key} onChange={(e) => setCF("product_key", e.target.value)} placeholder="84111506" style={{ ...INPUT, height: "32px", fontSize: "11px", fontFamily: "monospace" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Unidad SAT" : "SAT Unit"}</div>
                    <select value={conceptForm.unit_key} onChange={(e) => setCF("unit_key", e.target.value)} style={{ ...SELECT, height: "32px", fontSize: "11px" }}>
                      {UNIT_KEYS.map((u) => <option key={u.key} value={u.key}>{u.key} — {u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Cant." : "Qty"}</div>
                    <input type="number" min="0.001" value={conceptForm.quantity} onChange={(e) => setCF("quantity", Number(e.target.value))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Precio" : "Price"}</div>
                    <input type="number" min="0" value={conceptForm.unit_price} onChange={(e) => setCF("unit_price", Number(e.target.value))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{es ? "Desc. %" : "Disc. %"}</div>
                    <input type="number" min="0" max="100" value={conceptForm.discount_pct} onChange={(e) => setCF("discount_pct", Number(e.target.value))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>IVA</div>
                    <select value={conceptForm.tax_rate} onChange={(e) => setCF("tax_rate", Number(e.target.value))} style={{ ...SELECT, height: "32px", fontSize: "11px" }}>
                      <option value={0.16}>16%</option>
                      <option value={0.08}>8%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>
                  <button onClick={addConcept} disabled={!conceptForm.description || !conceptForm.unit_price}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: conceptForm.description && conceptForm.unit_price ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: conceptForm.description && conceptForm.unit_price ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                    + {es ? "Agregar" : "Add"}
                  </button>
                </div>
              </div>

              {/* Lista de conceptos */}
              {form.concepts.length > 0 && (
                <div style={{ display: "grid", gap: "5px" }}>
                  {form.concepts.map((c, i) => {
                    const base  = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
                    const total = base + base * c.tax_rate;
                    return (
                      <div key={i} style={{ display: "flex", gap: "10px", padding: "9px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.description}</div>
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                            {c.quantity} × ${fmt(c.unit_price)} · IVA {(c.tax_rate * 100).toFixed(0)}%
                            {c.discount_pct > 0 && ` · Desc. ${c.discount_pct}%`}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>${fmt(total)}</div>
                        <button onClick={() => setForm((p) => ({ ...p, concepts: p.concepts.filter((_, idx) => idx !== i) }))}
                          style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    );
                  })}

                  {/* Totales */}
                  <div style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "10px 12px", display: "grid", gap: "4px", marginTop: "4px" }}>
                    {[
                      { l: es ? "Subtotal" : "Subtotal",  v: fmt(subtotal) },
                      { l: `IVA`,                          v: fmt(taxes)    },
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

              {/* Resumen */}
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "5px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{es ? "Resumen CFDI" : "CFDI Summary"}</div>
                {[
                  { l: es ? "Receptor" : "Receiver", v: form.receiver_name  },
                  { l: "RFC",                          v: form.receiver_rfc   },
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
            <button onClick={() => { if (!form.receiver_rfc || !form.receiver_zip) { setError(es ? "RFC y código postal son requeridos" : "RFC and zip are required"); return; } setError(null); setStep("conceptos"); }}
              style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {es ? "Siguiente" : "Next"} →
            </button>
          )}
          {step === "conceptos" && (
            <button onClick={() => { if (form.concepts.length === 0) { setError(es ? "Agrega al menos un concepto" : "Add at least one concept"); return; } setError(null); setStep("config"); }}
              style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
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
