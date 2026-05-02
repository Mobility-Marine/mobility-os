"use client";

import { useState, useEffect } from "react";
import type { CartaPorteData } from "../../types/carta_porte.types";
import {
  defaultAutotransporte, defaultMaritimo, defaultAereo, defaultFerroviario,
} from "../../types/carta_porte.defaults";

import { AutotransporteForm } from "../modos/AutotransporteForm";
import { MaritimoForm }       from "../modos/MaritimoForm";
import { AereoForm }          from "../modos/AereoForm";
import { FerroviarioForm }    from "../modos/FerroviarioForm";

interface Props {
  data: CartaPorteData;
  setAutotransporte: (next: CartaPorteData["autotransporte"]) => void;
  setMaritimo:       (next: CartaPorteData["transporte_maritimo"]) => void;
  setAereo:          (next: CartaPorteData["transporte_aereo"]) => void;
  setFerroviario:    (next: CartaPorteData["transporte_ferroviario"]) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

type Tab = "autotransporte" | "maritimo" | "aereo" | "ferroviario";

const TAB_LABELS: Record<Tab, string> = {
  autotransporte: "Autotransporte",
  maritimo:       "Marítimo",
  aereo:          "Aéreo",
  ferroviario:    "Ferroviario",
};

const MODE_TO_TAB: Record<string, Tab> = {
  "01": "autotransporte", "02": "maritimo", "03": "aereo", "04": "ferroviario",
};

export function ModoTransporteSection({ data, setAutotransporte, setMaritimo, setAereo, setFerroviario, showValidation, errors }: Props) {
  // Determinar qué tabs mostrar según modos seleccionados
  const activeTabs: Tab[] = data.header.modos_transporte
    .map(m => MODE_TO_TAB[m])
    .filter((t): t is Tab => Boolean(t));

  const [activeTab, setActiveTab] = useState<Tab | null>(activeTabs[0] ?? null);

  // Auto-init/cleanup según modos seleccionados
  useEffect(() => {
    if (activeTabs.includes("autotransporte") && !data.autotransporte) setAutotransporte(defaultAutotransporte());
    if (!activeTabs.includes("autotransporte") && data.autotransporte) setAutotransporte(undefined);
    if (activeTabs.includes("maritimo") && !data.transporte_maritimo) setMaritimo(defaultMaritimo());
    if (!activeTabs.includes("maritimo") && data.transporte_maritimo) setMaritimo(undefined);
    if (activeTabs.includes("aereo") && !data.transporte_aereo) setAereo(defaultAereo());
    if (!activeTabs.includes("aereo") && data.transporte_aereo) setAereo(undefined);
    if (activeTabs.includes("ferroviario") && !data.transporte_ferroviario) setFerroviario(defaultFerroviario());
    if (!activeTabs.includes("ferroviario") && data.transporte_ferroviario) setFerroviario(undefined);
    if (!activeTab && activeTabs.length > 0) setActiveTab(activeTabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabs.join(",")]);

  if (activeTabs.length === 0) {
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
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#f59e0b"/>
          </svg>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>
          Sin modos de transporte
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Vuelve al paso 3 (Datos Generales) y selecciona al menos un modo de transporte para capturar sus datos.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "820px" }}>

      <div style={BANNER}>
        Datos específicos del transporte seleccionado. {activeTabs.length > 1 ? `Captura los ${activeTabs.length} modos.` : ""}
      </div>

      {/* Tabs si hay más de uno */}
      {activeTabs.length > 1 && (
        <div style={{
          display: "flex", gap: "4px",
          padding: "4px", borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
        }}>
          {activeTabs.map(t => (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              style={{
                flex: 1, height: "32px", padding: "0 12px", fontSize: "12px", fontWeight: 600,
                borderRadius: "var(--radius-md)", border: "none",
                background: activeTab === t ? "var(--color-brand-blue)" : "transparent",
                color: activeTab === t ? "#fff" : "var(--color-text-muted)",
                cursor: "pointer",
              }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {activeTab === "autotransporte" && data.autotransporte && (
        <AutotransporteForm data={data.autotransporte} setData={setAutotransporte} showValidation={showValidation} errors={errors} />
      )}
      {activeTab === "maritimo" && data.transporte_maritimo && (
        <MaritimoForm data={data.transporte_maritimo} setData={setMaritimo} showValidation={showValidation} errors={errors} />
      )}
      {activeTab === "aereo" && data.transporte_aereo && (
        <AereoForm data={data.transporte_aereo} setData={setAereo} showValidation={showValidation} errors={errors} />
      )}
      {activeTab === "ferroviario" && data.transporte_ferroviario && (
        <FerroviarioForm data={data.transporte_ferroviario} setData={setFerroviario} showValidation={showValidation} errors={errors} />
      )}
    </div>
  );
}

const BANNER: React.CSSProperties = {
  padding: "12px 14px", borderRadius: "var(--radius-md)",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
  fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5,
};
