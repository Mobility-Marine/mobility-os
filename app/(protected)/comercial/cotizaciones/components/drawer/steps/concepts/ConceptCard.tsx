"use client";
import { useState } from "react";
import { Field, SELECT, INPUT } from "../../drawerShared";
import { CURRENCIES, SERVICE_TYPES, SERVICE_TYPE_CONFIG } from "../../../../types/quotations.types";
import type { ServiceType, CreateServicePayload } from "../../../../types/quotations.types";
import type { BillingConceptDraft } from "../../drawerState";
import { useTranslation } from "@/lib/i18n/useTranslation";
import LineRow from "./LineRow";

type LineDraft = Omit<CreateServicePayload, "quotation_id">;

const UNIT_LABELS = [
  "Por servicio", "Por contenedor", "Por BL", "Por pedimento",
  "Por factura", "Por kg", "Por tonelada", "Por m³", "Por W/M",
  "Por pieza", "Por embarque", "Por trámite",
];

const EMPTY_LINE = (currency: string): LineDraft => ({
  service_type: "terrestre" as ServiceType,
  description: "", currency,
  price: "" as any, tax_rate: 16,
  unit_label: "" as any,
  quantity: 1 as any,
} as any);

interface Props {
  concept:    BillingConceptDraft;
  svcCatalog: any[];
  // Callbacks que mutan el array del padre — únicas vías para tocar el state global
  onConceptUpdate: (patch: Partial<BillingConceptDraft>) => void;
  onConceptDelete: () => void;
  onLineAdd:       (line: LineDraft) => void;
  onLineUpdate:    (lineIdx: number, line: LineDraft) => void;
  onLineDelete:    (lineIdx: number) => void;
  // Bloqueos cross-card
  globalLockKey:   string | null;
  setGlobalLockKey: (key: string | null) => void;
}

/**
 * Tarjeta completa de concepto. Maneja:
 *  - Modo expandido/colapsado
 *  - Header con su propio modo view/edit (zero-touch cancel)
 *  - Body con LineRow por cada línea + form de nueva línea
 *  - Bloqueo de doble edición vía globalLockKey
 */
