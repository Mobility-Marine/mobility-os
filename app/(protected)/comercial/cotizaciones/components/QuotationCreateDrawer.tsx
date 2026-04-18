"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type {
  QuotationType, ServiceSubtype, GeneralInfo,
  CreateQuotationPayload, CreateItemPayload, CreateServicePayload,
} from "./types/quotations.types";
import {
  getSteps, STEP_LABELS_ES, STEP_LABELS_EN,
  EMPTY_CONFIG, EMPTY_CLIENT,
} from "./drawer/drawerState";
import type { BillingConceptDraft, ConfigState, ClientState, DrawerStep } from "./drawer/drawerState";

// Steps
import StepType        from "./drawer/steps/StepType";
import StepSubtype     from "./drawer/steps/StepSubtype";
import StepClient      from "./drawer/steps/StepClient";
import StepConfig      from "./drawer/steps/StepConfig";
import StepConceptos   from "./drawer/steps/StepConceptos";
import StepGeneralInfo from "./drawer/generalInfo/StepGeneralInfo";

// Items (productos) — inline ya que es simple
import StepItems from "./drawer/steps/StepItems";

type Props = {
  open:    boolean;
  onClose: () => void;
  onCreate: (
    payload:          CreateQuotationPayload,
    items?:           Omit<CreateItemPayload,    "quotation_id">[],
    services?:        Omit<CreateServicePayload, "quotation_id">[],
    billingConcepts?: BillingConceptDraft[],
  ) => Promise<void>;
};

