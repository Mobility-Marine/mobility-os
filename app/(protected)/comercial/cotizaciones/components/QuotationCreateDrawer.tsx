"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type {
  QuotationType, ServiceType,
  CreateQuotationPayload, CreateItemPayload, CreateServicePayload,
} from "../types/quotations.types";
import {
  INCOTERMS, CURRENCIES, UNITS, SERVICE_TYPES,
  SERVICE_TYPE_CONFIG,
} from "../types/quotations.types";
import {
  fetchProductBySearch, fetchRouteHistory, fetchClientFinancialAlert,
} from "../services/quotations.service";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

type Step = "type" | "client" | "items" | "config" | "preview";

type Props = {
  open:    boolean;
  onClose: () => void;
  onCreate:(
    payload:          CreateQuotationPayload,
    items?:           Omit<CreateItemPayload,    "quotation_id">[],
    services?:        Omit<CreateServicePayload, "quotation_id">[],
    billingConcepts?: {
      tempId:      string;
      product_id?: string;
      description: string;
      currency:    string;
      lines:       Omit<CreateServicePayload, "quotation_id">[];
    }[],
  ) => Promise<void>;
};

const STEPS: Step[] = ["type", "client", "items", "config", "preview"];

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {children}{required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
    </div>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><Label required={required}>{label}</Label>{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border-faint)", marginTop: "4px" }}>
      {children}
    </div>
  );
}

