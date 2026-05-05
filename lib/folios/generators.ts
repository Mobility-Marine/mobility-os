// ════════════════════════════════════════════════════════════════════════
// FOLIOS — Helper compartido para generación de folios ERP-grade
// ════════════════════════════════════════════════════════════════════════
// Sistema unificado de generación de folios consecutivos para todos los
// documentos del ERP: cotizaciones, pedidos, servicios logísticos,
// recepciones, órdenes de compra, conteos de inventario.
//
// Cada empresa configura su propio formato en company_settings con tokens
// dinámicos. Esta función procesa el formato + lee/incrementa el contador.
//
// TOKENS SOPORTADOS
// ─────────────────────────────────────────────────────────────────────
//   {EMPRESA}   3 primeras letras del RFC fiscal (ej. MMA210517V20 → MMA)
//   {SUBTIPO}   Solo para servicios logísticos: CON | LOG
//   {CLIENTE}   3 primeras letras del nombre del cliente (legacy)
//   {TIPO}      Código del tipo de servicio legacy (T/M/A/X/W/D/C/S/O)
//   {AÑO}       Año actual (4 dígitos: 2026)
//   {MES}       Mes actual (2 dígitos: 01..12)
//   {NUM}       Número correlativo (4 dígitos con padding: 0001..9999)
//
// EJEMPLOS DE FORMATOS
// ─────────────────────────────────────────────────────────────────────
//   COT-{AÑO}-{NUM}            → COT-2026-0008  (cotizaciones)
//   PED-{EMPRESA}-{NUM}        → PED-MMA-0001   (pedidos)
//   {SUBTIPO}-{EMPRESA}-{NUM}  → CON-MMA-0001   (consultoría)
//                              → LOG-MMA-0001   (logística)
//   REC-{AÑO}-{NUM}            → REC-2026-0042  (recepciones)
//
// USO TÍPICO
// ─────────────────────────────────────────────────────────────────────
//   const folio = await generateFolio({
//     companyId,
//     formatField: "shipment_ref_format",
//     counterField: "shipment_ref_counter_consultoria",
//     tokenValues: { SUBTIPO: "CON" }
//   });
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

// ── Tipos públicos ────────────────────────────────────────────────────

/** Valores que el caller puede inyectar para resolver tokens en runtime. */
export type FolioTokenValues = {
  EMPRESA?:  string;  // si no se provee, se lee del fiscal_rfc
  SUBTIPO?:  string;  // CON | LOG | otro código
  CLIENTE?:  string;  // legacy: 3 letras del nombre del cliente
  TIPO?:     string;  // legacy: código del tipo de servicio
};

/** Opciones para generateFolio() */
export type GenerateFolioOptions = {
  /** UUID de la empresa (tenant) en company_settings */
  companyId: string;
  /** Nombre de la columna en company_settings que tiene el formato */
  formatField: string;
  /** Nombre de la columna en company_settings que tiene el contador */
  counterField: string;
  /** Valores que sobrescriben los tokens del formato */
  tokenValues?: FolioTokenValues;
  /** Si true (default), incrementa el contador en BD tras generar el folio */
  incrementCounter?: boolean;
};

// ── Helpers internos ──────────────────────────────────────────────────

/**
 * Extrae las 3 primeras letras alfabéticas del RFC, en mayúscula.
 * Ej: MMA210517V20 → MMA · XAXX010101000 → XAX · ACM010101AB1 → ACM
 * Si el RFC es null/inválido, retorna "ERP" como fallback genérico.
 */
export function getCompanyPrefix(rfc: string | null | undefined): string {
  if (!rfc) return "ERP";
  const letters = rfc.toUpperCase().replace(/[^A-ZÑ&]/g, "");
  return letters.substring(0, 3) || "ERP";
}

/**
 * Aplica los tokens al formato. Función pura, sin acceso a BD.
 * Reemplaza cada {TOKEN} por su valor correspondiente.
 *
 * Si un token aparece en el formato pero no en values, se reemplaza
 * por string vacío (mejor que dejar el placeholder visible).
 */
export function applyTokens(
  format: string,
  values: Record<string, string | number>,
): string {
  let result = format;
  for (const [key, val] of Object.entries(values)) {
    // Reemplazar todas las ocurrencias del token
    const re = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(re, String(val));
  }
  // Limpiar tokens no resueltos para evitar placeholders huérfanos
  result = result.replace(/\{[A-ZÑ]+\}/g, "");
  return result;
}

/**
 * Construye el set completo de valores de tokens, mezclando los
 * provistos por el caller con los derivados (AÑO, MES, NUM, EMPRESA).
 */
function buildTokenSet(
  counter: number,
  fiscalRfc: string | null,
  userValues: FolioTokenValues = {},
): Record<string, string> {
  const now = new Date();
  return {
    EMPRESA: userValues.EMPRESA ?? getCompanyPrefix(fiscalRfc),
    SUBTIPO: userValues.SUBTIPO ?? "",
    CLIENTE: userValues.CLIENTE ?? "",
    TIPO:    userValues.TIPO    ?? "",
    AÑO:     String(now.getFullYear()),
    MES:     String(now.getMonth() + 1).padStart(2, "0"),
    NUM:     String(counter).padStart(4, "0"),
  };
}

