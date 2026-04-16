export type AssetType =
  | "vehicle" | "machinery" | "computer" | "furniture"
  | "building" | "land" | "software" | "improvements"
  | "financial_lease" | "other";

export type DepreciationMethod =
  | "straight_line" | "double_declining" | "sum_of_digits" | "no_depreciation";

export type AssetStatus =
  | "active" | "fully_depreciated" | "disposed" | "inactive";

export type DisposalType =
  | "sale" | "scrap" | "donation" | "transfer" | "loss";

// Tasas SAT por tipo de activo (Artículo 34 LISR)
export const SAT_RATES: Record<AssetType, number> = {
  vehicle:        0.25,
  machinery:      0.10,
  computer:       0.30,
  furniture:      0.10,
  building:       0.05,
  land:           0.00,
  software:       0.30,
  improvements:   0.10,
  financial_lease:0.10,
  other:          0.10,
};

// Vida útil en meses por tipo
export const DEFAULT_LIFE_MONTHS: Record<AssetType, number> = {
  vehicle:        48,
  machinery:      120,
  computer:       36,
  furniture:      120,
  building:       240,
  land:           0,
  software:       36,
  improvements:   120,
  financial_lease:60,
  other:          60,
};

export const ASSET_TYPE_CONFIG: Record<AssetType, { labelEs: string; icon: string; color: string }> = {
  vehicle:        { labelEs: "Vehículo",          icon: "🚗", color: "#3b82f6" },
  machinery:      { labelEs: "Maquinaria",        icon: "⚙️", color: "#f59e0b" },
  computer:       { labelEs: "Equipo cómputo",    icon: "💻", color: "#8b5cf6" },
  furniture:      { labelEs: "Mobiliario",        icon: "🪑", color: "#10b981" },
  building:       { labelEs: "Construcción",      icon: "🏢", color: "#6366f1" },
  land:           { labelEs: "Terreno",           icon: "🌍", color: "#84cc16" },
  software:       { labelEs: "Software",          icon: "💿", color: "#06b6d4" },
  improvements:   { labelEs: "Mejoras a local",   icon: "🔨", color: "#f97316" },
  financial_lease:{ labelEs: "Arrendamiento fin.",icon: "📋", color: "#ec4899" },
  other:          { labelEs: "Otro",              icon: "📦", color: "#64748b" },
};

export const DEPRECIATION_METHOD_CONFIG: Record<DepreciationMethod, { labelEs: string; desc: string }> = {
  straight_line:    { labelEs: "Línea recta",             desc: "Depreciación igual cada mes" },
  double_declining: { labelEs: "Doble saldo decreciente", desc: "Mayor al inicio, menor al final" },
  sum_of_digits:    { labelEs: "Suma de dígitos",         desc: "Ponderado por vida restante" },
  no_depreciation:  { labelEs: "Sin depreciación",        desc: "Terrenos y activos no depreciables" },
};

export const ASSET_STATUS_CONFIG: Record<AssetStatus, { labelEs: string; color: string; bg: string }> = {
  active:            { labelEs: "Activo",                color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  fully_depreciated: { labelEs: "Tot. depreciado",       color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  disposed:          { labelEs: "Dado de baja",          color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  inactive:          { labelEs: "Inactivo",              color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
};

export type FixedAsset = {
  id:                       string;
  company_id:               string;
  name:                     string;
  description?:             string | null;
  asset_type:               AssetType;
  serial_number?:           string | null;
  location?:                string | null;
  acquisition_date:         string;
  acquisition_cost:         number;
  salvage_value:            number;
  currency:                 string;
  depreciation_method:      DepreciationMethod;
  useful_life_months:       number;
  depreciation_rate_annual?: number | null;
  accumulated_depreciation: number;
  book_value:               number;
  monthly_depreciation:     number;
  status:                   AssetStatus;
  fully_depreciated_at?:    string | null;
  related_ap_id?:           string | null;
  supplier_id?:             string | null;
  notes?:                   string | null;
  tags?:                    string[] | null;
  image_url?:               string | null;
  created_at:               string;
  updated_at:               string;
};

export type DepreciationEntry = {
  id:                   string;
  company_id:           string;
  asset_id:             string;
  period:               string;
  period_date:          string;
  depreciation_amount:  number;
  accumulated_to_date:  number;
  book_value_after:     number;
  posted:               boolean;
  posted_at?:           string | null;
  // joined
  asset?:               { name: string; asset_type: AssetType } | null;
};

export type AssetDisposal = {
  id:                     string;
  company_id:             string;
  asset_id:               string;
  disposal_date:          string;
  disposal_type:          DisposalType;
  sale_amount:            number;
  book_value_at_disposal: number;
  gain_loss:              number;
  notes?:                 string | null;
  created_at:             string;
  // joined
  asset?:                 { name: string; asset_type: AssetType } | null;
};

export type AssetStats = {
  total_assets:         number;
  total_cost:           number;
  total_book_value:     number;
  total_accumulated_dep:number;
  monthly_dep_pending:  number;
  by_type:              Record<AssetType, { count: number; book_value: number; cost: number }>;
};