export default function ConceptCard({
  concept, svcCatalog,
  onConceptUpdate, onConceptDelete,
  onLineAdd, onLineUpdate, onLineDelete,
  globalLockKey, setGlobalLockKey,
}: Props) {
  const { t } = useTranslation();
  const [isExpanded,    setIsExpanded]    = useState(false);
  const [isHeaderEdit,  setIsHeaderEdit]  = useState(false);
  const [headerDraft,   setHeaderDraft]   = useState({ description: "", product_id: "", currency: "" });
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [newLineDraft,  setNewLineDraft]  = useState<LineDraft>(EMPTY_LINE(concept.currency));

  const myLockKey = `concept:${concept.tempId}`;
  const lineLockKey = (idx: number) => `${myLockKey}:line:${idx}`;
  const blockedByOther = globalLockKey !== null && !globalLockKey.startsWith(myLockKey) && globalLockKey !== myLockKey;
  const someLineEditingHere = editingLineIdx !== null;

  // ── Header: editar concepto ──────────────────────────────────
  function startHeaderEdit() {
    setHeaderDraft({
      description: concept.description,
      product_id:  concept.product_id ?? "",
      currency:    concept.currency,
    });
    setIsHeaderEdit(true);
    setIsExpanded(true);
    setGlobalLockKey(myLockKey);
  }
  function cancelHeaderEdit() {
    setIsHeaderEdit(false);
    setGlobalLockKey(null);
  }
  function saveHeaderEdit() {
    if (!headerDraft.description.trim()) return;
    onConceptUpdate({
      description: headerDraft.description.trim(),
      product_id:  headerDraft.product_id || undefined,
      currency:    headerDraft.currency,
    });
    setIsHeaderEdit(false);
    setGlobalLockKey(null);
  }
  function deleteConceptWithConfirm() {
    const linesCount = concept.lines.length;
    const msg = linesCount > 0
      ? `¿Eliminar el concepto "${concept.description}" y sus ${linesCount} línea${linesCount !== 1 ? "s" : ""} de detalle?\n\nEsta acción no se puede deshacer.`
      : `¿Eliminar el concepto "${concept.description}"?`;
    if (window.confirm(msg)) onConceptDelete();
  }

  // ── Líneas: callbacks ─────────────────────────────────────────
  function handleLineEditingChange(idx: number, isEditing: boolean) {
    if (isEditing) {
      setEditingLineIdx(idx);
      setGlobalLockKey(lineLockKey(idx));
    } else {
      setEditingLineIdx(null);
      setGlobalLockKey(null);
    }
  }
  function addNewLine() {
    if (!newLineDraft.description?.trim() || !newLineDraft.price) return;
    onLineAdd({ ...newLineDraft, price: Number(newLineDraft.price) });
    setNewLineDraft(EMPTY_LINE(concept.currency));
  }

  // Producto del catálogo asociado (si lo hay)
  const product     = svcCatalog.find(p => p.id === concept.product_id);
  const productName = product?.name;

  // Total del concepto (suma simple de price)
  const total = concept.lines.reduce((s, l) => s + Number(l.price), 0);

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-base)",
      border: `1px solid ${isExpanded ? "var(--color-brand-blue)" : "var(--color-border)"}`,
      overflow: "hidden",
    }}>
      {/* HEADER ─────────────────────────────────────────────── */}
      {isHeaderEdit ? (
        <div style={{
          padding: "14px",
          background: "var(--color-warning-bg)",
          borderBottom: "2px solid var(--color-warning-border)",
          display: "grid", gap: "10px",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--color-warning-text)", letterSpacing: "0.5px" }}>
            EDITANDO CONCEPTO
          </div>
          <Field label="Concepto del catálogo — para CFDI (no aparece en PDF)">
            <select value={headerDraft.product_id} onChange={(e) => setHeaderDraft(p => ({ ...p, product_id: e.target.value }))} style={SELECT}>
              <option value="">— Sin vincular —</option>
              {svcCatalog.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
            </select>
          </Field>
          <Field label="Nombre del concepto (visible en PDF) *">
            <input value={headerDraft.description} onChange={(e) => setHeaderDraft(p => ({ ...p, description: e.target.value }))} style={INPUT} />
          </Field>
          <Field label="Moneda">
            <select value={headerDraft.currency} onChange={(e) => setHeaderDraft(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
            <button
              onClick={saveHeaderEdit}
              disabled={!headerDraft.description.trim()}
              style={{
                height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "12px", fontWeight: 700,
                cursor: !headerDraft.description.trim() ? "not-allowed" : "pointer",
                opacity: !headerDraft.description.trim() ? 0.5 : 1,
              }}
            >
              Guardar cambios
            </button>
            <button
              onClick={cancelHeaderEdit}
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
      ) : (
        <div style={{
          padding: "12px 14px",
          background: "var(--color-bg-subtle)",
          display: "flex", alignItems: "center", gap: "10px",
          cursor: blockedByOther ? "not-allowed" : "pointer",
          opacity: blockedByOther ? 0.5 : 1,
        }} onClick={() => !blockedByOther && setIsExpanded(v => !v)}>
          <span style={{
            fontSize: "9px", fontWeight: 800, padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-info-bg)", color: "var(--color-info-text)",
            border: "1px solid var(--color-info-border)",
            letterSpacing: "0.5px", flexShrink: 0,
          }}>CFDI</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {productName ?? concept.description}
            </div>
            {productName && productName !== concept.description && (
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                En PDF: {concept.description}
              </div>
            )}
          </div>
          {total > 0 && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", flexShrink: 0 }}>
              {concept.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          )}
          <span style={{ color: "var(--color-text-muted)", fontSize: "11px", marginRight: "4px" }}>
            {isExpanded ? "▲" : "▼"}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); startHeaderEdit(); }}
            disabled={blockedByOther}
            title="Editar concepto"
            style={{
              height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", border: "none",
              cursor: blockedByOther ? "not-allowed" : "pointer", color: "#fff",
              display: "flex", alignItems: "center", gap: "5px",
              flexShrink: 0, fontSize: "11px", fontWeight: 700,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteConceptWithConfirm(); }}
            disabled={blockedByOther}
            title="Eliminar concepto y todas sus líneas"
            style={{
              width: "30px", height: "30px", borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
              cursor: blockedByOther ? "not-allowed" : "pointer",
              color: "var(--color-danger-text)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      )}

      {/* BODY ─ líneas + form nueva línea ───────────────────── */}
      {isExpanded && !isHeaderEdit && (
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "grid", gap: "10px",
        }}>
          {/* Líneas existentes */}
          {concept.lines.length === 0 && (
            <div style={{
              padding: "16px", textAlign: "center",
              fontSize: "11px", color: "var(--color-text-muted)",
              border: "1px dashed var(--color-border-faint)",
              borderRadius: "var(--radius-md)",
            }}>
              Sin líneas de detalle. Agrega la primera abajo.
            </div>
          )}
          {concept.lines.map((line, li) => (
            <LineRow
              key={(line as any).id ?? `tmp-${li}`}
              line={line}
              index={li}
              blockedByOtherEdit={editingLineIdx !== null && editingLineIdx !== li}
              onSave={(updated) => onLineUpdate(li, updated)}
              onDelete={() => onLineDelete(li)}
              onEditingChange={(isEditing) => handleLineEditingChange(li, isEditing)}
            />
          ))}

          {/* Form nueva línea — bloqueado mientras hay edición de línea aquí */}
          {someLineEditingHere ? (
            <div style={{
              padding: "12px", textAlign: "center",
              fontSize: "11px", color: "var(--color-text-muted)",
              border: "1px dashed var(--color-border-faint)",
              borderRadius: "var(--radius-md)",
            }}>
              Termina de editar la línea activa para agregar una nueva.
            </div>
          ) : (
            <div style={{
              background: "var(--color-bg-subtle)",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "12px", display: "grid", gap: "8px",
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                + Nueva línea de detalle
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                <Field label="Tipo *">
                  <select value={newLineDraft.service_type} onChange={(e) => setNewLineDraft(p => ({ ...p, service_type: e.target.value as ServiceType }))} style={SELECT}>
                    {SERVICE_TYPES.map((st) => {
                      const cfg   = SERVICE_TYPE_CONFIG[st];
                      const label = (t.quot as any)?.[cfg.labelKey.replace("quot.", "")] ?? st;
                      return <option key={st} value={st}>{label}</option>;
                    })}
                  </select>
                </Field>
                <Field label="Descripción *">
                  <input value={newLineDraft.description} onChange={(e) => setNewLineDraft(p => ({ ...p, description: e.target.value }))} placeholder="Honorarios agente aduanal, certificado de origen, maniobras…" style={INPUT} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "8px" }}>
                <Field label="Cantidad *">
                  <input type="number" min="1" value={(newLineDraft as any).quantity ?? 1} onChange={(e) => setNewLineDraft(p => ({ ...p, quantity: Number(e.target.value) || 1 } as any))} style={INPUT} />
                </Field>
                <Field label="Unidad de cobro *">
                  <select value={(newLineDraft as any).unit_label || ""} onChange={(e) => setNewLineDraft(p => ({ ...p, unit_label: e.target.value } as any))} style={SELECT}>
                    <option value="">— Selecciona —</option>
                    {UNIT_LABELS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="Precio unitario *">
                  <input type="number" step="0.01" value={String(newLineDraft.price ?? "")} onChange={(e) => setNewLineDraft(p => ({ ...p, price: e.target.value as any }))} placeholder="0.00" style={INPUT} />
                </Field>
                <Field label="Total (auto)">
                  <input value={`$${(Number(newLineDraft.price) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} readOnly style={{ ...INPUT, background: "var(--color-bg-base)" }} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
                <Field label="Moneda">
                  <select value={newLineDraft.currency} onChange={(e) => setNewLineDraft(p => ({ ...p, currency: e.target.value }))} style={SELECT}>
                    {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                  </select>
                </Field>
                <Field label="IVA">
                  <select value={String(newLineDraft.tax_rate ?? 16)} onChange={(e) => setNewLineDraft(p => ({ ...p, tax_rate: Number(e.target.value) }))} style={SELECT}>
                    <option value="16">IVA 16%</option>
                    <option value="0">Tasa 0%</option>
                    <option value="-1">Exento</option>
                    <option value="8">IVA 8%</option>
                  </select>
                </Field>
                <Field label="Notas">
                  <input value={newLineDraft.notes ?? ""} onChange={(e) => setNewLineDraft(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones…" style={INPUT} />
                </Field>
              </div>
              <button
                onClick={addNewLine}
                disabled={!newLineDraft.description?.trim() || !newLineDraft.price}
                style={{
                  height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)",
                  background: "var(--color-brand-blue)", color: "#fff", border: "none",
                  fontSize: "12px", fontWeight: 700,
                  cursor: !newLineDraft.description?.trim() || !newLineDraft.price ? "not-allowed" : "pointer",
                  opacity: !newLineDraft.description?.trim() || !newLineDraft.price ? 0.5 : 1,
                  marginTop: "4px",
                }}
              >
                + Agregar línea
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}