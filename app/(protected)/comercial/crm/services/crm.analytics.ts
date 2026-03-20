import type {
  CrmAccount,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  AccountRadar,
  AccountRevenue,
  AccountPriority,
  AccountAction,
  CommandCenterData,
  AiDirectorAdvice
} from "../types/crm.types";

// ======================================================
// 🔥 ACCOUNT RADAR
// ======================================================

export function calculateAccountRadar(
  opportunities: CrmOpportunity[],
  quotes: CrmQuote[],
  orders: CrmOrder[],
  contactsCount: number
): AccountRadar {

  let temperature: AccountRadar["temperature"] = "FRIA";
  let urgency: AccountRadar["urgency"] = "BAJA";

  if (opportunities.length > 0) temperature = "CALIENTE";
  else if (contactsCount > 0) temperature = "TIBIA";

  if (quotes.length > 0 && orders.length === 0) urgency = "ALTA";
  if (contactsCount === 0) urgency = "CRITICA";

  return {
    accountId: "",
    temperature,
    urgency,
    hasOpportunity: opportunities.length > 0,
    hasQuote: quotes.length > 0,
    hasOrder: orders.length > 0,
    hasContacts: contactsCount > 0
  };
}

// ======================================================
// 💰 REVENUE ENGINE
// ======================================================

export function calculateAccountRevenue(
  opportunities: CrmOpportunity[],
  quotes: CrmQuote[],
  orders: CrmOrder[]
): AccountRevenue {

  const pipelineValue =
    opportunities.reduce((s, o) => s + (o.estimated_value || 0), 0);

  const quotedValue =
    quotes.reduce((s, q) => s + (q.total_amount || 0), 0);

  const wonValue =
    orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  const totalPotential = pipelineValue + quotedValue + wonValue;

  let tier: AccountRevenue["tier"] = "LOW";

  if (totalPotential > 5_000_000) tier = "STRATEGIC";
  else if (totalPotential > 1_000_000) tier = "HIGH";
  else if (totalPotential > 100_000) tier = "MEDIUM";

  return {
    accountId: "",
    pipelineValue,
    quotedValue,
    wonValue,
    totalPotential,
    tier
  };
}

// ======================================================
// 🎯 PRIORITY ENGINE
// ======================================================

export function calculateAccountPriority(
  radar: AccountRadar | undefined,
  revenue: AccountRevenue | undefined,
  activities: CrmActivity[]
): AccountPriority {

  let score = 0;

  if (radar?.temperature === "CALIENTE") score += 30;
  else if (radar?.temperature === "TIBIA") score += 15;

  if (radar?.urgency === "CRITICA") score += 30;
  else if (radar?.urgency === "ALTA") score += 25;
  else if (radar?.urgency === "MEDIA") score += 10;

  if (revenue?.tier === "STRATEGIC") score += 35;
  else if (revenue?.tier === "HIGH") score += 25;
  else if (revenue?.tier === "MEDIUM") score += 10;

  if (activities.length === 0) score += 10;

  let label: AccountPriority["label"] = "BAJA";

  if (score >= 70) label = "CRITICA";
  else if (score >= 50) label = "ALTA";
  else if (score >= 30) label = "MEDIA";

  return {
    accountId: "",
    score,
    label
  };
}

// ======================================================
// ⚡ NEXT BEST ACTION ENGINE
// ======================================================

export function calculateAccountAction(
  radar: AccountRadar | undefined,
  revenue: AccountRevenue | undefined,
  priority: AccountPriority | undefined
): AccountAction {

  let action = "Monitorear cuenta";
  let reason = "Sin señales suficientes.";
  let urgency: AccountAction["urgency"] = "BAJA";

  if (!radar) {
    return { accountId: "", action, reason, urgency };
  }

  if (!radar.hasContacts) {
    action = "Identificar contacto clave";
    reason = "La cuenta no tiene contactos.";
    urgency = "CRITICA";
  } else if (radar.hasQuote && !radar.hasOrder) {
    action = "Dar seguimiento a cotización";
    reason = "Cotización enviada sin cierre.";
    urgency = "ALTA";
  } else if (radar.hasOpportunity && !radar.hasQuote) {
    action = "Convertir oportunidad en propuesta";
    reason = "Hay oportunidad sin cotización.";
    urgency = "ALTA";
  } else if (radar.hasOrder) {
    action = "Buscar upsell o recompra";
    reason = "Cliente activo.";
    urgency = "MEDIA";
  } else if (priority?.label === "CRITICA") {
    action = "Contactar hoy mismo";
    reason = "Cuenta crítica.";
    urgency = "CRITICA";
  } else if (revenue?.tier === "STRATEGIC") {
    action = "Diseñar plan estratégico";
    reason = "Alto potencial económico.";
    urgency = "ALTA";
  }

  return {
    accountId: "",
    action,
    reason,
    urgency
  };
}

