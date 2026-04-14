// ============================================================
// RECEPCIONES DE COMPRAS — Types v1
// Conectado a: purchase_orders, purchase_order_items, suppliers
// ============================================================

export type ReceptionStatus =
  | "draft"
  | "in_progress"
  | "complete"
  | "partial"
  | "rejected"
  | "cancelled";

export type QCStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "partial"
  | "quarantine";

export type ItemCondition =
  | "good"
  | "damaged"
  | "wrong_item"
  | "incomplete";

// ── Status configs ────────────────────────────────────────────

export const RECEPTION_STATUS_CONFIG: Record<ReceptionStatus, {
  labelEs: string; labelEn: string;
  color: string; bg: string; border: string;
}> = {
  draft:       { labelEs: "Borrador",    labelEn: "Draft",       color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  in_progress: { labelEs: "En proceso",  labelEn: "In Progress", color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"   },
  complete:    { labelEs: "Completada",  labelEn: "Complete",    color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  partial:     { labelEs: "Parcial",     labelEn: "Partial",     color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  rejected:    { labelEs: "Rechazada",   labelEn: "Rejected",    color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  cancelled:   { labelEs: "Cancelada",   labelEn: "Cancelled",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
};

export const QC_STATUS_CONFIG: Record<QCStatus, {
  labelEs: string; labelEn: string;
  color: string; bg: string; border: string;
}> = {
  pending:    { labelEs: "Pendiente",   labelEn: "Pending",    color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  approved:   { labelEs: "Aprobado",    labelEn: "Approved",   color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  rejected:   { labelEs: "Rechazado",   labelEn: "Rejected",   color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  partial:    { labelEs: "Parcial",     labelEn: "Partial",    color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  quarantine: { labelEs: "Cuarentena",  labelEn: "Quarantine", color: "#a78bfa",                  bg: "#ede9fe",                 border: "#c4b5fd"                     },
};

export const ITEM_CONDITION_CONFIG: Record<ItemCondition, {
  labelEs: string; labelEn: string; color: string;
}> = {
  good:       { labelEs: "Bueno",          labelEn: "Good",        color: "var(--color-success-text)" },
  damaged:    { labelEs: "Dañado",         labelEn: "Damaged",     color: "var(--color-danger-text)"  },
  wrong_item: { labelEs: "Artículo wrong", labelEn: "Wrong Item",  color: "var(--color-warning-text)" },
  incomplete: { labelEs: "Incompleto",     labelEn: "Incomplete",  color: "var(--color-warning-text)" },
};

// ── Main types ────────────────────────────────────────────────

export type Reception = {
  id:                 string;
  company_id:         string;
  reception_number:   string;
  po_id?:             string | null;
  supplier_id?:       string | null;
  status:             ReceptionStatus;
  received_date?:     string | null;
  warehouse?:         string | null;
  received_by?:       string | null;
  // Documentos proveedor
  supplier_invoice?:  string | null;
  supplier_remission?: string | null;
  supplier_ref?:      string | null;
  // QC global
  qc_status:          QCStatus;
  qc_notes?:          string | null;
  qc_reviewed_by?:    string | null;
  qc_reviewed_at?:    string | null;
  // Diferencias
  has_discrepancies:  boolean;
  discrepancy_notes?: string | null;
  notes?:             string | null;
  internal_notes?:    string | null;
  created_by?:        string | null;
  created_at:         string;
  updated_at?:        string;
  // Joins
  items?:             ReceptionItem[];
  purchase_order?:    { po_number: string; expected_date?: string | null } | null;
  supplier?:          { name: string; email?: string | null } | null;
};

export type ReceptionItem = {
  id:                  string;
  company_id:          string;
  reception_id:        string;
  po_item_id?:         string | null;
  product_id?:         string | null;
  sort_order:          number;
  description:         string;
  sku?:                string | null;
  unit:                string;
  quantity_expected:   number;
  quantity_received:   number;
  quantity_accepted:   number;
  quantity_rejected:   number;
  quantity_quarantine: number;
  qc_status:           QCStatus;
  qc_notes?:           string | null;
  condition:           ItemCondition;
  unit_price:          number;
  notes?:              string | null;
  created_at:          string;
};

// ── Payloads ──────────────────────────────────────────────────

export type CreateReceptionPayload = {
  po_id?:              string;
  supplier_id?:        string;
  received_date?:      string;
  warehouse?:          string;
  supplier_invoice?:   string;
  supplier_remission?: string;
  supplier_ref?:       string;
  notes?:              string;
};

export type UpdateReceptionPayload = Partial<{
  status:              ReceptionStatus;
  received_date:       string;
  warehouse:           string;
  supplier_invoice:    string;
  supplier_remission:  string;
  supplier_ref:        string;
  qc_status:           QCStatus;
  qc_notes:            string;
  has_discrepancies:   boolean;
  discrepancy_notes:   string;
  notes:               string;
  internal_notes:      string;
}>;

export type UpdateReceptionItemPayload = Partial<{
  quantity_received:   number;
  quantity_accepted:   number;
  quantity_rejected:   number;
  quantity_quarantine: number;
  qc_status:           QCStatus;
  qc_notes:            string;
  condition:           ItemCondition;
  notes:               string;
}>;

// ── Filters ───────────────────────────────────────────────────

export type ReceptionFilters = {
  search:  string;
  status:  ReceptionStatus | "all";
  qc:      QCStatus | "all";
};

export const DEFAULT_RECEPTION_FILTERS: ReceptionFilters = {
  search: "", status: "all", qc: "all",
};

// ── PO para el drawer ─────────────────────────────────────────

export type POForReception = {
  id:            string;
  po_number:     string;
  supplier_id?:  string | null;
  expected_date?: string | null;
  currency:      string;
  total:         number;
  supplier?:     { name: string } | null;
  items?:        POItemForReception[];
};

export type POItemForReception = {
  id:               string;
  description:      string;
  sku?:             string | null;
  unit:             string;
  quantity:         number;
  quantity_received: number;
  quantity_pending: number;
  unit_price:       number;
};
