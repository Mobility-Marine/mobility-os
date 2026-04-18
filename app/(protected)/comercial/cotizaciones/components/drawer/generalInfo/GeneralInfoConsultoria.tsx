"use client";
import { Field, SectionTitle, INPUT, TEXTAREA, InfoBox } from "../drawerShared";
import type { GeneralInfoConsultoria } from "../../../types/quotations.types";

type Props = { info: Partial<GeneralInfoConsultoria>; onChange: (u: Partial<GeneralInfoConsultoria>) => void; };

export default function GeneralInfoConsultoria({ info, onChange }: Props) {
  return (
    <>
      <SectionTitle>Consultoría — Información general</SectionTitle>
      <InfoBox type="info">
        Para consultoría solo se necesita describir el alcance del servicio. Los conceptos de facturación y sus detalles se definen en el siguiente paso.
      </InfoBox>
      <Field label="Descripción general del servicio">
        <input value={info.descripcion_general ?? ""} onChange={(e) => onChange({ descripcion_general: e.target.value })} placeholder="Asesoría en comercio exterior, gestión de riesgos logísticos…" style={INPUT} />
      </Field>
      <Field label="Notas generales">
        <textarea rows={3} value={info.notas_generales ?? ""} onChange={(e) => onChange({ notas_generales: e.target.value })} placeholder="Alcance, exclusiones, entregables…" style={TEXTAREA} />
      </Field>
    </>
  );
}
