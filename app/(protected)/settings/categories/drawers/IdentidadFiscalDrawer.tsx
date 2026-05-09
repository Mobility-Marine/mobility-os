"use client";

// ════════════════════════════════════════════════════════════════════════
// IDENTIDAD FISCAL DRAWER
// ════════════════════════════════════════════════════════════════════════
// RFC, razón social, régimen fiscal SAT y dirección de la empresa.
// Estos datos aparecen en CFDIs y documentos legales.
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingDrawer from "../../components/SettingDrawer";
import type { CompanySettings } from "../../hooks/useCompanySettings";
import { REGIMENES_FISCALES_SAT } from "@/lib/sat/regimenes-fiscales";

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
  margin:        "20px 0 10px",
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
  fiscal_name:    string;
  fiscal_rfc:     string;
  fiscal_regime:  string;
  fiscal_address: string;
  fiscal_city:    string;
  fiscal_state:   string;
  fiscal_zip:     string;
  fiscal_country: string;
};

const EMPTY_FORM: FormState = {
  fiscal_name:    "",
  fiscal_rfc:     "",
  fiscal_regime:  "",
  fiscal_address: "",
  fiscal_city:    "",
  fiscal_state:   "",
  fiscal_zip:     "",
  fiscal_country: "México",
};

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════
export default function IdentidadFiscalDrawer({ open, onClose, settings, saving, update }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open && settings) {
      setForm({
        fiscal_name:    settings.fiscal_name    ?? "",
        fiscal_rfc:     settings.fiscal_rfc     ?? "",
        fiscal_regime:  settings.fiscal_regime  ?? "",
        fiscal_address: settings.fiscal_address ?? "",
        fiscal_city:    settings.fiscal_city    ?? "",
        fiscal_state:   settings.fiscal_state   ?? "",
        fiscal_zip:     settings.fiscal_zip     ?? "",
        fiscal_country: settings.fiscal_country ?? "México",
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
      title="Identidad fiscal"
      description="Datos legales de tu empresa que aparecen en CFDIs y documentos."
      icon="🏛️"
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
        <label style={labelStyle}>Razón social</label>
        <input
          type="text"
          style={inputStyle}
          value={form.fiscal_name}
          onChange={(e) => setForm({ ...form, fiscal_name: e.target.value })}
          placeholder="Mobility Marine S.A. de C.V."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>RFC</label>
          <input
            type="text"
            style={inputStyle}
            value={form.fiscal_rfc}
            onChange={(e) => setForm({ ...form, fiscal_rfc: e.target.value.toUpperCase() })}
            placeholder="MMA210517V20"
            maxLength={13}
          />
        </div>
        <div>
          <label style={labelStyle}>Régimen fiscal</label>
          <select
            style={inputStyle}
            value={form.fiscal_regime}
            onChange={(e) => setForm({ ...form, fiscal_regime: e.target.value })}
          >
            <option value="">— Selecciona régimen —</option>
            <optgroup label="Personas Morales">
              {REGIMENES_FISCALES_SAT.filter((r) => r.aplica === "PM").map((r) => (
                <option key={r.clave} value={r.clave}>{r.clave} — {r.descripcion}</option>
              ))}
            </optgroup>
            <optgroup label="Personas Físicas">
              {REGIMENES_FISCALES_SAT.filter((r) => r.aplica === "PF").map((r) => (
                <option key={r.clave} value={r.clave}>{r.clave} — {r.descripcion}</option>
              ))}
            </optgroup>
            <optgroup label="Personas Físicas y Morales">
              {REGIMENES_FISCALES_SAT.filter((r) => r.aplica === "AMBOS").map((r) => (
                <option key={r.clave} value={r.clave}>{r.clave} — {r.descripcion}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <h3 style={sectionTitleStyle}>Dirección fiscal</h3>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Calle y número</label>
        <input
          type="text"
          style={inputStyle}
          value={form.fiscal_address}
          onChange={(e) => setForm({ ...form, fiscal_address: e.target.value })}
          placeholder="Av. de las Industrias 123"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Ciudad</label>
          <input
            type="text"
            style={inputStyle}
            value={form.fiscal_city}
            onChange={(e) => setForm({ ...form, fiscal_city: e.target.value })}
            placeholder="Aguascalientes"
          />
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <input
            type="text"
            style={inputStyle}
            value={form.fiscal_state}
            onChange={(e) => setForm({ ...form, fiscal_state: e.target.value })}
            placeholder="Aguascalientes"
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={labelStyle}>Código postal</label>
          <input
            type="text"
            style={inputStyle}
            value={form.fiscal_zip}
            onChange={(e) => setForm({ ...form, fiscal_zip: e.target.value })}
            placeholder="20290"
            maxLength={5}
          />
        </div>
        <div>
          <label style={labelStyle}>País</label>
          <input
            type="text"
            style={inputStyle}
            value={form.fiscal_country}
            onChange={(e) => setForm({ ...form, fiscal_country: e.target.value })}
          />
        </div>
      </div>
    </SettingDrawer>
  );
}