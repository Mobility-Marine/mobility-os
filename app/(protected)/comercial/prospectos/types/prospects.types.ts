// ============================================================
// PROSPECTS — ENTERPRISE TYPES
// Motor de adquisición previo a CRM / Customer 360
// ============================================================

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
  | "other";

export type Prospect = {
  id: string;
  company_id: string;

  name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;

  lead_source: string | null;
  interested_service: string | null;

  status: string | null;
  stage_position: number | null;
  next_follow_up: string | null;
  notes: string | null;

  estimated_value: number | null;
  assigned_to: string | null;
  created_by: string | null;

  is_active: boolean | null;
  created_at: string | null;

  // ===== ENTERPRISE LOGIC =====
  stage?: ProspectStage;
  priority?: ProspectPriority;
  sourceNormalized?: ProspectSource | "unknown";

  // ===== CONVERSIÓN =====
  converted_to_client_id?: string | null;
  converted_to_account_id?: string | null;
  converted_at?: string | null;
};

export type ProspectActivity = {
  id: string;
  prospect_id: string;
  activity_type: string | null;
  activity_date: string | null;
  comments: string | null;
  created_at: string | null;
};

export type ProspectFollowup = {
  id: string;
  prospect_id: string;
  activity_type: string | null;
  activity_date: string | null;
  notes: string | null;
  next_action: string | null;
  created_at: string | null;
};

export type ProspectTask = {
  id: string;
  prospect_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string | null;
  completed: boolean | null;
  created_at: string | null;
};

export type ProspectScore = {
  prospectId: string;
  score: number;
  priority: ProspectPriority;
  reasons: string[];
};

export type ProspectBoardColumn = {
  id: ProspectStage;
  title: string;
  prospects: Prospect[];
};

export type ProspectCommandCenter = {
  hotProspects: Prospect[];
  overdueFollowUps: Prospect[];
  noActivityProspects: Prospect[];
  conversionCandidates: Prospect[];
};

export type ProspectConversionInput = {
  prospectId: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type ProspectFilters = {
  search: string;
  stage?: ProspectStage | "all";
  assignedTo?: string | "all";
  onlyActive?: boolean;
};

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
