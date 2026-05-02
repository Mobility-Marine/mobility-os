"use client";

// ═══════════════════════════════════════════════════════════════════════
// AereoForm — Datos del transporte aéreo
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura: permiso SCT, aeronave (matrícula, transportista, guía aérea,
// lugar de contrato), seguros (aseguradora + póliza obligatorios),
// y datos del embarcador (opcional, residente extranjero).
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { TransporteAereo } from "../../types/carta_porte.types";

interface Props {
  value: TransporteAereo;
  onChange: (next: TransporteAereo) => void;
}

export function AereoForm({ value, onChange }: Props) {
  const { items: codigos, loading: loadingCodigos } = useSATCatalog("codigo_transporte_aereo");
  const { items: paises, loading: loadingPaises } = useSATCatalog("paises_comunes");

  const update = (patch: Partial<TransporteAereo>) =>
    onChange({ ...value, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Permiso SCT ── */}
      <CardGroup title="Permiso SCT">
        <div style={GRID2}>
          <FieldS label="Tipo de permiso SCT" required>
            <input
              type="text"
              value={value.perm_sct}
              onChange={e => update({ perm_sct: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Número de permiso SCT" required>
            <input
              type="text"
              value={value.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Aeronave y vuelo ── */}
      <CardGroup title="Aeronave y vuelo">
        <div style={GRID2}>
          <FieldS label="Matrícula de la aeronave" required>
            <input
              type="text"
              value={value.matricula_aeronave}
              onChange={e => update({ matricula_aeronave: e.target.value.toUpperCase() })}
              placeholder="XA-AMP"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS
            label="Código de transportista (IATA/ICAO)"
            required
            hint="Catálogo c_CodigoTransporteAereo (AAL, AMX, DAL...)"
          >
            <select
              value={value.codigo_transportista}
              onChange={e => update({ codigo_transportista: e.target.value })}
              disabled={loadingCodigos}
              style={INPUT}
            >
              <option value="">{loadingCodigos ? "Cargando..." : "Selecciona aerolínea..."}</option>
              {codigos.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </FieldS>
          <FieldS
            label="Número de guía aérea"
            required
            hint="Air Waybill (AWB) emitido por la aerolínea"
          >
            <input
              type="text"
              value={value.numero_guia}
              onChange={e => update({ numero_guia: e.target.value })}
              placeholder="AWB number"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Lugar de contrato" required>
            <input
              type="text"
              value={value.lugar_contrato}
              onChange={e => update({ lugar_contrato: e.target.value })}
              placeholder="Ciudad / Aeropuerto"
              style={INPUT}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Seguros ── */}
      <CardGroup title="Seguros">
        <div style={GRID2}>
          <FieldS label="Aseguradora" required>
            <input
              type="text"
              value={value.nombre_aseg}
              onChange={e => update({ nombre_aseg: e.target.value })}
              placeholder="Ej: AIG Seguros, Chubb..."
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Número de póliza" required>
            <input
              type="text"
              value={value.num_poliza_seguro}
              onChange={e => update({ num_poliza_seguro: e.target.value })}
              placeholder="Número de póliza"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
        </div>
      </CardGroup>

      {/* ── Embarcador (opcional) ── */}
      <CardGroup
        title="Embarcador (opcional)"
        subtitle="Datos del exportador o expedidor de la mercancía"
      >
        <div style={GRID2}>
          <FieldS label="RFC del embarcador">
            <input
              type="text"
              value={value.rfc_embarcador ?? ""}
              onChange={e => update({ rfc_embarcador: e.target.value.toUpperCase() || undefined })}
              placeholder="ABC850101XXX"
              maxLength={13}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>
          <FieldS label="Nombre del embarcador">
            <input
              type="text"
              value={value.nombre_embarcador ?? ""}
              onChange={e => update({ nombre_embarcador: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS
            label="Núm. registro tributario"
            hint="Solo si es residente extranjero"
          >
            <input
              type="text"
              value={value.num_reg_id_trib_embarc ?? ""}
              onChange={e => update({ num_reg_id_trib_embarc: e.target.value || undefined })}
              style={INPUT}
            />
          </FieldS>
          <FieldS label="Residencia fiscal">
            <select
              value={value.residencia_fiscal_embarc ?? ""}
              onChange={e => update({ residencia_fiscal_embarc: e.target.value || undefined })}
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
      </CardGroup>
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
