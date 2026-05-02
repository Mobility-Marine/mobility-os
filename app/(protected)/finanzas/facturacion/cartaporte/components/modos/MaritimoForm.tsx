"use client";

// ═══════════════════════════════════════════════════════════════════════
// MaritimoForm — Transporte marítimo
// Embarcación + carga + línea naviera + contenedores
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { TransporteMaritimo, ContenedorMaritimo } from "../../types/carta_porte.types";

interface Props {
  data: TransporteMaritimo;
  setData: (next: TransporteMaritimo) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function MaritimoForm({ data, setData }: Props) {
  const { items: tiposEmb }   = useSATCatalog("tipo_embarcacion");
  const { items: tiposCarga } = useSATCatalog("tipo_carga");
  const { items: paises }     = useSATCatalog("paises_comunes");

  const update = (patch: Partial<TransporteMaritimo>) => setData({ ...data, ...patch });

  const addContenedor = () => {
    const nuevo: ContenedorMaritimo = { matricula_contenedor: "", tipo_contenedor: "" };
    update({ contenedores: [...(data.contenedores ?? []), nuevo] });
  };
  const updateContenedor = (idx: number, patch: Partial<ContenedorMaritimo>) => {
    const list = [...(data.contenedores ?? [])];
    list[idx] = { ...list[idx], ...patch };
    update({ contenedores: list });
  };
  const removeContenedor = (idx: number) => {
    update({ contenedores: (data.contenedores ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Permiso SCT */}
      <Section title="Permiso SCT (opcional)">
        <Grid>
          <FieldS label="Tipo de permiso SCT">
            <input type="text" value={data.perm_sct ?? ""}
              onChange={e => update({ perm_sct: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Número de permiso SCT">
            <input type="text" value={data.num_permiso_sct ?? ""}
              onChange={e => update({ num_permiso_sct: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Embarcación */}
      <Section title="Embarcación" subtitle="Datos del buque que transporta la carga">
        <FieldS label="Tipo de embarcación" required>
          <select value={data.tipo_embarcacion}
            onChange={e => update({ tipo_embarcacion: e.target.value })}
            style={INPUT}>
            <option value="">Selecciona tipo...</option>
            {tiposEmb.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
          </select>
        </FieldS>

        <Grid>
          <FieldS label="Matrícula" required>
            <input type="text" value={data.matricula}
              onChange={e => update({ matricula: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Número OMI" required hint="Identificador único OMI (7 dígitos)">
            <input type="text" value={data.numero_omi}
              onChange={e => update({ numero_omi: e.target.value })}
              maxLength={7}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Nombre embarcación" required>
            <input type="text" value={data.nombre_embarc}
              onChange={e => update({ nombre_embarc: e.target.value })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Nacionalidad" required>
            <select value={data.nacionalidad_embarc}
              onChange={e => update({ nacionalidad_embarc: e.target.value })}
              style={INPUT}>
              {paises.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </FieldS>
          <FieldS label="Año construcción" required>
            <input type="number" min="1900" max="2100"
              value={data.anio_embarcacion}
              onChange={e => update({ anio_embarcacion: parseInt(e.target.value, 10) || new Date().getFullYear() })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Unidades arqueo bruto" required>
            <input type="number" min="0"
              value={data.unidades_de_arq_bruto || ""}
              onChange={e => update({ unidades_de_arq_bruto: parseInt(e.target.value, 10) || 0 })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
        </Grid>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--color-border-faint)" }}>
          <FieldS label="Eslora (m)" required>
            <input type="number" min="0" step="0.01" value={data.eslora || ""}
              onChange={e => update({ eslora: parseFloat(e.target.value) || 0 })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Manga (m)" required>
            <input type="number" min="0" step="0.01" value={data.manga || ""}
              onChange={e => update({ manga: parseFloat(e.target.value) || 0 })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
          <FieldS label="Calado (m)" required>
            <input type="number" min="0" step="0.01" value={data.calado || ""}
              onChange={e => update({ calado: parseFloat(e.target.value) || 0 })}
              style={{ ...INPUT, textAlign: "right" }} />
          </FieldS>
        </div>
      </Section>

      {/* Carga y seguros */}
      <Section title="Carga y seguros">
        <Grid>
          <FieldS label="Tipo de carga" required>
            <select value={data.tipo_carga}
              onChange={e => update({ tipo_carga: e.target.value })}
              style={INPUT}>
              <option value="">Selecciona...</option>
              {tiposCarga.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </FieldS>
          <FieldS label="Núm. certificado ITC">
            <input type="text" value={data.num_cert_itc ?? ""}
              onChange={e => update({ num_cert_itc: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Aseguradora">
            <input type="text" value={data.nombre_aseg ?? ""}
              onChange={e => update({ nombre_aseg: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Núm. póliza">
            <input type="text" value={data.num_poliza_seguro ?? ""}
              onChange={e => update({ num_poliza_seguro: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Línea naviera */}
      <Section title="Línea naviera y viaje (opcional)">
        <Grid>
          <FieldS label="Línea naviera" hint="Ej: MSC, Maersk, Hapag-Lloyd">
            <input type="text" value={data.linea_naviera ?? ""}
              onChange={e => update({ linea_naviera: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Agente naviero">
            <input type="text" value={data.nombre_agente_naviero ?? ""}
              onChange={e => update({ nombre_agente_naviero: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Núm. autorización agente">
            <input type="text" value={data.num_autorizacion_naviero ?? ""}
              onChange={e => update({ num_autorizacion_naviero: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Número de viaje">
            <input type="text" value={data.num_viaje ?? ""}
              onChange={e => update({ num_viaje: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Conocimiento embarque (B/L)">
            <input type="text" value={data.num_conoc_embarc ?? ""}
              onChange={e => update({ num_conoc_embarc: e.target.value || undefined })}
              placeholder="Bill of Lading number"
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Contenedores */}
      <Section title="Contenedores" subtitle="Contenedores transportados en este viaje">
        {(data.contenedores ?? []).length === 0 ? (
          <button type="button" onClick={addContenedor} style={DASHED_BUTTON}>
            + Agregar contenedor
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(data.contenedores ?? []).map((c, idx) => (
              <div key={idx} style={{
                padding: "12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
              }}>
                <Grid>
                  <FieldS label="Matrícula" required>
                    <input type="text" value={c.matricula_contenedor}
                      onChange={e => updateContenedor(idx, { matricula_contenedor: e.target.value.toUpperCase() })}
                      placeholder="MSCU1234567"
                      style={{ ...INPUT, fontFamily: "monospace" }} />
                  </FieldS>
                  <FieldS label="Tipo" required>
                    <input type="text" value={c.tipo_contenedor}
                      onChange={e => updateContenedor(idx, { tipo_contenedor: e.target.value })}
                      placeholder="20', 40' HC, 40' RF..."
                      style={INPUT} />
                  </FieldS>
                  <FieldS label="Núm. precinto">
                    <input type="text" value={c.num_precinto ?? ""}
                      onChange={e => updateContenedor(idx, { num_precinto: e.target.value || undefined })}
                      style={{ ...INPUT, fontFamily: "monospace" }} />
                  </FieldS>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button type="button" onClick={() => removeContenedor(idx)} style={BUTTON_DANGER}>
                      Eliminar
                    </button>
                  </div>
                </Grid>
              </div>
            ))}
            <button type="button" onClick={addContenedor} style={DASHED_BUTTON}>
              + Agregar otro contenedor
            </button>
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
