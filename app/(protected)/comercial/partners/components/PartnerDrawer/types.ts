// ════════════════════════════════════════════════════════════════════════
// PARTNER DRAWER — TIPOS · NIVEL ERP (SAP/Oracle/Compac/NetSuite/Odoo)
// ════════════════════════════════════════════════════════════════════════
// Drawer unificado de Business Partners.
// Cada partner puede ser CLIENTE, PROVEEDOR y/o LOGÍSTICO simultáneamente.
// Wizard multi-paso con 10 tabs y validación inline real-time.
// ════════════════════════════════════════════════════════════════════════

// ── Banderas de rol del partner (combinables) ────────────────────────
export type PartnerRoleFlag = "is_customer" | "is_supplier" | "is_logistics_provider";

// ── Tabs del wizard ───────────────────────────────────────────────────
export type PartnerTab =
  | "identity"
  | "fiscal"
  | "contacts"
  | "addresses"
  | "commercial"
  | "banking"
  | "documents"
  | "evaluation"
  | "logistics"
  | "summary";

// ── Validación SAT (datos fiscales: RFC + régimen + CP coinciden) ────
export type ValidationSATStatus = "not_verified" | "valid" | "invalid";

// ── Validación 69-B EFOS (manual MVP, automático futuro) ─────────────
export type Validation69BStatus =
  | "not_verified"
  | "clean"
  | "alleged"
  | "definitive"
  | "detracted"
  | "favorable";

// ── INCOTERMS soportados ──────────────────────────────────────────────
export type Incoterm =
  | "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP"
  | "FAS" | "FOB" | "CFR" | "CIF";

// ── PARTNER (raw del BD) ──────────────────────────────────────────────
// Todos los campos opcionales para soportar borradores (drawer).
// Solo `name` y los flags de rol son obligatorios al guardar.
export type Partner = {
  // Identidad
  id?:                          string;
  company_id?:                  string;
  name:                         string;
  legal_name?:                  string;
  rfc?:                         string;
  industry?:                    string;
  website?:                     string;
  notes?:                       string;

  // Contacto principal (legacy compat — el real va en partner_contacts)
  contact?:                     string;
  email?:                       string;
  phone?:                       string;

  // Dirección general
  address?:                     string;
  city?:                        string;
  state?:                       string;
  zip_code?:                    string;
  country?:                     string;

  // Roles (flags)
  is_customer:                  boolean;
  is_supplier:                  boolean;
  is_logistics_provider:        boolean;
  is_active:                    boolean;
  roles?:                       string[];

  // Fiscal CFDI 4.0
  tax_regime?:                  string;
  cfdi_use?:                    string;
  payment_method?:              string;
  payment_form?:                string;

  // Dirección fiscal estructurada
  billing_email?:               string;
  billing_address?:             string;
  billing_street?:              string;
  billing_ext_number?:          string;
  billing_int_number?:          string;
  billing_neighborhood?:        string;
  billing_city?:                string;
  billing_state?:               string;
  billing_country?:             string;

  // Comerciales
  payment_terms?:               string;
  credit_limit?:                number;
  credit_days?:                 number;
  currency?:                    string;
  rating?:                      number;
  discount_default?:            number;
  commercial_notes?:            string;

  // Validación SAT (Facturapi)
  validation_sat_status?:       ValidationSATStatus;
  validation_sat_date?:         string;
  validation_sat_error?:        string;
  facturapi_customer_id?:       string;

  // Validación 69-B EFOS
  validation_69b_status?:       Validation69BStatus;
  validation_69b_date?:         string;
  validation_69b_notes?:        string;
  validation_69b_evidence_url?: string;

  // Logística específica
  logistics_provider_type?:     string;
  scac_code?:                   string;
  coverage_routes?:             string;
  services_offered?:            string;
  default_incoterm?:            Incoterm;
  transport_modes?:             string[];
  fleet_size?:                  number;
  has_customs_broker_license?:  boolean;
  customs_broker_license?:      string;

  // Timestamps
  created_at?:                  string;
  updated_at?:                  string;
  created_by?:                  string;
};

