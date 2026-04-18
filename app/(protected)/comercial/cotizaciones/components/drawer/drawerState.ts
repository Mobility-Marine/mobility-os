import type {
  ServiceSubtype, QuotationLanguage, GeneralInfo,
  CreateServicePayload,
} from "../../types/quotations.types";

export interface BillingConceptDraft {
  tempId:      string;
  product_id?: string;
  description: string;
  currency:    string;
  lines:       Omit<CreateServicePayload, "quotation_id">[];
}

export interface ConfigState {
  currency:        string;
  discount_amount: string;
  tax_rate:        string;
  valid_until:     string;
  language:        QuotationLanguage;
  notes:           string;
  terms:           string;
}

export interface ClientState {
  selectedClient:  any | null;
  manualClient:    { name: string; email: string; rfc: string };
  useManual:       boolean;
  contactId:       string;
  contactName:     string;
  contactEmail:    string;
  contactTitle:    string;
}

export const EMPTY_CONFIG = (): ConfigState => ({
  currency: "MXN", discount_amount: "0", tax_rate: "16",
  valid_until: "", language: "es", notes: "", terms: "",
});

export const EMPTY_CLIENT = (): ClientState => ({
  selectedClient: null,
  manualClient: { name: "", email: "", rfc: "" },
  useManual: false,
  contactId: "", contactName: "", contactEmail: "", contactTitle: "",
});

// Steps dinámicos según tipo
export type DrawerStep =
  | "type"
  | "subtype"
  | "client"
  | "general"
  | "conceptos"
  | "config"
  | "preview"
  | "actions";

export function getSteps(quotType: string, hasSubtype: boolean): DrawerStep[] {
  if (quotType === "products") {
    return ["type", "subtype", "client", "general", "conceptos", "config", "preview", "actions"];
  }
  return ["type", "client", "conceptos", "config", "preview", "actions"];
}

export const STEP_LABELS_ES: Record<DrawerStep, string> = {
  type:      "Tipo",
  subtype:   "Subtipo",
  client:    "Cliente",
  general:   "Información",
  conceptos: "Conceptos",
  config:    "Configuración",
  preview:   "Resumen",
  actions:   "Listo",
};

export const STEP_LABELS_EN: Record<DrawerStep, string> = {
  type:      "Type",
  subtype:   "Subtype",
  client:    "Client",
  general:   "Information",
  conceptos: "Concepts",
  config:    "Configuration",
  preview:   "Summary",
  actions:   "Done",
};
