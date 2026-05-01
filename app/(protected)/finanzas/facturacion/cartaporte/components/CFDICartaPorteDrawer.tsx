"use client";

// ═══════════════════════════════════════════════════════════════════════
// CFDICartaPorteDrawer — Drawer COMPLETO de Factura/Traslado con Carta Porte
// 
// Combina en un solo flujo:
//   - Datos del CFDI base (Cliente + Conceptos)
//   - Complemento Carta Porte 3.1 (6 secciones)
// 
// Total: 8 pasos en el stepper.
// 
// Para "traslado_carta_porte" omite el paso de Conceptos (no aplica).
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from "react";
import type {
  CartaPorteData,
  CartaPorteParentType,
  CFDIBaseData,
  CFDIClienteData,
  CFDIConCartaPorteData,
} from "../types/carta_porte.types";
import {
  defaultCFDIConCartaPorte,
} from "../types/carta_porte.defaults";
import {
  validateCFDIConCartaPorte,
  groupErrorsBySection,
} from "../types/carta_porte.validations";

import { ClienteSection }         from "./sections/ClienteSection";
import { ConceptosSection }       from "./sections/ConceptosSection";
import { DatosGeneralesSection }  from "./sections/DatosGeneralesSection";
import { UbicacionesSection }     from "./sections/UbicacionesSection";
import { MercanciasSection }      from "./sections/MercanciasSection";
import { ModoTransporteSection }  from "./sections/ModoTransporteSection";
import { FigurasSection }         from "./sections/FigurasSection";
import { RegimenAduaneroSection } from "./sections/RegimenAduaneroSection";

// ─────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────
type StepId =
  | "cliente"
  | "conceptos"
  | "datos_generales"
  | "ubicaciones"
  | "mercancias"
  | "modo_transporte"
  | "figuras"
  | "resumen";

type Step = {
  id: StepId;
  label: string;
  shortLabel: string;
  number: number;
  errorSection: string | null;
  hideForTraslado?: boolean;
};

const STEPS_ALL: Step[] = [
  { id: "cliente",         label: "Cliente",            shortLabel: "Cliente",     number: 1, errorSection: "cliente" },
  { id: "conceptos",       label: "Conceptos",          shortLabel: "Conceptos",   number: 2, errorSection: "conceptos", hideForTraslado: true },
  { id: "datos_generales", label: "Datos Generales",    shortLabel: "Datos",       number: 3, errorSection: "header" },
  { id: "ubicaciones",     label: "Ubicaciones",        shortLabel: "Ubicaciones", number: 4, errorSection: "ubicaciones" },
  { id: "mercancias",      label: "Mercancías",         shortLabel: "Mercancías",  number: 5, errorSection: "mercancias" },
  { id: "modo_transporte", label: "Transporte",         shortLabel: "Transporte",  number: 6, errorSection: "modo_transporte" },
  { id: "figuras",         label: "Figuras",            shortLabel: "Figuras",     number: 7, errorSection: "figuras" },
  { id: "resumen",         label: "Resumen y Timbrar",  shortLabel: "Resumen",     number: 8, errorSection: null },
];

interface Props {
  open: boolean;
  parentType: CartaPorteParentType;
  saving?: boolean;
  onClose: () => void;
  onSaveDraft?: (data: CFDIConCartaPorteData) => Promise<void> | void;
  onStamp?: (data: CFDIConCartaPorteData) => Promise<void> | void;
}

