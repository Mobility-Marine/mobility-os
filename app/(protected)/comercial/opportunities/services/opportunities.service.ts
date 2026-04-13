// ============================================================
// OPPORTUNITIES SERVICE v1 — GOD LEVEL
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Opportunity, OpportunityStage, CreateOpportunityPayload, OpportunityActivity } from "../types/opportunities.types";
import { STAGE_CONFIG } from "../types/opportunities.types";

export async function fetchOpportunities(companyId: string): Promise<Opportunity[]> {
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("company_id", companyId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  return (data ?? []) as Opportunity[];
}

export async function fetchOpportunityById(
  companyId: string, id: string
): Promise<Opportunity | null> {
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  return data as Opportunity | null;
}

export async function createOpportunity(
  companyId: string,
  payload: CreateOpportunityPayload
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      company_id:    companyId,
      name:          payload.name,
      company_name:  payload.company_name  ?? null,
      value:         payload.value         ?? 0,
      probability:   payload.probability   ?? 10,
      stage:         "qualification",
      owner:         payload.owner         ?? null,
      next_action:   payload.next_action   ?? null,
      client_id:     payload.client_id     ?? null,
      crm_account_id:       payload.crm_account_id       ?? null,
      source_prospect_id:   payload.source_prospect_id   ?? null,
      archived:      false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Opportunity;
}

export async function updateOpportunity(
  companyId: string,
  id: string,
  updates: Partial<Opportunity>
): Promise<void> {
  const { health, activities, ...dbUpdates } = updates as any;
  const { error } = await supabase
    .from("opportunities")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function updateOpportunityStage(
  companyId: string,
  id: string,
  stage: OpportunityStage
): Promise<void> {
  const cfg = STAGE_CONFIG[stage];
  const { error } = await supabase
    .from("opportunities")
    .update({ stage, probability: cfg.probability, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function archiveOpportunity(
  companyId: string, id: string
): Promise<void> {
  const { error } = await supabase
    .from("opportunities")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw error;
}

// ── ACTIVITIES ──────────────────────────────────────────────

export async function fetchOpportunityActivities(
  companyId: string, opportunityId: string
): Promise<OpportunityActivity[]> {
  const { data } = await supabase
    .from("opportunity_activities")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as OpportunityActivity[];
}

export async function addOpportunityActivity(
  companyId: string,
  opportunityId: string,
  payload: { description: string; type?: string }
): Promise<OpportunityActivity> {
  const { data, error } = await supabase
    .from("opportunity_activities")
    .insert({
      opportunity_id: opportunityId,
      company_id:     companyId,
      description:    payload.description,
      type:           payload.type ?? "task",
      completed:      false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as OpportunityActivity;
}

export async function toggleOpportunityActivity(
  companyId: string, id: string, completed: boolean
): Promise<void> {
  await supabase
    .from("opportunity_activities")
    .update({ completed: !completed })
    .eq("id", id)
    .eq("company_id", companyId);
}
