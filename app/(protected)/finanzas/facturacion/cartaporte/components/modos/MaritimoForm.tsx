"use client";

import type { TransporteMaritimo } from "../../types/carta_porte.types";

interface Props {
  data: TransporteMaritimo;
  setData: (next: TransporteMaritimo) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function MaritimoForm({ data, setData }: Props) {
  const update = (patch: Partial<TransporteMaritimo>) => setData({ ...data, ...patch });
  const updateEmb = (patch: Partial<TransporteMaritimo["embarcacion"]>) => {
    setData({ ...data, embarcacion: { ...data.embarcacion, ...patch } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <Section title="Datos del permiso y línea naviera">
        <Grid>
          <FieldS label="Permiso SCT" required>
            <input type="text" value={data.perm_sct}
              onChange={e => update({ perm_sct: e.target.value.toUpperCase() })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Núm. permiso SCT" required>
            <input type="text" value={data.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Nombre línea naviera">
            <input type="text" value={data.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Núm. autorización naviero">
            <input type="text" value={data.num_autorizacion_naviero ?? ""}
              onChange={e => update({ num_autorizacion_naviero: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
        </Grid>
      </Section>

      <Section title="Embarcación">
        <Grid>
          <FieldS label="Tipo embarcación" required>
            <input type="text" value={data.embarcacion.tipo_embarcacion}
              onChange={e => updateEmb({ tipo_embarcacion: e.target.value })}
              maxLength={2}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Matrícula" required>
            <input type="text" value={data.embarcacion.matricula}
              onChange={e => updateEmb({ matricula: e.target.value.toUpperCase() })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="OMI / IMO Number" required>
            <input type="text" value={data.embarcacion.numero_omi}
              onChange={e => updateEmb({ numero_omi: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Nombre embarcación">
            <input type="text" value={data.embarcacion.nombre_embarc ?? ""}
              onChange={e => updateEmb({ nombre_embarc: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Año embarcación">
            <input type="number" min="1900" max="2100"
              value={data.embarcacion.anio_embarcacion ?? ""}
              onChange={e => updateEmb({ anio_embarcacion: parseInt(e.target.value) || undefined })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Eslora (m)">
            <input type="number" min="0" step="0.01"
              value={data.embarcacion.eslora ?? ""}
              onChange={e => updateEmb({ eslora: parseFloat(e.target.value) || undefined })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Manga (m)">
            <input type="number" min="0" step="0.01"
              value={data.embarcacion.manga ?? ""}
              onChange={e => updateEmb({ manga: parseFloat(e.target.value) || undefined })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Calado (m)">
            <input type="number" min="0" step="0.01"
              value={data.embarcacion.calado ?? ""}
              onChange={e => updateEmb({ calado: parseFloat(e.target.value) || undefined })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
        </Grid>
      </Section>

      <Section title="Contenedores (opcional)">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(data.contenedor ?? []).map((c, idx) => (
            <div key={idx} style={{
              padding: "12px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
            }}>
              <Grid>
                <FieldS label="Tipo contenedor">
                  <input type="text" value={c.tipo_contenedor}
                    onChange={e => {
                      const next = [...(data.contenedor ?? [])];
                      next[idx] = { ...c, tipo_contenedor: e.target.value };
                      update({ contenedor: next });
                    }}
                    style={INPUT} />
                </FieldS>
                <FieldS label="Matrícula">
                  <input type="text" value={c.matricula_contenedor}
                    onChange={e => {
                      const next = [...(data.contenedor ?? [])];
                      next[idx] = { ...c, matricula_contenedor: e.target.value.toUpperCase() };
                      update({ contenedor: next });
                    }}
                    style={{ ...INPUT, fontFamily: "monospace" }} />
                </FieldS>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button type="button"
                    onClick={() => update({ contenedor: (data.contenedor ?? []).filter((_, i) => i !== idx) })}
                    style={BUTTON_DANGER}>
                    Eliminar
                  </button>
                </div>
              </Grid>
            </div>
          ))}
          <button type="button"
            onClick={() => update({ contenedor: [...(data.contenedor ?? []), { tipo_contenedor: "", matricula_contenedor: "" }] })}
            style={{ ...BUTTON_GHOST, alignSelf: "flex-start" }}>
            + Agregar contenedor
          </button>
        </div>
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
const BUTTON_GHOST: React.CSSProperties = {
  height: "30px", padding: "0 10px", fontSize: "11px", fontWeight: 600,
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-second)", cursor: "pointer",
};
const BUTTON_DANGER: React.CSSProperties = {
  padding: "8px 12px", fontSize: "11px", fontWeight: 600, height: "36px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)", cursor: "pointer",
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
