// ============================================================
// ÓRDENES DE COMPRA — Types v1
// ============================================================

export type POStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "partial"
  | "complete"
  | "cancelled";

export const PO_STATUS_CONFIG: Record<POStatus, {
  labelEs: string; labelEn: string;
  color: string; bg: string; border: string;
}> = {
  draft:            { labelEs: "Borrador",          labelEn: "Draft",            color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
  pending_approval: { labelEs: "Pend. aprobación",  labelEn: "Pending approval", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)"  },
  approved:         { labelEs: "Aprobada",           labelEn: "Approved",         color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  sent:             { labelEs: "Enviada",            labelEn: "Sent",             color: "var(--color-info-text)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  partial:          { labelEs: "Recepción parcial",  labelEn: "Partial",          color: "#a78bfa",                  bg: "#ede9fe",                 border: "#c4b5fd"                     },
  complete:         { labelEs: "Completada",         labelEn: "Complete",         color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  cancelled:        { labelEs: "Cancelada",          labelEn: "Cancelled",        color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
};

// ── Entidades ─────────────────────────────────────────────────

export type Supplier = {
  id:             string;
  company_id:     string;
  name:           string;
  type?:          string | null;
  contact?:       string | null;
  email?:         string | null;
  phone?:         string | null;
  address?:       string | null;
  city?:          string | null;
  state?:         string | null;
  country?:       string | null;
  website?:       string | null;
  tax_id?:        string | null;
  currency?:      string | null;
  payment_terms?: string | null;
  credit_days?:   number;
  is_active:      boolean;
  rating?:        number;
  notes?:         string | null;
  created_at:     string;
  updated_at?:    string;
};

export type PurchaseOrder = {
  id:               string;
  company_id:       string;
  supplier_id?:     string | null;
  po_number:        string;
  status:           POStatus;
  requisition_id?:  string | null;
  rfq_id?:          string | null;
  order_date?:      string | null;
  expected_date?:   string | null;
  currency:         string;
  subtotal:         number;
  discount_amount?: number;
  tax_rate?:        number;
  tax_amount:       number;
  total:            number;
  ship_to_address?: string | null;
  ship_to_contact?: string | null;
  payment_terms?:   string | null;
  delivery_terms?:  string | null;
  notes?:           string | null;
  internal_notes?:  string | null;
  approved_by?:     string | null;
  approved_at?:     string | null;
  sent_at?:         string | null;
  cancelled_at?:    string | null;
  cancel_reason?:   string | null;
  created_by?:      string | null;
  created_at:       string;
  updated_at?:      string;
  // Joins
  supplier?:        { name: string; email?: string | null; tax_id?: string | null; city?: string | null } | null;
  items?:           POItem[];
};

export type POItem = {
  id:                string;
  company_id:        string;
  po_id:             string;
  product_id?:       string | null;
  description:       string;
  quantity:          number;
  unit:              string;
  unit_price:        number;
  discount_pct?:     number;
  tax_rate?:         number;
  subtotal:          number;
  tax_amount:        number;
  total:             number;
  quantity_received?: number;
  quantity_pending?:  number;
  notes?:            string | null;
  sort_order:        number;
  created_at:        string;
};

// ── Stats ─────────────────────────────────────────────────────

export type POStats = {
  total:            number;
  draft:            number;
  pending_approval: number;
  approved:         number;
  sent:             number;
  partial:          number;
  complete:         number;
  total_value:      number;
  pending_value:    number;
};

// ── Payloads ──────────────────────────────────────────────────

export type CreatePOPayload = {
  supplier_id?:     string;
  order_date?:      string;
  expected_date?:   string;
  currency?:        string;
  discount_amount?: number;
  tax_rate?:        number;
  ship_to_address?: string;
  ship_to_contact?: string;
  payment_terms?:   string;
  delivery_terms?:  string;
  notes?:           string;
  internal_notes?:  string;
};

export type CreatePOItemPayload = {
  description:   string;
  quantity:      number;
  unit:          string;
  unit_price:    number;
  discount_pct?: number;
  tax_rate?:     number;
  notes?:        string;
  sort_order?:   number;
};

export type UpdatePOPayload = Partial<CreatePOPayload & {
  status:        POStatus;
  approved_by:   string;
  approved_at:   string;
  cancel_reason: string;
}>;

// ── Filtros ───────────────────────────────────────────────────

export type POFilters = {
  search:      string;
  status:      POStatus | "all";
  supplier_id: string;
  date_from:   string;
  date_to:     string;
};

export const DEFAULT_PO_FILTERS: POFilters = {
  search: "", status: "all", supplier_id: "", date_from: "", date_to: "",
};

// ── Catálogos ─────────────────────────────────────────────────

export const CURRENCIES = ["MXN", "USD", "EUR"];
export const UNITS = ["pza", "kg", "ton", "lt", "m", "m²", "caja", "bolsa", "pallet", "servicio", "hora"];
export const PAYMENT_TERMS_OPTIONS = ["Contado", "15 días", "30 días", "45 días", "60 días", "90 días"];
export const DELIVERY_TERMS_OPTIONS = ["EXW", "FOB", "CIF", "DAP", "DDP", "FCA", "Entrega en destino"];
