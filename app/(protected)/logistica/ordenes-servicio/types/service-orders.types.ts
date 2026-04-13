export type ServiceOrderType = "ccp_carta" | "bol_usa" | "carta_aduanal";
export type ServiceOrderStatus = "draft" | "sent" | "confirmed";
export type SOTemplate = "elegante" | "moderna" | "corporativa";

export const SO_TYPE_CONFIG: Record<ServiceOrderType, {
  labelKey: string; color: string; bg: string; border: string; description: string;
}> = {
  ccp_carta:     { labelKey: "logistics.typeCcpCarta",    color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    description: "CCP + Carta de instrucciones para el transportista terrestre MX" },
  bol_usa:       { labelKey: "logistics.typeBolUsa",      color: "#6366f1",                   bg: "#6366f115",               border: "#6366f140",                   description: "Bill of Lading para carriers terrestres americanos. Sin CCP." },
  carta_aduanal: { labelKey: "logistics.typeCartaAduanal",color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", description: "Instrucciones para el agente aduanal en cruce de frontera" },
};

export const SO_STATUS_CONFIG: Record<ServiceOrderStatus, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  draft:     { labelKey: "logistics.statusDraftSO",     color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  sent:      { labelKey: "logistics.statusSentSO",      color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"   },
  confirmed: { labelKey: "logistics.statusConfirmedSO", color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
};

export type ServiceOrder = {
  id:                   string;
  company_id:           string;
  shipment_id:          string;
  order_type:           ServiceOrderType;
  status:               ServiceOrderStatus;
  shipper_name?:        string | null;
  shipper_address?:     string | null;
  shipper_city?:        string | null;
  shipper_state?:       string | null;
  shipper_country?:     string | null;
  shipper_contact?:     string | null;
  shipper_phone?:       string | null;
  consignee_name?:      string | null;
  consignee_address?:   string | null;
  consignee_city?:      string | null;
  consignee_state?:     string | null;
  consignee_country?:   string | null;
  consignee_contact?:   string | null;
  consignee_phone?:     string | null;
  carrier_name?:        string | null;
  carrier_contact?:     string | null;
  carrier_phone?:       string | null;
  carrier_scac?:        string | null;
  driver_name?:         string | null;
  driver_license?:      string | null;
  vehicle_type?:        string | null;
  vehicle_plates?:      string | null;
  trailer_plates?:      string | null;
  pickup_date?:         string | null;
  pickup_address?:      string | null;
  delivery_date?:       string | null;
  delivery_address?:    string | null;
  pro_number?:          string | null;
  reference_number?:    string | null;
  incoterm?:            string | null;
  special_instructions?: string | null;
  notes?:               string | null;
  pdf_url?:             string | null;
  sent_at?:             string | null;
  created_by?:          string | null;
  created_at:           string;
  updated_at?:          string | null;
  // Joined
  items?:               ServiceOrderItem[];
  shipment?:            { reference: string; client?: { name: string } | null } | null;
};

export type ServiceOrderItem = {
  id:                 string;
  company_id:         string;
  service_order_id:   string;
  sort_order:         number;
  description:        string;
  sat_product_code?:  string | null;
  packaging_type?:    string | null;
  packaging_desc?:    string | null;
  hazmat_key?:        string | null;
  quantity:           number;
  unit:               string;
  sat_unit_code?:     string | null;
  weight_kg:          number;
  weight_lbs:         number;
  length_cm?:         number | null;
  width_cm?:          number | null;
  height_cm?:         number | null;
  commercial_value:   number;
  currency:           string;
  tariff_code?:       string | null;
  tariff_description?: string | null;
  country_of_origin:  string;
  notes?:             string | null;
  created_at:         string;
};

export type SOFilters = {
  search:     string;
  type:       ServiceOrderType | "all";
  status:     ServiceOrderStatus | "all";
};

export const DEFAULT_SO_FILTERS: SOFilters = {
  search: "", type: "all", status: "all",
};

// Catálogos SAT precargados
export const SAT_PACKAGING_TYPES = [
  { code: "1A1", desc: "Bidón de acero de tapa fija" },
  { code: "1A2", desc: "Bidón de acero de tapa removible" },
  { code: "4A",  desc: "Caja de acero" },
  { code: "4B",  desc: "Caja de aluminio" },
  { code: "4C1", desc: "Caja de madera natural ordinaria" },
  { code: "4C2", desc: "Caja de madera natural con paredes a prueba de polvo" },
  { code: "4D",  desc: "Caja de madera contrachapada" },
  { code: "4F",  desc: "Caja de madera reconstituida" },
  { code: "4G",  desc: "Caja de cartón" },
  { code: "4H1", desc: "Caja de plástico expandido" },
  { code: "4H2", desc: "Caja de plástico rígido" },
  { code: "5H4", desc: "Bolsa de plástico tejido" },
  { code: "6HA1",desc: "Embalaje compuesto, recipiente de plástico" },
  { code: "VG",  desc: "Contenedor a granel rígido" },
  { code: "ZZ",  desc: "Mutuamente definido" },
];

export const SAT_UNIT_CODES = [
  { code: "E48", desc: "Unidad de servicio" },
  { code: "KGM", desc: "Kilogramo" },
  { code: "LTR", desc: "Litro" },
  { code: "MTR", desc: "Metro" },
  { code: "MTK", desc: "Metro cuadrado" },
  { code: "MTQ", desc: "Metro cúbico" },
  { code: "H87", desc: "Pieza" },
  { code: "XBX", desc: "Caja" },
  { code: "XPK", desc: "Paquete" },
  { code: "XPL", desc: "Tarima" },
  { code: "XTO", desc: "Tonelada" },
  { code: "XKG", desc: "Kilogramo (carga)" },
];

export const CCP_VEHICLE_TYPES = [
  { code: "VL",   desc: "Vehículo ligero" },
  { code: "C2",   desc: "Camión 2 ejes" },
  { code: "C3",   desc: "Camión 3 ejes" },
  { code: "C2R2", desc: "Camión-remolque 2+2 ejes" },
  { code: "C3R2", desc: "Camión-remolque 3+2 ejes" },
  { code: "C3R3", desc: "Camión-remolque 3+3 ejes" },
  { code: "T3S1", desc: "Tractocamión-semirremolque 3+1 ejes" },
  { code: "T3S2", desc: "Tractocamión-semirremolque 3+2 ejes" },
  { code: "T3S3", desc: "Tractocamión-semirremolque 3+3 ejes" },
  { code: "OTROSG",desc: "Otro tipo de servicio" },
];
