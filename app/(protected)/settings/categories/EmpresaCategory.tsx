"use client";

// ════════════════════════════════════════════════════════════════════════
// EMPRESA — Categoría de Settings con datos del tenant (organización)
// ════════════════════════════════════════════════════════════════════════
// 4 cards:
//   1) Identidad fiscal — RFC, razón social, régimen, dirección
//   2) Marca y branding — colores, logo
//   3) Contacto público — teléfono, email, web (aparece en cotizaciones)
//   4) Plantillas de documentos — selección de templates PDF + footer
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingCard           from "../components/SettingCard";
import SettingDrawer         from "../components/SettingDrawer";
import { useCompanySettings } from "../hooks/useCompanySettings";

type DrawerKey = null | "identidad" | "marca" | "contacto" | "plantillas";

// ── Estilos compartidos ────────────────────────────────────────────────
const labelStyle = {
  display:       "block",
  fontSize:      "12px",
  fontWeight:    600,
  color:         "var(--fg-muted, #64748b)",
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
  marginBottom:  "6px",
};

const inputStyle = {
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

const fieldGroupStyle = { marginBottom: "16px" };

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════

export default function EmpresaCategory() {
  const { settings, loading, saving, update } = useCompanySettings();
  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando configuración…
      </div>
    );
  }

  return (
    <>
      {/* Grid de cards */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap:                 "16px",
        }}
      >
        <SettingCard
          icon="🏛️"
          title="Identidad fiscal"
          description="RFC, razón social, régimen y dirección fiscal de la empresa."
          preview={settings?.fiscal_rfc || "Sin configurar"}
          previewLabel="RFC"
          onClick={() => setOpenDrawer("identidad")}
        />
        <SettingCard
          icon="🎨"
          title="Marca y branding"
          description="Logo y colores que aparecen en cotizaciones, facturas y la app."
          preview={
            <ColorChips
              c1={settings?.brand_color_dark}
              c2={settings?.brand_color}
              c3={settings?.brand_accent}
            />
          }
          previewLabel="PALETA"
          onClick={() => setOpenDrawer("marca")}
        />
        <SettingCard
          icon="📞"
          title="Contacto público"
          description="Teléfono, correo y sitio web visibles en documentos comerciales."
          preview={settings?.fiscal_email || "Sin configurar"}
          previewLabel="EMAIL"
          onClick={() => setOpenDrawer("contacto")}
        />
        <SettingCard
          icon="📋"
          title="Plantillas de documentos"
          description="Diseño de cotizaciones para productos y servicios + footer global."
          preview={`${settings?.template_services ?? "elegante"} · ${settings?.template_products ?? "elegante"}`}
          previewLabel="PLANTILLAS ACTIVAS"
          onClick={() => setOpenDrawer("plantillas")}
        />
      </div>

      {/* Drawers */}
      <IdentidadFiscalDrawer
        open={openDrawer === "identidad"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
        saving={saving}
        update={update}
      />
      <MarcaBrandingDrawer
        open={openDrawer === "marca"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
        saving={saving}
        update={update}
      />
      <ContactoPublicoDrawer
        open={openDrawer === "contacto"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
        saving={saving}
        update={update}
      />
      <PlantillasDrawer
        open={openDrawer === "plantillas"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
        saving={saving}
        update={update}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES (drawers individuales)
// ════════════════════════════════════════════════════════════════════════

type DrawerSubProps = {
  open:     boolean;
  onClose:  () => void;
  settings: ReturnType<typeof useCompanySettings>["settings"];
  saving:   boolean;
  update:   ReturnType<typeof useCompanySettings>["update"];
};

// ── Color chips para preview de marca ─────────────────────────────────
function ColorChips({ c1, c2, c3 }: { c1?: string; c2?: string; c3?: string }) {
  const chip = (color?: string) => (
    <span
      style={{
        display:      "inline-block",
        width:        "16px",
        height:       "16px",
        borderRadius: "4px",
        background:   color || "#e2e8f0",
        border:       "1px solid rgba(0,0,0,0.08)",
      }}
    />
  );
  return (
    <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
      {chip(c1)}
      {chip(c2)}
      {chip(c3)}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 1) Identidad fiscal
// ────────────────────────────────────────────────────────────────────────
function IdentidadFiscalDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    fiscal_name:    "",
    fiscal_rfc:     "",
    fiscal_regime:  "",
    fiscal_address: "",
    fiscal_city:    "",
    fiscal_state:   "",
    fiscal_zip:     "",
    fiscal_country: "México",
  });

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
          <button onClick={onClose} disabled={saving} style={btnSecondary}>
            Cancelar
          </button>
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
          <input
            type="text"
            style={inputStyle}
            value={form.fiscal_regime}
            onChange={(e) => setForm({ ...form, fiscal_regime: e.target.value })}
            placeholder="601 - General Personas Morales"
          />
        </div>
      </div>

      <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-muted)", margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Dirección fiscal
      </h3>

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

// ────────────────────────────────────────────────────────────────────────
// 2) Marca y branding
// ────────────────────────────────────────────────────────────────────────
function MarcaBrandingDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    logo_url:         "",
    brand_color:      "#1d4ed8",
    brand_color_dark: "#0a1628",
    brand_accent:     "#c9a227",
  });

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
        <label style={labelStyle}>URL del logo</label>
        <input
          type="text"
          style={inputStyle}
          value={form.logo_url}
          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          placeholder="https://app.mobility-os.lat/logo.png"
        />
        <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--fg-muted)" }}>
          PNG o SVG, idealmente 400×100 px. La carga directa de archivo se habilitará próximamente.
        </div>
      </div>

      <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-muted)", margin: "24px 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Paleta de colores
      </h3>

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

// ────────────────────────────────────────────────────────────────────────
// 3) Contacto público
// ────────────────────────────────────────────────────────────────────────
function ContactoPublicoDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    fiscal_phone:   "",
    fiscal_email:   "",
    fiscal_website: "",
  });

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

// ────────────────────────────────────────────────────────────────────────
// 4) Plantillas de documentos
// ────────────────────────────────────────────────────────────────────────
function PlantillasDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    template_products: "elegante",
    template_services: "elegante",
    quote_footer:      "",
  });

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

  // Por ahora solo existe la plantilla "elegante" (Mobility OS)
  const TEMPLATES = [{ value: "elegante", label: "Mobility OS (default)" }];

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

// ════════════════════════════════════════════════════════════════════════
// Estilos de botones (compartidos)
// ════════════════════════════════════════════════════════════════════════
const btnPrimary = {
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

const btnSecondary = {
  padding:      "9px 16px",
  fontSize:     "13px",
  fontWeight:   500,
  borderRadius: "8px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "transparent",
  color:        "var(--fg, #0f172a)",
  cursor:       "pointer",
};