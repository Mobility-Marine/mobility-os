"use client";
import { useState } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CURRENCIES, TRUCK_TYPES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type Ruta = { origen: string; destino: string; incoterm: string };

export interface TerrestreFTLInfo {
  rutas:              Ruta[];
  mercancia:          string;
  valor_comercial:    string;
  valor_moneda:       string;
  peso_kg:            string;
  tipo_unidad:        string;
  cantidad_unidades:  string;
}

export const EMPTY_TERRESTRE_FTL_INFO = (): TerrestreFTLInfo => ({
  rutas:             [{ origen: "", destino: "", incoterm: "" }],
  mercancia:         "",
  valor_comercial:   "",
  valor_moneda:      "MXN",
  peso_kg:           "",
  tipo_unidad:       "",
  cantidad_unidades: "1",
});

type Props = {
  info:               TerrestreFTLInfo;
  setInfo:            React.Dispatch<React.SetStateAction<TerrestreFTLInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentTerrestre_FTL({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {


  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description  ?? "",
      quantity:    String(line.quantity  ?? ""),
      unit_label:  line.unit_label   ?? "Por unidad",
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
        <SectionTitle>Rutas FTL ({info.rutas.length})</SectionTitle>
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

      {/* ── UNIDAD DE TRANSPORTE ── */}
      <div>
        <SectionTitle>Unidad de transporte</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginTop: "8px" }}>
          <Field label="Tipo de unidad *">
            <select value={info.tipo_unidad} onChange={e => setInfo(p => ({ ...p, tipo_unidad: e.target.value }))} style={SELECT}>
              <option value="">— Seleccionar —</option>
              {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Cantidad de unidades">
            <input type="number" min="1" value={info.cantidad_unidades}
              onChange={e => setInfo(p => ({ ...p, cantidad_unidades: e.target.value }))}
              style={INPUT} />
          </Field>
        </div>
        {info.tipo_unidad && (
          <InfoBox type="info">
            {info.cantidad_unidades} × {info.tipo_unidad}
          </InfoBox>
        )}
      </div>

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción *">
            <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))}
              placeholder="Descripción de la carga…" style={INPUT} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor comercial">
              <input type="number" value={info.valor_comercial}
                onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda valor">
              <select value={info.valor_moneda} onChange={e => setInfo(p => ({ ...p, valor_moneda: e.target.value }))} style={SELECT}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Peso total (kg)">
              <input type="number" value={info.peso_kg}
                onChange={e => setInfo(p => ({ ...p, peso_kg: e.target.value }))}
                placeholder="0" style={INPUT} />
            </Field>
          </div>
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