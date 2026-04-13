"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CreateClientPayload, ClientDocumentType, ClientContactRole } from "../types/clients.types";
import { TAX_REGIMES, CFDI_USES, PAYMENT_METHODS, CONTACT_ROLE_CONFIG } from "../types/clients.types";

type Props = {
  open:    boolean;
  onClose: () => void;
  onCreate:(
    payload: CreateClientPayload,
    contacts?: any[],
    documents?: any[]
  ) => Promise<void>;
};

const STEPS = ["basic", "fiscal", "contacts", "summary"] as const;
type Step = typeof STEPS[number];

const ROLES: ClientContactRole[] = [
  "general_manager", "accounts_payable", "invoice_reception",
  "purchasing", "commercial", "operations", "legal", "general",
];

const DOC_TYPES: ClientDocumentType[] = [
  "contract", "nda", "power_of_attorney", "tax_id", "certificate", "other",
];

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
    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border-faint)" }}>
      {children}
    </div>
  );
}

export default function ClientCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const [step,   setStep]   = useState<Step>("basic");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // Step 1 — Basic
  const [basic, setBasic] = useState({
    name: "", legal_name: "", rfc: "", email: "", phone: "",
    website: "", city: "", zip_code: "", country: "México",
    is_customer: true, is_supplier: false, notes: "",
  });

  // Step 2 — Fiscal
  const [fiscal, setFiscal] = useState({
  tax_regime: "", cfdi_use: "", billing_email: "",
  payment_method: "", payment_form: "PPD",
  payment_terms: "", credit_limit: "",
  billing_street: "", billing_ext_number: "", billing_int_number: "",
  billing_neighborhood: "", zip_code: "", billing_city: "",
  billing_state: "", billing_country: "México",
});

  // Step 3 — Contacts
  const [contacts, setContacts] = useState<{
    name: string; role: ClientContactRole; title: string;
    email: string; phone: string; is_primary: boolean;
  }[]>([]);
  const [contactForm, setContactForm] = useState({
    name: "", role: "general" as ClientContactRole, title: "", email: "", phone: "", is_primary: false,
  });

  // Step 3b — Documents (within contacts step)
  const [documents, setDocuments] = useState<{
    name: string; type: ClientDocumentType; url: string; notes: string;
  }[]>([]);
  const [docForm, setDocForm] = useState({
    name: "", type: "contract" as ClientDocumentType, url: "", notes: "",
  });

  function setB(k: string, v: any) { setBasic((p) => ({ ...p, [k]: v })); }
  function setF(k: string, v: any) { setFiscal((p) => ({ ...p, [k]: v })); }
  function setCF(k: string, v: any) { setContactForm((p) => ({ ...p, [k]: v })); }
  function setDF(k: string, v: any) { setDocForm((p) => ({ ...p, [k]: v })); }

  function addContact() {
    if (!contactForm.name.trim()) return;
    setContacts((p) => [...p, { ...contactForm }]);
    setContactForm({ name: "", role: "general", title: "", email: "", phone: "", is_primary: false });
  }

  function removeContact(i: number) { setContacts((p) => p.filter((_, idx) => idx !== i)); }

  function addDocument() {
    if (!docForm.name.trim()) return;
    setDocuments((p) => [...p, { ...docForm }]);
    setDocForm({ name: "", type: "contract", url: "", notes: "" });
  }

  function removeDocument(i: number) { setDocuments((p) => p.filter((_, idx) => idx !== i)); }

  function canAdvance(): boolean {
    if (step === "basic") return !!(basic.name.trim() && (basic.is_customer || basic.is_supplier));
    return true;
  }

  function nextStep() {
    if (!canAdvance()) { setError((t.clients as any)?.nameRequired ?? "Nombre y rol requeridos"); return; }
    setError(null);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function prevStep() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function handleCreate() {
  setSaving(true);
  try {
    await onCreate(
      {
        name:                 basic.name,
        legal_name:           basic.legal_name            || undefined,
        rfc:                  basic.rfc                   || undefined,
        email:                basic.email                 || undefined,
        phone:                basic.phone                 || undefined,
        website:              basic.website               || undefined,
        city:                 basic.city                  || undefined,
        zip_code:             basic.zip_code              || undefined,
        country:              basic.country               || "México",
        is_customer:          basic.is_customer,
        is_supplier:          basic.is_supplier,
        notes:                basic.notes                 || undefined,
        tax_regime:           fiscal.tax_regime           || undefined,
        cfdi_use:             fiscal.cfdi_use             || undefined,
        billing_email:        fiscal.billing_email        || undefined,
        payment_method:       fiscal.payment_method       || undefined,
        payment_form:         fiscal.payment_form         || "PPD",
        payment_terms:        fiscal.payment_terms        || undefined,
        credit_limit:         fiscal.credit_limit ? Number(fiscal.credit_limit) : undefined,
        billing_street:       fiscal.billing_street       || undefined,
        billing_ext_number:   fiscal.billing_ext_number   || undefined,
        billing_int_number:   fiscal.billing_int_number   || undefined,
        billing_neighborhood: fiscal.billing_neighborhood || undefined,
        billing_city:         fiscal.billing_city         || undefined,
        billing_state:        fiscal.billing_state        || undefined,
        billing_country:      fiscal.billing_country      || "México",
      },
      contacts,
      documents
    );
    handleClose();
  } catch {
    setError((t.clients as any)?.createError ?? "Error al crear");
  } finally {
    setSaving(false);
  }
}

  function handleClose() {
    setStep("basic");
    setBasic({ name: "", legal_name: "", rfc: "", email: "", phone: "", website: "", city: "", zip_code: "", country: "México", is_customer: true, is_supplier: false, notes: "" });
    setFiscal({ tax_regime: "", cfdi_use: "", billing_email: "", billing_address: "", payment_method: "", payment_terms: "", credit_limit: "" });
    setContacts([]); setDocuments([]);
    setContactForm({ name: "", role: "general", title: "", email: "", phone: "", is_primary: false });
    setDocForm({ name: "", type: "contract", url: "", notes: "" });
    setError(null);
    onClose();
  }

  if (!open) return null;

  const STEP_LABELS: Record<Step, string> = {
    basic:    (t.clients as any)?.stepBasic    ?? "Datos básicos",
    fiscal:   (t.clients as any)?.stepFiscal   ?? "Fiscal",
    contacts: (t.clients as any)?.stepContacts ?? "Contactos y docs",
    summary:  (t.clients as any)?.stepSummary  ?? "Confirmación",
  };

  const getRoleLabel = (role: ClientContactRole) => {
    const cfg = CONTACT_ROLE_CONFIG[role];
    return (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? role;
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(560px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {(t.clients as any)?.newClient ?? "Nuevo cliente / proveedor"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {STEP_LABELS[step]}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* STEP PROGRESS */}
          <div style={{ display: "flex", gap: "4px" }}>
            {STEPS.map((s, i) => {
              const idx = STEPS.indexOf(step);
              const done = i < idx;
              const active = s === step;
              return (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{
                    height: "3px", borderRadius: "var(--radius-full)",
                    background: done || active ? "var(--color-brand-blue)" : "var(--color-border-faint)",
                    transition: "background 0.3s",
                  }} />
                  <span style={{ fontSize: "9px", fontWeight: 600, color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ margin: "0 24px", marginTop: "12px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px", flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* ── STEP 1: BASIC ── */}
          {step === "basic" && (
            <>
              <SectionTitle>{(t.clients as any)?.role ?? "Rol"} *</SectionTitle>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { key: "is_customer", label: (t.clients as any)?.customer ?? "Cliente" },
                  { key: "is_supplier", label: (t.clients as any)?.supplier ?? "Proveedor" },
                ].map((r) => (
                  <button key={r.key} onClick={() => setB(r.key, !(basic as any)[r.key])} style={{
                    flex: 1, height: "40px", borderRadius: "var(--radius-md)", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600,
                    background: (basic as any)[r.key] ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                    color:      (basic as any)[r.key] ? "#fff" : "var(--color-text-muted)",
                    border: `1px solid ${(basic as any)[r.key] ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                    transition: "var(--transition-fast)",
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>

              <SectionTitle>{(t.clients as any)?.generalData ?? "Datos generales"}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label={(t.clients as any)?.name ?? "Nombre comercial"} required>
                  <input value={basic.name} onChange={(e) => setB("name", e.target.value)} placeholder="Empresa S.A." style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.legalName ?? "Razón social"}>
                  <input value={basic.legal_name} onChange={(e) => setB("legal_name", e.target.value)} placeholder="Empresa S.A. de C.V." style={INPUT} />
                </Field>
                <Field label="RFC">
                  <input value={basic.rfc} onChange={(e) => setB("rfc", e.target.value.toUpperCase())} placeholder="EMP123456ABC" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.website ?? "Sitio web"}>
                  <input value={basic.website} onChange={(e) => setB("website", e.target.value)} placeholder="www.empresa.com" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.email ?? "Email"}>
                  <input type="email" value={basic.email} onChange={(e) => setB("email", e.target.value)} placeholder="contacto@empresa.com" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.phone ?? "Teléfono"}>
                  <input value={basic.phone} onChange={(e) => setB("phone", e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.city ?? "Ciudad"}>
                  <input value={basic.city} onChange={(e) => setB("city", e.target.value)} placeholder="Guadalajara" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.zipCode ?? "Código postal"}>
                  <input value={basic.zip_code} onChange={(e) => setB("zip_code", e.target.value)} placeholder="44100" style={INPUT} />
                </Field>
              </div>
              <Field label={(t.clients as any)?.notes ?? "Notas"}>
                <textarea rows={3} value={basic.notes} onChange={(e) => setB("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }} />
              </Field>
            </>
          )}

          {/* ── STEP 2: FISCAL ── */}
{step === "fiscal" && (
  <>
    <SectionTitle>{(t.clients as any)?.taxInfo ?? "Información fiscal"}</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      <Field label={(t.clients as any)?.taxRegime ?? "Régimen fiscal"}>
        <select value={fiscal.tax_regime} onChange={(e) => setF("tax_regime", e.target.value)} style={SELECT}>
          <option value="">Seleccionar…</option>
          {TAX_REGIMES.map((r) => <option key={r.value} value={r.value}>{r.value} — {r.label}</option>)}
        </select>
      </Field>
      <Field label={(t.clients as any)?.cfdiUse ?? "Uso de CFDI"}>
        <select value={fiscal.cfdi_use} onChange={(e) => setF("cfdi_use", e.target.value)} style={SELECT}>
          <option value="">Seleccionar…</option>
          {CFDI_USES.map((u) => <option key={u.value} value={u.value}>{u.value} — {u.label}</option>)}
        </select>
      </Field>
    </div>

    <SectionTitle>{(t.clients as any)?.billingData ?? "Datos de facturación"}</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      <Field label={(t.clients as any)?.billingEmail ?? "Email de facturación"}>
        <input type="email" value={fiscal.billing_email} onChange={(e) => setF("billing_email", e.target.value)} placeholder="facturas@empresa.com" style={INPUT} />
      </Field>
      <Field label={(t.clients as any)?.paymentMethod ?? "Forma de pago (SAT)"}>
        <select value={fiscal.payment_method} onChange={(e) => setF("payment_method", e.target.value)} style={SELECT}>
          <option value="">Seleccionar…</option>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.value} — {m.label}</option>)}
        </select>
      </Field>
      <Field label="PUE / PPD *">
        <select value={fiscal.payment_form} onChange={(e) => setF("payment_form", e.target.value)} style={SELECT}>
          {PAYMENT_FORMS.map((p) => <option key={p.value} value={p.value}>{p.value} — {p.label.split(" — ")[1]}</option>)}
        </select>
      </Field>
      <Field label={(t.clients as any)?.paymentTerms ?? "Condiciones de pago"}>
        <input value={fiscal.payment_terms} onChange={(e) => setF("payment_terms", e.target.value)} placeholder="30 días neto" style={INPUT} />
      </Field>
      <Field label={(t.clients as any)?.creditLimit ?? "Límite de crédito"}>
        <input type="number" value={fiscal.credit_limit} onChange={(e) => setF("credit_limit", e.target.value)} placeholder="50000" style={INPUT} />
      </Field>
    </div>

    <SectionTitle>{(t.clients as any)?.fiscalAddress ?? "Dirección fiscal"}</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
      <Field label="Calle">
        <input value={fiscal.billing_street} onChange={(e) => setF("billing_street", e.target.value)} placeholder="Av. Principal" style={INPUT} />
      </Field>
      <Field label="No. Exterior">
        <input value={fiscal.billing_ext_number} onChange={(e) => setF("billing_ext_number", e.target.value)} placeholder="123" style={INPUT} />
      </Field>
      <Field label="No. Interior">
        <input value={fiscal.billing_int_number} onChange={(e) => setF("billing_int_number", e.target.value)} placeholder="A" style={INPUT} />
      </Field>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
      <Field label="Colonia">
        <input value={fiscal.billing_neighborhood} onChange={(e) => setF("billing_neighborhood", e.target.value)} placeholder="Col. Centro" style={INPUT} />
      </Field>
      <Field label="C.P. *" required>
        <input value={fiscal.zip_code} onChange={(e) => setF("zip_code", e.target.value)} placeholder="44100" style={INPUT} />
      </Field>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
      <Field label="Ciudad">
        <input value={fiscal.billing_city} onChange={(e) => setF("billing_city", e.target.value)} placeholder="Guadalajara" style={INPUT} />
      </Field>
      <Field label="Estado">
        <input value={fiscal.billing_state} onChange={(e) => setF("billing_state", e.target.value)} placeholder="Jalisco" style={INPUT} />
      </Field>
      <Field label="País">
        <input value={fiscal.billing_country} onChange={(e) => setF("billing_country", e.target.value)} placeholder="México" style={INPUT} />
      </Field>
    </div>
  </>
)}

          {/* ── STEP 3: CONTACTS + DOCS ── */}
          {step === "contacts" && (
            <>
              {/* CONTACTS */}
              <SectionTitle>{(t.clients as any)?.contacts ?? "Contactos"}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label={(t.clients as any)?.contactName ?? "Nombre"}>
                  <input value={contactForm.name} onChange={(e) => setCF("name", e.target.value)} placeholder="María González" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.contactRole ?? "Rol"}>
                  <select value={contactForm.role} onChange={(e) => setCF("role", e.target.value as ClientContactRole)} style={SELECT}>
                    {ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                  </select>
                </Field>
                <Field label={(t.clients as any)?.contactTitle ?? "Cargo"}>
                  <input value={contactForm.title} onChange={(e) => setCF("title", e.target.value)} placeholder="Dir. de Finanzas" style={INPUT} />
                </Field>
                <Field label="Email">
                  <input type="email" value={contactForm.email} onChange={(e) => setCF("email", e.target.value)} placeholder="maria@empresa.com" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.phone ?? "Teléfono"}>
                  <input value={contactForm.phone} onChange={(e) => setCF("phone", e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
                </Field>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-second)" }}>
                    <input type="checkbox" checked={contactForm.is_primary} onChange={(e) => setCF("is_primary", e.target.checked)} />
                    {(t.clients as any)?.primaryContact ?? "Contacto principal"}
                  </label>
                </div>
              </div>
              <button onClick={addContact} disabled={!contactForm.name.trim()} style={{
                height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)",
                background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                color: "var(--color-info-text)", fontSize: "12px", fontWeight: 600, cursor: "pointer", alignSelf: "start",
              }}>
                + {(t.clients as any)?.addContact ?? "Agregar contacto"}
              </button>

              {contacts.length > 0 && (
                <div style={{ display: "grid", gap: "6px" }}>
                  {contacts.map((c, i) => {
                    const cfg = CONTACT_ROLE_CONFIG[c.role];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: cfg.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{c.name}</span>
                          {c.is_primary && <span style={{ marginLeft: "6px", fontSize: "9px", color: "var(--color-brand-blue)", fontWeight: 700 }}>Principal</span>}
                          <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{getRoleLabel(c.role)} {c.email ? `· ${c.email}` : ""}</div>
                        </div>
                        <button onClick={() => removeContact(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--color-danger-text)", flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DOCUMENTS */}
              <SectionTitle>{(t.clients as any)?.documents ?? "Documentos legales"}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <Field label={(t.clients as any)?.docName ?? "Nombre"}>
                  <input value={docForm.name} onChange={(e) => setDF("name", e.target.value)} placeholder="Contrato marco 2024" style={INPUT} />
                </Field>
                <Field label={(t.clients as any)?.docType ?? "Tipo"}>
                  <select value={docForm.type} onChange={(e) => setDF("type", e.target.value as ClientDocumentType)} style={SELECT}>
                    {DOC_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="URL / Link">
                  <input value={docForm.url} onChange={(e) => setDF("url", e.target.value)} placeholder="https://drive.google.com/…" style={INPUT} />
                </Field>
              </div>
              <button onClick={addDocument} disabled={!docForm.name.trim()} style={{
                height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)",
                background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                color: "var(--color-info-text)", fontSize: "12px", fontWeight: 600, cursor: "pointer", alignSelf: "start",
              }}>
                + {(t.clients as any)?.addDocument ?? "Agregar documento"}
              </button>

              {documents.length > 0 && (
                <div style={{ display: "grid", gap: "6px" }}>
                  {documents.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{d.name}</span>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{d.type}</div>
                      </div>
                      <button onClick={() => removeDocument(i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--color-danger-text)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── STEP 4: SUMMARY ── */}
          {step === "summary" && (
            <>
              <SectionTitle>{(t.clients as any)?.summary ?? "Resumen del registro"}</SectionTitle>

              <div style={{ display: "grid", gap: "8px" }}>
                {[
                  { label: (t.clients as any)?.name ?? "Nombre", value: basic.name },
                  { label: (t.clients as any)?.legalName ?? "Razón social", value: basic.legal_name || "—" },
                  { label: "RFC", value: basic.rfc || "—" },
                  { label: (t.clients as any)?.role ?? "Rol", value: [basic.is_customer && "Cliente", basic.is_supplier && "Proveedor"].filter(Boolean).join(" + ") },
                  { label: (t.clients as any)?.taxRegime ?? "Régimen", value: fiscal.tax_regime ? TAX_REGIMES.find((r) => r.value === fiscal.tax_regime)?.label ?? fiscal.tax_regime : "—" },
                  { label: (t.clients as any)?.billingEmail ?? "Email facturación", value: fiscal.billing_email || "—" },
                  { label: (t.clients as any)?.paymentMethod ?? "Forma de pago", value: fiscal.payment_method ? PAYMENT_METHODS.find((m) => m.value === fiscal.payment_method)?.label ?? fiscal.payment_method : "—" },
                  { label: (t.clients as any)?.paymentTerms ?? "Condiciones de pago", value: fiscal.payment_terms || "—" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", fontSize: "12px" }}>
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {contacts.length > 0 && (
                <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>
                  {contacts.length} {(t.clients as any)?.contacts ?? "contacto(s)"} · {documents.length} {(t.clients as any)?.documents ?? "documento(s)"}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          {step !== "basic" && (
            <button onClick={prevStep} style={{
              height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer",
            }}>
              ← {(t.clients as any)?.back ?? "Atrás"}
            </button>
          )}

          {step !== "summary" ? (
            <button onClick={nextStep} style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "13px", fontWeight: 700, cursor: "pointer",
            }}>
              {(t.clients as any)?.next ?? "Siguiente"} →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={saving} style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: "var(--color-success-text)", color: "#fff", border: "none",
              fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}>
              {saving ? t.general.loading : (t.clients as any)?.createConfirm ?? "Crear cliente"}
            </button>
          )}

          <button onClick={handleClose} style={{
            height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
            color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer",
          }}>
            {t.general.cancel}
          </button>
        </div>
      </div>
    </>
  );
}
