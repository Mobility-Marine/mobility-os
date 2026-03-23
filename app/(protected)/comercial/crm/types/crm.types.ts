// ============================================================
// 🌐 CRM — CORE TYPES (GLOBAL CUSTOMER MASTER ALIGNED)
// Compatible con entidad global, multi-empresa y multi-módulo
// ============================================================

// ============================================================
// 🧠 CUSTOMER MASTER (Entidad central de negocio)
// ============================================================

export type CrmAccount = {
  id: string;

  // 🔐 Multi-tenant / multi-empresa
  company_id: string;

  // 🌐 Vinculación con entidad global (Customer Master)
  client_id?: string | null;      // ← NUEVO: ID del cliente global
  prospect_id?: string | null;    // ← Para conversión prospecto → cliente

  // ===== IDENTIDAD =====
  name: string;
  legal_name: string | null;
  industry: string | null;

  country: string | null;
  state?: string | null;
  city: string | null;
  address?: string | null;
  website?: string | null;

  tax_id?: string | null;

  // ===== CLASIFICACIÓN GLOBAL =====
  customer_type?: "PROSPECT" | "CLIENT" | "PARTNER" | "SUPPLIER";
  lifecycle_stage?: "LEAD" | "OPPORTUNITY" | "CUSTOMER" | "INACTIVE";

  segment?: string | null;
  priority_tier?: string | null;

  // ===== ESTADO OPERATIVO =====
  status: string;
  notes: string | null;

  strategic_account?: boolean;
  health_status?: string | null;
  risk_level?: string | null;

  // ===== METADATA =====
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};


// ============================================================
// 📎 DOCUMENTOS
// ============================================================

export type CrmDocument = {
  id: string;

  company_id?: string;
  account_id: string;

  name: string;
  file_path: string;
  file_type: string | null;

  size: number | null;
  storage_provider: string;

  created_by?: string | null;
  created_at: string;
};


// ============================================================
// 📅 ACTIVIDADES
// ============================================================

export type CrmActivity = {
  id: string;

  company_id: string;
  account_id: string;

  contact_id?: string | null;
  opportunity_id?: string | null;
  prospect_id?: string | null;

  type: string;
  title: string;
  description: string | null;

  status?: string;
  priority?: string;

  scheduled_at: string | null;
  ended_at?: string | null;

  completed: boolean;
  completed_at?: string | null;

  created_by?: string | null;
  created_at: string;
};


// ============================================================
// 👤 CONTACTOS
// ============================================================

export type CrmContact = {
  id: string;

  company_id?: string;
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

  created_at?: string;
  updated_at?: string;
};

// ============================================================
// 💼 PIPELINE COMERCIAL (Conectado a TODA la plataforma)
// ============================================================

export type CrmOpportunity = {
  id: string;

  company_id?: string;

  account_id?: string | null;   // Cliente existente
  prospect_id?: string | null;  // Prospecto no convertido

  name: string;

  stage: string;
  status?: string;

  estimated_value: number | null;
  probability?: number | null;

  expected_close_date?: string | null;

  assigned_to?: string | null;

  created_at?: string;
  updated_at?: string;
};


export type CrmQuote = {
  id: string;

  company_id?: string;

  account_id?: string | null;
  client_id?: string | null;

  quote_number: string;
  total_amount: number | null;

  currency?: string | null;

  status: string;

  created_at?: string;
};


export type CrmOrder = {
  id: string;

  company_id?: string;

  account_id?: string | null;
  client_id?: string | null;

  order_number: string;

  status: string;
  total_amount: number | null;

  currency?: string | null;

  created_at?: string;
};


// ============================================================
// 🕓 TIMELINE GLOBAL DE ENTIDAD
// (Debe poder unificar TODA la plataforma)
// ============================================================

export type TimelineItem = {
  id: string;

  entity_type?: string;   // account, opportunity, order, etc.
  entity_id?: string;

  type: string;

  title: string;
  description?: string | null;

  date: string;
};


// ============================================================
// 🧠 INSIGHTS (IA / HEALTH ENGINE)
// ============================================================

export type CrmAccountInsights = {
  healthScore: number;

  priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  churnRisk: "BAJO" | "MEDIO" | "ALTO";

  nextBestAction: string;
  executiveSummary: string;
};


// ============================================================
// 🚨 CUSTOMER ALERTS
// ============================================================

export type CustomerAlert = {
  level: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

  title: string;
  message: string;
};


// ============================================================
// 🤖 DIRECTOR IA — ADVICE ENGINE
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
// 📡 ACCOUNT RADAR
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
// 💰 REVENUE ENGINE
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
// 🎯 PRIORITY ENGINE
// ============================================================

export type AccountPriority = {
  accountId: string;

  score: number;
  label: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
};


// ============================================================
// ⚡ NEXT BEST ACTION
// ============================================================

export type AccountAction = {
  accountId: string;

  action: string;
  reason: string;

  urgency: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
};


// ============================================================
// 🧭 COMMAND CENTER GLOBAL
// ============================================================

export type CommandCenterData = {
  criticalAccounts: CrmAccount[];
  urgentActions: CrmAccount[];
  noFollowUp: CrmAccount[];
  highValue: CrmAccount[];
  coldAccounts: CrmAccount[];
};
