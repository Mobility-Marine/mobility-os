// ============================================================
// PROSPECTS ACTIVITIES SERVICE v2 — GOD LEVEL
// CRUD completo: actividades + notas + tareas + timeline global
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  ProspectActivity,
  ProspectNote,
  ProspectTask,
  ProspectFollowup,
  CreateActivityPayload,
  CreateNotePayload,
  CreateTaskPayload,
  ActivityType,
} from "../types/prospects.types";

// ────────────────────────────────────────────────────────────
// ACTIVIDADES
// ────────────────────────────────────────────────────────────

export async function getProspectActivities(
  companyId: string,
  prospectId: string
): Promise<ProspectActivity[]> {
  const { data } = await supabase
    .from("prospect_activities")
    .select("*")
    .eq("company_id", companyId)
    .eq("prospect_id", prospectId)
    .order("activity_date", { ascending: false });
  return (data ?? []) as ProspectActivity[];
}

export async function createProspectActivity(
  companyId: string,
  prospectId: string,
  userId: string,
  payload: CreateActivityPayload
): Promise<ProspectActivity> {
  const { data, error } = await supabase
    .from("prospect_activities")
    .insert({
      company_id:    companyId,
      prospect_id:   prospectId,
      created_by:    userId,
      activity_type: payload.activity_type,
      activity_date: payload.activity_date,
      comments:      payload.comments ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  // Log en timeline global
  await logProspectTimelineEvent(companyId, prospectId, {
    event_type:    payload.activity_type,
    event_category:"commercial",
    title:         payload.activity_type,
    description:   payload.comments ?? "",
  });

  return data as ProspectActivity;
}

export async function deleteProspectActivity(
  activityId: string
): Promise<void> {
  const { error } = await supabase
    .from("prospect_activities")
    .delete()
    .eq("id", activityId);
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// NOTAS
// ────────────────────────────────────────────────────────────

export async function getProspectNotes(
  companyId: string,
  prospectId: string
): Promise<ProspectNote[]> {
  const { data } = await supabase
    .from("prospect_notes")
    .select("*")
    .eq("company_id", companyId)
    .eq("prospect_id", prospectId)
    .order("is_pinned", { ascending: false })
    .order("created_at",  { ascending: false });
  return (data ?? []) as ProspectNote[];
}

export async function createProspectNote(
  companyId: string,
  prospectId: string,
  userId: string,
  payload: CreateNotePayload
): Promise<ProspectNote> {
  const { data, error } = await supabase
    .from("prospect_notes")
    .insert({
      company_id:  companyId,
      prospect_id: prospectId,
      created_by:  userId,
      content:     payload.content,
      is_pinned:   payload.is_pinned ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ProspectNote;
}

export async function updateProspectNote(
  noteId: string,
  updates: { content?: string; is_pinned?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from("prospect_notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", noteId);
  if (error) throw error;
}

export async function deleteProspectNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from("prospect_notes")
    .delete()
    .eq("id", noteId);
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// TAREAS
// ────────────────────────────────────────────────────────────

export async function getProspectTasks(
  companyId: string,
  prospectId: string
): Promise<ProspectTask[]> {
  const { data } = await supabase
    .from("prospect_tasks")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("due_date", { ascending: true });
  return (data ?? []) as ProspectTask[];
}

export async function createProspectTask(
  companyId: string,
  prospectId: string,
  payload: CreateTaskPayload
): Promise<ProspectTask> {
  const { data, error } = await supabase
    .from("prospect_tasks")
    .insert({
      prospect_id:  prospectId,
      title:        payload.title,
      description:  payload.description ?? null,
      due_date:     payload.due_date,
      assigned_to:  payload.assigned_to ?? null,
      status:       "pending",
      completed:    false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ProspectTask;
}

export async function completeProspectTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("prospect_tasks")
    .update({ completed: true, status: "done" })
    .eq("id", taskId);
  if (error) throw error;
}

export async function deleteProspectTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("prospect_tasks")
    .delete()
    .eq("id", taskId);
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// FOLLOWUPS
// ────────────────────────────────────────────────────────────

export async function getProspectFollowups(
  prospectId: string
): Promise<ProspectFollowup[]> {
  const { data } = await supabase
    .from("prospect_followups")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("activity_date", { ascending: false });
  return (data ?? []) as ProspectFollowup[];
}

// ────────────────────────────────────────────────────────────
// TIMELINE GLOBAL (entity_timeline_events)
// ────────────────────────────────────────────────────────────

export async function getProspectTimeline(
  companyId: string,
  prospectId: string
) {
  const { data } = await supabase
    .from("entity_timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("related_prospect_id", prospectId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function logProspectTimelineEvent(
  companyId: string,
  prospectId: string,
  event: {
    event_type:     string;
    event_category: string;
    title:          string;
    description?:   string;
    metadata?:      Record<string, any>;
  }
) {
  await supabase.from("entity_timeline_events").insert({
    company_id:         companyId,
    entity_type:        "prospect",
    entity_id:          prospectId,
    related_prospect_id:prospectId,
    module_key:         "prospects",
    event_type:         event.event_type,
    event_category:     event.event_category,
    title:              event.title,
    description:        event.description ?? null,
  });
}

// ────────────────────────────────────────────────────────────
// SNAPSHOT COMPLETO (carga todo en paralelo)
// ────────────────────────────────────────────────────────────

export async function fetchProspectSnapshot(
  companyId: string,
  prospectId: string
) {
  const [activities, notes, tasks, followups, timeline] = await Promise.all([
    getProspectActivities(companyId, prospectId),
    getProspectNotes(companyId, prospectId),
    getProspectTasks(companyId, prospectId),
    getProspectFollowups(prospectId),
    getProspectTimeline(companyId, prospectId),
  ]);
  return { activities, notes, tasks, followups, timeline };
}
