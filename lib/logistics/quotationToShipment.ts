// ═══════════════════════════════════════════════════════════════════════════
// QUOTATION → SHIPMENT MAPPER
// Helpers para convertir datos de cotización a embarque correctamente.
//
// Usado por:
//   - quotations.service.ts (función acceptQuotation)
//   - ShipmentCreateDrawer.tsx (modo "Desde cotización")
//
// Resuelve los bugs:
//   - service_type incorrecto (terrestre_ltl → terrestre_usa)
//   - países hardcodeados "México" (ahora se infieren de texto)
//   - pérdida de datos de mercancía (peso, dimensiones, valor)
//   - origen/destino texto perdidos (estaban en general_info.rutas)
// ═══════════════════════════════════════════════════════════════════════════

import type { ShipmentServiceType } from "@/app/(protected)/logistica/embarques/types/shipments.types";

// ── Tipos de servicio considerados logísticos (con ruta) ──────────────────
export const LOGISTICS_SHIPMENT_TYPES: ShipmentServiceType[] = [
  "terrestre_mx", "terrestre_usa", "maritimo", "aereo",
  "multimodal", "almacenaje", "aduanal",
];

// ═══════════════════════════════════════════════════════════════════════════
// 1) Mapeo de service_subtype (cotización) → service_type (embarque)
// ═══════════════════════════════════════════════════════════════════════════
// La cotización guarda el subtipo específico (ej. "terrestre_ltl")
// El embarque usa la categoría general (ej. "terrestre_usa")

export function mapServiceSubtypeToShipmentType(
  subtype: string | null | undefined,
  fallbackOrigin?: string | null,
  fallbackDestination?: string | null,
): ShipmentServiceType {
  if (!subtype) return "terrestre_mx";

  const s = subtype.toLowerCase().trim();

  // Mapeo directo por subtipo conocido
  const directMap: Record<string, ShipmentServiceType> = {
    consultoria:          "consultoria",
    asesoria:             "consultoria",
    seguro:               "seguro",
    terrestre_ltl:        "terrestre_usa",
    terrestre_ftl:        "terrestre_usa",
    terrestre_usa:        "terrestre_usa",
    terrestre_mx:         "terrestre_mx",
    terrestre_nacional:   "terrestre_mx",
    maritimo_lcl:         "maritimo",
    maritimo_fcl:         "maritimo",
    maritimo:             "maritimo",
    aereo:                "aereo",
    aereo_express:        "aereo",
    aereo_carga:          "aereo",
    almacenaje:           "almacenaje",
    aduanal:              "aduanal",
    despacho_aduanal:     "aduanal",
    multimodal:           "multimodal",
    intermodal:           "multimodal",
  };

  if (directMap[s]) return directMap[s];

  // Si solo dice "terrestre" sin sufijo, inferir por la ruta
  if (s === "terrestre") {
    const country = inferCountryFromText(
      `${fallbackOrigin ?? ""} ${fallbackDestination ?? ""}`,
    );
    if (country === "Estados Unidos") return "terrestre_usa";
    return "terrestre_mx";
  }

  return "otro";
}

// ═══════════════════════════════════════════════════════════════════════════
// 2) Inferir país desde texto de ciudad/estado
// ═══════════════════════════════════════════════════════════════════════════
const US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
];

const MX_STATE_HINTS = [
  "cdmx", "ciudad de méxico", "jalisco", "nuevo león", "monterrey",
  "guadalajara", "puebla", "tijuana", "aguascalientes", "querétaro",
  "michoacán", "oaxaca", "yucatán", "veracruz", "chihuahua", "sonora",
  "sinaloa", "coahuila", "tamaulipas", "baja california", "estado de méxico",
  "edomex", "méxico", " mx",
];

