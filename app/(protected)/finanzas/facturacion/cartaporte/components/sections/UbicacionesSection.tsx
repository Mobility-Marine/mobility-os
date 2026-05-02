"use client";

// ═══════════════════════════════════════════════════════════════════════
// UbicacionesSection — Sección 2 del drawer Carta Porte 3.1
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura:
// - 1 o más Origenes (típicamente 1)
// - 1 o más Destinos
// - Cada ubicación con remitente/destinatario, fecha/hora,
//   domicilio completo y distancia recorrida (solo destinos)
//
// UX: Cards plegables. Solo se expande la que estás editando.
// ═══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  CartaPorteUbicacion,
  TipoUbicacion,
} from "../../types/carta_porte.types";
import { newUbicacion } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

interface Props {
  data: CartaPorteData;
  setUbicaciones: (next: CartaPorteUbicacion[]) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function UbicacionesSection({
  data,
  setUbicaciones,
  showValidation,
  errors,
}: Props) {
  // Por defecto, expandir solo la primera ubicación
  const [expandedId, setExpandedId] = useState<string | null>(
    data.ubicaciones[0]?._temp_id ?? null
  );

  // ─── Operaciones sobre el array ───
  const updateUbicacion = (
    tempId: string,
    patch: Partial<CartaPorteUbicacion>
  ) => {
    setUbicaciones(
      data.ubicaciones.map(u =>
        u._temp_id === tempId ? { ...u, ...patch } : u
      )
    );
  };

  const updateDomicilio = (
    tempId: string,
    patch: Partial<CartaPorteUbicacion["domicilio"]>
  ) => {
    setUbicaciones(
      data.ubicaciones.map(u =>
        u._temp_id === tempId
          ? { ...u, domicilio: { ...u.domicilio, ...patch } }
          : u
      )
    );
  };

  const addUbicacion = (tipo: TipoUbicacion) => {
    const nueva = newUbicacion(tipo);
    setUbicaciones([...data.ubicaciones, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeUbicacion = (tempId: string) => {
    setUbicaciones(data.ubicaciones.filter(u => u._temp_id !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  };

  // Cantidad de errores por ubicación (para badge en card colapsada)
  const errorsByUbicacion = (idx: number): number =>
    showValidation
      ? errors.filter(e => e.field.includes(`ubicaciones[${idx}]`)).length
      : 0;

  const origenes = data.ubicaciones.filter(u => u.tipo_ubicacion === "Origen");
  const destinos = data.ubicaciones.filter(u => u.tipo_ubicacion === "Destino");

  // Total de distancia capturada en destinos
  const sumaDistancias = destinos.reduce(
    (acc, u) => acc + (u.distancia_recorrida ?? 0),
    0
  );

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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          Define el <strong style={{ color: "var(--color-text-primary)" }}>trayecto físico</strong> de la
          mercancía: de dónde sale (Origen) y a dónde llega (Destino). Cada destino debe indicar la
          distancia recorrida desde la ubicación anterior.
        </div>
      </div>

      {/* ══════ ORÍGENES ══════ */}
      <div>
        <SectionHeader
          icon="origen"
          title="Origen"
          subtitle="Punto de salida del trayecto"
          count={origenes.length}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {origenes.map(u => {
            const idx = data.ubicaciones.findIndex(x => x._temp_id === u._temp_id);
            return (
              <UbicacionCard
                key={u._temp_id}
                ubicacion={u}
                indexGlobal={idx}
                isExpanded={expandedId === u._temp_id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === u._temp_id ? null : u._temp_id)
                }
                onUpdate={patch => updateUbicacion(u._temp_id, patch)}
                onUpdateDomicilio={patch => updateDomicilio(u._temp_id, patch)}
                onRemove={origenes.length > 1 ? () => removeUbicacion(u._temp_id) : undefined}
                errorCount={errorsByUbicacion(idx)}
                allUbicaciones={data.ubicaciones}
              />
            );
          })}
          <AddButton
            tone="success"
            onClick={() => addUbicacion("Origen")}
            label="Agregar otro origen"
          />
        </div>
      </div>

      {/* ══════ DESTINOS ══════ */}
      <div>
        <SectionHeader
          icon="destino"
          title="Destino(s)"
          subtitle="Punto(s) de llegada del trayecto"
          count={destinos.length}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {destinos.map(u => {
            const idx = data.ubicaciones.findIndex(x => x._temp_id === u._temp_id);
            return (
              <UbicacionCard
                key={u._temp_id}
                ubicacion={u}
                indexGlobal={idx}
                isExpanded={expandedId === u._temp_id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === u._temp_id ? null : u._temp_id)
                }
                onUpdate={patch => updateUbicacion(u._temp_id, patch)}
                onUpdateDomicilio={patch => updateDomicilio(u._temp_id, patch)}
                onRemove={destinos.length > 1 ? () => removeUbicacion(u._temp_id) : undefined}
                errorCount={errorsByUbicacion(idx)}
                allUbicaciones={data.ubicaciones}
              />
            );
          })}
          <AddButton
            tone="info"
            onClick={() => addUbicacion("Destino")}
            label="Agregar otro destino"
          />
        </div>
      </div>

      {/* ── Resumen del trayecto ── */}
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
          Resumen del trayecto
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}>
          <SummaryItem
            label="Total ubicaciones"
            value={String(data.ubicaciones.length)}
          />
          <SummaryItem
            label="Suma distancias capturadas"
            value={`${sumaDistancias.toLocaleString("es-MX", { maximumFractionDigits: 3 })} km`}
          />
          <SummaryItem
            label="Total declarado"
            value={`${data.header.total_dist_rec.toLocaleString("es-MX", {
              maximumFractionDigits: 3,
            })} km`}
            tone={
              Math.abs(sumaDistancias - data.header.total_dist_rec) < 0.01
                ? "success"
                : sumaDistancias > 0 && data.header.total_dist_rec > 0
                ? "warning"
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de una ubicación (plegable)
// ─────────────────────────────────────────────────────────────
interface UbicacionCardProps {
  ubicacion: CartaPorteUbicacion;
  indexGlobal: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CartaPorteUbicacion>) => void;
  onUpdateDomicilio: (patch: Partial<CartaPorteUbicacion["domicilio"]>) => void;
  onRemove?: () => void;
  errorCount: number;
  allUbicaciones: CartaPorteUbicacion[];
}

function UbicacionCard({
  ubicacion,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onUpdateDomicilio,
  onRemove,
  errorCount,
  allUbicaciones,
}: UbicacionCardProps) {
  const { items: estados, loading: loadingEstados } = useSATCatalog("estados_mexico");
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");

  const isOrigen = ubicacion.tipo_ubicacion === "Origen";

  // Ordinal del Origen/Destino dentro de su grupo
  const sameTypeList = allUbicaciones.filter(
    u => u.tipo_ubicacion === ubicacion.tipo_ubicacion
  );
  const ordinal = sameTypeList.findIndex(u => u._temp_id === ubicacion._temp_id) + 1;

  // Resumen para el header colapsado
  const headerSummary = [
    ubicacion.rfc_remitente_destinatario || "RFC pendiente",
    ubicacion.domicilio.codigo_postal && `CP ${ubicacion.domicilio.codigo_postal}`,
    ubicacion.domicilio.estado,
  ]
    .filter(Boolean)
    .join(" · ");

  const accentColor = isOrigen ? "var(--color-success-text)" : "var(--color-brand-blue)";
  const accentBg = isOrigen ? "var(--color-success-bg)" : "var(--color-brand-blue-light)";

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      background: "var(--color-bg-subtle)",
      border: isExpanded
        ? `1px solid ${accentColor}`
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
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: accentBg,
          border: `1px solid ${accentColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: 700,
          color: accentColor,
          flexShrink: 0,
        }}>
          {isOrigen ? "OR" : "DE"}
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
              {ubicacion.tipo_ubicacion} {ordinal}
            </span>
            {ubicacion.nombre_remitente_destinatario && (
              <span style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                · {ubicacion.nombre_remitente_destinatario}
              </span>
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
          {/* ── Remitente / Destinatario ── */}
          <SubsectionTitle>{isOrigen ? "Remitente" : "Destinatario"}</SubsectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}>
            <FieldS label="Nombre / Razón social" required>
              <input
                type="text"
                value={ubicacion.nombre_remitente_destinatario ?? ""}
                onChange={e => onUpdate({ nombre_remitente_destinatario: e.target.value })}
                placeholder="Ej: Mobility Marine S.A. de C.V."
                style={INPUT}
              />
            </FieldS>
            <FieldS label="RFC" required>
              <input
                type="text"
                value={ubicacion.rfc_remitente_destinatario}
                onChange={e => onUpdate({ rfc_remitente_destinatario: e.target.value.toUpperCase() })}
                placeholder="ABC850101XXX"
                maxLength={13}
                style={{ ...INPUT, fontFamily: "monospace" }}
              />
            </FieldS>
            <FieldS label="Núm. registro tributario (extranjero)">
              <input
                type="text"
                value={ubicacion.num_reg_id_trib ?? ""}
                onChange={e => onUpdate({ num_reg_id_trib: e.target.value || undefined })}
                placeholder="Solo si es residente extranjero"
                style={INPUT}
              />
            </FieldS>
          </div>

          {/* ── Tiempo y trayecto ── */}
          <SubsectionTitle>Tiempo y trayecto</SubsectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}>
            <FieldS
              label={`Fecha y hora de ${isOrigen ? "salida" : "llegada"}`}
              required
            >
              <input
                type="datetime-local"
                value={ubicacion.fecha_hora_salida_llegada.slice(0, 16)}
                onChange={e => onUpdate({ fecha_hora_salida_llegada: e.target.value })}
                style={INPUT}
              />
            </FieldS>
            {!isOrigen && (
              <FieldS label="Distancia recorrida (km)" required>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={ubicacion.distancia_recorrida ?? ""}
                  onChange={e =>
                    onUpdate({ distancia_recorrida: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.000"
                  style={{
                    ...INPUT,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </FieldS>
            )}
          </div>

          {/* ── Domicilio ── */}
          <SubsectionTitle>Domicilio</SubsectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}>
            <div style={{ gridColumn: "span 2" }}>
              <FieldS label="Calle">
                <input
                  type="text"
                  value={ubicacion.domicilio.calle ?? ""}
                  onChange={e => onUpdateDomicilio({ calle: e.target.value })}
                  placeholder="Ej: Av. Insurgentes Sur"
                  style={INPUT}
                />
              </FieldS>
            </div>
            <FieldS label="Núm. exterior">
              <input
                type="text"
                value={ubicacion.domicilio.numero_exterior ?? ""}
                onChange={e => onUpdateDomicilio({ numero_exterior: e.target.value })}
                placeholder="123"
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Núm. interior">
              <input
                type="text"
                value={ubicacion.domicilio.numero_interior ?? ""}
                onChange={e => onUpdateDomicilio({ numero_interior: e.target.value })}
                placeholder="A, B, 4"
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Colonia">
              <input
                type="text"
                value={ubicacion.domicilio.colonia ?? ""}
                onChange={e => onUpdateDomicilio({ colonia: e.target.value })}
                placeholder="Ej: Roma Norte"
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Localidad">
              <input
                type="text"
                value={ubicacion.domicilio.localidad ?? ""}
                onChange={e => onUpdateDomicilio({ localidad: e.target.value })}
                placeholder="Opcional"
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Municipio / Alcaldía">
              <input
                type="text"
                value={ubicacion.domicilio.municipio ?? ""}
                onChange={e => onUpdateDomicilio({ municipio: e.target.value })}
                placeholder="Ej: Cuauhtémoc"
                style={INPUT}
              />
            </FieldS>
            <FieldS label="Código postal" required>
              <input
                type="text"
                value={ubicacion.domicilio.codigo_postal}
                onChange={e =>
                  onUpdateDomicilio({
                    codigo_postal: e.target.value.replace(/\D/g, "").slice(0, 5),
                  })
                }
                placeholder="06700"
                maxLength={5}
                style={{ ...INPUT, fontVariantNumeric: "tabular-nums" }}
              />
            </FieldS>
            <FieldS label="Estado" required>
              {ubicacion.domicilio.pais === "MEX" ? (
                <select
                  value={ubicacion.domicilio.estado}
                  onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                  disabled={loadingEstados}
                  style={INPUT}
                >
                  <option value="">{loadingEstados ? "Cargando..." : "Selecciona estado..."}</option>
                  {estados.map(s => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ubicacion.domicilio.estado}
                  onChange={e => onUpdateDomicilio({ estado: e.target.value })}
                  placeholder="Estado/Provincia/Región"
                  style={INPUT}
                />
              )}
            </FieldS>
            <FieldS label="País" required>
              <select
                value={ubicacion.domicilio.pais}
                onChange={e =>
                  onUpdateDomicilio({
                    pais: e.target.value,
                    estado: e.target.value === "MEX" ? "" : ubicacion.domicilio.estado,
                  })
                }
                disabled={loadingPaises}
                style={INPUT}
              >
                {loadingPaises ? (
                  <option value={ubicacion.domicilio.pais}>Cargando...</option>
                ) : (
                  paises.map(p => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))
                )}
              </select>
            </FieldS>
            <div style={{ gridColumn: "span 3" }}>
              <FieldS label="Referencia (entre calles, puntos cercanos)">
                <input
                  type="text"
                  value={ubicacion.domicilio.referencia ?? ""}
                  onChange={e => onUpdateDomicilio({ referencia: e.target.value })}
                  placeholder="Ej: entre Insurgentes y Reforma, junto al banco"
                  style={INPUT}
                />
              </FieldS>
            </div>
          </div>

          {/* Acciones */}
          {onRemove && (
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingTop: "4px",
              borderTop: "1px solid var(--color-border-faint)",
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
                  marginTop: "4px",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                Eliminar esta ubicación
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI
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

function SectionHeader({
  icon,
  title,
  subtitle,
  count,
}: {
  icon: "origen" | "destino";
  title: string;
  subtitle: string;
  count: number;
}) {
  const isOrigen = icon === "origen";
  const accent = isOrigen ? "var(--color-success-text)" : "var(--color-brand-blue)";
  const accentBg = isOrigen ? "var(--color-success-bg)" : "var(--color-brand-blue-light)";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-md)",
          background: accentBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
            {isOrigen ? (
              <>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </>
            ) : (
              <>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </>
            )}
          </svg>
        </div>
        <div>
          <div style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}>
            {title}
          </div>
          <div style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
          }}>
            {subtitle}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: "11px",
        color: "var(--color-text-muted)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {count} {count === 1 ? "registrado" : "registrados"}
      </div>
    </div>
  );
}

function SubsectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "10px",
      fontWeight: 700,
      color: "var(--color-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginTop: "-4px",
    }}>
      {children}
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

function AddButton({
  tone,
  onClick,
  label,
}: {
  tone: "success" | "info";
  onClick: () => void;
  label: string;
}) {
  const accent = tone === "success" ? "var(--color-success-text)" : "var(--color-brand-blue)";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--color-border)",
        background: "transparent",
        color: "var(--color-text-muted)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        transition: "var(--transition-fast)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = accent;
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = "var(--color-text-muted)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {label}
    </button>
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
