"use client";
import { useState, useEffect } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CONTAINER_TYPES, CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";

type Contenedor = { tipo: string; cantidad: number };
type Bulto      = { largo_cm: string; ancho_cm: string; alto_cm: string; peso_kg: string; cantidad: string };

export interface MaritimoInfo {
  subtipo:         "fcl" | "lcl";
  puerto_origen:   string;
  puerto_destino:  string;
  incoterm:        string;
  mercancia:       string;
  valor_comercial: string;
  valor_moneda:    string;
  peso_kg:         string;
  contenedores:    Contenedor[];
  bultos:          Bulto[];
}

const EMPTY_CONTENEDOR = (): Contenedor => ({ tipo: "40'HC", cantidad: 1 });
const EMPTY_BULTO      = (): Bulto      => ({ largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" });

export const EMPTY_MARITIMO_INFO = (): MaritimoInfo => ({
  subtipo: "fcl", puerto_origen: "", puerto_destino: "", incoterm: "",
  mercancia: "", valor_comercial: "", valor_moneda: "USD", peso_kg: "",
  contenedores: [EMPTY_CONTENEDOR()], bultos: [],
});

// Unidades de cobro por subtipo
const UNITS_FCL = ["Por contenedor", "Por BL", "Por embarque", "Por servicio", "Por factura", "Por trámite"];
const UNITS_LCL = ["Por W/M", "Por CBM", "Por tonelada", "Por BL", "Por embarque", "Por servicio", "Por factura"];

interface LineDraft {
  description: string;
  quantity:    string;
  unit_label:  string;
  unit_price:  string;
  currency:    string;
  tax_rate:    number;
  notes:       string;
}

const EMPTY_LINE = (currency: string, unit: string, qty: string): LineDraft => ({
  description: "", quantity: qty, unit_label: unit,
  unit_price: "", currency, tax_rate: 0, notes: "",
});

type Props = {
  info:               MaritimoInfo;
  setInfo:            React.Dispatch<React.SetStateAction<MaritimoInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentMaritimo({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [addingConcept, setAddingConcept] = useState(false);
  const [conceptForm,   setConceptForm]   = useState({ product_id: "", description: "", currency: "USD" });
  const [lineForm,      setLineForm]      = useState<LineDraft>(EMPTY_LINE("USD", "Por contenedor", "1"));

  // Cálculos automáticos
  const totalContenedores = info.contenedores.reduce((s, c) => s + c.cantidad, 0);
  const cbmTotal  = info.bultos.reduce((s, b) => s + (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm) / 1_000_000) * Number(b.cantidad || 1), 0);
  const pesoTotal = info.bultos.reduce((s, b) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
  const wmTotal   = Math.max(cbmTotal, pesoTotal / 1000);

  // Al cambiar subtipo, actualizar defaults del lineForm
  useEffect(() => {
    if (info.subtipo === "fcl") {
      setLineForm(EMPTY_LINE("USD", "Por contenedor", String(totalContenedores || 1)));
    } else {
      setLineForm(EMPTY_LINE("USD", "Por W/M", wmTotal > 0 ? wmTotal.toFixed(3) : ""));
    }
  }, [info.subtipo]);

  // Actualizar cantidad automática cuando cambian contenedores o W/M
  useEffect(() => {
    if (info.subtipo === "fcl" && totalContenedores > 0) {
      setLineForm(p => ({ ...p, quantity: String(totalContenedores) }));
    }
  }, [totalContenedores]);

  useEffect(() => {
    if (info.subtipo === "lcl" && wmTotal > 0) {
      setLineForm(p => ({ ...p, quantity: wmTotal.toFixed(3) }));
    }
  }, [wmTotal]);

  const autoTotal = (Number(lineForm.quantity) || 0) * (Number(lineForm.unit_price) || 0);
  const unitOptions = info.subtipo === "fcl" ? UNITS_FCL : UNITS_LCL;

  function addLine(ci: number, concept: BillingConceptDraft) {
    if (!lineForm.description.trim() || !lineForm.unit_price) return;
    const price = autoTotal;
    setBillingConcepts(p => p.map((c, i) => i === ci ? {
      ...c, lines: [...c.lines, {
        service_type: "maritimo" as any,
        description:  lineForm.description,
        currency:     lineForm.currency,
        price,
        quantity:     Number(lineForm.quantity) || 1,
        unit_price:   Number(lineForm.unit_price),
        unit_label:   lineForm.unit_label || undefined,
        tax_rate:     lineForm.tax_rate,
        notes:        lineForm.notes || undefined,
      }],
    } : c));
    setLineForm(EMPTY_LINE(
      concept.currency,
      info.subtipo === "fcl" ? "Por contenedor" : "Por W/M",
      info.subtipo === "fcl" ? String(totalContenedores) : wmTotal > 0 ? wmTotal.toFixed(3) : "",
    ));
  }

  function createConcept() {
    if (!conceptForm.description.trim()) return;
    const tempId = Date.now().toString();
    setBillingConcepts(p => [...p, { tempId, product_id: conceptForm.product_id || undefined, description: conceptForm.description, currency: conceptForm.currency, lines: [] }]);
    setActiveConcept(tempId);
    setConceptForm({ product_id: "", description: "", currency: "USD" });
    setAddingConcept(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── SUBTIPO ── */}
      <div>
        <SectionTitle>Tipo de servicio marítimo</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {(["fcl","lcl"] as const).map(sub => (
            <button key={sub} onClick={() => setInfo(p => ({ ...p, subtipo: sub }))}
              style={{ padding: "14px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.subtipo === sub ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>
                {sub === "fcl" ? "FCL — Full Container Load" : "LCL — Less than Container Load"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                {sub === "fcl" ? "Contenedor(es) completo(s) dedicados" : "Carga consolidada — se cobra por W/M"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── PUERTOS ── */}
      <div>
        <SectionTitle>Puertos e Incoterm</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
          <Field label="Puerto de origen *">
            <input value={info.puerto_origen} onChange={e => setInfo(p => ({ ...p, puerto_origen: e.target.value }))} placeholder="Shanghai, China" style={INPUT} />
          </Field>
          <Field label="Puerto de destino *">
            <input value={info.puerto_destino} onChange={e => setInfo(p => ({ ...p, puerto_destino: e.target.value }))} placeholder="Manzanillo, México" style={INPUT} />
          </Field>
          <Field label="Incoterm">
            <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
              <option value="">—</option>
              {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción *">
            <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))} placeholder="Electrónicos, textiles, maquinaria…" style={INPUT} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor comercial">
              <input type="number" value={info.valor_comercial} onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))} placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda">
              <select value={info.valor_moneda} onChange={e => setInfo(p => ({ ...p, valor_moneda: e.target.value }))} style={SELECT}>
                {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Peso total (kg)">
              <input type="number" value={info.peso_kg} onChange={e => setInfo(p => ({ ...p, peso_kg: e.target.value }))} placeholder="0" style={INPUT} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── FCL: Contenedores ── */}
      {info.subtipo === "fcl" && (
        <div>
          <SectionTitle>Contenedores a cotizar</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {info.contenedores.map((cont, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
                <Field label={i === 0 ? "Tipo de contenedor" : ""}>
                  <select value={cont.tipo} onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, tipo: e.target.value } : c) }))} style={SELECT}>
                    {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label={i === 0 ? "Cantidad" : ""}>
                  <input type="number" min="1" value={cont.cantidad}
                    onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, cantidad: Number(e.target.value) } : c) }))}
                    style={INPUT} />
                </Field>
                {info.contenedores.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, contenedores: p.contenedores.filter((_, j) => j !== i) }))}
                    style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer", fontSize: "12px" }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setInfo(p => ({ ...p, contenedores: [...p.contenedores, EMPTY_CONTENEDOR()] }))}
              style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
              + Agregar tipo de contenedor
            </button>
            {totalContenedores > 0 && (
              <InfoBox type="info">
                Total: <strong>{totalContenedores} contenedor{totalContenedores !== 1 ? "es" : ""}</strong> — la cantidad en los conceptos se asignará automáticamente
              </InfoBox>
            )}
          </div>
        </div>
      )}

      {/* ── LCL: Bultos ── */}
      {info.subtipo === "lcl" && (
        <div>
          <SectionTitle>Bultos / Partidas</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {info.bultos.map((bulto, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Bulto {i + 1}</span>
                  <button onClick={() => setInfo(p => ({ ...p, bultos: p.bultos.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                  {(["largo_cm","ancho_cm","alto_cm","peso_kg","cantidad"] as const).map(key => (
                    <Field key={key} label={key === "largo_cm" ? "Largo (cm)" : key === "ancho_cm" ? "Ancho (cm)" : key === "alto_cm" ? "Alto (cm)" : key === "peso_kg" ? "Peso (kg)" : "Cantidad"}>
                      <input type="number" value={bulto[key]} min="0"
                        onChange={e => setInfo(p => ({ ...p, bultos: p.bultos.map((b, j) => j === i ? { ...b, [key]: e.target.value } : b) }))}
                        style={INPUT} />
                    </Field>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setInfo(p => ({ ...p, bultos: [...p.bultos, EMPTY_BULTO()] }))}
              style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
              + Agregar bulto
            </button>
            {cbmTotal > 0 && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>CBM Total</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{cbmTotal.toFixed(3)} m³</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Peso Total</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoTotal.toFixed(0)} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase" }}>W/M Cobrable</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{wmTotal.toFixed(3)}</div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>lo mayor entre CBM y toneladas</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONCEPTOS DE FACTURACIÓN ── */}
      <div>
        <SectionTitle>Conceptos de facturación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <InfoBox type="info">
            {info.subtipo === "fcl"
              ? <>Cargos cotizados <strong>por contenedor</strong>. Cantidad automática: <strong>{totalContenedores} contenedor{totalContenedores !== 1 ? "es" : ""}</strong>.</>
              : <>Cargos cotizados <strong>por W/M</strong>. W/M calculado: <strong>{wmTotal.toFixed(3)}</strong>.</>
            }
          </InfoBox>

          {billingConcepts.map((concept, ci) => {
            const isActive     = activeConcept === concept.tempId;
            const conceptTotal = concept.lines.reduce((s, l) => s + Number(l.price), 0);
            const prodName     = svcCatalog.find((p: any) => p.id === concept.product_id)?.name;
            return (
              <div key={concept.tempId} style={{ borderRadius: "var(--radius-md)", border: `2px solid ${isActive ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, overflow: "hidden" }}>
                <div onClick={() => setActiveConcept(isActive ? null : concept.tempId)}
                  style={{ padding: "10px 14px", background: isActive ? "var(--color-info-bg)" : "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", border: "1px solid var(--color-brand-blue)30" }}>CFDI</span>
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{prodName ?? concept.description}</span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{concept.lines.length} línea{concept.lines.length !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)" }}>{concept.currency} ${conceptTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
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
                      const qty    = (line as any).quantity ?? 1;
                      const uPrice = (line as any).unit_price;
                      const taxLabel = (line as any).tax_rate === -1 ? "Exento" : (line as any).tax_rate === 0 ? "0%" : `IVA ${(line as any).tax_rate ?? 16}%`;
                      return (
                        <div key={li} style={{ padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line.description}</div>
                              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                {qty} {(line as any).unit_label} × {(line as any).currency} ${Number(uPrice ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} · {taxLabel}
                              </div>
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)", flexShrink: 0 }}>
                              {(line as any).currency} ${Number(line.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                            <button onClick={() => setBillingConcepts(p => p.map((c, i) => i === ci ? { ...c, lines: c.lines.filter((_, j) => j !== li) } : c))}
                              style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Form nueva línea */}
                    <div style={{ background: "var(--color-bg-base)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>+ Nueva línea de detalle</div>

                      {/* Fila 1: Descripción */}
                      <Field label="Descripción *">
                        <input value={lineForm.description} onChange={e => setLineForm(p => ({ ...p, description: e.target.value }))} placeholder="Ocean Freight, THC, BL Fee, Seguro…" style={INPUT} />
                      </Field>

                      {/* Fila 2: Cantidad · Unidad · Precio unitario · Total */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "8px" }}>
                        <Field label="Cantidad" hint={info.subtipo === "fcl" ? `Auto: ${totalContenedores}` : `Auto: ${wmTotal.toFixed(3)}`}>
                          <input type="number" value={lineForm.quantity}
                            onChange={e => setLineForm(p => ({ ...p, quantity: e.target.value }))}
                            style={{ ...INPUT, background: "var(--color-info-bg)" }} />
                        </Field>
                        <Field label="Unidad de cobro *">
                          <select value={lineForm.unit_label} onChange={e => setLineForm(p => ({ ...p, unit_label: e.target.value }))} style={SELECT}>
                            {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
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

                      {/* Fila 3: Moneda · IVA · Notas */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
                        <Field label="Moneda">
                          <select value={lineForm.currency} onChange={e => setLineForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                          </select>
                        </Field>
                        <Field label="IVA">
                          <select value={String(lineForm.tax_rate)} onChange={e => setLineForm(p => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
                            <option value="0">Tasa 0%</option>
                            <option value="-1">Exento</option>
                            <option value="16">IVA 16%</option>
                            <option value="8">IVA 8%</option>
                          </select>
                        </Field>
                        <Field label="Notas">
                          <input value={lineForm.notes} onChange={e => setLineForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" style={INPUT} />
                        </Field>
                      </div>

                      <button onClick={() => addLine(ci, concept)} disabled={!lineForm.description.trim() || !lineForm.unit_price}
                        style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
                        + Agregar línea
                      </button>
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
                <input value={conceptForm.description} onChange={e => setConceptForm(p => ({ ...p, description: e.target.value }))} placeholder="ej: Flete Marítimo FCL Shanghai–Manzanillo" style={INPUT} />
              </Field>
              <Field label="Moneda">
                <select value={conceptForm.currency} onChange={e => setConceptForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </Field>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={createConcept} disabled={!conceptForm.description.trim()}
                  style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Crear concepto
                </button>
                <button onClick={() => { setAddingConcept(false); setConceptForm({ product_id: "", description: "", currency: "USD" }); }}
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
