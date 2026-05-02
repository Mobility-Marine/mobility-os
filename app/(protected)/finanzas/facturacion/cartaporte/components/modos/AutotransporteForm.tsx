"use client";

// ═══════════════════════════════════════════════════════════════════════
// AutotransporteForm — Datos del transporte por carretera
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura: permiso SCT, vehículo motriz (config, peso, placa, año),
// seguros (responsabilidad civil obligatorio + medio ambiente y carga
// opcionales), y hasta 2 remolques opcionales.
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { Autotransporte, Remolque } from "../../types/carta_porte.types";

interface Props {
  value: Autotransporte;
  onChange: (next: Autotransporte) => void;
}

export function AutotransporteForm({ value, onChange }: Props) {
  const { items: permisos, loading: loadingPermisos } = useSATCatalog("tipo_permiso_sct");
  const { items: configs, loading: loadingConfigs } = useSATCatalog("config_autotransporte");
  const { items: subtipos, loading: loadingSubtipos } = useSATCatalog("subtipo_remolque");

  // ─── Updaters ───
  const update = (patch: Partial<Autotransporte>) => onChange({ ...value, ...patch });
  const updateIdent = (patch: Partial<Autotransporte["identificacion_vehicular"]>) =>
    onChange({
      ...value,
      identificacion_vehicular: { ...value.identificacion_vehicular, ...patch },
    });
  const updateSeguros = (patch: Partial<Autotransporte["seguros"]>) =>
    onChange({ ...value, seguros: { ...value.seguros, ...patch } });

  // ─── Remolques ───
  const addRemolque = () => {
    const nuevo: Remolque = { subtipo_rem: "", placa: "" };
    onChange({ ...value, remolques: [...(value.remolques ?? []), nuevo] });
  };

  const updateRemolque = (idx: number, patch: Partial<Remolque>) => {
    const list = [...(value.remolques ?? [])];
    list[idx] = { ...list[idx], ...patch };
    onChange({ ...value, remolques: list });
  };

  const removeRemolque = (idx: number) => {
    const list = [...(value.remolques ?? [])];
    list.splice(idx, 1);
    onChange({ ...value, remolques: list });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Permiso SCT ── */}
      <CardGroup
        title="Permiso SCT"
        subtitle="Permiso de la Secretaría de Comunicaciones y Transportes"
      >
        <div style={GRID2}>
          <FieldS label="Tipo de permiso SCT" required>
            <select
              value={value.perm_sct}
              onChange={e => update({ perm_sct: e.target.value })}
              disabled={loadingPermisos}
              style={INPUT}
            >
              <option value="">{loadingPermisos ? "Cargando..." : "Selecciona tipo de permiso..."}</option>
              {permisos.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.label}
                </option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Número de permiso SCT" required>
            <input
              type="text"
              value={value.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              placeholder="Ej: A-12345/2024"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Identificación vehicular ── */}
      <CardGroup title="Identificación del vehículo motriz">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "10px",
        }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS
              label="Configuración vehicular"
              required
              hint="Indica el tipo de unidad (camión, tractocamión, articulado, etc.)"
            >
              <select
                value={value.identificacion_vehicular.config_vehicular}
                onChange={e => updateIdent({ config_vehicular: e.target.value })}
                disabled={loadingConfigs}
                style={INPUT}
              >
                <option value="">{loadingConfigs ? "Cargando..." : "Selecciona configuración..."}</option>
                {configs.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </FieldS>
          </div>
          <FieldS label="Placa del vehículo motriz" required>
            <input
              type="text"
              value={value.identificacion_vehicular.placa_vm}
              onChange={e => updateIdent({ placa_vm: e.target.value.toUpperCase() })}
              placeholder="ABC-123-D"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Año modelo" required>
            <input
              type="number"
              min="1900"
              max="2100"
              value={value.identificacion_vehicular.anio_modelo_vm}
              onChange={e =>
                updateIdent({ anio_modelo_vm: parseInt(e.target.value, 10) || new Date().getFullYear() })
              }
              style={{
                ...INPUT,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            />
          </FieldS>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS
              label="Peso bruto vehicular (toneladas)"
              required
              hint="Capacidad máxima de carga del vehículo"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", maxWidth: "260px" }}>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={value.identificacion_vehicular.peso_bruto_vehicular || ""}
                  onChange={e => updateIdent({ peso_bruto_vehicular: parseFloat(e.target.value) || 0 })}
                  placeholder="0.000"
                  style={{
                    ...INPUT,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", padding: "0 4px" }}>
                  ton
                </span>
              </div>
            </FieldS>
          </div>
        </div>
      </CardGroup>

      {/* ── Seguros ── */}
      <CardGroup title="Seguros">
        {/* Responsabilidad civil — obligatorio */}
        <SubsectionTitle>Responsabilidad civil</SubsectionTitle>
        <div style={{ ...GRID2, marginBottom: "14px" }}>
          <FieldS label="Aseguradora" required>
            <input
              type="text"
              value={value.seguros.asegura_resp_civil}
              onChange={e => updateSeguros({ asegura_resp_civil: e.target.value })}
              placeholder="Ej: GNP Seguros"
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Número de póliza" required>
            <input
              type="text"
              value={value.seguros.poliza_resp_civil}
              onChange={e => updateSeguros({ poliza_resp_civil: e.target.value })}
              placeholder="Número de póliza"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>

        {/* Medio ambiente — opcional */}
        <SubsectionTitle hint="Solo si transportas materiales peligrosos">
          Medio ambiente (opcional)
        </SubsectionTitle>
        <div style={{ ...GRID2, marginBottom: "14px" }}>
          <FieldS label="Aseguradora">
            <input
              type="text"
              value={value.seguros.asegura_med_ambiente ?? ""}
              onChange={e => updateSeguros({ asegura_med_ambiente: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Número de póliza">
            <input
              type="text"
              value={value.seguros.poliza_med_ambiente ?? ""}
              onChange={e => updateSeguros({ poliza_med_ambiente: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>

        {/* Carga — opcional */}
        <SubsectionTitle>Seguro de carga (opcional)</SubsectionTitle>
        <div style={GRID2}>
          <FieldS label="Aseguradora">
            <input
              type="text"
              value={value.seguros.asegura_carga ?? ""}
              onChange={e => updateSeguros({ asegura_carga: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Número de póliza">
            <input
              type="text"
              value={value.seguros.poliza_carga ?? ""}
              onChange={e => updateSeguros({ poliza_carga: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS label="Prima del seguro (opcional)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value.seguros.prima_seguro ?? ""}
                onChange={e =>
                  updateSeguros({ prima_seguro: e.target.value ? parseFloat(e.target.value) : undefined })
                }
                placeholder="0.00"
                style={{
                  ...INPUT,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  maxWidth: "260px",
                }}
              />
            </FieldS>
          </div>
        </div>
      </CardGroup>

      {/* ── Remolques ── */}
      <CardGroup
        title="Remolques (opcional)"
        subtitle="Hasta 2 remolques o semirremolques que arrastra la unidad motriz"
      >
        {(value.remolques ?? []).length === 0 ? (
          <DashedAdd onClick={addRemolque} label="Agregar remolque" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(value.remolques ?? []).map((r, idx) => (
              <RemolqueRow
                key={idx}
                index={idx}
                remolque={r}
                subtipos={subtipos}
                loadingSubtipos={loadingSubtipos}
                onUpdate={patch => updateRemolque(idx, patch)}
                onRemove={() => removeRemolque(idx)}
              />
            ))}
            {(value.remolques?.length ?? 0) < 2 && (
              <DashedAdd onClick={addRemolque} label="Agregar otro remolque" />
            )}
          </div>
        )}
      </CardGroup>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row de remolque
// ─────────────────────────────────────────────────────────────
function RemolqueRow({
  index,
  remolque,
  subtipos,
  loadingSubtipos,
  onUpdate,
  onRemove,
}: {
  index: number;
  remolque: Remolque;
  subtipos: { code: string; label: string }[];
  loadingSubtipos: boolean;
  onUpdate: (patch: Partial<Remolque>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr 1fr auto",
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
      <FieldS label="Subtipo de remolque" required>
        <select
          value={remolque.subtipo_rem}
          onChange={e => onUpdate({ subtipo_rem: e.target.value })}
          disabled={loadingSubtipos}
          style={INPUT}
        >
          <option value="">{loadingSubtipos ? "Cargando..." : "Selecciona..."}</option>
          {subtipos.map(s => (
            <option key={s.code} value={s.code}>
              {s.code} — {s.label}
            </option>
          ))}
        </select>
      </FieldS>
      <FieldS label="Placa" required>
        <input
          type="text"
          value={remolque.placa}
          onChange={e => onUpdate({ placa: e.target.value.toUpperCase() })}
          placeholder="ABC-123-D"
          style={{ ...INPUT, fontFamily: "monospace" }}
        />
      </FieldS>
      <button
        type="button"
        onClick={onRemove}
        title="Quitar remolque"
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
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{ marginBottom: "12px" }}>
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
      {children}
    </div>
  );
}

function SubsectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
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
          fontSize: "10px",
          color: "var(--color-text-muted)",
          marginTop: "2px",
          fontStyle: "italic",
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
