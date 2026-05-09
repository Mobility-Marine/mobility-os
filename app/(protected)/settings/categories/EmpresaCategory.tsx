"use client";

// ════════════════════════════════════════════════════════════════════════
// EMPRESA — Categoría de Settings (orquestador delgado)
// ════════════════════════════════════════════════════════════════════════
// 5 cards. Cada drawer vive en su propio archivo en `./drawers/`.
//   1) Identidad fiscal — RFC, razón social, régimen, dirección
//   2) Marca y branding — colores, logo
//   3) Contacto público — teléfono, email, web (aparece en cotizaciones)
//   4) Plantillas de documentos — selección de templates PDF + footer
//   5) Branding del correo — redes sociales, banner, disclaimer
//
// Antes (816 líneas): drawers inline + LogoUploader + ColorPickerRow
// Ahora (~140 líneas): solo orquesta cards + estado de drawer abierto.
// ════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import SettingCard               from "../components/SettingCard";
import { useCompanySettings }    from "../hooks/useCompanySettings";

import IdentidadFiscalDrawer     from "./drawers/IdentidadFiscalDrawer";
import MarcaBrandingDrawer       from "./drawers/MarcaBrandingDrawer";
import ContactoPublicoDrawer     from "./drawers/ContactoPublicoDrawer";
import PlantillasDrawer          from "./drawers/PlantillasDrawer";
import CorreoBrandingDrawer      from "./drawers/CorreoBrandingDrawer";

type DrawerKey = null | "identidad" | "marca" | "contacto" | "plantillas" | "correo";

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE
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

  // Preview de redes activas (resumen para card de correo)
  const redesActivas = [
    settings?.social_facebook_url  ? "FB" : null,
    settings?.social_linkedin_url  ? "IN" : null,
    settings?.social_instagram_url ? "IG" : null,
    settings?.social_twitter_url   ? "TW" : null,
  ].filter(Boolean).join(" · ") || "Sin configurar";

  const close = () => setOpenDrawer(null);

  return (
    <>
      {/* ─── Grid de cards ──────────────────────────────────────────── */}
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
        <SettingCard
          icon="✉️"
          title="Branding del correo"
          description="Redes sociales, banner promocional y disclaimer legal en correos transaccionales."
          preview={redesActivas}
          previewLabel="REDES ACTIVAS"
          onClick={() => setOpenDrawer("correo")}
        />
      </div>

      {/* ─── Drawers (cada uno en su archivo) ───────────────────────── */}
      <IdentidadFiscalDrawer
        open={openDrawer === "identidad"}
        onClose={close}
        settings={settings}
        saving={saving}
        update={update}
      />
      <MarcaBrandingDrawer
        open={openDrawer === "marca"}
        onClose={close}
        settings={settings}
        saving={saving}
        update={update}
      />
      <ContactoPublicoDrawer
        open={openDrawer === "contacto"}
        onClose={close}
        settings={settings}
        saving={saving}
        update={update}
      />
      <PlantillasDrawer
        open={openDrawer === "plantillas"}
        onClose={close}
        settings={settings}
        saving={saving}
        update={update}
      />
      <CorreoBrandingDrawer
        open={openDrawer === "correo"}
        onClose={close}
        settings={settings}
        saving={saving}
        update={update}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE — ColorChips (preview de paleta en card de marca)
// ════════════════════════════════════════════════════════════════════════
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