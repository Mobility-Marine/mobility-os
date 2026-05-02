"use client";

// ═══════════════════════════════════════════════════════════════════════
// FigurasSection — Sección 5 del drawer Carta Porte 3.1
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura las figuras involucradas en el transporte:
// - 01 Operador (chofer): obligatorio si modo=autotransporte
// - 02 Propietario: si el vehículo no es del emisor
// - 03 Arrendatario: si el vehículo está rentado
// - 04 Notificado: parte adicional a notificar (opcional)
//
// Cada figura tiene su propio domicilio (opcional) y los Propietarios/
// Arrendatarios pueden indicar en qué tramos del trayecto participan.
// ═══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteFigura,
  TipoFiguraCode,
} from "../../types/carta_porte.types";
import { newFigura } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

// ─── Metadata visual de los tipos de figura ───
type FiguraInfo = {
  label: string;
  shortLabel: string;
  desc: string;
  iconPath: string;
};

const FIGURA_INFO: Record<TipoFiguraCode, FiguraInfo> = {
  "01": {
    label: "Operador (chofer)",
    shortLabel: "Operador",
    desc: "Conductor de la unidad. Obligatorio si hay autotransporte.",
    iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  "02": {
    label: "Propietario del vehículo",
    shortLabel: "Propietario",
    desc: "Solo si el vehículo no es del emisor del CFDI.",
    iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  "03": {
    label: "Arrendatario del vehículo",
    shortLabel: "Arrendatario",
    desc: "Solo si el vehículo está rentado a un tercero.",
    iconPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  "04": {
    label: "Notificado",
    shortLabel: "Notificado",
    desc: "Parte adicional a notificar del traslado (opcional).",
    iconPath: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
};

interface Props {
  data: CartaPorteData;
  setFiguras: (next: CartaPorteFigura[]) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function FigurasSection({
  data,
  setFiguras,
  showValidation,
  errors,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.figuras[0]?._temp_id ?? null
  );

  const tieneAutotransporte = data.header.modos_transporte.includes("04");

  // ─── Operaciones ───
  const updateFigura = (tempId: string, patch: Partial<CartaPorteFigura>) => {
    setFiguras(
      data.figuras.map(f => (f._temp_id === tempId ? { ...f, ...patch } : f))
    );
  };

  const updateDomicilio = (
    tempId: string,
    patch: Partial<NonNullable<CartaPorteFigura["domicilio"]>>
  ) => {
    setFiguras(
      data.figuras.map(f =>
        f._temp_id === tempId
          ? {
              ...f,
              domicilio: {
                ...(f.domicilio ?? {
                  estado: "",
                  pais: "MEX",
                  codigo_postal: "",
                }),
                ...patch,
              },
            }
          : f
      )
    );
  };

  const addFigura = (tipo: TipoFiguraCode) => {
    const nueva = newFigura(tipo);
    setFiguras([...data.figuras, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeFigura = (tempId: string) => {
    setFiguras(data.figuras.filter(f => f._temp_id !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  };

  const errorsByFigura = (idx: number): number =>
    showValidation
      ? errors.filter(e => e.field.includes(`figuras[${idx}]`)).length
      : 0;

  const countByType = (tipo: TipoFiguraCode): number =>
    data.figuras.filter(f => f.tipo_figura === tipo).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "880px" }}>
      {/* ── Banner ── */}
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
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          Registra a las personas y empresas involucradas en el traslado.
          {tieneAutotransporte && (
            <>
              {" "}<strong style={{ color: "var(--color-text-primary)" }}>
                Con autotransporte, el operador (chofer) es obligatorio.
              </strong>
            </>
          )}
        </div>
      </div>

      {/* ── Botones para agregar figura por tipo ── */}
      <div>
        <div style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "10px",
        }}>
          Agregar figura
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "8px",
        }}>
          {(["01", "02", "03", "04"] as TipoFiguraCode[]).map(tipo => {
            const info = FIGURA_INFO[tipo];
            const count = countByType(tipo);
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => addFigura(tipo)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-base)",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "var(--transition-fast)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--color-brand-blue)";
                  e.currentTarget.style.background = "var(--color-brand-blue-light)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.background = "var(--color-bg-base)";
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="1.8">
                    <path d={info.iconPath} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}>
                      {info.shortLabel}
                    </span>
                    {count > 0 && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background: "var(--color-brand-blue-light)",
                        color: "var(--color-brand-blue)",
                      }}>
                        {count}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    marginTop: "3px",
                    lineHeight: 1.4,
                  }}>
                    {info.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lista de figuras ── */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <div>
            <div style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}>
              Figuras registradas
            </div>
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              marginTop: "2px",
            }}>
              {data.figuras.length === 0
                ? "Agrega al menos una figura"
                : `${data.figuras.length} ${data.figuras.length === 1 ? "registrada" : "registradas"}`}
            </div>
          </div>
        </div>

        {data.figuras.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.figuras.map((f, idx) => (
              <FiguraCard
                key={f._temp_id}
                figura={f}
                index={idx}
                isExpanded={expandedId === f._temp_id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === f._temp_id ? null : f._temp_id)
                }
                onUpdate={patch => updateFigura(f._temp_id, patch)}
                onUpdateDomicilio={patch => updateDomicilio(f._temp_id, patch)}
                onRemove={() => removeFigura(f._temp_id)}
                errorCount={errorsByFigura(idx)}
                ubicaciones={data.ubicaciones}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      padding: "32px 24px",
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--color-border)",
      background: "var(--color-bg-base)",
      textAlign: "center",
    }}>
      <div style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        margin: "0 auto 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0114 0" />
        </svg>
      </div>
      <div style={{
        fontSize: "13px",
        color: "var(--color-text-second)",
      }}>
        Sin figuras registradas. Selecciona arriba el tipo que quieres agregar.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de una figura (plegable)
