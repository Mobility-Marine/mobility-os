// ════════════════════════════════════════════════════════════════════════
// TabCommercial — Tab 5 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Captura las condiciones comerciales del partner:
//   - Términos de pago (texto libre y campos estructurados)
//   - Crédito (límite, días)
//   - Moneda preferida y descuento default
//   - INCOTERM default (selector catálogo)
//   - Rating (1-5 estrellas)
//   - Notas comerciales internas (no visibles al partner)
//
// Todos los campos son opcionales. Si el partner es proveedor o cliente,
// estos datos enriquecen las cotizaciones, pedidos y compras.
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { Partner, Incoterm } from "../types";
import { INCOTERMS } from "../types";
import {
  Field,
  FieldGrid,
  SectionTitle,
  FIELD_INPUT,
  FIELD_SELECT,
  FIELD_TEXTAREA,
} from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabCommercialProps = {
  partner: Partial<Partner>;
  onPatch: (patch: Partial<Partner>) => void;
};

// ── Catálogo de monedas soportadas ───────────────────────────────────
const CURRENCIES = [
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "USD", label: "USD — Dólar estadounidense" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "CAD", label: "CAD — Dólar canadiense" },
  { code: "JPY", label: "JPY — Yen japonés" },
  { code: "CNY", label: "CNY — Yuan chino" },
  { code: "GBP", label: "GBP — Libra esterlina" },
] as const;

// ── Helper: estrella SVG para rating ──────────────────────────────────
function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1l2.6 5.9 6.4.6-4.9 4.4 1.5 6.3L10 14.9l-5.6 3.3 1.5-6.3L1 7.5l6.4-.6L10 1z"
        fill={filled ? color : "transparent"}
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Componente Rating con 5 estrellas clickables ─────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const STAR_BTN: CSSProperties = {
    background:    "transparent",
    border:        "none",
    padding:       "2px",
    cursor:        "pointer",
    outline:       "none",
    display:       "inline-flex",
    alignItems:    "center",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "36px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          style={STAR_BTN}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          title={`${n} estrella${n > 1 ? "s" : ""}`}
        >
          <StarIcon filled={n <= value} color="#f59e0b" />
        </button>
      ))}
      <span
        style={{
          marginLeft: "8px",
          fontSize:   "12px",
          color:      "var(--color-text-muted)",
        }}
      >
        {value > 0 ? `${value}/5` : "Sin calificar"}
      </span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export function TabCommercial({ partner, onPatch }: TabCommercialProps) {
  // Detectar el tipo de relación para etiquetas dinámicas
  const isCustomer = partner.is_customer;
  const isSupplier = partner.is_supplier || partner.is_logistics_provider;

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ─── SECCIÓN 1: Crédito y términos de pago ─── */}
      <div>
        <SectionTitle>
          {isCustomer && isSupplier
            ? "Condiciones comerciales (cliente y proveedor)"
            : isCustomer
            ? "Condiciones comerciales (cliente)"
            : "Condiciones comerciales (proveedor)"}
        </SectionTitle>
        <div style={{ marginTop: "12px" }}>
          <FieldGrid columns={4}>
            <Field
              label="Términos de pago"
              span={2}
              hint="Ej. Contado, 30 días neto, 50/50, etc."
            >
              <input
                type="text"
                value={partner.payment_terms ?? ""}
                onChange={(e) => onPatch({ payment_terms: e.target.value })}
                placeholder="Ej. 30 días neto"
                style={FIELD_INPUT}
              />
            </Field>

            <Field
              label="Días de crédito"
              hint="Número de días para liquidar."
            >
              <input
                type="number"
                min={0}
                step={1}
                value={partner.credit_days ?? 0}
                onChange={(e) => onPatch({ credit_days: Number(e.target.value) || 0 })}
                placeholder="0"
                style={FIELD_INPUT}
              />
            </Field>

            <Field
              label="Límite de crédito"
              hint={`Monto máximo en ${partner.currency ?? "MXN"}.`}
            >
              <input
                type="number"
                min={0}
                step={0.01}
                value={partner.credit_limit ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onPatch({ credit_limit: v === "" ? undefined : Number(v) });
                }}
                placeholder="0.00"
                style={FIELD_INPUT}
              />
            </Field>

            <Field
              label="Moneda preferida"
              hint="Moneda default para cotizaciones y facturas."
            >
              <select
                value={partner.currency ?? "MXN"}
                onChange={(e) => onPatch({ currency: e.target.value })}
                style={FIELD_SELECT}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Descuento default (%)"
              hint="Descuento aplicado automáticamente. 0-100."
            >
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={partner.discount_default ?? 0}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  onPatch({ discount_default: v });
                }}
                placeholder="0"
                style={FIELD_INPUT}
              />
            </Field>

            <Field
              label="INCOTERM default"
              span={2}
              hint="Términos comerciales internacionales (sólo aplica a operaciones de comercio exterior)."
            >
              <select
                value={(partner.default_incoterm as string) ?? ""}
                onChange={(e) =>
                  onPatch({ default_incoterm: (e.target.value || undefined) as Incoterm | undefined })
                }
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
          </FieldGrid>
        </div>
      </div>

      {/* ─── SECCIÓN 2: Rating del partner ─── */}
      <div>
        <SectionTitle>Calificación interna</SectionTitle>
        <div style={{ marginTop: "12px" }}>
          <FieldGrid columns={2}>
            <Field
              label="Rating"
              hint={
                isSupplier
                  ? "Calidad/desempeño del proveedor (uso interno)."
                  : "Importancia/lealtad del cliente (uso interno)."
              }
            >
              <StarRating
                value={partner.rating ?? 0}
                onChange={(n) => onPatch({ rating: n })}
              />
            </Field>
          </FieldGrid>
        </div>
      </div>

      {/* ─── SECCIÓN 3: Notas internas ─── */}
      <div>
        <SectionTitle>Notas comerciales internas</SectionTitle>
        <div
          style={{
            fontSize:   "12px",
            color:      "var(--color-text-muted)",
            marginTop:  "4px",
            marginBottom: "8px",
            lineHeight: 1.5,
          }}
        >
          Estas notas son <strong>solo para tu equipo</strong> y no aparecen en cotizaciones,
          pedidos ni facturas que se envían al partner.
        </div>
        <Field label="Notas">
          <textarea
            value={partner.commercial_notes ?? ""}
            onChange={(e) => onPatch({ commercial_notes: e.target.value })}
            placeholder="Ej. Cliente VIP, requiere atención personalizada del director comercial. Históricamente paga a 45 días aunque negociamos 30."
            rows={4}
            style={FIELD_TEXTAREA}
          />
        </Field>
      </div>
    </div>
  );
}