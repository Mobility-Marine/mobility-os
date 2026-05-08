// ============================================================
// QUOTATIONS TYPES v1 — GOD LEVEL
// Productos + Servicios Logísticos · CFDI · Plantillas PDF
// ============================================================

export type QuotationType   = "products" | "services";
export type QuotationStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "cancelled";
export type QuotationTemplate = "elegante";

export const STATUS_CONFIG: Record<QuotationStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  draft:     { labelKey: "quot.statusDraft",     color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)" },
  sent:      { labelKey: "quot.statusSent",      color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"  },
  viewed:    { labelKey: "quot.statusViewed",    color: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)"  },
  accepted:  { labelKey: "quot.statusAccepted",  color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)"},
  rejected:  { labelKey: "quot.statusRejected",  color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)" },
  expired:   { labelKey: "quot.statusExpired",   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)"},
  cancelled: { labelKey: "quot.statusCancelled", color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)" },
};

export type ServiceType =
  | "terrestre" | "aereo" | "maritimo" | "almacenaje"
  | "comercializadora" | "aduanal" | "seguro" | "courier" | "otro";

export const SERVICE_TYPE_CONFIG: Record<ServiceType, { labelKey: string; color: string; icon: string }> = {
  terrestre:       { labelKey: "quot.svcTerrestre",      color: "var(--color-warning-text)", icon: "🚛" },
  aereo:           { labelKey: "quot.svcAereo",          color: "var(--color-brand-blue)",   icon: "✈" },
  maritimo:        { labelKey: "quot.svcMaritimo",       color: "var(--color-info-text)",    icon: "🚢" },
  almacenaje:      { labelKey: "quot.svcAlmacenaje",     color: "#a78bfa",                  icon: "🏭" },
  comercializadora:{ labelKey: "quot.svcComercializadora",color: "var(--color-success-text)","icon": "🔄" },
  aduanal:         { labelKey: "quot.svcAduanal",        color: "var(--color-danger-text)",  icon: "🛃" },
  seguro:          { labelKey: "quot.svcSeguro",         color: "#f59e0b",                  icon: "🛡" },
  courier:         { labelKey: "quot.svcCourier",        color: "var(--color-text-second)",  icon: "📦" },
  otro:            { labelKey: "quot.svcOtro",           color: "var(--color-text-muted)",   icon: "⚙" },
};

// ── QUOTATION ─────────────────────────────────────────────────

export type Quotation = {
  id:              string;
  company_id:      string;
  quote_number:    string;
  type:            QuotationType;
  status:          QuotationStatus;
  client_id?:      string | null;
  crm_account_id?: string | null;
  opportunity_id?: string | null;
  order_id?:       string | null;
  shipment_id?:    string | null;
  template:        QuotationTemplate;
  currency:        string;
  client_name?:    string | null;
  client_email?:   string | null;
  client_rfc?:     string | null;
  subtotal:        number;
  discount_amount: number;
  tax_rate:        number;
  tax_amount:      number;
  total:           number;
  notes?:          string | null;
  terms?:          string | null;
  valid_until?:    string | null;
  incoterm?:       string | null;
  origin?:         string | null;
  destination?:    string | null;
  sent_at?:        string | null;
  viewed_at?:      string | null;
  accepted_at?:    string | null;
  rejected_at?:    string | null;
  // Tracking multi-envío por correo (Sprint Email — patrón ERP SAP/Oracle)
  last_sent_at?:        string | null;   // última fecha/hora de envío
  last_sent_to_email?:  string | null;   // último destinatario principal
  sent_count?:          number | null;   // total de veces enviada
  created_by?:     string | null;
  created_at:      string;
  updated_at?:     string;
  // Audit trail (SAP-style: quién hizo la última modificación)
  updated_by?:     string | null;
  // Joined — names para audit panel
  created_by_name?: string | null;
  updated_by_name?: string | null;
  client_contact_name?: string | null;
  // Joined
  items?: QuotationItem[];
  services?:          QuotationService[];
  billing_concepts?:  QuotationBillingConcept[];
  client?:            { name: string; email?: string; rfc?: string } | null;
  // Nuevos
  service_subtype?:   ServiceSubtype | null;
  language?:          QuotationLanguage;
  general_info?:      GeneralInfo | null;
  contact_name?:      string | null;
  contact_email?:     string | null;
  contact_title?:     string | null;
};

