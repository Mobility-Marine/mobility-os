// ============================================================
// PROSPECTS INTELLIGENCE ENGINE v2 — GOD LEVEL
// Score, riesgo, conversión, next best action
// Todos los strings son KEYS de i18n — nunca texto literal
// ============================================================

import type {
  Prospect,
  ProspectActivity,
  ProspectTask,
  ProspectFollowup,
  ProspectHealth,
  ProspectRiskLevel,
} from "../types/prospects.types";

import {
  getProspectStage,
  hasContact,
  daysSince,
  isOverdue,
} from "./prospects.normalization";

// ────────────────────────────────────────────────────────────
// MAIN BUILDER
// ────────────────────────────────────────────────────────────

export function buildProspectHealth(input: {
  prospect:   Prospect;
  activities?: ProspectActivity[];
  tasks?:      ProspectTask[];
  followups?:  ProspectFollowup[];
}): ProspectHealth {
  const { prospect, activities = [], tasks = [], followups = [] } = input;
  const stage = getProspectStage(prospect);

  // ── Score ──────────────────────────────────────────────
  let score = 0;

  // Data completeness (max 40)
  if (prospect.name || prospect.company_name) score += 10;
  if (prospect.email)                         score += 10;
  if (prospect.phone)                         score += 5;
  if (prospect.interested_service)            score += 5;
  if ((prospect.estimated_value ?? 0) > 0)   score += 10;

  // Engagement (max 30)
  if (activities.length > 0)  score += 10;
  if (followups.length > 0)   score += 10;
  if (tasks.length > 0)       score += 5;
  if (prospect.notes)         score += 5;

  // Pipeline progress (max 30)
  const stageScores: Record<string, number> = {
    new: 0, contacted: 5, qualified: 10,
    proposal: 15, negotiation: 20, converted: 30,
  };
  score += stageScores[stage] ?? 0;
  if (stage === "lost") score = Math.max(score - 20, 0);

  score = Math.min(score, 100);

  // ── Conversion probability ─────────────────────────────
  const baseProbability: Record<string, number> = {
    new: 5, contacted: 20, qualified: 40,
    proposal: 60, negotiation: 80, converted: 100, lost: 0,
  };
  let conversionProbability = baseProbability[stage] ?? 5;
  if ((prospect.estimated_value ?? 0) >= 50_000) conversionProbability += 5;
  if (!hasContact(prospect)) conversionProbability -= 15;
  if (activities.length >= 3) conversionProbability += 5;
  conversionProbability = Math.max(0, Math.min(100, conversionProbability));

  // ── Risk level ─────────────────────────────────────────
  let riskLevel: ProspectRiskLevel = "LOW";
  if (stage === "lost")                      riskLevel = "CRITICAL";
  else if (!hasContact(prospect))            riskLevel = "HIGH";
  else if (isOverdue(prospect))              riskLevel = "HIGH";
  else if (activities.length === 0 && followups.length === 0) riskLevel = "MEDIUM";
  else if (conversionProbability < 30)       riskLevel = "MEDIUM";

  // ── Days since last activity ───────────────────────────
  const lastActivityDate = activities[0]?.activity_date ?? activities[0]?.created_at;
  const daysSinceActivity = daysSince(lastActivityDate);

  // ── Next best action (returns i18n key) ───────────────
  let nextBestActionKey = "prospects.actionRegisterActivity";

  if (!hasContact(prospect)) {
    nextBestActionKey = "prospects.actionGetContact";
  } else if (stage === "new") {
    nextBestActionKey = "prospects.actionFirstContact";
  } else if (stage === "contacted") {
    nextBestActionKey = "prospects.actionQualify";
  } else if (stage === "qualified") {
    nextBestActionKey = "prospects.actionPrepareProposal";
  } else if (stage === "proposal") {
    nextBestActionKey = "prospects.actionFollowProposal";
  } else if (stage === "negotiation") {
    nextBestActionKey = "prospects.actionCloseOrConvert";
  } else if (stage === "converted") {
    nextBestActionKey = "prospects.actionMoveToOpportunity";
  } else if (stage === "lost") {
    nextBestActionKey = "prospects.actionAnalyzeLoss";
  } else if (isOverdue(prospect)) {
    nextBestActionKey = "prospects.actionOverdueFollowUp";
  }

  // ── Summary key ────────────────────────────────────────
  let summaryKey = "prospects.summaryWeak";
  if (score >= 75) summaryKey = "prospects.summaryStrong";
  else if (score >= 50) summaryKey = "prospects.summaryViable";

  return {
    score,
    conversionProbability,
    riskLevel,
    nextBestActionKey,
    summaryKey,
    daysSinceActivity,
    isOverdue: isOverdue(prospect),
  };
}

// ────────────────────────────────────────────────────────────
// COMMAND CENTER SNAPSHOT
// ────────────────────────────────────────────────────────────

export function buildCommandSnapshot(prospects: Prospect[]) {
  return {
    hotProspects: prospects
      .filter((p) => (p.estimated_value ?? 0) >= 50_000 &&
        !["converted", "lost"].includes(getProspectStage(p)))
      .sort((a, b) => (b.estimated_value ?? 0) - (a.estimated_value ?? 0))
      .slice(0, 5),

    overdueFollowUps: prospects
      .filter((p) => isOverdue(p) && !["converted", "lost"].includes(getProspectStage(p)))
      .slice(0, 5),

    noActivityProspects: prospects
      .filter((p) => {
        const days = daysSince(p.created_at);
        return days !== null && days > 7 &&
          !["converted", "lost"].includes(getProspectStage(p)) &&
          !(p.activities?.length);
      })
      .slice(0, 5),

    conversionCandidates: prospects
      .filter((p) => {
        const stage = getProspectStage(p);
        return ["qualified", "proposal", "negotiation"].includes(stage) &&
          (p.estimated_value ?? 0) > 0;
      })
      .sort((a, b) => (b.estimated_value ?? 0) - (a.estimated_value ?? 0))
      .slice(0, 5),

    atRisk: prospects
      .filter((p) => {
        const stage = getProspectStage(p);
        const health = p.health;
        return !["converted", "lost"].includes(stage) &&
          (health?.riskLevel === "HIGH" || health?.riskLevel === "CRITICAL");
      })
      .slice(0, 5),
  };
}
