// ════════════════════════════════════════════════════════════════════════
// TabLogistics — Tab 9 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Solo se muestra si is_logistics_provider = true.
// Captura los 9 campos logísticos del partner:
//   - logistics_provider_type: transportista, agente_aduanal, naviera, etc.
//   - transport_modes:         array de modos (terrestre, marítimo, etc.)
//   - scac_code:               código SCAC para nav. internacional
//   - fleet_size:              tamaño de flota (transportistas)
//   - has_customs_broker_license + customs_broker_license: agentes aduanales
//   - default_incoterm:        Incoterm habitual
//   - coverage_routes:         rutas/territorios de cobertura
//   - services_offered:        servicios específicos ofrecidos
//
// Datos viven en business_partners (no requiere tabla nueva).
// Los cambios se persisten al guardar el partner (no inmediato).
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { Partner, Incoterm } from "../types";
import { INCOTERMS } from "../types";
import { Field, FIELD_INPUT, FIELD_SELECT, FIELD_TEXTAREA, SectionTitle } from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabLogisticsProps = {
  partner: Partial<Partner>;
  onPatch: (patch: Partial<Partner>) => void;
};

// ── Catálogos ─────────────────────────────────────────────────────────
const LOGISTICS_PROVIDER_TYPES: { code: string; label: string; emoji: string }[] = [
  { code: "transportista",     label: "Transportista terrestre",  emoji: "🚛" },
  { code: "agente_aduanal",    label: "Agente aduanal",            emoji: "🛂" },
  { code: "naviera",           label: "Naviera / Línea marítima",  emoji: "🚢" },
  { code: "aerolinea",         label: "Aerolínea de carga",        emoji: "✈️" },
  { code: "forwarder",         label: "Freight forwarder",         emoji: "📦" },
  { code: "courier",           label: "Courier / Mensajería",      emoji: "📮" },
  { code: "almacenadora",      label: "Almacenadora / Bodega",     emoji: "🏭" },
  { code: "ferroviaria",       label: "Ferroviaria",               emoji: "🚆" },
  { code: "operador_logistico", label: "Operador logístico (3PL)", emoji: "🏗️" },
  { code: "otro",              label: "Otro",                       emoji: "❓" },
];

const TRANSPORT_MODES: { code: string; label: string; emoji: string }[] = [
  { code: "terrestre",   label: "Terrestre",       emoji: "🚛" },
  { code: "maritimo",    label: "Marítimo",        emoji: "🚢" },
  { code: "aereo",       label: "Aéreo",           emoji: "✈️" },
  { code: "ferroviario", label: "Ferroviario",     emoji: "🚆" },
  { code: "multimodal",  label: "Multimodal",      emoji: "🔀" },
];

// ── Estilos ───────────────────────────────────────────────────────────
const SECTION_PANEL: CSSProperties = {
  padding:        "16px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  display:        "flex",
  flexDirection:  "column",
  gap:            "12px",
};

const MODE_GRID: CSSProperties = {
  display:             "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap:                 "8px",
};

const MODE_CHIP: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  alignItems:     "center",
  justifyContent: "center",
  gap:            "4px",
  padding:        "10px 8px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  cursor:         "pointer",
  fontSize:       "11px",
  fontWeight:     600,
  color:          "var(--color-text-muted)",
  outline:        "none",
  transition:     "all 0.15s",
  userSelect:     "none",
};

const MODE_CHIP_ACTIVE: CSSProperties = {
  ...MODE_CHIP,
  border:         "1px solid var(--color-brand-blue, #3b82f6)",
  background:     "rgba(59, 130, 246, 0.12)",
  color:          "var(--color-brand-blue, #3b82f6)",
};

const INFO_NOTICE: CSSProperties = {
  padding:       "10px 14px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid rgba(59, 130, 246, 0.25)",
  background:    "rgba(59, 130, 246, 0.08)",
  color:         "var(--color-text-primary)",
  fontSize:      "12px",
  lineHeight:    1.55,
  display:       "flex",
  alignItems:    "flex-start",
  gap:           "8px",
};

const NOT_APPLICABLE: CSSProperties = {
  padding:       "32px 20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "13px",
  lineHeight:    1.6,
};

