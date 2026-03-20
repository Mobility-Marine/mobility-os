// ============================================================
// CRM — CORE TYPES
// Customer Master + Entidades base
// ============================================================

export type CrmAccount = {
  id: string;
  company_id: string;

  // ===== CUSTOMER MASTER =====
  name: string;
  legal_name: string | null;
  industry: string | null;

  country: string | null;
  city: string | null;

  status: string;
  notes: string | null;

  // ===== MASTER METADATA =====
  customer_type?: "PROSPECT" | "CLIENT" | "PARTNER" | "SUPPLIER";
  lifecycle_stage?: "LEAD" | "OPPORTUNITY" | "CUSTOMER" | "INACTIVE";

  created_at?: string;
  updated_at?: string;
};

// ============================================================
// DOCUMENTS
// ============================================================

export type CrmDocument = {
  id: string;
  account_id: string;

  name: string;
  file_path: string;
  file_type: string | null;

  size: number | null;
  storage_provider: string;

  created_at: string;
};

// ============================================================
// ACTIVITIES
// ============================================================

export type CrmActivity = {
  id: string;

  company_id: string;
  account_id: string;

  type: string;
  title: string;
  description: string | null;

  scheduled_at: string | null;
  completed: boolean;

  created_at: string;
};

// ============================================================
// OPPORTUNITIES
// ============================================================

export type CrmOpportunity = {
  id: string;
  name: string;

  stage: string;
  estimated_value: number | null;
};

// ============================================================
// QUOTES
// ============================================================

export type CrmQuote = {
  id: string;

  quote_number: string;
  total_amount: number | null;

  status: string;
};

// ============================================================
// ORDERS
// ============================================================

export type CrmOrder = {
  id: string;

  order_number: string;
  status: string;

  total_amount: number | null;
};

// ============================================================
// TIMELINE
// ============================================================

export type TimelineItem = {
  id: string;
  type: string;

  title: string;
  description?: string | null;

  date: string;
};

// ============================================================
// INSIGHTS (IA / HEALTH)
// ============================================================

export type CrmAccountInsights = {
  healthScore: number;

  priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  churnRisk: "BAJO" | "MEDIO" | "ALTO";

  nextBestAction: string;
  executiveSummary: string;
};

// ============================================================
// CUSTOMER ALERTS
// ============================================================

export type CustomerAlert = {
  level: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

  title: string;
  message: string;
};

// ============================================================
// DIRECTOR IA ADVICE
// ============================================================

export type AiDirectorAdvice = {
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

  accountTemperature: "FRIA" | "TIBIA" | "CALIENTE";

  recommendedAction: string;

  alerts: string[];
  opportunitiesDetected: string[];
  risksDetected: string[];
};

// ============================================================
// CONTACTS
// ============================================================

export type CrmContact = {
  id: string;
  account_id: string;

  name: string;

  position: string | null;
  department: string | null;

  email: string | null;
  phone: string | null;
  mobile: string | null;

  role: string | null;

  influence_level: number | null;
  relationship_score: number | null;

  notes: string | null;
};

// ============================================================
// RADAR
// ============================================================

export type AccountRadar = {
  accountId: string;

  temperature: "FRIA" | "TIBIA" | "CALIENTE";
  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

  hasOpportunity: boolean;
  hasQuote: boolean;
  hasOrder: boolean;
  hasContacts: boolean;
};

// ============================================================
// REVENUE
// ============================================================

export type AccountRevenue = {
  accountId: string;

  pipelineValue: number;
  quotedValue: number;
  wonValue: number;

  totalPotential: number;

  tier: "LOW" | "MEDIUM" | "HIGH" | "STRATEGIC";
};

// ============================================================
// PRIORITY
// ============================================================

export type AccountPriority = {
  accountId: string;

  score: number;
  label: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
};

// ============================================================
// ACTION ENGINE
// ============================================================

export type AccountAction = {
  accountId: string;

  action: string;
  reason: string;

  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
};

// ============================================================
// COMMAND CENTER
// ============================================================

export type CommandCenterData = {
  criticalAccounts: CrmAccount[];
  urgentActions: CrmAccount[];
  noFollowUp: CrmAccount[];
  highValue: CrmAccount[];
  coldAccounts: CrmAccount[];
};
