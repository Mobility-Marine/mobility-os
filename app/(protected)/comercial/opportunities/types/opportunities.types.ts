// ============================================================
// OPPORTUNITIES TYPES v1 — GOD LEVEL
// Multi-tenant · i18n keys · CSS vars
// ============================================================

export type OpportunityStage =
  | "qualification"
  | "discovery"
  | "proposal"
  | "negotiation"
  | "commit"
  | "won"
  | "lost";

export const STAGE_ORDER: OpportunityStage[] = [
  "qualification", "discovery", "proposal",
  "negotiation", "commit", "won", "lost",
];

export const STAGE_CONFIG: Record<OpportunityStage, {
  color:    string;
  bg:       string;
  border:   string;
  labelKey: string;
  probability: number;
  maxDays:  number;
  requiresAction: boolean;
}> = {
  qualification: { color: "var(--color-brand-blue)",    bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    labelKey: "opportunities.stageQualification", probability: 10,  maxDays: 7,  requiresAction: false },
  discovery:     { color: "var(--color-info-text)",     bg: "var(--color-info-bg)",    border: "var(--color-info-border)",    labelKey: "opportunities.stageDiscovery",     probability: 20,  maxDays: 14, requiresAction: false },
  proposal:      { color: "#a78bfa",                    bg: "rgba(167,139,250,0.1)",   border: "rgba(167,139,250,0.3)",       labelKey: "opportunities.stageProposal",      probability: 45,  maxDays: 21, requiresAction: true  },
  negotiation:   { color: "var(--color-warning-text)",  bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", labelKey: "opportunities.stageNegotiation",   probability: 70,  maxDays: 21, requiresAction: true  },
  commit:        { color: "#f59e0b",                    bg: "rgba(245,158,11,0.1)",    border: "rgba(245,158,11,0.3)",        labelKey: "opportunities.stageCommit",        probability: 90,  maxDays: 14, requiresAction: true  },
  won:           { color: "var(--color-success-text)",  bg: "var(--color-success-bg)", border: "var(--color-success-border)", labelKey: "opportunities.stageWon",           probability: 100, maxDays: 0,  requiresAction: false },
  lost:          { color: "var(--color-danger-text)",   bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  labelKey: "opportunities.stageLost",          probability: 0,   maxDays: 0,  requiresAction: false },
};

export type Opportunity = {
  id:            string;
  company_id:    string;
  name:          string;
  company_name?: string;
  stage:         OpportunityStage;
  value:         number;
  probability:   number;
  created_at:    string;
  updated_at?:   string;
  next_action?:  string;
  owner?:        string;
  archived?:     boolean;
  // Connected entities
  client_id?:            string;
  crm_account_id?:       string;
  source_prospect_id?:   string;
  source_module?:        string;
  // Computed
  health?:        OpportunityHealth;
  activities?:    OpportunityActivity[];
};

export type OpportunityActivity = {
  id:             string;
  opportunity_id: string;
  company_id:     string;
  description:    string;
  type:           "call" | "email" | "meeting" | "task" | "note";
  completed:      boolean;
  created_at:     string;
};

export type OpportunityHealth = {
  score:               number;
  riskLevel:           "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  closingScore:        number;
  lossRisk:            "LOW" | "MEDIUM" | "HIGH";
  expectedRevenue:     number;
  priorityIndex:       number;
  agingDays:           number;
  isStalled:           boolean;
  governanceAlert?:    string;
  nextBestActionKey:   string;
  summaryKey:          string;
};

export type OpportunityFilters = {
  search:    string;
  stage:     OpportunityStage | "all";
  onlyOpen:  boolean;
};

export const DEFAULT_OPP_FILTERS: OpportunityFilters = {
  search: "", stage: "all", onlyOpen: true,
};

export type ForecastSnapshot = {
  pipeline:    number;
  weighted:    number;
  commit:      number;
  bestCase:    number;
  gap:         number;
  coverage:    number;
  target:      number;
};

export type CreateOpportunityPayload = {
  name:          string;
  company_name?: string;
  value?:        number;
  probability?:  number;
  owner?:        string;
  next_action?:  string;
  client_id?:    string;
  crm_account_id?: string;
  source_prospect_id?: string;
};
