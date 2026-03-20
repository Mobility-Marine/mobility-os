"use client";

import type {
  CrmAccount,
  CrmActivity,
  CrmContact,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  TimelineItem,
  CrmAccountInsights,
  CustomerAlert
} from "../types/crm.types";


// =========================================================
// ACCOUNT INSIGHTS
// =========================================================
export function buildAccountInsights(
  account: CrmAccount,
  ctx: {
    contacts: CrmContact[];
    activities: CrmActivity[];
    documents: any[];
    opportunities: CrmOpportunity[];
    quotes: CrmQuote[];
    orders: CrmOrder[];
    timeline: TimelineItem[];
  }
): CrmAccountInsights {

  const {
    contacts,
    activities,
    documents,
    opportunities,
    quotes,
    orders,
    timeline
  } = ctx;

  let score = 0;

  if (account.legal_name) score += 10;
  if (account.industry) score += 10;
  if (account.country) score += 8;
  if (account.city) score += 6;
  if (account.notes) score += 6;

  if (contacts.length >= 1) score += 10;
  if (contacts.length >= 3) score += 6;

  const decisionMakers = contacts.filter(
    c =>
      c.role?.toLowerCase().includes("decision") ||
      c.role?.toLowerCase().includes("director") ||
      c.role?.toLowerCase().includes("buyer")
  ).length;

  if (decisionMakers > 0) score += 10;

  if (activities.length >= 1) score += 8;
  if (activities.length >= 5) score += 6;

  const futureActivities = activities.filter(
    a => a.scheduled_at && !a.completed
  ).length;

  if (futureActivities > 0) score += 8;

  if (documents.length >= 1) score += 8;
  if (documents.length >= 3) score += 4;

  if (opportunities.length >= 1) score += 10;
  if (quotes.length >= 1) score += 8;
  if (orders.length >= 1) score += 12;

  if (timeline.length >= 3) score += 6;
  if (timeline.length >= 8) score += 4;

  const healthScore = Math.min(score, 100);

  let churnRisk: "BAJO" | "MEDIO" | "ALTO" = "BAJO";
  if (healthScore < 40) churnRisk = "ALTO";
  else if (healthScore < 70) churnRisk = "MEDIO";

  let priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA" = "BAJA";
  if (opportunities.length > 0 && quotes.length > 0 && healthScore >= 70) {
    priority = "CRITICA";
  } else if (opportunities.length > 0 || quotes.length > 0) {
    priority = "ALTA";
  } else if (contacts.length > 0 || activities.length > 0) {
    priority = "MEDIA";
  }

  const executiveSummary =
    healthScore >= 75
      ? "Cuenta bien trabajada."
      : healthScore >= 50
      ? "Cuenta con base útil."
      : "Cuenta frágil.";

  return {
    healthScore,
    priority,
    churnRisk,
    nextBestAction: "",
    executiveSummary
  };
}


// =========================================================
// CUSTOMER ALERTS
// =========================================================
export function buildCustomerAlerts(
  insights: CrmAccountInsights | null,
  activities: CrmActivity[],
  contacts: CrmContact[],
  opportunities: CrmOpportunity[],
  quotes: CrmQuote[],
  orders: CrmOrder[]
): CustomerAlert[] {

  const list: CustomerAlert[] = [];

  if (insights?.churnRisk === "ALTO") {
    list.push({
      level: "CRITICAL",
      title: "Riesgo alto de pérdida",
      message: "La cuenta presenta baja actividad."
    });
  }

  const futureActivities = activities.filter(
    a => a.scheduled_at && !a.completed
  );

  if (futureActivities.length === 0) {
    list.push({
      level: "WARNING",
      title: "Sin seguimiento",
      message: "No hay actividades futuras."
    });
  }

  if (contacts.length === 0) {
    list.push({
      level: "CRITICAL",
      title: "Sin contactos",
      message: "No hay personas registradas."
    });
  }

  if (opportunities.length > 0 || quotes.length > 0) {
    list.push({
      level: "INFO",
      title: "Pipeline activo",
      message: "Procesos comerciales abiertos."
    });
  }

  if (orders.length > 0) {
    list.push({
      level: "SUCCESS",
      title: "Cliente activo",
      message: "Tiene pedidos recientes."
    });
  }

  return list;
}
