"use client";

// ═══════════════════════════════════════════════════════════════════════
// DatosGeneralesSection — Sección 1 del drawer Carta Porte 3.1
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura:
// - Banner del tipo de CFDI base (Factura I o Traslado T)
// - Modos de transporte (multi-select, hasta 4)
// - Tipo de operación (Nacional / Internacional)
// - Datos internacionales (entrada/salida, país, vía) si aplica
// - Distancia total recorrida
// - Resumen en vivo
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteParentType,
  ModoTransporteCode,
} from "../../types/carta_porte.types";
import type { ValidationError } from "../../types/carta_porte.validations";

// ─── Metadata visual de los modos de transporte ───
type ModoInfo = {
  label: string;
  desc: string;
  iconPath: string;
};

const MODO_INFO: Record<ModoTransporteCode, ModoInfo> = {
  "04": {
    label: "Autotransporte",
    desc: "Camiones y vehículos terrestres",
    iconPath: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM18.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  },
  "01": {
    label: "Marítimo",
    desc: "Embarcaciones y barcos",
    iconPath: "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.38 20A11.6 11.6 0 0021 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76M19 13V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6M12 10v4M2 20h20",
  },
  "02": {
    label: "Aéreo",
    desc: "Aeronaves y vuelos",
    iconPath: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  },
  "03": {
    label: "Ferroviario",
    desc: "Trenes de carga",
    iconPath: "M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zM7.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5-7H6V5h5v5zm2 0V5h5v5h-5zm3.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z",
  },
};

interface Props {
  data: CartaPorteData;
  updateHeader: (patch: Partial<CartaPorteData["header"]>) => void;
  parentType: CartaPorteParentType;
  showValidation: boolean;
  errors: ValidationError[];
}