// ── QUOTATION ITEM (Productos) ────────────────────────────────

export type QuotationItem = {
  id:           string;
  company_id:   string;
  quotation_id: string;
  product_id?:  string | null;
  sort_order:   number;
  sku?:         string | null;
  description:  string;
  details?:     string | null;
  quantity:     number;
  unit:         string;
  unit_price:   number;
  discount_pct: number;
  subtotal:     number;
  created_at:   string;
};

// ── QUOTATION SERVICE (Servicios Logísticos) ──────────────────

export type QuotationService = {
  id:                  string;
  company_id:          string;
  quotation_id:        string;
  billing_concept_id?: string | null;
  sort_order:          number;
  service_type:        ServiceType;
  description:   string;
  origin?:       string | null;
  destination?:  string | null;
  incoterm?:     string | null;
  transit_time?: string | null;
  currency:      string;
  price:         number;
  notes?:        string | null;
  created_at:    string;
  tax_rate?:     number | null;
  unit_label?:   string | null;
  quantity?:     number | null;
  unit_price?:   number | null;
};

// ── BILLING CONCEPT (Concepto de facturación) ─────────────────
export type QuotationBillingConcept = {
  id:           string;
  company_id:   string;
  quotation_id: string;
  sort_order:   number;
  product_id?:  string | null;
  description:  string;
  total:        number;
  currency:     string;
  created_at:   string;
  // Joined
  product?:     { name: string; sat_product_code?: string; sat_unit_code?: string; unit?: string } | null;
  lines?:       QuotationService[];
};

// ── COMPANY SETTINGS ─────────────────────────────────────────

export type CompanySettings = {
  id?:                   string;
  company_id:            string;
  // Identidad visual
  logo_url?:             string | null;
  brand_color?:          string | null;
  brand_color_dark?:     string | null;
  brand_accent?:         string | null;
  // Datos fiscales
  fiscal_name?:          string | null;
  fiscal_rfc?:           string | null;
  fiscal_address?:       string | null;
  fiscal_city?:          string | null;
  fiscal_state?:         string | null;
  fiscal_zip?:           string | null;
  fiscal_country?:       string | null;
  fiscal_regime?:        string | null;
  fiscal_phone?:         string | null;
  fiscal_email?:         string | null;
  fiscal_website?:       string | null;
  // Cotizaciones
  template_products?:    QuotationTemplate;
  template_services?:    QuotationTemplate;
  quote_number_format:   string;
  quote_number_counter:  number;
  quote_validity_days:   number;
  quote_footer?:         string | null;
  quote_terms_services?: string | null;
  quote_terms_products?: string | null;
  // Comercial
  margin_minimum_pct:       number;
  monthly_goal:             number;
  goal_currency:            string;
  monthly_goal_metric?:     string | null;
  // SAT / Sellos & Facturapi
  cer_file_url?:        string | null;
  key_file_url?:        string | null;
  pac_provider?:        string | null;
  facturapi_api_key?:   string | null;
  facturapi_org_id?:    string | null;
  facturapi_env?:       string | null;
  invoice_series?:      string | null;
  invoice_next_folio?:  number | null;
  // Suscripción
  subscription_plan?:    string | null;
  subscription_status?:  string | null;
};

// ── PAYLOADS ─────────────────────────────────────────────────

export type CreateQuotationPayload = {
  type:            QuotationType;
  client_id?:      string;
  crm_account_id?: string;
  opportunity_id?: string;
  template?:       QuotationTemplate;
  currency?:       string;
  client_name?:    string;
  client_email?:   string;
  client_rfc?:     string;
  notes?:          string;
  terms?:          string;
  valid_until?:    string;
  incoterm?:       string;
  origin?:         string;
  destination?:    string;
  discount_amount?: number;
  tax_rate?:       number;
  service_subtype?:   ServiceSubtype;
  language?:          QuotationLanguage;
  general_info?:      GeneralInfo;
  contact_name?:      string;
  contact_email?:     string;
  contact_title?:     string;
};

