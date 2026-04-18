"use client";
import { useState } from "react";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, TRUCK_TYPES, CURRENCIES, SERVICE_TYPES, SERVICE_TYPE_CONFIG } from "../../../types/quotations.types";
import type { ServiceType } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Ruta = { origen: string; destino: string; incoterm: string };

interface TerrestreInfo {
  subtipo:            "ltl" | "ftl";
  rutas:              Ruta[];
  mercancia:          string;
  valor_comercial:    string;
  valor_moneda:       string;
  peso_kg:            string;
  // LTL
  largo_cm:           string;
  ancho_cm:           string;
  alto_cm:            string;
  piezas:             string;
  // FTL
  tipo_unidad:        string;
  cantidad_unidades:  string;
}

const EMPTY_RUTA = (): Ruta => ({ origen: "", destino: "", incoterm: "" });
const EMPTY_INFO = (): TerrestreInfo => ({
  subtipo: "ftl", rutas: [EMPTY_RUTA()],
  mercancia: "", valor_comercial: "", valor_moneda: "USD", peso_kg: "",
  largo_cm: "", ancho_cm: "", alto_cm: "", piezas: "",
  tipo_unidad: "", cantidad_unidades: "1",
});

const EMPTY_LINE = (currency: string) => ({
  service_type: "terrestre" as ServiceType,
  description: "", currency, price: "", tax_rate: 16, notes: "", unit_label: "",
});

const UNIT_LABELS = ["Por servicio","Por contenedor","Por BL","Por pedimento","Por factura","Por kg","Por tonelada","Por m³","Por W/M","Por pieza","Por embarque","Por trámite"];

