"use client";
import { Field, SectionTitle, SELECT, INPUT, TEXTAREA } from "../drawerShared";
import type { ConfigState } from "../drawerState";

type Props = {
  state:    ConfigState;
  onChange: (updates: Partial<ConfigState>) => void;
};

export default function StepConfig({ state, onChange }: Props) {
  return (
    <>
      <SectionTitle>Configuración de la cotización</SectionTitle>

      {/* Plantilla */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>Plantilla Mobility OS</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Colores de marca desde Ajustes → Empresa</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Vigencia">
          <input type="date" value={state.valid_until} onChange={(e) => onChange({ valid_until: e.target.value })} style={INPUT} />
        </Field>
        <Field label="Idioma del PDF">
          <select value={state.language} onChange={(e) => onChange({ language: e.target.value as any })} style={SELECT}>
            <option value="es">🇲🇽 Español</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </Field>
        <Field label="Descuento global ($)">
          <input type="number" value={state.discount_amount} onChange={(e) => onChange({ discount_amount: e.target.value })} placeholder="0" min="0" style={INPUT} />
        </Field>
      </div>

      <Field label="Notas">
        <textarea rows={2} value={state.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Condiciones especiales, observaciones…" style={TEXTAREA} />
      </Field>
      <Field label="Términos y condiciones (vacío = usar los predeterminados de Ajustes)">
        <textarea rows={3} value={state.terms} onChange={(e) => onChange({ terms: e.target.value })} placeholder="Se usarán los términos de Ajustes → Cotizaciones" style={TEXTAREA} />
      </Field>
    </>
  );
}
