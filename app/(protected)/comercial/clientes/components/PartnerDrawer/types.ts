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
  billing_address?:              string;
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

  // Validación SAT (Facturapi)
  validation_sat_status?:       ValidationSATStatus;
  validation_sat_date?:         string;
  validation_sat_error?:        string;

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

  // Timestamps
  created_at?:                  string;
  updated_at?:                  string;
  created_by?:                  string;
};

// ── Payloads para crear/actualizar ───────────────────────────────────
export type CreatePartnerPayload = Omit
  Partner,
  "id" | "created_at" | "updated_at" | "created_by"
>;
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
  labelKey:  string;
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

// ── Catálogo de TABS del wizard (orden = flujo natural ERP) ──────────
export const PARTNER_TABS: TabConfig[] = [
  { id: "identity",   labelKey: "partner.tabIdentity",   icon: "🆔", required: true  },
  { id: "fiscal",     labelKey: "partner.tabFiscal",     icon: "📋", required: true  },
  { id: "contacts",   labelKey: "partner.tabContacts",   icon: "📞", required: false },
  { id: "addresses",  labelKey: "partner.tabAddresses",  icon: "📍", required: false },
  { id: "commercial", labelKey: "partner.tabCommercial", icon: "💰", required: false },
  { id: "banking",    labelKey: "partner.tabBanking",    icon: "🏦", required: false },
  { id: "documents",  labelKey: "partner.tabDocuments",  icon: "📑", required: false },
  // Tab evaluación: solo cuando es proveedor o logístico
  {
    id: "evaluation",
    labelKey: "partner.tabEvaluation",
    icon: "⭐",
    required: false,
    showWhen: (p) => Boolean(p.is_supplier || p.is_logistics_provider),
  },
  // Tab logística: solo cuando es proveedor logístico
  {
    id: "logistics",
    labelKey: "partner.tabLogistics",
    icon: "🚚",
    required: false,
    showWhen: (p) => Boolean(p.is_logistics_provider),
  },
  { id: "summary",    labelKey: "partner.tabSummary",    icon: "📊", required: false },
];

// ── Catálogo de INCOTERMS ─────────────────────────────────────────────
export const INCOTERMS: { code: Incoterm; descKey: string }[] = [
  { code: "EXW", descKey: "incoterms.exw" },
  { code: "FCA", descKey: "incoterms.fca" },
  { code: "CPT", descKey: "incoterms.cpt" },
  { code: "CIP", descKey: "incoterms.cip" },
  { code: "DAP", descKey: "incoterms.dap" },
  { code: "DPU", descKey: "incoterms.dpu" },
  { code: "DDP", descKey: "incoterms.ddp" },
  { code: "FAS", descKey: "incoterms.fas" },
  { code: "FOB", descKey: "incoterms.fob" },
  { code: "CFR", descKey: "incoterms.cfr" },
  { code: "CIF", descKey: "incoterms.cif" },
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

// ── Estado 69-B con riesgo asociado ──────────────────────────────────
export const VALIDATION_69B_CONFIG: Record
  Validation69BStatus,
  { labelKey: string; color: string; risk: "none" | "low" | "medium" | "high" }
> = {
  not_verified: { labelKey: "validation.69b.notVerified", color: "var(--color-text-muted)",   risk: "none"   },
  clean:        { labelKey: "validation.69b.clean",       color: "var(--color-success-text)", risk: "none"   },
  detracted:    { labelKey: "validation.69b.detracted",   color: "var(--color-success-text)", risk: "low"    },
  favorable:    { labelKey: "validation.69b.favorable",   color: "var(--color-info-text)",    risk: "low"    },
  alleged:      { labelKey: "validation.69b.alleged",     color: "var(--color-warning-text)", risk: "medium" },
  definitive:   { labelKey: "validation.69b.definitive",  color: "var(--color-danger-text)",  risk: "high"   },
};