export type CreateItemPayload = {
  quotation_id: string;
  product_id?:  string;
  sku?:         string;
  description:  string;
  details?:     string;
  quantity:     number;
  unit?:        string;
  unit_price:   number;
  discount_pct?: number;
};

export type CreateServicePayload = {
  quotation_id:  string;
  sort_order?:   number;
  service_type:  ServiceType;
  description:   string;
  origin?:       string;
  destination?:  string;
  incoterm?:     string;
  transit_time?: string;
  currency?:     string;
  price:         number;
  notes?:        string;
  quantity?:           number;
  unit_price?:         number;
  product_id?:         string;
  billing_concept_id?: string;
  tax_rate?:           number;
  unit_label?:         string;
};

export type CreateBillingConceptPayload = {
  quotation_id: string;
  sort_order?:  number;
  product_id?:  string;
  description:  string;
  currency:     string;
};

// ── SERVICE SUBTYPES ──────────────────────────────────────────
export type ServiceSubtype =
  | "terrestre_ltl"
  | "terrestre_ftl"
  | "maritimo_fcl"
  | "maritimo_lcl"
  | "aereo_carga"
  | "aereo_courier"
  | "impo_integral"
  | "expo_integral"
  | "comercializadora"
  | "op_completa"
  | "consultoria";

export type QuotationLanguage = "es" | "en";

// ── GENERAL INFO por subtipo (JSONB en BD) ────────────────────
export interface GeneralInfoTerrestre {
  subtipo:         "ltl" | "ftl";
  rutas:           { origen: string; destino: string; incoterm?: string }[];
  mercancia:       string;
  valor_comercial?: number;
  valor_moneda?:   string;
  peso_kg?:        number;
  // LTL
  volumen_m3?:     number;
  piezas?:         number;
  largo_cm?:       number;
  ancho_cm?:       number;
  alto_cm?:        number;
  // FTL
  tipo_unidad?:    string;
  cantidad_unidades?: number;
}

export interface BultoItem {
  largo_cm:  number;
  ancho_cm:  number;
  alto_cm:   number;
  peso_kg:   number;
  cantidad:  number;
}

export interface GeneralInfoMaritimo {
  subtipo:          "fcl" | "lcl";
  puerto_origen:    string;
  puerto_destino:   string;
  incoterm?:        string;
  mercancia:        string;
  valor_comercial?: number;
  valor_moneda?:    string;
  peso_kg?:         number;
  // FCL
  contenedores?:    { tipo: string; cantidad: number }[];
  // LCL
  bultos?:          BultoItem[];
  cbm_total?:       number;
  wm_total?:        number;
}

export interface GeneralInfoAereo {
  subtipo:            "carga" | "courier";
  aeropuerto_origen:  string;
  aeropuerto_destino: string;
  incoterm?:          string;
  mercancia:          string;
  valor_comercial?:   number;
  valor_moneda?:      string;
  // Carga
  bultos?:            BultoItem[];
  peso_real_kg?:      number;
  peso_dimensional_kg?: number;
  peso_cobrable_kg?:  number;
  // Courier
  carrier?:           string;
}

export interface GeneralInfoImpoExpo {
  modalidad:           "impo" | "expo";
  aduana_nombre:       string;
  aduana_clave_sat:    string;
  aduana_tipo:         string;
  fraccion_arancelaria: string;
  descripcion_mercancia: string;
  pais_origen_destino: string;
  incoterm?:           string;
  puerto_aduana?:      string;
  // Impo
  valor_aduana_usd?:   number;
  tipo_cambio?:        number;
  arancel_pct?:        number;
  igi_calculado?:      number;
  dta?:                number;
  iva_importacion?:    number;
  // Expo
  valor_comercial?:    number;
  valor_moneda?:       string;
  requiere_cert_origen?: boolean;
}

