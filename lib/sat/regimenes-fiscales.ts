// ════════════════════════════════════════════════════════════════════════
// CATÁLOGO SAT — Régimen Fiscal (c_RegimenFiscal)
// ════════════════════════════════════════════════════════════════════════
// Catálogo oficial del SAT para régimen fiscal del emisor del CFDI.
// Cada régimen aplica para Personas Físicas (PF), Personas Morales (PM)
// o ambos. Esta clasificación es importante para validar coherencia
// fiscal en CFDIs.
//
// Fuente: http://www.sat.gob.mx/sitio_internet/cfd/catalogos/CatCFDI.xls
// Última actualización: 2026
// ════════════════════════════════════════════════════════════════════════

export type RegimenFiscalSAT = {
  /** Clave numérica del régimen (3 dígitos) */
  clave: string;
  /** Descripción oficial del SAT */
  descripcion: string;
  /** A qué tipo de contribuyente aplica */
  aplica: "PF" | "PM" | "AMBOS";
};

export const REGIMENES_FISCALES_SAT: RegimenFiscalSAT[] = [
  // ── Personas Morales ────────────────────────────────────────────────
  { clave: "601", descripcion: "General de Ley Personas Morales", aplica: "PM" },
  { clave: "603", descripcion: "Personas Morales con Fines no Lucrativos", aplica: "PM" },
  { clave: "620", descripcion: "Sociedades Cooperativas de Producción que optan por diferir sus ingresos", aplica: "PM" },
  { clave: "623", descripcion: "Opcional para Grupos de Sociedades", aplica: "PM" },
  { clave: "624", descripcion: "Coordinados", aplica: "PM" },

  // ── Personas Físicas ────────────────────────────────────────────────
  { clave: "605", descripcion: "Sueldos y Salarios e Ingresos Asimilados a Salarios", aplica: "PF" },
  { clave: "606", descripcion: "Arrendamiento", aplica: "PF" },
  { clave: "607", descripcion: "Régimen de Enajenación o Adquisición de Bienes", aplica: "PF" },
  { clave: "608", descripcion: "Demás ingresos", aplica: "PF" },
  { clave: "611", descripcion: "Ingresos por Dividendos (socios y accionistas)", aplica: "PF" },
  { clave: "612", descripcion: "Personas Físicas con Actividades Empresariales y Profesionales", aplica: "PF" },
  { clave: "614", descripcion: "Ingresos por intereses", aplica: "PF" },
  { clave: "615", descripcion: "Régimen de los ingresos por obtención de premios", aplica: "PF" },
  { clave: "621", descripcion: "Incorporación Fiscal", aplica: "PF" },
  { clave: "625", descripcion: "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas", aplica: "PF" },

  // ── Aplica a ambos ──────────────────────────────────────────────────
  { clave: "610", descripcion: "Residentes en el Extranjero sin Establecimiento Permanente en México", aplica: "AMBOS" },
  { clave: "616", descripcion: "Sin obligaciones fiscales", aplica: "AMBOS" },
  { clave: "622", descripcion: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras", aplica: "AMBOS" },
  { clave: "626", descripcion: "Régimen Simplificado de Confianza (RESICO)", aplica: "AMBOS" },
  { clave: "628", descripcion: "Hidrocarburos", aplica: "AMBOS" },
  { clave: "629", descripcion: "De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales", aplica: "AMBOS" },
  { clave: "630", descripcion: "Enajenación de acciones en bolsa de valores", aplica: "AMBOS" },
];

/** Helper: obtener descripción por clave */
export function describeRegimen(clave: string): string {
  const r = REGIMENES_FISCALES_SAT.find((x) => x.clave === clave);
  return r ? `${r.clave} — ${r.descripcion}` : clave;
}