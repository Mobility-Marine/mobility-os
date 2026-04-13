// ============================================================
// OPPORTUNITIES INTELLIGENCE v1 — GOD LEVEL
// Revenue AI Director · CFO Forecast · Predictive Engine
// Todos los strings retornan i18n keys
// ============================================================

import type { Opportunity, OpportunityHealth, ForecastSnapshot } from "../types/opportunities.types";
import {
  getOpportunityStage, isOpenOpportunity, agingDays, expectedRevenue,
  priorityIndex, isStalled, governanceAlert, buildForecastSnapshot,
  getCriticalDeal,
} from "./opportunities.normalization";
import { STAGE_CONFIG } from "../types/opportunities.types";

export function buildOpportunityHealth(o: Opportunity): OpportunityHealth {
  const stage   = getOpportunityStage(o);
  const cfg     = STAGE_CONFIG[stage];
  const age     = agingDays(o);
  const prob    = o.probability ?? 0;
  const val     = o.value ?? 0;

  // Score 0-100
  const valueScore = Math.min(val / 100_000, 1) * 40;
  const probScore  = prob * 0.5;
  const agePenalty = Math.min(age / 30, 1) * 20;
  const score      = Math.round(Math.max(0, Math.min(100, valueScore + probScore - agePenalty)));

  // Risk
  const riskLevel: OpportunityHealth["riskLevel"] =
    prob < 30 ? "CRITICAL" :
    prob < 50 ? "HIGH" :
    prob < 70 ? "MEDIUM" : "LOW";

  // Closing score
  const closingScore = Math.round(Math.min(val / 100_000, 1) * 40 + prob * 0.6);

  // Loss risk
  const lossRisk: OpportunityHealth["lossRisk"] =
    (prob < 30 && age > 20) ? "HIGH" :
    (prob < 50 && age > 15) ? "MEDIUM" : "LOW";

  // Next best action key
  const nextBestActionKey =
    stage === "qualification" ? "opportunities.actionQualify" :
    stage === "discovery"     ? "opportunities.actionDiscover" :
    stage === "proposal"      ? "opportunities.actionFollowProposal" :
    stage === "negotiation"   ? "opportunities.actionNegotiate" :
    stage === "commit"        ? "opportunities.actionClose" :
    stage === "won"           ? "opportunities.actionOnboard" :
    "opportunities.actionAnalyzeLoss";

  // Summary key
  const summaryKey =
    score >= 75 ? "opportunities.summaryStrong" :
    score >= 50 ? "opportunities.summaryViable" :
    "opportunities.summaryWeak";

  return {
    score,
    riskLevel,
    closingScore,
    lossRisk,
    expectedRevenue:   expectedRevenue(o),
    priorityIndex:     priorityIndex(o),
    agingDays:         age,
    isStalled:         isStalled(o),
    governanceAlert:   governanceAlert(o),
    nextBestActionKey,
    summaryKey,
  };
}

export type PipelineDirective = {
  titleKey:   string;
  messageKey: string;
  urgency:    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  focusKey:   string;
};

export function buildRevenueAIDirective(opportunities: Opportunity[]): PipelineDirective {
  const open = opportunities.filter(isOpenOpportunity);

  if (!open.length) return {
    titleKey:   "opportunities.directiveNoDeals",
    messageKey: "opportunities.directiveNoDealsDesc",
    urgency:    "HIGH",
    focusKey:   "opportunities.focusPipeline",
  };

  const highRisk = open.filter((o) => (o.probability ?? 0) < 40);
  const stalled  = open.filter(isStalled);
  const forecast = buildForecastSnapshot(open);

  if (highRisk.length > open.length * 0.5) return {
    titleKey:   "opportunities.directiveHighRisk",
    messageKey: "opportunities.directiveHighRiskDesc",
    urgency:    "CRITICAL",
    focusKey:   "opportunities.focusRisk",
  };

  if (stalled.length > 0) return {
    titleKey:   "opportunities.directiveStalled",
    messageKey: "opportunities.directives StalledDesc",
    urgency:    "HIGH",
    focusKey:   "opportunities.focusReactivation",
  };

  if (forecast.weighted < forecast.pipeline * 0.3) return {
    titleKey:   "opportunities.directiveWeakForecast",
    messageKey: "opportunities.directiveWeakForecastDesc",
    urgency:    "MEDIUM",
    focusKey:   "opportunities.focusAcceleration",
  };

  return {
    titleKey:   "opportunities.directivePushDeal",
    messageKey: "opportunities.directivePushDealDesc",
    urgency:    "MEDIUM",
    focusKey:   "opportunities.focusClose",
  };
}

export type ForecastHealth = {
  titleKey:   string;
  messageKey: string;
  level:      "STRONG" | "MEDIUM" | "WEAK" | "CRITICAL";
};

export function buildForecastHealth(snap: ForecastSnapshot): ForecastHealth {
  if (snap.commit >= snap.target) return {
    titleKey:   "opportunities.forecastStrong",
    messageKey: "opportunities.forecastStrongDesc",
    level:      "STRONG",
  };
  if (snap.bestCase >= snap.target) return {
    titleKey:   "opportunities.forecastMedium",
    messageKey: "opportunities.forecastMediumDesc",
    level:      "MEDIUM",
  };
  if (snap.weighted < snap.target * 0.5) return {
    titleKey:   "opportunities.forecastWeak",
    messageKey: "opportunities.forecastWeakDesc",
    level:      "CRITICAL",
  };
  return {
    titleKey:   "opportunities.forecastVigilance",
    messageKey: "opportunities.forecastVigilanceDesc",
    level:      "WEAK",
  };
}
