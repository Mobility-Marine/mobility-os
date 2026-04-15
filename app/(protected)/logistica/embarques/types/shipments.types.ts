export type ShipmentStatus =
  | "draft" | "coordinating" | "pickup_scheduled"
  | "in_transit" | "at_destination" | "delivered"
  | "invoiced" | "cancelled";

export type ShipmentServiceType =
  | "terrestre_mx" | "terrestre_usa" | "maritimo"
  | "aereo" | "multimodal" | "almacenaje" | "aduanal" | "otro";

export type ShipmentServiceType =
  | "terrestre_mx" | "terrestre_usa" | "maritimo"
  | "aereo" | "multimodal" | "almacenaje" | "aduanal"
  | "consultoria" | "seguro" | "otro";

// Categoría: logistics = requiere ruta, consulting = solo registro/facturación
export const SERVICE_TYPE_CATEGORY: Record<ShipmentServiceType, "logistics" | "consulting"> = {
  terrestre_mx:  "logistics",
  terrestre_usa: "logistics",
  maritimo:      "logistics",
  aereo:         "logistics",
  multimodal:    "logistics",
  almacenaje:    "logistics",
  aduanal:       "logistics",
  consultoria:   "consulting",
  seguro:        "consulting",
  otro:          "consulting",
};

export const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, {
  labelKey: string; color: string; bg: string; border: string; step: number;
}> = {
  draft:             { labelKey: "logistics.statusDraft",            color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)", step: 1 },
  coordinating:      { labelKey: "logistics.statusCoordinating",     color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)",  step: 2 },
  pickup_scheduled:  { labelKey: "logistics.statusPickupScheduled",  color: "#a78bfa",                   bg: "#a78bfa15",               border: "#a78bfa40",                 step: 3 },
  in_transit:        { labelKey: "logistics.statusInTransit",        color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)",step: 4 },
  at_destination:    { labelKey: "logistics.statusAtDestination",    color: "#f59e0b",                   bg: "#f59e0b15",               border: "#f59e0b40",                 step: 5 },
  delivered:         { labelKey: "logistics.statusDelivered",        color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)",step: 6 },
  invoiced:          { labelKey: "logistics.statusInvoiced",         color: "#10b981",                   bg: "#10b98115",               border: "#10b98140",                 step: 7 },
  cancelled:         { labelKey: "logistics.statusCancelled",        color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)", step: 0 },
};

export const SERVICE_TYPE_CONFIG: Record<ShipmentServiceType, { labelKey: string; color: string; code: string }> = {
  terrestre_mx:  { labelKey: "logistics.serviceTerrestre",    color: "var(--color-brand-blue)",   code: "T" },
  terrestre_usa: { labelKey: "logistics.serviceTerrestreUsa", color: "#6366f1",                   code: "T" },
  maritimo:      { labelKey: "logistics.serviceMaritimo",     color: "#0891b2",                   code: "M" },
  aereo:         { labelKey: "logistics.serviceAereo",        color: "#f59e0b",                   code: "A" },
  multimodal:    { labelKey: "logistics.serviceMultimodal",   color: "#a78bfa",                   code: "X" },
  almacenaje:    { labelKey: "logistics.serviceAlmacenaje",   color: "#84cc16",                   code: "W" },
  aduanal:       { labelKey: "logistics.serviceAduanal",      color: "var(--color-warning-text)", code: "D" },
  otro:          { labelKey: "logistics.serviceOtro",         color: "var(--color-text-muted)",   code: "O" },
  consultoria: { labelKey: "logistics.serviceConsultoria", color: "#8b5cf6", code: "C" },
  seguro:      { labelKey: "logistics.serviceSeguro",      color: "#ec4899", code: "S" },
};

export const STATUS_FLOW: ShipmentStatus[] = [
  "draft", "coordinating", "pickup_scheduled",
  "in_transit", "at_destination", "delivered",
];

export const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  draft:            "coordinating",
  coordinating:     "pickup_scheduled",
  pickup_scheduled: "in_transit",
  in_transit:       "at_destination",
  at_destination:   "delivered",
};

export type Shipment = {
  id:                  string;
  company_id:          string;
  reference:           string;
  quotation_id?:       string | null;
  client_id?:          string | null;
  crm_account_id?:     string | null;
  status:              ShipmentStatus;
  service_type:        ShipmentServiceType;
  origin?:             string | null;
  destination?:        string | null;
  origin_country?:     string | null;
  destination_country?: string | null;
  incoterm?:           string | null;
  provider_id?:        string | null;
  transport_unit_id?:  string | null;
  currency:            string;
  subtotal:            number;
  tax_rate:            number;
  tax_amount:          number;
  total:               number;
  provider_cost:       number;
  provider_currency:   string;
  profit:              number;
  pickup_date?:        string | null;
  estimated_delivery?: string | null;
  actual_delivery?:    string | null;
  invoice_id?:         string | null;
  invoiced_at?:        string | null;
  tracking_number?:    string | null;
  tracking_type?:      string | null;
  notes?:              string | null;
  internal_notes?:     string | null;
  created_by?:         string | null;
  created_at:          string;
  updated_at?:         string | null;
  // Joined
  client?:             { name: string; email?: string; rfc?: string } | null;
  quotation?:          { quote_number: string } | null;
  provider?:           { name: string; contact_phone?: string } | null;
  services?:           ShipmentService[];
};

export type ShipmentService = {
  id:           string;
  company_id:   string;
  shipment_id:  string;
  sort_order:   number;
  service_type: ServiceLineType;
  description:  string;
  origin?:      string | null;
  destination?: string | null;
  incoterm?:    string | null;
  transit_time?: string | null;
  currency:     string;
  price:        number;
  cost:         number;
  notes?:       string | null;
  created_at:   string;
};

export type ShipmentFilters = {
  search:       string;
  status:       ShipmentStatus | "all" | "active";
  service_type: ShipmentServiceType | "all";
};

export const DEFAULT_SHIPMENT_FILTERS: ShipmentFilters = {
  search: "", status: "all", service_type: "all",
};

export type ShipmentKPIs = {
  total:         number;
  active:        number;
  delivered:     number;
  cancelled:     number;
  totalRevenue:  number;
  totalCost:     number;
  totalProfit:   number;
  avgMargin:     number;
};

export const SERVICE_LINE_TYPES: ServiceLineType[] = [
  "terrestre","aereo","maritimo","almacenaje",
  "comercializadora","aduanal","seguro","courier","otro",
];

export const SHIPMENT_SERVICE_TYPES: ShipmentServiceType[] = [
  "terrestre_mx","terrestre_usa","maritimo",
  "aereo","multimodal","almacenaje","aduanal",
  "consultoria","seguro","otro",
];

export const INCOTERMS = [
  "EXW","FCA","FAS","FOB","CFR","CIF",
  "CPT","CIP","DAP","DPU","DDP",
];

export const CURRENCIES = ["USD","MXN","EUR"];
