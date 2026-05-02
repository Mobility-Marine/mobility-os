"use client";

// ═══════════════════════════════════════════════════════════════════════
// FerroviarioForm — Transporte ferroviario
// Servicio + derechos de paso + carros con contenedores anidados
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  TransporteFerroviario, CarroFerroviario, DerechoDePaso, ContenedorFerroviario,
} from "../../types/carta_porte.types";

interface Props {
  data: TransporteFerroviario;
  setData: (next: TransporteFerroviario) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function FerroviarioForm({ data, setData }: Props) {
  const { items: servicios } = useSATCatalog("tipo_servicio_ferroviario");
  const { items: traficos }  = useSATCatalog("tipo_trafico_ferroviario");
  const { items: carrosCat } = useSATCatalog("tipo_carro");
  const { items: derechos }  = useSATCatalog("derechos_de_paso");

  const update = (patch: Partial<TransporteFerroviario>) => setData({ ...data, ...patch });

  // Derechos de paso
  const addDerecho = () => {
    update({ derechos_de_paso: [...(data.derechos_de_paso ?? []), { tipo_derecho_de_paso: "", kilometraje_pagado: 0 }] });
  };
  const updateDerecho = (idx: number, patch: Partial<DerechoDePaso>) => {
    const list = [...(data.derechos_de_paso ?? [])];
    list[idx] = { ...list[idx], ...patch };
    update({ derechos_de_paso: list });
  };
  const removeDerecho = (idx: number) => {
    update({ derechos_de_paso: (data.derechos_de_paso ?? []).filter((_, i) => i !== idx) });
  };

  // Carros
  const addCarro = () => {
    const nuevo: CarroFerroviario = {
      tipo_carro: "", matricula_carro: "", guia_carro: "", toneladas_netas_carro: 0, contenedores: [],
    };
    update({ carros: [...data.carros, nuevo] });
  };
  const updateCarro = (idx: number, patch: Partial<CarroFerroviario>) => {
    const list = [...data.carros];
    list[idx] = { ...list[idx], ...patch };
    update({ carros: list });
  };
  const removeCarro = (idx: number) => {
    update({ carros: data.carros.filter((_, i) => i !== idx) });
  };

  // Contenedores dentro de carros
  const addCont = (carroIdx: number) => {
    const list = [...data.carros];
    const conts = [...(list[carroIdx].contenedores ?? []), { tipo_contenedor: "", guia_contenedor: "" } as ContenedorFerroviario];
    list[carroIdx] = { ...list[carroIdx], contenedores: conts };
    update({ carros: list });
  };
  const updateCont = (carroIdx: number, contIdx: number, patch: Partial<ContenedorFerroviario>) => {
    const list = [...data.carros];
    const conts = [...(list[carroIdx].contenedores ?? [])];
    conts[contIdx] = { ...conts[contIdx], ...patch };
    list[carroIdx] = { ...list[carroIdx], contenedores: conts };
    update({ carros: list });
  };
  const removeCont = (carroIdx: number, contIdx: number) => {
    const list = [...data.carros];
    list[carroIdx] = { ...list[carroIdx], contenedores: (list[carroIdx].contenedores ?? []).filter((_, i) => i !== contIdx) };
    update({ carros: list });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Tipo servicio */}
      <Section title="Tipo de servicio ferroviario">
        <Grid>
          <FieldS label="Tipo de servicio" required>
            <select value={data.tipo_de_servicio}
              onChange={e => update({ tipo_de_servicio: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona...</option>
              {servicios.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </FieldS>
          <FieldS label="Tipo de tráfico" required>
            <select value={data.tipo_de_trafico}
              onChange={e => update({ tipo_de_trafico: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona...</option>
              {traficos.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </FieldS>
          <FieldS label="Aseguradora">
            <input type="text" value={data.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Número de póliza">
            <input type="text" value={data.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Derechos de paso */}
      <Section title="Derechos de paso (opcional)" subtitle="Solo si la unidad transita por vías de otro concesionario">
        {(data.derechos_de_paso ?? []).length === 0 ? (
          <button type="button" onClick={addDerecho} style={DASHED_BUTTON}>+ Agregar derecho de paso</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(data.derechos_de_paso ?? []).map((d, idx) => (
              <div key={idx} style={{
                padding: "10px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
                display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", alignItems: "flex-end",
              }}>
                <FieldS label="Tipo derecho" required>
                  <select value={d.tipo_derecho_de_paso}
                    onChange={e => updateDerecho(idx, { tipo_derecho_de_paso: e.target.value })}
                    style={INPUT}>
                    <option value="">Selecciona...</option>
                    {derechos.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                  </select>
                </FieldS>
                <FieldS label="Kilometraje pagado" required>
                  <input type="number" min="0" step="0.001"
                    value={d.kilometraje_pagado || ""}
                    onChange={e => updateDerecho(idx, { kilometraje_pagado: parseFloat(e.target.value) || 0 })}
                    style={{ ...INPUT, textAlign: "right" }} />
                </FieldS>
                <button type="button" onClick={() => removeDerecho(idx)} style={BUTTON_DANGER}>Eliminar</button>
              </div>
            ))}
            <button type="button" onClick={addDerecho} style={DASHED_BUTTON}>+ Agregar otro</button>
          </div>
        )}
      </Section>

      {/* Carros del tren */}
      <Section title="Carros del tren" subtitle="Mínimo 1 carro. Cada carro puede llevar contenedores.">
        {data.carros.length === 0 ? (
          <button type="button" onClick={addCarro} style={DASHED_BUTTON}>+ Agregar primer carro</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.carros.map((c, cIdx) => (
              <div key={cIdx} style={{
                padding: "12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
                display: "flex", flexDirection: "column", gap: "10px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    Carro {cIdx + 1}
                  </div>
                  <button type="button" onClick={() => removeCarro(cIdx)}
                    style={{ ...BUTTON_DANGER, padding: "4px 10px", height: "26px", fontSize: "10px" }}>
                    Quitar carro
                  </button>
                </div>

                <Grid>
                  <FieldS label="Tipo de carro" required>
                    <select value={c.tipo_carro}
                      onChange={e => updateCarro(cIdx, { tipo_carro: e.target.value })}
                      style={INPUT}>
                      <option value="">Selecciona...</option>
                      {carrosCat.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </FieldS>
                  <FieldS label="Matrícula del carro" required>
                    <input type="text" value={c.matricula_carro}
                      onChange={e => updateCarro(cIdx, { matricula_carro: e.target.value.toUpperCase() })}
                      style={{ ...INPUT, fontFamily: "monospace" }} />
                  </FieldS>
                  <FieldS label="Guía del carro" required>
                    <input type="text" value={c.guia_carro}
                      onChange={e => updateCarro(cIdx, { guia_carro: e.target.value })}
                      style={{ ...INPUT, fontFamily: "monospace" }} />
                  </FieldS>
                  <FieldS label="Toneladas netas" required>
                    <input type="number" min="0" step="0.001"
                      value={c.toneladas_netas_carro || ""}
                      onChange={e => updateCarro(cIdx, { toneladas_netas_carro: parseFloat(e.target.value) || 0 })}
                      style={{ ...INPUT, textAlign: "right" }} />
                  </FieldS>
                </Grid>

                {/* Contenedores del carro */}
                <div style={{ paddingTop: "8px", borderTop: "1px solid var(--color-border-faint)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Contenedores en este carro
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {(c.contenedores ?? []).length}
                    </span>
                  </div>

                  {(c.contenedores ?? []).map((cont, ctIdx) => (
                    <div key={ctIdx} style={{
                      padding: "8px", marginBottom: "6px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "6px", alignItems: "flex-end",
                    }}>
                      <div>
                        <label style={MINI_LABEL}>Tipo</label>
                        <input type="text" value={cont.tipo_contenedor}
                          onChange={e => updateCont(cIdx, ctIdx, { tipo_contenedor: e.target.value })}
                          placeholder="40' HC"
                          style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
                      </div>
                      <div>
                        <label style={MINI_LABEL}>Guía</label>
                        <input type="text" value={cont.guia_contenedor}
                          onChange={e => updateCont(cIdx, ctIdx, { guia_contenedor: e.target.value })}
                          style={{ ...INPUT, height: "30px", fontSize: "11px", fontFamily: "monospace" }} />
                      </div>
                      <div>
                        <label style={MINI_LABEL}>Placa VM</label>
                        <input type="text" value={cont.placa_vm ?? ""}
                          onChange={e => updateCont(cIdx, ctIdx, { placa_vm: e.target.value || undefined })}
                          style={{ ...INPUT, height: "30px", fontSize: "11px", fontFamily: "monospace" }} />
                      </div>
                      <button type="button" onClick={() => removeCont(cIdx, ctIdx)}
                        style={{ ...BUTTON_DANGER, height: "30px", padding: "0 8px", fontSize: "10px" }}>
                        ✕
                      </button>
                    </div>
                  ))}

                  <button type="button" onClick={() => addCont(cIdx)}
                    style={{ ...DASHED_BUTTON, padding: "6px", fontSize: "11px" }}>
                    + Agregar contenedor
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addCarro} style={DASHED_BUTTON}>+ Agregar otro carro</button>
          </div>
        )}
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
const DASHED_BUTTON: React.CSSProperties = {
  width: "100%", padding: "10px",
  borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)",
  background: "transparent", color: "var(--color-text-muted)",
  fontSize: "12px", fontWeight: 600, cursor: "pointer",
};
const BUTTON_DANGER: React.CSSProperties = {
  padding: "8px 12px", fontSize: "11px", fontWeight: 600, height: "36px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)", cursor: "pointer",
};
const MINI_LABEL: React.CSSProperties = {
  display: "block", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px", fontWeight: 500,
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
