"use client";

// ═══════════════════════════════════════════════════════════════════════
// ModoTransporteSection — Sección 4 del drawer Carta Porte 3.1
// 
// Muestra los formularios de los modos seleccionados en Datos Generales.
// Si el usuario marcó autotransporte + marítimo, ve 2 tabs.
// Si no marcó ningún modo, ve un mensaje pidiendo regresar.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import type {
  CartaPorteData,
  ModoTransporteCode,
  Autotransporte,
  TransporteMaritimo,
  TransporteAereo,
  TransporteFerroviario,
} from "../../types/carta_porte.types";
import {
  defaultAutotransporte,
  defaultMaritimo,
  defaultAereo,
  defaultFerroviario,
} from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

import { AutotransporteForm } from "../modos/AutotransporteForm";
import { MaritimoForm } from "../modos/MaritimoForm";
import { AereoForm } from "../modos/AereoForm";
import { FerroviarioForm } from "../modos/FerroviarioForm";

// Metadata visual de los modos
type ModoInfoEntry = {
  label: string;
  shortLabel: string;
  color: string;
};

const MODO_INFO: Record<ModoTransporteCode, ModoInfoEntry> = {
  "04": { label: "Autotransporte", shortLabel: "Auto",        color: "blue" },
  "01": { label: "Marítimo",       shortLabel: "Marítimo",    color: "cyan" },
  "02": { label: "Aéreo",          shortLabel: "Aéreo",       color: "indigo" },
  "03": { label: "Ferroviario",    shortLabel: "Ferroviario", color: "amber" },
};

interface Props {
  data: CartaPorteData;
  setAutotransporte: (next: Autotransporte | undefined) => void;
  setMaritimo: (next: TransporteMaritimo | undefined) => void;
  setAereo: (next: TransporteAereo | undefined) => void;
  setFerroviario: (next: TransporteFerroviario | undefined) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function ModoTransporteSection({
  data,
  setAutotransporte,
  setMaritimo,
  setAereo,
  setFerroviario,
  showValidation,
  errors,
}: Props) {
  const modos = data.header.modos_transporte;
  const [activeModo, setActiveModo] = useState<ModoTransporteCode | null>(
    modos[0] ?? null
  );

  // Auto-inicializar las estructuras default cuando se selecciona un modo
  useEffect(() => {
    if (modos.includes("04") && !data.autotransporte) setAutotransporte(defaultAutotransporte());
    if (modos.includes("01") && !data.transporte_maritimo) setMaritimo(defaultMaritimo());
    if (modos.includes("02") && !data.transporte_aereo) setAereo(defaultAereo());
    if (modos.includes("03") && !data.transporte_ferroviario) setFerroviario(defaultFerroviario());

    // Limpiar las que ya no aplican
    if (!modos.includes("04") && data.autotransporte) setAutotransporte(undefined);
    if (!modos.includes("01") && data.transporte_maritimo) setMaritimo(undefined);
    if (!modos.includes("02") && data.transporte_aereo) setAereo(undefined);
    if (!modos.includes("03") && data.transporte_ferroviario) setFerroviario(undefined);

    // Si el activo ya no está, cambiar al primero disponible
    if (activeModo && !modos.includes(activeModo)) {
      setActiveModo(modos[0] ?? null);
    }
    if (!activeModo && modos.length > 0) {
      setActiveModo(modos[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modos.join(",")]);

  // ─── Caso: no hay modos seleccionados ───
  if (modos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Sin modos de transporte</h3>
        <p className="text-sm text-slate-400">
          Regresa al paso <strong className="text-white">Datos Generales</strong> y
          selecciona al menos un modo de transporte para continuar.
        </p>
      </div>
    );
  }

  // Errores específicos por modo
  const errorsForModo = (modo: ModoTransporteCode): number => {
    if (!showValidation) return 0;
    const key =
      modo === "04" ? "autotransporte"
      : modo === "01" ? "maritimo"
      : modo === "02" ? "aereo"
      : "ferroviario";
    return errors.filter(e => e.field.includes(key)).length;
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Banner ── */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div className="text-sm text-slate-200/90 leading-relaxed">
            Captura los datos del/los modo(s) de transporte que seleccionaste.
            {modos.length > 1 && " Tienes un viaje multimodal: completa cada modo en su pestaña."}
          </div>
        </div>
      </div>

      {/* ── Tabs de modos (solo si hay más de uno) ── */}
      {modos.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-slate-800/50 border border-slate-700 rounded-lg overflow-x-auto">
          {modos.map(modo => {
            const info = MODO_INFO[modo];
            const isActive = activeModo === modo;
            const errCount = errorsForModo(modo);
            return (
              <button
                key={modo}
                type="button"
                onClick={() => setActiveModo(modo)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="font-medium">{info.label}</span>
                {errCount > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                    isActive ? "bg-white/20 text-white" : "bg-red-600/30 text-red-300"
                  }`}>
                    {errCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Form del modo activo ── */}
      <div>
        {activeModo === "04" && data.autotransporte && (
          <AutotransporteForm
            value={data.autotransporte}
            onChange={setAutotransporte}
          />
        )}
        {activeModo === "01" && data.transporte_maritimo && (
          <MaritimoForm
            value={data.transporte_maritimo}
            onChange={setMaritimo}
          />
        )}
        {activeModo === "02" && data.transporte_aereo && (
          <AereoForm
            value={data.transporte_aereo}
            onChange={setAereo}
          />
        )}
        {activeModo === "03" && data.transporte_ferroviario && (
          <FerroviarioForm
            value={data.transporte_ferroviario}
            onChange={setFerroviario}
          />
        )}
      </div>
    </div>
  );
}
