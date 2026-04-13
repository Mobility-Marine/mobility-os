// ============================================================
// CLIENTS TYPES v2 — GOD LEVEL
// Entidad maestra · Múltiples roles · Contactos · Facturación
// Direcciones estructuradas · CFDI 4.0 completo
// ============================================================

export type ClientStatus = "active" | "inactive" | "blocked";

export type ClientContactRole =
  | "general_manager"
  | "accounts_payable"
  | "invoice_reception"
  | "purchasing"
  | "commercial"
  | "operations"
  | "legal"
  | "general"
  | "other";

export const CONTACT_ROLE_CONFIG: Record<ClientContactRole, { labelKey: string; color: string }> = {
  general_manager:   { labelKey: "clients.roleGeneralManager",   color: "var(--color-brand-blue)"   },
  accounts_payable:  { labelKey: "clients.roleAccountsPayable",  color: "#a78bfa"                   },
  invoice_reception: { labelKey: "clients.roleInvoiceReception", color: "var(--color-warning-text)" },
  purchasing:        { labelKey: "clients.rolePurchasing",       color: "var(--color-success-text)" },
  commercial:        { labelKey: "clients.roleCommercial",       color: "var(--color-info-text)"    },
  operations:        { labelKey: "clients.roleOperations",       color: "#f59e0b"                   },
  legal:             { labelKey: "clients.roleLegal",            color: "var(--color-danger-text)"  },
  general:           { labelKey: "clients.roleGeneral",          color: "var(--color-text-muted)"   },
  other:             { labelKey: "clients.roleOther",            color: "var(--color-text-muted)"   },
};

export type ClientContact = {
  id:         string;
  company_id: string;
  client_id:  string;
  name:       string;
  role:       ClientContactRole;
  title?:     string;
  email?:     string;
  phone?:     string;
  is_primary: boolean;
  notes?:     string;
  created_at: string;
};

export type ClientDocumentType =
  | "contract"
  | "nda"
  | "power_of_attorney"
  | "tax_id"
  | "certificate"
  | "invoice"
  | "other";

export const DOCUMENT_TYPE_CONFIG: Record<ClientDocumentType, { labelKey: string; color: string }> = {
  contract:          { labelKey: "clients.docContract",         color: "var(--color-brand-blue)"   },
  nda:               { labelKey: "clients.docNDA",              color: "var(--color-warning-text)" },
  power_of_attorney: { labelKey: "clients.docPowerOfAttorney",  color: "#a78bfa"                   },
  tax_id:            { labelKey: "clients.docTaxId",            color: "var(--color-info-text)"    },
  certificate:       { labelKey: "clients.docCertificate",      color: "var(--color-success-text)" },
  invoice:           { labelKey: "clients.docInvoice",          color: "var(--color-text-muted)"   },
  other:             { labelKey: "clients.docOther",            color: "var(--color-text-muted)"   },
};

export type ClientDocument = {
  id:          string;
  client_id:   string;
  company_id:  string;
  name:        string;
  type:        ClientDocumentType;
  url?:        string;
  notes?:      string;
  expires_at?: string;
  created_at:  string;
  created_by?: string;
};

// ── DIRECCIONES ────────────────────────────────────────────

export type AddressType = "fiscal" | "delivery" | "warehouse" | "pickup" | "other";

export const ADDRESS_TYPE_CONFIG: Record<AddressType, { labelKey: string; color: string }> = {
  fiscal:    { labelKey: "clients.addrFiscal",    color: "var(--color-brand-blue)"   },
  delivery:  { labelKey: "clients.addrDelivery",  color: "var(--color-success-text)" },
  warehouse: { labelKey: "clients.addrWarehouse", color: "var(--color-warning-text)" },
  pickup:    { labelKey: "clients.addrPickup",    color: "var(--color-info-text)"    },
  other:     { labelKey: "clients.addrOther",     color: "var(--color-text-muted)"   },
};

export type ClientAddress = {
  id:            string;
  company_id:    string;
  client_id:     string;
  type:          AddressType;
  alias?:        string;
  street?:       string;
  ext_number?:   string;
  int_number?:   string;
  neighborhood?: string;
  city?:         string;
  state?:        string;
  zip_code:      string;
  country?:      string;
  is_default:    boolean;
  notes?:        string;
  latitude?:     number;
  longitude?:    number;
  created_at:    string;
};

// ── CLIENT ────────────────────────────────────────────────

