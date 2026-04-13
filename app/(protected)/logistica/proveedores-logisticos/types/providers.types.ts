// ============================================================
// LOGISTICS PROVIDERS TYPES v1 — GOD LEVEL
// ============================================================

export type ProviderType =
  | "carrier_mx" | "carrier_usa" | "customs_broker"
  | "airline" | "shipping_line" | "warehouse"
  | "insurance" | "courier" | "other";

export type ProviderDocType =
  | "fiscal" | "acta_constitutiva" | "id_representante"
  | "caat" | "licencia_federal" | "poliza_seguro"
  | "alta_proveedor" | "contrato" | "other";

export type InvoiceStatus = "pending" | "approved" | "paid" | "disputed";

export const PROVIDER_TYPE_CONFIG: Record<ProviderType, { labelKey: string; color: string }> = {
  carrier_mx:     { labelKey: "logistics.typeCarrierMx",     color: "var(--color-brand-blue)"   },
  carrier_usa:    { labelKey: "logistics.typeCarrierUsa",    color: "#6366f1"                   },
  customs_broker: { labelKey: "logistics.typeCustomsBroker", color: "var(--color-warning-text)" },
  airline:        { labelKey: "logistics.typeAirline",       color: "var(--color-info-text)"    },
  shipping_line:  { labelKey: "logistics.typeShippingLine",  color: "#0891b2"                   },
  warehouse:      { labelKey: "logistics.typeWarehouse",     color: "#a78bfa"                   },
  insurance:      { labelKey: "logistics.typeInsurance",     color: "var(--color-success-text)" },
  courier:        { labelKey: "logistics.typeCourier",       color: "#f59e0b"                   },
  other:          { labelKey: "logistics.typeOther",         color: "var(--color-text-muted)"   },
};

export const DOC_TYPE_CONFIG: Record<ProviderDocType, { labelKey: string; required: boolean }> = {
  fiscal:            { labelKey: "logistics.docFiscal",  required: true  },
  acta_constitutiva: { labelKey: "logistics.docActa",    required: false },
  id_representante:  { labelKey: "logistics.docId",      required: true  },
  caat:              { labelKey: "logistics.docCaat",    required: false },
  licencia_federal:  { labelKey: "logistics.docLicencia",required: false },
  poliza_seguro:     { labelKey: "logistics.docPoliza",  required: true  },
  alta_proveedor:    { labelKey: "logistics.docAlta",    required: false },
  contrato:          { labelKey: "logistics.docContrato",required: false },
  other:             { labelKey: "logistics.docOther",   required: false },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  pending:  { labelKey: "logistics.invoicePending",  color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  approved: { labelKey: "logistics.invoiceApproved", color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  paid:     { labelKey: "logistics.invoicePaid",     color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  disputed: { labelKey: "logistics.invoiceDisputed", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
};

export type LogisticsProvider = {
  id:                string;
  company_id:        string;
  name:              string;
  provider_type:     ProviderType;
  rfc?:              string | null;
  tax_id?:           string | null;
  scac_code?:        string | null;
  contact_name?:     string | null;
  contact_email?:    string | null;
  contact_phone?:    string | null;
  website?:          string | null;
  coverage_routes?:  string | null;
  services_offered?: string | null;
  is_active:         boolean;
  rating?:           number | null;
  notes?:            string | null;
  payment_terms?:    string | null;
  created_by?:       string | null;
  created_at:        string;
  updated_at?:       string | null;
  // Joined
  documents?:        ProviderDocument[];
  invoices?:         ProviderInvoice[];
};

export type ProviderDocument = {
  id:           string;
  company_id:   string;
  provider_id:  string;
  doc_type:     ProviderDocType;
  doc_name:     string;
  file_url:     string;
  file_size?:   number | null;
  file_type?:   string | null;
  expiry_date?: string | null;
  notes?:       string | null;
  uploaded_by?: string | null;
  created_at:   string;
};

export type ProviderInvoice = {
  id:                  string;
  company_id:          string;
  provider_id:         string;
  shipment_id?:        string | null;
  invoice_number:      string;
  invoice_date:        string;
  currency:            string;
  subtotal:            number;
  tax_amount:          number;
  total:               number;
  extracted_by_ai:     boolean;
  ai_confidence?:      number | null;
  concept?:            string | null;
  services_described?: string | null;
  status:              InvoiceStatus;
  due_date?:           string | null;
  paid_at?:            string | null;
  payment_reference?:  string | null;
  file_url?:           string | null;
  notes?:              string | null;
  created_by?:         string | null;
  created_at:          string;
  updated_at?:         string | null;
};

export type ProviderFilters = {
  search:       string;
  type:         ProviderType | "all";
  status:       "all" | "active" | "inactive";
};

export const DEFAULT_PROVIDER_FILTERS: ProviderFilters = {
  search: "", type: "all", status: "active",
};

export type ProviderKPIs = {
  total:        number;
  active:       number;
  inactive:     number;
  byType:       Partial<Record<ProviderType, number>>;
  totalAP:      number;     // Cuentas por pagar pendientes
  pendingDocs:  number;     // Docs por vencer en 30 días
};

export const PROVIDER_TYPES: ProviderType[] = [
  "carrier_mx","carrier_usa","customs_broker",
  "airline","shipping_line","warehouse",
  "insurance","courier","other",
];

export const DOC_TYPES: ProviderDocType[] = [
  "fiscal","acta_constitutiva","id_representante",
  "caat","licencia_federal","poliza_seguro",
  "alta_proveedor","contrato","other",
];
