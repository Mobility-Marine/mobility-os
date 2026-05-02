"use client";

import type { CartaPorteData, CartaPorteParentType, ModoTransporteSAT } from "../../types/carta_porte.types";

const MODOS_DISPONIBLES: { code: ModoTransporteSAT; label: string; desc: string }[] = [
  { code: "01", label: "Autotransporte",     desc: "Camiones, tractocamiones y vehículos terrestres" },
  { code: "02", label: "Marítimo",           desc: "Embarcaciones de carga marítima y fluvial" },
  { code: "03", label: "Aéreo",              desc: "Aeronaves de carga" },
  { code: "04", label: "Ferroviario",        desc: "Trenes de carga" },
  { code: "05", label: "Ducto",              desc: "Tuberías y ductos" },
  { code: "06", label: "Multimodal",         desc: "Combinación de varios modos" },
];

const PAISES_COMUNES = [
  { code: "MEX", label: "México" },     { code: "USA", label: "Estados Unidos" },
  { code: "CAN", label: "Canadá" },     { code: "GTM", label: "Guatemala" },
  { code: "BLZ", label: "Belice" },     { code: "ESP", label: "España" },
  { code: "CHN", label: "China" },      { code: "JPN", label: "Japón" },
  { code: "KOR", label: "Corea del Sur" }, { code: "DEU", label: "Alemania" },
];

const VIAS_TRANSPORTE = [
  { code: "01", label: "01 — Autotransporte" }, { code: "02", label: "02 — Marítimo" },
  { code: "03", label: "03 — Aéreo" },          { code: "04", label: "04 — Ferroviario" },
];

interface Props {
  data: CartaPorteData;
  updateHeader: (patch: Partial<CartaPorteData["header"]>) => void;
  parentType: CartaPorteParentType;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function DatosGeneralesSection({ data, updateHeader, parentType, showValidation, errors }: Props) {
  const isInternational = data.header.transp_internac === "Sí";
  const fieldError = (field: string) => showValidation && errors.some(e => e.field === field);

  const toggleModo = (modo: ModoTransporteSAT) => {
    const current = data.header.modos_transporte;
    const next = current.includes(modo) ? current.filter(m => m !== modo) : [...current, modo];
    updateHeader({ modos_transporte: next });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "780px" }}>

      <div style={BANNER}>
        Datos generales del traslado: tipo de operación (nacional/internacional), modo de transporte y distancia recorrida.
      </div>

      {/* Tipo de operación */}
      <Section title="Tipo de operación">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          <RadioCard
            selected={!isInternational}
            onClick={() => updateHeader({ transp_internac: "No", entrada_salida_merc: undefined, pais_origen_destino: undefined, via_entrada_salida: undefined })}
            label="Nacional"
            desc="Origen y destino dentro de México"
          />
          <RadioCard
            selected={isInternational}
            onClick={() => updateHeader({ transp_internac: "Sí" })}
            label="Internacional"
            desc="Origen o destino fuera de México"
          />
        </div>
      </Section>

      {isInternational && (
        <Section title="Datos internacionales">
          <Grid>
            <Field label="Entrada o salida" required error={fieldError("entrada_salida_merc")}>
              <select
                value={data.header.entrada_salida_merc ?? ""}
                onChange={e => updateHeader({ entrada_salida_merc: e.target.value as any || undefined })}
                style={INPUT}
              >
                <option value="">Selecciona…</option>
                <option value="Entrada">Entrada (importación)</option>
                <option value="Salida">Salida (exportación)</option>
              </select>
            </Field>

            <Field label="País origen / destino" required error={fieldError("pais_origen_destino")}>
              <select
                value={data.header.pais_origen_destino ?? ""}
                onChange={e => updateHeader({ pais_origen_destino: e.target.value || undefined })}
                style={INPUT}
              >
                <option value="">Selecciona…</option>
                {PAISES_COMUNES.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
              </select>
            </Field>

            <Field label="Vía de entrada/salida" required error={fieldError("via_entrada_salida")}>
              <select
                value={data.header.via_entrada_salida ?? ""}
                onChange={e => updateHeader({ via_entrada_salida: e.target.value || undefined })}
                style={INPUT}
              >
                <option value="">Selecciona…</option>
                {VIAS_TRANSPORTE.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
            </Field>
          </Grid>
        </Section>
      )}

      {/* Modos de transporte */}
      <Section title="Modos de transporte" hint="Marca todos los modos que se usarán en el traslado. Se desbloquearán los formularios respectivos en el paso 6.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
          {MODOS_DISPONIBLES.map(m => (
            <CheckboxCard
              key={m.code}
              selected={data.header.modos_transporte.includes(m.code)}
              onClick={() => toggleModo(m.code)}
              label={`${m.code} — ${m.label}`}
              desc={m.desc}
            />
          ))}
        </div>
        {showValidation && fieldError("modos_transporte") && (
          <div style={ERROR_TEXT}>Selecciona al menos un modo de transporte.</div>
        )}
      </Section>

      {/* Distancia */}
      <Section title="Distancia recorrida">
        <Field label="Distancia total (kilómetros)" required error={fieldError("total_dist_rec")} hint="Suma total de kilómetros entre todos los puntos del traslado.">
          <input
            type="number" min="0" step="0.01"
            value={data.header.total_dist_rec || ""}
            onChange={e => updateHeader({ total_dist_rec: parseFloat(e.target.value) || 0 })}
            placeholder="850.5"
            style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
          />
        </Field>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const BANNER: React.CSSProperties = {
  padding: "12px 14px", borderRadius: "var(--radius-md)",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
  fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5,
};
const ERROR_TEXT: React.CSSProperties = {
  fontSize: "11px", color: "var(--color-danger-text)", marginTop: "6px",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        {title}
      </div>
      {hint && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "10px", lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>{children}</div>;
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      <div style={error ? { boxShadow: "0 0 0 1px #dc2626", borderRadius: "var(--radius-md)" } : undefined}>{children}</div>
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function RadioCard({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: "12px", textAlign: "left",
        borderRadius: "var(--radius-md)",
        border: selected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
        background: selected ? "rgba(59, 130, 246, 0.08)" : "var(--color-bg-subtle)",
        cursor: "pointer", display: "flex", flexDirection: "column", gap: "2px",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{desc}</span>
    </button>
  );
}

function CheckboxCard({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: "10px 12px", textAlign: "left",
        borderRadius: "var(--radius-md)",
        border: selected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
        background: selected ? "rgba(59, 130, 246, 0.08)" : "var(--color-bg-subtle)",
        cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "8px",
      }}
    >
      <div style={{
        width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0, marginTop: "2px",
        background: selected ? "var(--color-brand-blue)" : "transparent",
        border: selected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{label}</div>
        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>{desc}</div>
      </div>
    </button>
  );
}