export function DatosGeneralesSection({
  data,
  updateHeader,
  parentType,
  showValidation,
  errors,
}: Props) {
  const { items: vias, loading: loadingVias } = useSATCatalog("vias_transporte");
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");

  const isInternacional = data.header.transp_internac === "Sí";

  const toggleModo = (modo: ModoTransporteCode) => {
    const current = data.header.modos_transporte;
    const next = current.includes(modo)
      ? current.filter(m => m !== modo)
      : [...current, modo];
    updateHeader({ modos_transporte: next });
  };

  const fieldHasError = (field: string) =>
    showValidation && errors.some(e => e.field === field);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "780px" }}>
      {/* ── Banner del tipo de CFDI base ── */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-info-bg)",
        border: "1px solid var(--color-info-border)",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-info-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
            <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-info-text)", marginBottom: "3px" }}>
            {parentType === "factura_carta_porte"
              ? "CFDI Tipo I (Ingreso) + Carta Porte 3.1"
              : "CFDI Tipo T (Traslado) + Carta Porte 3.1"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
            {parentType === "factura_carta_porte"
              ? "Para emitir cuando cobras al cliente por el servicio de transporte. La factura tiene valor comercial y el complemento describe el traslado físico."
              : "Para emitir cuando trasladas mercancía (propia o de un cliente) sin generar valor comercial. Sin pago, solo registro del movimiento."}
          </div>
        </div>
      </div>

      {/* ── Modos de transporte ── */}
      <SectionBlock>
        <SectionHeader
          title="Modos de transporte"
          subtitle="Selecciona uno o más. Si la mercancía cambia de medio durante el viaje, marca todos los aplicables."
          required
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "8px",
        }}>
          {(["04", "01", "02", "03"] as ModoTransporteCode[]).map(modo => {
            const isSelected = data.header.modos_transporte.includes(modo);
            const info = MODO_INFO[modo];
            return (
              <button
                key={modo}
                type="button"
                onClick={() => toggleModo(modo)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: isSelected ? "var(--color-brand-blue-light)" : "var(--color-bg-base)",
                  border: isSelected
                    ? "1px solid var(--color-brand-blue)"
                    : "1px solid var(--color-border)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "var(--transition-fast)",
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-sm)",
                  background: isSelected ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isSelected ? "#FFFFFF" : "var(--color-text-second)"}
                    strokeWidth="1.8"
                  >
                    <path d={info.iconPath} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isSelected ? "var(--color-brand-blue)" : "var(--color-text-primary)",
                  }}>
                    {info.label}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {info.desc}
                  </div>
                </div>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--color-brand-blue)" style={{ flexShrink: 0 }}>
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        {fieldHasError("modos_transporte") && (
          <ErrorText>Selecciona al menos un modo de transporte</ErrorText>
        )}
      </SectionBlock>

      {/* ── Tipo de operación ── */}
      <SectionBlock>
        <SectionHeader
          title="Tipo de operación"
          subtitle="¿La mercancía cruza fronteras del país?"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 220px))",
          gap: "8px",
        }}>
          <button
            type="button"
            onClick={() =>
              updateHeader({
                transp_internac: "No",
                entrada_salida_merc: undefined,
                pais_origen_destino: undefined,
                via_entrada_salida: undefined,
              })
            }
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: !isInternacional ? "var(--color-success-bg)" : "var(--color-bg-base)",
              border: !isInternacional
                ? "1px solid var(--color-success-border)"
                : "1px solid var(--color-border)",
              fontSize: "13px",
              fontWeight: 600,
              color: !isInternacional ? "var(--color-success-text)" : "var(--color-text-second)",
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            Nacional (México)
          </button>
          <button
            type="button"
            onClick={() => updateHeader({ transp_internac: "Sí" })}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: isInternacional ? "var(--color-brand-orange-light)" : "var(--color-bg-base)",
              border: isInternacional
                ? "1px solid var(--color-brand-orange)"
                : "1px solid var(--color-border)",
              fontSize: "13px",
              fontWeight: 600,
              color: isInternacional ? "var(--color-brand-orange)" : "var(--color-text-second)",
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            Internacional
          </button>
        </div>
      </SectionBlock>

      {/* ── Datos internacionales (condicional) ── */}
      {isInternacional && (
        <div style={{
          padding: "14px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-brand-orange-light)",
          border: "1px solid var(--color-brand-orange)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <div style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--color-brand-orange)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Datos internacionales
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Entrada / Salida */}
            <FieldS label="Operación" required>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "6px",
              }}>
                <button
                  type="button"
                  onClick={() => updateHeader({ entrada_salida_merc: "Entrada" })}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    background: data.header.entrada_salida_merc === "Entrada" ? "var(--color-success-bg)" : "var(--color-bg-base)",
                    border: data.header.entrada_salida_merc === "Entrada"
                      ? "1px solid var(--color-success-border)"
                      : "1px solid var(--color-border)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: data.header.entrada_salida_merc === "Entrada" ? "var(--color-success-text)" : "var(--color-text-second)",
                    cursor: "pointer",
                  }}
                >
                  Entrada (Importación)
                </button>
                <button
                  type="button"
                  onClick={() => updateHeader({ entrada_salida_merc: "Salida" })}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    background: data.header.entrada_salida_merc === "Salida" ? "var(--color-brand-blue-light)" : "var(--color-bg-base)",
                    border: data.header.entrada_salida_merc === "Salida"
                      ? "1px solid var(--color-brand-blue)"
                      : "1px solid var(--color-border)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: data.header.entrada_salida_merc === "Salida" ? "var(--color-brand-blue)" : "var(--color-text-second)",
                    cursor: "pointer",
                  }}
                >
                  Salida (Exportación)
                </button>
              </div>
              {fieldHasError("entrada_salida_merc") && (
                <ErrorText>Selecciona Entrada o Salida</ErrorText>
              )}
            </FieldS>

            {/* País + Vía */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}>
              <FieldS
                label={`País ${
                  data.header.entrada_salida_merc === "Entrada"
                    ? "de origen"
                    : data.header.entrada_salida_merc === "Salida"
                    ? "de destino"
                    : ""
                }`}
                required
              >
                <select
                  value={data.header.pais_origen_destino ?? ""}
                  onChange={e => updateHeader({ pais_origen_destino: e.target.value || undefined })}
                  disabled={loadingPaises}
                  style={INPUT}
                >
                  <option value="">{loadingPaises ? "Cargando..." : "Selecciona país..."}</option>
                  {paises
                    .filter(p => p.code !== "MEX")
                    .map(p => (
                      <option key={p.code} value={p.code}>{p.label}</option>
                    ))}
                </select>
              </FieldS>

              <FieldS label="Vía de entrada/salida" required>
                <select
                  value={data.header.via_entrada_salida ?? ""}
                  onChange={e => updateHeader({ via_entrada_salida: e.target.value || undefined })}
                  disabled={loadingVias}
                  style={INPUT}
                >
                  <option value="">{loadingVias ? "Cargando..." : "Selecciona vía..."}</option>
                  {vias.map(v => (
                    <option key={v.code} value={v.code}>{v.label}</option>
                  ))}
                </select>
              </FieldS>
            </div>
          </div>
        </div>
      )}

      {/* ── Distancia total ── */}
      <SectionBlock>
        <SectionHeader
          title="Distancia total recorrida"
          subtitle="Suma en kilómetros de todas las distancias entre ubicaciones del trayecto."
          required
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "260px" }}>
          <input
            type="number"
            min="0"
            step="0.001"
            value={data.header.total_dist_rec || ""}
            onChange={e => updateHeader({ total_dist_rec: parseFloat(e.target.value) || 0 })}
            placeholder="0.000"
            style={{
              ...INPUT,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
              ...(fieldHasError("total_dist_rec") ? { borderColor: "var(--color-danger-border)" } : {}),
            }}
          />
          <span style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            padding: "0 4px",
          }}>
            km
          </span>
        </div>
        {fieldHasError("total_dist_rec") && (
          <ErrorText>La distancia debe ser mayor a 0</ErrorText>
        )}
      </SectionBlock>

      {/* ── Resumen en vivo ── */}
      <div style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "10px",
        }}>
          Resumen de esta sección
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}>
          <SummaryItem
            label="Tipo de operación"
            value={
              isInternacional
                ? `Internacional · ${
                    data.header.entrada_salida_merc === "Entrada"
                      ? "Importación"
                      : data.header.entrada_salida_merc === "Salida"
                      ? "Exportación"
                      : "—"
                  }`
                : "Nacional"
            }
            tone={isInternacional ? "warning" : "success"}
          />
          <SummaryItem
            label="Modos seleccionados"
            value={
              data.header.modos_transporte.length === 0
                ? "—"
                : data.header.modos_transporte.map(m => MODO_INFO[m].label).join(", ")
            }
          />
          <SummaryItem
            label="Distancia total"
            value={`${data.header.total_dist_rec.toLocaleString("es-MX", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 3,
            })} km`}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI compartidos
// ─────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

function SectionBlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  required,
}: {
  title: string;
  subtitle?: string;
  required?: boolean;
}) {
  return (
    <div>
      <div style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}>
        {title}
        {required && <span style={{ color: "var(--color-danger-text)" }}>*</span>}
      </div>
      {subtitle && (
        <div style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginTop: "2px",
          lineHeight: 1.5,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function FieldS({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "11px",
        color: "var(--color-text-muted)",
        marginBottom: "5px",
        fontWeight: 500,
      }}>
        {label}
        {required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{
          fontSize: "10px",
          color: "var(--color-text-muted)",
          marginTop: "4px",
          lineHeight: 1.4,
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px",
      color: "var(--color-danger-text)",
      marginTop: "4px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    }}>
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  const valueColor =
    tone === "success" ? "var(--color-success-text)" :
    tone === "warning" ? "var(--color-brand-orange)" :
    "var(--color-text-primary)";

  return (
    <div>
      <div style={{
        fontSize: "10px",
        color: "var(--color-text-muted)",
        marginBottom: "3px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "13px",
        fontWeight: 600,
        color: valueColor,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}
