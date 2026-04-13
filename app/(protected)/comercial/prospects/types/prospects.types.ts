// ============================================================
// PROSPECTS — ENTERPRISE TYPES v2 (GOD LEVEL)
// Motor de adquisición previo a CRM / Customer 360
// ============================================================

// ────────────────────────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────────────────────────

export type ProspectStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "converted"
  | "lost";

export type ProspectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ProspectSource =
  | "referral"
  | "website"
  | "whatsapp"
  | "call"
  | "email"
  | "campaign"
  | "manual"
  | "other"
  | "unknown";

export type ProspectRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "whatsapp"
  | "visit"
  | "demo"
  | "proposal_sent"
  | "follow_up"
  | "note"
  | "stage_change"
  | "created"
  | "converted"
  | "lost"
  | "other";

export type TimelineEntryKind =
  | "activity"
  | "followup"
  | "task"
  | "note"
  | "system";

// ────────────────────────────────────────────────────────────
// CORE ENTITY
// ────────────────────────────────────────────────────────────

export type Prospect = {
  // Identity
  id: string;
  company_id: string;
  created_by: string | null;
  assigned_to: string | null;

  // Contact
  name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;

  // Commercial
  lead_source: string | null;
  interested_service: string | null;
  estimated_value: number | null;
  notes: string | null;
  tags: string[] | null;

  // Pipeline
  status: string | null;
  stage_position: number | null;
  next_follow_up: string | null;
  next_contact_date: string | null;

  // Flags
  is_active: boolean | null;

  // Timestamps
  created_at: string | null;
  updated_at: string | null;

  // Conversion
  converted_to_client_id: string | null;
  converted_to_account_id: string | null;
  converted_at: string | null;

  // ── Computed (client-side, not in DB) ──
  stage?: ProspectStage;
  priority?: ProspectPriority;
  sourceNormalized?: ProspectSource;
  health?: ProspectHealth;

  // ── Relations (loaded on demand) ──
  activities?: ProspectActivity[];
  followups?: ProspectFollowup[];
  tasks?: ProspectTask[];
  notes_list?: ProspectNote[];
  estimations?: ProspectEstimation[];
  timeline?: ProspectTimelineEntry[];
};

// ────────────────────────────────────────────────────────────
// ACTIVITY
// ────────────────────────────────────────────────────────────

export type ProspectActivity = {
  id: string;
  prospect_id: string;
  company_id: string;
  activity_type: ActivityType | string | null;
  activity_date: string | null;
  comments: string | null;
  created_by: string | null;
  created_at: string | null;
};

export type CreateActivityPayload = {
  activity_type: ActivityType;
  activity_date: string;
  comments?: string;
};

// ────────────────────────────────────────────────────────────
// FOLLOWUP
// ────────────────────────────────────────────────────────────

export type ProspectFollowup = {
  id: string;
  prospect_id: string;
  company_id?: string;
  activity_type: string | null;
  activity_date: string | null;
  notes: string | null;
  next_action: string | null;
  created_at: string | null;
};

// ────────────────────────────────────────────────────────────
// TASK
// ────────────────────────────────────────────────────────────

export type ProspectTask = {
  id: string;
  prospect_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: "pending" | "in_progress" | "done" | string | null;
  completed: boolean | null;
  assigned_to: string | null;
  created_at: string | null;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  due_date: string;
  assigned_to?: string;
};

// ────────────────────────────────────────────────────────────
// NOTE (new entity, separate from activities)
// ────────────────────────────────────────────────────────────

export type ProspectNote = {
  id: string;
  prospect_id: string;
  company_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  is_pinned: boolean;
};

export type CreateNotePayload = {
  content: string;
  is_pinned?: boolean;
};

// ────────────────────────────────────────────────────────────
// ESTIMATION
// ────────────────────────────────────────────────────────────

export type ProspectEstimation = {
  id: string;
  prospect_id: string;
  title: string;
  estimated_value: number | null;
  currency: string;
  probability: number | null;
  expected_close_date: string | null;
  status: "draft" | "sent" | "negotiating" | "won" | "lost";
  notes: string | null;
  created_at: string;
};

// ────────────────────────────────────────────────────────────
// UNIFIED TIMELINE (merges all activity types)
// ────────────────────────────────────────────────────────────

export type ProspectTimelineEntry = {
  id: string;
  kind: TimelineEntryKind;
  type: string;
  date: string;
  title: string;
  body: string | null;
  created_by: string | null;
  metadata?: Record<string, any>;
};

// ────────────────────────────────────────────────────────────
// INTELLIGENCE / HEALTH
// ────────────────────────────────────────────────────────────

export type ProspectHealth = {
  score: number;                         // 0–100
  conversionProbability: number;         // 0–100
  riskLevel: ProspectRiskLevel;
  nextBestActionKey: string;             // i18n key
  summaryKey: string;                    // i18n key
  daysSinceActivity: number | null;
  isOverdue: boolean;
};

