"use client";
import { useState } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";

// ── Tipos ──────────────────────────────────────────────────────
type Bulto = { largo_cm: string; ancho_cm: string; alto_cm: string; peso_kg: string; cantidad: string };

export interface AereoCargaInfo {
  aeropuerto_origen:  string;
  aeropuerto_destino: string;
  incoterm:           string;
  mercancia:          string;
  valor_comercial:    string;
  valor_moneda:       string;
  carrier:            string;
  bultos:             Bulto[];
}

export const EMPTY_AEREO_CARGA_INFO = (): AereoCargaInfo => ({
  aeropuerto_origen:  "",
  aeropuerto_destino: "",
  incoterm:           "",
  mercancia:          "",
  valor_comercial:    "",
  valor_moneda:       "USD",
  carrier:            "",
  bultos:             [{ largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" }],
});

const CARRIERS = ["DHL", "FedEx", "UPS", "Estafeta", "Redpack", "Aeromexico Cargo", "Lufthansa Cargo", "Sin preferencia", "Otro"];

// Unidades de cobro para Aéreo Carga
const UNITS_AEREO = [
  "Por kg cobrable", "Por kg real", "Por kg dimensional",
  "Por AWB", "Por embarque", "Por servicio",
  "Por pieza", "Por factura", "Otro",
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
  description: "", quantity: "", unit_label: "Por kg cobrable",
  unit_price: "", currency: "USD", tax_rate: 0, notes: "",
});

type Props = {
  info:               AereoCargaInfo;
  setInfo:            React.Dispatch<React.SetStateAction<AereoCargaInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentAereo_Carga({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [addingConcept, setAddingConcept] = useState(false);
  const [conceptForm,   setConceptForm]   = useState({ product_id: "", description: "", currency: "USD" });
  const [lineForm,      setLineForm]      = useState<LineDraft>(EMPTY_LINE());
  const [editingLine,   setEditingLine]   = useState<number | null>(null);

  // Cálculos de peso
  const pesoReal        = info.bultos.reduce((s, b) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
  const pesoDimensional = info.bultos.reduce((s, b) => {
    const vol = (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm)) / 6000;
    return s + vol * Number(b.cantidad || 1);
  }, 0);
  const pesoCobrable = Math.max(pesoReal, pesoDimensional);

  const autoTotal = (Number(lineForm.quantity) || 0) * (Number(lineForm.unit_price) || 0);

  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description  ?? "",
      quantity:    String(line.quantity  ?? ""),
      unit_label:  line.unit_label   ?? "Por kg cobrable",
      unit_price:  String(line.unit_price ?? ""),
      currency:    line.currency     ?? "USD",
      tax_rate:    line.tax_rate     ?? 0,
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
        service_type: "aereo" as any,
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
    setConceptForm({ product_id: "", description: "", currency: "USD" });
    setAddingConcept(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── AEROPUERTOS ── */}
      <div>
        <SectionTitle>Aeropuertos e Incoterm</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
          <Field label="Aeropuerto de origen *">
            <input value={info.aeropuerto_origen}
              onChange={e => setInfo(p => ({ ...p, aeropuerto_origen: e.target.value }))}
              placeholder="PVG — Shanghai Pudong" style={INPUT} />
          </Field>
          <Field label="Aeropuerto de destino *">
            <input value={info.aeropuerto_destino}
              onChange={e => setInfo(p => ({ ...p, aeropuerto_destino: e.target.value }))}
              placeholder="MEX — Ciudad de México" style={INPUT} />
          </Field>
          <Field label="Incoterm">
            <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
              <option value="">—</option>
              {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── CARRIER ── */}
      <div>
        <SectionTitle>Aerolínea / Carrier</SectionTitle>
        <div style={{ marginTop: "8px" }}>
          <Field label="Carrier preferente">
            <select value={info.carrier} onChange={e => setInfo(p => ({ ...p, carrier: e.target.value }))} style={SELECT}>
              <option value="">— Sin preferencia —</option>
              {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción *">
            <input value={info.mercancia}
              onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))}
              placeholder="Componentes electrónicos, muestras, repuestos…" style={INPUT} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Field label="Valor comercial">
              <input type="number" value={info.valor_comercial}
                onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda valor">
              <select value={info.valor_moneda} onChange={e => setInfo(p => ({ ...p, valor_moneda: e.target.value }))} style={SELECT}>
                {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── BULTOS Y PESO ── */}
      <div>
        <SectionTitle>Bultos y peso dimensional</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {info.bultos.map((bulto, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Bulto {i + 1}</span>
                {info.bultos.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, bultos: p.bultos.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>
                    Eliminar
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                {(["largo_cm","ancho_cm","alto_cm","peso_kg","cantidad"] as const).map(key => (
                  <Field key={key} label={
                    key === "largo_cm" ? "Largo (cm)" :
                    key === "ancho_cm" ? "Ancho (cm)" :
                    key === "alto_cm"  ? "Alto (cm)"  :
                    key === "peso_kg"  ? "Peso (kg)"  : "Cantidad"
                  }>
                    <input type="number" value={bulto[key]} min="0"
                      onChange={e => setInfo(p => ({ ...p, bultos: p.bultos.map((b, j) => j === i ? { ...b, [key]: e.target.value } : b) }))}
                      style={INPUT} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, bultos: [...p.bultos, { largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" }] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar bulto
          </button>

          {/* Resumen de pesos */}
          {(pesoReal > 0 || pesoDimensional > 0) && (
            <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Peso Real</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoReal.toFixed(2)} kg</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Peso Dimensional</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoDimensional.toFixed(2)} kg</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>L×A×H ÷ 6000</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Peso Cobrable</div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{pesoCobrable.toFixed(2)} kg</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>lo mayor entre real y dimensional</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONCEPTOS DE FACTURACIÓN ── */}
      <div>
        <SectionTitle>Conceptos de facturación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {pesoCobrable > 0 && (
            <InfoBox type="info">
              Peso cobrable calculado: <strong>{pesoCobrable.toFixed(2)} kg</strong> — úsalo como referencia al capturar la cantidad de cargos por kg.
            </InfoBox>
          )}

          {billingConcepts.map((concept, ci) => {
            const isActive = activeConcept === concept.tempId;
            const conceptTotal: Record<string, number> = {};
            concept.lines.forEach(l => {
              const cur = (l as any).currency ?? "USD";
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
                      const cur      = (line as any).currency  ?? "USD";
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
                          placeholder="Air Freight, Fuel Surcharge, Security Fee, AWB Fee…" style={INPUT} />
                      </Field>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "8px" }}>
                        <Field label="Cantidad *" hint={pesoCobrable > 0 ? `Cobrable: ${pesoCobrable.toFixed(2)} kg` : undefined}>
                          <input type="number" value={lineForm.quantity}
                            onChange={e => setLineForm(p => ({ ...p, quantity: e.target.value }))}
                            placeholder="ej: 125.50" style={INPUT} />
                        </Field>
                        <Field label="Unidad de cobro *">
                          <select value={lineForm.unit_label} onChange={e => setLineForm(p => ({ ...p, unit_label: e.target.value }))} style={SELECT}>
                            {UNITS_AEREO.map(u => <option key={u} value={u}>{u}</option>)}
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
                            <option value="0">Tasa 0%</option>
                            <option value="-1">Exento</option>
                            <option value="16">IVA 16%</option>
                            <option value="8">IVA 8%</option>
                          </select>
                        </Field>
                        <Field label="Notas">
                          <input value={lineForm.notes} onChange={e => setLineForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Observaciones…" style={INPUT} />
                        </Field>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => addLine(ci)}
                          disabled={!lineForm.description.trim() || !lineForm.unit_price || !lineForm.quantity}
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
                  placeholder="ej: Flete Aéreo PVG–MEX" style={INPUT} />
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
