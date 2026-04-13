"use client";

import { useEffect, useState } from "react";
import type { Client } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getClientRole, getClientInitials, hasCompleteProfile } from "../services/clients.normalization";

type Props = {
  client:       Client | null;
  onUpdate:     (id: string, updates: Partial<Client>) => Promise<void>;
  onToggle:     (id: string, is_active: boolean) => Promise<void>;
  detailLoading: boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function ClientWorkspace({ client, onUpdate, onToggle, detailLoading }: Props) {
  const { t }               = useTranslation();
  const [form, setForm]     = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    if (client) setForm({ ...client });
    else setForm({});
  }, [client?.id]);

  function set(key: string, value: any) {
    setForm((p: any) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    if (!client?.id) return;
    setSaving(true);
    try {
      await onUpdate(client.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  if (!client) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "32px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", height: "100%",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {(t.clients as any)?.workspaceEmpty ?? "Selecciona un cliente"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
          {(t.clients as any)?.workspaceEmptyDesc ?? "Aquí podrás editar datos, ver historial y gestionar documentos legales."}
        </div>
      </div>
    );
  }

  const role     = getClientRole(client);
  const initials = getClientInitials(client);
  const complete = hasCompleteProfile(client);

  const ROLE_COLOR: Record<string, string> = {
    customer: "var(--color-brand-blue)",
    supplier: "var(--color-success-text)",
    both:     "#a78bfa",
    none:     "var(--color-text-muted)",
  };

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "20px",
      display: "flex", flexDirection: "column", gap: "16px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
            background: ROLE_COLOR[role] + "20",
            border: `2px solid ${ROLE_COLOR[role]}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: 800, color: ROLE_COLOR[role],
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {client.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: ROLE_COLOR[role] + "20", color: ROLE_COLOR[role] }}>
                {(t.clients as any)?.[role] ?? role}
              </span>
              {client.rfc && (
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>RFC: {client.rfc}</span>
              )}
              {!client.is_active && (
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-danger-text)", padding: "2px 8px", background: "var(--color-danger-bg)", borderRadius: "var(--radius-full)" }}>
                  {t.general.inactive}
                </span>
              )}
            </div>
          </div>
          {/* ROLE TOGGLES */}
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            {[
              { key: "is_customer", label: (t.clients as any)?.customer ?? "Cliente" },
              { key: "is_supplier", label: (t.clients as any)?.supplier ?? "Proveedor" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => set(r.key, !form[r.key])}
                style={{
                  height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", cursor: "pointer",
                  fontSize: "11px", fontWeight: 600,
                  background: form[r.key] ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                  color:      form[r.key] ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${form[r.key] ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                  transition: "var(--transition-fast)",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* PROFILE COMPLETENESS */}
        {!complete && (
          <div style={{
            marginTop: "12px", padding: "8px 12px", borderRadius: "var(--radius-md)",
            background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
            fontSize: "12px", color: "var(--color-warning-text)", display: "flex", gap: "6px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {(t.clients as any)?.profileIncomplete ?? "Perfil incompleto — faltan razón social, RFC, email o teléfono"}
          </div>
        )}
      </div>

      {/* FORM SCROLLABLE */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>

        {/* DATOS FISCALES */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.clients as any)?.fiscalData ?? "Datos fiscales"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Field label={(t.clients as any)?.legalName ?? "Razón social"}>
            <input value={form.legal_name ?? ""} onChange={(e) => set("legal_name", e.target.value)} placeholder="Empresa S.A. de C.V." style={INPUT} />
          </Field>
          <Field label="RFC">
            <input value={form.rfc ?? ""} onChange={(e) => set("rfc", e.target.value.toUpperCase())} placeholder="EMP123456ABC" style={INPUT} />
          </Field>
        </div>

        {/* CONTACTO */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.clients as any)?.contactData ?? "Contacto"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Field label={(t.clients as any)?.email ?? "Email"}>
            <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="contacto@empresa.com" style={INPUT} />
          </Field>
          <Field label={(t.clients as any)?.phone ?? "Teléfono"}>
            <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
          </Field>
          <Field label={(t.clients as any)?.website ?? "Sitio web"}>
            <input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="www.empresa.com" style={INPUT} />
          </Field>
          <Field label={(t.clients as any)?.city ?? "Ciudad"}>
            <input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Guadalajara" style={INPUT} />
          </Field>
        </div>

        {/* COMERCIAL */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {(t.clients as any)?.commercialData ?? "Comercial"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Field label={(t.clients as any)?.creditLimit ?? "Límite de crédito"}>
            <input type="number" value={form.credit_limit ?? ""} onChange={(e) => set("credit_limit", Number(e.target.value))} placeholder="50000" style={INPUT} />
          </Field>
          <Field label={(t.clients as any)?.paymentTerms ?? "Términos de pago"}>
            <input value={form.payment_terms ?? ""} onChange={(e) => set("payment_terms", e.target.value)} placeholder="30 días neto" style={INPUT} />
          </Field>
        </div>

        <Field label={(t.clients as any)?.notes ?? "Notas"}>
          <textarea
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }}
          />
        </Field>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "8px" }}>
          <button onClick={handleSave} disabled={saving} style={{
            height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)",
            background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
            color: "#fff", border: "none", fontSize: "13px", fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", transition: "var(--transition-fast)",
          }}>
            {saving ? t.general.loading : saved ? (t.clients as any)?.saved ?? "Guardado" : t.general.save}
          </button>
          <button
            onClick={() => onToggle(client.id, !client.is_active)}
            style={{
              height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)",
              background: client.is_active ? "var(--color-danger-bg)" : "var(--color-success-bg)",
              border: `1px solid ${client.is_active ? "var(--color-danger-border)" : "var(--color-success-border)"}`,
              color: client.is_active ? "var(--color-danger-text)" : "var(--color-success-text)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            {client.is_active ? (t.clients as any)?.deactivate ?? "Desactivar" : (t.clients as any)?.activate ?? "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}