export function inferCountryFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  const upper = t.toUpperCase();
  const lower = t.toLowerCase();

  // Detectar USA por código de estado (ej. "Monterey Park, CA")
  for (const code of US_STATE_CODES) {
    const re = new RegExp(`(^|[\\s,])${code}([\\s,]|$)`);
    if (re.test(upper)) return "Estados Unidos";
  }
  if (
    upper.includes("USA") ||
    lower.includes("united states") ||
    lower.includes("estados unidos")
  ) {
    return "Estados Unidos";
  }

  // Detectar México
  for (const hint of MX_STATE_HINTS) {
    if (lower.includes(hint)) return "México";
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) Extraer ruta (origen/destino + países) desde general_info de cotización
// ═══════════════════════════════════════════════════════════════════════════

export interface ExtractedRoute {
  origin:              string | null;
  destination:         string | null;
  origin_country:      string | null;
  destination_country: string | null;
  incoterm:            string | null;
}

export function extractRouteFromGeneralInfo(
  generalInfo: any,
): ExtractedRoute {
  const empty: ExtractedRoute = {
    origin: null, destination: null,
    origin_country: null, destination_country: null,
    incoterm: null,
  };

  if (!generalInfo || typeof generalInfo !== "object") return empty;

  // Caso 1: logística con rutas (terrestre/aéreo/marítimo)
  if (Array.isArray(generalInfo.rutas) && generalInfo.rutas.length > 0) {
    const ruta        = generalInfo.rutas[0];
    const origin      = (typeof ruta?.origen  === "string" ? ruta.origen.trim()  : "") || null;
    const destination = (typeof ruta?.destino === "string" ? ruta.destino.trim() : "") || null;
    return {
      origin,
      destination,
      origin_country:      inferCountryFromText(origin),
      destination_country: inferCountryFromText(destination),
      incoterm:            (typeof ruta?.incoterm === "string" ? ruta.incoterm.trim() : "") || null,
    };
  }

  // Caso 2: consultoría con campo `lugar`
  if (typeof generalInfo.lugar === "string" && generalInfo.lugar.trim()) {
    const lugar = generalInfo.lugar.trim();
    return {
      origin:              lugar,
      destination:         null,
      origin_country:      inferCountryFromText(lugar),
      destination_country: null,
      incoterm:            null,
    };
  }

  return empty;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4) Extraer datos de la mercancía desde general_info de cotización
// ═══════════════════════════════════════════════════════════════════════════

export interface ExtractedCargo {
  cargo_merchandise:    string | null;
  cargo_pieces:         number | null;
  cargo_weight_kg:      number | null;
  cargo_length_cm:      number | null;
  cargo_width_cm:       number | null;
  cargo_height_cm:      number | null;
  cargo_volume_m3:      number | null;
  cargo_value:          number | null;
  cargo_value_currency: string | null;
}

function toPositiveNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function extractCargoFromGeneralInfo(generalInfo: any): ExtractedCargo {
  const empty: ExtractedCargo = {
    cargo_merchandise: null, cargo_pieces:    null,
    cargo_weight_kg:   null, cargo_length_cm: null,
    cargo_width_cm:    null, cargo_height_cm: null,
    cargo_volume_m3:   null, cargo_value:     null,
    cargo_value_currency: null,
  };

  if (!generalInfo || typeof generalInfo !== "object") return empty;

  const length = toPositiveNumber(generalInfo.largo_cm);
  const width  = toPositiveNumber(generalInfo.ancho_cm);
  const height = toPositiveNumber(generalInfo.alto_cm);

  // Calcular volumen automáticamente si vienen las 3 dimensiones
  let volume: number | null = null;
  if (length && width && height) {
    volume = +((length * width * height) / 1_000_000).toFixed(3); // cm³ → m³
  }

  return {
    cargo_merchandise:    (typeof generalInfo.mercancia === "string" && generalInfo.mercancia.trim()) || null,
    cargo_pieces:         toPositiveNumber(generalInfo.piezas),
    cargo_weight_kg:      toPositiveNumber(generalInfo.peso_kg),
    cargo_length_cm:      length,
    cargo_width_cm:       width,
    cargo_height_cm:      height,
    cargo_volume_m3:      volume,
    cargo_value:          toPositiveNumber(generalInfo.valor_comercial),
    cargo_value_currency:
      (typeof generalInfo.valor_moneda === "string" && generalInfo.valor_moneda.trim()) || null,
  };
}