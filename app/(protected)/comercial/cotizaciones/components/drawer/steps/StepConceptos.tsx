"use client";
import { useState } from "react";
import { Field, SectionTitle, SELECT, INPUT, InfoBox } from "../drawerShared";
import { CURRENCIES, SERVICE_TYPES, SERVICE_TYPE_CONFIG } from "../../../types/quotations.types";
import type { ServiceType } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

const EMPTY_LINE = (currency: string) => ({
  service_type: "terrestre" as ServiceType,
  description: "", currency,
  price: "", notes: "", tax_rate: 16,
  unit_label: "",
});

const UNIT_LABELS = [
  "Por servicio", "Por contenedor", "Por BL", "Por pedimento",
  "Por factura", "Por kg", "Por tonelada", "Por m³", "Por W/M",
  "Por pieza", "Por embarque", "Por trámite",
];

export default function StepConceptos({ billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const { t } = useTranslation();
  const [activeConcept,  setActiveConcept]  = useState<string | null>(null);
  const [addingConcept,  setAddingConcept]  = useState(false);
  const [conceptForm,    setConceptForm]    = useState({ product_id: "", description: "", currency: "USD" });
  const [lineForm,       setLineForm]       = useState<any>(EMPTY_LINE("USD"));

  // ─── Estados de edición (no-destructiva, patrón ERP-grade) ──────────
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [editConceptForm,  setEditConceptForm]  = useState({ product_id: "", description: "", currency: "USD" });
  const [editingLine,      setEditingLine]      = useState<{ conceptId: string; lineIdx: number } | null>(null);

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

  function addLine(ci: number, concept: BillingConceptDraft) {
    if (!lineForm.description.trim() || !lineForm.price) return;
    setBillingConcepts(p => p.map((c, i) => i === ci ? {
      ...c,
      lines: [...c.lines, {
        service_type: lineForm.service_type,
        description:  lineForm.description,
        currency:     lineForm.currency,
        price:        Number(lineForm.price),
        tax_rate:     lineForm.tax_rate,
        notes:        lineForm.notes   || undefined,
        unit_label:   lineForm.unit_label || undefined,
      }],
    } : c));
    setLineForm(EMPTY_LINE(concept.currency));
  }

  // ─── Edición de CONCEPTO (no-destructiva) ───────────────────────────
  function startEditConcept(c: BillingConceptDraft) {
    setEditConceptForm({
      product_id:  c.product_id ?? "",
      description: c.description,
      currency:    c.currency,
    });
    setEditingConceptId(c.tempId);
    setActiveConcept(c.tempId);
  }

  function saveEditConcept() {
    if (!editConceptForm.description.trim() || !editingConceptId) return;
    const cid = editingConceptId;
    setBillingConcepts(p => p.map(c => c.tempId === cid ? {
      ...c,
      product_id:  editConceptForm.product_id || undefined,
      description: editConceptForm.description,
      currency:    editConceptForm.currency,
    } : c));
    setEditingConceptId(null);
  }

  function cancelEditConcept() {
    setEditingConceptId(null);
    setEditConceptForm({ product_id: "", description: "", currency: "USD" });
  }

  // ─── Edición de LÍNEA (no-destructiva) ──────────────────────────────
  function startEditLine(conceptId: string, lineIdx: number, line: any) {
    setLineForm({
      service_type: line.service_type,
      description:  line.description,
      currency:     line.currency,
      price:        String(line.price),
      tax_rate:     line.tax_rate ?? 16,
      notes:        line.notes ?? "",
      unit_label:   line.unit_label ?? "",
    });
    setEditingLine({ conceptId, lineIdx });
    setActiveConcept(conceptId);
  }

  function saveEditLine() {
    if (!lineForm.description.trim() || !lineForm.price || !editingLine) return;
    const { conceptId, lineIdx } = editingLine;
    setBillingConcepts(p => p.map(c => c.tempId === conceptId ? {
      ...c,
      lines: c.lines.map((l, j) => j === lineIdx ? {
        service_type: lineForm.service_type,
        description:  lineForm.description,
        currency:     lineForm.currency,
        price:        Number(lineForm.price),
        tax_rate:     lineForm.tax_rate,
        notes:        lineForm.notes   || undefined,
        unit_label:   lineForm.unit_label || undefined,
      } : l),
    } : c));
    const concept = billingConcepts.find(c => c.tempId === conceptId);
    setEditingLine(null);
    setLineForm(EMPTY_LINE(concept?.currency ?? "USD"));
  }

  function cancelEditLine() {
    if (!editingLine) return;
    const concept = billingConcepts.find(c => c.tempId === editingLine.conceptId);
    setEditingLine(null);
    setLineForm(EMPTY_LINE(concept?.currency ?? "USD"));
  }

  return (
    <>
      <SectionTitle>Conceptos de facturación</SectionTitle>
      <InfoBox type="info">
        Cada <strong>concepto de facturación</strong> agrupa varias líneas de detalle. El PDF muestra el desglose; el CFDI usa solo los conceptos con su total.
      </InfoBox>

      {/* CONCEPTOS */}
      {billingConcepts.map((concept, ci) => {
        const isActive          = activeConcept === concept.tempId;
        const total             = concept.lines.reduce((s, l) => s + Number(l.price), 0);
        const productName       = svcCatalog.find((p: any) => p.id === concept.product_id)?.name;
        const isEditingConcept  = editingConceptId === concept.tempId;
        const isEditingLineHere = editingLine !== null && editingLine.conceptId === concept.tempId;
        const isOtherLineInEdit = editingLine !== null && editingLine.conceptId !== concept.tempId;
        return (
          <div key={concept.tempId} style={{ borderRadius: "var(--radius-md)", border: `2px solid ${isActive ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, overflow: "hidden" }}>
            {/* Header — modo edición vs visualización */}
            {isEditingConcept ? (
              <div style={{ padding: "12px 14px", background: "var(--color-info-bg)", display: "grid", gap: "8px", borderBottom: "1px solid var(--color-info-border)" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-info-text)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Editando concepto
                </div>
                <Field label="Concepto del catálogo (CFDI)">
                  <select value={editConceptForm.product_id} onChange={(e) => setEditConceptForm(p => ({ ...p, product_id: e.target.value }))} style={SELECT}>
                    <option value="">— Sin vincular —</option>
                    {svcCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                  </select>
                </Field>
                <Field label="Nombre del concepto (visible en PDF) *">
                  <input value={editConceptForm.description} onChange={(e) => setEditConceptForm(p => ({ ...p, description: e.target.value }))} placeholder="ej: Coordinación de Transporte Internacional" style={INPUT} />
                </Field>
                <Field label="Moneda">
                  <select value={editConceptForm.currency} onChange={(e) => setEditConceptForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                    {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                  </select>
                </Field>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={saveEditConcept}
                    disabled={!editConceptForm.description.trim()}
                    style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: editConceptForm.description.trim() ? "pointer" : "not-allowed", opacity: editConceptForm.description.trim() ? 1 : 0.5 }}
                  >
                    Guardar cambios
                  </button>
                  <button
                    onClick={cancelEditConcept}
                    style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setActiveConcept(isActive ? null : concept.tempId)}
                style={{ padding: "10px 14px", background: isActive ? "var(--color-info-bg)" : "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", border: "1px solid var(--color-brand-blue)30" }}>CFDI</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{productName ?? concept.description}</span>
                    {productName && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>({concept.description})</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {concept.lines.length} línea{concept.lines.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-success-text)" }}>
                  {concept.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </div>
                <span style={{ color: "var(--color-text-muted)" }}>{isActive ? "▲" : "▼"}</span>
                {/* Botón EDITAR concepto */}
                <button
                  onClick={(e) => { e.stopPropagation(); startEditConcept(concept); }}
                  title="Editar concepto"
                  style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", color: "var(--color-info-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                {/* Botón ELIMINAR concepto */}
                <button
                  onClick={(e) => { e.stopPropagation(); setBillingConcepts(p => p.filter((_, i) => i !== ci)); }}
                  title="Eliminar concepto"
                  style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}

            {/* Líneas + form */}
            {isActive && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-faint)", display: "grid", gap: "8px" }}>
                {/* Líneas existentes */}
                {concept.lines.map((line, li) => {
                  const taxLabel = (line as any).tax_rate === -1 ? "Exento" : (line as any).tax_rate === 0 ? "0%" : `IVA ${(line as any).tax_rate ?? 16}%`;
                  return (
                    <div key={li} style={{ display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line.description}</div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                        {line.service_type} · {taxLabel} · {line.currency}
                        {(line as any).unit_label && <span style={{ marginLeft: "4px", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)" }}>{(line as any).unit_label}</span>}
                      </div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", flexShrink: 0 }}>
                        ${Number(line.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => startEditLine(concept.tempId, li, line)}
                        title="Editar línea"
                        disabled={editingLine !== null && (editingLine.conceptId !== concept.tempId || editingLine.lineIdx !== li)}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "var(--radius-sm)",
                          background: editingLine?.conceptId === concept.tempId && editingLine?.lineIdx === li ? "var(--color-warning-bg)" : "var(--color-info-bg)",
                          border: `1px solid ${editingLine?.conceptId === concept.tempId && editingLine?.lineIdx === li ? "var(--color-warning-border)" : "var(--color-info-border)"}`,
                          cursor: "pointer",
                          color: editingLine?.conceptId === concept.tempId && editingLine?.lineIdx === li ? "var(--color-warning-text)" : "var(--color-info-text)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          opacity: editingLine !== null && (editingLine.conceptId !== concept.tempId || editingLine.lineIdx !== li) ? 0.4 : 1,
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => setBillingConcepts(p => p.map((c, i) => i === ci ? { ...c, lines: c.lines.filter((_, j) => j !== li) } : c))}
                        style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  );
                })}

                {/* Form de línea — agregar nueva o editar existente */}
                {isOtherLineInEdit ? (
                  <div style={{ padding: "12px", border: "1px dashed var(--color-border-faint)", borderRadius: "var(--radius-md)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "11px" }}>
                    Termina de editar la línea activa para agregar o editar aquí.
                  </div>
                ) : (
                <div style={{ background: "var(--color-bg-base)", border: `1px ${isEditingLineHere ? "solid var(--color-warning-border)" : "dashed var(--color-border)"}`, borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: isEditingLineHere ? "var(--color-warning-text)" : "var(--color-text-muted)", textTransform: "uppercase" }}>
                    {isEditingLineHere ? `Editando línea ${editingLine!.lineIdx + 1}` : "+ Nueva línea de detalle"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                    <Field label="Tipo *">
                      <select value={lineForm.service_type} onChange={(e) => setLineForm((p: any) => ({ ...p, service_type: e.target.value }))} style={SELECT}>
                        {SERVICE_TYPES.map((st) => {
                          const cfg   = SERVICE_TYPE_CONFIG[st];
                          const label = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? st;
                          return <option key={st} value={st}>{label}</option>;
                        })}
                      </select>
                    </Field>
                    <Field label="Descripción *">
                      <input value={lineForm.description} onChange={(e) => setLineForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Flete, honorarios, maniobras…" style={INPUT} />
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <Field label="Moneda">
                      <select value={lineForm.currency} onChange={(e) => setLineForm((p: any) => ({ ...p, currency: e.target.value }))} style={SELECT}>
                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                      </select>
                    </Field>
                    <Field label="Precio *">
                      <input type="number" value={lineForm.price} onChange={(e) => setLineForm((p: any) => ({ ...p, price: e.target.value }))} placeholder="0.00" style={INPUT} />
                    </Field>
                    <Field label="IVA">
                      <select value={String(lineForm.tax_rate)} onChange={(e) => setLineForm((p: any) => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
                        <option value="16">IVA 16%</option>
                        <option value="0">Tasa 0%</option>
                        <option value="-1">Exento</option>
                        <option value="8">IVA 8%</option>
                      </select>
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <Field label="Notas">
                      <input value={lineForm.notes} onChange={(e) => setLineForm((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" style={INPUT} />
                    </Field>
                    <Field label="Unidad de cotización" hint="Cómo se cobra este concepto">
                      <select value={lineForm.unit_label ?? ""} onChange={(e) => setLineForm((p: any) => ({ ...p, unit_label: e.target.value }))} style={SELECT}>
                        <option value="">— Sin especificar —</option>
                        {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => isEditingLineHere ? saveEditLine() : addLine(ci, concept)}
                      disabled={!lineForm.description.trim() || !lineForm.price}
                      style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", alignSelf: "start" }}
                    >
                      {isEditingLineHere ? "Guardar cambios" : "+ Agregar línea"}
                    </button>
                    {isEditingLineHere && (
                      <button
                        onClick={cancelEditLine}
                        style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Agregar nuevo concepto */}
      {!addingConcept ? (
        <button onClick={() => setAddingConcept(true)} style={{ height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar concepto de facturación
        </button>
      ) : (
        <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "2px solid var(--color-brand-blue)", display: "grid", gap: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", textTransform: "uppercase" }}>Nuevo concepto de facturación</div>
          <Field label="Concepto del catálogo — para CFDI (no aparece en PDF)">
            <select value={conceptForm.product_id} onChange={(e) => setConceptForm(p => ({ ...p, product_id: e.target.value }))} style={SELECT}>
              <option value="">— Sin vincular —</option>
              {svcCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
            </select>
          </Field>
          <Field label="Nombre del concepto (visible en PDF) *">
            <input value={conceptForm.description} onChange={(e) => setConceptForm(p => ({ ...p, description: e.target.value }))} placeholder="ej: Coordinación de Transporte Internacional" style={INPUT} />
          </Field>
          <Field label="Moneda">
            <select value={conceptForm.currency} onChange={(e) => setConceptForm(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={createConcept} disabled={!conceptForm.description.trim()} style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              Crear concepto
            </button>
            <button onClick={() => { setAddingConcept(false); setConceptForm({ product_id: "", description: "", currency: "USD" }); }} style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-base)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resumen */}
      {billingConcepts.length > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
            Resumen — {billingConcepts.length} concepto{billingConcepts.length !== 1 ? "s" : ""}
          </div>
          {billingConcepts.map((c, i) => {
            const total = c.lines.reduce((s, l) => s + Number(l.price), 0);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
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
