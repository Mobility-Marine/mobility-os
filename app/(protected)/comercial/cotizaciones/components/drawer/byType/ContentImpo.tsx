"use client";
import { useState } from "react";
import { useEffect } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";

// ── Tipos ──────────────────────────────────────────────────────
export interface ImpoInfo {
  // Datos del embarque
  fraccion_arancelaria:   string;
  descripcion_mercancia:  string;
  pais_origen:            string;
  aduana:                 string;
  clave_aduana:           string;
  tipo_aduana:            string;
  incoterm:               string;
  // Valor y cálculo
  valor_factura:          string;
  moneda_factura:         string;
  tipo_cambio:            string;
  // Incrementables
  flete_origen:           string;
  seguro:                 string;
  otros_incrementables:   string;
  // Impuestos
  arancel_pct:            string;
  prevalidacion:          string;
  iva_prevalidacion:      string;
}

export const EMPTY_IMPO_INFO = (): ImpoInfo => ({
  fraccion_arancelaria:  "",
  descripcion_mercancia: "",
  pais_origen:           "",
  aduana:                "",
  clave_aduana:          "",
  tipo_aduana:           "",
  incoterm:              "",
  valor_factura:         "",
  moneda_factura:        "USD",
  tipo_cambio:           "17",
  flete_origen:          "",
  seguro:                "",
  otros_incrementables:  "",
  arancel_pct:           "0",
  prevalidacion:         "309",
  iva_prevalidacion:     "",
});

const INCOTERMS_IMPO = ["EXW","FOB","FCA","CFR","CIF","CPT","CIP","DAP","DDP","DAT"];

// Unidades de cobro para Despacho Aduanal Importación
const UNITS_IMPO = [
  "Por pedimento", "Por fracción arancelaria", "Por factura",
  "Por contenedor", "Por embarque", "Por servicio",
  "Por pieza", "Por kg", "Por trámite", "Otro",
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
  description: "", quantity: "1", unit_label: "Por pedimento",
  unit_price: "", currency: "MXN", tax_rate: 16, notes: "",
});

