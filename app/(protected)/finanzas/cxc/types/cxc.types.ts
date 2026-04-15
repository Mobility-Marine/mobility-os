// ============================================================
// CxC TYPES v1 — GOD LEVEL
// Cuentas por Cobrar · Pagos · Actividades · KPIs
// ============================================================

export type ARStatus =
  | "pending"    // Pendiente de pago
  | "partial"    // Pago parcial recibido
  | "paid"       // Pagado completamente
  | "disputed"   // En disputa
  | "bad_debt";  // Incobrable

export type ARCollectionStatus =
  | "not_started" // Sin gestión
  | "contacted"   // Contactado
  | "promised"    // Promesa de pago
  | "escalated";  // Escalado

export type ARActivityType =
  | "call" | "email" | "whatsapp" | "visit"
  | "promise" | "note" | "escalation" | "payment";

export type ARAging = "0-30" | "31-60" | "61-90" | "+90";

// ── STATUS CONFIGS ──────────────────────────────────────────

export const AR_STATUS_CONFIG: Record<ARStatus, { labelEs: string; labelEn: string; color: string; bg: string; border: string }> = {
  pending:  { labelEs: "Pendiente",  labelEn: "Pending",   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",  border: "var(--color-warning-border)"  },
  partial:  { labelEs: "Parcial",    labelEn: "Partial",   color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",     border: "var(--color-info-border)"     },
  paid:     { labelEs: "Pagado",     labelEn: "Paid",      color: "var(--color-success-text)", bg: "var(--color-success-bg)",  border: "var(--color-success-border)"  },
  disputed: { labelEs: "En disputa", labelEn: "Disputed",  color: "#7c3aed",                   bg: "#ede9fe",                  border: "#c4b5fd"                      },
  bad_debt: { labelEs: "Incobrable", labelEn: "Bad debt",  color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",   border: "var(--color-danger-border)"   },
};

export const AR_COLLECTION_CONFIG: Record<ARCollectionStatus, { labelEs: string; labelEn: string; color: string; bg: string }> = {
  not_started: { labelEs: "Sin gestión",        labelEn: "Not started",    color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  contacted:   { labelEs: "Contactado",          labelEn: "Contacted",      color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  promised:    { labelEs: "Promesa de pago",     labelEn: "Payment promise",color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  escalated:   { labelEs: "Escalado",            labelEn: "Escalated",      color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
};

export const AR_ACTIVITY_CONFIG: Record<ARActivityType, { labelEs: string; labelEn: string; color: string; icon: string }> = {
  call:       { labelEs: "Llamada",          labelEn: "Call",        color: "var(--color-success-text)", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 8.31 19.79 19.79 0 0 1 1.61 4C1.49 3.44 1.89 2.94 2.44 2.94h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.91 10.9a16 16 0 0 0 6.14 6.14l1.06-1.29a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 18.16z" },
  email:      { labelEs: "Email",            labelEn: "Email",       color: "var(--color-brand-blue)",   icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6 12,13 2,6" },
  whatsapp:   { labelEs: "WhatsApp",         labelEn: "WhatsApp",    color: "#25d366",                   icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" },
  visit:      { labelEs: "Visita",           labelEn: "Visit",       color: "var(--color-warning-text)", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  promise:    { labelEs: "Promesa de pago",  labelEn: "Promise",     color: "#f59e0b",                   icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  note:       { labelEs: "Nota",             labelEn: "Note",        color: "var(--color-text-muted)",   icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8" },
  escalation: { labelEs: "Escalación",       labelEn: "Escalation",  color: "var(--color-danger-text)",  icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" },
  payment:    { labelEs: "Pago recibido",    labelEn: "Payment",     color: "var(--color-success-text)", icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
};

export const AR_AGING_CONFIG: Record<ARAging, { labelEs: string; labelEn: string; color: string; bg: string; border: string }> = {
  "0-30":  { labelEs: "0-30 días",   labelEn: "0-30 days",   color: "var(--color-success-text)", bg: "var(--color-success-bg)",  border: "var(--color-success-border)"  },
  "31-60": { labelEs: "31-60 días",  labelEn: "31-60 days",  color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",  border: "var(--color-warning-border)"  },
  "61-90": { labelEs: "61-90 días",  labelEn: "61-90 days",  color: "#f97316",                   bg: "#fff7ed",                  border: "#fed7aa"                      },
  "+90":   { labelEs: "+90 días",    labelEn: "+90 days",    color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",   border: "var(--color-danger-border)"   },
};

// ── TIPOS DE DATOS ──────────────────────────────────────────

export type AccountReceivable = {
  id:                string;
  company_id:        string;
  cfdi_id:           string | null;
  client_id:         string | null;
  document_type:     "cfdi" | "manual";
  document_number:   string | null;
  document_date:     string;
  due_date:          string | null;
  client_name:       string;
  client_rfc:        string | null;
  client_email:      string | null;
  currency:          string;
  subtotal:          number;
  tax_amount:        number;
  total:             number;
  paid_amount:       number;
  balance:           number;
  status:            ARStatus;
  collection_status: ARCollectionStatus;
  promise_date:      string | null;
  notes:             string | null;
  assigned_to:       string | null;
  created_at:        string;
  updated_at:        string;
  // Computed client-side
  days_overdue?:     number;
  aging_bucket?:     ARAging;
  // Joined
  payments?:         ARPayment[];
  activities?:       ARActivity[];
};

export type ARPayment = {
  id:           string;
  company_id:   string;
  ar_id:        string;
  amount:       number;
  currency:     string;
  exchange_rate:number;
  payment_date: string;
  payment_form: string | null;
  reference:    string | null;
  cfdi_rep_id:  string | null;
  notes:        string | null;
  created_at:   string;
};

export type ARActivity = {
  id:               string;
  company_id:       string;
  ar_id:            string | null;
  client_id:        string | null;
  type:             ARActivityType;
  title:            string;
  description:      string | null;
  outcome:          string | null;
  next_action:      string | null;
  next_action_date: string | null;
  created_by:       string | null;
  created_at:       string;
};

export type ARStats = {
  total_balance:   number;
  total_overdue:   number;
  collected_month: number;
  count_pending:   number;
  count_overdue:   number;
  dso:             number;
  bucket_0_30:     number;
  bucket_31_60:    number;
  bucket_61_90:    number;
  bucket_90plus:   number;
  count_0_30:      number;
  count_31_60:     number;
  count_61_90:     number;
  count_90plus:    number;
};

export type ClientARSummary = {
  client_id:    string | null;
  client_name:  string;
  client_rfc:   string | null;
  total:        number;
  balance:      number;
  overdue:      number;
  count:        number;
  oldest_date:  string;
  currency:     string;
  risk:         "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type ARFilters = {
  search:      string;
  status:      ARStatus | "all";
  aging:       ARAging | "all";
  collection:  ARCollectionStatus | "all";
  currency:    string;
  from:        string;
  to:          string;
};

export const DEFAULT_AR_FILTERS: ARFilters = {
  search: "", status: "all", aging: "all", collection: "all", currency: "", from: "", to: "",
};

// ── PAYMENT FORMS ───────────────────────────────────────────

export const PAYMENT_FORMS_MAP: Record<string, string> = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electrónica",
  "04": "Tarjeta de crédito",
  "28": "Tarjeta de débito",
  "99": "Por definir",
};
