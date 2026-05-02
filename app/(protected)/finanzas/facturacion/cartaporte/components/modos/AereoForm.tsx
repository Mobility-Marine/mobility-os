"use client";

import type { TransporteAereo } from "../../types/carta_porte.types";

interface Props {
  data: TransporteAereo;
  setData: (next: TransporteAereo) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function AereoForm({ data, setData }: Props) {
  const update = (patch: Partial<TransporteAereo>) => setData({ ...data, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Section title="Permiso y aeronave">
        <Grid>
          <FieldS label="Permiso SCT" required>
            <input type="text" value={data.perm_sct}
              onChange={e => update({ perm_sct: e.target.value.toUpperCase() })}
              maxLength={10}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Núm. permiso SCT" required>
            <input type="text" value={data.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Matrícula aeronave" required>
            <input type="text" value={data.matricula_aeronave}
              onChange={e => update({ matricula_aeronave: e.target.value.toUpperCase() })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Nombre aeronave">
            <input type="text" value={data.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Núm. póliza seguros">
            <input type="text" value={data.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      <Section title="Guía aérea (Air Waybill)">
        <Grid>
          <FieldS label="Núm. guía aérea (AWB)" required>
            <input type="text" value={data.num_guia ?? ""}
              onChange={e => update({ num_guia: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Lugar contrato">
            <input type="text" value={data.lugar_contrato ?? ""}
              onChange={e => update({ lugar_contrato: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Código transporte aéreo">
            <input type="text" value={data.codigo_transporte_aereo ?? ""}
              onChange={e => update({ codigo_transporte_aereo: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      <Section title="Embarcador (opcional)">
        <Grid>
          <FieldS label="RFC embarcador">
            <input type="text" value={data.rfc_embarcador ?? ""}
              onChange={e => update({ rfc_embarcador: e.target.value.toUpperCase() || undefined })}
              maxLength={13}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Núm. registro tributario">
            <input type="text" value={data.num_reg_id_trib_embarc ?? ""}
              onChange={e => update({ num_reg_id_trib_embarc: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Residencia fiscal">
            <input type="text" value={data.residencia_fiscal_embarc ?? ""}
              onChange={e => update({ residencia_fiscal_embarc: e.target.value || undefined })}
              style={INPUT} />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>{children}</div>;
}

function FieldS({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
