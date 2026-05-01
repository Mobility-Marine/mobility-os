"use client";

// ═══════════════════════════════════════════════════════════════════════
// CFDICartaPorteDrawer — Orquestador del flujo Carta Porte 3.1
// 
// Maneja:
//   - State global del CCP (CartaPorteData)
//   - Navegación entre 6 secciones (stepper)
//   - Validación SAT antes de timbrar
//   - Botones de acción (Anterior, Siguiente, Guardar, Timbrar)
// 
// Cada sección es un componente separado para facilitar mantenimiento.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from "react";
import type {
  CartaPorteData,
  CartaPorteParentType,
} from "../types/carta_porte.types";
import { defaultCartaPorteData } from "../types/carta_porte.defaults";
import {
  validateCartaPorte,
  groupErrorsBySection,
  type ValidationError,
} from "../types/carta_porte.validations";

import { DatosGeneralesSection } from "./sections/DatosGeneralesSection";

import { UbicacionesSection } from "./sections/UbicacionesSection";

// ─────────────────────────────────────────────────────────────
// Definición de pasos del stepper
// ─────────────────────────────────────────────────────────────
type StepId =
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
  errorSection: keyof ReturnType<typeof groupErrorsBySection> | null;
};

const STEPS: Step[] = [
  { id: "datos_generales", label: "Datos Generales", shortLabel: "Datos",       number: 1, errorSection: "header" },
  { id: "ubicaciones",     label: "Ubicaciones",     shortLabel: "Ubicaciones", number: 2, errorSection: "ubicaciones" },
  { id: "mercancias",      label: "Mercancías",      shortLabel: "Mercancías",  number: 3, errorSection: "mercancias" },
  { id: "modo_transporte", label: "Transporte",      shortLabel: "Transporte",  number: 4, errorSection: "modo_transporte" },
  { id: "figuras",         label: "Figuras",         shortLabel: "Figuras",     number: 5, errorSection: "figuras" },
  { id: "resumen",         label: "Resumen y Timbrar", shortLabel: "Resumen",   number: 6, errorSection: null },
];

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  parentType: CartaPorteParentType;
  onClose: () => void;
  // En sub-fase 3.7: onSave, onStamp, editId, etc.
}

// ═════════════════════════════════════════════════════════════
// COMPONENTE
// ═════════════════════════════════════════════════════════════
export function CFDICartaPorteDrawer({ open, parentType, onClose }: Props) {
  const [data, setData]                 = useState<CartaPorteData>(defaultCartaPorteData);
  const [currentStep, setCurrentStep]   = useState<number>(0);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Validación reactiva
  const validation = useMemo(() => validateCartaPorte(data), [data]);
  const groupedErrors = useMemo(() => groupErrorsBySection(validation.errors), [validation]);

  // Updaters atómicos por sección (para evitar pasar el setState completo)
  const updateHeader = useCallback(
    (patch: Partial<CartaPorteData["header"]>) => {
      setData(prev => ({ ...prev, header: { ...prev.header, ...patch } }));
    },
    []
  );

  const setUbicaciones = useCallback(
    (next: CartaPorteData["ubicaciones"]) => {
      setData(prev => ({ ...prev, ubicaciones: next }));
    },
    []
  );

  if (!open) return null;

  const titleBase =
    parentType === "factura_carta_porte"
      ? "Factura con Carta Porte"
      : "Traslado con Carta Porte";

  const subtitle =
    parentType === "factura_carta_porte"
      ? "CFDI Tipo I + Complemento Carta Porte 3.1"
      : "CFDI Tipo T + Complemento Carta Porte 3.1";

  // ───── Navegación ─────
  const goToStep   = (idx: number) => setCurrentStep(idx);
  const goPrev     = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const goNext     = () => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1));
  const isLastStep = currentStep === STEPS.length - 1;

  // Cuántos errores hay por sección (para badges del stepper)
  const errorsCountByStep = (step: Step): number => {
    if (!step.errorSection) return 0;
    return groupedErrors[step.errorSection]?.length ?? 0;
  };

  // ───── Render ─────
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel del drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-start justify-between bg-slate-900/80">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-blue-400 uppercase font-medium">
              Carta Porte 3.1
            </p>
            <h2 className="text-xl font-semibold text-white mt-1">{titleBase}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 -mr-1"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className="px-6 py-3 border-b border-slate-700 bg-slate-900/50 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {STEPS.map((step, idx) => {
              const isActive    = idx === currentStep;
              const isPast      = idx < currentStep;
              const errorCount  = showValidation ? errorsCountByStep(step) : 0;
              const hasError    = errorCount > 0;

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : isPast
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isActive
                        ? "bg-white/20"
                        : isPast
                        ? "bg-blue-600 text-white"
                        : hasError
                        ? "bg-red-600/80 text-white"
                        : "bg-slate-700"
                    }`}
                  >
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

        {/* ── Body (sección activa) ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
          {currentStep === 0 && (
            <DatosGeneralesSection
              data={data}
              updateHeader={updateHeader}
              parentType={parentType}
              showValidation={showValidation}
              errors={groupedErrors.header ?? []}
            />
          )}
          {currentStep === 1 && (
            <UbicacionesSection
              data={data}
              setUbicaciones={setUbicaciones}
              showValidation={showValidation}
              errors={groupedErrors.ubicaciones ?? []}
            />
          )}
          {currentStep === 2 && (
            <PlaceholderSection
              title="Mercancías"
              subtitle="Lista de bienes transportados con peso y características"
              phase="3.4"
            />
          )}
          {currentStep === 3 && (
            <PlaceholderSection
              title="Modo de Transporte"
              subtitle="Detalles de autotransporte / marítimo / aéreo / ferroviario"
              phase="3.5"
            />
          )}
          {currentStep === 4 && (
            <PlaceholderSection
              title="Figuras de Transporte"
              subtitle="Operador, propietario, arrendatario o notificado"
              phase="3.6"
            />
          )}
          {currentStep === 5 && (
            <PlaceholderSection
              title="Resumen y Timbrado"
              subtitle="Validación SAT final + emisión vía Facturapi"
              phase="3.7"
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between bg-slate-900/80">
          {/* Anterior */}
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          {/* Indicador central */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
            {validation.errors.length > 0 && showValidation && (
              <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded">
                {validation.errors.length} error{validation.errors.length !== 1 ? "es" : ""} de validación
              </span>
            )}
            {validation.ok && (
              <span className="px-2 py-1 bg-emerald-600/20 text-emerald-300 rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Válido
              </span>
            )}
          </div>

          {/* Acciones derechas */}
          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                onClick={goNext}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowValidation(true)}
                  disabled
                  className="px-4 py-2 text-sm bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
                  title="Disponible en sub-fase 3.7"
                >
                  Guardar borrador
                </button>
                <button
                  onClick={() => setShowValidation(true)}
                  disabled
                  className="px-4 py-2 text-sm bg-emerald-700/50 text-emerald-300/60 rounded-lg cursor-not-allowed"
                  title="Disponible en sub-fase 3.7"
                >
                  Timbrar CFDI
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
// Placeholder para secciones que aún no existen
// ─────────────────────────────────────────────────────────────
function PlaceholderSection({
  title,
  subtitle,
  phase,
}: {
  title: string;
  subtitle: string;
  phase: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{subtitle}</p>
      <span className="px-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded-full text-slate-400">
        Disponible en sub-fase {phase}
      </span>
    </div>
  );
}