// ── Función principal ────────────────────────────────────────────────

/**
 * Genera un folio único leyendo el formato y contador de company_settings
 * y devuelve el folio resultante. Por default incrementa el contador.
 *
 * Esta función es atómica desde el punto de vista del usuario: si dos
 * llamadas concurrentes llegan al mismo tiempo, ambas leen el mismo
 * counter y eso podría causar duplicados. Para uso intensivo se debería
 * envolver en una transacción o usar pg_advisory_lock. Para el volumen
 * actual de Mobility OS (decenas de folios al día) es aceptable.
 *
 * @returns { folio, counter } el folio generado y el counter usado
 */
export async function generateFolio(
  opts: GenerateFolioOptions,
): Promise<{ folio: string; counter: number }> {
  const {
    companyId,
    formatField,
    counterField,
    tokenValues,
    incrementCounter = true,
  } = opts;

  // 1) Leer el formato actual, el contador y el RFC fiscal
  const { data, error } = await supabase
    .from("company_settings")
    .select(`${formatField}, ${counterField}, fiscal_rfc`)
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo leer la configuración de folios para la empresa ${companyId}: ` +
        (error?.message ?? "registro no encontrado"),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row     = data as Record<string, any>;
  const format  = String(row[formatField] ?? "");
  const counter = Number(row[counterField] ?? 1);
  const rfc     = (row.fiscal_rfc as string | null) ?? null;

  if (!format) {
    throw new Error(
      `El campo ${formatField} está vacío en company_settings. Configúralo en Settings → Operación.`,
    );
  }

  // 2) Construir tokens y aplicar al formato
  const tokens = buildTokenSet(counter, rfc, tokenValues);
  const folio  = applyTokens(format, tokens);

  // 3) Incrementar el contador si se solicitó
  if (incrementCounter) {
    const { error: updErr } = await supabase
      .from("company_settings")
      .update({ [counterField]: counter + 1, updated_at: new Date().toISOString() })
      .eq("company_id", companyId);

    if (updErr) {
      // No fallar el flujo si el folio se generó: solo loggear
      // eslint-disable-next-line no-console
      console.warn(
        `Folio ${folio} generado pero no se pudo incrementar ${counterField}:`,
        updErr.message,
      );
    }
  }

  return { folio, counter };
}

// ── Wrappers semánticos por documento ─────────────────────────────────
// Estos wrappers son por conveniencia: cada módulo del ERP puede
// importar el wrapper correspondiente sin tener que conocer los nombres
// internos de los campos de company_settings.

/** Genera el siguiente folio de Cotización (COT-{AÑO}-{NUM} por default) */
export async function generateQuotationNumber(companyId: string) {
  return generateFolio({
    companyId,
    formatField:  "quote_number_format",
    counterField: "quote_number_counter",
  });
}

/** Genera el siguiente folio de Pedido (PED-{EMPRESA}-{NUM} por default) */
export async function generateOrderNumber(companyId: string) {
  return generateFolio({
    companyId,
    formatField:  "order_number_format",
    counterField: "order_number_counter",
  });
}

/**
 * Genera el siguiente folio de Servicio Logístico.
 * Selecciona automáticamente el contador según el subtipo:
 *   - "CON" (consultoría) → shipment_ref_counter_consultoria
 *   - "LOG" (logística)  → shipment_ref_counter_logistica
 */
export async function generateShipmentRef(
  companyId: string,
  subtipo: "CON" | "LOG",
) {
  const counterField =
    subtipo === "CON"
      ? "shipment_ref_counter_consultoria"
      : "shipment_ref_counter_logistica";

  return generateFolio({
    companyId,
    formatField:  "shipment_ref_format",
    counterField,
    tokenValues:  { SUBTIPO: subtipo },
  });
}

/** Genera el siguiente folio de Recepción de inventario */
export async function generateReceptionNumber(companyId: string) {
  return generateFolio({
    companyId,
    formatField:  "reception_number_format",
    counterField: "reception_number_counter",
  });
}

/** Genera el siguiente folio de Conteo de inventario */
export async function generateCountNumber(companyId: string) {
  return generateFolio({
    companyId,
    formatField:  "count_number_format",
    counterField: "count_number_counter",
  });
}

/** Genera el siguiente folio de Orden de Compra */
export async function generatePOnumber(companyId: string) {
  return generateFolio({
    companyId,
    formatField:  "po_number_format",
    counterField: "po_number_counter",
  });
}

// ── Helper para vista previa en Settings (sin tocar BD) ──────────────

/**
 * Genera un PREVIEW del folio sin incrementar el contador y sin tocar BD.
 * Usado en la UI de Settings para mostrar al usuario "así se vería tu
 * próximo folio" mientras edita el formato.
 */
export function previewFolio(
  format: string,
  counter: number,
  fiscalRfc: string | null,
  tokenValues: FolioTokenValues = {},
): string {
  const tokens = buildTokenSet(counter, fiscalRfc, tokenValues);
  return applyTokens(format, tokens);
}