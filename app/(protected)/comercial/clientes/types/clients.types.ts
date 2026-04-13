// ============================================================
// CLIENTS TYPES v1 — GOD LEVEL
// Entidad maestra — un registro, múltiples roles
// ============================================================

export type ClientStatus = "active" | "inactive" | "blocked";

export type Client = {
  id:          string;
  company_id:  string;
  name:        string;
  legal_name?: string;
  rfc?:        string;
  email?:      string;
  phone?:      string;
  address?:    string;
  city?:       string;
  country?:    string;
  notes?:      string;
  website?:    string;
  // Roles — un mismo registro, múltiples roles
  is_customer: boolean;
  is_supplier: boolean;
  is_active:   boolean;
  // Métricas
  total_revenue?:  number;
  open_balance?:   number;
  credit_limit?:   number;
  payment_terms?:  string;
  // Conexiones
  crm_account_id?: string;
  // Timestamps
  created_at:  string;
  updated_at?: string;
  // Computed
  stats?:      ClientStats;
  documents?:  ClientDocument[];
};

export type ClientStats = {
  opportunities:  number;
  openOrders:     number;
  totalRevenue:   number;
  openBalance:    number;
  lastActivity?:  string;
  riskLevel:      "LOW" | "MEDIUM" | "HIGH";
};

export type ClientDocument = {
  id:          string;
  client_id:   string;
  company_id:  string;
  name:        string;
  type:        ClientDocumentType;
  url?:        string;
  notes?:      string;
  expires_at?: string;
  created_at:  string;
  created_by?: string;
};

export type ClientDocumentType =
  | "contract"
  | "nda"
  | "power_of_attorney"
  | "tax_id"
  | "certificate"
  | "invoice"
  | "other";

export const DOCUMENT_TYPE_CONFIG: Record<ClientDocumentType, { labelKey: string; color: string }> = {
  contract:          { labelKey: "clients.docContract",         color: "var(--color-brand-blue)"   },
  nda:               { labelKey: "clients.docNDA",              color: "var(--color-warning-text)"  },
  power_of_attorney: { labelKey: "clients.docPowerOfAttorney",  color: "#a78bfa"                   },
  tax_id:            { labelKey: "clients.docTaxId",            color: "var(--color-info-text)"    },
  certificate:       { labelKey: "clients.docCertificate",      color: "var(--color-success-text)" },
  invoice:           { labelKey: "clients.docInvoice",          color: "var(--color-text-muted)"   },
  other:             { labelKey: "clients.docOther",            color: "var(--color-text-muted)"   },
};

export type ClientFilters = {
  search:      string;
  role:        "all" | "customer" | "supplier" | "both";
  onlyActive:  boolean;
};

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  search: "", role: "all", onlyActive: true,
};

export type CreateClientPayload = {
  name:         string;
  legal_name?:  string;
  rfc?:         string;
  email?:       string;
  phone?:       string;
  address?:     string;
  city?:        string;
  country?:     string;
  notes?:       string;
  website?:     string;
  is_customer:  boolean;
  is_supplier:  boolean;
  credit_limit?: number;
  payment_terms?: string;
};

export type ClientConnection = {
  type:       "prospect" | "opportunity" | "order" | "invoice";
  id:         string;
  label:      string;
  status?:    string;
  value?:     number;
  date?:      string;
  url?:       string;
};