export interface SKUComercializadora {
  descripcion:        string;
  fraccion:           string;
  cantidad:           number;
  unidad:             string;
  precio_venta_unit:  number;
  moneda:             string;
  iva_pct:            number;
}

export interface GeneralInfoComercializadora {
  pais_origen:         string;
  incoterm?:           string;
  mercancia:           string;
  skus:                SKUComercializadora[];
}

export interface GeneralInfoOpCompleta {
  tipo_transporte:    "terrestre" | "maritimo" | "aereo";
  modalidad:          "impo" | "expo";
  // Copia los campos del tipo de transporte + impo/expo
  flete_info:         GeneralInfoTerrestre | GeneralInfoMaritimo | GeneralInfoAereo;
  aduanal_info:       GeneralInfoImpoExpo;
}

export interface GeneralInfoConsultoria {
  descripcion_general?: string;
  notas_generales?:     string;
}

export type GeneralInfo =
  | GeneralInfoTerrestre
  | GeneralInfoMaritimo
  | GeneralInfoAereo
  | GeneralInfoImpoExpo
  | GeneralInfoComercializadora
  | GeneralInfoOpCompleta
  | GeneralInfoConsultoria;

// ── Contacto de la cotización ─────────────────────────────────
export interface QuotationContact {
  id:    string;
  name:  string;
  title?: string;
  email?: string;
  phone?: string;
}

// ── FILTERS ──────────────────────────────────────────────────

export type QuotationFilters = {
  search: string;
  type: QuotationType | "all";
  status: QuotationStatus | "all";
};

export const DEFAULT_QUOTATION_FILTERS: QuotationFilters = {
  search: "",
  type: "all",
  status: "all",
};

// ── HELPERS DE PERMISO (audit trail SAP-style) ──────────────
// Una cotización aceptada NO se puede editar (preserva audit trail).
// La forma de "modificarla" es duplicarla → nueva con folio nuevo.
export function isQuotationEditable(q: Quotation | null | undefined): boolean {
  if (!q) return false;
  return q.status !== "accepted" && q.status !== "cancelled";
}

export function getQuotationEditBlockReason(
  q: Quotation,
  lang: QuotationLanguage = "es",
): string | null {
  if (q.status === "accepted") {
    return lang === "es"
      ? "Cotización aceptada — no editable. Usa Duplicar para crear una nueva con los mismos datos."
      : "Quotation accepted — not editable. Use Duplicate to create a new one with the same data.";
  }
  if (q.status === "cancelled") {
    return lang === "es"
      ? "Cotización cancelada — no editable."
      : "Quotation cancelled — not editable.";
  }
  return null;
}

// ── SCORING DATA QUALITY (KPI nivel ERP) ────────────────────
// Calcula calidad de datos de una cotización.
// Patrón SAP MDG: una cotización completa tiene cliente con RFC,
// concepts con product_id (= SAT codes), y notas/términos.
export function computeQuotationDataQuality(q: Quotation): {
  score: number; // 0-100
  hasClientRfc: boolean;
  hasSatCodes: boolean;
  hasContact: boolean;
  hasTerms: boolean;
} {
  const hasClientRfc = !!(q.client_rfc?.trim() || q.client?.rfc?.trim());
  const concepts = (q as any).billing_concepts ?? [];
  const items = q.items ?? [];
  const totalLines =
    concepts.reduce((s: number, c: any) => s + (c.lines?.length ?? 0), 0) + items.length;
  const linesWithSat =
    concepts.reduce((s: number, c: any) => s + (c.product_id ? (c.lines?.length ?? 0) : 0), 0) +
    items.filter((i: any) => i.product_id).length;
  const hasSatCodes = totalLines > 0 && linesWithSat === totalLines;
  const hasContact = !!(q.contact_name?.trim() || q.contact_email?.trim());
  const hasTerms = !!(q.terms?.trim() && q.notes?.trim());

  let score = 0;
  if (hasClientRfc) score += 35;
  if (hasSatCodes) score += 35;
  if (hasContact) score += 15;
  if (hasTerms) score += 15;

  return { score, hasClientRfc, hasSatCodes, hasContact, hasTerms };
}

// ── CATÁLOGOS ─────────────────────────────────────────────────

