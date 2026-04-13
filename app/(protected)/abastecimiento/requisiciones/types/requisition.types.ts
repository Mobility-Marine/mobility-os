export type RequisitionStatus =
  | "draft" | "pending_approval" | "approved" | "rejected"
  | "in_quotation" | "ordered" | "received" | "cancelled";

export type RequisitionPriority = "low" | "normal" | "high" | "urgent";

export const REQUISITION_STATUS_CONFIG: Record<RequisitionStatus, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  draft:            { labelKey: "procurement.reqDraft",           color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
  pending_approval: { labelKey: "procurement.reqPendingApproval", color: "#d97706",                   bg: "#fef3c7",                 border: "#fcd34d"                     },
  approved:         { labelKey: "procurement.reqApproved",        color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  rejected:         { labelKey: "procurement.reqRejected",        color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
  in_quotation:     { labelKey: "procurement.reqInQuotation",     color: "#7c3aed",                   bg: "#f3e8ff",                 border: "#d8b4fe"                     },
  ordered:          { labelKey: "procurement.reqOrdered",         color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  received:         { labelKey: "procurement.reqReceived",        color: "#0f766e",                   bg: "#ccfbf1",                 border: "#5eead4"                     },
  cancelled:        { labelKey: "procurement.reqCancelled",       color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
};

export const PRIORITY_CONFIG: Record<RequisitionPriority, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  low:    { labelKey: "procurement.priorityLow2",    color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)", border: "var(--color-border-faint)" },
  normal: { labelKey: "procurement.priorityNormal2", color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",   border: "var(--color-info-border)"  },
  high:   { labelKey: "procurement.priorityHigh2",   color: "#d97706",                   bg: "#fef3c7",                border: "#fcd34d"                   },
  urgent: { labelKey: "procurement.priorityUrgent2", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)", border: "var(--color-danger-border)" },
};

export type RequisitionItem = {
  id:              string;
  company_id:      string;
  requisition_id:  string;
  product_id?:     string | null;
  description:     string;
  quantity:        number;
  unit:            string;
  estimated_price?: number | null;
  currency:        string;
  notes?:          string | null;
  sort_order:      number;
  created_at:      string;
  product?:        { name: string; sku: string } | null;
};

export type Requisition = {
  id:                 string;
  company_id:         string;
  requisition_number?:string | null;
  title:              string;
  status:             RequisitionStatus;
  priority:           RequisitionPriority;
  needed_by?:         string | null;
  department?:        string | null;
  justification?:     string | null;
  requires_approval:  boolean;
  approval_threshold?:number | null;
  approved_by?:       string | null;
  approved_at?:       string | null;
  rejected_by?:       string | null;
  rejected_at?:       string | null;
  rejection_reason?:  string | null;
  auto_generated:     boolean;
  source_module?:     string | null;
  source_id?:         string | null;
  requested_by?:      string | null;
  created_at:         string;
  updated_at?:        string | null;
  items?:             RequisitionItem[];
};

export type RequisitionFilters = {
  search:   string;
  status:   RequisitionStatus | "all";
  priority: RequisitionPriority | "all";
};

export const DEFAULT_REQUISITION_FILTERS: RequisitionFilters = {
  search: "", status: "all", priority: "all",
};

export function calcRequisitionTotal(items: RequisitionItem[]): number {
  return items.reduce((sum, i) => sum + (i.estimated_price ?? 0) * i.quantity, 0);
}
