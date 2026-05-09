"use client";

// ════════════════════════════════════════════════════════════════════════
// PLANTILLAS DE DOCUMENTOS DRAWER
// ════════════════════════════════════════════════════════════════════════
// Selección de plantillas PDF para cotizaciones (productos y servicios)
// y footer global que aparece en todos los documentos comerciales.
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingDrawer from "../../components/SettingDrawer";
import type { CompanySettings } from "../../hooks/useCompanySettings";

// ── Estilos compartidos ─────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display:       "block",
  fontSize:      "12px",
  fontWeight:    600,
  color:         "var(--fg-muted, #64748b)",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  marginBottom:  "6px",
};

const inputStyle: React.CSSProperties = {
  width:         "100%",
  padding:       "10px 12px",
  fontSize:      "14px",
  borderRadius:  "8px",
  border:        "1px solid var(--border, rgba(148,163,184,0.30))",
  background:    "var(--bg-input, #ffffff)",
  color:         "var(--fg, #0f172a)",
  fontFamily:    "inherit",
  outline:       "none",
  transition:    "border-color 120ms",
};

const fieldGroupStyle: React.CSSProperties = { marginBottom: "16px" };

const btnPrimary: React.CSSProperties = {
  padding:      "9px 18px",
  fontSize:     "13px",
  fontWeight:   600,
  borderRadius: "8px",
  border:       "none",
  background:   "var(--accent, #2563eb)",
  color:        "#ffffff",
  cursor:       "pointer",
  transition:   "opacity 120ms",
};

const btnSecondary: React.CSSProperties = {
  padding:      "9px 16px",
  fontSize:     "13px",
  fontWeight:   500,
  borderRadius: "8px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "transparent",
  color:        "var(--fg, #0f172a)",
  cursor:       "pointer",
};

// ── Tipos ───────────────────────────────────────────────────────────────
type Props = {
  open:     boolean;
  onClose:  () => void;
  settings: CompanySettings | null;
  saving:   boolean;
  update:   (partial: Partial<CompanySettings>) => Promise<boolean>;
};

type FormState = {
  template_products: string;
  template_services: string;
  quote_footer:      string;
};

const EMPTY_FORM: FormState = {
  template_products: "elegante",
  template_services: "elegante",
  quote_footer:      "",
};

// Por ahora solo existe la plantilla "elegante" (Mobility OS)
const TEMPLATES = [{ value: "elegante", label: "Mobility OS (default)" }];

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════
export default function PlantillasDrawer({ open, onClose, settings, saving, update }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open && settings) {
      setForm({
        template_products: settings.template_products ?? "elegante",
        template_services: settings.template_services ?? "elegante",
        quote_footer:      settings.quote_footer      ?? "",
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open}
      onClose={onClose}
      title="Plantillas de documentos"
      description="Diseño de cotizaciones (productos y servicios) y footer global."
      icon="📋"
      size="md"
      saving={saving}
      footer={
        <>
          <button onClick={onClose} disabled={saving} style={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </>
      }
    >
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Plantilla para cotizaciones de servicios</label>
        <select
          style={inputStyle}
          value={form.template_services}
          onChange={(e) => setForm({ ...form, template_services: e.target.value })}
        >
          {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Plantilla para cotizaciones de productos</label>
        <select
          style={inputStyle}
          value={form.template_products}
          onChange={(e) => setForm({ ...form, template_products: e.target.value })}
        >
          {TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Footer global de cotizaciones</label>
        <textarea
          rows={4}
          style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          value={form.quote_footer}
          onChange={(e) => setForm({ ...form, quote_footer: e.target.value })}
          placeholder="Texto que aparece al pie de cada cotización en PDF (datos bancarios, agradecimiento, etc.)."
        />
        <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--fg-muted)" }}>
          Aparece en la última página del PDF, debajo de los términos y condiciones.
        </div>
      </div>
    </SettingDrawer>
  );
}