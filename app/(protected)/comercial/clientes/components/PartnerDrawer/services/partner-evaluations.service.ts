// ════════════════════════════════════════════════════════════════════════
// PARTNER EVALUATIONS SERVICE — Evaluaciones multi-criterio del partner
// ════════════════════════════════════════════════════════════════════════
// Tabla: partner_evaluations
// Aplica a TODOS los partners (clientes, proveedores, logísticos).
// Cada row es una evaluación con scores 1-5 por criterio + cualitativos.
//
// Criterios (cada uno 1-5, NULL = no aplica):
//   - quality_score       — Calidad
//   - delivery_score      — Cumplimiento de plazos / puntualidad
//   - price_score         — Competitividad de precios
//   - service_score       — Atención / soporte
//   - communication_score — Comunicación / responsividad
//   - documentation_score — Documentación / cumplimiento
//
// overall_score = promedio simple de los criterios NO nulos
// recommendation = preferred | acceptable | monitor | avoid
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

// ── Tipos ────────────────────────────────────────────────────────────
export type EvaluationRecommendation = "preferred" | "acceptable" | "monitor" | "avoid";

export type PartnerEvaluation = {
  id?:                  string;
  company_id?:          string;
  partner_id?:          string;
  evaluation_date:      string;        // ISO date "YYYY-MM-DD"
  period_label?:        string | null; // ej. "Q4 2025"
  // Criterios (1-5 o null)
  quality_score?:       number | null;
  delivery_score?:      number | null;
  price_score?:         number | null;
  service_score?:       number | null;
  communication_score?: number | null;
  documentation_score?: number | null;
  // Calculado
  overall_score?:       number | null;
  // Recomendación
  recommendation?:      EvaluationRecommendation | null;
  // Cualitativo
  comments?:            string | null;
  strengths?:           string | null;
  weaknesses?:          string | null;
  improvement_actions?: string | null;
  // Auditoría
  evaluator_id?:        string | null;
  evaluator_name?:      string | null;
  created_at?:          string;
  updated_at?:          string;
};

// ── Catálogos ────────────────────────────────────────────────────────
export const EVALUATION_CRITERIA: {
  field: keyof PartnerEvaluation;
  label: string;
  hint:  string;
}[] = [
  { field: "quality_score",       label: "Calidad",          hint: "Calidad del producto o servicio entregado." },
  { field: "delivery_score",      label: "Puntualidad",       hint: "Cumplimiento de tiempos y plazos acordados." },
  { field: "price_score",         label: "Precio",           hint: "Competitividad de precios vs el mercado." },
  { field: "service_score",       label: "Servicio",          hint: "Atención, soporte y disposición ante problemas." },
  { field: "communication_score", label: "Comunicación",      hint: "Responsividad y claridad en comunicaciones." },
  { field: "documentation_score", label: "Documentación",     hint: "Cumplimiento de entregables documentales." },
];

export const RECOMMENDATION_OPTIONS: {
  code:  EvaluationRecommendation;
  label: string;
  emoji: string;
  color: string;
  bg:    string;
}[] = [
  { code: "preferred",  label: "Preferido",  emoji: "⭐", color: "var(--color-success-text)", bg: "rgba(34, 197, 94, 0.15)"  },
  { code: "acceptable", label: "Aceptable",  emoji: "✅", color: "var(--color-text-primary)", bg: "rgba(148, 163, 184, 0.15)" },
  { code: "monitor",    label: "Monitorear", emoji: "⚠️", color: "var(--color-warning-text)", bg: "rgba(245, 158, 11, 0.15)"  },
  { code: "avoid",      label: "Evitar",     emoji: "🚫", color: "var(--color-danger-text)",  bg: "rgba(239, 68, 68, 0.15)"  },
];

// ── SELECT estándar ──────────────────────────────────────────────────
const SELECT_EVAL = `
  id, company_id, partner_id, evaluation_date, period_label,
  quality_score, delivery_score, price_score,
  service_score, communication_score, documentation_score,
  overall_score, recommendation,
  comments, strengths, weaknesses, improvement_actions,
  evaluator_id, evaluator_name, created_at, updated_at
`;

// ── Helper: calcular overall_score (promedio criterios no nulos) ─────
export function computeOverallScore(e: Partial<PartnerEvaluation>): number | null {
  const scores = [
    e.quality_score,
    e.delivery_score,
    e.price_score,
    e.service_score,
    e.communication_score,
    e.documentation_score,
  ].filter((s): s is number => typeof s === "number" && s >= 1 && s <= 5);

  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 100) / 100; // 2 decimales
}

// ── Helper: recomendación sugerida en base al overall ───────────────
export function suggestRecommendation(overall: number | null): EvaluationRecommendation {
  if (overall === null)      return "acceptable";
  if (overall >= 4.5)         return "preferred";
  if (overall >= 3.5)         return "acceptable";
  if (overall >= 2.5)         return "monitor";
  return "avoid";
}

