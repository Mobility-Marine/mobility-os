"use client";

import type { Autotransporte } from "../../types/carta_porte.types";

interface Props {
  data: Autotransporte;
  setData: (next: Autotransporte) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

const CONFIG_VEHICULAR = [
  { code: "C2",  label: "C2 — Camión 2 ejes" },
  { code: "C3",  label: "C3 — Camión 3 ejes" },
  { code: "T3S2", label: "T3S2 — Tractocamión articulado" },
  { code: "T3S3", label: "T3S3 — Tractocamión articulado" },
  { code: "T3S2R4", label: "T3S2R4 — Doblemente articulado" },
];

export function AutotransporteForm({ data, setData }: Props) {
  const update = (patch: Partial<Autotransporte>) => setData({ ...data, ...patch });

  const updateIdentVehic = (patch: Partial<Autotransporte["ident_vehicular"]>) => {
    setData({ ...data, ident_vehicular: { ...data.ident_vehicular, ...patch } });
  };

  const updateSeguros = (patch: Partial<Autotransporte["seguros"]>) => {
    setData({ ...data, seguros: { ...data.seguros, ...patch } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Permiso SCT */}
      <Section title="Permiso SCT">
        <Grid>
          <FieldS label="Tipo de permiso SCT" required>
            <input type="text" value={data.perm_sct}
              onChange={e => update({ perm_sct: e.target.value.toUpperCase() })}
              maxLength={10} placeholder="TPAF01"
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Núm. permiso SCT" required>
            <input type="text" value={data.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              style={INPUT} />
          </FieldS>
        </Grid>
      </Section>

      {/* Identificación vehicular */}
      <Section title="Identificación vehicular">
        <Grid>
          <FieldS label="Configuración vehicular" required>
            <select value={data.ident_vehicular.config_vehicular}
              onChange={e => updateIdentVehic({ config_vehicular: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona…</option>
              {CONFIG_VEHICULAR.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </FieldS>
          <FieldS label="Placa vehículo motor" required>
            <input type="text" value={data.ident_vehicular.placa_vm}
              onChange={e => updateIdentVehic({ placa_vm: e.target.value.toUpperCase() })}
              maxLength={7}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Año del modelo" required>
            <input type="number" min="1980" max="2100"
              value={data.ident_vehicular.anio_modelo_vm || ""}
              onChange={e => updateIdentVehic({ anio_modelo_vm: parseInt(e.target.value) || 0 })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Peso bruto vehicular (ton)">
            <input type="number" min="0" step="0.001"
              value={data.ident_vehicular.peso_bruto_vehicular ?? ""}
              onChange={e => updateIdentVehic({ peso_bruto_vehicular: parseFloat(e.target.value) || undefined })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Seguros */}
      <Section title="Seguros (mínimo: responsabilidad civil)">
        <Grid>
          <FieldS label="Aseguradora resp. civil" required>
            <input type="text" value={data.seguros.asegura_resp_civil}
              onChange={e => updateSeguros({ asegura_resp_civil: e.target.value })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Póliza resp. civil" required>
            <input type="text" value={data.seguros.poliza_resp_civil}
              onChange={e => updateSeguros({ poliza_resp_civil: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Aseguradora medio amb.">
            <input type="text" value={data.seguros.asegura_med_ambiente ?? ""}
              onChange={e => updateSeguros({ asegura_med_ambiente: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Póliza medio ambiente">
            <input type="text" value={data.seguros.poliza_med_ambiente ?? ""}
              onChange={e => updateSeguros({ poliza_med_ambiente: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Aseguradora carga">
            <input type="text" value={data.seguros.asegura_carga ?? ""}
              onChange={e => updateSeguros({ asegura_carga: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Póliza carga">
            <input type="text" value={data.seguros.poliza_carga ?? ""}
              onChange={e => updateSeguros({ poliza_carga: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Prima seguro carga">
            <input type="number" min="0" step="0.01"
              value={data.seguros.prima_seguro ?? ""}
              onChange={e => updateSeguros({ prima_seguro: parseFloat(e.target.value) || undefined })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Remolques */}
      <Section title="Remolques (opcional, hasta 2)">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(data.remolques ?? []).map((r, idx) => (
            <div key={idx} style={{
              padding: "12px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                Remolque #{idx + 1}
              </div>
              <Grid>
                <FieldS label="Subtipo">
                  <input type="text" value={r.subtipo_rem}
                    onChange={e => {
                      const next = [...(data.remolques ?? [])];
                      next[idx] = { ...r, subtipo_rem: e.target.value };
                      update({ remolques: next });
                    }}
                    style={INPUT} />
                </FieldS>
                <FieldS label="Placa">
                  <input type="text" value={r.placa}
                    onChange={e => {
                      const next = [...(data.remolques ?? [])];
                      next[idx] = { ...r, placa: e.target.value.toUpperCase() };
                      update({ remolques: next });
                    }}
                    style={{ ...INPUT, fontFamily: "monospace" }} />
                </FieldS>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button type="button"
                    onClick={() => update({ remolques: (data.remolques ?? []).filter((_, i) => i !== idx) })}
                    style={BUTTON_DANGER}>
                    Eliminar
                  </button>
                </div>
              </Grid>
            </div>
          ))}
          {(data.remolques ?? []).length < 2 && (
            <button type="button"
              onClick={() => update({ remolques: [...(data.remolques ?? []), { subtipo_rem: "", placa: "" }] })}
              style={{ ...BUTTON_GHOST, alignSelf: "flex-start" }}>
              + Agregar remolque
            </button>
          )}
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