type Props = {
  info:               ImpoInfo;
  setInfo:            React.Dispatch<React.SetStateAction<ImpoInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentImpo({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [addingConcept, setAddingConcept] = useState(false);
  const [conceptForm,   setConceptForm]   = useState({ product_id: "", description: "", currency: "MXN" });
  const [lineForm,      setLineForm]      = useState<LineDraft>(EMPTY_LINE());
  const [editingLine,   setEditingLine]   = useState<number | null>(null);
  const [aduanas,       setAduanas]       = useState<any[]>([]);

  // Cargar catálogo de aduanas desde Supabase
  useEffect(() => {
    import("@/lib/supabaseClient").then(({ supabase }) => {
      supabase.from("customs_offices").select("*").order("type").order("name")
        .then(({ data }) => setAduanas(data ?? []));
    });
  }, []);

  // ── Cálculos automáticos ──────────────────────────────────
  const valorFacturaMXN  = Number(info.valor_factura    || 0) * Number(info.tipo_cambio   || 1);
  const fleteflete       = Number(info.flete_origen     || 0);
  const seguro           = Number(info.seguro           || 0);
  const otrosInc         = Number(info.otros_incrementables || 0);
  const totalIncremMXN   = fleteflete + seguro + otrosInc;
  const valorAduana      = valorFacturaMXN + totalIncremMXN;
  const igi              = valorAduana * (Number(info.arancel_pct || 0) / 100);
  const dta              = valorAduana > 0
    ? Math.min(Math.max(valorAduana * 0.00176, 890), 1008)
    : 0;
  const prevalidacion    = Number(info.prevalidacion    || 0);
  const ivaPrevalidacion = prevalidacion * 0.16;
  const baseIvaImpo      = valorAduana + igi + dta + prevalidacion;
  const ivaImportacion   = baseIvaImpo * 0.16;
  const totalImpuestos   = igi + dta + prevalidacion + ivaPrevalidacion + ivaImportacion;

  const autoTotal = (Number(lineForm.quantity) || 0) * (Number(lineForm.unit_price) || 0);

  function handleAduanaChange(id: string) {
    const a = aduanas.find(x => x.id === id);
    if (a) setInfo(p => ({ ...p, aduana: a.name, clave_aduana: a.clave_sat, tipo_aduana: a.type }));
  }

  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description  ?? "",
      quantity:    String(line.quantity  ?? "1"),
      unit_label:  line.unit_label   ?? "Por pedimento",
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
        service_type: "aduanal" as any,
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

  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ADUANA_GROUPS = ["fronteriza","interna","maritima","aeropuerto"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── DATOS DE LA MERCANCÍA ── */}
      <div>
        <SectionTitle>Datos de la mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
            <Field label="Fracción arancelaria *">
              <input value={info.fraccion_arancelaria}
                onChange={e => setInfo(p => ({ ...p, fraccion_arancelaria: e.target.value }))}
                placeholder="8471.30.01" style={{ ...INPUT, fontFamily: "monospace" }} />
            </Field>
            <Field label="Descripción de mercancía *">
              <input value={info.descripcion_mercancia}
                onChange={e => setInfo(p => ({ ...p, descripcion_mercancia: e.target.value }))}
                placeholder="Computadoras portátiles, autopartes, textiles…" style={INPUT} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="País de origen *">
              <input value={info.pais_origen}
                onChange={e => setInfo(p => ({ ...p, pais_origen: e.target.value }))}
                placeholder="China, USA, Alemania…" style={INPUT} />
            </Field>
            <Field label="Incoterm">
              <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                <option value="">—</option>
                {INCOTERMS_IMPO.map(inc => <option key={inc} value={inc}>{inc}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── ADUANA ── */}
      <div>
        <SectionTitle>Aduana de despacho</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginTop: "8px" }}>
          <Field label="Aduana *" hint="La clave SAT se asigna automáticamente">
            <select
              value={aduanas.find(a => a.name === info.aduana)?.id ?? ""}
              onChange={e => handleAduanaChange(e.target.value)}
              style={SELECT}>
              <option value="">— Seleccionar aduana —</option>
              {ADUANA_GROUPS.map(group => {
                const items = aduanas.filter(a => a.type === group);
                if (!items.length) return null;
                return (
                  <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
                    {items.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </optgroup>
                );
              })}
            </select>
          </Field>
          {info.clave_aduana && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Clave SAT</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-info-text)", fontFamily: "monospace" }}>{info.clave_aduana}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{info.tipo_aduana}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── VALOR EN ADUANA ── */}
      <div>
        <SectionTitle>Valor en aduana e incrementables</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor de factura *">
              <input type="number" value={info.valor_factura}
                onChange={e => setInfo(p => ({ ...p, valor_factura: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda factura">
              <select value={info.moneda_factura} onChange={e => setInfo(p => ({ ...p, moneda_factura: e.target.value }))} style={SELECT}>
                {["USD","EUR","MXN","CNY","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tipo de cambio (MXN)" hint="SAT del día de cruce">
              <input type="number" value={info.tipo_cambio}
                onChange={e => setInfo(p => ({ ...p, tipo_cambio: e.target.value }))}
                placeholder="17.00" step="0.01" style={INPUT} />
            </Field>
          </div>

          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
            Incrementables (en MXN)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Flete internacional" hint="En MXN">
              <input type="number" value={info.flete_origen}
                onChange={e => setInfo(p => ({ ...p, flete_origen: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Seguro" hint="En MXN">
              <input type="number" value={info.seguro}
                onChange={e => setInfo(p => ({ ...p, seguro: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Otros incrementables" hint="Empaque, cargos origen, etc.">
              <input type="number" value={info.otros_incrementables}
                onChange={e => setInfo(p => ({ ...p, otros_incrementables: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
          </div>

          {/* Resultado valor aduana */}
          {valorAduana > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Valor factura MXN</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-info-text)" }}>${fmt(valorFacturaMXN)}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Incrementables</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-info-text)" }}>${fmt(totalIncremMXN)}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Valor en Aduana</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)" }}>${fmt(valorAduana)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CÁLCULO DE IMPUESTOS ── */}
      <div>
        <SectionTitle>Cálculo de impuestos de importación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Arancel IGI (%)" hint="0% si aplica TLCAN/T-MEC/etc.">
              <input type="number" value={info.arancel_pct}
                onChange={e => setInfo(p => ({ ...p, arancel_pct: e.target.value }))}
                placeholder="0" min="0" max="100" step="0.5" style={INPUT} />
            </Field>
            <Field label="Prevalidación (MXN)" hint="Cuota fija SAT, default $309">
              <input type="number" value={info.prevalidacion}
                onChange={e => setInfo(p => ({
                  ...p,
                  prevalidacion: e.target.value,
                  iva_prevalidacion: String(Number(e.target.value) * 0.16),
                }))}
                placeholder="309" style={INPUT} />
            </Field>
            <Field label="IVA prevalidación (auto)">
              <div style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                ${fmt(ivaPrevalidacion)}
              </div>
            </Field>
          </div>

          {/* Tabla de impuestos calculados */}
          {valorAduana > 0 && (
            <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Resumen de impuestos</span>
              </div>
              {[
                { label: "IGI / Arancel",        value: igi,              pct: `${info.arancel_pct}%`,    highlight: false },
                { label: "DTA",                   value: dta,              pct: "0.176% (mín $890)",        highlight: false },
                { label: "Prevalidación",         value: prevalidacion,    pct: "Cuota fija",               highlight: false },
                { label: "IVA Prevalidación",     value: ivaPrevalidacion, pct: "16% de prevalidación",     highlight: false },
                { label: "IVA Importación 16%",   value: ivaImportacion,   pct: "16% de base imponible",    highlight: false },
              ].map((row) => (
                <div key={row.label} style={{ padding: "8px 14px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{row.label}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{row.pct}</div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    MXN ${fmt(row.value)}
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 14px", background: "var(--color-info-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-info-text)" }}>TOTAL IMPUESTOS</span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-info-text)" }}>MXN ${fmt(totalImpuestos)}</span>
              </div>
            </div>
          )}

          {valorAduana > 0 && (
            <InfoBox type="warning">
              Este cálculo es <strong>estimado</strong> con base en la información proporcionada. Los impuestos finales los determina el SAT al momento del cruce.
            </InfoBox>
          )}
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
                          placeholder="Honorarios agente aduanal, gastos de almacenaje, maniobras…" style={INPUT} />
                      </Field>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "8px" }}>
                        <Field label="Cantidad *">
                          <input type="number" value={lineForm.quantity}
                            onChange={e => setLineForm(p => ({ ...p, quantity: e.target.value }))}
                            placeholder="1" style={INPUT} />
                        </Field>
                        <Field label="Unidad de cobro *">
                          <select value={lineForm.unit_label} onChange={e => setLineForm(p => ({ ...p, unit_label: e.target.value }))} style={SELECT}>
                            {UNITS_IMPO.map(u => <option key={u} value={u}>{u}</option>)}
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
                  placeholder="ej: Despacho Aduanal Importación — Manzanillo" style={INPUT} />
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