// ── Payloads para crear/actualizar ───────────────────────────────────
export type CreatePartnerPayload = Omit<Partner, "id" | "created_at" | "updated_at" | "created_by">;
export type UpdatePartnerPayload = Partial<CreatePartnerPayload>;

// ── Estado de validación por tab ─────────────────────────────────────
export type TabValidationState = {
  isValid:       boolean;
  isComplete:    boolean;
  errorMessage?: string;
};

// ── Configuración declarativa de cada tab ────────────────────────────
export type TabConfig = {
  id:        PartnerTab;
  label:     string;
  icon:      string;
  required:  boolean;
  showWhen?: (p: Partial<Partner>) => boolean;
};

// ── Roles de contacto (catálogo genérico ERP) ────────────────────────
export type PartnerContactRole =
  | "general_manager"
  | "accounts_payable"
  | "invoice_reception"
  | "purchasing"
  | "commercial"
  | "operations"
  | "legal"
  | "logistics"
  | "general"
  | "other";

// ── Etiquetas en español de los roles de contacto ────────────────────
export const CONTACT_ROLE_LABELS: Record<PartnerContactRole, string> = {
  general_manager:    "Director / Gerente general",
  accounts_payable:   "Cuentas por pagar",
  invoice_reception:  "Recepción de facturas",
  purchasing:         "Compras",
  commercial:         "Comercial / Ventas",
  operations:         "Operaciones",
  legal:              "Legal",
  logistics:          "Logística",
  general:            "Contacto general",
  other:              "Otro",
};

// ── PARTNER CONTACT (refleja tabla client_contacts → partner_contacts) ─
export type PartnerContact = {
  id?:           string;       // Undefined cuando es nuevo en memoria
  company_id?:   string;
  client_id?:    string;       // FK a business_partners.id
  name:          string;       // Required
  role?:         PartnerContactRole | string;
  title?:        string;
  email?:        string;
  phone?:        string;
  is_primary?:   boolean;
  notes?:        string;
  created_at?:   string;
  created_by?:   string;
  // Campo solo-frontend para tracking en estado local:
  _localId?:     string;       // UUID local (modo CREATE, antes de persistir)
  _isDirty?:     boolean;      // Marca si ha sido modificado
  _isDeleted?:   boolean;      // Marca si fue eliminado (para diff en EDIT)
};

// ── Tipos de dirección ────────────────────────────────────────────────
export type AddressType = "billing" | "shipping" | "warehouse" | "other";

// ── Etiquetas en español de los tipos de dirección ───────────────────
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  billing:    "Fiscal / Facturación",
  shipping:   "Envío / Entrega",
  warehouse:  "Almacén",
  other:      "Otra",
};

// ── PARTNER ADDRESS (refleja tabla client_addresses → partner_addresses)
export type PartnerAddress = {
  id?:            string;       // Undefined cuando es nuevo en memoria
  company_id?:    string;
  client_id?:     string;       // FK a business_partners.id
  type:           AddressType;  // Required
  alias?:         string;
  street?:        string;
  ext_number?:    string;
  int_number?:    string;
  neighborhood?:  string;
  city?:          string;
  state?:         string;
  zip_code:       string;       // Required (NOT NULL en BD)
  country?:       string;
  is_default?:    boolean;
  notes?:         string;
  latitude?:      number;
  longitude?:     number;
  created_at?:    string;
  created_by?:    string;
  // Campo solo-frontend para tracking en estado local:
  _localId?:      string;
  _isDirty?:      boolean;
  _isDeleted?:    boolean;
};