export const INCOTERMS = [
  "EXW","FCA","CPT","CIP","DAP","DPU","DDP",
  "FAS","FOB","CFR","CIF",
];

export const CURRENCIES = [
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "USD", label: "USD — Dólar americano" },
  { value: "EUR", label: "EUR — Euro" },
];

export const UNITS = [
  "pza","kg","ton","lt","ml","m","m²","m³","caja","bolsa","pallet","contenedor","servicio","hora","día",
];

export const SERVICE_TYPES: ServiceType[] = [
  "terrestre","aereo","maritimo","almacenaje","comercializadora","aduanal","seguro","courier","otro",
];

// ── CUSTOMS CONFIG ────────────────────────────────────────────
export const CONTAINER_TYPES = [
  "20'ST", "40'ST", "40'HC", "45'HC",
  "20'Reefer", "40'Reefer", "20'Open Top", "40'Open Top",
  "20'Flat Rack", "40'Flat Rack",
] as const;

export const TRUCK_TYPES = [
  "Caja seca 48'", "Caja seca 53'", "Plataforma 48'",
  "Plataforma 53'", "Torton", "Rabón", "Camioneta 3.5T",
  "Refrigerado 48'", "Refrigerado 53'", "Full (doble remolque)",
] as const;

export const SERVICE_SUBTYPE_CONFIG: Record<ServiceSubtype, {
  label: string;
  labelEn: string;
  icon: string;
  description: string;
  descriptionEn: string;
  group: string;
}> = {
  terrestre_ltl:    { label: "Terrestre LTL",         labelEn: "LTL Trucking",           icon: "🚛", description: "Carga parcial — múltiples rutas",          descriptionEn: "Less than truckload — multiple routes",    group: "Terrestre"    },
  terrestre_ftl:    { label: "Terrestre FTL",         labelEn: "FTL Trucking",           icon: "🚛", description: "Carga completa — unidad dedicada",           descriptionEn: "Full truckload — dedicated unit",          group: "Terrestre"    },
  maritimo_fcl:     { label: "Marítimo FCL",          labelEn: "FCL Ocean Freight",      icon: "🚢", description: "Contenedor completo",                        descriptionEn: "Full container load",                      group: "Marítimo"     },
  maritimo_lcl:     { label: "Marítimo LCL",          labelEn: "LCL Ocean Freight",      icon: "🚢", description: "Carga consolidada — por W/M",                descriptionEn: "Less than container load — W/M rate",      group: "Marítimo"     },
  aereo_carga:      { label: "Aéreo Carga",           labelEn: "Air Freight",            icon: "✈️", description: "Carga aérea — peso real o dimensional",       descriptionEn: "Air cargo — actual or volumetric weight",  group: "Aéreo"        },
  aereo_courier:    { label: "Aéreo Courier",         labelEn: "Courier / Express",      icon: "📦", description: "Paquetería express",                          descriptionEn: "Express parcel delivery",                  group: "Aéreo"        },
  impo_integral:    { label: "Importación Integral",  labelEn: "Import Customs",         icon: "🏛️", description: "Despacho aduanal de importación",             descriptionEn: "Import customs clearance",                 group: "Aduanal"      },
  expo_integral:    { label: "Exportación Integral",  labelEn: "Export Customs",         icon: "🏛️", description: "Despacho aduanal de exportación",             descriptionEn: "Export customs clearance",                 group: "Aduanal"      },
  comercializadora: { label: "Comercializadora",      labelEn: "Trading Company",        icon: "🏪", description: "Importación + venta nacionalizada",           descriptionEn: "Import + nationalized resale",             group: "Comercial"    },
  op_completa:      { label: "Operación Completa",    labelEn: "Full Operation",         icon: "🔄", description: "Flete internacional + despacho aduanal",      descriptionEn: "International freight + customs clearance",group: "Integral"     },
  consultoria:      { label: "Consultoría",           labelEn: "Consulting",             icon: "📋", description: "Asesoría en comercio exterior y logística",   descriptionEn: "Foreign trade and logistics consulting",   group: "Consultoría"  },
};
