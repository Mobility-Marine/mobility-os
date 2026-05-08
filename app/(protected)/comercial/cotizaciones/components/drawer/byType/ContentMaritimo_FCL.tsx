"use client";
import { useState } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CONTAINER_TYPES, CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type Contenedor = { tipo: string; cantidad: number };

export interface MaritimoFCLInfo {
  puerto_origen:   string;
  puerto_destino:  string;
  incoterm:        string;
  mercancia:       string;
  valor_comercial: string;
  valor_moneda:    string;
  peso_kg:         string;
  contenedores:    Contenedor[];
}

export const EMPTY_MARITIMO_FCL_INFO = (): MaritimoFCLInfo => ({
  puerto_origen: "", puerto_destino: "", incoterm: "",
  mercancia: "", valor_comercial: "", valor_moneda: "USD", peso_kg: "",
  contenedores: [{ tipo: "40'HC", cantidad: 1 }],
});

type Props = {
  info:               MaritimoFCLInfo;
  setInfo:            React.Dispatch<React.SetStateAction<MaritimoFCLInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentMaritimo_FCL({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {

  const totalContenedores = info.contenedores.reduce((s, c) => s + c.cantidad, 0);

  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description   ?? "",
      quantity:    String(line.quantity   ?? ""),
      unit_label:  line.unit_label    ?? "Por contenedor",
      unit_price:  String(line.unit_price ?? ""),
      currency:    line.currency      ?? "USD",
      tax_rate:    line.tax_rate      ?? 0,
      notes:       line.notes         ?? "",
    });
    setEditingLine(li);
    setBillingConcepts(p => p.map((c, i) => i === ci
      ? { ...c, lines: c.lines.filter((_, j) => j !== li) }
      : c
    ));
  }

  function addLine(ci: number) {
    if (!lineForm.description.trim() || !lineForm.unit_price || !lineForm.quantity) return;
    const price = autoTotal;
    setBillingConcepts(p => p.map((c, i) => i === ci ? {
      ...c, lines: [...c.lines, {
        service_type: "maritimo" as any,
        description:  lineForm.description,
        currency:     lineForm.currency,
        price,
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
            <Field label="Moneda valor">
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

      {/* ── CONTENEDORES ── */}
      <div>
        <SectionTitle>Contenedores a cotizar</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
          {info.contenedores.map((cont, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <Field label={i === 0 ? "Tipo de contenedor" : ""}>
                <select value={cont.tipo}
                  onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, tipo: e.target.value } : c) }))}
                  style={SELECT}>
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
                  style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer" }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, contenedores: [...p.contenedores, { tipo: "40'HC", cantidad: 1 }] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar tipo de contenedor
          </button>
          {totalContenedores > 0 && (
            <InfoBox type="info">
              Total a cotizar: <strong>{totalContenedores} contenedor{totalContenedores !== 1 ? "es" : ""}</strong>
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