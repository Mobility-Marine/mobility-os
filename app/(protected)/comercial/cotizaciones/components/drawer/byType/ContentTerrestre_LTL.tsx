"use client";
import { useState } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type Ruta = { origen: string; destino: string; incoterm: string };

export interface TerrestreLTLInfo {
  rutas:           Ruta[];
  mercancia:       string;
  valor_comercial: string;
  valor_moneda:    string;
  peso_kg:         string;
  largo_cm:        string;
  ancho_cm:        string;
  alto_cm:         string;
  piezas:          string;
}

export const EMPTY_TERRESTRE_LTL_INFO = (): TerrestreLTLInfo => ({
  rutas:           [{ origen: "", destino: "", incoterm: "" }],
  mercancia:       "",
  valor_comercial: "",
  valor_moneda:    "MXN",
  peso_kg:         "",
  largo_cm:        "",
  ancho_cm:        "",
  alto_cm:         "",
  piezas:          "",
});

type Props = {
  info:               TerrestreLTLInfo;
  setInfo:            React.Dispatch<React.SetStateAction<TerrestreLTLInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentTerrestre_LTL({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {

  // Cálculo de volumen automático
  const volLTL = (info.largo_cm && info.ancho_cm && info.alto_cm)
    ? (Number(info.largo_cm) * Number(info.ancho_cm) * Number(info.alto_cm)) / 1_000_000
    : null;
  const volTotal = volLTL && info.piezas && Number(info.piezas) > 1
    ? volLTL * Number(info.piezas)
    : volLTL;


  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description  ?? "",
      quantity:    String(line.quantity  ?? ""),
      unit_label:  line.unit_label   ?? "Por envío",
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
        service_type: "terrestre" as any,
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

      {/* ── RUTAS ── */}
      <div>
        <SectionTitle>Rutas LTL ({info.rutas.length})</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {info.rutas.map((ruta, i) => (
            <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Ruta {i + 1}</span>
                {info.rutas.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, rutas: p.rutas.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>
                    Eliminar
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Origen *">
                  <input value={ruta.origen}
                    onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, origen: e.target.value } : r) }))}
                    placeholder="Ciudad, Estado" style={INPUT} />
                </Field>
                <Field label="Destino *">
                  <input value={ruta.destino}
                    onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, destino: e.target.value } : r) }))}
                    placeholder="Ciudad, Estado" style={INPUT} />
                </Field>
                <Field label="Incoterm">
                  <select value={ruta.incoterm}
                    onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, incoterm: e.target.value } : r) }))}
                    style={SELECT}>
                    <option value="">—</option>
                    {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, rutas: [...p.rutas, { origen: "", destino: "", incoterm: "" }] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar ruta
          </button>
        </div>
      </div>

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción *">
            <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))}
              placeholder="Cajas de cartón, electrónicos, refacciones…" style={INPUT} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor comercial">
              <input type="number" value={info.valor_comercial} onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda valor">
              <select value={info.valor_moneda} onChange={e => setInfo(p => ({ ...p, valor_moneda: e.target.value }))} style={SELECT}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Peso total (kg)">
              <input type="number" value={info.peso_kg} onChange={e => setInfo(p => ({ ...p, peso_kg: e.target.value }))}
                placeholder="0" style={INPUT} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── DIMENSIONES ── */}
      <div>
        <SectionTitle>Dimensiones (cálculo de volumen)</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Largo (cm)">
              <input type="number" value={info.largo_cm} onChange={e => setInfo(p => ({ ...p, largo_cm: e.target.value }))}
                placeholder="0" style={INPUT} />
            </Field>
            <Field label="Ancho (cm)">
              <input type="number" value={info.ancho_cm} onChange={e => setInfo(p => ({ ...p, ancho_cm: e.target.value }))}
                placeholder="0" style={INPUT} />
            </Field>
            <Field label="Alto (cm)">
              <input type="number" value={info.alto_cm} onChange={e => setInfo(p => ({ ...p, alto_cm: e.target.value }))}
                placeholder="0" style={INPUT} />
            </Field>
            <Field label="Piezas">
              <input type="number" value={info.piezas} onChange={e => setInfo(p => ({ ...p, piezas: e.target.value }))}
                placeholder="1" style={INPUT} />
            </Field>
          </div>
          {volLTL && (
            <InfoBox type="info">
              Volumen unitario: <strong>{volLTL.toFixed(3)} m³</strong>
              {info.piezas && Number(info.piezas) > 1
                ? <> × {info.piezas} piezas = <strong>{volTotal?.toFixed(3)} m³ total</strong></>
                : null}
            </InfoBox>
          )}
        </div>
      </div>

      <StepConceptos
        billingConcepts={billingConcepts}
        setBillingConcepts={setBillingConcepts}
        svcCatalog={svcCatalog}
      />
    </div>
  );
}