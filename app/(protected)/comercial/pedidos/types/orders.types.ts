// ============================================================
// ORDERS TYPES v1 — GOD LEVEL
// Flujo: Cotización aceptada → Pedido → Factura
// ============================================================

export type OrderStatus =
  | "pending" | "confirmed" | "in_preparation"
  | "shipped" | "delivered" | "cancelled";

export type OrderPriority = "low" | "normal" | "high" | "urgent";
export type POTemplate    = "elegante" | "moderna" | "corporativa";

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  labelKey: string; color: string; bg: string; border: string; step: number;
}> = {
  pending:        { labelKey: "orders.statusPending",     color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)", step: 1 },
  confirmed:      { labelKey: "orders.statusConfirmed",   color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)",  step: 2 },
  in_preparation: { labelKey: "orders.statusPreparation", color: "#a78bfa",                   bg: "#a78bfa15",               border: "#a78bfa40",                 step: 3 },
  shipped:        { labelKey: "orders.statusShipped",     color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)",step: 4 },
  delivered:      { labelKey: "orders.statusDelivered",   color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)",step: 5 },
  cancelled:      { labelKey: "orders.statusCancelled",   color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)", step: 0 },
};

export const PRIORITY_CONFIG: Record<OrderPriority, { labelKey: string; color: string }> = {
  low:    { labelKey: "orders.priorityLow",    color: "var(--color-text-muted)"   },
  normal: { labelKey: "orders.priorityNormal", color: "var(--color-brand-blue)"   },
  high:   { labelKey: "orders.priorityHigh",   color: "var(--color-warning-text)" },
  urgent: { labelKey: "orders.priorityUrgent", color: "var(--color-danger-text)"  },
};

export type Order = {
  id:               string;
  company_id:       string;
  order_number:     string;
  quotation_id?:    string | null;
  client_id?:       string | null;
  crm_account_id?:  string | null;
  status:           OrderStatus;
  priority:         OrderPriority;
  currency:         string;
  subtotal:         number;
  discount_amount:  number;
  tax_rate:         number;
  tax_amount:       number;
  total:            number;
  // Entrega
  delivery_address?: string | null;
  delivery_city?:    string | null;
  delivery_state?:   string | null;
  delivery_country?: string | null;
  delivery_date?:    string | null;
  delivered_at?:     string | null;
  // Facturación
  invoice_id?:       string | null;
  invoiced_at?:      string | null;
  // Notas
  notes?:            string | null;
  internal_notes?:   string | null;
  // Meta
  confirmed_at?:     string | null;
  shipped_at?:       string | null;
  created_by?:       string | null;
  created_at:        string;
  updated_at?:       string | null;
  // Joined
  items?:            OrderItem[];
  client?:           { name: string; email?: string; rfc?: string } | null;
  quotation?:        { quote_number: string } | null;
};

export type OrderItem = {
  id:                  string;
  company_id:          string;
  order_id:            string;
  product_id?:         string | null;
  quotation_item_id?:  string | null;
  sort_order:          number;
  sku?:                string | null;
  description:         string;
  details?:            string | null;
  quantity:            number;
  quantity_delivered:  number;
  unit:                string;
  unit_price:          number;
  discount_pct:        number;
  subtotal:            number;
  created_at:          string;
};

export type OrderFilters = {
  search:   string;
  status:   OrderStatus | "all" | "active";
  priority: OrderPriority | "all";
};

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  search: "", status: "all", priority: "all",
};

export type OrderKPIs = {
  total:          number;
  pending:        number;
  active:         number;
  delivered:      number;
  cancelled:      number;
  totalValue:     number;
  pendingValue:   number;
  deliveredValue: number;
};

// Next status transitions
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:        "confirmed",
  confirmed:      "in_preparation",
  in_preparation: "shipped",
  shipped:        "delivered",
};

export const STATUS_FLOW: OrderStatus[] = [
  "pending", "confirmed", "in_preparation", "shipped", "delivered",
];