export default function QuotationCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const [step,   setStep]   = useState<Step>("type");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // Step 1 — Type
  const [quotType, setQuotType] = useState<QuotationType>("services");

  // Step 2 — Client
  const [clientSearch,   setClientSearch]   = useState("");
  const [clients,        setClients]        = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [manualClient,   setManualClient]   = useState({ name: "", email: "", rfc: "" });
  const [useManual,      setUseManual]      = useState(false);
  const [financialAlert, setFinancialAlert] = useState<any | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3 — Items / Services
  const [items,    setItems]    = useState<Omit<CreateItemPayload, "quotation_id">[]>([]);
  const [itemForm, setItemForm] = useState({ sku: "", description: "", details: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0" });
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  // Conceptos de facturación con sus líneas de detalle
  const [billingConcepts, setBillingConcepts] = useState<{
    tempId:       string;
    product_id?:  string;
    description:  string;
    currency:     string;
    lines:        Omit<CreateServicePayload, "quotation_id">[];
  }[]>([]);

  const [activeConcept,  setActiveConcept]  = useState<string | null>(null);
  const [conceptForm,    setConceptForm]    = useState({ product_id: "", description: "", currency: "USD" });
  const [addingConcept,  setAddingConcept]  = useState(false);
  const [svcForm,        setSvcForm]        = useState<{
    service_type: ServiceType; description: string; origin: string; destination: string;
    incoterm: string; transit_time: string; currency: string; price: string; notes: string;
    tax_rate: number;
  }>({ service_type: "terrestre", description: "", origin: "", destination: "", incoterm: "", transit_time: "", currency: "USD", price: "", notes: "", tax_rate: 16 });
  const [routeHint,   setRouteHint]   = useState<any | null>(null);
  const [svcCatalog,  setSvcCatalog]  = useState<any[]>([]);

  // Step 4 — Config (sin template — siempre "elegante")
  const [config, setConfig] = useState({
    currency:        "MXN",
    discount_amount: "0",
    tax_rate:        "16",
    valid_until:     "",
    incoterm:        "",
    origin:          "",
    destination:     "",
    notes:           "",
    terms:           "",
  });

  // ── CLIENT SEARCH ──────────────────────────────────────────
  useEffect(() => {
    if (!clientSearch.trim() || !companyId || useManual) { setClients([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name, email, rfc, is_active")
        .eq("company_id", companyId)
        .ilike("name", `%${clientSearch}%`)
        .limit(6);
      setClients(data ?? []);
    }, 300);
  }, [clientSearch, companyId, useManual]);

  async function handleSelectClient(client: any) {
    setSelectedClient(client);
    setClientSearch(client.name);
    setClients([]);
    if (companyId) {
      const alert = await fetchClientFinancialAlert(companyId, client.id);
      setFinancialAlert(alert);
    }
  }

// Cargar catálogo de servicios al abrir
  useEffect(() => {
    if (!open || !companyId) return;
    supabase
      .from("products")
      .select("id, name, sku, unit, unit_price, sat_product_code, sat_unit_code")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .eq("product_type", "service")
      .order("name")
      .then(({ data }) => setSvcCatalog(data ?? []));
  }, [open, companyId]);
  
  // ── PRODUCT SEARCH ─────────────────────────────────────────
  useEffect(() => {
    if (!prodSearch.trim() || !companyId) { setProductSuggestions([]); return; }
    const t = setTimeout(async () => {
      const prods = await fetchProductBySearch(companyId, prodSearch);
      setProductSuggestions(prods);
    }, 300);
    return () => clearTimeout(t);
  }, [prodSearch, companyId]);

  function selectProduct(prod: any) {
    setItemForm((p) => ({
      ...p, sku: prod.sku ?? "", description: prod.name,
      unit: prod.unit ?? "pza", unit_price: String(prod.unit_price ?? ""),
    }));
    setProductSuggestions([]);
    setProdSearch(prod.name);
  }

  // ── ROUTE HINT ─────────────────────────────────────────────
  useEffect(() => {
    if (!svcForm.origin.trim() || !svcForm.destination.trim() || !companyId) {
      setRouteHint(null); return;
    }
    const t = setTimeout(async () => {
      const hint = await fetchRouteHistory(companyId, svcForm.origin, svcForm.destination);
      setRouteHint(hint);
    }, 600);
    return () => clearTimeout(t);
  }, [svcForm.origin, svcForm.destination, companyId]);

  // ── ITEM / SERVICE ACTIONS ─────────────────────────────────
  function addItem() {
    if (!itemForm.description.trim() || !itemForm.unit_price) return;
    const qty   = Number(itemForm.quantity)     || 1;
    const price = Number(itemForm.unit_price)   || 0;
    const disc  = Number(itemForm.discount_pct) || 0;
    setItems((p) => [...p, {
      sku:         itemForm.sku       || undefined,
      description: itemForm.description,
      details:     itemForm.details   || undefined,
      quantity:    qty, unit: itemForm.unit,
      unit_price:  price, discount_pct: disc,
    }]);
    setItemForm({ sku: "", description: "", details: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0" });
    setProdSearch(""); setProductSuggestions([]);
  }

  // ── TOTALS ─────────────────────────────────────────────────
  const subtotal = quotType === "products"
    ? items.reduce((s, i) => s + i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100), 0)
    : billingConcepts.reduce((s, c) => s + c.lines.reduce((ls, l) => ls + Number(l.price), 0), 0);
  const discount = Number(config.discount_amount) || 0;
  const taxBase  = Math.max(0, subtotal - discount);
  const taxAmt   = taxBase * ((Number(config.tax_rate) || 16) / 100);
  const total    = taxBase + taxAmt;

  // ── NAVIGATION ─────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === "type")   return true;
    if (step === "client") return !!(useManual ? manualClient.name.trim() : selectedClient);
    if (step === "items")  return quotType === "products" ? items.length > 0 : billingConcepts.length > 0 && billingConcepts.every(c => c.lines.length > 0);
    return true;
  }

  function next() {
    setError(null);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function prev() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const clientName  = useManual ? manualClient.name  : selectedClient?.name;
      const clientEmail = useManual ? manualClient.email : selectedClient?.email;
      const clientRfc   = useManual ? manualClient.rfc   : selectedClient?.rfc;

      await onCreate(
        {
          type:            quotType,
          client_id:       !useManual ? selectedClient?.id : undefined,
          template:        "elegante",
          currency:        config.currency,
          client_name:     clientName,
          client_email:    clientEmail    || undefined,
          client_rfc:      clientRfc      || undefined,
          notes:           config.notes   || undefined,
          terms:           config.terms   || undefined,
          valid_until:     config.valid_until || undefined,
          incoterm:        config.incoterm    || undefined,
          origin:          config.origin      || undefined,
          destination:     config.destination || undefined,
          discount_amount: discount || undefined,
          tax_rate:        Number(config.tax_rate) || 16,
        },
        quotType === "products" ? items    : undefined,
        undefined,
        quotType === "services" ? billingConcepts : undefined,
      );
      handleClose();
    } catch { setError("Error al crear la cotización"); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setStep("type"); setQuotType("services");
    setClientSearch(""); setClients([]); setSelectedClient(null);
    setManualClient({ name: "", email: "", rfc: "" }); setUseManual(false);
    setFinancialAlert(null);
    setItems([]); setBillingConcepts([]); setActiveConcept(null);
    setConceptForm({ product_id: "", description: "", currency: "USD" });
    setAddingConcept(false);
    setItemForm({ sku: "", description: "", details: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0" });
    setSvcForm({ service_type: "terrestre", description: "", origin: "", destination: "", incoterm: "", transit_time: "", currency: "USD", price: "", notes: "", tax_rate: 16 });
    setConfig({ currency: "MXN", discount_amount: "0", tax_rate: "16", valid_until: "", incoterm: "", origin: "", destination: "", notes: "", terms: "" });
    setError(null);
    onClose();
  }

  if (!open) return null;

  const STEP_LABELS: Record<Step, string> = {
    type:    (t.quot as any)?.stepType    ?? "Tipo",
    client:  (t.quot as any)?.stepClient  ?? "Cliente",
    items:   (t.quot as any)?.stepItems   ?? "Contenido",
    config:  (t.quot as any)?.stepConfig  ?? "Configuración",
    preview: (t.quot as any)?.stepPreview ?? "Resumen",
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(620px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {(t.quot as any)?.newQuotation ?? "Nueva cotización"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {STEP_LABELS[step]}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
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

          {/* ── STEP 1: TIPO ── */}
          {step === "type" && (
            <>
              <SectionTitle>{(t.quot as any)?.selectType ?? "¿Qué tipo de cotización es?"}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {([
                  { value: "services", title: (t.quot as any)?.typeServices ?? "Servicios logísticos", desc: "Terrestre, aéreo, marítimo, almacenaje, comercializadora…", icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  )},
                  { value: "products", title: (t.quot as any)?.typeProducts ?? "Productos", desc: "Materiales, mercancías, equipos, insumos…", icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  )},
                ] as const).map((opt) => (
                  <button key={opt.value} onClick={() => setQuotType(opt.value)} style={{
                    padding: "20px", borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "left",
                    background: quotType === opt.value ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                    border: `2px solid ${quotType === opt.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                    display: "flex", flexDirection: "column", gap: "8px",
                  }}>
                    <div style={{ color: quotType === opt.value ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}>
                      {opt.icon}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>{opt.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{opt.desc}</div>
                    {quotType === opt.value && (
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Seleccionado
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: quotType === "services" ? "var(--color-info-bg)" : "var(--color-success-bg)", border: `1px solid ${quotType === "services" ? "var(--color-info-border)" : "var(--color-success-border)"}`, fontSize: "12px", color: quotType === "services" ? "var(--color-info-text)" : "var(--color-success-text)", lineHeight: 1.6 }}>
                {quotType === "services"
                  ? "Al aceptarse → genera Embarque en módulo Logística"
                  : "Al aceptarse → genera Pedido en módulo Comercial"}
              </div>
            </>
          )}

          {/* ── STEP 2: CLIENTE ── */}
          {step === "client" && (
            <>
              <SectionTitle>Información del cliente</SectionTitle>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setUseManual(false)} style={{ flex: 1, height: "32px", borderRadius: "var(--radius-md)", background: !useManual ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", border: "none", color: !useManual ? "#fff" : "var(--color-text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  Buscar en sistema
                </button>
                <button onClick={() => setUseManual(true)} style={{ flex: 1, height: "32px", borderRadius: "var(--radius-md)", background: useManual ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", border: "none", color: useManual ? "#fff" : "var(--color-text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  Captura manual
                </button>
              </div>
              {!useManual ? (
                <div style={{ position: "relative" }}>
                  <Field label="Buscar cliente" required>
                    <input value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); }} placeholder="Nombre de la empresa…" style={INPUT} />
                  </Field>
                  {clients.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                      {clients.map((c) => (
                        <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{c.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.email}</div>
                          </div>
                          {c.rfc && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center" }}>{c.rfc}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <div style={{ marginTop: "8px", padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>✓ {selectedClient.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{[selectedClient.email, selectedClient.rfc].filter(Boolean).join(" · ")}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <Field label="Nombre" required>
                    <input value={manualClient.name} onChange={(e) => setManualClient((p) => ({ ...p, name: e.target.value }))} placeholder="Empresa S.A. de C.V." style={INPUT} />
                  </Field>
                  <Field label="RFC">
                    <input value={manualClient.rfc} onChange={(e) => setManualClient((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))} placeholder="EMP123456ABC" style={INPUT} />
                  </Field>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Email">
                      <input type="email" value={manualClient.email} onChange={(e) => setManualClient((p) => ({ ...p, email: e.target.value }))} placeholder="contacto@empresa.com" style={INPUT} />
                    </Field>
                  </div>
                </div>
              )}
              {financialAlert?.hasOverdue && (
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-danger-text)", marginBottom: "4px" }}>Alerta financiera</div>
                  <div style={{ fontSize: "12px", color: "var(--color-danger-text)" }}>
                    Este cliente tiene <strong>${financialAlert.overdueAmount.toLocaleString()} MXN</strong> vencidos ({financialAlert.maxDays} días de atraso).
                  </div>
                </div>
              )}
              {financialAlert && !financialAlert.hasOverdue && selectedClient && (
                <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", color: "var(--color-success-text)" }}>
                  ✓ Cliente al corriente — sin adeudos
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: PRODUCTOS ── */}
          {step === "items" && quotType === "products" && (
            <>
              <SectionTitle>Agregar productos</SectionTitle>
              <div style={{ position: "relative" }}>
                <Field label="Buscar en catálogo (SKU o nombre)">
                  <input value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder="Caja de cartón, SKU-001…" style={INPUT} />
                </Field>
                {productSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                    {productSuggestions.map((p) => (
                      <div key={p.id} onClick={() => selectProduct(p)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.name}</span>
                          {p.sku && <span style={{ marginLeft: "8px", fontSize: "10px", color: "var(--color-text-muted)" }}>{p.sku}</span>}
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>${Number(p.unit_price).toLocaleString()} / {p.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                  <Field label="SKU"><input value={itemForm.sku} onChange={(e) => setItemForm((p) => ({ ...p, sku: e.target.value }))} placeholder="SKU-001" style={INPUT} /></Field>
                  <Field label="Descripción *"><input value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} placeholder="Caja de cartón…" style={INPUT} /></Field>
                </div>
                <Field label="Detalles / Especificaciones"><input value={itemForm.details} onChange={(e) => setItemForm((p) => ({ ...p, details: e.target.value }))} placeholder="Medidas, calibre, color…" style={INPUT} /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <Field label="Cant. *"><input type="number" value={itemForm.quantity} onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))} min="0.001" style={INPUT} /></Field>
                  <Field label="Unidad">
                    <select value={itemForm.unit} onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))} style={SELECT}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="P. Unit. *"><input type="number" value={itemForm.unit_price} onChange={(e) => setItemForm((p) => ({ ...p, unit_price: e.target.value }))} placeholder="0.00" style={INPUT} /></Field>
                  <Field label="Desc. %"><input type="number" value={itemForm.discount_pct} onChange={(e) => setItemForm((p) => ({ ...p, discount_pct: e.target.value }))} placeholder="0" min="0" max="100" style={INPUT} /></Field>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button onClick={addItem} disabled={!itemForm.description.trim() || !itemForm.unit_price} style={{ width: "100%", height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>+ Agregar</button>
                  </div>
                </div>
              </div>
              {items.length > 0 && (
                <div style={{ display: "grid", gap: "5px" }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                      {item.sku && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", background: "var(--color-bg-base)", padding: "1px 5px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-faint)" }}>{item.sku}</span>}
                      <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.quantity} {item.unit}</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                        ${(item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </div>
                      <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: SERVICIOS ── */}
          {step === "items" && quotType === "services" && (
            <>
              <SectionTitle>Conceptos de facturación y líneas de detalle</SectionTitle>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                Cada <strong>concepto de facturación</strong> agrupa varias líneas de detalle. El PDF muestra el desglose completo; el CFDI usa solo los conceptos con su total sumado.
              </div>

              {/* CONCEPTOS EXISTENTES */}
              {billingConcepts.map((concept, ci) => {
                const conceptTotal = concept.lines.reduce((s, l) => s + Number(l.price), 0);
                const isActive     = activeConcept === concept.tempId;
                const productName  = svcCatalog.find((p: any) => p.id === concept.product_id)?.name;
                return (
                  <div key={concept.tempId} style={{ borderRadius: "var(--radius-md)", border: `2px solid ${isActive ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, overflow: "hidden" }}>
                    {/* Header del concepto */}
                    <div style={{ padding: "10px 14px", background: isActive ? "var(--color-info-bg)" : "var(--color-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", cursor: "pointer" }} onClick={() => setActiveConcept(isActive ? null : concept.tempId)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", border: "1px solid var(--color-brand-blue)30" }}>
                            CFDI
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                            {productName ?? concept.description}
                          </span>
                          {productName && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>({concept.description})</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {concept.lines.length} línea{concept.lines.length !== 1 ? "s" : ""} de detalle
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>
                          {concept.currency} ${conceptTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <span style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>{isActive ? "▲" : "▼"}</span>
                        <button onClick={(e) => { e.stopPropagation(); setBillingConcepts(p => p.filter((_, i) => i !== ci)); }} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Líneas de detalle */}
                    {isActive && (
                      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-faint)", display: "grid", gap: "8px", maxHeight: "420px", overflowY: "auto" }}>
                        {concept.lines.map((line, li) => (
                          <div key={li} style={{ display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line.description}</div>
                              {(line.origin || line.destination) && (
                                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{line.origin} → {line.destination}</div>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                              {line.currency} ${Number(line.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                            <button onClick={() => setBillingConcepts(p => p.map((c, i) => i === ci ? { ...c, lines: c.lines.filter((_, j) => j !== li) } : c))} style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        ))}

                        {/* Formulario nueva línea */}
                        <div style={{ background: "var(--color-bg-base)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "8px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>+ Agregar línea de detalle</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                            <Field label="Tipo *">
                              <select value={svcForm.service_type} onChange={(e) => setSvcForm(p => ({ ...p, service_type: e.target.value as ServiceType }))} style={SELECT}>
                                {SERVICE_TYPES.map((st) => {
                                  const cfg = SERVICE_TYPE_CONFIG[st];
                                  const label = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? st;
                                  return <option key={st} value={st}>{label}</option>;
                                })}
                              </select>
                            </Field>
                            <Field label="Descripción *">
                              <input value={svcForm.description} onChange={(e) => setSvcForm(p => ({ ...p, description: e.target.value }))} placeholder="Flete marítimo Shanghai → Manzanillo…" style={INPUT} />
                            </Field>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                            <Field label="Origen"><input value={svcForm.origin} onChange={(e) => setSvcForm(p => ({ ...p, origin: e.target.value }))} placeholder="Shanghai" style={INPUT} /></Field>
                            <Field label="Destino"><input value={svcForm.destination} onChange={(e) => setSvcForm(p => ({ ...p, destination: e.target.value }))} placeholder="Manzanillo" style={INPUT} /></Field>
                            <Field label="Incoterm">
                              <select value={svcForm.incoterm} onChange={(e) => setSvcForm(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                                <option value="">—</option>
                                {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                              </select>
                            </Field>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                            <Field label="Tránsito"><input value={svcForm.transit_time} onChange={(e) => setSvcForm(p => ({ ...p, transit_time: e.target.value }))} placeholder="25-30 días" style={INPUT} /></Field>
                            <Field label="Moneda">
                              <select value={svcForm.currency} onChange={(e) => setSvcForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                              </select>
                            </Field>
                            <Field label="Precio *"><input type="number" value={svcForm.price} onChange={(e) => setSvcForm(p => ({ ...p, price: e.target.value }))} placeholder="1200.00" style={INPUT} /></Field>
                            <Field label="IVA">
                              <select value={String(svcForm.tax_rate)} onChange={(e) => setSvcForm(p => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
                                <option value="16">IVA 16%</option>
                                <option value="0">Tasa 0%</option>
                                <option value="-1">Exento</option>
                                <option value="8">IVA 8%</option>
                              </select>
                            </Field>
                          </div>
                          <Field label="Notas"><input value={svcForm.notes} onChange={(e) => setSvcForm(p => ({ ...p, notes: e.target.value }))} placeholder="Incluye…" style={INPUT} /></Field>
                          <button
                            onClick={() => {
                              if (!svcForm.description.trim() || !svcForm.price) return;
                              setBillingConcepts(p => p.map((c, i) => i === ci ? {
                                ...c,
                                lines: [...c.lines, {
                                  service_type: svcForm.service_type,
                                  description:  svcForm.description,
                                  origin:       svcForm.origin       || undefined,
                                  destination:  svcForm.destination  || undefined,
                                  incoterm:     svcForm.incoterm     || undefined,
                                  transit_time: svcForm.transit_time || undefined,
                                  currency:     svcForm.currency,
                                  price:        Number(svcForm.price),
                                  tax_rate:     svcForm.tax_rate,
                                  notes:        svcForm.notes        || undefined,
                                }]
                              } : c));
                              setSvcForm({ service_type: "terrestre", description: "", origin: "", destination: "", incoterm: "", transit_time: "", currency: concept.currency, price: "", notes: "", tax_rate: 16 });
                            }}
                            disabled={!svcForm.description.trim() || !svcForm.price}
                            style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", alignSelf: "start" }}
                          >
                            + Agregar línea
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* NUEVO CONCEPTO */}
              {!addingConcept ? (
                <button onClick={() => setAddingConcept(true)} style={{ height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agregar concepto de facturación
                </button>
              ) : (
                <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "2px solid var(--color-brand-blue)", display: "grid", gap: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", textTransform: "uppercase" }}>Nuevo concepto de facturación</div>
                  <Field label="Concepto del catálogo (para CFDI — no aparece en PDF)">
                    <select value={conceptForm.product_id} onChange={(e) => setConceptForm(p => ({ ...p, product_id: e.target.value }))} style={SELECT}>
                      <option value="">— Sin vincular —</option>
                      {svcCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                    </select>
                  </Field>
                  <Field label="Nombre del concepto (visible en PDF) *">
                    <input value={conceptForm.description} onChange={(e) => setConceptForm(p => ({ ...p, description: e.target.value }))} placeholder="ej: Coordinación de Transporte Internacional" style={INPUT} />
                  </Field>
                  <Field label="Moneda del concepto">
                    <select value={conceptForm.currency} onChange={(e) => setConceptForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                  </Field>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        if (!conceptForm.description.trim()) return;
                        const tempId = Date.now().toString();
                        setBillingConcepts(p => [...p, {
                          tempId,
                          product_id:  conceptForm.product_id || undefined,
                          description: conceptForm.description,
                          currency:    conceptForm.currency,
                          lines:       [],
                        }]);
                        setActiveConcept(tempId);
                        setConceptForm({ product_id: "", description: "", currency: "USD" });
                        setAddingConcept(false);
                      }}
                      disabled={!conceptForm.description.trim()}
                      style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Crear concepto
                    </button>
                    <button onClick={() => { setAddingConcept(false); setConceptForm({ product_id: "", description: "", currency: "USD" }); }} style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Resumen de conceptos */}
              {billingConcepts.length > 0 && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Resumen — {billingConcepts.length} concepto{billingConcepts.length !== 1 ? "s" : ""}
                  </div>
                  {billingConcepts.map((c, i) => {
                    const total = c.lines.reduce((s, l) => s + Number(l.price), 0);
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                        <span style={{ color: "var(--color-text-second)" }}>{c.description}</span>
                        <span style={{ fontWeight: 700, color: c.lines.length === 0 ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
                          {c.lines.length === 0 ? "Sin líneas" : `${c.currency} $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── STEP 4: CONFIG ── */}
          {step === "config" && (
            <>
              <SectionTitle>Configuración de la cotización</SectionTitle>

              {/* Plantilla — informativo, no editable */}
              <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>Plantilla Mobility OS</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Colores de marca configurados en Ajustes → Empresa</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Moneda">
                  <select value={config.currency} onChange={(e) => setConfig((p) => ({ ...p, currency: e.target.value }))} style={SELECT}>
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Vigencia (fecha límite)">
                  <input type="date" value={config.valid_until} onChange={(e) => setConfig((p) => ({ ...p, valid_until: e.target.value }))} style={INPUT} />
                </Field>
                <Field label="Descuento global ($)">
                  <input type="number" value={config.discount_amount} onChange={(e) => setConfig((p) => ({ ...p, discount_amount: e.target.value }))} placeholder="0" min="0" style={INPUT} />
                </Field>
                <Field label="IVA (%)">
                  <input type="number" value={config.tax_rate} onChange={(e) => setConfig((p) => ({ ...p, tax_rate: e.target.value }))} placeholder="16" min="0" max="100" style={INPUT} />
                </Field>
                {quotType === "services" && (
                  <>
                    <Field label="Incoterm general">
                      <select value={config.incoterm} onChange={(e) => setConfig((p) => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                        <option value="">—</option>
                        {INCOTERMS.map((inc) => <option key={inc} value={inc}>{inc}</option>)}
                      </select>
                    </Field>
                    <div />
                    <Field label="Origen general"><input value={config.origin} onChange={(e) => setConfig((p) => ({ ...p, origin: e.target.value }))} placeholder="Ciudad de México" style={INPUT} /></Field>
                    <Field label="Destino general"><input value={config.destination} onChange={(e) => setConfig((p) => ({ ...p, destination: e.target.value }))} placeholder="Miami, FL" style={INPUT} /></Field>
                  </>
                )}
              </div>
              <Field label="Notas">
                <textarea rows={2} value={config.notes} onChange={(e) => setConfig((p) => ({ ...p, notes: e.target.value }))} placeholder="Condiciones especiales, observaciones…" style={{ ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" }} />
              </Field>
              <Field label="Términos y condiciones (dejar vacío para usar los predeterminados)">
                <textarea rows={3} value={config.terms} onChange={(e) => setConfig((p) => ({ ...p, terms: e.target.value }))} placeholder="Se usarán los términos configurados en Ajustes → Cotizaciones" style={{ ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" }} />
              </Field>
            </>
          )}

          {/* ── STEP 5: PREVIEW ── */}
          {step === "preview" && (
            <>
              <SectionTitle>Resumen de la cotización</SectionTitle>
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "5px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Cliente</div>
                {[
                  { label: "Nombre", value: useManual ? manualClient.name  : selectedClient?.name  },
                  { label: "RFC",    value: useManual ? manualClient.rfc   : selectedClient?.rfc   },
                  { label: "Email",  value: useManual ? manualClient.email : selectedClient?.email },
                  { label: "Tipo",   value: quotType === "services" ? "Servicios logísticos" : "Productos" },
                  { label: "Plantilla", value: "Mobility OS" },
                ].map((row) => row.value ? (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                    <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
                  </div>
                ) : null)}
              </div>
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  {quotType === "products" ? `${items.length} productos` : `${billingConcepts.length} concepto${billingConcepts.length !== 1 ? "s" : ""}`}
                </div>
                {quotType === "products" && items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--color-text-second)" }}>{item.quantity}x {item.description}</span>
                    <span style={{ color: "var(--color-text-primary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      ${(item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                {quotType === "services" && billingConcepts.map((c, i) => {
                  const total = c.lines.reduce((s, l) => s + Number(l.price), 0);
                  return (
                    <div key={i} style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{c.description}</span>
                        <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>{c.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {c.lines.map((l, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", paddingLeft: "12px", marginTop: "2px" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>↳ {l.description.substring(0, 35)}</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{l.currency} ${Number(l.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "grid", gap: "4px" }}>
                {discount > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{config.currency} ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "var(--color-warning-text)" }}>Descuento</span>
                      <span style={{ color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>- {config.currency} ${discount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>IVA {config.tax_rate}%</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{config.currency} ${taxAmt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, marginTop: "4px", paddingTop: "6px", borderTop: "1px solid var(--color-success-border)" }}>
                  <span style={{ color: "var(--color-success-text)" }}>TOTAL</span>
                  <span style={{ color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>{config.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: quotType === "services" ? "var(--color-info-bg)" : "var(--color-success-bg)", border: `1px solid ${quotType === "services" ? "var(--color-info-border)" : "var(--color-success-border)"}`, fontSize: "12px", color: quotType === "services" ? "var(--color-info-text)" : "var(--color-success-text)" }}>
                {quotType === "services" ? "✓ Al ser aceptada → creará un Embarque en Logística" : "✓ Al ser aceptada → creará un Pedido en Comercial"}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {step !== "type" && (
            <button onClick={prev} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← Atrás
            </button>
          )}
          {step !== "preview" ? (
            <button onClick={next} disabled={!canAdvance()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: canAdvance() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: canAdvance() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed" }}>
              Siguiente →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? t.general.loading : "Crear cotización"}
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
