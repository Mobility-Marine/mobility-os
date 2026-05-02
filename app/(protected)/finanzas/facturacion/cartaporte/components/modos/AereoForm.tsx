"use client";

// ═══════════════════════════════════════════════════════════════════════
// AereoForm — Transporte aéreo
// Permiso SCT + aeronave + guía aérea + embarcador opcional
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { TransporteAereo } from "../../types/carta_porte.types";

interface Props {
  data: TransporteAereo;
  setData: (next: TransporteAereo) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function AereoForm({ data, setData }: Props) {
  const { items: codigos } = useSATCatalog("codigo_transporte_aereo");
  const { items: paises }  = useSATCatalog("paises_comunes");

  const update = (patch: Partial<TransporteAereo>) => setData({ ...data, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Permiso SCT */}
      <Section title="Permiso SCT">
        <Grid>
          <FieldS label="Tipo de permiso SCT" required>
            <input type="text" value={data.perm_sct}
              onChange={e => update({ perm_sct: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Número de permiso SCT" required>
            <input type="text" value={data.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Aeronave y vuelo */}
      <Section title="Aeronave y vuelo">
        <Grid>
          <FieldS label="Matrícula aeronave" required>
            <input type="text" value={data.matricula_aeronave}
              onChange={e => update({ matricula_aeronave: e.target.value.toUpperCase() })}
              placeholder="XA-AMP"
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Código transportista (IATA/ICAO)" required>
            <select value={data.codigo_transportista}
              onChange={e => update({ codigo_transportista: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona aerolínea...</option>
              {codigos.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Número de guía aérea" required hint="Air Waybill (AWB)">
            <input type="text" value={data.numero_guia}
              onChange={e => update({ numero_guia: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Lugar de contrato" required>
            <input type="text" value={data.lugar_contrato}
              onChange={e => update({ lugar_contrato: e.target.value })}
              placeholder="Ciudad / Aeropuerto"
              style={INPUT} />
          </FieldS>
        </Grid>
      </Section>

      {/* Seguros */}
      <Section title="Seguros">
        <Grid>
          <FieldS label="Aseguradora" required>
            <input type="text" value={data.nombre_aseg}
              onChange={e => update({ nombre_aseg: e.target.value })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Número de póliza" required>
            <input type="text" value={data.num_poliza_seguro}
              onChange={e => update({ num_poliza_seguro: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Embarcador (opcional) */}
      <Section title="Embarcador (opcional)" subtitle="Datos del exportador o expedidor de la mercancía">
        <Grid>
          <FieldS label="RFC del embarcador">
            <input type="text" value={data.rfc_embarcador ?? ""}
              onChange={e => update({ rfc_embarcador: e.target.value.toUpperCase() || undefined })}
              maxLength={13}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Nombre del embarcador">
            <input type="text" value={data.nombre_embarcador ?? ""}
              onChange={e => update({ nombre_embarcador: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Núm. registro tributario (extranjero)">
            <input type="text" value={data.num_reg_id_trib_embarc ?? ""}
              onChange={e => update({ num_reg_id_trib_embarc: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Residencia fiscal">
            <select value={data.residencia_fiscal_embarc ?? ""}
              onChange={e => update({ residencia_fiscal_embarc: e.target.value || undefined })}
              style={INPUT}>
              <option value="">No aplica</option>
              {paises.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </FieldS>
        </Grid>
      </Section>
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>{children}</div>;
}
function FieldS({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}