// ── Catálogo de TABS del wizard (orden = flujo natural ERP) ──────────
export const PARTNER_TABS: TabConfig[] = [
  { id: "identity",   label: "Identidad",   icon: "🆔", required: true  },
  { id: "fiscal",     label: "Fiscal",      icon: "📋", required: true  },
  { id: "contacts",   label: "Contactos",   icon: "📞", required: false },
  { id: "addresses",  label: "Direcciones", icon: "📍", required: false },
  { id: "commercial", label: "Comerciales", icon: "💰", required: false },
  { id: "banking",    label: "Bancarios",   icon: "🏦", required: false },
  { id: "documents",  label: "Documentos",  icon: "📑", required: false },
  // Tab evaluación: solo cuando es proveedor o logístico
  {
    id: "evaluation",
    label: "Evaluación",
    icon: "⭐",
    required: false,
    showWhen: (p) => Boolean(p.is_supplier || p.is_logistics_provider),
  },
  // Tab logística: solo cuando es proveedor logístico
  {
    id: "logistics",
    label: "Logística",
    icon: "🚚",
    required: false,
    showWhen: (p) => Boolean(p.is_logistics_provider),
  },
  { id: "summary",    label: "Resumen",     icon: "📊", required: false },
];

// ── Catálogo de INCOTERMS ─────────────────────────────────────────────
export const INCOTERMS: { code: Incoterm; description: string }[] = [
  { code: "EXW", description: "En fábrica" },
  { code: "FCA", description: "Franco transportista" },
  { code: "CPT", description: "Transporte pagado hasta" },
  { code: "CIP", description: "Transporte y seguro pagados hasta" },
  { code: "DAP", description: "Entregado en lugar" },
  { code: "DPU", description: "Entregado en lugar descargado" },
  { code: "DDP", description: "Entregado con derechos pagados" },
  { code: "FAS", description: "Franco al costado del buque" },
  { code: "FOB", description: "Franco a bordo" },
  { code: "CFR", description: "Costo y flete" },
  { code: "CIF", description: "Costo, seguro y flete" },
];

// ── Industrias (catálogo genérico, ampliable) ────────────────────────
export const INDUSTRIES = [
  "manufacturing",
  "retail",
  "wholesale",
  "logistics",
  "construction",
  "automotive",
  "agriculture",
  "technology",
  "consulting",
  "healthcare",
  "education",
  "finance",
  "real_estate",
  "energy",
  "telecommunications",
  "other",
] as const;

export type Industry = typeof INDUSTRIES[number];

// ── Etiquetas en español de las industrias ───────────────────────────
export const INDUSTRY_LABELS: Record<Industry, string> = {
  manufacturing:      "Manufactura",
  retail:             "Retail / Venta al detalle",
  wholesale:          "Mayoreo",
  logistics:          "Logística",
  construction:       "Construcción",
  automotive:         "Automotriz",
  agriculture:        "Agricultura",
  technology:         "Tecnología",
  consulting:         "Consultoría",
  healthcare:         "Salud",
  education:          "Educación",
  finance:            "Finanzas",
  real_estate:        "Bienes raíces",
  energy:             "Energía",
  telecommunications: "Telecomunicaciones",
  other:              "Otro",
};

// ── Estado 69-B con riesgo asociado ──────────────────────────────────
export const VALIDATION_69B_CONFIG: Record<Validation69BStatus, { label: string; color: string; risk: "none" | "low" | "medium" | "high" }> = {
  not_verified: { label: "No verificado",        color: "var(--color-text-muted)",   risk: "none"   },
  clean:        { label: "Limpio",               color: "var(--color-success-text)", risk: "none"   },
  detracted:    { label: "Desvirtuado",          color: "var(--color-success-text)", risk: "low"    },
  favorable:    { label: "Sentencia favorable",  color: "var(--color-info-text)",    risk: "low"    },
  alleged:      { label: "Presunto EFOS",        color: "var(--color-warning-text)", risk: "medium" },
  definitive:   { label: "Definitivo EFOS",      color: "var(--color-danger-text)",  risk: "high"   },
};