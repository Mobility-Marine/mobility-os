"use client";
import { Field, SectionTitle, INPUT, SELECT } from "../drawerShared";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type TipoConsultoria =
  | "aduanal"
  | "logistica"
  | "comercio_exterior"
  | "clasificacion_arancelaria"
  | "certificacion"
  | "capacitacion"
  | "auditoria"
  | "otro";

interface Entregable {
  descripcion: string;
  plazo:       string;
}

export interface ConsultoriaInfo {
  tipo:                   TipoConsultoria;
  descripcion_general:    string;
  alcance:                string;
  entregables:            Entregable[];
  duracion_estimada:      string;
  unidad_duracion:        string;
  modalidad:              string;
  lugar:                  string;
  incluye_viajes:         boolean;
  costo_viajes_estimado:  string;
  nombre_consultor:       string;
  observaciones:          string;
}

export const EMPTY_CONSULTORIA_INFO = (): ConsultoriaInfo => ({
  tipo:                  "aduanal",
  descripcion_general:   "",
  alcance:               "",
  entregables:           [{ descripcion: "", plazo: "" }],
  duracion_estimada:     "",
  unidad_duracion:       "horas",
  modalidad:             "presencial",
  lugar:                 "",
  incluye_viajes:        false,
  costo_viajes_estimado: "",
  nombre_consultor:      "",
  observaciones:         "",
});

const TIPOS_CONSULTORIA: { value: TipoConsultoria; label: string; desc: string }[] = [
  { value: "aduanal",                   label: "Aduanal",                    desc: "Trámites, clasificación, NEEC" },
  { value: "logistica",                 label: "Logística",                  desc: "Cadena de suministro, optimización" },
  { value: "comercio_exterior",         label: "Comercio Exterior",          desc: "Regulaciones, acuerdos comerciales" },
  { value: "clasificacion_arancelaria", label: "Clasificación Arancelaria",  desc: "Fracciones, criterios SAT" },
  { value: "certificacion",             label: "Certificación",              desc: "OEA, CTPAT, ISO, C-TPAT" },
  { value: "capacitacion",              label: "Capacitación",               desc: "Cursos, talleres, entrenamientos" },
  { value: "auditoria",                 label: "Auditoría",                  desc: "Revisión procesos y cumplimiento" },
  { value: "otro",                      label: "Otro",                       desc: "Otro tipo de consultoría" },
];

const UNIDADES_DURACION = ["horas","días","semanas","meses","sesiones","eventos"];
const MODALIDADES        = ["presencial","virtual","híbrido"];

