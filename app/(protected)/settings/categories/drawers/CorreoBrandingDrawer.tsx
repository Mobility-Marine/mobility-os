"use client";

// ════════════════════════════════════════════════════════════════════════
// CORREO BRANDING DRAWER
// ════════════════════════════════════════════════════════════════════════
// Configura los campos que aparecen en correos transaccionales:
//   - Redes sociales (Facebook, LinkedIn, Instagram, Twitter/X)
//   - Banner promocional (badge sobre la firma)
//   - Disclaimer legal (ES / EN) que aparece al pie del correo
//
// Patrón: drawer modular separado de EmpresaCategory para mantener
// archivos chicos. Pendiente refactor de los otros 4 drawers de
// EmpresaCategory hacia esta carpeta `drawers/`.
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingDrawer from "../../components/SettingDrawer";
import type { CompanySettings } from "../../hooks/useCompanySettings";

// ── Estilos compartidos (consistentes con EmpresaCategory) ─────────────
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

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "70px",
  resize:    "vertical",
  fontFamily:"inherit",
  lineHeight: 1.5,
};

const fieldGroupStyle: React.CSSProperties = { marginBottom: "16px" };

const sectionTitleStyle: React.CSSProperties = {
  fontSize:      "11px",
  fontWeight:    700,
  color:         "var(--fg-muted, #64748b)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin:        "8px 0 14px 0",
  paddingBottom: "6px",
  borderBottom:  "1px solid var(--border, rgba(148,163,184,0.20))",
};

const helperStyle: React.CSSProperties = {
  fontSize:  "11px",
  color:     "var(--fg-muted, #94a3b8)",
  marginTop: "4px",
  lineHeight: 1.4,
};

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

// ── Form state ──────────────────────────────────────────────────────────
type FormState = {
  social_facebook_url:      string;
  social_linkedin_url:      string;
  social_instagram_url:     string;
  social_twitter_url:       string;
  email_promo_banner_text:  string;
  email_disclaimer_es:      string;
  email_disclaimer_en:      string;
};

const EMPTY_FORM: FormState = {
  social_facebook_url:     "",
  social_linkedin_url:     "",
  social_instagram_url:    "",
  social_twitter_url:      "",
  email_promo_banner_text: "",
  email_disclaimer_es:     "",
  email_disclaimer_en:     "",
};

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════
export default function CorreoBrandingDrawer({ open, onClose, settings, saving, update }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open && settings) {
      setForm({
        social_facebook_url:     settings.social_facebook_url     ?? "",
        social_linkedin_url:     settings.social_linkedin_url     ?? "",
        social_instagram_url:    settings.social_instagram_url    ?? "",
        social_twitter_url:      settings.social_twitter_url      ?? "",
        email_promo_banner_text: settings.email_promo_banner_text ?? "",
        email_disclaimer_es:     settings.email_disclaimer_es     ?? "",
        email_disclaimer_en:     settings.email_disclaimer_en     ?? "",
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    // Normalizar: trim + null si vacío (BD limpia)
    const payload: Partial<CompanySettings> = {
      social_facebook_url:     form.social_facebook_url.trim()     || null,
      social_linkedin_url:     form.social_linkedin_url.trim()     || null,
      social_instagram_url:    form.social_instagram_url.trim()    || null,
      social_twitter_url:      form.social_twitter_url.trim()      || null,
      email_promo_banner_text: form.email_promo_banner_text.trim() || null,
      email_disclaimer_es:     form.email_disclaimer_es.trim()     || null,
      email_disclaimer_en:     form.email_disclaimer_en.trim()     || null,
    };
    const ok = await update(payload);
    if (ok) onClose();
  };

  const update_ = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <SettingDrawer
      open={open}
      onClose={onClose}
      title="Branding del correo"
      description="Redes sociales, banner promocional y disclaimer legal que aparecen en correos transaccionales (cotizaciones, facturas, etc.)."
      icon="✉️"
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
      {/* ─── Redes sociales ───────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Redes sociales — firma del correo</div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Facebook (URL)</label>
        <input
          type="url"
          style={inputStyle}
          value={form.social_facebook_url}
          onChange={(e) => update_("social_facebook_url", e.target.value)}
          placeholder="https://facebook.com/empresa"
        />
        <div style={helperStyle}>Si se deja en blanco, no aparecerá el ícono.</div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>LinkedIn (URL)</label>
        <input
          type="url"
          style={inputStyle}
          value={form.social_linkedin_url}
          onChange={(e) => update_("social_linkedin_url", e.target.value)}
          placeholder="https://linkedin.com/company/empresa"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Instagram (URL)</label>
        <input
          type="url"
          style={inputStyle}
          value={form.social_instagram_url}
          onChange={(e) => update_("social_instagram_url", e.target.value)}
          placeholder="https://instagram.com/empresa"
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Twitter / X (URL)</label>
        <input
          type="url"
          style={inputStyle}
          value={form.social_twitter_url}
          onChange={(e) => update_("social_twitter_url", e.target.value)}
          placeholder="https://twitter.com/empresa"
        />
      </div>

      {/* ─── Banner promocional ───────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Banner promocional</div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Texto del banner</label>
        <input
          type="text"
          style={inputStyle}
          value={form.email_promo_banner_text}
          onChange={(e) => update_("email_promo_banner_text", e.target.value)}
          placeholder="ej: 25 años conectando comercio internacional"
          maxLength={80}
        />
        <div style={helperStyle}>
          Aparece como un badge encima de la firma en correos. Máx. 80 caracteres.
          Si se deja en blanco, no se mostrará.
        </div>
      </div>

      {/* ─── Disclaimer legal ─────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Disclaimer legal — pie del correo</div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Texto en español</label>
        <textarea
          style={textareaStyle}
          value={form.email_disclaimer_es}
          onChange={(e) => update_("email_disclaimer_es", e.target.value)}
          placeholder="ej: Este correo y sus archivos adjuntos son confidenciales..."
          rows={3}
        />
        <div style={helperStyle}>
          Si se deja en blanco, se usará un disclaimer genérico por default.
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Texto en inglés</label>
        <textarea
          style={textareaStyle}
          value={form.email_disclaimer_en}
          onChange={(e) => update_("email_disclaimer_en", e.target.value)}
          placeholder="ej: This email and any attachments are confidential..."
          rows={3}
        />
      </div>
    </SettingDrawer>
  );
}