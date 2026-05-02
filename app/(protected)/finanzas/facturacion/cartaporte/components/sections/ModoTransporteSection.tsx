"use client";

// ═══════════════════════════════════════════════════════════════════════
// ModoTransporteSection — Sección 4 del drawer Carta Porte 3.1
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Orquestador que renderiza el formulario del modo de transporte activo.
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

// ─── Metadata visual de los modos ───
type ModoInfo = {
  label: string;
  shortLabel: string;
  iconPath: string;
};

const MODO_INFO: Record<ModoTransporteCode, ModoInfo> = {
  "04": {
    label: "Autotransporte",
    shortLabel: "Auto",
    iconPath: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM18.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  },
  "01": {
    label: "Marítimo",
    shortLabel: "Marítimo",
    iconPath: "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M19.38 20A11.6 11.6 0 0021 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76M19 13V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6M12 10v4M2 20h20",
  },
  "02": {
    label: "Aéreo",
    shortLabel: "Aéreo",
    iconPath: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  },
  "03": {
    label: "Ferroviario",
    shortLabel: "Ferroviario",
    iconPath: "M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zM7.5 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3.5-7H6V5h5v5zm2 0V5h5v5h-5zm3.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z",
  },
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

  // Auto-inicializar las estructuras default cuando se selecciona un modo,
  // y limpiar las que ya no aplican.
  useEffect(() => {
    if (modos.includes("04") && !data.autotransporte) setAutotransporte(defaultAutotransporte());
    if (modos.includes("01") && !data.transporte_maritimo) setMaritimo(defaultMaritimo());
    if (modos.includes("02") && !data.transporte_aereo) setAereo(defaultAereo());
    if (modos.includes("03") && !data.transporte_ferroviario) setFerroviario(defaultFerroviario());

    if (!modos.includes("04") && data.autotransporte) setAutotransporte(undefined);
    if (!modos.includes("01") && data.transporte_maritimo) setMaritimo(undefined);
    if (!modos.includes("02") && data.transporte_aereo) setAereo(undefined);
    if (!modos.includes("03") && data.transporte_ferroviario) setFerroviario(undefined);

    // Sincronizar tab activa con la lista de modos
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
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "320px",
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-warning-bg)",
          border: "1px solid var(--color-warning-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "14px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-text)" strokeWidth="1.8">
            <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.832-2.815L13.832 4.107c-.77-1.333-2.694-1.333-3.464 0L3.34 16.185A2 2 0 005.07 19z" />
          </svg>
        </div>
        <div style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "6px",
        }}>
          Sin modos de transporte
        </div>
        <div style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}>
          Regresa al paso <strong style={{ color: "var(--color-text-primary)" }}>Datos Generales</strong> y
          selecciona al menos un modo de transporte para continuar.
        </div>
      </div>
    );
  }

  // ─── Calcular errores por modo ───
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "880px" }}>
      {/* ── Banner ── */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-info-bg)",
        border: "1px solid var(--color-info-border)",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-info-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          Captura los datos del modo de transporte que seleccionaste.
          {modos.length > 1 && (
            <>
              {" "}Tienes un viaje <strong style={{ color: "var(--color-text-primary)" }}>multimodal</strong>:
              completa cada modo en su pestaña.
            </>
          )}
        </div>
      </div>

      {/* ── Tabs de modos (solo si hay más de uno) ── */}
      {modos.length > 1 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px",
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-md)",
          overflowX: "auto",
        }}>
          {modos.map(modo => {
            const info = MODO_INFO[modo];
            const isActive = activeModo === modo;
            const errCount = errorsForModo(modo);
            return (
              <button
                key={modo}
                type="button"
                onClick={() => setActiveModo(modo)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: isActive ? "var(--color-brand-blue)" : "transparent",
                  color: isActive ? "#FFFFFF" : "var(--color-text-second)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "var(--transition-fast)",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d={info.iconPath} />
                </svg>
                <span>{info.label}</span>
                {errCount > 0 && (
                  <span style={{
                    padding: "1px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    background: isActive ? "rgba(255,255,255,0.25)" : "var(--color-danger-bg)",
                    color: isActive ? "#FFFFFF" : "var(--color-danger-text)",
                  }}>
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
          <AutotransporteForm value={data.autotransporte} onChange={setAutotransporte} />
        )}
        {activeModo === "01" && data.transporte_maritimo && (
          <MaritimoForm value={data.transporte_maritimo} onChange={setMaritimo} />
        )}
        {activeModo === "02" && data.transporte_aereo && (
          <AereoForm value={data.transporte_aereo} onChange={setAereo} />
        )}
        {activeModo === "03" && data.transporte_ferroviario && (
          <FerroviarioForm value={data.transporte_ferroviario} onChange={setFerroviario} />
        )}
      </div>
    </div>
  );
}
