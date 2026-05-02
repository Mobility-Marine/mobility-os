"use client";

import type { TransporteFerroviario } from "../../types/carta_porte.types";

interface Props {
  data: TransporteFerroviario;
  setData: (next: TransporteFerroviario) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function FerroviarioForm({ data, setData }: Props) {
  const update = (patch: Partial<TransporteFerroviario>) => setData({ ...data, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <Section title="Tipo de servicio">
        <Grid>
          <FieldS label="Tipo de servicio" required>
            <select value={data.tipo_de_servicio}
              onChange={e => update({ tipo_de_servicio: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona…</option>
              <option value="01">01 — Servicio público</option>
              <option value="02">02 — Servicio privado</option>
              <option value="03">03 — Servicio mixto</option>
            </select>
          </FieldS>
          <FieldS label="Tipo de tráfico" required>
            <select value={data.tipo_de_trafico}
              onChange={e => update({ tipo_de_trafico: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona…</option>
              <option value="01">01 — Tráfico local</option>
              <option value="02">02 — Tráfico interlineal</option>
              <option value="03">03 — Tráfico de transbordo</option>
            </select>
          </FieldS>
          <FieldS label="Nombre asegurador">
            <input type="text" value={data.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Núm. póliza seguro">
            <input type="text" value={data.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      <Section title="Derechos de paso (opcional)">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(data.derechos_de_paso ?? []).map((d, idx) => (
            <div key={idx} style={{
              padding: "12px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
            }}>
              <Grid>
                <FieldS label="Tipo derecho">
                  <input type="text" value={d.tipo_derecho_de_paso}
                    onChange={e => {
                      const next = [...(data.derechos_de_paso ?? [])];
                      next[idx] = { ...d, tipo_derecho_de_paso: e.target.value };
                      update({ derechos_de_paso: next });
                    }}
                    style={INPUT} />
                </FieldS>
                <FieldS label="Kilometraje">
                  <input type="number" min="0" step="0.01" value={d.kilometraje_pagado || ""}
                    onChange={e => {
                      const next = [...(data.derechos_de_paso ?? [])];
                      next[idx] = { ...d, kilometraje_pagado: parseFloat(e.target.value) || 0 };
                      update({ derechos_de_paso: next });
                    }}
                    style={{ ...INPUT, textAlign: "right" }} />
                </FieldS>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button type="button"
                    onClick={() => update({ derechos_de_paso: (data.derechos_de_paso ?? []).filter((_, i) => i !== idx) })}
                    style={BUTTON_DANGER}>
                    Eliminar
                  </button>
                </div>
              </Grid>
            </div>
          ))}
          <button type="button"
            onClick={() => update({ derechos_de_paso: [...(data.derechos_de_paso ?? []), { tipo_derecho_de_paso: "", kilometraje_pagado: 0 }] })}
            style={{ ...BUTTON_GHOST, alignSelf: "flex-start" }}>
            + Agregar derecho de paso
          </button>
        </div>
      </Section>

      <Section title="Carros ferroviarios (opcional)">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(data.carro ?? []).map((c, idx) => (
            <div key={idx} style={{
              padding: "12px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                Carro #{idx + 1}
              </div>
              <Grid>
                <FieldS label="Tipo carro">
                  <input type="text" value={c.tipo_carro}
                    onChange={e => {
                      const next = [...(data.carro ?? [])];
                      next[idx] = { ...c, tipo_carro: e.target.value };
                      update({ carro: next });
                    }}
                    style={INPUT} />
                </FieldS>
                <FieldS label="Matrícula">
                  <input type="text" value={c.matricula_carro}
                    onChange={e => {
                      const next = [...(data.carro ?? [])];
                      next[idx] = { ...c, matricula_carro: e.target.value.toUpperCase() };
                      update({ carro: next });
                    }}
                    style={{ ...INPUT, fontFamily: "monospace" }} />
                </FieldS>
                <FieldS label="Guía / Identificación">
                  <input type="text" value={c.guia_carro ?? ""}
                    onChange={e => {
                      const next = [...(data.carro ?? [])];
                      next[idx] = { ...c, guia_carro: e.target.value || undefined };
                      update({ carro: next });
                    }}
                    style={INPUT} />
                </FieldS>
                <FieldS label="Toneladas netas">
                  <input type="number" min="0" step="0.001"
                    value={c.toneladas_netas_carro ?? ""}
                    onChange={e => {
                      const next = [...(data.carro ?? [])];
                      next[idx] = { ...c, toneladas_netas_carro: parseFloat(e.target.value) || undefined };
                      update({ carro: next });
                    }}
                    style={{ ...INPUT, textAlign: "right" }} />
                </FieldS>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button type="button"
                    onClick={() => update({ carro: (data.carro ?? []).filter((_, i) => i !== idx) })}
                    style={BUTTON_DANGER}>
                    Eliminar
                  </button>
                </div>
              </Grid>
            </div>
          ))}
          <button type="button"
            onClick={() => update({ carro: [...(data.carro ?? []), { tipo_carro: "", matricula_carro: "" }] })}
            style={{ ...BUTTON_GHOST, alignSelf: "flex-start" }}>
            + Agregar carro
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