type Props = {
  info:               ConsultoriaInfo;
  setInfo:            React.Dispatch<React.SetStateAction<ConsultoriaInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentConsultoria({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── TIPO DE CONSULTORÍA ── */}
      <div>
        <SectionTitle>Tipo de consultoría</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
          {TIPOS_CONSULTORIA.map(opt => (
            <button key={opt.value} onClick={() => setInfo(p => ({ ...p, tipo: opt.value }))}
              style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.tipo === opt.value ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.tipo === opt.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: info.tipo === opt.value ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{opt.label}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── DESCRIPCIÓN Y ALCANCE ── */}
      <div>
        <SectionTitle>Descripción del servicio</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción general *">
            <input value={info.descripcion_general}
              onChange={e => setInfo(p => ({ ...p, descripcion_general: e.target.value }))}
              placeholder="Consultoría en clasificación arancelaria para operaciones de importación…" style={INPUT} />
          </Field>
          <Field label="Alcance del servicio" hint="Qué incluye y qué no incluye">
            <textarea value={info.alcance}
              onChange={e => setInfo(p => ({ ...p, alcance: e.target.value }))}
              placeholder="Revisión de hasta 50 fracciones arancelarias, presentación de criterios SAT, resoluciones anticipadas…"
              rows={3}
              style={{ ...INPUT, height: "auto", padding: "8px 12px", resize: "vertical" as const }} />
          </Field>
        </div>
      </div>

      {/* ── ENTREGABLES ── */}
      <div>
        <SectionTitle>Entregables</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
          {info.entregables.map((ent, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <Field label={i === 0 ? "Descripción del entregable" : ""}>
                <input value={ent.descripcion}
                  onChange={e => setInfo(p => ({ ...p, entregables: p.entregables.map((en, j) => j === i ? { ...en, descripcion: e.target.value } : en) }))}
                  placeholder="Informe de clasificación, manual, presentación…" style={INPUT} />
              </Field>
              <Field label={i === 0 ? "Plazo estimado" : ""}>
                <input value={ent.plazo}
                  onChange={e => setInfo(p => ({ ...p, entregables: p.entregables.map((en, j) => j === i ? { ...en, plazo: e.target.value } : en) }))}
                  placeholder="5 días hábiles" style={INPUT} />
              </Field>
              {info.entregables.length > 1 && (
                <button onClick={() => setInfo(p => ({ ...p, entregables: p.entregables.filter((_, j) => j !== i) }))}
                  style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer" }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, entregables: [...p.entregables, { descripcion: "", plazo: "" }] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar entregable
          </button>
        </div>
      </div>

      {/* ── LOGÍSTICA ── */}
      <div>
        <SectionTitle>Logística del servicio</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Duración estimada">
              <input type="number" value={info.duracion_estimada}
                onChange={e => setInfo(p => ({ ...p, duracion_estimada: e.target.value }))}
                placeholder="8" style={INPUT} />
            </Field>
            <Field label="Unidad">
              <select value={info.unidad_duracion} onChange={e => setInfo(p => ({ ...p, unidad_duracion: e.target.value }))} style={SELECT}>
                {UNIDADES_DURACION.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Modalidad">
              <select value={info.modalidad} onChange={e => setInfo(p => ({ ...p, modalidad: e.target.value }))} style={SELECT}>
                {MODALIDADES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
            <Field label="Lugar / Plataforma" hint="Instalaciones del cliente, Zoom, Teams, CDMX…">
              <input value={info.lugar}
                onChange={e => setInfo(p => ({ ...p, lugar: e.target.value }))}
                placeholder="Instalaciones del cliente, Monterrey / Zoom" style={INPUT} />
            </Field>
            <Field label="Consultor asignado">
              <input value={info.nombre_consultor}
                onChange={e => setInfo(p => ({ ...p, nombre_consultor: e.target.value }))}
                placeholder="Nombre del consultor" style={INPUT} />
            </Field>
          </div>

          {/* Viajes */}
          <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: info.incluye_viajes ? "10px" : "0" }}>
              <input type="checkbox" id="viajes" checked={info.incluye_viajes}
                onChange={e => setInfo(p => ({ ...p, incluye_viajes: e.target.checked }))} />
              <label htmlFor="viajes" style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}>
                Incluye viajes / gastos de desplazamiento
              </label>
            </div>
            {info.incluye_viajes && (
              <Field label="Costo estimado de viajes (MXN)">
                <input type="number" value={info.costo_viajes_estimado}
                  onChange={e => setInfo(p => ({ ...p, costo_viajes_estimado: e.target.value }))}
                  placeholder="0.00" style={INPUT} />
              </Field>
            )}
          </div>

          <Field label="Observaciones adicionales">
            <input value={info.observaciones}
              onChange={e => setInfo(p => ({ ...p, observaciones: e.target.value }))}
              placeholder="Condiciones especiales, prerequisitos, materiales necesarios…" style={INPUT} />
          </Field>
        </div>
      </div>

      {/* ── CONCEPTOS DE FACTURACIÓN ── */}
      <StepConceptos
        billingConcepts={billingConcepts}
        setBillingConcepts={setBillingConcepts}
        svcCatalog={svcCatalog}
      />
    </div>
  );
}