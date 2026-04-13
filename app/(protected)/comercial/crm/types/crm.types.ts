// ============================================================
// CRM TYPES v2 — GOD LEVEL
// Customer 360 · Multi-tenant · i18n keys · CSS vars
// ============================================================

// ── ACCOUNT ────────────────────────────────────────────────

export type CrmLifecycleStage =
  | "lead" | "opportunity" | "customer" | "inactive" | "strategic";

export type CrmAccountStatus = "active" | "inactive" | "archived";

export const LIFECYCLE_CONFIG: Record<CrmLifecycleStage, {
  labelKey: string; color: string; bg: string; border: string;
}> = {
  lead:        { labelKey: "crm.stageLead",       color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)" },
  opportunity: { labelKey: "crm.stageOpportunity",color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"  },
  customer:    { labelKey: "crm.stageCustomer",   color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)"},
  inactive:    { labelKey: "crm.stageInactive",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)" },
  strategic:   { labelKey: "crm.stageStrategic",  color: "#a78bfa",                  bg: "rgba(167,139,250,0.1)",   border: "rgba(167,139,250,0.3)"     },
};

export type CrmAccount = {
  id:            string;
  company_id:    string;
  client_id?:    string | null;
  prospect_id?:  string | null;
  name:          string;
  legal_name?:   string | null;
  industry?:     string | null;
  country?:      string | null;
  state?:        string | null;
  city?:         string | null;
  address?:      string | null;
  website?:      string | null;
  tax_id?:       string | null;
  // Classification
  customer_type?:   "PROSPECT" | "CLIENT" | "PARTNER" | "SUPPLIER";
  lifecycle_stage?: CrmLifecycleStage;
  segment?:         string | null;
  priority_tier?:   string | null;
  // Status
  status:            string;
  notes?:            string | null;
  strategic_account?: boolean;
  health_status?:    string | null;
  risk_level?:       string | null;
  is_customer?:      boolean;
  archived?:         boolean;
  // Timestamps
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  // Joined
  client?: { id: string; name: string; email?: string; rfc?: string; is_active?: boolean } | null;
};

// ── CONTACTS ────────────────────────────────────────────────

export type CrmContact = {
  id:                  string;
  company_id?:         string;
  account_id:          string;
  first_name?:         string;
  last_name?:          string;
  name?:               string;        // computed or legacy
  position?:           string | null;
  job_title?:          string | null;
  department?:         string | null;
  email?:              string | null;
  phone?:              string | null;
  mobile?:             string | null;
  mobile_phone?:       string | null;
  role?:               string | null;
  role_in_decision?:   string | null;
  influence_level?:    number | null;
  relationship_score?: number | null;
  notes?:              string | null;
  archived?:           boolean;
  created_at?:         string;
  updated_at?:         string;
};

// ── ACTIVITIES ──────────────────────────────────────────────

export type ActivityType = "call" | "email" | "meeting" | "task" | "note" | "whatsapp" | "visit";

export const ACTIVITY_TYPE_CONFIG: Record<string, { labelKey: string; color: string; icon: string }> = {
  call:     { labelKey: "crm.actCall",     color: "var(--color-brand-blue)",   icon: "📞" },
  email:    { labelKey: "crm.actEmail",    color: "var(--color-info-text)",    icon: "✉" },
  meeting:  { labelKey: "crm.actMeeting",  color: "var(--color-success-text)", icon: "📅" },
  task:     { labelKey: "crm.actTask",     color: "var(--color-warning-text)", icon: "✓"  },
  note:     { labelKey: "crm.actNote",     color: "var(--color-text-muted)",   icon: "📝" },
  whatsapp: { labelKey: "crm.actWhatsapp", color: "#25d366",                  icon: "💬" },
  visit:    { labelKey: "crm.actVisit",    color: "#a78bfa",                  icon: "📍" },
};

export type CrmActivity = {
  id:             string;
  company_id:     string;
  account_id:     string;
  contact_id?:    string | null;
  opportunity_id?: string | null;
  prospect_id?:   string | null;
  type:           string;
  title:          string;
  description?:   string | null;
  status?:        string;
  priority?:      string;
  scheduled_at?:  string | null;
  ended_at?:      string | null;
  completed:      boolean;
  completed_at?:  string | null;
  created_by?:    string | null;
  created_at:     string;
};

// ── DOCUMENTS ───────────────────────────────────────────────

export type CrmDocument = {
  id:                string;
  company_id?:       string;
  account_id:        string;
  name:              string;
  file_path:         string;
  file_type?:        string | null;
  size?:             number | null;
  storage_provider:  string;
  created_by?:       string | null;
  created_at:        string;
};

// ── OPPORTUNITIES (connected to opportunities table) ────────

export type CrmOpportunity = {
  id:                  string;
  company_id?:         string;
  account_id?:         string | null;
  client_id?:          string | null;
  crm_account_id?:     string | null;
  prospect_id?:        string | null;
  name:                string;
  company_name?:       string;
  stage:               string;
  status?:             string;
  estimated_value?:    number | null;
  value?:              number | null;
  probability?:        number | null;
  expected_close_date?: string | null;
  assigned_to?:        string | null;
  owner?:              string | null;
  archived?:           boolean;
  created_at?:         string;
  updated_at?:         string;
};

// ── QUOTES / ORDERS ─────────────────────────────────────────

export type CrmQuote = {
  id:           string;
  company_id?:  string;
  account_id?:  string | null;
  client_id?:   string | null;
  quote_number: string;
  total_amount?: number | null;
  currency?:    string | null;
  status:       string;
  created_at?:  string;
};

export type CrmOrder = {
  id:           string;
  company_id?:  string;
  account_id?:  string | null;
  client_id?:   string | null;
  order_number: string;
  status:       string;
  total_amount?: number | null;
  currency?:    string | null;
  created_at?:  string;
};

// ── TIMELINE ────────────────────────────────────────────────

export type TimelineItem = {
  id:           string;
  entity_type?: string;
  entity_id?:   string;
  type:         string;
  title:        string;
  description?: string | null;
  date:         string;
  module_key?:  string;
};

// ── INTELLIGENCE ─────────────────────────────────────────────

export type CrmAccountInsights = {
  healthScore:      number;
  priority:         "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  churnRisk:        "BAJO" | "MEDIO" | "ALTO";
  nextBestAction:   string;
  executiveSummary: string;
};

export type CustomerAlert = {
  level:   "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  title:   string;
  message: string;
};

export type AiDirectorAdvice = {
  urgency:               "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  accountTemperature:    "FRIA" | "TIBIA" | "CALIENTE";
  recommendedAction:     string;
  alerts:                string[];
  opportunitiesDetected: string[];
  risksDetected:         string[];
};

// ── ANALYTICS ────────────────────────────────────────────────

export type AccountRadar = {
  accountId:     string;
  temperature:   "FRIA" | "TIBIA" | "CALIENTE";
  urgency:       "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  hasOpportunity:boolean;
  hasQuote:      boolean;
  hasOrder:      boolean;
  hasContacts:   boolean;
};

export type AccountRevenue = {
  accountId:      string;
  pipelineValue:  number;
  quotedValue:    number;
  wonValue:       number;
  totalPotential: number;
  tier:           "LOW" | "MEDIUM" | "HIGH" | "STRATEGIC";
};

export type AccountPriority = {
  accountId: string;
  score:     number;
  label:     "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
};

export type AccountAction = {
  accountId: string;
  action:    string;
  reason:    string;
  urgency:   "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
};

export type CommandCenterData = {
  criticalAccounts: CrmAccount[];
  urgentActions:    CrmAccount[];
  noFollowUp:       CrmAccount[];
  highValue:        CrmAccount[];
  coldAccounts:     CrmAccount[];
};

// ── FILTERS ──────────────────────────────────────────────────

export type CrmFilters = {
  search:         string;
  lifecycle:      CrmLifecycleStage | "all";
  onlyStrategic:  boolean;
};

export const DEFAULT_CRM_FILTERS: CrmFilters = {
  search: "", lifecycle: "all", onlyStrategic: false,
};

// ── CREATE PAYLOADS ──────────────────────────────────────────

export type CreateAccountPayload = {
  name:         string;
  legal_name?:  string;
  industry?:    string;
  country?:     string;
  city?:        string;
  website?:     string;
  notes?:       string;
  status?:      string;
  lifecycle_stage?: CrmLifecycleStage;
};

export type CreateContactPayload = {
  account_id:       string;
  first_name:       string;
  last_name?:       string;
  job_title?:       string;
  department?:      string;
  email?:           string;
  phone?:           string;
  mobile_phone?:    string;
  role_in_decision?: string;
  influence_level?: number;
  notes?:           string;
};

export type CreateActivityPayload = {
  account_id:    string;
  type:          string;
  title:         string;
  description?:  string;
  scheduled_at?: string;
};
