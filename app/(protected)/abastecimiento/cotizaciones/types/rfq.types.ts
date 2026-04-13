export type RFQStatus =
  | "draft" | "sent" | "responses_received" | "evaluated" | "awarded" | "cancelled";

export const RFQ_STATUS_CONFIG: Record<RFQStatus, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  draft:              { labelKey: "procurement.rfqDraft",        color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
  sent:               { labelKey: "procurement.rfqSent",         color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  responses_received: { labelKey: "procurement.rfqResponsesIn",  color: "#7c3aed",                   bg: "#f3e8ff",                 border: "#d8b4fe"                     },
  evaluated:          { labelKey: "procurement.rfqEvaluated",    color: "#d97706",                   bg: "#fef3c7",                 border: "#fcd34d"                     },
  awarded:            { labelKey: "procurement.rfqAwarded",      color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  cancelled:          { labelKey: "procurement.rfqCancelled2",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
};

export type RFQItem = {
  id:             string;
  company_id:     string;
  rfq_id:         string;
  product_id?:    string | null;
  description:    string;
  quantity:       number;
  unit:           string;
  notes?:         string | null;
  sort_order:     number;
  created_at:     string;
  product?:       { name: string; sku: string } | null;
};

export type RFQResponse = {
  id:             string;
  company_id:     string;
  rfq_id:         string;
  supplier_id:    string;
  status:         "pending" | "received" | "awarded" | "not_awarded";
  delivery_days?: number | null;
  payment_terms?: string | null;
  validity_days?: number | null;
  notes?:         string | null;
  received_at?:   string | null;
  created_at:     string;
  supplier?:      { name: string } | null;
  items?:         RFQResponseItem[];
};

export type RFQResponseItem = {
  id:            string;
  company_id:    string;
  response_id:   string;
  rfq_item_id:   string;
  unit_price:    number;
  currency:      string;
  total_price?:  number;
  notes?:        string | null;
  created_at:    string;
};

export type RFQ = {
  id:               string;
  company_id:       string;
  requisition_id?:  string | null;
  rfq_number?:      string | null;
  title:            string;
  status:           RFQStatus;
  deadline?:        string | null;
  currency:         string;
  notes?:           string | null;
  created_by?:      string | null;
  created_at:       string;
  updated_at?:      string | null;
  items?:           RFQItem[];
  responses?:       RFQResponse[];
};

export type RFQFilters = {
  search: string;
  status: RFQStatus | "all";
};

export const DEFAULT_RFQ_FILTERS: RFQFilters = {
  search: "", status: "all",
};

// Comparativo: para cada ítem, precio de cada proveedor
export type ComparativeRow = {
  item:       RFQItem;
  prices:     Record<string, { price: number; currency: string; responseId: string } | null>;
  bestPrice:  number | null;
  bestSupplierId: string | null;
};

export function buildComparative(rfq: RFQ): ComparativeRow[] {
  const items     = rfq.items     ?? [];
  const responses = rfq.responses ?? [];

  return items.map((item) => {
    const prices: ComparativeRow["prices"] = {};
    let bestPrice: number | null = null;
    let bestSupplierId: string | null = null;

    responses.forEach((resp) => {
      const ri = resp.items?.find((i) => i.rfq_item_id === item.id);
      if (ri) {
        prices[resp.supplier_id] = { price: ri.unit_price, currency: ri.currency, responseId: resp.id };
        if (bestPrice === null || ri.unit_price < bestPrice) {
          bestPrice = ri.unit_price;
          bestSupplierId = resp.supplier_id;
        }
      } else {
        prices[resp.supplier_id] = null;
      }
    });

    return { item, prices, bestPrice, bestSupplierId };
  });
}
