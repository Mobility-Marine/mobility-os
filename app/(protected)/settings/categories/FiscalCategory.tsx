"use client";

// ════════════════════════════════════════════════════════════════════════
// FISCAL Y CFDI — Categoría con 3 cards de compliance fiscal
// ════════════════════════════════════════════════════════════════════════
// 3 cards:
//   1) Series CFDI — A (Ingreso), E (Egreso), P (Pago), T (Traslado),
//                    N (Nómina), NR (Nota de remisión)
//   2) Sellos digitales — certificado .cer, llave .key (gestionados en
//      Facturapi). En la UI mostramos solo el estado.
//   3) Facturapi (PAC) — API key, organización y entorno (test/live)
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingCard            from "../components/SettingCard";
import SettingDrawer          from "../components/SettingDrawer";
import { useCompanySettings } from "../hooks/useCompanySettings";

type DrawerKey = null | "series" | "sellos" | "facturapi";

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════

export default function FiscalCategory() {
  const { settings, loading, saving, update } = useCompanySettings();
  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando configuración…
      </div>
    );
  }

  // Preview "A-12 · E-3 · P-7" para la card de series
  const seriesPreview = [
    `${settings?.invoice_series  ?? "A"}-${settings?.invoice_next_folio  ?? 1}`,
    `${settings?.egreso_series   ?? "E"}-${settings?.egreso_next_folio   ?? 1}`,
    `${settings?.pago_series     ?? "P"}-${settings?.pago_next_folio     ?? 1}`,
  ].join(" · ");

  const sellosStatus  = settings?.cer_file_url && settings?.key_file_url
    ? "Configurados"
    : "Pendientes de cargar";

  // El sistema soporta 2 modos de configuración del PAC:
  //   1) Por empresa (BD): cada tenant define sus propias credenciales
  //   2) A nivel sistema (.env): credenciales globales en variables de entorno
  // Si no hay credenciales en BD, asumimos modo "sistema" → mostramos "Configurado".
  const facturapiStatus = settings?.facturapi_api_key
    ? (settings?.facturapi_env === "live" ? "🟢 Producción (BD)" : "🧪 Pruebas (BD)")
    : "🟢 Gestionado por sistema";

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
          icon="🧾"
          title="Series CFDI"
          description="Series y folios consecutivos para Ingreso, Egreso, Pago, Traslado, Nómina y Nota."
          preview={seriesPreview}
          previewLabel="PRÓXIMOS FOLIOS"
          onClick={() => setOpenDrawer("series")}
        />
        <SettingCard
          icon="🔐"
          title="Sellos digitales"
          description="Certificado (.cer) y llave privada (.key) emitidos por el SAT."
          preview={sellosStatus}
          previewLabel="ESTADO"
          onClick={() => setOpenDrawer("sellos")}
        />
        <SettingCard
          icon="🏛️"
          title="Configuración PAC (Facturapi)"
          description="API key, organización y entorno del proveedor autorizado de timbrado."
          preview={facturapiStatus}
          previewLabel="ESTADO"
          onClick={() => setOpenDrawer("facturapi")}
        />
      </div>

      {/* Drawers */}
      <SeriesCFDIDrawer
        open={openDrawer === "series"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
        saving={saving}
        update={update}
      />
      <SellosDigitalesDrawer
        open={openDrawer === "sellos"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
      />
      <FacturapiDrawer
        open={openDrawer === "facturapi"}
        onClose={() => setOpenDrawer(null)}
        settings={settings}
        saving={saving}
        update={update}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DRAWERS
// ════════════════════════════════════════════════════════════════════════

type DrawerSubProps = {
  open:     boolean;
  onClose:  () => void;
  settings: ReturnType<typeof useCompanySettings>["settings"];
  saving:   boolean;
  update:   ReturnType<typeof useCompanySettings>["update"];
};

// ────────────────────────────────────────────────────────────────────────
// 1) Series CFDI
// ────────────────────────────────────────────────────────────────────────
function SeriesCFDIDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    invoice_series:    "A",  invoice_next_folio:    1,
    egreso_series:     "E",  egreso_next_folio:     1,
    pago_series:       "P",  pago_next_folio:       1,
    traslado_series:   "T",  traslado_next_folio:   1,
    nomina_series:     "N",  nomina_next_folio:     1,
    note_series:       "NR", note_next_folio:       1,
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        invoice_series:    settings.invoice_series    ?? "A",
        invoice_next_folio:settings.invoice_next_folio ?? 1,
        egreso_series:     settings.egreso_series     ?? "E",
        egreso_next_folio: settings.egreso_next_folio ?? 1,
        pago_series:       settings.pago_series       ?? "P",
        pago_next_folio:   settings.pago_next_folio   ?? 1,
        traslado_series:   settings.traslado_series   ?? "T",
        traslado_next_folio: settings.traslado_next_folio ?? 1,
        nomina_series:     settings.nomina_series     ?? "N",
        nomina_next_folio: settings.nomina_next_folio ?? 1,
        note_series:       settings.note_series       ?? "NR",
        note_next_folio:   settings.note_next_folio   ?? 1,
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  const SERIES_DEFS = [
    { key: "invoice",  label: "Ingreso (Factura)",      color: "#10b981", description: "CFDI tipo I — venta de productos o servicios." },
    { key: "egreso",   label: "Egreso (Nota crédito)",  color: "#f59e0b", description: "CFDI tipo E — devoluciones, descuentos, bonificaciones." },
    { key: "pago",     label: "Pago (REP)",             color: "#3b82f6", description: "CFDI tipo P — recibo electrónico de pago para PPD." },
    { key: "traslado", label: "Traslado",               color: "#8b5cf6", description: "CFDI tipo T — movimiento de mercancía sin transferencia de propiedad." },
    { key: "nomina",   label: "Nómina",                 color: "#ec4899", description: "CFDI tipo N — recibos de nómina a empleados." },
    { key: "note",     label: "Nota de remisión",       color: "#64748b", description: "Documento interno para entregas (no es CFDI)." },
  ] as const;

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Series CFDI"
      description="Series y próximos folios consecutivos por tipo de comprobante."
      icon="🧾" size="lg" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <div style={{ marginBottom: "20px", padding: "12px 14px", borderRadius: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.20)" }}>
        <div style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.5 }}>
          <strong>⚠️ Atención:</strong> modificar series o folios afecta directamente al timbrado de CFDIs en el SAT.
          Cambia estos valores solo si sabes lo que estás haciendo. Cada CFDI debe tener un folio único por serie.
        </div>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {SERIES_DEFS.map(({ key, label, color, description }) => (
          <div
            key={key}
            style={{
              padding:      "14px 16px",
              borderRadius: "10px",
              border:       "1px solid var(--border-subtle, rgba(148,163,184,0.20))",
              background:   "var(--surface, #ffffff)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--fg, #0f172a)" }}>
                {label}
              </h4>
            </div>
            <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "10px" }}>
              {description}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>Serie</label>
                <input
                  type="text" maxLength={4}
                  style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", textAlign: "center" }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={(form as any)[`${key}_series`] ?? ""}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setForm({ ...form, [`${key}_series`]: e.target.value.toUpperCase() } as any)}
                />
              </div>
              <div>
                <label style={labelStyle}>Próximo folio</label>
                <input
                  type="number" min={1}
                  style={inputStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={(form as any)[`${key}_next_folio`] ?? 1}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setForm({ ...form, [`${key}_next_folio`]: Number(e.target.value) || 1 } as any)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 2) Sellos digitales (read-only, gestionados en Facturapi)
// ────────────────────────────────────────────────────────────────────────
function SellosDigitalesDrawer({
  open, onClose, settings,
}: {
  open: boolean;
  onClose: () => void;
  settings: ReturnType<typeof useCompanySettings>["settings"];
}) {
  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Sellos digitales"
      description="Certificado de Sello Digital (CSD) emitido por el SAT."
      icon="🔐" size="md"
    >
      <div style={{ marginBottom: "20px", padding: "12px 14px", borderRadius: "10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.20)" }}>
        <div style={{ fontSize: "12px", color: "#1e40af", lineHeight: 1.5 }}>
          <strong>ℹ️ Importante:</strong> los certificados (.cer y .key) y la contraseña se cargan
          directamente en <strong>Facturapi</strong> (tu PAC), no en Mobility OS. Esto es por
          seguridad: las llaves privadas nunca pasan por nuestros servidores.
        </div>
      </div>

      <Section title="Estado del certificado">
        <StatusRow
          label="Certificado (.cer)"
          ok={!!settings?.cer_file_url}
          okText="Cargado en Facturapi"
          missingText="No cargado"
        />
        <StatusRow
          label="Llave privada (.key)"
          ok={!!settings?.key_file_url}
          okText="Cargada en Facturapi"
          missingText="No cargada"
        />
      </Section>

      <Section title="¿Cómo cargar mis sellos?">
        <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--fg-muted)", lineHeight: 1.7 }}>
          <li>Inicia sesión en tu cuenta de Facturapi: <a href="https://app.facturapi.io" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>app.facturapi.io</a>.</li>
          <li>En tu organización, ve a <strong>Configuración → Certificados</strong>.</li>
          <li>Sube el archivo <code>.cer</code>, el <code>.key</code> y escribe la contraseña del certificado.</li>
          <li>Facturapi validará el certificado contra el SAT.</li>
          <li>Una vez validado, podrás emitir CFDIs desde Mobility OS sin pasos adicionales.</li>
        </ol>
      </Section>
    </SettingDrawer>
  );
}

