"use client";
import { useState } from "react";
import { Field, SectionTitle, SELECT, INPUT, InfoBox } from "../drawerShared";
import { CURRENCIES } from "../../../types/quotations.types";
import type { CreateServicePayload } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import ConceptCard from "./concepts/ConceptCard";

type LineDraft = Omit<CreateServicePayload, "quotation_id">;

type Props = {
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

/**
 * Step de Conceptos de facturación.
 *
 * Arquitectura ERP-grade:
 *  - Este componente es PURO orquestador: array + bloqueo global + nuevo concepto
 *  - Toda la lógica de edición vive LOCAL en ConceptCard / LineRow
 *  - Cancelar siempre es zero-touch (no toca el array del padre)
 *  - Bloqueo de doble edición vía globalLockKey (string identificador)
 */
export default function StepConceptos({ billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [globalLockKey, setGlobalLockKey] = useState<string | null>(null);
  const [addingNew,     setAddingNew]     = useState(false);
  const [newConcept,    setNewConcept]    = useState({ product_id: "", description: "", currency: "USD" });

  // ── Mutaciones del array (sólo aquí) ─────────────────────────
  function addConcept() {
    if (!newConcept.description.trim()) return;
    const tempId = `tmp-${Date.now()}`;
    setBillingConcepts(p => [...p, {
      tempId,
      product_id:  newConcept.product_id || undefined,
      description: newConcept.description.trim(),
      currency:    newConcept.currency,
      lines:       [],
    }]);
    setNewConcept({ product_id: "", description: "", currency: "USD" });
    setAddingNew(false);
  }
  function updateConcept(tempId: string, patch: Partial<BillingConceptDraft>) {
    setBillingConcepts(p => p.map(c => c.tempId === tempId ? { ...c, ...patch } : c));
  }
  function deleteConcept(tempId: string) {
    setBillingConcepts(p => p.filter(c => c.tempId !== tempId));
  }
  function addLine(tempId: string, line: LineDraft) {
    setBillingConcepts(p => p.map(c => c.tempId === tempId ? { ...c, lines: [...c.lines, line] } : c));
  }
  function updateLine(tempId: string, lineIdx: number, line: LineDraft) {
    setBillingConcepts(p => p.map(c => c.tempId === tempId ? {
      ...c,
      lines: c.lines.map((l, j) => j === lineIdx ? line : l),
    } : c));
  }
  function deleteLine(tempId: string, lineIdx: number) {
    setBillingConcepts(p => p.map(c => c.tempId === tempId ? {
      ...c,
      lines: c.lines.filter((_, j) => j !== lineIdx),
    } : c));
  }

  return (
    <>
      <SectionTitle>Conceptos de facturación</SectionTitle>
      <InfoBox type="info">
        Cada <strong>concepto de facturación</strong> agrupa varias líneas de detalle. El PDF muestra el desglose; el CFDI usa solo los conceptos con su total.
      </InfoBox>

      {/* CONCEPTOS — uno por card */}
      <div style={{ display: "grid", gap: "12px" }}>
        {billingConcepts.map((concept) => (
          <ConceptCard
            key={concept.tempId}
            concept={concept}
            svcCatalog={svcCatalog}
            globalLockKey={globalLockKey}
            setGlobalLockKey={setGlobalLockKey}
            onConceptUpdate={(patch) => updateConcept(concept.tempId, patch)}
            onConceptDelete={() => deleteConcept(concept.tempId)}
            onLineAdd={(line) => addLine(concept.tempId, line)}
            onLineUpdate={(idx, line) => updateLine(concept.tempId, idx, line)}
            onLineDelete={(idx) => deleteLine(concept.tempId, idx)}
          />
        ))}
      </div>

      {/* AGREGAR NUEVO CONCEPTO */}
      {!addingNew ? (
        <button
          onClick={() => setAddingNew(true)}
          disabled={globalLockKey !== null}
          style={{
            height: "44px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "13px", fontWeight: 700,
            cursor: globalLockKey !== null ? "not-allowed" : "pointer",
            opacity: globalLockKey !== null ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            marginTop: "12px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar concepto de facturación
        </button>
      ) : (
        <div style={{
          padding: "16px", marginTop: "12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)",
          border: "2px solid var(--color-brand-blue)",
          display: "grid", gap: "10px",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", textTransform: "uppercase" }}>
            Nuevo concepto de facturación
          </div>
          <Field label="Concepto del catálogo — para CFDI (no aparece en PDF)">
            <select value={newConcept.product_id} onChange={(e) => setNewConcept(p => ({ ...p, product_id: e.target.value }))} style={SELECT}>
              <option value="">— Sin vincular —</option>
              {svcCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
            </select>
          </Field>
          <Field label="Nombre del concepto (visible en PDF) *">
            <input value={newConcept.description} onChange={(e) => setNewConcept(p => ({ ...p, description: e.target.value }))} placeholder="ej: Coordinación de Transporte Internacional" style={INPUT} />
          </Field>
          <Field label="Moneda">
            <select value={newConcept.currency} onChange={(e) => setNewConcept(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
            <button
              onClick={addConcept}
              disabled={!newConcept.description.trim()}
              style={{
                height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "12px", fontWeight: 700,
                cursor: !newConcept.description.trim() ? "not-allowed" : "pointer",
                opacity: !newConcept.description.trim() ? 0.5 : 1,
              }}
            >
              Crear concepto
            </button>
            <button
              onClick={() => { setAddingNew(false); setNewConcept({ product_id: "", description: "", currency: "USD" }); }}
              style={{
                height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
                color: "var(--color-text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* RESUMEN */}
      {billingConcepts.length > 0 && (
        <div style={{
          padding: "12px 16px", marginTop: "12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-faint)",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
            Resumen — {billingConcepts.length} concepto{billingConcepts.length !== 1 ? "s" : ""}
          </div>
          {billingConcepts.map((c, i) => {
            const total = c.lines.reduce((s, l) => s + Number(l.price), 0);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-second)" }}>{c.description}</span>
                <span style={{ fontWeight: 700, color: c.lines.length === 0 ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
                  {c.lines.length === 0 ? "⚠ Sin líneas" : `${c.currency} $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}