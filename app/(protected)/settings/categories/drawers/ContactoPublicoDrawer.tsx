"use client";

// ════════════════════════════════════════════════════════════════════════
// CONTACTO PÚBLICO DRAWER
// ════════════════════════════════════════════════════════════════════════
// Teléfono, correo y sitio web que aparecen en cotizaciones, facturas
// y emails enviados a clientes.
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
  fiscal_phone:   string;
  fiscal_email:   string;
  fiscal_website: string;
};

const EMPTY_FORM: FormState = {
  fiscal_phone:   "",
  fiscal_email:   "",
  fiscal_website: "",
};

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════
export default function ContactoPublicoDrawer({ open, onClose, settings, saving, update }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open && settings) {
      setForm({
        fiscal_phone:   settings.fiscal_phone   ?? "",
        fiscal_email:   settings.fiscal_email   ?? "",
        fiscal_website: settings.fiscal_website ?? "",
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
      title="Contacto público"
      description="Estos datos aparecen en cotizaciones, facturas y emails enviados."
      icon="📞"
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
        <label style={labelStyle}>Teléfono</label>
        <input
          type="tel"
          style={inputStyle}
          value={form.fiscal_phone}
          onChange={(e) => setForm({ ...form, fiscal_phone: e.target.value })}
          placeholder="+52 449 123 4567"
        />
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Correo electrónico</label>
        <input
          type="email"
          style={inputStyle}
          value={form.fiscal_email}
          onChange={(e) => setForm({ ...form, fiscal_email: e.target.value })}
          placeholder="contacto@mobility-marine.com"
        />
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Sitio web</label>
        <input
          type="url"
          style={inputStyle}
          value={form.fiscal_website}
          onChange={(e) => setForm({ ...form, fiscal_website: e.target.value })}
          placeholder="https://mobility-marine.com"
        />
      </div>
    </SettingDrawer>
  );
}