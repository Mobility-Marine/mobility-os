// ============================================================
// CRM INTELLIGENCE — GOD LEVEL
// Health Score · Alerts · Next Best Action
// Sin "use client" — pura lógica
// ============================================================

import type {
  CrmAccount, CrmActivity, CrmContact, CrmOpportunity,
  CrmQuote, CrmOrder, TimelineItem,
  CrmAccountInsights, CustomerAlert,
} from "../types/crm.types";

// ── BUILD INSIGHTS ────────────────────────────────────────────

export function buildAccountInsights(
  account: CrmAccount,
  ctx: {
    contacts:      CrmContact[];
    activities:    CrmActivity[];
    documents:     any[];
    opportunities: CrmOpportunity[];
    quotes:        CrmQuote[];
    orders:        CrmOrder[];
    timeline:      TimelineItem[];
  }
): CrmAccountInsights {
  const { contacts, activities, documents, opportunities, quotes, orders, timeline } = ctx;
  let score = 0;

  // Perfil completo
  if (account.legal_name) score += 8;
  if (account.industry)   score += 8;
  if (account.country)    score += 6;
  if (account.city)       score += 4;
  if (account.notes)      score += 4;

  // Contactos
  if (contacts.length >= 1) score += 10;
  if (contacts.length >= 3) score += 6;
  const decisionMakers = contacts.filter((c) =>
    c.role_in_decision === "decision_maker" || c.role_in_decision === "champion"
  ).length;
  if (decisionMakers > 0) score += 8;

  // Actividades
  if (activities.length >= 1) score += 8;
  if (activities.length >= 5) score += 4;
  const pendingActs = activities.filter((a) => a.scheduled_at && !a.completed).length;
  if (pendingActs > 0) score += 6;

  // Documentos
  if (documents.length >= 1) score += 6;

  // Pipeline
  if (opportunities.length >= 1) score += 10;
  if (quotes.length >= 1)        score += 8;
  if (orders.length >= 1)        score += 12;
  if (timeline.length >= 3)      score += 4;

  const healthScore = Math.min(score, 100);

  const churnRisk: CrmAccountInsights["churnRisk"] =
    healthScore < 40 ? "ALTO" : healthScore < 70 ? "MEDIO" : "BAJO";

  const priority: CrmAccountInsights["priority"] =
    opportunities.length > 0 && quotes.length > 0 && healthScore >= 70 ? "CRITICA"
    : opportunities.length > 0 || quotes.length > 0 ? "ALTA"
    : contacts.length > 0 || activities.length > 0 ? "MEDIA"
    : "BAJA";

  // Executive summary
  const executiveSummary =
    healthScore >= 80 ? "Cuenta bien trabajada con pipeline activo."
    : healthScore >= 60 ? "Cuenta con buena base comercial."
    : healthScore >= 40 ? "Cuenta con oportunidades de mejora."
    : "Cuenta frágil — requiere atención inmediata.";

  // Next best action
  let nextBestAction = "Revisar estado de la cuenta.";
  if (contacts.length === 0) {
    nextBestAction = "Registrar al menos un contacto clave.";
  } else if (pendingActs === 0) {
    nextBestAction = "Agendar próxima actividad de seguimiento.";
  } else if (opportunities.length > 0 && quotes.length === 0) {
    nextBestAction = "Preparar y enviar propuesta comercial.";
  } else if (quotes.length > 0 && orders.length === 0) {
    nextBestAction = "Dar seguimiento a cotización enviada — cerrar deal.";
  } else if (orders.length > 0) {
    nextBestAction = "Explorar oportunidad de upsell o renovación.";
  } else if (churnRisk === "ALTO") {
    nextBestAction = "Contactar urgente — alto riesgo de pérdida del cliente.";
  }

  return { healthScore, priority, churnRisk, nextBestAction, executiveSummary };
}

// ── BUILD ALERTS ─────────────────────────────────────────────

export function buildCustomerAlerts(
  insights:      CrmAccountInsights | null,
  activities:    CrmActivity[],
  contacts:      CrmContact[],
  opportunities: CrmOpportunity[],
  quotes:        CrmQuote[],
  orders:        CrmOrder[]
): CustomerAlert[] {
  const list: CustomerAlert[] = [];

  if (contacts.length === 0) {
    list.push({ level: "CRITICAL", title: "Sin contactos", message: "No hay personas registradas en esta cuenta." });
  }

  const pending = activities.filter((a) => a.scheduled_at && !a.completed).length;
  if (pending === 0) {
    list.push({ level: "WARNING", title: "Sin seguimiento pendiente", message: "No hay actividades futuras programadas." });
  }

  if (insights?.churnRisk === "ALTO") {
    list.push({ level: "CRITICAL", title: "Riesgo alto de pérdida", message: "Cuenta con baja actividad y health score crítico." });
  }

  if (opportunities.length > 0 && quotes.length === 0) {
    list.push({ level: "WARNING", title: "Oportunidad sin propuesta", message: "Hay deals activos sin cotización enviada." });
  }

  if (quotes.length > 0 && orders.length === 0) {
    list.push({ level: "INFO", title: "Propuesta pendiente de cierre", message: "Cotización enviada esperando confirmación." });
  }

  if (orders.length > 0) {
    list.push({ level: "SUCCESS", title: "Cliente activo con pedidos", message: "Relación comercial con historial de compras." });
  }

  return list;
}
