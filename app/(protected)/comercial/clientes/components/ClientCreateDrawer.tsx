"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CreateClientPayload } from "../types/clients.types";

type Props = {
  open:    boolean;
  onClose: () => void;
  onCreate:(payload: CreateClientPayload) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
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

export default function ClientCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [form, setForm]     = useState({
    name: "", legal_name: "", rfc: "", email: "", phone: "",
    city: "", website: "", notes: "",
    is_customer: true, is_supplier: false,
    credit_limit: "", payment_terms: "",
  });

  function set(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
    if (error) setError(null);
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setError((t.clients as any)?.nameRequired ?? "Nombre requerido");
      return;
    }
    if (!form.is_customer && !form.is_supplier) {
      setError((t.clients as any)?.roleRequired ?? "Selecciona al menos un rol (cliente o proveedor)");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        name:          form.name,
        legal_name:    form.legal_name    || undefined,
        rfc:           form.rfc           || undefined,
        email:         form.email         || undefined,
        phone:         form.phone         || undefined,
        city:          form.city          || undefined,
        website:       form.website       || undefined,
        notes:         form.notes         || undefined,
        is_customer:   form.is_customer,
        is_supplier:   form.is_supplier,
        credit_limit:  form.credit_limit  ? Number(form.credit_limit) : undefined,
        payment_terms: form.payment_terms || undefined,
      });
      setForm({ name: "", legal_name: "", rfc: "", email: "", phone: "", city: "", website: "", notes: "", is_customer: true, is_supplier: false, credit_limit: "", payment_terms: "" });
      onClose();
    } catch { setError((t.clients as any)?.createError ?? "Error al crear"); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(480px, 95vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {(t.clients as any)?.newClient ?? "Nuevo cliente / proveedor"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {(t.clients as any)?.newClientDesc ?? "Un registro, múltiples roles"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* FORM */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* ROL */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {(t.clients as any)?.role ?? "Rol"} *
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { key: "is_customer", label: (t.clients as any)?.customer ?? "Cliente" },
                { key: "is_supplier", label: (t.clients as any)?.supplier ?? "Proveedor" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => set(r.key, !(form as any)[r.key])}
                  style={{
                    flex: 1, height: "36px", borderRadius: "var(--radius-md)", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600,
                    background: (form as any)[r.key] ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                    color:      (form as any)[r.key] ? "#fff" : "var(--color-text-muted)",
                    border: `1px solid ${(form as any)[r.key] ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                    transition: "var(--transition-fast)",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={(t.clients as any)?.name ?? "Nombre comercial"} required>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Empresa S.A." style={INPUT} />
            </Field>
            <Field label={(t.clients as any)?.legalName ?? "Razón social"}>
              <input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} placeholder="Empresa S.A. de C.V." style={INPUT} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="RFC">
              <input value={form.rfc} onChange={(e) => set("rfc", e.target.value.toUpperCase())} placeholder="EMP123456ABC" style={INPUT} />
            </Field>
            <Field label={(t.clients as any)?.city ?? "Ciudad"}>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Guadalajara" style={INPUT} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={(t.clients as any)?.email ?? "Email"}>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contacto@empresa.com" style={INPUT} />
            </Field>
            <Field label={(t.clients as any)?.phone ?? "Teléfono"}>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={(t.clients as any)?.creditLimit ?? "Límite de crédito"}>
              <input type="number" value={form.credit_limit} onChange={(e) => set("credit_limit", e.target.value)} placeholder="50000" style={INPUT} />
            </Field>
            <Field label={(t.clients as any)?.paymentTerms ?? "Términos de pago"}>
              <input value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} placeholder="30 días neto" style={INPUT} />
            </Field>
          </div>

          <Field label={(t.clients as any)?.notes ?? "Notas"}>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }}
            />
          </Field>
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving} style={{
            flex: 1, height: "40px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving ? t.general.loading : (t.clients as any)?.newClient ?? "Crear"}
          </button>
          <button onClick={onClose} style={{
            height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
            color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer",
          }}>
            {t.general.cancel}
          </button>
        </div>
      </div>
    </>
  );
}