// ======================================================
// 🧭 COMMAND CENTER ENGINE
// ======================================================

export function calculateCommandCenter(
  accounts: CrmAccount[],
  radarMap: Record<string, AccountRadar>,
  revenueMap: Record<string, AccountRevenue>,
  priorityMap: Record<string, AccountPriority>,
  actionMap: Record<string, AccountAction>
): CommandCenterData {

  const criticalAccounts: CrmAccount[] = [];
  const urgentActions: CrmAccount[] = [];
  const noFollowUp: CrmAccount[] = [];
  const highValue: CrmAccount[] = [];
  const coldAccounts: CrmAccount[] = [];

  accounts.forEach((acc) => {
    const id = acc.id;
    const radar = radarMap[id];
    const rev = revenueMap[id];
    const act = actionMap[id];
    const pr = priorityMap[id];

    if (pr?.label === "CRITICA") criticalAccounts.push(acc);

    if (act?.urgency === "CRITICA" || act?.urgency === "ALTA")
      urgentActions.push(acc);

    if (radar && radar.hasContacts && !radar.hasOpportunity && !radar.hasOrder)
      noFollowUp.push(acc);

    if (rev?.tier === "STRATEGIC" || rev?.tier === "HIGH")
      highValue.push(acc);

    if (radar?.temperature === "FRIA") coldAccounts.push(acc);
  });

  return {
    criticalAccounts,
    urgentActions,
    noFollowUp,
    highValue,
    coldAccounts
  };
}

// ======================================================
// 🤖 DIRECTOR IA — ESTRATEGIA
// ======================================================

export function calculateDirectorAdvice(
  account: CrmAccount,
  opportunities: CrmOpportunity[],
  quotes: CrmQuote[],
  orders: CrmOrder[],
  contactsCount: number,
  hasRecentActivity: boolean,
  timelineLength: number
): AiDirectorAdvice {

  const alerts: string[] = [];
  const opportunitiesDetected: string[] = [];
  const risksDetected: string[] = [];

  let urgency: AiDirectorAdvice["urgency"] = "BAJA";
  let accountTemperature: AiDirectorAdvice["accountTemperature"] = "FRIA";
  let recommendedAction = "Monitorear actividad.";

  if (hasRecentActivity) accountTemperature = "TIBIA";

  if (opportunities.length > 0) {
    accountTemperature = "CALIENTE";
    opportunitiesDetected.push("Oportunidad activa");
  }

  if (quotes.length > 0 && orders.length === 0) {
    opportunitiesDetected.push("Cotización sin cierre");
    recommendedAction = "Dar seguimiento";
    urgency = "ALTA";
  }

  if (orders.length > 0) {
    opportunitiesDetected.push("Cliente activo");
    recommendedAction = "Upsell o expansión";
  }

  if (contactsCount === 0) {
    risksDetected.push("Sin contactos");
    alerts.push("Cuenta sin relación");
    urgency = "ALTA";
    recommendedAction = "Identificar contacto";
  }

  if (!hasRecentActivity) {
    risksDetected.push("Sin actividad");
    alerts.push("Cuenta inactiva");
    urgency = "MEDIA";
  }

  if (timelineLength < 2) {
    risksDetected.push("Poco historial");
  }

  if (account.status === "strategic") {
    urgency = "CRITICA";
    alerts.push("Cuenta estratégica");
  }

  return {
    urgency,
    accountTemperature,
    recommendedAction,
    alerts,
    opportunitiesDetected,
    risksDetected
  };
}
