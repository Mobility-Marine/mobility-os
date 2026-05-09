"use client";

// ════════════════════════════════════════════════════════════════════════
// MARCA & BRANDING DRAWER
// ════════════════════════════════════════════════════════════════════════
// Logo + paleta de colores que se aplica en PDFs, app y emails.
// Contiene 2 sub-componentes locales: LogoUploader y ColorPickerRow.
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingDrawer from "../../components/SettingDrawer";
import type { CompanySettings } from "../../hooks/useCompanySettings";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

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

const sectionTitleStyle: React.CSSProperties = {
  fontSize:      "13px",
  fontWeight:    600,
  color:         "var(--fg-muted, #64748b)",
  margin:        "24px 0 10px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
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

type FormState = {
  logo_url:         string;
  brand_color:      string;
  brand_color_dark: string;
  brand_accent:     string;
};

const EMPTY_FORM: FormState = {
  logo_url:         "",
  brand_color:      "#1d4ed8",
  brand_color_dark: "#0a1628",
  brand_accent:     "#c9a227",
};

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════
export default function MarcaBrandingDrawer({ open, onClose, settings, saving, update }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open && settings) {
      setForm({
        logo_url:         settings.logo_url         ?? "",
        brand_color:      settings.brand_color      ?? "#1d4ed8",
        brand_color_dark: settings.brand_color_dark ?? "#0a1628",
        brand_accent:     settings.brand_accent     ?? "#c9a227",
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
      title="Marca y branding"
      description="Logo y paleta de colores. Se aplican a PDFs, app y emails."
      icon="🎨"
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
        <label style={labelStyle}>Logo de la empresa</label>
        <LogoUploader
          currentUrl={form.logo_url}
          onChange={(url) => setForm({ ...form, logo_url: url })}
        />
      </div>

      <h3 style={sectionTitleStyle}>Paleta de colores</h3>

      <ColorPickerRow
        label="Color principal (encabezados)"
        value={form.brand_color_dark}
        onChange={(v) => setForm({ ...form, brand_color_dark: v })}
        hint="Header de PDFs, sidebar, botones primarios."
      />
      <ColorPickerRow
        label="Color secundario (tablas y totales)"
        value={form.brand_color}
        onChange={(v) => setForm({ ...form, brand_color: v })}
        hint="Tablas, totales, footer de cotizaciones."
      />
      <ColorPickerRow
        label="Color de acento"
        value={form.brand_accent}
        onChange={(v) => setForm({ ...form, brand_accent: v })}
        hint="Detalles, badges, highlights."
      />
    </SettingDrawer>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE — ColorPickerRow
// ════════════════════════════════════════════════════════════════════════
function ColorPickerRow({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width:        "44px",
            height:       "44px",
            border:       "1px solid var(--border, rgba(148,163,184,0.30))",
            borderRadius: "8px",
            cursor:       "pointer",
            background:   "transparent",
            padding:      "2px",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", maxWidth: "140px" }}
          placeholder="#000000"
        />
      </div>
      {hint && (
        <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--fg-muted)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE — LogoUploader
// Sube imagen al bucket company-assets de Supabase Storage
// Estructura: company-assets/{companyId}/logo-{timestamp}.{ext}
// El timestamp evita problemas de cache cuando se reemplaza el logo.
// ════════════════════════════════════════════════════════════════════════
function LogoUploader({
  currentUrl,
  onChange,
}: {
  currentUrl: string;
  onChange: (url: string) => void;
}) {
  const { companyId } = useTenant();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!companyId) {
      setError("No se detectó empresa activa.");
      return;
    }
    if (!/^image\/(png|jpe?g|svg\+xml|webp)$/i.test(file.type)) {
      setError("Formato no soportado. Usa PNG, JPG, SVG o WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo no puede pesar más de 2 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${companyId}/logo-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("company-assets")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((e as any)?.message ?? "Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Preview actual */}
      {currentUrl && (
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "20px",
            marginBottom:   "12px",
            borderRadius:   "10px",
            background:     "var(--surface-soft, rgba(148,163,184,0.06))",
            border:         "1px dashed var(--border, rgba(148,163,184,0.30))",
            minHeight:      "100px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt="Logo actual"
            style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }}
          />
        </div>
      )}

      {/* Input file */}
      <label
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          gap:            "8px",
          padding:        "9px 16px",
          fontSize:       "13px",
          fontWeight:     500,
          borderRadius:   "8px",
          border:         "1px solid var(--border, rgba(148,163,184,0.30))",
          background:     "var(--surface, #ffffff)",
          color:          "var(--fg, #0f172a)",
          cursor:         uploading ? "wait" : "pointer",
          opacity:        uploading ? 0.6 : 1,
          transition:     "background 120ms",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploading ? "Subiendo…" : currentUrl ? "Reemplazar logo" : "Subir logo"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          style={{ display: "none" }}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {/* URL manual (opcional) */}
      <div style={{ marginTop: "12px" }}>
        <label style={{ ...labelStyle, fontSize: "11px" }}>URL del logo (opcional)</label>
        <input
          type="text"
          style={{ ...inputStyle, fontSize: "12px", fontFamily: "ui-monospace, monospace" }}
          value={currentUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      </div>

      {/* Errores */}
      {error && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Hint */}
      <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--fg-muted)", lineHeight: 1.5 }}>
        Formatos: PNG, JPG, SVG, WebP. Máximo 2 MB. Idealmente 400×100 px con fondo transparente.
      </div>
    </div>
  );
}