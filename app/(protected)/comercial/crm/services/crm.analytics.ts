// ============================================================
// CRM ANALYTICS — GOD LEVEL
// Priority · Action · CommandCenter · Director IA
// Sin "use client" — pura lógica
// ============================================================

import type {
  CrmAccount, CrmActivity, CrmOpportunity, CrmQuote, CrmOrder,
  AccountRadar, AccountRevenue, AccountPriority, AccountAction,
  CommandCenterData, AiDirectorAdvice,
} from "../types/crm.types";

// ── PRIORITY ENGINE ──────────────────────────────────────────

export function calculateAccountPriority(
  radar?:    AccountRadar,
  revenue?:  AccountRevenue,
  activities?: CrmActivity[]
): Omit<AccountPriority, "accountId"> {
  let score = 0;

  if (radar?.temperature === "CALIENTE") score += 30;
  else if (radar?.temperature === "TIBIA") score += 15;

  if (radar?.urgency === "CRITICA") score += 25;
  else if (radar?.urgency === "ALTA") score += 15;
  else if (radar?.urgency === "MEDIA") score += 8;

  if (revenue?.tier === "STRATEGIC") score += 30;
  else if (revenue?.tier === "HIGH")  score += 20;
  else if (revenue?.tier === "MEDIUM") score += 10;

  if (radar?.hasOpportunity) score += 10;
  if (radar?.hasQuote)        score += 8;
  if (radar?.hasOrder)        score += 12;

  const recent = activities?.filter((a) => {
    const d = a.scheduled_at ? new Date(a.scheduled_at) : new Date(a.created_at);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length ?? 0;
  if (recent > 0) score += 8;

  const label: AccountPriority["label"] =
    score >= 70 ? "CRITICA" : score >= 50 ? "ALTA" : score >= 30 ? "MEDIA" : "BAJA";

  return { score: Math.min(score, 100), label };
}

// ── ACTION ENGINE ─────────────────────────────────────────────

export function calculateAccountAction(
  radar?:    AccountRadar,
  revenue?:  AccountRevenue,
  priority?: AccountPriority
): Omit<AccountAction, "accountId"> {
  const urgency = priority?.label === "CRITICA" ? "CRITICA"
    : priority?.label === "ALTA" ? "ALTA"
    : priority?.label === "MEDIA" ? "MEDIA" : "BAJA";

  let action  = "Monitorear cuenta";
  let reason  = "Sin datos suficientes para sugerir acción.";

  if (!radar?.hasContacts) {
    action = "Registrar contacto clave";
    reason = "Sin contactos — no hay interlocutor para avanzar.";
  } else if (radar?.temperature === "FRIA") {
    action = "Reactivar cuenta";
    reason = "Cuenta sin actividad reciente — riesgo de pérdida.";
  } else if (radar?.hasOpportunity && !radar.hasQuote) {
    action = "Generar cotización";
    reason = "Hay oportunidad activa sin propuesta enviada.";
  } else if (radar?.hasQuote) {
    action = "Dar seguimiento a propuesta";
    reason = "Propuesta enviada pendiente de respuesta.";
  } else if (radar?.hasOrder) {
    action = "Buscar upsell / recompra";
    reason = "Cliente activo — momento ideal para expandir relación.";
  } else if (revenue?.tier === "STRATEGIC" || revenue?.tier === "HIGH") {
    action = "Agendar revisión estratégica";
    reason = "Cuenta de alto valor — mantener contacto ejecutivo.";
  }

  return { action, reason, urgency };
}

// ── COMMAND CENTER ────────────────────────────────────────────

export function calculateCommandCenter(
  accounts:    CrmAccount[],
  radarMap:    Record<string, AccountRadar>,
  revenueMap:  Record<string, AccountRevenue>,
  priorityMap: Record<string, AccountPriority>,
  actionMap:   Record<string, AccountAction>
): CommandCenterData {
  return {
    criticalAccounts: accounts.filter((a) => priorityMap[a.id]?.label === "CRITICA"),
    urgentActions:    accounts.filter((a) => actionMap[a.id]?.urgency  === "CRITICA" || actionMap[a.id]?.urgency === "ALTA"),
    noFollowUp:       accounts.filter((a) => !radarMap[a.id]?.hasOpportunity && !radarMap[a.id]?.hasQuote),
    highValue:        accounts.filter((a) => revenueMap[a.id]?.tier === "STRATEGIC" || revenueMap[a.id]?.tier === "HIGH"),
    coldAccounts:     accounts.filter((a) => radarMap[a.id]?.temperature === "FRIA"),
  };
}

// ── DIRECTOR IA ───────────────────────────────────────────────

export function calculateDirectorAdvice(
  account:      CrmAccount,
  opportunities: CrmOpportunity[],
  quotes:       CrmQuote[],
  orders:       CrmOrder[],
  contactCount: number,
  hasActivity:  boolean,
  timelineCount: number
): AiDirectorAdvice {
  const hasOpp   = opportunities.length > 0;
  const hasQuote = quotes.length > 0;
  const hasOrder = orders.length > 0;
  const pipelineValue = opportunities.reduce((s, o) => s + (o.estimated_value ?? o.value ?? 0), 0);

  let urgency: AiDirectorAdvice["urgency"] = "BAJA";
  let temp:    AiDirectorAdvice["accountTemperature"] = "FRIA";
  let action   = "Monitorear cliente.";

  const alerts:              string[] = [];
  const opportunitiesFound:  string[] = [];
  const risks:               string[] = [];

  if (hasOrder) {
    temp = "CALIENTE";
    urgency = "MEDIA";
    action = "Buscar oportunidad de upsell o renovación.";
    opportunitiesFound.push("Cliente con pedidos — candidato a recompra.");
  } else if (hasQuote) {
    temp = "CALIENTE";
    urgency = "ALTA";
    action = "Dar seguimiento a cotización enviada — cerrar deal.";
    alerts.push("Propuesta pendiente de respuesta.");
  } else if (hasOpp) {
    temp = "TIBIA";
    urgency = "MEDIA";
    action = "Avanzar oportunidad — preparar propuesta formal.";
    if (pipelineValue > 0) opportunitiesFound.push(`Pipeline estimado: $${pipelineValue.toLocaleString()}`);
  } else if (!contactCount) {
    urgency = "ALTA";
    action = "Registrar contacto clave para poder avanzar comercialmente.";
    risks.push("Sin contactos registrados — no hay interlocutor.");
  } else if (!hasActivity) {
    urgency = "MEDIA";
    action = "Agendar primera actividad de seguimiento.";
    risks.push("Sin actividades — relación inactiva.");
  }

  if (account.strategic_account) {
    alerts.push("Cuenta estratégica — requiere atención ejecutiva prioritaria.");
    if (urgency === "BAJA") urgency = "MEDIA";
  }

  if (contactCount === 0) risks.push("Sin contactos registrados.");
  if (!hasOpp && !hasQuote && !hasOrder) risks.push("Sin pipeline comercial activo.");

  return {
    urgency,
    accountTemperature: temp,
    recommendedAction:  action,
    alerts,
    opportunitiesDetected: opportunitiesFound,
    risksDetected: risks,
  };
}