export type Client = {
  id:          string;
  company_id:  string;
  name:        string;
  legal_name?: string;
  rfc?:        string;
  email?:      string;
  phone?:      string;
  website?:    string;
  notes?:      string;
  // Dirección general
  address?:    string;
  city?:       string;
  zip_code?:   string;
  country?:    string;
  // Roles
  is_customer:  boolean;
  is_supplier:  boolean;
  is_active:    boolean;
  // Fiscal / CFDI 4.0
  tax_regime?:      string;
  cfdi_use?:        string;
  payment_method?:  string;
  payment_form?:    string;   // PUE o PPD
  payment_terms?:   string;
  credit_limit?:    number;
  billing_email?:   string;
  // Dirección fiscal estructurada
  billing_street?:       string;
  billing_ext_number?:   string;
  billing_int_number?:   string;
  billing_neighborhood?: string;
  billing_city?:         string;
  billing_state?:        string;
  billing_country?:      string;
  // Timestamps
  created_at:   string;
  updated_at?:  string;
  // Conexiones
  crm_account_id?: string;
  // Computed
  stats?:      ClientStats;
  documents?:  ClientDocument[];
  contacts?:   ClientContact[];
  addresses?:  ClientAddress[];
};

export type ClientStats = {
  opportunities: number;
  openOrders:    number;
  totalRevenue:  number;
  openBalance:   number;
  lastActivity?: string;
  riskLevel:     "LOW" | "MEDIUM" | "HIGH";
};

export type ClientFilters = {
  search:     string;
  role:       "all" | "customer" | "supplier" | "both";
  onlyActive: boolean;
};

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  search: "", role: "all", onlyActive: true,
};

export type CreateClientPayload = {
  name:              string;
  legal_name?:       string;
  rfc?:              string;
  email?:            string;
  phone?:            string;
  website?:          string;
  city?:             string;
  zip_code?:         string;
  country?:          string;
  notes?:            string;
  is_customer:       boolean;
  is_supplier:       boolean;
  // Fiscal
  tax_regime?:       string;
  cfdi_use?:         string;
  payment_method?:   string;
  payment_form?:     string;
  payment_terms?:    string;
  credit_limit?:     number;
  billing_email?:    string;
  // Dirección fiscal
  billing_street?:       string;
  billing_ext_number?:   string;
  billing_int_number?:   string;
  billing_neighborhood?: string;
  billing_city?:         string;
  billing_state?:        string;
  billing_country?:      string;
};

export type ClientConnection = {
  type:    "prospect" | "opportunity" | "order" | "invoice";
  id:      string;
  label:   string;
  status?: string;
  value?:  number;
  date?:   string;
};

// ── CATÁLOGOS FISCALES MÉXICO (SAT) ───────────────────────

export const TAX_REGIMES = [
  { value: "601", label: "General de Ley Personas Morales" },
  { value: "603", label: "Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "Sueldos y Salarios" },
  { value: "606", label: "Arrendamiento" },
  { value: "607", label: "Régimen de Enajenación o Adquisición de Bienes" },
  { value: "608", label: "Demás Ingresos" },
  { value: "612", label: "Personas Físicas con Actividades Empresariales" },
  { value: "616", label: "Sin obligaciones fiscales" },
  { value: "621", label: "Incorporación Fiscal" },
  { value: "625", label: "Régimen de las Actividades Empresariales con Actividad" },
  { value: "626", label: "Régimen Simplificado de Confianza (RESICO)" },
];

export const CFDI_USES = [
  { value: "G01",  label: "Adquisición de mercancias" },
  { value: "G02",  label: "Devoluciones, descuentos o bonificaciones" },
  { value: "G03",  label: "Gastos en general" },
  { value: "I01",  label: "Construcciones" },
  { value: "I02",  label: "Mobiliario y equipo de oficina" },
  { value: "I03",  label: "Equipo de transporte" },
  { value: "I04",  label: "Equipo de cómputo y accesorios" },
  { value: "I06",  label: "Comunicaciones telefónicas" },
  { value: "I08",  label: "Otra maquinaria y equipo" },
  { value: "S01",  label: "Sin efectos fiscales" },
  { value: "CP01", label: "Pagos" },
  { value: "D01",  label: "Honorarios médicos, dentales y gastos hospitalarios" },
  { value: "D10",  label: "Pagos por servicios educativos" },
];

export const PAYMENT_METHODS = [
  { value: "01", label: "Efectivo" },
  { value: "02", label: "Cheque nominativo" },
  { value: "03", label: "Transferencia electrónica de fondos" },
  { value: "04", label: "Tarjeta de crédito" },
  { value: "28", label: "Tarjeta de débito" },
  { value: "99", label: "Por definir" },
];

// PUE / PPD — obligatorio CFDI 4.0
export const PAYMENT_FORMS = [
  { value: "PUE", label: "PUE — Pago en Una sola Exhibición" },
  { value: "PPD", label: "PPD — Pago en Parcialidades o Diferido" },
];
