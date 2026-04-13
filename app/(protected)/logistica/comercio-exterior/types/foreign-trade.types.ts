export type OperationType = "import" | "export";
export type TradeRegime =
  | "definitiva_importacion" | "definitiva_exportacion"
  | "temporal_importacion"   | "temporal_exportacion"
  | "deposito_fiscal"        | "transito_internacional"
  | "recinto_fiscalizado"    | "elaboracion_transformacion" | "otros";

export type TradeStatus = "open" | "in_process" | "at_customs" | "released" | "closed" | "cancelled";

export const TRADE_STATUS_CONFIG: Record<TradeStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  open:        { labelKey: "logistics.statusOpen",        color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
  in_process:  { labelKey: "logistics.statusInProcess",   color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  at_customs:  { labelKey: "logistics.statusAtCustoms",   color: "#d97706",                   bg: "#fef3c7",                 border: "#fcd34d"                     },
  released:    { labelKey: "logistics.statusReleased",    color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)"  },
  closed:      { labelKey: "logistics.statusClosed",      color: "#475569",                   bg: "#f1f5f9",                 border: "#cbd5e1"                      },
  cancelled:   { labelKey: "logistics.ftStatusCancelled",   color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"   },
};

export const REGIME_LABELS: Record<TradeRegime, string> = {
  definitiva_importacion:    "logistics.regimeDefImp",
  definitiva_exportacion:    "logistics.regimeDefExp",
  temporal_importacion:      "logistics.regimeTempImp",
  temporal_exportacion:      "logistics.regimeTempExp",
  deposito_fiscal:           "logistics.regimeDeposito",
  transito_internacional:    "logistics.regimeTransito",
  recinto_fiscalizado:       "logistics.regimeRecinto",
  elaboracion_transformacion:"logistics.regimeElaboracion",
  otros:                     "logistics.regimeOtros",
};

export type ForeignTradeOperation = {
  id:                   string;
  company_id:           string;
  shipment_id?:         string | null;
  client_id?:           string | null;
  operation_type:       OperationType;
  regime:               TradeRegime;
  status:               TradeStatus;
  customs_broker_id?:   string | null;
  pedimento_number?:    string | null;
  pedimento_date?:      string | null;
  pedimento_type?:      string | null;
  pedimento_key?:       string | null;
  aduana?:              string | null;
  patente?:             string | null;
  doda_number?:         string | null;
  doda_date?:           string | null;
  invoice_number?:      string | null;
  invoice_value?:       number | null;
  invoice_currency:     string;
  incoterm?:            string | null;
  country_origin?:      string | null;
  country_destination?: string | null;
  igi:                  number;
  iva:                  number;
  dta:                  number;
  prevalidacion:        number;
  otros_impuestos:      number;
  total_taxes?:         number;
  total_weight_kg?:     number | null;
  num_packages?:        number | null;
  description?:         string | null;
  notes?:               string | null;
  alert_inspection:     boolean;
  alert_embargo:        boolean;
  entry_date?:          string | null;
  release_date?:        string | null;
  created_by?:          string | null;
  created_at:           string;
  updated_at?:          string | null;
  // joined
  items?:               ForeignTradeItem[];
  shipment?:            { reference: string; client?: { name: string } | null } | null;
  client?:              { name: string } | null;
  customs_broker?:      { provider_name: string } | null;
};

export type ForeignTradeItem = {
  id:                 string;
  company_id:         string;
  operation_id:       string;
  sort_order:         number;
  description:        string;
  tariff_code?:       string | null;
  tariff_description?:string | null;
  nico?:              string | null;
  quantity:           number;
  unit:               string;
  sat_unit_code?:     string | null;
  unit_value:         number;
  total_value:        number;
  currency:           string;
  weight_kg:          number;
  country_origin:     string;
  brand?:             string | null;
  model?:             string | null;
  serial_number?:     string | null;
  created_at:         string;
};

export type FTFilters = {
  search:         string;
  operation_type: OperationType | "all";
  status:         TradeStatus | "all";
};

export const DEFAULT_FT_FILTERS: FTFilters = {
  search: "", operation_type: "all", status: "all",
};

// Catálogos SAT aduanas comunes MX
export const ADUANAS_MX = [
  { code: "240", name: "Nuevo Laredo" },
  { code: "280", name: "Reynosa" },
  { code: "260", name: "Matamoros" },
  { code: "010", name: "Ensenada" },
  { code: "020", name: "Mexicali" },
  { code: "030", name: "Tecate" },
  { code: "040", name: "Tijuana" },
  { code: "050", name: "Nogales" },
  { code: "070", name: "Ciudad Juárez" },
  { code: "090", name: "Ojinaga" },
  { code: "130", name: "Piedras Negras" },
  { code: "150", name: "Ciudad Acuña" },
  { code: "300", name: "Tampico" },
  { code: "340", name: "Tuxpan" },
  { code: "360", name: "Veracruz" },
  { code: "470", name: "Manzanillo" },
  { code: "480", name: "Mazatlán" },
  { code: "530", name: "Guaymas" },
  { code: "800", name: "Ciudad de México (AICM)" },
  { code: "820", name: "Toluca" },
];
