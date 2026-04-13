// ============================================================
// OPPORTUNITIES NORMALIZATION v1 — GOD LEVEL
// ============================================================

import type { Opportunity, OpportunityStage, OpportunityFilters, ForecastSnapshot } from "../types/opportunities.types";
import { STAGE_CONFIG, STAGE_ORDER } from "../types/opportunities.types";

export function getOpportunityStage(o: Opportunity): OpportunityStage {
  return (o.stage ?? "qualification") as OpportunityStage;
}

export function isOpenOpportunity(o: Opportunity): boolean {
  const stage = getOpportunityStage(o);
  return stage !== "won" && stage !== "lost" && !(o.archived ?? false);
}

export function agingDays(o: Opportunity): number {
  return Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86_400_000);
}

export function isStalled(o: Opportunity): boolean {
  if (!isOpenOpportunity(o)) return false;
  const cfg = STAGE_CONFIG[getOpportunityStage(o)];
  return cfg.maxDays > 0 && agingDays(o) > cfg.maxDays;
}

export function expectedRevenue(o: Opportunity): number {
  return (o.value ?? 0) * ((o.probability ?? 0) / 100);
}

export function priorityIndex(o: Opportunity): number {
  const valueFactor = Math.min((o.value ?? 0) / 50_000, 1) * 40;
  const probFactor  = (o.probability ?? 0) * 0.4;
  const agePenalty  = Math.min(agingDays(o) / 30, 1) * 20;
  return Math.round(valueFactor + probFactor + agePenalty);
}

export function governanceAlert(o: Opportunity): string | undefined {
  const cfg = STAGE_CONFIG[getOpportunityStage(o)];
  const age = agingDays(o);
  if (cfg.maxDays > 0 && age > cfg.maxDays)
    return `opportunities.alertStalled`;
  if (cfg.requiresAction && !o.next_action)
    return `opportunities.alertMissingAction`;
  if (o.probability !== cfg.probability)
    return `opportunities.alertProbabilityMismatch`;
  return undefined;
}

export function filterOpportunities(
  opportunities: Opportunity[],
  filters: Partial<OpportunityFilters>
): Opportunity[] {
  const q = (filters.search ?? "").trim().toLowerCase();
  return opportunities.filter((o) => {
    if (filters.onlyOpen && !isOpenOpportunity(o)) return false;
    if (filters.stage && filters.stage !== "all" && getOpportunityStage(o) !== filters.stage) return false;
    if (q) {
      return (
        o.name?.toLowerCase().includes(q) ||
        o.company_name?.toLowerCase().includes(q) ||
        o.owner?.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export function buildForecastSnapshot(
  opportunities: Opportunity[],
  target = 100_000
): ForecastSnapshot {
  const pipeline = opportunities
    .filter(isOpenOpportunity)
    .reduce((s, o) => s + (o.value ?? 0), 0);

  const weighted = opportunities
    .filter(isOpenOpportunity)
    .reduce((s, o) => s + expectedRevenue(o), 0);

  const commit = opportunities
    .filter((o) => ["commit", "won"].includes(getOpportunityStage(o)))
    .reduce((s, o) => s + (o.value ?? 0), 0);

  const bestCase = opportunities
    .filter((o) => ["proposal", "negotiation", "commit", "won"].includes(getOpportunityStage(o)))
    .reduce((s, o) => s + (o.value ?? 0), 0);

  return {
    pipeline,
    weighted,
    commit,
    bestCase,
    gap:      Math.max(target - commit, 0),
    coverage: target > 0 ? Number((pipeline / target).toFixed(2)) : 0,
    target,
  };
}

export function groupByStage(opportunities: Opportunity[]): Record<OpportunityStage, Opportunity[]> {
  const result = {} as Record<OpportunityStage, Opportunity[]>;
  for (const stage of STAGE_ORDER) result[stage] = [];
  for (const o of opportunities) result[getOpportunityStage(o)]?.push(o);
  return result;
}

export function getTopOpportunities(opportunities: Opportunity[], limit = 3): Opportunity[] {
  return opportunities
    .filter(isOpenOpportunity)
    .sort((a, b) => priorityIndex(b) - priorityIndex(a))
    .slice(0, limit);
}

export function getCriticalDeal(opportunities: Opportunity[]): Opportunity | null {
  const open = opportunities.filter(isOpenOpportunity);
  if (!open.length) return null;
  return open.sort((a, b) => priorityIndex(b) - priorityIndex(a))[0];
}

export function getAverageAging(opportunities: Opportunity[]): number {
  const open = opportunities.filter(isOpenOpportunity);
  if (!open.length) return 0;
  return Math.round(open.reduce((s, o) => s + agingDays(o), 0) / open.length);
}
