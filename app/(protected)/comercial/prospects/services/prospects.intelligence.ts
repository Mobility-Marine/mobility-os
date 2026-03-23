"use client";

// ============================================================
// 🧠 PROSPECTS INTELLIGENCE ENGINE
// Score, riesgo, conversión y next best action
// ============================================================

import type {
  Prospect,
  ProspectActivity,
  ProspectTask,
  ProspectFollowup,
} from "../types/prospects.types";

export type ProspectHealth = {
  score: number;
  conversionProbability: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  nextBestAction: string;
  summary: string;
};

export function buildProspectHealth(input: {
  prospect: Prospect;
  activities?: ProspectActivity[];
  tasks?: ProspectTask[];
  followups?: ProspectFollowup[];
}): ProspectHealth {
  const { prospect, activities = [], tasks = [], followups = [] } = input;

  let score = 0;

  if (prospect.name || prospect.company_name) score += 10;
  if (prospect.email) score += 10;
  if (prospect.phone) score += 10;
  if (prospect.interested_service) score += 10;
  if (prospect.estimated_value && prospect.estimated_value > 0) score += 15;
  if (prospect.notes) score += 5;
  if (activities.length > 0) score += 10;
  if (followups.length > 0) score += 10;
  if (tasks.length > 0) score += 5;

  const stage = (prospect.stage || prospect.status || "new").toLowerCase();

  if (stage === "contacted") score += 5;
  if (stage === "qualified") score += 10;
  if (stage === "proposal") score += 15;
  if (stage === "negotiation") score += 20;
  if (stage === "converted") score += 25;
  if (stage === "lost") score = Math.max(score - 20, 0);

  score = Math.min(score, 100);

  let conversionProbability = 10;
  if (stage === "contacted") conversionProbability = 20;
  else if (stage === "qualified") conversionProbability = 40;
  else if (stage === "proposal") conversionProbability = 60;
  else if (stage === "negotiation") conversionProbability = 80;
  else if (stage === "converted") conversionProbability = 100;
  else if (stage === "lost") conversionProbability = 0;

  if (prospect.estimated_value && prospect.estimated_value >= 50000) {
    conversionProbability += 5;
  }

  if (!prospect.email && !prospect.phone) {
    conversionProbability -= 10;
  }

  conversionProbability = Math.max(0, Math.min(100, conversionProbability));

  let riskLevel: ProspectHealth["riskLevel"] = "LOW";

  if (!prospect.email && !prospect.phone) riskLevel = "HIGH";
  if ((activities.length === 0 && followups.length === 0) || !prospect.next_follow_up) {
    riskLevel = "MEDIUM";
  }
  if (stage === "lost") riskLevel = "CRITICAL";

  let nextBestAction = "Registrar siguiente actividad";

  if (!prospect.email && !prospect.phone) {
    nextBestAction = "Conseguir datos de contacto";
  } else if (stage === "new") {
    nextBestAction = "Primer acercamiento comercial";
  } else if (stage === "contacted") {
    nextBestAction = "Calificar necesidad y presupuesto";
  } else if (stage === "qualified") {
    nextBestAction = "Preparar propuesta";
  } else if (stage === "proposal") {
    nextBestAction = "Dar seguimiento a propuesta";
  } else if (stage === "negotiation") {
    nextBestAction = "Cerrar acuerdo o convertir";
  } else if (stage === "converted") {
    nextBestAction = "Mover a oportunidad / CRM";
  } else if (stage === "lost") {
    nextBestAction = "Analizar causa de pérdida";
  }

  const summary =
    score >= 75
      ? "Prospecto fuerte con buena probabilidad comercial."
      : score >= 50
      ? "Prospecto viable, requiere seguimiento disciplinado."
      : "Prospecto débil o incompleto, necesita fortalecerse.";

  return {
    score,
    conversionProbability,
    riskLevel,
    nextBestAction,
    summary,
  };
}
