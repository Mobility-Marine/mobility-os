"use client";
import { useState, useEffect } from "react";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type {
  QuotationType, ServiceSubtype, GeneralInfo,
  CreateQuotationPayload, CreateItemPayload, CreateServicePayload,
} from "../types/quotations.types";
import {
  getSteps, STEP_LABELS_ES, STEP_LABELS_EN,
  EMPTY_CONFIG, EMPTY_CLIENT,
} from "./drawer/drawerState";
import type { BillingConceptDraft, ConfigState, ClientState } from "./drawer/drawerState";
import StepType        from "./drawer/steps/StepType";
import StepSubtype     from "./drawer/steps/StepSubtype";
import StepClient      from "./drawer/steps/StepClient";
import StepConfig      from "./drawer/steps/StepConfig";
import StepConceptos   from "./drawer/steps/StepConceptos";
import StepGeneralInfo from "./drawer/generalInfo/StepGeneralInfo";
import StepItems       from "./drawer/steps/StepItems";

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
  const { companyId } = useTenant();

  const [quotType,       setQuotType]       = useState<QuotationType>("services");
  const [serviceSubtype, setServiceSubtype] = useState<ServiceSubtype | null>(null);
  const [clientState,    setClientState]    = useState<ClientState>(EMPTY_CLIENT());
  const [generalInfo,    setGeneralInfo]    = useState<Partial<GeneralInfo>>({});
  const [items,          setItems]          = useState<Omit<CreateItemPayload, "quotation_id">[]>([]);
  const [billingConcepts,setBillingConcepts]= useState<BillingConceptDraft[]>([]);
  const [svcCatalog,     setSvcCatalog]     = useState<any[]>([]);
  const [config,         setConfig]         = useState<ConfigState>(EMPTY_CONFIG());
  const [stepIdx,        setStepIdx]        = useState(0);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [ccEmails,       setCcEmails]       = useState("");
  const [sendingEmail,   setSendingEmail]   = useState(false);

  const steps       = getSteps(quotType);
  const currentStep = steps[stepIdx];
  const stepLabels  = config.language === "en" ? STEP_LABELS_EN : STEP_LABELS_ES;

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

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setQuotType("services");
    setServiceSubtype(null);
    setClientState(EMPTY_CLIENT());
    setGeneralInfo({});
    setItems([]);
    setBillingConcepts([]);
    setConfig(EMPTY_CONFIG());
    setError(null);
    setCcEmails("");
    setSendingEmail(false);
  }, [open]);

  function canAdvance(): boolean {
    switch (currentStep) {
      case "type":      return true;
      case "subtype":   return !!serviceSubtype;
      case "client":    return !!(clientState.useManual ? clientState.manualClient.name.trim() : clientState.selectedClient);
      case "general":   return true;
      case "conceptos": return quotType === "products"
        ? items.length > 0
        : billingConcepts.length > 0 && billingConcepts.every(c => c.lines.length > 0);
      default:          return true;
    }
  }

  function next() { setError(null); if (stepIdx < steps.length - 1) setStepIdx(s => s + 1); }
  function prev() { if (stepIdx > 0) setStepIdx(s => s - 1); }

  async function handleCreate() {
    setSaving(true);
    try {
      const clientName  = clientState.useManual ? clientState.manualClient.name  : clientState.selectedClient?.name;
      const clientEmail = clientState.useManual ? clientState.manualClient.email : clientState.selectedClient?.email;
      const clientRfc   = clientState.useManual ? clientState.manualClient.rfc   : clientState.selectedClient?.rfc;
      const discount    = Number(config.discount_amount) || 0;

      // Auto-detectar moneda principal
      let currency = config.currency;
      if (billingConcepts.length > 0) {
        const currencies = billingConcepts.flatMap(c => c.lines.map(l => (l as any).currency ?? c.currency));
        const usd = currencies.filter(c => c === "USD").length;
        const mxn = currencies.filter(c => c === "MXN").length;
        currency = usd >= mxn ? "USD" : "MXN";
      }

      await onCreate(
        {
          type:            quotType,
          service_subtype: serviceSubtype ?? undefined,
          language:        config.language,
          general_info:    Object.keys(generalInfo).length > 0 ? generalInfo as GeneralInfo : undefined,
          client_id:       !clientState.useManual ? clientState.selectedClient?.id : undefined,
          client_name:     clientName,
          client_email:    clientEmail    || undefined,
          client_rfc:      clientRfc      || undefined,
          contact_name:    clientState.contactName  || undefined,
          contact_email:   clientState.contactEmail || undefined,
          contact_title:   clientState.contactTitle || undefined,
          template:        "elegante",
          currency,
          discount_amount: discount || undefined,
          tax_rate:        Number(config.tax_rate) || 16,
          valid_until:     config.valid_until || undefined,
          notes:           config.notes    || undefined,
          terms:           config.terms    || undefined,
        },
        quotType === "products" ? items          : undefined,
        undefined,
        quotType === "services" ? billingConcepts : undefined,
      );
      setStepIdx(steps.length - 1);
    } catch (e: any) {
      setError(e?.message ?? "Error al crear la cotización");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // Totales para preview
  const subtotal = quotType === "products"
    ? items.reduce((s, i) => s + i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100), 0)
    : billingConcepts.reduce((s, c) => s + c.lines.reduce((ls, l) => ls + Number(l.price), 0), 0);
  const discount = Number(config.discount_amount) || 0;
  const taxAmt   = Math.max(0, subtotal - discount) * ((Number(config.tax_rate) || 16) / 100);
  const total    = Math.max(0, subtotal - discount) + taxAmt;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(640px, 96vw)",
        background: "var(--color-bg-base)",
        borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden",
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
          <div style={{ display: "flex", gap: "3px" }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: "3px", borderRadius: "var(--radius-full)", background: i <= stepIdx ? "var(--color-brand-blue)" : "var(--color-border-faint)", transition: "background 0.3s" }} />
                <div style={{ fontSize: "9px", fontWeight: 600, marginTop: "3px", color: i === stepIdx ? "var(--color-brand-blue)" : "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
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

        {/* CONTENT — scroll aquí */}
        <div style={{
          flex: 1,
          overflowY: "scroll",
          overflowX: "hidden",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
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
            <QuotPreview
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
          {currentStep === "actions" && (
            <ActionsStep
              contactEmail={clientState.contactEmail}
              ccEmails={ccEmails}
              setCcEmails={setCcEmails}
              sendingEmail={sendingEmail}
              setSendingEmail={setSendingEmail}
              onClose={onClose}
            />
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {stepIdx > 0 && currentStep !== "actions" && (
            <button onClick={prev} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
              ← Atrás
            </button>
          )}
          {currentStep === "actions" ? (
            <button onClick={onClose} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              Ir al Workspace
            </button>
          ) : currentStep === "preview" ? (
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Creando…" : "✓ Crear cotización"}
            </button>
          ) : (
            <button onClick={next} disabled={!canAdvance()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: canAdvance() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: canAdvance() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed" }}>
              Siguiente →
            </button>
          )}
          {currentStep !== "actions" && (
            <button onClick={onClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── ACTIONS ───────────────────────────────────────────────────
function ActionsStep({ contactEmail, ccEmails, setCcEmails, sendingEmail, setSendingEmail, onClose }: any) {
  return (
    <>
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--color-success-bg)", border: "2px solid var(--color-success-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "6px" }}>¡Cotización creada!</div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Selecciona la cotización en el Workspace para descargar el PDF.</div>
      </div>

      <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Enviar por correo</div>
        {contactEmail
          ? <div style={{ fontSize: "12px", color: "var(--color-text-second)" }}>Para: <strong>{contactEmail}</strong></div>
          : <div style={{ fontSize: "12px", color: "var(--color-warning-text)" }}>Sin correo de contacto asignado</div>
        }
        <div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>CC (opcional, separar con comas)</div>
          <input value={ccEmails} onChange={(e) => setCcEmails(e.target.value)} placeholder="correo1@empresa.com, correo2@empresa.com"
            style={{ width: "100%", height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" as any }} />
        </div>
        <button disabled={sendingEmail || !contactEmail} onClick={() => setSendingEmail(true)}
          style={{ height: "38px", borderRadius: "var(--radius-md)", background: contactEmail ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: contactEmail ? "#fff" : "var(--color-text-muted)", border: contactEmail ? "none" : "1px solid var(--color-border)", fontSize: "13px", fontWeight: 600, cursor: contactEmail ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          {sendingEmail ? "Enviando…" : "Enviar cotización por correo"}
        </button>
      </div>

      <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
        💡 Cierra este drawer → selecciona la cotización en la lista → botón <strong>Descargar PDF</strong> en el Workspace.
      </div>
    </>
  );
}

// ── PREVIEW ───────────────────────────────────────────────────
function QuotPreview({ quotType, serviceSubtype, clientState, items, billingConcepts, config, subtotal, taxAmt, total, discount }: any) {
  const clientName = clientState.useManual ? clientState.manualClient.name : clientState.selectedClient?.name;
  return (
    <>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Resumen de la cotización</div>

      <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "5px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Cliente</div>
        {[
          { label: "Nombre",   value: clientName },
          { label: "RFC",      value: clientState.useManual ? clientState.manualClient.rfc : clientState.selectedClient?.rfc },
          { label: "Contacto", value: clientState.contactName },
          { label: "Subtipo",  value: serviceSubtype ? serviceSubtype.replace(/_/g, " ").toUpperCase() : quotType === "products" ? "Productos" : null },
          { label: "Idioma",   value: config.language === "en" ? "🇺🇸 English" : "🇲🇽 Español" },
        ].filter(r => r.value).map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
            <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
          {quotType === "products" ? `${items.length} producto${items.length !== 1 ? "s" : ""}` : `${billingConcepts.length} concepto${billingConcepts.length !== 1 ? "s" : ""} de facturación`}
        </div>
        {quotType === "products" && items.map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
            <span style={{ color: "var(--color-text-second)" }}>{item.quantity}× {item.description}</span>
            <span style={{ fontWeight: 600 }}>${(item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
        {quotType === "services" && billingConcepts.map((c: any, i: number) => {
          const ct = c.lines.reduce((s: number, l: any) => s + Number(l.price), 0);
          return (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700 }}>
                <span>{c.description}</span>
                <span style={{ color: "var(--color-success-text)" }}>{c.currency} ${ct.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
              </div>
              {c.lines.map((l: any, j: number) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", paddingLeft: "10px", marginTop: "2px", color: "var(--color-text-muted)" }}>
                  <span>↳ {l.description?.substring(0, 42)}</span>
                  <span>{l.currency} ${Number(l.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "grid", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
          <span>${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-warning-text)" }}>Descuento</span>
            <span style={{ color: "var(--color-warning-text)" }}>- ${discount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
          <span style={{ color: "var(--color-text-muted)" }}>IVA (calculado por línea)</span>
          <span>${taxAmt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, marginTop: "4px", paddingTop: "6px", borderTop: "1px solid var(--color-success-border)" }}>
          <span style={{ color: "var(--color-success-text)" }}>TOTAL</span>
          <span style={{ color: "var(--color-success-text)" }}>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </>
  );
}
