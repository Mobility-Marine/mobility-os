// ============================================================
// CXP TYPES v1 — GOD LEVEL
// Cuentas por Pagar · Pagos · Proveedores · KPIs
// ============================================================

export type APStatus = "pending" | "partial" | "paid" | "disputed" | "cancelled";
export type APPaymentStatus = "not_scheduled" | "scheduled" | "paid";
export type APSupplierType = "procurement" | "logistics" | "operating";
export type APDocumentType = "invoice" | "cost_pending" | "credit_note" | "debit_note" | "expense" | "manual";
export type APAging = "0-30" | "31-60" | "61-90" | "+90";

export const EXPENSE_CATEGORIES = [
  { value: "renta",       label: "Renta / Arrendamiento" },
  { value: "servicios",   label: "Servicios (luz, agua, internet)" },
  { value: "nomina",      label: "Nómina / Honorarios" },
  { value: "transporte",  label: "Transporte interno" },
  { value: "papeleria",   label: "Papelería y consumibles" },
  { value: "mantenimiento",label:"Mantenimiento" },
  { value: "publicidad",  label: "Publicidad y marketing" },
  { value: "seguros",     label: "Seguros corporativos" },
  { value: "legal",       label: "Legal y notarial" },
  { value: "otro",        label: "Otro gasto operativo" },
];

export const AP_STATUS_CONFIG: Record<APStatus, { labelEs: string; color: string; bg: string; border: string }> = {
  pending:   { labelEs: "Pendiente",   color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  partial:   { labelEs: "Parcial",     color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
  paid:      { labelEs: "Pagado",      color: "#14532d", bg: "#dcfce7", border: "#86efac" },
  disputed:  { labelEs: "En disputa",  color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd" },
  cancelled: { labelEs: "Cancelado",   color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
};

export const AP_PAYMENT_STATUS_CONFIG: Record<APPaymentStatus, { labelEs: string; color: string; bg: string }> = {
  not_scheduled: { labelEs: "Sin programar", color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)" },
  scheduled:     { labelEs: "Programado",    color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"   },
  paid:          { labelEs: "Pagado",        color: "var(--color-success-text)", bg: "var(--color-success-bg)"},
};

export const AP_SUPPLIER_TYPE_CONFIG: Record<APSupplierType, { labelEs: string; color: string; icon: string }> = {
  procurement: { labelEs: "Abastecimiento", color: "var(--color-brand-blue)",   icon: "📦" },
  logistics:   { labelEs: "Logística",      color: "var(--color-warning-text)", icon: "🚛" },
  operating:   { labelEs: "Operativo",      color: "#8b5cf6",                  icon: "🏢" },
};

export const AP_AGING_CONFIG: Record<APAging, { labelEs: string; color: string; bg: string; border: string }> = {
  "0-30":  { labelEs: "0-30 días",  color: "#16a34a", bg: "rgba(22,163,74,0.1)",   border: "rgba(22,163,74,0.3)"   },
  "31-60": { labelEs: "31-60 días", color: "#d97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.3)"   },
  "61-90": { labelEs: "61-90 días", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)"  },
  "+90":   { labelEs: "+90 días",   color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.3)"   },
};

export type AccountPayable = {
  id:                    string;
  company_id:            string;
  supplier_id?:          string | null;
  logistics_provider_id?:string | null;
  supplier_type:         APSupplierType;
  supplier_name:         string;
  supplier_rfc?:         string | null;
  supplier_email?:       string | null;
  document_type:         APDocumentType;
  document_number?:      string | null;
  document_date:         string;
  due_date?:             string | null;
  expense_category?:     string | null;
  currency:              string;
  has_tax?:              boolean;       // si false, total = subtotal (factura sin IVA, típico USD/EUR)
  subtotal:              number;
  tax_amount:            number;
  total:                 number;
  paid_amount:           number;
  balance:               number;
  status:                APStatus;
  payment_status:        APPaymentStatus;
  scheduled_date?:       string | null;
  related_po_id?:        string | null;
  related_shipment_id?:  string | null;
  xml_url?:              string | null;
  pdf_url?:              string | null;
  notes?:                string | null;
  created_at:            string;
  updated_at:            string;
  // computed
  days_due?:             number;
  aging_bucket?:         APAging;
  // joined
  supplier?:             { name: string; rfc?: string } | null;
  logistics_provider?:   { name: string } | null;
  po?:                   { po_number: string } | null;
  shipment?:             { reference: string } | null;
};

export type APPayment = {
  id:           string;
  company_id:   string;
  ap_id:        string;
  amount:       number;
  currency:     string;
  payment_date: string;
  payment_form: string | null;
  reference:    string | null;
  notes:        string | null;
  created_at:   string;
};

export type APStats = {
  total_balance:   number;
  total_overdue:   number;
  paid_month:      number;
  count_pending:   number;
  count_overdue:   number;
  bucket_0_30:     number;
  bucket_31_60:    number;
  bucket_61_90:    number;
  bucket_90plus:   number;
  count_0_30:      number;
  count_31_60:     number;
  count_61_90:     number;
  count_90plus:    number;
  by_type:         { procurement: number; logistics: number; operating: number };
  por_moneda: Record<string, { balance: number; overdue: number; paid: number; count: number }>;
};

export type SupplierAPSummary = {
  supplier_id?:    string | null;
  supplier_name:   string;
  supplier_rfc?:   string | null;
  supplier_type:   APSupplierType;
  total:           number;
  balance:         number;
  overdue:         number;
  count:           number;
  oldest_date:     string;
  currency:        string;
  risk:            "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type APFilters = {
  search:        string;
  status:        APStatus | "all";
  supplier_type: APSupplierType | "all";
  aging:         APAging | "all";
  from:          string;
  to:            string;
};

export const DEFAULT_AP_FILTERS: APFilters = {
  search: "", status: "all", supplier_type: "all", aging: "all", from: "", to: "",
};
