"use client";
import GeneralInfoTerrestre     from "./GeneralInfoTerrestre";
import GeneralInfoMaritimo      from "./GeneralInfoMaritimo";
import GeneralInfoAereo         from "./GeneralInfoAereo";
import GeneralInfoImpoExpo      from "./GeneralInfoImpoExpo";
import GeneralInfoComercializadora from "./GeneralInfoComercializadora";
import GeneralInfoOpCompleta    from "./GeneralInfoOpCompleta";
import GeneralInfoConsultoria   from "./GeneralInfoConsultoria";
import type { ServiceSubtype, GeneralInfo } from "../../../types/quotations.types";

type Props = {
  subtype:  ServiceSubtype;
  info:     Partial<GeneralInfo>;
  onChange: (u: Partial<GeneralInfo>) => void;
};

export default function StepGeneralInfo({ subtype, info, onChange }: Props) {
  const cast = <T,>(x: Partial<GeneralInfo>): Partial<T> => x as any;

  switch (subtype) {
    case "terrestre_ltl":
      return <GeneralInfoTerrestre info={{ ...cast(info), subtipo: "ltl" }} onChange={onChange as any} />;
    case "terrestre_ftl":
      return <GeneralInfoTerrestre info={{ ...cast(info), subtipo: "ftl" }} onChange={onChange as any} />;
    case "maritimo_fcl":
      return <GeneralInfoMaritimo info={{ ...cast(info), subtipo: "fcl" }} onChange={onChange as any} />;
    case "maritimo_lcl":
      return <GeneralInfoMaritimo info={{ ...cast(info), subtipo: "lcl" }} onChange={onChange as any} />;
    case "aereo_carga":
      return <GeneralInfoAereo info={{ ...cast(info), subtipo: "carga" }} onChange={onChange as any} />;
    case "aereo_courier":
      return <GeneralInfoAereo info={{ ...cast(info), subtipo: "courier" }} onChange={onChange as any} />;
    case "impo_integral":
      return <GeneralInfoImpoExpo info={{ ...cast(info), modalidad: "impo" }} onChange={onChange as any} />;
    case "expo_integral":
      return <GeneralInfoImpoExpo info={{ ...cast(info), modalidad: "expo" }} onChange={onChange as any} />;
    case "comercializadora":
      return <GeneralInfoComercializadora info={cast(info)} onChange={onChange as any} />;
    case "op_completa":
      return <GeneralInfoOpCompleta info={cast(info)} onChange={onChange as any} />;
    case "consultoria":
      return <GeneralInfoConsultoria info={cast(info)} onChange={onChange as any} />;
    default:
      return null;
  }
}
