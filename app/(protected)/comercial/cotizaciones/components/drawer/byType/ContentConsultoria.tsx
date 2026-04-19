"use client";
import { useState } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";

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

// Unidades de cobro para Consultoría
const UNITS_CONSULTORIA = [
  "Por hora",
  "Por día",
  "Por sesión",
  "Por proyecto",
  "Por persona",
  "Por clasificación arancelaria",
  "Por trámite",
  "Por servicio",
  "Otro",
];

interface LineDraft {
  description: string;
  quantity:    string;
  unit_label:  string;
  unit_price:  string;
  currency:    string;
  tax_rate:    number;
  notes:       string;
}

const EMPTY_LINE = (): LineDraft => ({
  description: "", quantity: "", unit_label: "Por hora",
  unit_price: "", currency: "MXN", tax_rate: 16, notes: "",
});

type Props = {
  info:               ConsultoriaInfo;
  setInfo:            React.Dispatch<React.SetStateAction<ConsultoriaInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentConsultoria({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [addingConcept, setAddingConcept] = useState(false);
  const [conceptForm,   setConceptForm]   = useState({ product_id: "", description: "", currency: "MXN" });
  const [lineForm,      setLineForm]      = useState<LineDraft>(EMPTY_LINE());
  const [editingLine,   setEditingLine]   = useState<number | null>(null);

  const autoTotal = (Number(lineForm.quantity) || 0) * (Number(lineForm.unit_price) || 0);

  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description  ?? "",
      quantity:    String(line.quantity  ?? ""),
      unit_label:  line.unit_label   ?? "Por hora",
      unit_price:  String(line.unit_price ?? ""),
      currency:    line.currency     ?? "MXN",
      tax_rate:    line.tax_rate     ?? 16,
      notes:       line.notes        ?? "",
    });
    setEditingLine(li);
    setBillingConcepts(p => p.map((c, i) => i === ci
      ? { ...c, lines: c.lines.filter((_, j) => j !== li) }
      : c
    ));
  }

  function addLine(ci: number) {
    if (!lineForm.description.trim() || !lineForm.unit_price || !lineForm.quantity) return;
    setBillingConcepts(p => p.map((c, i) => i === ci ? {
      ...c, lines: [...c.lines, {
        service_type: "consultoria" as any,
        description:  lineForm.description,
        currency:     lineForm.currency,
        price:        autoTotal,
        quantity:     Number(lineForm.quantity),
        unit_price:   Number(lineForm.unit_price),
        unit_label:   lineForm.unit_label || undefined,
        tax_rate:     lineForm.tax_rate,
        notes:        lineForm.notes || undefined,
      }],
    } : c));
    setLineForm(EMPTY_LINE());
    setEditingLine(null);
  }

  function createConcept() {
    if (!conceptForm.description.trim()) return;
    const tempId = Date.now().toString();
    setBillingConcepts(p => [...p, {
      tempId,
      product_id:  conceptForm.product_id || undefined,
      description: conceptForm.description,
      currency:    conceptForm.currency,
      lines:       [],
    }]);
    setActiveConcept(tempId);
    setConceptForm({ product_id: "", description: "", currency: "MXN" });
    setAddingConcept(false);
  }

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
      <div>
        <SectionTitle>Conceptos de facturación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>

          {billingConcepts.map((concept, ci) => {
            const isActive = activeConcept === concept.tempId;
            const conceptTotal: Record<string, number> = {};
            concept.lines.forEach(l => {
              const cur = (l as any).currency ?? "MXN";
              conceptTotal[cur] = (conceptTotal[cur] ?? 0) + Number(l.price);
            });
            const prodName = svcCatalog.find((p: any) => p.id === concept.product_id)?.name;

            return (
              <div key={concept.tempId} style={{ borderRadius: "var(--radius-md)", border: `2px solid ${isActive ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, overflow: "hidden" }}>

                {/* Header */}
                <div onClick={() => setActiveConcept(isActive ? null : concept.tempId)}
                  style={{ padding: "10px 14px", background: isActive ? "var(--color-info-bg)" : "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", border: "1px solid var(--color-brand-blue)30" }}>CFDI</span>
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{prodName ?? concept.description}</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {Object.entries(conceptTotal).map(([cur, tot]) => (
                      <span key={cur} style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-success-text)" }}>
                        {cur} ${tot.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    ))}
                  </div>
                  <span style={{ color: "var(--color-text-muted)" }}>{isActive ? "▲" : "▼"}</span>
                  <button onClick={e => { e.stopPropagation(); setBillingConcepts(p => p.filter((_, i) => i !== ci)); }}
                    style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {isActive && (
                  <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "8px" }}>

                    {/* Líneas existentes */}
                    {concept.lines.map((line, li) => {
                      const qty      = (line as any).quantity  ?? 1;
                      const uPrice   = (line as any).unit_price ?? 0;
                      const uLabel   = (line as any).unit_label ?? "";
                      const cur      = (line as any).currency  ?? "MXN";
                      const taxLabel = (line as any).tax_rate === -1 ? "Exento" : (line as any).tax_rate === 0 ? "0%" : `IVA ${(line as any).tax_rate ?? 16}%`;
                      return (
                        <div key={li} style={{ padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line.description}</div>
                              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                {qty} {uLabel} × {cur} ${Number(uPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })} · {taxLabel}
                                {(line as any).notes && ` · ${(line as any).notes}`}
                              </div>
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)", flexShrink: 0 }}>
                              {cur} ${Number(line.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                            <button onClick={() => startEditLine(ci, li)}
                              style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", color: "var(--color-info-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => setBillingConcepts(p => p.map((c, i) => i === ci ? { ...c, lines: c.lines.filter((_, j) => j !== li) } : c))}
                              style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Form línea */}
                    <div style={{ background: "var(--color-bg-base)", border: `1px dashed ${editingLine !== null ? "var(--color-warning-border)" : "var(--color-border)"}`, borderRadius: "var(--radius-md)", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: editingLine !== null ? "var(--color-warning-text)" : "var(--color-text-muted)", textTransform: "uppercase" }}>
                        {editingLine !== null ? "✏️ Editando línea" : "+ Nueva línea de detalle"}
                      </div>

                      <Field label="Descripción *">
                        <input value={lineForm.description} onChange={e => setLineForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Honorarios consultoría, gastos de viaje, materiales…" style={INPUT} />
                      </Field>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "8px" }}>
                        <Field label="Cantidad *">
                          <input type="number" value={lineForm.quantity}
                            onChange={e => setLineForm(p => ({ ...p, quantity: e.target.value }))}
                            placeholder="ej: 8" style={INPUT} />
                        </Field>
                        <Field label="Unidad de cobro *">
                          <select value={lineForm.unit_label} onChange={e => setLineForm(p => ({ ...p, unit_label: e.target.value }))} style={SELECT}>
                            {UNITS_CONSULTORIA.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </Field>
                        <Field label="Precio unitario *">
                          <input type="number" value={lineForm.unit_price}
                            onChange={e => setLineForm(p => ({ ...p, unit_price: e.target.value }))}
                            placeholder="0.00" style={INPUT} />
                        </Field>
                        <Field label="Total (auto)">
                          <div style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-success-text)", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center" }}>
                            ${autoTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </div>
                        </Field>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
                        <Field label="Moneda">
                          <select value={lineForm.currency} onChange={e => setLineForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                          </select>
                        </Field>
                        <Field label="IVA">
                          <select value={String(lineForm.tax_rate)} onChange={e => setLineForm(p => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
                            <option value="16">IVA 16%</option>
                            <option value="0">Tasa 0%</option>
                            <option value="-1">Exento</option>
                            <option value="8">IVA 8%</option>
                          </select>
                        </Field>
                        <Field label="Notas">
                          <input value={lineForm.notes} onChange={e => setLineForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Observaciones…" style={INPUT} />
                        </Field>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => addLine(ci)} disabled={!lineForm.description.trim() || !lineForm.unit_price || !lineForm.quantity}
                          style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                          {editingLine !== null ? "Guardar cambios" : "+ Agregar línea"}
                        </button>
                        {editingLine !== null && (
                          <button onClick={() => { setLineForm(EMPTY_LINE()); setEditingLine(null); }}
                            style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Agregar concepto */}
          {!addingConcept ? (
            <button onClick={() => setAddingConcept(true)}
              style={{ height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar concepto de facturación
            </button>
          ) : (
            <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "2px solid var(--color-brand-blue)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", textTransform: "uppercase" }}>Nuevo concepto de facturación</div>
              <Field label="Concepto del catálogo — para CFDI (no aparece en PDF)">
                <select value={conceptForm.product_id} onChange={e => setConceptForm(p => ({ ...p, product_id: e.target.value }))} style={SELECT}>
                  <option value="">— Sin vincular —</option>
                  {svcCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                </select>
              </Field>
              <Field label="Nombre del concepto (visible en PDF) *">
                <input value={conceptForm.description} onChange={e => setConceptForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="ej: Consultoría en Clasificación Arancelaria" style={INPUT} />
              </Field>
              <Field label="Moneda principal">
                <select value={conceptForm.currency} onChange={e => setConceptForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </Field>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={createConcept} disabled={!conceptForm.description.trim()}
                  style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Crear concepto
                </button>
                <button onClick={() => { setAddingConcept(false); setConceptForm({ product_id: "", description: "", currency: "MXN" }); }}
                  style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