// ── Listar evaluaciones del partner (más reciente primero) ──────────
export async function listEvaluationsByPartner(
  companyId: string,
  partnerId: string,
): Promise<PartnerEvaluation[]> {
  const { data, error } = await supabase
    .from("partner_evaluations")
    .select(SELECT_EVAL)
    .eq("company_id", companyId)
    .eq("partner_id", partnerId)
    .order("evaluation_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerEvaluation[];
}

// ── Crear nueva evaluación ───────────────────────────────────────────
export async function createEvaluation(
  companyId: string,
  partnerId: string,
  payload: Omit<PartnerEvaluation, "id" | "company_id" | "partner_id" | "overall_score" | "created_at" | "updated_at">,
  evaluatorId?:   string,
  evaluatorName?: string,
): Promise<PartnerEvaluation> {
  const overall = computeOverallScore(payload);

  const insertPayload = {
    company_id:          companyId,
    partner_id:          partnerId,
    evaluation_date:     payload.evaluation_date,
    period_label:        payload.period_label        ?? null,
    quality_score:       payload.quality_score       ?? null,
    delivery_score:      payload.delivery_score      ?? null,
    price_score:         payload.price_score         ?? null,
    service_score:       payload.service_score       ?? null,
    communication_score: payload.communication_score ?? null,
    documentation_score: payload.documentation_score ?? null,
    overall_score:       overall,
    recommendation:      payload.recommendation      ?? null,
    comments:            payload.comments            ?? null,
    strengths:           payload.strengths           ?? null,
    weaknesses:          payload.weaknesses          ?? null,
    improvement_actions: payload.improvement_actions ?? null,
    evaluator_id:        evaluatorId   ?? null,
    evaluator_name:      evaluatorName ?? null,
  };

  const { data, error } = await supabase
    .from("partner_evaluations")
    .insert(insertPayload)
    .select(SELECT_EVAL)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerEvaluation;
}

// ── Actualizar evaluación existente ─────────────────────────────────
export async function updateEvaluation(
  companyId:    string,
  evaluationId: string,
  patch:        Partial<PartnerEvaluation>,
): Promise<PartnerEvaluation> {
  // Recalcular overall si cambió algún criterio
  const updatePatch: Record<string, unknown> = { ...patch };
  const criteriaChanged =
    "quality_score"       in patch ||
    "delivery_score"      in patch ||
    "price_score"         in patch ||
    "service_score"       in patch ||
    "communication_score" in patch ||
    "documentation_score" in patch;

  if (criteriaChanged) {
    updatePatch.overall_score = computeOverallScore(patch);
  }
  // Limpiar campos que no se persisten
  delete updatePatch.id;
  delete updatePatch.company_id;
  delete updatePatch.partner_id;
  delete updatePatch.created_at;
  delete updatePatch.updated_at;

  const { data, error } = await supabase
    .from("partner_evaluations")
    .update(updatePatch)
    .eq("id", evaluationId)
    .eq("company_id", companyId)
    .select(SELECT_EVAL)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerEvaluation;
}

// ── Eliminar evaluación ──────────────────────────────────────────────
export async function deleteEvaluation(
  companyId:    string,
  evaluationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("partner_evaluations")
    .delete()
    .eq("id", evaluationId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

// ── Estadísticas agregadas del partner ──────────────────────────────
export type PartnerEvaluationStats = {
  count:                  number;
  average_overall:        number | null;
  average_quality:        number | null;
  average_delivery:       number | null;
  average_price:          number | null;
  average_service:        number | null;
  average_communication:  number | null;
  average_documentation:  number | null;
  latest_recommendation:  EvaluationRecommendation | null;
};

export function computeEvaluationStats(
  evaluations: PartnerEvaluation[],
): PartnerEvaluationStats {
  if (evaluations.length === 0) {
    return {
      count:                 0,
      average_overall:       null,
      average_quality:       null,
      average_delivery:      null,
      average_price:         null,
      average_service:       null,
      average_communication: null,
      average_documentation: null,
      latest_recommendation: null,
    };
  }

  function avg(field: keyof PartnerEvaluation): number | null {
    const vals = evaluations
      .map((e) => e[field])
      .filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }

  return {
    count:                  evaluations.length,
    average_overall:        avg("overall_score"),
    average_quality:        avg("quality_score"),
    average_delivery:       avg("delivery_score"),
    average_price:          avg("price_score"),
    average_service:        avg("service_score"),
    average_communication:  avg("communication_score"),
    average_documentation:  avg("documentation_score"),
    latest_recommendation:  evaluations[0]?.recommendation ?? null,
  };
}