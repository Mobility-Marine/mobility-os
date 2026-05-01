"use client";

// ═══════════════════════════════════════════════════════════════════════
// ConceptosSection — Captura los conceptos cobrados del CFDI
// 
// Cada concepto = un item facturado (servicio de transporte, consultoría,
// reparación, etc.). Calcula automáticamente subtotales, IVA y total.
// 
// Para "factura_carta_porte": estos son los servicios cobrados al cliente.
// Para "traslado_carta_porte": NO se usa (los traslados no tienen valor
// comercial, solo se mueve mercancía).
// ═══════════════════════════════════════════════════════════════════════

import { useState } from "react";
import type { CFDIBaseData, CFDIConceptoLine, CartaPorteParentType } from "../../types/carta_porte.types";
import { newConcepto } from "../../types/carta_porte.defaults";

interface Props {
  data: CFDIBaseData;
  setBase: (next: CFDIBaseData) => void;
  parentType: CartaPorteParentType;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

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

export function ConceptosSection({ data, setBase, parentType, showValidation, errors }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.conceptos[0]?._temp_id ?? null
  );

  // Para Traslado, no se usan conceptos comerciales — mostrar empty state
  if (parentType === "traslado_carta_porte") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.832-2.815z M5.07 19l8.93-15.07c.77-1.333 2.694-1.333 3.464 0" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No aplica para Traslado</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Los CFDI Tipo T (Traslado) <strong className="text-white">no tienen valor comercial</strong>.
          La mercancía a transportar se captura en la sección "Mercancías" del complemento.
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Continúa al siguiente paso para llenar los datos del CCP.
        </p>
      </div>
    );
  }

  const updateConcepto = (tempId: string, patch: Partial<CFDIConceptoLine>) => {
    setBase({
      ...data,
      conceptos: data.conceptos.map(c =>
        c._temp_id === tempId ? { ...c, ...patch } : c
      ),
    });
  };

  const addConcepto = () => {
    const nuevo = newConcepto();
    setBase({ ...data, conceptos: [...data.conceptos, nuevo] });
    setExpandedId(nuevo._temp_id);
  };

  const removeConcepto = (tempId: string) => {
    if (data.conceptos.length <= 1) return; // mínimo 1
    setBase({ ...data, conceptos: data.conceptos.filter(c => c._temp_id !== tempId) });
  };

  const updateBase = (patch: Partial<CFDIBaseData>) => setBase({ ...data, ...patch });

  // ─── Cálculos ───
  const totals = data.conceptos.reduce(
    (acc, c) => {
      const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
      const iva = base * c.tax_rate;
      const ret = base * c.retention_rate;
      acc.subtotal += base;
      acc.iva += iva;
      acc.ret += ret;
      return acc;
    },
    { subtotal: 0, iva: 0, ret: 0 }
  );
  const total = totals.subtotal + totals.iva - totals.ret;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Banner */}
      <div className="bg-gradient-to-br from-emerald-950/40 to-blue-950/40 border border-emerald-800/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-sm text-emerald-100/90 leading-relaxed">
            Conceptos que se cobran al cliente. Cada uno con su clave SAT, cantidad,
            precio e IVA. El total se calcula automáticamente.
          </div>
        </div>
      </div>

      {/* Datos generales del pago */}
      <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Datos del pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Moneda</Label>
            <select
              value={data.currency}
              onChange={e => updateBase({ currency: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="USD">USD — Dólar americano</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          {data.currency !== "MXN" && (
            <div>
              <Label>Tipo de cambio</Label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={data.exchange_rate || ""}
                onChange={e => updateBase({ exchange_rate: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}
          <div>
            <Label>Método de pago</Label>
            <select
              value={data.payment_method}
              onChange={e => {
                const m = e.target.value as "PUE" | "PPD";
                updateBase({
                  payment_method: m,
                  // Auto-ajuste forma de pago según SAT
                  payment_form: m === "PPD" ? "99" : (data.payment_form === "99" ? "03" : data.payment_form),
                });
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="PUE">PUE — Pago en una sola exhibición</option>
              <option value="PPD">PPD — Pago en parcialidades</option>
            </select>
          </div>
          <div>
            <Label>Forma de pago</Label>
            <select
              value={data.payment_form}
              onChange={e => updateBase({ payment_form: e.target.value })}
              disabled={data.payment_method === "PPD"}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
            >
              <option value="01">01 — Efectivo</option>
              <option value="02">02 — Cheque nominativo</option>
              <option value="03">03 — Transferencia electrónica</option>
              <option value="04">04 — Tarjeta de crédito</option>
              <option value="28">28 — Tarjeta de débito</option>
              <option value="99">99 — Por definir (PPD)</option>
            </select>
            {data.payment_method === "PPD" && (
              <p className="text-[11px] text-amber-300 mt-1">PPD requiere forma de pago "99"</p>
            )}
          </div>
        </div>
      </section>

      {/* Lista de conceptos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Conceptos a facturar</h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {data.conceptos.length} {data.conceptos.length === 1 ? "concepto" : "conceptos"}
          </span>
        </div>
        <div className="space-y-2">
          {data.conceptos.map((c, idx) => (
            <ConceptoCard
              key={c._temp_id}
              concepto={c}
              index={idx}
              isExpanded={expandedId === c._temp_id}
              canRemove={data.conceptos.length > 1}
              onToggleExpand={() => setExpandedId(expandedId === c._temp_id ? null : c._temp_id)}
              onUpdate={patch => updateConcepto(c._temp_id, patch)}
              onRemove={() => removeConcepto(c._temp_id)}
              showValidation={showValidation}
              errors={errors}
            />
          ))}
          <button
            type="button"
            onClick={addConcepto}
            className="w-full py-2.5 text-sm border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar otro concepto
          </button>
        </div>
      </section>

      {/* Totales */}
      <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Totales (auto-calculados)
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-white tabular-nums">
              {data.currency} ${totals.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">IVA traslado</span>
            <span className="text-white tabular-nums">
              {data.currency} ${totals.iva.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {totals.ret > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">IVA retenido</span>
              <span className="text-red-300 tabular-nums">
                − {data.currency} ${totals.ret.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-700">
            <span className="text-white font-semibold">Total</span>
            <span className="text-emerald-300 font-bold text-base tabular-nums">
              {data.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de un concepto
// ─────────────────────────────────────────────────────────────
interface ConceptoCardProps {
  concepto: CFDIConceptoLine;
  index: number;
  isExpanded: boolean;
  canRemove: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<CFDIConceptoLine>) => void;
  onRemove: () => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

function ConceptoCard({
  concepto, index, isExpanded, canRemove, onToggleExpand, onUpdate, onRemove,
  showValidation, errors,
}: ConceptoCardProps) {
  const subtotal = concepto.quantity * concepto.unit_price * (1 - concepto.discount_pct / 100);
  const iva = subtotal * concepto.tax_rate;
  const ret = subtotal * concepto.retention_rate;
  const total = subtotal + iva - ret;

  const errorCount = showValidation
    ? errors.filter(e => e.field.includes(`conceptos[${index}]`)).length
    : 0;

  return (
    <div className={`bg-slate-800/30 border rounded-xl overflow-hidden transition ${
      isExpanded ? "border-emerald-500/50" : errorCount > 0 ? "border-red-500/40" : "border-slate-700"
    }`}>
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/50 transition text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-emerald-400 tabular-nums">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">
            {concepto.description || "Sin descripción"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {concepto.quantity} × ${concepto.unit_price.toLocaleString("es-MX")} = ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
        </div>
        {errorCount > 0 && !isExpanded && (
          <span className="px-2 py-0.5 text-[11px] bg-red-600/20 text-red-300 rounded shrink-0">
            {errorCount} {errorCount === 1 ? "error" : "errores"}
          </span>
        )}
        <svg className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-700/50">
          <div className="md:col-span-2 mt-3">
            <Label required>Descripción del concepto</Label>
            <input
              type="text"
              value={concepto.description}
              onChange={e => onUpdate({ description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ej: Servicio de transporte logístico Querétaro - Monterrey"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label required>Clave SAT producto/servicio</Label>
              <input
                type="text"
                value={concepto.product_key}
                onChange={e => onUpdate({ product_key: e.target.value.toUpperCase() })}
                maxLength={15}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="78101800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Para servicios de transporte: <code className="text-emerald-300 bg-emerald-950/40 px-1 rounded">78101800</code>
              </p>
            </div>

            <div>
              <Label required>Clave SAT unidad</Label>
              <input
                type="text"
                value={concepto.unit_key}
                onChange={e => onUpdate({ unit_key: e.target.value.toUpperCase() })}
                maxLength={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="E48"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                <code className="text-emerald-300 bg-emerald-950/40 px-1 rounded">E48</code> servicio,{" "}
                <code className="text-emerald-300 bg-emerald-950/40 px-1 rounded">H87</code> pieza,{" "}
                <code className="text-emerald-300 bg-emerald-950/40 px-1 rounded">KGM</code> kilo
              </p>
            </div>

            <div>
              <Label>Unidad descriptiva</Label>
              <input
                type="text"
                value={concepto.unit ?? ""}
                onChange={e => onUpdate({ unit: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Servicio, Pieza, etc."
              />
            </div>

            <div>
              <Label required>Cantidad</Label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={concepto.quantity || ""}
                onChange={e => onUpdate({ quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <Label required>Precio unitario</Label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={concepto.unit_price || ""}
                onChange={e => onUpdate({ unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <Label>Descuento (%)</Label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={concepto.discount_pct || ""}
                onChange={e => onUpdate({ discount_pct: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Impuestos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-700/50">
            <div>
              <Label>IVA traslado</Label>
              <select
                value={concepto.tax_rate}
                onChange={e => onUpdate({ tax_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {TASAS_IVA.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Retención de IVA</Label>
              <select
                value={concepto.retention_rate}
                onChange={e => onUpdate({ retention_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {TASAS_RETENCION.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mini total del concepto */}
          <div className="bg-slate-900/40 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white tabular-nums">${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">IVA</span><span className="text-white tabular-nums">${iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
            {ret > 0 && <div className="flex justify-between"><span className="text-slate-400">Retención</span><span className="text-red-300 tabular-nums">−${ret.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>}
            <div className="flex justify-between pt-1 border-t border-slate-700/50"><span className="text-emerald-300 font-medium">Total línea</span><span className="text-emerald-300 font-bold tabular-nums">${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
          </div>

          {canRemove && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onRemove}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar concepto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs text-slate-400 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}
