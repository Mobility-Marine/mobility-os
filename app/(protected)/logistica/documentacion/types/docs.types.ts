export type DocCategory =
  | "commercial_invoice" | "packing_list" | "bill_of_lading" | "airway_bill"
  | "pedimento" | "doda" | "certificate_origin" | "phytosanitary" | "health_cert"
  | "insurance" | "customs_power" | "carta_porte" | "service_order"
  | "delivery_note" | "other";

export type DocStatus = "pending" | "received" | "validated" | "rejected";

export const DOC_CATEGORY_CONFIG: Record<DocCategory, { labelKey: string; color: string; bg: string; border: string }> = {
  commercial_invoice: { labelKey: "logistics.catCommercialInvoice", color: "#2563eb",  bg: "#dbeafe",  border: "#93c5fd" },
  packing_list:       { labelKey: "logistics.catPackingList",       color: "#7c3aed",  bg: "#ede9fe",  border: "#c4b5fd" },
  bill_of_lading:     { labelKey: "logistics.catBillOfLading",      color: "#0891b2",  bg: "#cffafe",  border: "#67e8f9" },
  airway_bill:        { labelKey: "logistics.catAirwayBill",         color: "#0891b2",  bg: "#cffafe",  border: "#67e8f9" },
  pedimento:          { labelKey: "logistics.catPedimento",          color: "#d97706",  bg: "#fef3c7",  border: "#fcd34d" },
  doda:               { labelKey: "logistics.catDoda",               color: "#d97706",  bg: "#fef3c7",  border: "#fcd34d" },
  certificate_origin: { labelKey: "logistics.catCertificateOrigin",  color: "#059669",  bg: "#d1fae5",  border: "#6ee7b7" },
  phytosanitary:      { labelKey: "logistics.catPhytosanitary",      color: "#059669",  bg: "#d1fae5",  border: "#6ee7b7" },
  health_cert:        { labelKey: "logistics.catHealthCert",         color: "#059669",  bg: "#d1fae5",  border: "#6ee7b7" },
  insurance:          { labelKey: "logistics.catInsurance",          color: "#dc2626",  bg: "#fee2e2",  border: "#fca5a5" },
  customs_power:      { labelKey: "logistics.catCustomsPower",       color: "#9333ea",  bg: "#f3e8ff",  border: "#d8b4fe" },
  carta_porte:        { labelKey: "logistics.catCartaPorte",         color: "#0f766e",  bg: "#ccfbf1",  border: "#5eead4" },
  service_order:      { labelKey: "logistics.catServiceOrder",       color: "#475569",  bg: "#f1f5f9",  border: "#cbd5e1" },
  delivery_note:      { labelKey: "logistics.catDeliveryNote",       color: "#475569",  bg: "#f1f5f9",  border: "#cbd5e1" },
  other:              { labelKey: "logistics.catOther2",             color: "#64748b",  bg: "#f8fafc",  border: "#e2e8f0" },
};

export const DOC_STATUS_CONFIG: Record<DocStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  pending:   { labelKey: "logistics.statusPending2",  color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"  },
  received:  { labelKey: "logistics.statusReceived",  color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"   },
  validated: { labelKey: "logistics.statusValidated", color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  rejected:  { labelKey: "logistics.statusRejected2", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)"  },
};

export type ShipmentDocument = {
  id:           string;
  company_id:   string;
  shipment_id?: string | null;
  client_id?:   string | null;
  category:     DocCategory;
  name:         string;
  file_url?:    string | null;
  file_size?:   number | null;
  mime_type?:   string | null;
  version:      number;
  status:       DocStatus;
  required:     boolean;
  expiry_date?: string | null;
  notes?:       string | null;
  uploaded_by?: string | null;
  created_at:   string;
  updated_at?:  string | null;
  // joined
  shipment?:    { reference: string; client?: { name: string } | null } | null;
  client?:      { name: string } | null;
};

export type DocFilters = {
  search:    string;
  category:  DocCategory | "all";
  status:    DocStatus | "all";
  shipment:  string | "all";
};

export const DEFAULT_DOC_FILTERS: DocFilters = {
  search: "", category: "all", status: "all", shipment: "all",
};