function StatusRow({ label, ok, okText, missingText }: { label: string; ok: boolean; okText: string; missingText: string }) {
  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        padding:      "10px 14px",
        borderRadius: "8px",
        border:       "1px solid var(--border-subtle, rgba(148,163,184,0.20))",
        background:   "var(--surface, #ffffff)",
        marginBottom: "8px",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--fg, #0f172a)" }}>{label}</span>
      <span
        style={{
          padding:      "3px 10px",
          borderRadius: "999px",
          fontSize:     "11px",
          fontWeight:   600,
          background:   ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.10)",
          color:        ok ? "#047857" : "#b91c1c",
        }}
      >
        {ok ? `✓ ${okText}` : `✗ ${missingText}`}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 3) Configuración Facturapi (PAC)
// ────────────────────────────────────────────────────────────────────────
function FacturapiDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    facturapi_api_key: "",
    facturapi_org_id:  "",
    facturapi_env:     "test",
    pac_provider:      "facturapi",
    invoice_series:    "A",  // necesario aquí para algunos flujos
  });
  const [overrideMode, setOverrideMode] = useState(false);

  useEffect(() => {
    if (open && settings) {
      setForm({
        facturapi_api_key: settings.facturapi_api_key ?? "",
        facturapi_org_id:  settings.facturapi_org_id  ?? "",
        facturapi_env:     settings.facturapi_env     ?? "test",
        pac_provider:      settings.pac_provider      ?? "facturapi",
        invoice_series:    settings.invoice_series    ?? "A",
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    // Solo guardamos los campos relevantes a Facturapi
    const ok = await update({
      facturapi_api_key: form.facturapi_api_key,
      facturapi_org_id:  form.facturapi_org_id,
      facturapi_env:     form.facturapi_env,
      pac_provider:      form.pac_provider,
    });
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Configuración PAC (Facturapi)"
      description="Credenciales del Proveedor Autorizado de Certificación."
      icon="🏛️" size="md" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <div style={{ marginBottom: "20px", padding: "12px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div style={{ fontSize: "12px", color: "#991b1b", lineHeight: 1.5 }}>
          <strong>🔒 Información sensible:</strong> el API Key da acceso completo a tu cuenta Facturapi.
          Nunca lo compartas y rótalo si sospechas que fue expuesto.
        </div>
      </div>

      {/* Banner informativo: configuración a nivel sistema */}
      {!settings?.facturapi_api_key && !overrideMode && (
        <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "10px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#047857", marginBottom: "6px" }}>
            🟢 PAC configurado a nivel sistema
          </div>
          <div style={{ fontSize: "12px", color: "var(--fg-muted)", lineHeight: 1.5 }}>
            Las credenciales de Facturapi están en variables de entorno del servidor (Vercel),
            que es lo correcto para una sola empresa. Tus CFDIs se timbran usando esa configuración global.
          </div>
          <div style={{ fontSize: "12px", color: "var(--fg-muted)", lineHeight: 1.5, marginTop: "10px" }}>
            <strong>¿Cuándo configurar credenciales por empresa?</strong> Cuando tengas múltiples empresas
            (multi-tenant) y cada una necesite su propia cuenta de Facturapi.
          </div>
          <button
            type="button"
            onClick={() => setOverrideMode(true)}
            style={{
              marginTop: "12px",
              padding:    "6px 12px",
              fontSize:   "12px",
              fontWeight: 500,
              borderRadius: "6px",
              border:     "1px solid var(--border, rgba(148,163,184,0.30))",
              background: "transparent",
              color:      "var(--fg, #0f172a)",
              cursor:     "pointer",
            }}
          >
            Configurar credenciales específicas para esta empresa
          </button>
        </div>
      )}

      {/* Banner sensible: solo cuando el usuario eligió override */}
      {(settings?.facturapi_api_key || overrideMode) && (
        <div style={{ marginBottom: "20px", padding: "12px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ fontSize: "12px", color: "#991b1b", lineHeight: 1.5 }}>
            <strong>🔒 Información sensible:</strong> el API Key da acceso completo a tu cuenta Facturapi.
            Nunca lo compartas y rótalo si sospechas que fue expuesto.
          </div>
        </div>
      )}

      {/* Solo mostrar formulario editable si hay credenciales en BD o el usuario eligió override */}
      {!(settings?.facturapi_api_key || overrideMode) ? null : (
      <>
      <Section title="Entorno">
        <label style={labelStyle}>Modo de operación</label>
        <select
          style={inputStyle}
          value={form.facturapi_env}
          onChange={(e) => setForm({ ...form, facturapi_env: e.target.value })}
        >
          <option value="test">🧪 Pruebas (test) — los CFDIs no son válidos ante el SAT</option>
          <option value="live">🟢 Producción (live) — los CFDIs son fiscalmente válidos</option>
        </select>
        <Hint>
          <strong>Recomendación:</strong> empieza en pruebas, valida tus flujos completos, y solo cuando todo
          funcione cambia a producción.
        </Hint>
      </Section>

      <Section title="Credenciales">
        <label style={labelStyle}>API Key (secreto)</label>
        <input
          type="password"
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
          value={form.facturapi_api_key}
          onChange={(e) => setForm({ ...form, facturapi_api_key: e.target.value })}
          placeholder="sk_test_…  o  sk_live_…"
          autoComplete="off"
        />
        <Hint>
          Lo encuentras en <a href="https://app.facturapi.io" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>app.facturapi.io</a>
          {" → "}Configuración → API Keys. Usa la llave secreta correspondiente al entorno seleccionado.
        </Hint>

        <div style={{ height: 14 }} />

        <label style={labelStyle}>Organization ID</label>
        <input
          type="text"
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
          value={form.facturapi_org_id}
          onChange={(e) => setForm({ ...form, facturapi_org_id: e.target.value })}
          placeholder="org_…"
        />
        <Hint>Identificador único de tu organización en Facturapi.</Hint>
      </Section>
      </>
      )}
    </SettingDrawer>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h3 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-muted)", margin: "0 0 12px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--fg-muted, #64748b)", lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function DrawerFooter({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <>
      <button onClick={onCancel} disabled={saving} style={btnSecondary}>Cancelar</button>
      <button onClick={onSave}   disabled={saving} style={btnPrimary}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </>
  );
}

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
  width:        "100%",
  padding:      "10px 12px",
  fontSize:     "14px",
  borderRadius: "8px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "var(--bg-input, #ffffff)",
  color:        "var(--fg, #0f172a)",
  fontFamily:   "inherit",
  outline:      "none",
};

const btnPrimary = {
  padding:      "9px 18px",
  fontSize:     "13px",
  fontWeight:   600,
  borderRadius: "8px",
  border:       "none",
  background:   "var(--accent, #2563eb)",
  color:        "#ffffff",
  cursor:       "pointer",
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