// ────────────────────────────────────────────────────────────
// BOARD / PIPELINE
// ────────────────────────────────────────────────────────────

export type ProspectBoardColumn = {
  id: ProspectStage;
  labelKey: string;          // i18n key
  color: string;             // CSS variable
  prospects: Prospect[];
  totalValue: number;
};

// ────────────────────────────────────────────────────────────
// COMMAND CENTER SNAPSHOT
// ────────────────────────────────────────────────────────────

export type ProspectCommandSnapshot = {
  hotProspects: Prospect[];
  overdueFollowUps: Prospect[];
  noActivityProspects: Prospect[];
  conversionCandidates: Prospect[];
  atRisk: Prospect[];
};

// ────────────────────────────────────────────────────────────
// FILTERS
// ────────────────────────────────────────────────────────────

export type ProspectFilters = {
  search: string;
  stage: ProspectStage | "all";
  source: ProspectSource | "all";
  assignedTo: string | "all";
  onlyActive: boolean;
  minValue: number | null;
  maxValue: number | null;
};

export const DEFAULT_FILTERS: ProspectFilters = {
  search:     "",
  stage:      "all",
  source:     "all",
  assignedTo: "all",
  onlyActive: true,
  minValue:   null,
  maxValue:   null,
};

// ────────────────────────────────────────────────────────────
// CONVERSION
// ────────────────────────────────────────────────────────────

export type ProspectConversionInput = {
  name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type ProspectConversionResult = {
  client: { id: string; name: string };
  account: { id: string; name: string };
  opportunityId?: string;
};

// ────────────────────────────────────────────────────────────
// CONSTANTS — Stage ordering and colors
// ────────────────────────────────────────────────────────────

export const STAGE_ORDER: ProspectStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "converted",
  "lost",
];

export const STAGE_CONFIG: Record
  ProspectStage,
  { labelKey: string; color: string; bg: string; border: string; weight: number }
> = {
  new:         { labelKey: "prospects.stageNew",         color: "var(--color-brand-blue)",   bg: "var(--color-brand-blue-light)", border: "var(--color-brand-blue)",   weight: 1 },
  contacted:   { labelKey: "prospects.stageContacted",   color: "var(--color-text-second)",  bg: "var(--color-bg-subtle)",        border: "var(--color-border)",       weight: 2 },
  qualified:   { labelKey: "prospects.stageQualified",   color: "var(--color-success-text)", bg: "var(--color-success-bg)",       border: "var(--color-success-border)",weight: 3 },
  proposal:    { labelKey: "prospects.stageProposal",    color: "var(--color-info-text)",    bg: "var(--color-info-bg)",          border: "var(--color-info-border)",  weight: 4 },
  negotiation: { labelKey: "prospects.stageNegotiation", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",       border: "var(--color-warning-border)",weight: 5 },
  converted:   { labelKey: "prospects.stageConverted",   color: "var(--color-success-text)", bg: "var(--color-success-bg)",       border: "var(--color-success-border)",weight: 6 },
  lost:        { labelKey: "prospects.stageLost",        color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",        border: "var(--color-danger-border)", weight: 7 },
};

export const ACTIVITY_CONFIG: Record
  string,
  { icon: string; labelKey: string; color: string }
> = {
  call:          { icon: "📞", labelKey: "prospects.actCall",         color: "var(--color-brand-blue)"   },
  email:         { icon: "📧", labelKey: "prospects.actEmail",        color: "var(--color-info-text)"    },
  meeting:       { icon: "🤝", labelKey: "prospects.actMeeting",      color: "var(--color-success-text)" },
  whatsapp:      { icon: "💬", labelKey: "prospects.actWhatsapp",     color: "var(--color-success-text)" },
  visit:         { icon: "📍", labelKey: "prospects.actVisit",        color: "var(--color-warning-text)" },
  demo:          { icon: "🖥️",  labelKey: "prospects.actDemo",        color: "var(--color-brand-blue)"   },
  proposal_sent: { icon: "📄", labelKey: "prospects.actProposal",     color: "var(--color-info-text)"    },
  follow_up:     { icon: "🔔", labelKey: "prospects.actFollowUp",     color: "var(--color-warning-text)" },
  note:          { icon: "📝", labelKey: "prospects.actNote",         color: "var(--color-text-muted)"   },
  stage_change:  { icon: "🔄", labelKey: "prospects.actStageChange",  color: "var(--color-brand-blue)"   },
  created:       { icon: "✨", labelKey: "prospects.actCreated",      color: "var(--color-success-text)" },
  converted:     { icon: "🎉", labelKey: "prospects.actConverted",    color: "var(--color-success-text)" },
  lost:          { icon: "❌", labelKey: "prospects.actLost",         color: "var(--color-danger-text)"  },
  other:         { icon: "📌", labelKey: "prospects.actOther",        color: "var(--color-text-muted)"   },
};