type Props = {
  info:               TerrestreInfo;
  setInfo:            React.Dispatch<React.SetStateAction<TerrestreInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export type { TerrestreInfo };
export { EMPTY_INFO as EMPTY_TERRESTRE_INFO };

export default function ContentTerrestre({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const { t } = useTranslation();
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [addingConcept, setAddingConcept] = useState(false);
  const [conceptForm,   setConceptForm]   = useState({ product_id: "", description: "", currency: "MXN" });
  const [lineForm,      setLineForm]      = useState<any>(EMPTY_LINE("MXN"));

  const volAuto = (info.largo_cm && info.ancho_cm && info.alto_cm)
    ? ((Number(info.largo_cm) * Number(info.ancho_cm) * Number(info.alto_cm)) / 1_000_000).toFixed(3)
    : null;

  function addLine(ci: number, concept: BillingConceptDraft) {
    if (!lineForm.description.trim() || !lineForm.price) return;
    setBillingConcepts(p => p.map((c, i) => i === ci ? {
      ...c, lines: [...c.lines, {
        service_type: lineForm.service_type, description: lineForm.description,
        currency: lineForm.currency, price: Number(lineForm.price),
        tax_rate: lineForm.tax_rate, notes: lineForm.notes || undefined,
        unit_label: lineForm.unit_label || undefined,
      }],
    } : c));
    setLineForm(EMPTY_LINE(concept.currency));
  }

  function createConcept() {
    if (!conceptForm.description.trim()) return;
    const tempId = Date.now().toString();
    setBillingConcepts(p => [...p, { tempId, product_id: conceptForm.product_id || undefined, description: conceptForm.description, currency: conceptForm.currency, lines: [] }]);
    setActiveConcept(tempId);
    setConceptForm({ product_id: "", description: "", currency: "MXN" });
    setAddingConcept(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── SUBTIPO ── */}
      <div>
        <SectionTitle>Tipo de servicio terrestre</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {(["ltl","ftl"] as const).map(sub => (
            <button key={sub} onClick={() => setInfo(p => ({ ...p, subtipo: sub }))}
              style={{ padding: "14px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.subtipo === sub ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>
                {sub === "ltl" ? "LTL — Carga parcial" : "FTL — Carga completa"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                {sub === "ltl" ? "Espacio compartido, múltiples rutas" : "Unidad dedicada, mayor capacidad"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RUTAS ── */}
      <div>
        <SectionTitle>Rutas ({info.rutas.length})</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {info.rutas.map((ruta, i) => (
            <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Ruta {i + 1}</span>
                {info.rutas.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, rutas: p.rutas.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Origen *">
                  <input value={ruta.origen} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, origen: e.target.value } : r) }))} placeholder="Ciudad, país" style={INPUT} />
                </Field>
                <Field label="Destino *">
                  <input value={ruta.destino} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, destino: e.target.value } : r) }))} placeholder="Ciudad, país" style={INPUT} />
                </Field>
                <Field label="Incoterm">
                  <select value={ruta.incoterm} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, incoterm: e.target.value } : r) }))} style={SELECT}>
                    <option value="">—</option>
                    {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, rutas: [...p.rutas, EMPTY_RUTA()] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar ruta
          </button>
        </div>
      </div>

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía y peso</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción de mercancía *">
            <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))} placeholder="Cajas de cartón, maquinaria, electrónicos…" style={INPUT} />
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

      {/* ── LTL: Dimensiones ── */}
      {info.subtipo === "ltl" && (
        <div>
          <SectionTitle>Dimensiones (cálculo de volumen)</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              <Field label="Largo (cm)"><input type="number" value={info.largo_cm} onChange={e => setInfo(p => ({ ...p, largo_cm: e.target.value }))} style={INPUT} /></Field>
              <Field label="Ancho (cm)"><input type="number" value={info.ancho_cm} onChange={e => setInfo(p => ({ ...p, ancho_cm: e.target.value }))} style={INPUT} /></Field>
              <Field label="Alto (cm)"><input type="number" value={info.alto_cm} onChange={e => setInfo(p => ({ ...p, alto_cm: e.target.value }))} style={INPUT} /></Field>
              <Field label="Piezas"><input type="number" value={info.piezas} onChange={e => setInfo(p => ({ ...p, piezas: e.target.value }))} style={INPUT} /></Field>
            </div>
            {volAuto && (
              <InfoBox type="info">
                Volumen: <strong>{volAuto} m³</strong>
                {info.piezas && Number(info.piezas) > 1 ? ` × ${info.piezas} = ${(parseFloat(volAuto) * Number(info.piezas)).toFixed(3)} m³ total` : ""}
              </InfoBox>
            )}
          </div>
        </div>
      )}

      {/* ── FTL: Unidad ── */}
      {info.subtipo === "ftl" && (
        <div>
          <SectionTitle>Unidad de transporte</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginTop: "8px" }}>
            <Field label="Tipo de unidad *">
              <select value={info.tipo_unidad} onChange={e => setInfo(p => ({ ...p, tipo_unidad: e.target.value }))} style={SELECT}>
                <option value="">— Seleccionar —</option>
                {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Cantidad">
              <input type="number" value={info.cantidad_unidades} min="1" onChange={e => setInfo(p => ({ ...p, cantidad_unidades: e.target.value }))} style={INPUT} />
            </Field>
          </div>
        </div>
      )}

      {/* ── CONCEPTOS DE FACTURACIÓN ── */}
      <div>
        <SectionTitle>Conceptos de facturación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <InfoBox type="info">Cada <strong>concepto CFDI</strong> agrupa varias líneas de detalle. El PDF muestra el desglose; el CFDI usa los conceptos.</InfoBox>

          {billingConcepts.map((concept, ci) => {
            const isActive = activeConcept === concept.tempId;
            const total    = concept.lines.reduce((s, l) => s + Number(l.price), 0);
            const prodName = svcCatalog.find((p: any) => p.id === concept.product_id)?.name;
            return (
              <div key={concept.tempId} style={{ borderRadius: "var(--radius-md)", border: `2px solid ${isActive ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, overflow: "hidden" }}>
                <div onClick={() => setActiveConcept(isActive ? null : concept.tempId)}
                  style={{ padding: "10px 14px", background: isActive ? "var(--color-info-bg)" : "var(--color-bg-subtle)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", border: "1px solid var(--color-brand-blue)30" }}>CFDI</span>
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{prodName ?? concept.description}</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)" }}>{concept.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{isActive ? "▲" : "▼"}</span>
                  <button onClick={e => { e.stopPropagation(); setBillingConcepts(p => p.filter((_, i) => i !== ci)); }}
                    style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {isActive && (
                  <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {concept.lines.map((line, li) => {
                      const taxLabel = (line as any).tax_rate === -1 ? "Exento" : (line as any).tax_rate === 0 ? "0%" : `IVA ${(line as any).tax_rate ?? 16}%`;
                      return (
                        <div key={li} style={{ display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line.description}</div>
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{line.service_type} · {taxLabel} · {line.currency}{(line as any).unit_label ? ` · ${(line as any).unit_label}` : ""}</div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>${Number(line.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                          <button onClick={() => { setLineForm({ service_type: line.service_type, description: line.description, currency: (line as any).currency, price: String(line.price), tax_rate: (line as any).tax_rate ?? 16, notes: (line as any).notes ?? "", unit_label: (line as any).unit_label ?? "" }); setBillingConcepts(p => p.map((c, i) => i === ci ? { ...c, lines: c.lines.filter((_, j) => j !== li) } : c)); }}
                            style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", cursor: "pointer", color: "var(--color-info-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => setBillingConcepts(p => p.map((c, i) => i === ci ? { ...c, lines: c.lines.filter((_, j) => j !== li) } : c))}
                            style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      );
                    })}
                    {/* Form nueva línea */}
                    <div style={{ background: "var(--color-bg-base)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>+ Nueva línea de detalle</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                        <Field label="Tipo *">
                          <select value={lineForm.service_type} onChange={e => setLineForm((p: any) => ({ ...p, service_type: e.target.value }))} style={SELECT}>
                            {SERVICE_TYPES.map(st => { const cfg = SERVICE_TYPE_CONFIG[st]; return <option key={st} value={st}>{(cfg as any).label ?? st}</option>; })}
                          </select>
                        </Field>
                        <Field label="Descripción *">
                          <input value={lineForm.description} onChange={e => setLineForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Flete, maniobras, seguro…" style={INPUT} />
                        </Field>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                        <Field label="Moneda">
                          <select value={lineForm.currency} onChange={e => setLineForm((p: any) => ({ ...p, currency: e.target.value }))} style={SELECT}>
                            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                          </select>
                        </Field>
                        <Field label="Precio *">
                          <input type="number" value={lineForm.price} onChange={e => setLineForm((p: any) => ({ ...p, price: e.target.value }))} placeholder="0.00" style={INPUT} />
                        </Field>
                        <Field label="IVA">
                          <select value={String(lineForm.tax_rate)} onChange={e => setLineForm((p: any) => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
                            <option value="16">IVA 16%</option>
                            <option value="0">Tasa 0%</option>
                            <option value="-1">Exento</option>
                            <option value="8">IVA 8%</option>
                          </select>
                        </Field>
                        <Field label="Unidad cobro">
                          <select value={lineForm.unit_label ?? ""} onChange={e => setLineForm((p: any) => ({ ...p, unit_label: e.target.value }))} style={SELECT}>
                            <option value="">— —</option>
                            {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </Field>
                      </div>
                      <Field label="Notas">
                        <input value={lineForm.notes} onChange={e => setLineForm((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" style={INPUT} />
                      </Field>
                      <button onClick={() => addLine(ci, concept)} disabled={!lineForm.description.trim() || !lineForm.price}
                        style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
                        + Agregar línea
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

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
                <input value={conceptForm.description} onChange={e => setConceptForm(p => ({ ...p, description: e.target.value }))} placeholder="ej: Coordinación de Transporte Nacional" style={INPUT} />
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