export default function QuotationCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t }         = useTranslation();
  const { companyId } = useTenant();

  // ── TIPO Y SUBTIPO ─────────────────────────────────────────
  const [quotType,       setQuotType]       = useState<QuotationType>("services");
  const [serviceSubtype, setServiceSubtype] = useState<ServiceSubtype | null>(null);

  // ── CLIENTE ────────────────────────────────────────────────
  const [clientState, setClientState] = useState<ClientState>(EMPTY_CLIENT());

  // ── GENERAL INFO ───────────────────────────────────────────
  const [generalInfo, setGeneralInfo] = useState<Partial<GeneralInfo>>({});

  // ── CONTENIDO ──────────────────────────────────────────────
  const [items,           setItems]           = useState<Omit<CreateItemPayload, "quotation_id">[]>([]);
  const [billingConcepts, setBillingConcepts] = useState<BillingConceptDraft[]>([]);
  const [svcCatalog,      setSvcCatalog]      = useState<any[]>([]);

  // ── CONFIG ─────────────────────────────────────────────────
  const [config, setConfig] = useState<ConfigState>(EMPTY_CONFIG());

  // ── NAVEGACIÓN ─────────────────────────────────────────────
  const steps   = getSteps(quotType, !!serviceSubtype);
  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = steps[stepIdx];

  const stepLabels = config.language === "en" ? STEP_LABELS_EN : STEP_LABELS_ES;

  // ── ESTADO ─────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // ── CARGAR CATÁLOGO SERVICIOS ──────────────────────────────
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

  // ── RESET AL ABRIR ─────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setQuotType("services");
      setServiceSubtype(null);
      setClientState(EMPTY_CLIENT());
      setGeneralInfo({});
      setItems([]);
      setBillingConcepts([]);
      setConfig(EMPTY_CONFIG());
      setError(null);
    }
  }, [open]);

  // ── VALIDACIÓN POR PASO ────────────────────────────────────
  function canAdvance(): boolean {
    switch (currentStep) {
      case "type":      return true;
      case "subtype":   return !!serviceSubtype;
      case "client":    return !!(clientState.useManual ? clientState.manualClient.name.trim() : clientState.selectedClient);
      case "general":   return true; // validación suave — cada componente muestra warnings
      case "conceptos": return quotType === "products"
        ? items.length > 0
        : billingConcepts.length > 0 && billingConcepts.every(c => c.lines.length > 0);
      case "config":    return true;
      case "preview":   return true;
      default:          return true;
    }
  }

  function next() {
    setError(null);
    if (stepIdx < steps.length - 1) setStepIdx(s => s + 1);
  }

  function prev() {
    if (stepIdx > 0) setStepIdx(s => s - 1);
  }

  // ── CREAR ──────────────────────────────────────────────────
  async function handleCreate() {
    setSaving(true);
    try {
      const clientName  = clientState.useManual ? clientState.manualClient.name  : clientState.selectedClient?.name;
      const clientEmail = clientState.useManual ? clientState.manualClient.email : clientState.selectedClient?.email;
      const clientRfc   = clientState.useManual ? clientState.manualClient.rfc   : clientState.selectedClient?.rfc;
      const discount    = Number(config.discount_amount) || 0;

      await onCreate(
        {
          type:             quotType,
          service_subtype:  serviceSubtype ?? undefined,
          language:         config.language,
          general_info:     Object.keys(generalInfo).length > 0 ? generalInfo as GeneralInfo : undefined,
          client_id:        !clientState.useManual ? clientState.selectedClient?.id : undefined,
          client_name:      clientName,
          client_email:     clientEmail     || undefined,
          client_rfc:       clientRfc       || undefined,
          contact_name:     clientState.contactName  || undefined,
          contact_email:    clientState.contactEmail || undefined,
          contact_title:    clientState.contactTitle || undefined,
          template:         "elegante",
          currency:         config.currency,
          discount_amount:  discount        || undefined,
          tax_rate:         Number(config.tax_rate) || 16,
          valid_until:      config.valid_until || undefined,
          notes:            config.notes     || undefined,
          terms:            config.terms     || undefined,
        },
        quotType === "products" ? items         : undefined,
        undefined,
        quotType === "services" ? billingConcepts : undefined,
      );
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Error al crear la cotización");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // ── TOTALES para preview ───────────────────────────────────
  const subtotal = quotType === "products"
    ? items.reduce((s, i) => s + i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100), 0)
    : billingConcepts.reduce((s, c) => s + c.lines.reduce((ls, l) => ls + Number(l.price), 0), 0);
  const discount = Number(config.discount_amount) || 0;
  const taxAmt   = Math.max(0, subtotal - discount) * ((Number(config.tax_rate) || 16) / 100);
  const total    = Math.max(0, subtotal - discount) + taxAmt;

  return (
    <>
      {/* OVERLAY */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />

      {/* DRAWER */}
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(640px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                Nueva cotización
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {stepLabels[currentStep]}
                {serviceSubtype && currentStep !== "type" && currentStep !== "subtype" && (
                  <span style={{ marginLeft: "6px", fontSize: "11px", color: "var(--color-brand-blue)", fontWeight: 600 }}>
                    · {serviceSubtype.replace(/_/g, " ").toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* PROGRESS BAR */}
          <div style={{ display: "flex", gap: "3px" }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{
                  height: "3px", borderRadius: "var(--radius-full)",
                  background: i <= stepIdx ? "var(--color-brand-blue)" : "var(--color-border-faint)",
                  transition: "background 0.3s",
                }} />
                <div style={{
                  fontSize: "9px", fontWeight: 600, marginTop: "3px",
                  color: i === stepIdx ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.3px",
                }}>
                  {stepLabels[s]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin: "0 24px", marginTop: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start", minHeight: 0 }}>

          {currentStep === "type" && (
            <StepType quotType={quotType} setQuotType={(t) => { setQuotType(t); setServiceSubtype(null); }} />
          )}

          {currentStep === "subtype" && (
            <StepSubtype serviceSubtype={serviceSubtype} setServiceSubtype={setServiceSubtype} />
          )}

          {currentStep === "client" && (
            <StepClient state={clientState} onChange={(u) => setClientState(p => ({ ...p, ...u }))} />
          )}

          {currentStep === "general" && serviceSubtype && (
            <StepGeneralInfo
              subtype={serviceSubtype}
              info={generalInfo}
              onChange={(u) => setGeneralInfo(p => ({ ...p, ...u }))}
            />
          )}

          {currentStep === "conceptos" && quotType === "products" && (
            <StepItems items={items} setItems={setItems} companyId={companyId ?? ""} />
          )}

          {currentStep === "conceptos" && quotType === "services" && (
            <StepConceptos
              billingConcepts={billingConcepts}
              setBillingConcepts={setBillingConcepts}
              svcCatalog={svcCatalog}
            />
          )}

          {currentStep === "config" && (
            <StepConfig state={config} onChange={(u) => setConfig(p => ({ ...p, ...u }))} />
          )}

          {currentStep === "preview" && (
            <Preview
              quotType={quotType}
              serviceSubtype={serviceSubtype}
              clientState={clientState}
              items={items}
              billingConcepts={billingConcepts}
              config={config}
              subtotal={subtotal}
              taxAmt={taxAmt}
              total={total}
              discount={discount}
            />
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {stepIdx > 0 && (
            <button onClick={prev} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← Atrás
            </button>
          )}
          {currentStep !== "preview" ? (
            <button
              onClick={next}
              disabled={!canAdvance()}
              style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: canAdvance() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: canAdvance() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed" }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Creando…" : "Crear cotización"}
            </button>
          )}
          <button onClick={onClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

// ── PREVIEW COMPONENT (inline — solo para este drawer) ────────
function Preview({ quotType, serviceSubtype, clientState, items, billingConcepts, config, subtotal, taxAmt, total, discount }: any) {
  const clientName = clientState.useManual ? clientState.manualClient.name : clientState.selectedClient?.name;

  return (
    <>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Resumen de la cotización
      </div>

      {/* Cliente */}
      <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "5px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Cliente</div>
        {[
          { label: "Nombre",   value: clientName },
          { label: "RFC",      value: clientState.useManual ? clientState.manualClient.rfc : clientState.selectedClient?.rfc },
          { label: "Contacto", value: clientState.contactName },
          { label: "Tipo",     value: serviceSubtype ? serviceSubtype.replace(/_/g, " ") : (quotType === "products" ? "Productos" : "Servicios") },
          { label: "Idioma",   value: config.language === "en" ? "🇺🇸 English" : "🇲🇽 Español" },
        ].filter(r => r.value).map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
            <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Conceptos */}
      <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
          {quotType === "products" ? `${items.length} productos` : `${billingConcepts.length} concepto${billingConcepts.length !== 1 ? "s" : ""}`}
        </div>
        {quotType === "products" && items.map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
            <span style={{ color: "var(--color-text-second)" }}>{item.quantity}× {item.description}</span>
            <span style={{ fontWeight: 600 }}>${(item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
        {quotType === "services" && billingConcepts.map((c: any, i: number) => {
          const ctotal = c.lines.reduce((s: number, l: any) => s + Number(l.price), 0);
          return (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ fontWeight: 700 }}>{c.description}</span>
                <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>{c.currency} ${ctotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
              {c.lines.map((l: any, j: number) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", paddingLeft: "12px", marginTop: "2px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>↳ {l.description.substring(0, 40)}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{l.currency} ${Number(l.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Totales */}
      <div style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "grid", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
          <span>{config.currency} ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-warning-text)" }}>Descuento</span>
            <span style={{ color: "var(--color-warning-text)" }}>- ${discount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
          <span style={{ color: "var(--color-text-muted)" }}>IVA {config.tax_rate}%</span>
          <span>{config.currency} ${taxAmt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, marginTop: "4px", paddingTop: "6px", borderTop: "1px solid var(--color-success-border)" }}>
          <span style={{ color: "var(--color-success-text)" }}>TOTAL</span>
          <span style={{ color: "var(--color-success-text)" }}>{config.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </>
  );
}
