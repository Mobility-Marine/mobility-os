"use client";

import { useState } from "react";
import type { Prospect } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  open: boolean;
  onClose: () => void;
  createProspect: (payload: {
    name?: string; company_name?: string;
    email?: string; phone?: string;
    notes?: string; estimated_value?: number;
    interested_service?: string; lead_source?: string;
  }) => Promise<any>;
  onCreated?: (p: Prospect) => void;
};

const SOURCES = ["manual", "referral", "website", "whatsapp", "call", "email", "campaign"];

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <div style={{
        fontSize: "11px", fontWeight: 600,
        color: "var(--color-text-muted)",
        marginBottom: "5px",
        textTransform: "uppercase", letterSpacing: "0.5px",
        display: "flex", alignItems: "center", gap: "4px",
      }}>
        {label}
        {required && <span style={{ color: "var(--color-danger-text)" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

export default function ProspectCreateDrawer({ open, onClose, createProspect, onCreated }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [form, setForm]       = useState({
    name: "", company_name: "", email: "", phone: "",
    estimated_value: "", notes: "", interested_service: "",
    lead_source: "manual",
  });

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    if (error) setError(null);
  }

  async function handleCreate() {
    if (!form.name.trim() && !form.company_name.trim()) {
      setError(t.prospects.name + " / " + t.prospects.company + " " + t.general.required.toLowerCase());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const prospect = await createProspect({
        ...form,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
      });
      onCreated?.(prospect);
      setForm({ name: "", company_name: "", email: "", phone: "", estimated_value: "", notes: "", interested_service: "", lead_source: "manual" });
      onClose();
    } catch {
      setError(lang => t.prospects.noEstimation);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 400,
        }}
      />

      {/* DRAWER */}
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(460px, 95vw)",
        background: "var(--color-bg-base)",
        borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 401,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* HEADER */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--color-border-faint)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {t.prospects.newProspect}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {t.prospects.workspaceEmptyDesc}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-muted)",
              cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* FORM */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {error && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)",
              fontSize: "13px", fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.prospects.name} required>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Juan García" style={INPUT} />
            </Field>
            <Field label={t.prospects.company}>
              <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Empresa S.A." style={INPUT} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.prospects.email}>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="correo@empresa.com" style={INPUT} />
            </Field>
            <Field label={t.prospects.phone}>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+52 33 1234 5678" style={INPUT} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.prospects.estimatedValue}>
              <input type="number" value={form.estimated_value} onChange={(e) => set("estimated_value", e.target.value)} placeholder="50000" style={INPUT} />
            </Field>
            <Field label={t.prospects.leadSource}>
              <select value={form.lead_source} onChange={(e) => set("lead_source", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {SOURCES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t.prospects.interestedService}>
            <input value={form.interested_service} onChange={(e) => set("interested_service", e.target.value)} placeholder="Servicio de interés…" style={INPUT} />
          </Field>

          <Field label={t.prospects.notes}>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={t.prospects.notesPlaceholder}
              style={{
                ...INPUT, height: "auto",
                padding: "10px 12px",
                resize: "vertical",
              }}
            />
          </Field>
        </div>

        {/* FOOTER */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "flex", gap: "10px", flexShrink: 0,
        }}>
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              flex: 1, height: "40px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)",
              color: "#fff", border: "none",
              fontSize: "13px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "var(--shadow-brand-blue)",
            }}
          >
            {loading ? t.general.loading : t.prospects.newProspect}
          </button>
          <button
            onClick={onClose}
            style={{
              height: "40px", padding: "0 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-second)",
              fontSize: "13px", cursor: "pointer",
            }}
          >
            {t.general.cancel}
          </button>
        </div>
      </div>
    </>
  );
}
