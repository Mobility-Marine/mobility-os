export type SupplierStatus = "active" | "inactive" | "blocked";

export const SUPPLIER_STATUS_CONFIG: Record<SupplierStatus, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  active:   { labelKey: "procurement.supplierActive",   color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  inactive: { labelKey: "procurement.supplierInactive", color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
  blocked:  { labelKey: "procurement.supplierBlocked",  color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)", border: "var(--color-danger-border)"   },
};

export type Supplier = {
  id:               string;
  company_id:       string;
  // Viene de clients table con role = 'supplier'
  name:             string;
  legal_name?:      string | null;
  rfc?:             string | null;
  tax_id?:          string | null;
  email?:           string | null;
  phone?:           string | null;
  website?:         string | null;
  city?:            string | null;
  country?:         string | null;
  notes?:           string | null;
  credit_limit?:    number | null;
  payment_terms?:   string | null;
  is_active:        boolean;
  // Campos extendidos del CRM
  industry?:        string | null;
  // Calculados / joins
  avg_score?:       number | null;
  active_contracts?:number;
  last_po_date?:    string | null;
  total_purchased?: number;
};

export type SupplierEvaluation = {
  id:             string;
  company_id:     string;
  supplier_id:    string;
  evaluated_month:string;
  score_delivery: number;
  score_quality:  number;
  score_price:    number;
  score_service:  number;
  score_total?:   number;
  on_time_pct?:   number | null;
  rejection_pct?: number | null;
  notes?:         string | null;
  evaluated_by?:  string | null;
  created_at:     string;
};

export type SupplierContract = {
  id:              string;
  company_id:      string;
  supplier_id:     string;
  contract_number?:string | null;
  name:            string;
  start_date:      string;
  end_date?:       string | null;
  currency:        string;
  status:          "active" | "expired" | "cancelled";
  notes?:          string | null;
  created_at:      string;
  updated_at?:     string | null;
  items?:          SupplierContractItem[];
};

export type SupplierContractItem = {
  id:            string;
  company_id:    string;
  contract_id:   string;
  product_id?:   string | null;
  description:   string;
  unit:          string;
  agreed_price:  number;
  currency:      string;
  min_quantity?: number | null;
  max_quantity?: number | null;
  notes?:        string | null;
  created_at:    string;
  product?:      { name: string; sku: string } | null;
};

export type SupplierFilters = {
  search: string;
  status: "all" | "active" | "inactive" | "blocked";
};

export const DEFAULT_SUPPLIER_FILTERS: SupplierFilters = {
  search: "", status: "all",
};
