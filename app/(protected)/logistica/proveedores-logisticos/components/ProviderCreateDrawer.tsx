"use client";

import { useState } from "react";
import type { LogisticsProvider, ProviderType } from "../types/providers.types";
import { PROVIDER_TYPES, PROVIDER_TYPE_CONFIG } from "../types/providers.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  open:    boolean;
  onClose: () => void;
  onCreate:(data: Omit<LogisticsProvider, "id" | "company_id" | "created_at" | "updated_at" | "created_by" | "documents" | "invoices">) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}{required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

export default function ProviderCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t }  = useTranslation();
  const tl     = (t.logistics as any) ?? {};
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState<Partial<LogisticsProvider>>({
    provider_type:    "carrier_mx",
    is_active:        true,
    name:             "",
    contact_name:     "",
    contact_email:    "",
    contact_phone:    "",
    rfc:              "",
    tax_id:           "",
    scac_code:        "",
    coverage_routes:  "",
    services_offered: "",
    payment_terms:    "",
    notes:            "",
  });

  function set(k: keyof LogisticsProvider, v: any) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCreate() {
    if (!form.name?.trim() || !form.provider_type) return;
    setSaving(true); setError(null);
    try {
      await onCreate(form as any);
      handleClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm({ provider_type: "carrier_mx", is_active: true, name: "" });
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }}
      />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(520px, 96vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* HEADER */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {tl.newProvider ?? "Nuevo proveedor logístico"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {tl.providersDesc ?? "Transportistas, agentes aduanales, navieras y más."}
            </div>
          </div>
          <button onClick={handleClose} style={{
            width: "30px", height: "30px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
            color: "var(--color-text-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* TIPO DE PROVEEDOR */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {tl.providerType ?? "Tipo de proveedor"} *
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {PROVIDER_TYPES.map((type) => {
                const cfg      = PROVIDER_TYPE_CONFIG[type];
                const label    = tl[`type${type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? type;
                const isSelected = form.provider_type === type;
                return (
                  <button key={type} onClick={() => set("provider_type", type)} style={{
                    padding: "8px 6px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                    background: isSelected ? `${cfg.color}15` : "var(--color-bg-subtle)",
                    border: `2px solid ${isSelected ? cfg.color : "var(--color-border-faint)"}`,
                    transition: "all 0.15s",
                  }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color, margin: "0 auto 4px" }} />
                    <div style={{ fontSize: "10px", fontWeight: isSelected ? 700 : 400, color: isSelected ? cfg.color : "var(--color-text-second)" }}>
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DATOS BÁSICOS */}
          <Field label={`${tl.providerName ?? "Nombre del proveedor"}`} required>
            <input
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nombre de la empresa o proveedor"
              style={INPUT}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Field label={tl.rfc ?? "RFC"}>
              <input
                value={form.rfc ?? ""}
                onChange={(e) => set("rfc", e.target.value.toUpperCase())}
                placeholder="RFC123456ABC"
                style={INPUT}
              />
            </Field>
            <Field label={tl.taxId ?? "Tax ID / EIN"}>
              <input
                value={form.tax_id ?? ""}
                onChange={(e) => set("tax_id", e.target.value)}
                placeholder="Para proveedores USA"
                style={INPUT}
              />
            </Field>
            <Field label={tl.scacCode ?? "Código SCAC"}>
              <input
                value={form.scac_code ?? ""}
                onChange={(e) => set("scac_code", e.target.value.toUpperCase())}
                placeholder="ABCD (carriers USA)"
                style={INPUT}
              />
            </Field>
            <Field label={tl.paymentTerms ?? "Condiciones de pago"}>
              <input
                value={form.payment_terms ?? ""}
                onChange={(e) => set("payment_terms", e.target.value)}
                placeholder="15 días / Crédito 30"
                style={INPUT}
              />
            </Field>
          </div>

          {/* CONTACTO */}
          <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Contacto principal
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Field label={tl.contactName ?? "Nombre"}>
                <input
                  value={form.contact_name ?? ""}
                  onChange={(e) => set("contact_name", e.target.value)}
                  style={INPUT}
                />
              </Field>
              <Field label={tl.contactPhone ?? "Teléfono"}>
                <input
                  value={form.contact_phone ?? ""}
                  onChange={(e) => set("contact_phone", e.target.value)}
                  style={INPUT}
                />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label={tl.contactEmail ?? "Email"}>
                  <input
                    type="email"
                    value={form.contact_email ?? ""}
                    onChange={(e) => set("contact_email", e.target.value)}
                    style={INPUT}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* OPERACIÓN */}
          <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "12px", display: "grid", gap: "10px" }}>
            <Field label={tl.coverageRoutes ?? "Rutas / Cobertura"}>
              <input
                value={form.coverage_routes ?? ""}
                onChange={(e) => set("coverage_routes", e.target.value)}
                placeholder="GDL-CDMX, México-USA, etc."
                style={INPUT}
              />
            </Field>
            <Field label={tl.servicesOffered ?? "Servicios que ofrece"}>
              <textarea
                rows={2}
                value={form.services_offered ?? ""}
                onChange={(e) => set("services_offered", e.target.value)}
                placeholder="FTL, LTL, despacho aduanal, almacenaje…"
                style={{ ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" }}
              />
            </Field>
            <Field label={tl.notes ?? "Notas"}>
              <input
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Observaciones internas…"
                style={INPUT}
              />
            </Field>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)", fontSize: "13px",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{
            height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
            color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer",
          }}>
            {t.general.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.name?.trim()}
            style={{
              flex: 1, height: "40px", borderRadius: "var(--radius-md)",
              background: form.name?.trim() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              color: form.name?.trim() ? "#fff" : "var(--color-text-muted)",
              border: "none", fontSize: "13px", fontWeight: 700,
              cursor: saving || !form.name?.trim() ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {saving ? t.general.loading : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                {tl.newProvider ?? "Crear proveedor"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
