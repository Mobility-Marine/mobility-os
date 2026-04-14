export type ComprasDashboard = {
  // Requisiciones
  req_total:           number;
  req_pending:         number;
  req_approved:        number;
  // RFQs
  rfq_total:           number;
  rfq_open:            number;
  // OCs
  po_total:            number;
  po_pending_approval: number;
  po_active:           number;
  po_overdue:          number;
  po_value_active:     number;
  po_value_month:      number;
  // Recepciones
  rec_pending:         number;
  rec_discrepancies:   number;
  // Inventario
  stock_alerts:        number;
  // Proveedores
  suppliers_active:    number;
};

export type ComprasAlert = {
  id:       string;
  type:     "overdue_po" | "pending_approval" | "stock_critical" | "discrepancy" | "urgent_req";
  priority: "high" | "medium" | "low";
  title:    string;
  subtitle: string;
  path:     string;
  date?:    string;
};

export type ComprasActivity = {
  id:          string;
  type:        "po_created" | "po_approved" | "po_sent" | "reception_complete" | "req_approved" | "rfq_awarded";
  title:       string;
  subtitle:    string;
  date:        string;
  amount?:     number;
  currency?:   string;
  status?:     string;
};

export type TopSupplier = {
  id:          string;
  name:        string;
  po_count:    number;
  total_value: number;
  currency:    string;
  last_po:     string | null;
};

export const DEFAULT_DASHBOARD: ComprasDashboard = {
  req_total: 0, req_pending: 0, req_approved: 0,
  rfq_total: 0, rfq_open: 0,
  po_total: 0, po_pending_approval: 0, po_active: 0, po_overdue: 0,
  po_value_active: 0, po_value_month: 0,
  rec_pending: 0, rec_discrepancies: 0,
  stock_alerts: 0, suppliers_active: 0,
};
