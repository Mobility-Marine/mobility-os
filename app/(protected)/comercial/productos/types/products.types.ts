// ============================================================
// PRODUCTS TYPES v1 — GOD LEVEL
// Catálogo maestro · CFDI · Carta Porte · Comercio Exterior
// ============================================================

export type ProductStatus = "active" | "inactive" | "discontinued";

export type Product = {
  id:                 string;
  company_id:         string;
  sku:                string;
  name:               string;
  description?:       string | null;
  category?:          string | null;
  unit:               string;
  unit_price:         number;
  cost:               number;
  currency:           string;
  tax_rate:           number;
  stock:              number;
  stock_min:          number;
  is_active:          boolean;
  // SAT / Fiscal
  sat_product_code?:  string | null;
  sat_unit_code?:     string | null;
  // Comercio Exterior / Carta Porte
  tariff_code?:       string | null;
  tariff_description?:string | null;
  country_of_origin?: string | null;
  // Metadata
  image_url?:         string | null;
  notes?:             string | null;
  created_by?:        string | null;
  created_at:         string;
  updated_at?:        string | null;
};

export type CreateProductPayload = Omit<Product, "id" | "company_id" | "created_at" | "updated_at" | "created_by">;

export type ProductFilters = {
  search:   string;
  category: string;
  status:   "all" | "active" | "inactive" | "low_stock" | "no_stock";
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: "", category: "", status: "all",
};

// ── CATÁLOGOS ─────────────────────────────────────────────────

export const PRODUCT_UNITS = [
  "pza", "kg", "ton", "lt", "ml", "m", "m²", "m³",
  "caja", "bolsa", "pallet", "contenedor", "rollo",
  "par", "docena", "ciento", "millar", "servicio", "hora", "día",
];

export const CURRENCIES = ["MXN", "USD", "EUR"];

// Unidades SAT más comunes
export const SAT_UNITS = [
  { code: "H87",  label: "H87 — Pieza" },
  { code: "KGM",  label: "KGM — Kilogramo" },
  { code: "TNE",  label: "TNE — Tonelada métrica" },
  { code: "LTR",  label: "LTR — Litro" },
  { code: "MTR",  label: "MTR — Metro" },
  { code: "MTK",  label: "MTK — Metro cuadrado" },
  { code: "MTQ",  label: "MTQ — Metro cúbico" },
  { code: "XBX",  label: "XBX — Caja" },
  { code: "XPK",  label: "XPK — Paquete" },
  { code: "XPL",  label: "XPL — Pallet" },
  { code: "GRM",  label: "GRM — Gramo" },
  { code: "E48",  label: "E48 — Servicio" },
  { code: "ACT",  label: "ACT — Actividad" },
  { code: "PR",   label: "PR — Par" },
  { code: "DZN",  label: "DZN — Docena" },
  { code: "HUR",  label: "HUR — Hora" },
  { code: "DAY",  label: "DAY — Día" },
  { code: "SET",  label: "SET — Juego" },
  { code: "XCT",  label: "XCT — Contenedor" },
  { code: "FOT",  label: "FOT — Pie" },
];

// Conexiones con otros módulos
export type ProductModuleLink = {
  module:      "cotizaciones" | "pedidos" | "facturacion" | "carta_porte" | "comercio_exterior" | "compras" | "inventario";
  label:       string;
  description: string;
  field:       string;
};

export const PRODUCT_MODULE_LINKS: ProductModuleLink[] = [
  { module: "cotizaciones",      label: "Cotizaciones",       description: "SKU, nombre, precio y unidad al buscar productos",  field: "sku, name, unit, unit_price" },
  { module: "pedidos",           label: "Pedidos",            description: "Referencia de producto al aceptar una cotización",  field: "product_id, sku, description" },
  { module: "facturacion",       label: "Facturación CFDI",   description: "Clave de producto y unidad SAT obligatorios",       field: "sat_product_code, sat_unit_code" },
  { module: "carta_porte",       label: "Carta Porte",        description: "Fracción arancelaria y país de origen",             field: "tariff_code, country_of_origin" },
  { module: "comercio_exterior", label: "Comercio Exterior",  description: "Fracción arancelaria para complemento CFDI",        field: "tariff_code, tariff_description" },
  { module: "compras",           label: "Compras / Costos",   description: "Costo actualizado desde órdenes de compra",         field: "cost" },
  { module: "inventario",        label: "Inventario",         description: "Stock disponible desde recepciones y ajustes",      field: "stock, stock_min" },
];

// CSV headers para import/export
export const CSV_HEADERS = [
  "sku", "name", "description", "category", "unit", "unit_price", "cost",
  "currency", "tax_rate", "stock", "stock_min", "is_active",
  "sat_product_code", "sat_unit_code",
  "tariff_code", "tariff_description", "country_of_origin",
  "notes",
];

export type ProductCSVRow = {
  sku:                string;
  name:               string;
  description?:       string;
  category?:          string;
  unit?:              string;
  unit_price?:        string;
  cost?:              string;
  currency?:          string;
  tax_rate?:          string;
  stock?:             string;
  stock_min?:         string;
  is_active?:         string;
  sat_product_code?:  string;
  sat_unit_code?:     string;
  tariff_code?:       string;
  tariff_description?:string;
  country_of_origin?: string;
  notes?:             string;
  _error?:            string;
};