// ── Componente ────────────────────────────────────────────────────────
export function TabLogistics({ partner, onPatch }: TabLogisticsProps) {
  // Si no es proveedor logístico, mostrar mensaje (este tab no debería
  // ser visible, pero por defensa)
  if (!partner.is_logistics_provider) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={NOT_APPLICABLE}>
          🚚 <strong>Este tab no aplica</strong>
          <br />
          Marca el rol <strong>Proveedor logístico</strong> en el tab Identidad
          para capturar datos logísticos específicos.
        </div>
      </div>
    );
  }

  const transportModes = partner.transport_modes ?? [];
  const providerType   = partner.logistics_provider_type ?? "";
  const isCustomsAgent =
    providerType === "agente_aduanal" || partner.has_customs_broker_license;

  function toggleMode(mode: string) {
    const set = new Set(transportModes);
    if (set.has(mode)) set.delete(mode);
    else set.add(mode);
    onPatch({ transport_modes: Array.from(set) });
  }

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Datos logísticos del proveedor</SectionTitle>

      <div style={INFO_NOTICE}>
        <span style={{ fontSize: "16px" }}>🚚</span>
        <div>
          Información específica del proveedor logístico. Usada por los módulos de
          embarques, tracking, transporte y comercio exterior para asignar correctamente
          servicios y rutas.
        </div>
      </div>

      {/* ─── Tipo de proveedor + INCOTERM default ─── */}
      <div style={SECTION_PANEL}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Clasificación
        </div>

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap:                 "12px",
          }}
        >
          <Field label="Tipo de proveedor logístico" required>
            <select
              value={providerType}
              onChange={(e) => onPatch({ logistics_provider_type: e.target.value })}
              style={FIELD_SELECT}
            >
              <option value="">— Selecciona tipo —</option>
              {LOGISTICS_PROVIDER_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Incoterm habitual" hint="Default sugerido para nuevos embarques.">
            <select
              value={partner.default_incoterm ?? ""}
              onChange={(e) => onPatch({ default_incoterm: (e.target.value || undefined) as Incoterm | undefined })}
              style={FIELD_SELECT}
            >
              <option value="">— Sin definir —</option>
              {INCOTERMS.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.code} — {i.description}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* ─── Modos de transporte (multi-select chips) ─── */}
      <div style={SECTION_PANEL}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Modos de transporte ofrecidos
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          Selecciona uno o más modos.
        </div>

        <div style={MODE_GRID}>
          {TRANSPORT_MODES.map((m) => {
            const active = transportModes.includes(m.code);
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => toggleMode(m.code)}
                style={active ? MODE_CHIP_ACTIVE : MODE_CHIP}
                aria-pressed={active}
              >
                <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Datos específicos según tipo ─── */}
      <div style={SECTION_PANEL}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Datos operativos
        </div>

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap:                 "12px",
          }}
        >
          <Field
            label="Código SCAC"
            hint="Standard Carrier Alpha Code (4 letras) — para naviera/aerolinea internacional."
          >
            <input
              type="text"
              value={partner.scac_code ?? ""}
              onChange={(e) =>
                onPatch({ scac_code: e.target.value.toUpperCase().slice(0, 4) })
              }
              placeholder="MAEU"
              maxLength={4}
              style={{ ...FIELD_INPUT, fontFamily: "monospace", letterSpacing: "1px" }}
            />
          </Field>

          <Field
            label="Tamaño de flota"
            hint="Solo para transportistas (unidades propias o operadas)."
          >
            <input
              type="number"
              min={0}
              value={partner.fleet_size ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : Number(e.target.value);
                onPatch({ fleet_size: v });
              }}
              placeholder="Ej. 25"
              style={FIELD_INPUT}
            />
          </Field>
        </div>
      </div>

      {/* ─── Agente aduanal ─── */}
      <div style={SECTION_PANEL}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Patente aduanal
        </div>

        <Field label="¿Es agente aduanal autorizado?">
          <label
            style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        "8px",
              height:     "36px",
              cursor:     "pointer",
              fontSize:   "13px",
              color:      "var(--color-text-primary)",
            }}
          >
            <input
              type="checkbox"
              checked={partner.has_customs_broker_license ?? false}
              onChange={(e) => onPatch({ has_customs_broker_license: e.target.checked })}
              style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-blue, #3b82f6)" }}
            />
            Tiene patente aduanal vigente
          </label>
        </Field>

        {isCustomsAgent && (
          <Field label="Número de patente aduanal" hint="Ej. 1234 (4 dígitos asignados por SAT).">
            <input
              type="text"
              value={partner.customs_broker_license ?? ""}
              onChange={(e) => onPatch({ customs_broker_license: e.target.value })}
              placeholder="Número de patente"
              style={{ ...FIELD_INPUT, fontFamily: "monospace" }}
            />
          </Field>
        )}
      </div>

      {/* ─── Cobertura geográfica + servicios ─── */}
      <div style={SECTION_PANEL}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Cobertura y servicios
        </div>

        <Field
          label="Cobertura geográfica / Rutas principales"
          hint="Estados, regiones, países, corredores comerciales atendidos."
        >
          <textarea
            value={partner.coverage_routes ?? ""}
            onChange={(e) => onPatch({ coverage_routes: e.target.value })}
            placeholder="Ej. Cobertura nacional con énfasis en corredor Bajío–Norte. Operación internacional MX–US (Laredo, El Paso, Tijuana)."
            rows={3}
            style={{ ...FIELD_TEXTAREA, minHeight: "80px" }}
          />
        </Field>

        <Field
          label="Servicios ofrecidos"
          hint="Detalla los servicios específicos: FTL, LTL, refrigerado, peligroso, almacenaje, despacho aduanal, etc."
        >
          <textarea
            value={partner.services_offered ?? ""}
            onChange={(e) => onPatch({ services_offered: e.target.value })}
            placeholder="Ej. FTL nacional, refrigerado clase 7, despacho aduanal completo, almacenaje fiscal en Veracruz y Manzanillo."
            rows={3}
            style={{ ...FIELD_TEXTAREA, minHeight: "80px" }}
          />
        </Field>
      </div>
    </div>
  );
}