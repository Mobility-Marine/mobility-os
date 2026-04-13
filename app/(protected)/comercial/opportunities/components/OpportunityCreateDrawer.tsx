"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CreateOpportunityPayload } from "../types/opportunities.types";

type Props = {
  open:   boolean;
  onClose:() => void;
  onCreate:(payload: CreateOpportunityPayload) => Promise<void>;
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

export default function OpportunityCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const [form, setForm]     = useState({ name: "", company_name: "", value: "", owner: "", next_action: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    if (error) setError(null);
  }

  async function handleCreate() {
    if (!form.name.trim() && !form.company_name.trim()) {
      setError((t.opportunities as any)?.nameRequired ?? "Nombre o empresa requerido");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        name:         form.name || form.company_name,
        company_name: form.company_name || undefined,
        value:        form.value ? Number(form.value) : 0,
        owner:        form.owner   || undefined,
        next_action:  form.next_action || undefined,
      });
      setForm({ name: "", company_name: "", value: "", owner: "", next_action: "" });
      onClose();
    } catch { setError((t.opportunities as any)?.createError ?? "Error al crear"); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(440px, 95vw)",
        background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)", zIndex: 401,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {(t.opportunities as any)?.newOpportunity ?? "Nueva oportunidad"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {(t.opportunities as any)?.newOpportunityDesc ?? "Registra un nuevo deal en el pipeline"}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={(t.opportunities as any)?.dealName ?? "Nombre del deal"} required>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Deal nombre…" style={INPUT} />
            </Field>
            <Field label={(t.opportunities as any)?.company ?? "Empresa"}>
              <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Empresa S.A." style={INPUT} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={(t.opportunities as any)?.value ?? "Valor estimado"}>
              <input type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="100000" style={INPUT} />
            </Field>
            <Field label={(t.opportunities as any)?.owner ?? "Responsable"}>
              <input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Juan García" style={INPUT} />
            </Field>
          </div>
          <Field label={(t.opportunities as any)?.nextAction ?? "Próxima acción"}>
            <input value={form.next_action} onChange={(e) => set("next_action", e.target.value)} placeholder="Agendar demo…" style={INPUT} />
          </Field>
        </div>

        {/* FOOTER */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving} style={{
            flex: 1, height: "40px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving ? t.general.loading : (t.opportunities as any)?.newOpportunity ?? "Crear oportunidad"}
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