export function CFDICartaPorteDrawer({
  open,
  parentType,
  saving = false,
  onClose,
  onSaveDraft,
  onStamp,
}: Props) {
  const [data, setData] = useState<CFDIConCartaPorteData>(defaultCFDIConCartaPorte);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Filtrar pasos según parentType (Traslado oculta Conceptos)
  const isTraslado = parentType === "traslado_carta_porte";
  const STEPS = useMemo(
    () => STEPS_ALL.filter(s => !(isTraslado && s.hideForTraslado)).map((s, idx) => ({ ...s, number: idx + 1 })),
    [isTraslado]
  );

  // Validación reactiva
  const validation = useMemo(() => validateCFDIConCartaPorte(data), [data]);
  const groupedErrors = useMemo(() => groupErrorsBySection(validation.errors), [validation]);

  // ─── Updaters atómicos ───
  const setCliente = useCallback((next: CFDIClienteData) => {
    setData(prev => ({ ...prev, base: { ...prev.base, cliente: next } }));
  }, []);

  const setBase = useCallback((next: CFDIBaseData) => {
    setData(prev => ({ ...prev, base: next }));
  }, []);

  const updateHeader = useCallback((patch: Partial<CartaPorteData["header"]>) => {
    setData(prev => ({
      ...prev,
      carta_porte: { ...prev.carta_porte, header: { ...prev.carta_porte.header, ...patch } },
    }));
  }, []);

  const setUbicaciones = useCallback((next: CartaPorteData["ubicaciones"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, ubicaciones: next } }));
  }, []);

  const setMercancias = useCallback((next: CartaPorteData["mercancias"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, mercancias: next } }));
  }, []);

  const setMercanciasAgregado = useCallback((next: CartaPorteData["mercancias_agregado"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, mercancias_agregado: next } }));
  }, []);

  const setAutotransporte = useCallback((next: CartaPorteData["autotransporte"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, autotransporte: next } }));
  }, []);

  const setMaritimo = useCallback((next: CartaPorteData["transporte_maritimo"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, transporte_maritimo: next } }));
  }, []);

  const setAereo = useCallback((next: CartaPorteData["transporte_aereo"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, transporte_aereo: next } }));
  }, []);

  const setFerroviario = useCallback((next: CartaPorteData["transporte_ferroviario"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, transporte_ferroviario: next } }));
  }, []);

  const setFiguras = useCallback((next: CartaPorteData["figuras"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, figuras: next } }));
  }, []);

  const setRegimenes = useCallback((next: CartaPorteData["regimenes_aduaneros"]) => {
    setData(prev => ({ ...prev, carta_porte: { ...prev.carta_porte, regimenes_aduaneros: next } }));
  }, []);

  if (!open) return null;

  const titleBase = parentType === "factura_carta_porte" ? "Factura con Carta Porte" : "Traslado con Carta Porte";
  const subtitle = parentType === "factura_carta_porte"
    ? "CFDI Tipo I + Complemento Carta Porte 3.1"
    : "CFDI Tipo T + Complemento Carta Porte 3.1";

  const goToStep   = (idx: number) => setCurrentStep(idx);
  const goPrev     = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const goNext     = () => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1));
  const isLastStep = currentStep === STEPS.length - 1;
  const currentStepDef = STEPS[currentStep];

  const errorsCountByStep = (step: Step): number => {
    if (!step.errorSection) return 0;
    return (groupedErrors as any)[step.errorSection]?.length ?? 0;
  };

  // ─── Acciones ───
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    await onSaveDraft(data);
  };

  const handleStamp = async () => {
    setShowValidation(true);
    if (!validation.ok) {
      // Saltar al primer paso con error
      const firstErrorStep = STEPS.findIndex(s => s.errorSection && errorsCountByStep(s) > 0);
      if (firstErrorStep >= 0) setCurrentStep(firstErrorStep);
      return;
    }
    if (!onStamp) return;
    await onStamp(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-start justify-between bg-slate-900/80">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-blue-400 uppercase font-medium">
              Carta Porte 3.1
            </p>
            <h2 className="text-xl font-semibold text-white mt-1">{titleBase}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 -mr-1" aria-label="Cerrar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-slate-700 bg-slate-900/50 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {STEPS.map((step, idx) => {
              const isActive   = idx === currentStep;
              const isPast     = idx < currentStep;
              const errorCount = showValidation ? errorsCountByStep(step) : 0;
              const hasError   = errorCount > 0;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                    isActive   ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : isPast   ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive ? "bg-white/20" : isPast ? "bg-blue-600 text-white" : hasError ? "bg-red-600/80 text-white" : "bg-slate-700"
                  }`}>
                    {hasError ? "!" : isPast ? "✓" : step.number}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                  {hasError && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-600/30 text-red-300 rounded">
                      {errorCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
          {currentStepDef.id === "cliente" && (
            <ClienteSection
              data={data.base}
              setCliente={setCliente}
              showValidation={showValidation}
              errors={(groupedErrors as any).cliente ?? []}
            />
          )}
          {currentStepDef.id === "conceptos" && (
            <ConceptosSection
              data={data.base}
              setBase={setBase}
              parentType={parentType}
              showValidation={showValidation}
              errors={(groupedErrors as any).conceptos ?? []}
            />
          )}
          {currentStepDef.id === "datos_generales" && (
            <DatosGeneralesSection
              data={data.carta_porte}
              updateHeader={updateHeader}
              parentType={parentType}
              showValidation={showValidation}
              errors={groupedErrors.header ?? []}
            />
          )}
          {currentStepDef.id === "ubicaciones" && (
            <UbicacionesSection
              data={data.carta_porte}
              setUbicaciones={setUbicaciones}
              showValidation={showValidation}
              errors={groupedErrors.ubicaciones ?? []}
            />
          )}
          {currentStepDef.id === "mercancias" && (
            <MercanciasSection
              data={data.carta_porte}
              setMercancias={setMercancias}
              setMercanciasAgregado={setMercanciasAgregado}
              showValidation={showValidation}
              errors={groupedErrors.mercancias ?? []}
            />
          )}
          {currentStepDef.id === "modo_transporte" && (
            <ModoTransporteSection
              data={data.carta_porte}
              setAutotransporte={setAutotransporte}
              setMaritimo={setMaritimo}
              setAereo={setAereo}
              setFerroviario={setFerroviario}
              showValidation={showValidation}
              errors={groupedErrors.modo_transporte ?? []}
            />
          )}
          {currentStepDef.id === "figuras" && (
            <div className="space-y-8">
              <FigurasSection
                data={data.carta_porte}
                setFiguras={setFiguras}
                showValidation={showValidation}
                errors={groupedErrors.figuras ?? []}
              />
              {data.carta_porte.header.transp_internac === "Sí" && (
                <div className="pt-6 border-t border-slate-700/50">
                  <RegimenAduaneroSection
                    data={data.carta_porte}
                    setRegimenes={setRegimenes}
                    showValidation={showValidation}
                    errors={groupedErrors.regimen_aduanero ?? []}
                  />
                </div>
              )}
            </div>
          )}
          {currentStepDef.id === "resumen" && (
            <ResumenSection
              data={data}
              parentType={parentType}
              validation={validation}
              showValidation={showValidation}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between bg-slate-900/80">
          <button
            onClick={goPrev}
            disabled={currentStep === 0 || saving}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
            {validation.errors.length > 0 && showValidation && (
              <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded">
                {validation.errors.length} {validation.errors.length === 1 ? "error" : "errores"}
              </span>
            )}
            {validation.ok && (
              <span className="px-2 py-1 bg-emerald-600/20 text-emerald-300 rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Válido para timbrar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                onClick={goNext}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={!onSaveDraft || saving}
                  className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition"
                  title={!onSaveDraft ? "Guardar borrador estará disponible al finalizar el wiring" : ""}
                >
                  {saving ? "Guardando..." : "Guardar borrador"}
                </button>
                <button
                  onClick={handleStamp}
                  disabled={!onStamp || saving}
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  title={!onStamp ? "Timbrado estará disponible al finalizar el wiring" : ""}
                >
                  {saving ? "Timbrando..." : "Timbrar CFDI"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sección de Resumen
// ─────────────────────────────────────────────────────────────
function ResumenSection({
  data,
  parentType,
  validation,
  showValidation,
}: {
  data: CFDIConCartaPorteData;
  parentType: CartaPorteParentType;
  validation: { ok: boolean; errors: any[] };
  showValidation: boolean;
}) {
  const totals = data.base.conceptos.reduce(
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
    <div className="space-y-5 max-w-3xl">
      <div className="bg-gradient-to-br from-blue-950/40 to-emerald-950/40 border border-blue-800/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Resumen del CFDI</h3>
        <p className="text-xs text-slate-400">Verifica los datos antes de timbrar al SAT.</p>
      </div>

      {/* Validación */}
      {showValidation && !validation.ok && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-200 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {validation.errors.length} {validation.errors.length === 1 ? "error" : "errores"} de validación
          </h4>
          <ul className="space-y-1 text-xs text-red-300/90">
            {validation.errors.slice(0, 10).map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-500">•</span>
                <span>{e.message}</span>
              </li>
            ))}
            {validation.errors.length > 10 && (
              <li className="text-red-400/80 mt-1">… y {validation.errors.length - 10} más</li>
            )}
          </ul>
        </div>
      )}

      {/* Datos del CFDI */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Datos del CFDI
        </h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500 text-xs">Tipo</dt>
            <dd className="text-white mt-0.5">
              {parentType === "factura_carta_porte" ? "Factura (I)" : "Traslado (T)"} + Carta Porte 3.1
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Cliente</dt>
            <dd className="text-white mt-0.5">{data.base.cliente.receiver_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">RFC receptor</dt>
            <dd className="text-white mt-0.5 font-mono text-xs">{data.base.cliente.receiver_rfc || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Uso CFDI</dt>
            <dd className="text-white mt-0.5">{data.base.cliente.receiver_cfdi_use}</dd>
          </div>
        </dl>
      </div>

      {/* Totales (solo factura) */}
      {parentType === "factura_carta_porte" && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
          <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
            Totales
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white tabular-nums">{data.base.currency} ${totals.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">IVA</span><span className="text-white tabular-nums">{data.base.currency} ${totals.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
            {totals.ret > 0 && <div className="flex justify-between"><span className="text-slate-400">Retención</span><span className="text-red-300 tabular-nums">−{data.base.currency} ${totals.ret.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>}
            <div className="flex justify-between pt-2 border-t border-slate-700"><span className="text-white font-semibold">Total</span><span className="text-emerald-300 font-bold text-base tabular-nums">{data.base.currency} ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      )}

      {/* Resumen de Carta Porte */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-3">
          Resumen Carta Porte
        </h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500 text-xs">Operación</dt>
            <dd className="text-white mt-0.5">
              {data.carta_porte.header.transp_internac === "Sí" ? "Internacional" : "Nacional"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Distancia total</dt>
            <dd className="text-white mt-0.5 tabular-nums">
              {data.carta_porte.header.total_dist_rec.toLocaleString("es-MX")} km
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Ubicaciones</dt>
            <dd className="text-white mt-0.5">{data.carta_porte.ubicaciones.length}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Mercancías</dt>
            <dd className="text-white mt-0.5">{data.carta_porte.mercancias.length}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Peso bruto</dt>
            <dd className="text-white mt-0.5 tabular-nums">
              {data.carta_porte.mercancias_agregado.peso_bruto_total.toLocaleString("es-MX")} {data.carta_porte.mercancias_agregado.unidad_peso}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Figuras</dt>
            <dd className="text-white mt-0.5">{data.carta_porte.figuras.length}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
        <p className="text-sm text-emerald-200/90">
          ✓ Cuando esté todo correcto, presiona <strong className="text-white">"Timbrar CFDI"</strong> para
          enviarlo al SAT vía Facturapi. El proceso es irreversible una vez timbrado.
        </p>
      </div>
    </div>
  );
}
