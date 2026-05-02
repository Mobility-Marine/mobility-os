"use client";

// ═══════════════════════════════════════════════════════════════════════
// ConceptosSection — Conceptos cobrados del CFDI
// Estilos: inline + CSS variables
// ═══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import type { CFDIBaseData, CFDIConceptoLine, CartaPorteParentType } from "../../types/carta_porte.types";
import { newConcepto } from "../../types/carta_porte.defaults";

const TASAS_IVA = [
  { value: 0.16, label: "IVA 16%" },
  { value: 0.08, label: "IVA 8% (frontera)" },
  { value: 0,    label: "IVA 0% / Tasa cero" },
];

const TASAS_RETENCION = [
  { value: 0,        label: "Sin retención" },
  { value: 0.04,     label: "IVA retenido 4% (transporte terrestre)" },
  { value: 0.106667, label: "IVA retenido 2/3 partes" },
  { value: 0.16,     label: "IVA retenido 16% completo" },
];

interface Props {
  data: CFDIBaseData;
  setBase: (next: CFDIBaseData) => void;
  parentType: CartaPorteParentType;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function ConceptosSection({ data, setBase, parentType, showValidation, errors }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(data.conceptos[0]?._temp_id ?? null);

  // Empty state para Traslado
  if (parentType === "traslado_carta_porte") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "48px 24px", maxWidth: "480px", margin: "0 auto",
      }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "var(--radius-md)",
          background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.832-2.815L13.832 4.107c-.77-1.333-2.694-1.333-3.464 0L3.34 16.185A2 2 0 005.07 19z" />
          </svg>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>
          No aplica para Traslado
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Los CFDI Tipo T (Traslado) <strong>no tienen valor comercial</strong>.
          La mercancía a transportar se captura en la sección "Mercancías" del complemento.
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "14px", opacity: 0.7 }}>
          Continúa al siguiente paso →
        </div>
      </div>
    );
  }

  const updateConcepto = (id: string, patch: Partial<CFDIConceptoLine>) => {
    setBase({ ...data, conceptos: data.conceptos.map(c => c._temp_id === id ? { ...c, ...patch } : c) });
  };

  const addConcepto = () => {
    const n = newConcepto();
    setBase({ ...data, conceptos: [...data.conceptos, n] });
    setExpandedId(n._temp_id);
  };

  const removeConcepto = (id: string) => {
    if (data.conceptos.length <= 1) return;
    setBase({ ...data, conceptos: data.conceptos.filter(c => c._temp_id !== id) });
  };

  const updateBase = (patch: Partial<CFDIBaseData>) => setBase({ ...data, ...patch });

  const totals = data.conceptos.reduce(
    (acc, c) => {
      const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
      acc.subtotal += base;
      acc.iva += base * c.tax_rate;
      acc.ret += base * c.retention_rate;
      return acc;
    },
    { subtotal: 0, iva: 0, ret: 0 }
  );
  const total = totals.subtotal + totals.iva - totals.ret;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "780px" }}>

      <div style={{
        padding: "12px 14px", borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
        fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5,
      }}>
        Conceptos cobrados al cliente. Cada uno con su clave SAT, cantidad, precio e IVA.
        Los totales se calculan automáticamente.
      </div>

      {/* Datos del pago */}
      <div style={{
        padding: "14px 16px", borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Datos del pago
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
          <FieldS label="Moneda">
            <select value={data.currency} onChange={e => updateBase({ currency: e.target.value })} style={INPUT}>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="USD">USD — Dólar americano</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </FieldS>

          {data.currency !== "MXN" && (
            <FieldS label="Tipo de cambio">
              <input type="number" min="0" step="0.0001"
                value={data.exchange_rate || ""}
                onChange={e => updateBase({ exchange_rate: parseFloat(e.target.value) || 1 })}
                style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
            </FieldS>
          )}

          <FieldS label="Método de pago">
            <select
              value={data.payment_method}
              onChange={e => {
                const m = e.target.value as "PUE" | "PPD";
                updateBase({
                  payment_method: m,
                  payment_form: m === "PPD" ? "99" : (data.payment_form === "99" ? "03" : data.payment_form),
                });
              }}
              style={INPUT}
            >
              <option value="PUE">PUE — Pago en una exhibición</option>
              <option value="PPD">PPD — Pago en parcialidades</option>
            </select>
          </FieldS>

          <FieldS label="Forma de pago">
            <select
              value={data.payment_form}
              onChange={e => updateBase({ payment_form: e.target.value })}
              disabled={data.payment_method === "PPD"}
              style={{ ...INPUT, opacity: data.payment_method === "PPD" ? 0.5 : 1 }}
            >
              <option value="01">01 — Efectivo</option>
              <option value="02">02 — Cheque nominativo</option>
              <option value="03">03 — Transferencia electrónica</option>
              <option value="04">04 — Tarjeta de crédito</option>
              <option value="28">28 — Tarjeta de débito</option>
              <option value="99">99 — Por definir (PPD)</option>
            </select>
          </FieldS>
        </div>
      </div>

      {/* Lista conceptos */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Conceptos a facturar
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {data.conceptos.length} {data.conceptos.length === 1 ? "concepto" : "conceptos"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.conceptos.map((c, idx) => (
            <ConceptoCard
              key={c._temp_id}
              concepto={c} index={idx}
              isExpanded={expandedId === c._temp_id}
              canRemove={data.conceptos.length > 1}
              onToggleExpand={() => setExpandedId(expandedId === c._temp_id ? null : c._temp_id)}
              onUpdate={patch => updateConcepto(c._temp_id, patch)}
              onRemove={() => removeConcepto(c._temp_id)}
              showValidation={showValidation} errors={errors}
            />
          ))}

          <button type="button" onClick={addConcepto}
            style={{
              width: "100%", padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--color-border)",
              background: "transparent", color: "var(--color-text-muted)",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar otro concepto
          </button>
        </div>
      </div>

      {/* Totales */}
      <div style={{
        padding: "14px 16px", borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
          Totales (auto-calculados)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <TRow label="Subtotal" value={`${data.currency} $${totals.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
          <TRow label="IVA traslado" value={`${data.currency} $${totals.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
          {totals.ret > 0 && <TRow label="IVA retenido" value={`− ${data.currency} $${totals.ret.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} danger />}
          <div style={{ height: "1px", background: "var(--color-border-faint)", margin: "4px 0" }} />
          <TRow label="Total" value={`${data.currency} $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} highlight />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de un concepto
// ─────────────────────────────────────────────────────────────
function ConceptoCard({
  concepto, index, isExpanded, canRemove, onToggleExpand, onUpdate, onRemove, showValidation, errors,
}: {
  concepto: CFDIConceptoLine;
  index: number;
  isExpanded: boolean;
  canRemove: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CFDIConceptoLine>) => void;
  onRemove: () => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}) {
  const subtotal = concepto.quantity * concepto.unit_price * (1 - concepto.discount_pct / 100);
  const iva = subtotal * concepto.tax_rate;
  const ret = subtotal * concepto.retention_rate;
  const total = subtotal + iva - ret;

  const errCount = showValidation ? errors.filter(e => e.field.includes(`conceptos[${index}]`)).length : 0;

  return (
    <div style={{
      borderRadius: "var(--radius-md)", overflow: "hidden",
      background: "var(--color-bg-subtle)",
      border: isExpanded ? "1px solid var(--color-brand-blue)" : (errCount > 0 ? "1px solid #dc2626" : "1px solid var(--color-border-faint)"),
    }}>
      <button type="button" onClick={onToggleExpand}
        style={{
          width: "100%", padding: "10px 14px",
          background: "transparent", border: "none",
          display: "flex", alignItems: "center", gap: "10px",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          width: "26px", height: "26px", borderRadius: "var(--radius-md)",
          background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 700, color: "var(--color-text-second)", flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {concepto.description || "Sin descripción"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {concepto.quantity} × ${concepto.unit_price.toLocaleString("es-MX")} = ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
        </div>
        {errCount > 0 && !isExpanded && (
          <span style={{
            padding: "2px 7px", borderRadius: "10px",
            background: "var(--color-danger-bg)", color: "var(--color-danger-text)",
            fontSize: "10px", fontWeight: 700, flexShrink: 0,
          }}>
            {errCount} {errCount === 1 ? "error" : "errores"}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <FieldS label="Descripción del concepto" required>
            <input type="text" value={concepto.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Ej: Servicio de transporte logístico Querétaro - Monterrey"
              style={INPUT}
            />
          </FieldS>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            <FieldS label="Clave SAT producto/servicio" required hint="Para servicios de transporte: 78101800">
              <input type="text" value={concepto.product_key}
                onChange={e => onUpdate({ product_key: e.target.value.toUpperCase() })}
                maxLength={15} placeholder="78101800"
                style={{ ...INPUT, fontFamily: "monospace" }}
              />
            </FieldS>

            <FieldS label="Clave SAT unidad" required hint="E48 servicio · H87 pieza · KGM kilo">
              <input type="text" value={concepto.unit_key}
                onChange={e => onUpdate({ unit_key: e.target.value.toUpperCase() })}
                maxLength={3} placeholder="E48"
                style={{ ...INPUT, fontFamily: "monospace" }}
              />
            </FieldS>

            <FieldS label="Unidad descriptiva">
              <input type="text" value={concepto.unit ?? ""}
                onChange={e => onUpdate({ unit: e.target.value || undefined })}
                placeholder="Servicio, Pieza, etc."
                style={INPUT}
              />
            </FieldS>

            <FieldS label="Cantidad" required>
              <input type="number" min="0" step="0.001"
                value={concepto.quantity || ""}
                onChange={e => onUpdate({ quantity: parseFloat(e.target.value) || 0 })}
                style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
            </FieldS>

            <FieldS label="Precio unitario" required>
              <input type="number" min="0" step="0.01"
                value={concepto.unit_price || ""}
                onChange={e => onUpdate({ unit_price: parseFloat(e.target.value) || 0 })}
                style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
            </FieldS>

            <FieldS label="Descuento (%)">
              <input type="number" min="0" max="100" step="0.01"
                value={concepto.discount_pct || ""}
                onChange={e => onUpdate({ discount_pct: parseFloat(e.target.value) || 0 })}
                style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
            </FieldS>

            <FieldS label="IVA traslado">
              <select value={concepto.tax_rate}
                onChange={e => onUpdate({ tax_rate: parseFloat(e.target.value) })}
                style={INPUT}
              >
                {TASAS_IVA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FieldS>

            <FieldS label="Retención de IVA">
              <select value={concepto.retention_rate}
                onChange={e => onUpdate({ retention_rate: parseFloat(e.target.value) })}
                style={INPUT}
              >
                {TASAS_RETENCION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FieldS>
          </div>

          {/* Mini total */}
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
            display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px",
          }}>
            <Mini label="Subtotal" value={`$${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
            <Mini label="IVA" value={`$${iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
            {ret > 0 && <Mini label="Retención" value={`−$${ret.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} danger />}
            <div style={{ height: "1px", background: "var(--color-border-faint)", margin: "2px 0" }} />
            <Mini label="Total línea" value={`$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} highlight />
          </div>

          {canRemove && (
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
              <button type="button" onClick={onRemove}
                style={{
                  padding: "6px 12px", fontSize: "11px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-danger-border)",
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger-text)",
                  cursor: "pointer", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Eliminar concepto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Estilos compartidos
// ─────────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function FieldS({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function TRow({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: highlight ? "13px" : "12px" }}>
      <span style={{ color: highlight ? "var(--color-text-primary)" : "var(--color-text-muted)", fontWeight: highlight ? 700 : 400 }}>{label}</span>
      <span style={{
        fontWeight: highlight ? 700 : 600,
        color: danger ? "var(--color-danger-text)" : (highlight ? "var(--color-brand-blue)" : "var(--color-text-primary)"),
        fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
    </div>
  );
}

function Mini({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{
        fontWeight: highlight ? 700 : 500,
        color: danger ? "var(--color-danger-text)" : (highlight ? "var(--color-brand-blue)" : "var(--color-text-primary)"),
        fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
    </div>
  );
}
