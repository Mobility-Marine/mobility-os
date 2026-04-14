// ============================================================
// COSTOS — Types v1
// ============================================================

export type CostItem = {
  item_id:      string;
  company_id:   string;
  product_id:   string | null;
  name:         string;
  sku:          string | null;
  category:     string | null;
  unit:         string;
  current_cost: number;
  sale_price:   number;
  margin_pct:   number;
  stock_qty:    number;
  stock_value:  number;
  avg_cost:     number;
  // Enriched
  prev_cost?:      number | null;
  variation_pct?:  number | null;
  last_supplier?:  string | null;
  last_po_date?:   string | null;
};

export type PriceHistory = {
  id:          string;
  company_id:  string;
  product_id:  string | null;
  item_id:     string | null;
  supplier_id: string | null;
  po_id:       string | null;
  unit_price:  number;
  quantity:    number;
  currency:    string;
  source:      "manual" | "purchase_order" | "import";
  notes:       string | null;
  recorded_at: string;
  created_at:  string;
  // Joined
  supplier?: { name: string } | null;
  po?:       { po_number: string } | null;
};

export type SupplierComparison = {
  supplier_id:    string;
  supplier_name:  string;
  last_price:     number;
  min_price:      number;
  max_price:      number;
  last_date:      string;
  purchase_count: number;
};

export type CostStats = {
  total_items:      number;
  total_stock_value:number;
  avg_margin:       number;
  negative_margin:  number;
  low_margin:       number;
  no_price:         number;
};

// Import/Export
export type ImportRow = {
  row:          number;
  sku:          string;
  name?:        string;
  new_cost:     number;
  currency?:    string;
  notes?:       string;
  // After matching
  item_id?:     string;
  product_id?:  string;
  found:        boolean;
  current_cost: number;
  variation_pct:number;
  error?:       string;
};

export type CostFilters = {
  search:       string;
  category:     string;
  margin_alert: "all" | "negative" | "low" | "no_price" | "ok";
  sort_by:      "name" | "cost" | "margin" | "stock_value" | "variation";
  sort_dir:     "asc" | "desc";
};

export const DEFAULT_COST_FILTERS: CostFilters = {
  search: "", category: "", margin_alert: "all",
  sort_by: "name", sort_dir: "asc",
};

export const MARGIN_ALERT_CONFIG = {
  negative: { labelEs: "Margen negativo", labelEn: "Negative margin", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  low:      { labelEs: "Margen bajo",     labelEn: "Low margin",      color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  no_price: { labelEs: "Sin precio venta",labelEn: "No sale price",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  ok:       { labelEs: "Margen sano",     labelEn: "Healthy margin",  color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
};
