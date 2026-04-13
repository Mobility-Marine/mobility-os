// ============================================================
// PROSPECTS SERVICE v2 — GOD LEVEL
// Fuente única de datos para prospectos
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Prospect, ProspectStage } from "../types/prospects.types";
import { normalizeStage, normalizeSource } from "./prospects.normalization";
import { logProspectTimelineEvent } from "./prospects.activities.service";

// ────────────────────────────────────────────────────────────
// FETCH LISTA
// ────────────────────────────────────────────────────────────

export async function fetchProspects(companyId: string): Promise<Prospect[]> {
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((p) => ({
    ...p,
    stage:            normalizeStage(p.status),
    sourceNormalized: normalizeSource(p.lead_source),
  })) as Prospect[];
}

// ────────────────────────────────────────────────────────────
// FETCH INDIVIDUAL
// ────────────────────────────────────────────────────────────

export async function fetchProspectById(
  companyId: string,
  prospectId: string
): Promise<Prospect | null> {
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .single();

  if (!data) return null;

  return {
    ...data,
    stage:            normalizeStage(data.status),
    sourceNormalized: normalizeSource(data.lead_source),
  } as Prospect;
}

// ────────────────────────────────────────────────────────────
// CREAR
// ────────────────────────────────────────────────────────────

export async function createProspect(
  companyId: string,
  payload: {
    name?:               string;
    company_name?:       string;
    email?:              string;
    phone?:              string;
    lead_source?:        string;
    interested_service?: string;
    notes?:              string;
    estimated_value?:    number;
    assigned_to?:        string;
    created_by?:         string;
    tags?:               string[];
  }
): Promise<Prospect> {
  const { data, error } = await supabase
    .from("prospects")
    .insert({
      company_id:         companyId,
      name:               payload.name               ?? null,
      company_name:       payload.company_name       ?? null,
      email:              payload.email              ?? null,
      phone:              payload.phone              ?? null,
      lead_source:        payload.lead_source        ?? "manual",
      interested_service: payload.interested_service ?? null,
      notes:              payload.notes              ?? null,
      estimated_value:    payload.estimated_value    ?? null,
      assigned_to:        payload.assigned_to        ?? null,
      created_by:         payload.created_by         ?? null,
      tags:               payload.tags               ?? null,
      status:             "new",
      is_active:          true,
    })
    .select("*")
    .single();

  if (error) throw error;

  // Log creación en timeline global
  await logProspectTimelineEvent(companyId, data.id, {
    event_type:     "created",
    event_category: "commercial",
    title:          "Prospecto creado",
    description:    data.company_name || data.name || "",
  });

  return {
    ...data,
    stage:            normalizeStage(data.status),
    sourceNormalized: normalizeSource(data.lead_source),
  } as Prospect;
}

// ────────────────────────────────────────────────────────────
// ACTUALIZAR
// ────────────────────────────────────────────────────────────

export async function updateProspect(
  prospectId: string,
  updates: Partial<Prospect>
): Promise<void> {
  const { stage, sourceNormalized, health, activities, followups,
    tasks, notes_list, estimations, timeline, ...dbUpdates } = updates;

  const { error } = await supabase
    .from("prospects")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
    .eq("id", prospectId);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// CAMBIO DE ETAPA (con log en timeline)
// ────────────────────────────────────────────────────────────

export async function updateProspectStage(
  companyId: string,
  prospectId: string,
  stage: ProspectStage
): Promise<void> {
  const { error } = await supabase
    .from("prospects")
    .update({ status: stage, updated_at: new Date().toISOString() })
    .eq("id", prospectId);

  if (error) throw error;

  await logProspectTimelineEvent(companyId, prospectId, {
    event_type:     "stage_change",
    event_category: "commercial",
    title:          `Etapa: ${stage}`,
    description:    `Movido a ${stage}`,
  });
}

// ────────────────────────────────────────────────────────────
// ARCHIVAR / MARCAR COMO PERDIDO
// ────────────────────────────────────────────────────────────

export async function archiveProspect(
  companyId: string,
  prospectId: string
): Promise<void> {
  const { error } = await supabase
    .from("prospects")
    .update({
      is_active:   false,
      status:      "lost",
      updated_at:  new Date().toISOString(),
    })
    .eq("id", prospectId);

  if (error) throw error;

  await logProspectTimelineEvent(companyId, prospectId, {
    event_type:     "lost",
    event_category: "commercial",
    title:          "Marcado como perdido",
  });
}
