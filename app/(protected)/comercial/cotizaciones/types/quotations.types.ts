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
  created_by?:     string | null;
  created_at:      string;
  updated_at?:     string;
  // Joined
  items?:          QuotationItem[];
  services?:       QuotationService[];
  client?:         { name: string; email?: string; rfc?: string } | null;
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
  id:            string;
  company_id:    string;
  quotation_id:  string;
  sort_order:    number;
  service_type:  ServiceType;
  description:   string;
  origin?:       string | null;
  destination?:  string | null;
  incoterm?:     string | null;
  transit_time?: string | null;
  currency:      string;
  price:         number;
  notes?:        string | null;
  created_at:    string;
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
  margin_minimum_pct:    number;
  monthly_goal:          number;
  goal_currency:         string;
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
};

// ── FILTERS ──────────────────────────────────────────────────

export type QuotationFilters = {
  search:  string;
  type:    QuotationType | "all";
  status:  QuotationStatus | "all";
};

export const DEFAULT_QUOTATION_FILTERS: QuotationFilters = {
  search: "", type: "all", status: "all",
};

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
