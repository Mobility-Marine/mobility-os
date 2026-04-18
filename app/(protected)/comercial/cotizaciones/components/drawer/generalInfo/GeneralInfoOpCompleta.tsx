"use client";
import { useState } from "react";
import { SectionTitle, SELECT, Field, InfoBox } from "../drawerShared";
import GeneralInfoTerrestre from "./GeneralInfoTerrestre";
import GeneralInfoMaritimo  from "./GeneralInfoMaritimo";
import GeneralInfoAereo     from "./GeneralInfoAereo";
import GeneralInfoImpoExpo  from "./GeneralInfoImpoExpo";
import type { GeneralInfoOpCompleta } from "../../../types/quotations.types";

type Props = { info: Partial<GeneralInfoOpCompleta>; onChange: (u: Partial<GeneralInfoOpCompleta>) => void; };

export default function GeneralInfoOpCompleta({ info, onChange }: Props) {
  const tipoTransporte = info.tipo_transporte ?? "maritimo";
  const modalidad      = info.modalidad       ?? "impo";

  function updateFlete(updates: any) {
    onChange({ flete_info: { ...(info.flete_info as any ?? {}), ...updates } });
  }
  function updateAduanal(updates: any) {
    onChange({ aduanal_info: { ...(info.aduanal_info as any ?? {}), ...updates } });
  }

  return (
    <>
      <SectionTitle>Operación completa — Flete + Despacho Aduanal</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Field label="Tipo de transporte principal *">
          <select value={tipoTransporte} onChange={(e) => onChange({ tipo_transporte: e.target.value as any, flete_info: undefined })} style={SELECT}>
            <option value="terrestre">🚛 Terrestre</option>
            <option value="maritimo">🚢 Marítimo</option>
            <option value="aereo">✈️ Aéreo</option>
          </select>
        </Field>
        <Field label="Modalidad aduanal *">
          <select value={modalidad} onChange={(e) => onChange({ modalidad: e.target.value as any })} style={SELECT}>
            <option value="impo">Importación</option>
            <option value="expo">Exportación</option>
          </select>
        </Field>
      </div>

      {/* SECCIÓN FLETE */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--color-info-bg)", borderBottom: "1px solid var(--color-info-border)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-info-text)" }}>
            {tipoTransporte === "terrestre" ? "🚛" : tipoTransporte === "maritimo" ? "🚢" : "✈️"} Información de flete
          </span>
        </div>
        <div style={{ padding: "14px" }}>
          {tipoTransporte === "terrestre" && (
            <GeneralInfoTerrestre info={info.flete_info as any ?? { subtipo: "ftl" }} onChange={updateFlete} />
          )}
          {tipoTransporte === "maritimo" && (
            <GeneralInfoMaritimo info={info.flete_info as any ?? { subtipo: "fcl" }} onChange={updateFlete} />
          )}
          {tipoTransporte === "aereo" && (
            <GeneralInfoAereo info={info.flete_info as any ?? { subtipo: "carga" }} onChange={updateFlete} />
          )}
        </div>
      </div>

      {/* SECCIÓN ADUANAL */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.1)", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#a78bfa" }}>
            🏛️ Despacho Aduanal — {modalidad === "impo" ? "Importación" : "Exportación"}
          </span>
        </div>
        <div style={{ padding: "14px" }}>
          <GeneralInfoImpoExpo
            info={{ ...(info.aduanal_info as any ?? {}), modalidad }}
            onChange={updateAduanal}
          />
        </div>
      </div>
    </>
  );
}
