"use client";

// ═══════════════════════════════════════════════════════════════════════
// MaritimoForm — Datos del transporte marítimo
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura: permiso SCT, embarcación (tipo, matrícula, OMI, nombre,
// nacionalidad, año, dimensiones), tipo de carga, seguros,
// línea naviera, viaje, B/L, y contenedores transportados.
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  TransporteMaritimo,
  ContenedorMaritimo,
} from "../../types/carta_porte.types";

interface Props {
  value: TransporteMaritimo;
  onChange: (next: TransporteMaritimo) => void;
}

export function MaritimoForm({ value, onChange }: Props) {
  const { items: tiposEmb, loading: loadingEmb } = useSATCatalog("tipo_embarcacion");
  const { items: tiposCarga, loading: loadingCarga } = useSATCatalog("tipo_carga");
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");

  const update = (patch: Partial<TransporteMaritimo>) =>
    onChange({ ...value, ...patch });

  // ─── Contenedores ───
  const addContenedor = () => {
    const nuevo: ContenedorMaritimo = { matricula_contenedor: "", tipo_contenedor: "" };
    onChange({ ...value, contenedores: [...(value.contenedores ?? []), nuevo] });
  };

  const updateContenedor = (idx: number, patch: Partial<ContenedorMaritimo>) => {
    const list = [...(value.contenedores ?? [])];
    list[idx] = { ...list[idx], ...patch };
    onChange({ ...value, contenedores: list });
  };

  const removeContenedor = (idx: number) => {
    const list = [...(value.contenedores ?? [])];
    list.splice(idx, 1);
    onChange({ ...value, contenedores: list });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Permiso SCT ── */}
      <CardGroup
        title="Permiso SCT (opcional)"
        subtitle="Solo si la operación lo requiere"
      >
        <div style={GRID2}>
          <FieldS label="Tipo de permiso SCT">
            <input
              type="text"
              value={value.perm_sct ?? ""}
              onChange={e => update({ perm_sct: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Número de permiso SCT">
            <input
              type="text"
              value={value.num_permiso_sct ?? ""}
              onChange={e => update({ num_permiso_sct: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Embarcación ── */}
      <CardGroup
        title="Embarcación"
        subtitle="Datos del buque que transporta la carga"
      >
        <SubsectionTitle>Identificación</SubsectionTitle>
        <div style={{ ...GRID2, marginBottom: "14px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS label="Tipo de embarcación" required>
              <select
                value={value.tipo_embarcacion}
                onChange={e => update({ tipo_embarcacion: e.target.value })}
                disabled={loadingEmb}
                style={INPUT}
              >
                <option value="">{loadingEmb ? "Cargando..." : "Selecciona tipo..."}</option>
                {tiposEmb.map(t => (
                  <option key={t.code} value={t.code}>
                    {t.code} — {t.label}
                  </option>
                ))}
              </select>
            </FieldS>
          </div>
          <FieldS label="Matrícula" required>
            <input
              type="text"
              value={value.matricula}
              onChange={e => update({ matricula: e.target.value.toUpperCase() })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS
            label="Número OMI"
            required
            hint="Identificador de la Organización Marítima Internacional (7 dígitos)"
          >
            <input
              type="text"
              value={value.numero_omi}
              onChange={e => update({ numero_omi: e.target.value })}
              placeholder="1234567"
              maxLength={7}
              style={{ ...INPUT, fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}
            />
          </FieldS>
          <FieldS label="Nombre de la embarcación" required>
            <input
              type="text"
              value={value.nombre_embarc}
              onChange={e => update({ nombre_embarc: e.target.value })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Nacionalidad" required>
            <select
              value={value.nacionalidad_embarc}
              onChange={e => update({ nacionalidad_embarc: e.target.value })}
              disabled={loadingPaises}
              style={INPUT}
            >
              {paises.map(p => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Año de construcción" required>
            <input
              type="number"
              min="1900"
              max="2100"
              value={value.anio_embarcacion}
              onChange={e =>
                update({ anio_embarcacion: parseInt(e.target.value, 10) || new Date().getFullYear() })
              }
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
          <FieldS label="Unidades de arqueo bruto" required>
            <input
              type="number"
              min="0"
              value={value.unidades_de_arq_bruto || ""}
              onChange={e => update({ unidades_de_arq_bruto: parseInt(e.target.value, 10) || 0 })}
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
        </div>

        <SubsectionTitle>Dimensiones</SubsectionTitle>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}>
          <FieldS label="Eslora (m)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.eslora || ""}
              onChange={e => update({ eslora: parseFloat(e.target.value) || 0 })}
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
          <FieldS label="Manga (m)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.manga || ""}
              onChange={e => update({ manga: parseFloat(e.target.value) || 0 })}
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
          <FieldS label="Calado (m)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.calado || ""}
              onChange={e => update({ calado: parseFloat(e.target.value) || 0 })}
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Carga y seguros ── */}
      <CardGroup title="Carga y seguros">
        <div style={GRID2}>
          <FieldS label="Tipo de carga" required>
            <select
              value={value.tipo_carga}
              onChange={e => update({ tipo_carga: e.target.value })}
              disabled={loadingCarga}
              style={INPUT}
            >
              <option value="">{loadingCarga ? "Cargando..." : "Selecciona..."}</option>
              {tiposCarga.map(t => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Número certificado ITC">
            <input
              type="text"
              value={value.num_cert_itc ?? ""}
              onChange={e => update({ num_cert_itc: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Aseguradora">
            <input
              type="text"
              value={value.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Número de póliza">
            <input
              type="text"
              value={value.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Línea naviera y viaje ── */}
      <CardGroup
        title="Línea naviera y viaje (opcional)"
      >
        <div style={GRID2}>
          <FieldS label="Línea naviera">
            <input
              type="text"
              value={value.linea_naviera ?? ""}
              onChange={e => update({ linea_naviera: e.target.value || undefined })}
              placeholder="Ej: MSC, Maersk, Hapag-Lloyd"
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Nombre del agente naviero">
            <input
              type="text"
              value={value.nombre_agente_naviero ?? ""}
              onChange={e => update({ nombre_agente_naviero: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Núm. autorización del agente">
            <input
              type="text"
              value={value.num_autorizacion_naviero ?? ""}
              onChange={e => update({ num_autorizacion_naviero: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Número de viaje">
            <input
              type="text"
              value={value.num_viaje ?? ""}
              onChange={e => update({ num_viaje: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS
              label="Conocimiento de embarque (Bill of Lading)"
              hint="B/L number — documento de transporte marítimo emitido por la línea naviera"
            >
              <input
                type="text"
                value={value.num_conoc_embarc ?? ""}
                onChange={e => update({ num_conoc_embarc: e.target.value || undefined })}
                placeholder="B/L number"
                style={{ ...INPUT, fontFamily: "monospace" }}
              />
            </FieldS>
          </div>
        </div>
      </CardGroup>

      {/* ── Contenedores ── */}
      <CardGroup
        title="Contenedores"
        subtitle="Contenedores transportados en este viaje"
        rightHeader={
          (value.contenedores?.length ?? 0) > 0 ? (
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {value.contenedores!.length} {value.contenedores!.length === 1 ? "contenedor" : "contenedores"}
            </span>
          ) : null
        }
      >
        {(value.contenedores ?? []).length === 0 ? (
          <DashedAdd onClick={addContenedor} label="Agregar contenedor" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(value.contenedores ?? []).map((c, idx) => (
              <ContenedorRow
                key={idx}
                index={idx}
                contenedor={c}
                onUpdate={patch => updateContenedor(idx, patch)}
                onRemove={() => removeContenedor(idx)}
              />
            ))}
            <DashedAdd onClick={addContenedor} label="Agregar otro contenedor" />
          </div>
        )}
      </CardGroup>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row de contenedor
// ─────────────────────────────────────────────────────────────
function ContenedorRow({
  index,
  contenedor,
  onUpdate,
  onRemove,
}: {
  index: number;
  contenedor: ContenedorMaritimo;
  onUpdate: (patch: Partial<ContenedorMaritimo>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr 1fr 1fr auto",
      gap: "10px",
      alignItems: "end",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{
        width: "26px",
        height: "26px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 700,
        color: "var(--color-text-second)",
        fontVariantNumeric: "tabular-nums",
        marginBottom: "2px",
      }}>
        {index + 1}
      </div>
      <FieldS label="Matrícula" required>
        <input
          type="text"
          value={contenedor.matricula_contenedor}
          onChange={e => onUpdate({ matricula_contenedor: e.target.value.toUpperCase() })}
          placeholder="MSCU1234567"
          style={{ ...INPUT, fontFamily: "monospace" }}
        />
      </FieldS>
      <FieldS label="Tipo" required>
        <input
          type="text"
          value={contenedor.tipo_contenedor}
          onChange={e => onUpdate({ tipo_contenedor: e.target.value })}
          placeholder="20', 40' HC, 40' RF..."
          style={INPUT}
        />
      </FieldS>
      <FieldS label="Núm. precinto">
        <input
          type="text"
          value={contenedor.num_precinto ?? ""}
          onChange={e => onUpdate({ num_precinto: e.target.value || undefined })}
          style={{ ...INPUT, fontFamily: "monospace" }}
        />
      </FieldS>
      <button
        type="button"
        onClick={onRemove}
        title="Quitar contenedor"
        style={{
          padding: "8px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-danger-border)",
          background: "var(--color-danger-bg)",
          color: "var(--color-danger-text)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
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

const GRID2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
};

function CardGroup({
  title,
  subtitle,
  rightHeader,
  children,
}: {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
        gap: "12px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}>
            {title}
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
        {rightHeader}
      </div>
      {children}
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
      marginBottom: "8px",
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

function DashedAdd({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
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
        e.currentTarget.style.color = "var(--color-brand-blue)";
        e.currentTarget.style.borderColor = "var(--color-brand-blue)";
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
