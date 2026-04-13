// ============================================================
// PROSPECTS NORMALIZATION v2 — GOD LEVEL
// Helpers puros, sin efectos secundarios
// ============================================================

import type {
  Prospect,
  ProspectStage,
  ProspectSource,
  ProspectActivity,
  ProspectFollowup,
  ProspectTask,
  ProspectTimelineEntry,
} from "../types/prospects.types";

import { STAGE_ORDER, ACTIVITY_CONFIG } from "../types/prospects.types";

// ────────────────────────────────────────────────────────────
// STAGE
// ────────────────────────────────────────────────────────────

export function normalizeStage(status: string | null | undefined): ProspectStage {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("new")     || s === "nuevo")         return "new";
  if (s.includes("contact") || s === "contactado")    return "contacted";
  if (s.includes("qual")    || s === "calificado")    return "qualified";
  if (s.includes("prop")    || s === "propuesta")     return "proposal";
  if (s.includes("nego")    || s === "negociación")   return "negotiation";
  if (s.includes("convert") || s === "convertido")    return "converted";
  if (s.includes("lost")    || s === "perdido")       return "lost";
  return "new";
}

export function getProspectStage(p: Prospect): ProspectStage {
  return p.stage ?? normalizeStage(p.status);
}

export function getStageWeight(stage: ProspectStage): number {
  return STAGE_ORDER.indexOf(stage);
}

// ────────────────────────────────────────────────────────────
// SOURCE
// ────────────────────────────────────────────────────────────

export function normalizeSource(value: string | null | undefined): ProspectSource {
  const s = (value || "").toLowerCase().trim();
  if (s.includes("refer"))  return "referral";
  if (s.includes("web"))    return "website";
  if (s.includes("whats"))  return "whatsapp";
  if (s.includes("call"))   return "call";
  if (s.includes("email"))  return "email";
  if (s.includes("camp"))   return "campaign";
  if (s.includes("manual")) return "manual";
  return "other";
}

// ────────────────────────────────────────────────────────────
// STATUS HELPERS
// ────────────────────────────────────────────────────────────

export function isProspectActive(p: Prospect): boolean {
  const stage = getProspectStage(p);
  return (p.is_active ?? true) && stage !== "converted" && stage !== "lost";
}

export function isProspectConvertible(p: Prospect): boolean {
  const stage = getProspectStage(p);
  return stage === "qualified" || stage === "proposal" || stage === "negotiation";
}

export function shouldMoveToOpportunity(p: Prospect): boolean {
  return (
    isProspectActive(p) &&
    (p.estimated_value ?? 0) > 0 &&
    isProspectConvertible(p)
  );
}

export function isHighValue(p: Prospect, threshold = 50_000): boolean {
  return (p.estimated_value ?? 0) >= threshold;
}

export function hasContact(p: Prospect): boolean {
  return !!(p.email || p.phone);
}

// ────────────────────────────────────────────────────────────
// DAYS SINCE
// ────────────────────────────────────────────────────────────

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now  = Date.now();
  return Math.floor((now - then) / 86_400_000);
}

export function isOverdue(p: Prospect): boolean {
  if (!p.next_follow_up && !p.next_contact_date) return false;
  const date = p.next_contact_date ?? p.next_follow_up;
  const days = daysSince(date);
  return days !== null && days > 0;
}

// ────────────────────────────────────────────────────────────
// TIMELINE BUILDER — unifica activities + followups + tasks
// ────────────────────────────────────────────────────────────

export function buildTimeline(
  activities: ProspectActivity[] = [],
  followups:  ProspectFollowup[] = [],
  tasks:      ProspectTask[] = []
): ProspectTimelineEntry[] {
  const entries: ProspectTimelineEntry[] = [];

  for (const a of activities) {
    const cfg = ACTIVITY_CONFIG[a.activity_type ?? "other"] ?? ACTIVITY_CONFIG.other;
    entries.push({
      id:         a.id,
      kind:       "activity",
      type:       a.activity_type ?? "other",
      date:       a.activity_date ?? a.created_at ?? "",
      title:      cfg.labelKey,
      body:       a.comments,
      created_by: a.created_by,
    });
  }

  for (const f of followups) {
    entries.push({
      id:         f.id,
      kind:       "followup",
      type:       f.activity_type ?? "follow_up",
      date:       f.activity_date ?? f.created_at ?? "",
      title:      "prospects.actFollowUp",
      body:       f.notes,
      created_by: null,
      metadata:   { next_action: f.next_action },
    });
  }

  for (const t of tasks) {
    entries.push({
      id:         t.id,
      kind:       "task",
      type:       t.completed ? "done" : "pending",
      date:       t.due_date,
      title:      t.title,
      body:       t.description,
      created_by: t.assigned_to,
      metadata:   { completed: t.completed, status: t.status },
    });
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ────────────────────────────────────────────────────────────
// FILTER / SORT
// ────────────────────────────────────────────────────────────

export function filterProspects(
  prospects: Prospect[],
  filters: {
    search?: string;
    stage?: ProspectStage | "all";
    onlyActive?: boolean;
    minValue?: number | null;
  }
): Prospect[] {
  return prospects.filter((p) => {
    const q = (filters.search ?? "").toLowerCase().trim();
    if (q) {
      const hit =
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.company_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q);
      if (!hit) return false;
    }

    if (filters.stage && filters.stage !== "all") {
      if (getProspectStage(p) !== filters.stage) return false;
    }

    if (filters.onlyActive) {
      if (!isProspectActive(p)) return false;
    }

    if (filters.minValue != null && (p.estimated_value ?? 0) < filters.minValue) {
      return false;
    }

    return true;
  });
}

export function sortProspectsByValue(prospects: Prospect[]): Prospect[] {
  return [...prospects].sort((a, b) => (b.estimated_value ?? 0) - (a.estimated_value ?? 0));
}

export function groupByStage(prospects: Prospect[]): Record<ProspectStage, Prospect[]> {
  const result: Record<ProspectStage, Prospect[]> = {
    new: [], contacted: [], qualified: [],
    proposal: [], negotiation: [], converted: [], lost: [],
  };
  for (const p of prospects) {
    result[getProspectStage(p)].push(p);
  }
  return result;
}

// ────────────────────────────────────────────────────────────
// PIPELINE METRICS
// ────────────────────────────────────────────────────────────

export function getPipelineValue(prospects: Prospect[]): number {
  return prospects.reduce((sum, p) => sum + (p.estimated_value ?? 0), 0);
}

export function getConversionRate(prospects: Prospect[]): number {
  if (!prospects.length) return 0;
  const converted = prospects.filter((p) => getProspectStage(p) === "converted").length;
  return Math.round((converted / prospects.length) * 100);
}