// ─────────────────────────────────────────────────────────────
interface FiguraCardProps {
  figura: CartaPorteFigura;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CartaPorteFigura>) => void;
  onUpdateDomicilio: (
    patch: Partial<NonNullable<CartaPorteFigura["domicilio"]>>
  ) => void;
  onRemove: () => void;
  errorCount: number;
  ubicaciones: CartaPorteData["ubicaciones"];
}

function FiguraCard({
  figura,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onUpdateDomicilio,
  onRemove,
  errorCount,
  ubicaciones,
}: FiguraCardProps) {
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");
  const { items: estados, loading: loadingEstados } = useSATCatalog("estados_mexico");

  const info = FIGURA_INFO[figura.tipo_figura];
  const isOperador = figura.tipo_figura === "01";
  const requiereParTrans = figura.tipo_figura === "02" || figura.tipo_figura === "03";

  const headerSummary = [
    figura.nombre_figura || "Sin nombre",
    figura.rfc_figura,
    isOperador && figura.num_licencia && `Licencia: ${figura.num_licencia}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const togglePartTrans = (idUbicacion: string) => {
    const current = figura.partes_transporte ?? [];
    const next = current.includes(idUbicacion)
      ? current.filter(id => id !== idUbicacion)
      : [...current, idUbicacion];
    onUpdate({ partes_transporte: next.length ? next : undefined });
  };

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      background: "var(--color-bg-subtle)",
      border: isExpanded
        ? "1px solid var(--color-brand-blue)"
        : errorCount > 0
        ? "1px solid var(--color-danger-border)"
        : "1px solid var(--color-border-faint)",
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-blue)" strokeWidth="1.8">
            <path d={info.iconPath} />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}>
              {info.shortLabel}
            </span>
            <span style={{
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "10px",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-faint)",
              color: "var(--color-text-muted)",
            }}>
              Tipo {figura.tipo_figura}
            </span>
          </div>
          <div style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {headerSummary}
          </div>
        </div>
        {errorCount > 0 && !isExpanded && (
          <span style={{
            padding: "2px 7px",
            borderRadius: "10px",
            background: "var(--color-danger-bg)",
            color: "var(--color-danger-text)",
            fontSize: "10px",
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {errorCount} {errorCount === 1 ? "error" : "errores"}
          </span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: "var(--color-text-muted)",
            flexShrink: 0,
            transform: isExpanded ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Body */}
      {isExpanded && (
        <div style={{
          padding: "12px 14px 14px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {/* Identificación */}
          <SubsectionTitle>Identificación</SubsectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldS label="Nombre / Razón social">
                <input
                  type="text"
                  value={figura.nombre_figura ?? ""}
                  onChange={e => onUpdate({ nombre_figura: e.target.value || undefined })}
                  placeholder={isOperador ? "Ej: Juan Pérez Hernández" : "Ej: Mobility Marine S.A. de C.V."}
                  style={INPUT}
                />
              </FieldS>
            </div>
            <FieldS
              label="RFC"
              hint="RFC mexicano. Si es extranjero, deja vacío y llena registro tributario."
            >
              <input
                type="text"
                value={figura.rfc_figura ?? ""}
                onChange={e => onUpdate({ rfc_figura: e.target.value.toUpperCase() || undefined })}
                placeholder="ABC850101XXX"
                maxLength={13}
                style={{ ...INPUT, fontFamily: "monospace" }}
              />
            </FieldS>
            <FieldS label="Núm. registro tributario (extranjero)">
              <input
                type="text"
                value={figura.num_reg_id_trib ?? ""}
                onChange={e => onUpdate({ num_reg_id_trib: e.target.value || undefined })}
                placeholder="Solo si es residente extranjero"
                style={INPUT}
              />
            </FieldS>
            {!isOperador && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldS label="Residencia fiscal (país)">
                  <select
                    value={figura.residencia_fiscal ?? ""}
                    onChange={e => onUpdate({ residencia_fiscal: e.target.value || undefined })}
                    disabled={loadingPaises}
                    style={INPUT}
                  >
                    <option value="">No aplica</option>
                    {paises.map(p => (
                      <option key={p.code} value={p.code}>{p.label}</option>
                    ))}
                  </select>
                </FieldS>
              </div>
            )}
            {isOperador && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldS
                  label="Número de licencia de conducir"
                  required
                  hint="Licencia federal o estatal del operador"
                >
                  <input
                    type="text"
                    value={figura.num_licencia ?? ""}
                    onChange={e => onUpdate({ num_licencia: e.target.value || undefined })}
                    placeholder="Ej: A1234567"
                    style={{ ...INPUT, fontFamily: "monospace" }}
                  />
                </FieldS>
              </div>
            )}
          </div>

          {/* Domicilio (opcional) */}
          <SubsectionTitle>Domicilio (opcional)</SubsectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}>
            <div style={{ gridColumn: "span 2" }}>
              <FieldS label="Calle">
                <input
                  type="text"
                  value={figura.domicilio?.calle ?? ""}
                  onChange={e => onUpdateDomicilio({ calle: e.target.value })}
                  style={INPUT}
                />
              </FieldS>
            </div>
            <FieldS label="Núm. exterior">
              <input
                type="text"
                value={figura.domicilio?.numero_exterior ?? ""}
                onChange={e => onUpdateDomicilio({ numero_exterior: e.target.value })}
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Núm. interior">
              <input
                type="text"
                value={figura.domicilio?.numero_interior ?? ""}
                onChange={e => onUpdateDomicilio({ numero_interior: e.target.value })}
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Colonia">
              <input
                type="text"
                value={figura.domicilio?.colonia ?? ""}
                onChange={e => onUpdateDomicilio({ colonia: e.target.value })}
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Municipio">
              <input
                type="text"
                value={figura.domicilio?.municipio ?? ""}
                onChange={e => onUpdateDomicilio({ municipio: e.target.value })}
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Código postal">
              <input
                type="text"
                value={figura.domicilio?.codigo_postal ?? ""}
                onChange={e =>
                  onUpdateDomicilio({
                    codigo_postal: e.target.value.replace(/\D/g, "").slice(0, 5),
                  })
                }
                maxLength={5}
                style={{ ...INPUT, fontVariantNumeric: "tabular-nums" }}
              />
            </FieldS>
            <FieldS label="Estado">
              {(figura.domicilio?.pais ?? "MEX") === "MEX" ? (
                <select
                  value={figura.domicilio?.estado ?? ""}
                  onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                  disabled={loadingEstados}
                  style={INPUT}
                >
                  <option value="">{loadingEstados ? "Cargando..." : "Selecciona..."}</option>
                  {estados.map(s => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={figura.domicilio?.estado ?? ""}
                  onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                  style={INPUT}
                />
              )}
            </FieldS>
            <FieldS label="País">
              <select
                value={figura.domicilio?.pais ?? "MEX"}
                onChange={e =>
                  onUpdateDomicilio({
                    pais: e.target.value,
                    estado: e.target.value === "MEX" ? "" : figura.domicilio?.estado ?? "",
                  })
                }
                disabled={loadingPaises}
                style={INPUT}
              >
                {paises.map(p => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
            </FieldS>
          </div>

          {/* Tramos del transporte (solo Propietario / Arrendatario) */}
          {requiereParTrans && ubicaciones.length > 0 && (
            <>
              <SubsectionTitle hint={`Marca las ubicaciones del trayecto donde el ${info.shortLabel.toLowerCase()} interviene.`}>
                Tramos donde participa esta figura
              </SubsectionTitle>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "8px",
              }}>
                {ubicaciones.map(u => {
                  const id = u._temp_id;
                  const isChecked = figura.partes_transporte?.includes(id) ?? false;
                  return (
                    <label
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        background: isChecked ? "var(--color-brand-blue-light)" : "var(--color-bg-base)",
                        border: isChecked
                          ? "1px solid var(--color-brand-blue)"
                          : "1px solid var(--color-border-faint)",
                        cursor: "pointer",
                        transition: "var(--transition-fast)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePartTrans(id)}
                        style={{
                          marginTop: "2px",
                          accentColor: "var(--color-brand-blue)",
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}>
                          {u.tipo_ubicacion}
                          {u.nombre_remitente_destinatario && (
                            <>
                              {" · "}
                              <span style={{ fontWeight: 400 }}>
                                {u.nombre_remitente_destinatario}
                              </span>
                            </>
                          )}
                          {!u.nombre_remitente_destinatario && u.rfc_remitente_destinatario && (
                            <>
                              {" · "}
                              <span style={{ fontWeight: 400, fontFamily: "monospace" }}>
                                {u.rfc_remitente_destinatario}
                              </span>
                            </>
                          )}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "var(--color-text-muted)",
                          marginTop: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {u.domicilio.codigo_postal && `CP ${u.domicilio.codigo_postal} · `}
                          {u.domicilio.estado || "Sin estado"}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {/* Acciones */}
          <div style={{
            paddingTop: "10px",
            borderTop: "1px solid var(--color-border-faint)",
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-danger-border)",
                background: "var(--color-danger-bg)",
                color: "var(--color-danger-text)",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Eliminar figura
            </button>
          </div>
        </div>
      )}
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

function SubsectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ marginTop: "-4px" }}>
      <div style={{
        fontSize: "10px",
        fontWeight: 700,
        color: "var(--color-text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}>
        {children}
      </div>
      {hint && (
        <div style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginTop: "3px",
          lineHeight: 1.5,
        }}>
          {hint}
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
