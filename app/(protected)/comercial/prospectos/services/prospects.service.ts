"use client";

// ============================================================
// PROSPECTS SERVICE — ENTERPRISE ACQUISITION ENGINE
// Fuente única de datos para prospectos (NO clientes)
// ============================================================

import { supabase } from "@/lib/supabaseClient";

import type {
  Prospect,
  ProspectActivity,
  ProspectFollowup,
  ProspectTask,
  ProspectStage,
} from "../types/prospects.types";

// ============================================================
// 🔁 NORMALIZACIÓN DE ETAPAS
// Convierte status legacy → etapas enterprise
// ============================================================

function normalizeStage(status: string | null): ProspectStage {
  const s = (status || "").toLowerCase();

  if (s.includes("new")) return "new";
  if (s.includes("contact")) return "contacted";
  if (s.includes("qual")) return "qualified";
  if (s.includes("prop")) return "proposal";
  if (s.includes("nego")) return "negotiation";
  if (s.includes("convert")) return "converted";
  if (s.includes("lost")) return "lost";

  return "new";
}

// ============================================================
// 🏷️ NORMALIZACIÓN DE SOURCE
// ============================================================

function normalizeSource(value: string | null) {
  const s = (value || "").toLowerCase();

  if (s.includes("refer")) return "referral";
  if (s.includes("web")) return "website";
  if (s.includes("whats")) return "whatsapp";
  if (s.includes("call")) return "call";
  if (s.includes("email")) return "email";
  if (s.includes("camp")) return "campaign";
  if (s.includes("manual")) return "manual";

  return "unknown";
}

// ============================================================
// 🔥 FETCH PROSPECTOS
// ============================================================

export async function fetchProspects(
  companyId: string
): Promise<Prospect[]> {
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((p) => ({
    ...p,
    stage: normalizeStage(p.status),
    sourceNormalized: normalizeSource(p.lead_source),
  })) as Prospect[];
}

// ============================================================
// 📊 FETCH ACTIVIDADES
// ============================================================

export async function fetchProspectActivities(
  prospectId: string
): Promise<ProspectActivity[]> {
  const { data } = await supabase
    .from("prospect_activities")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("activity_date", { ascending: false });

  return (data || []) as ProspectActivity[];
}

// ============================================================
// ⏰ FETCH FOLLOWUPS
// ============================================================

export async function fetchProspectFollowups(
  prospectId: string
): Promise<ProspectFollowup[]> {
  const { data } = await supabase
    .from("prospect_followups")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("activity_date", { ascending: false });

  return (data || []) as ProspectFollowup[];
}

// ============================================================
// ✅ FETCH TAREAS
// ============================================================

export async function fetchProspectTasks(
  prospectId: string
): Promise<ProspectTask[]> {
  const { data } = await supabase
    .from("prospect_tasks")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("due_date", { ascending: true });

  return (data || []) as ProspectTask[];
}

// ============================================================
// 🧠 FETCH SNAPSHOT COMPLETO DE PROSPECTO
// ============================================================

export async function fetchProspectSnapshot(
  prospectId: string
) {
  const [activities, followups, tasks] = await Promise.all([
    fetchProspectActivities(prospectId),
    fetchProspectFollowups(prospectId),
    fetchProspectTasks(prospectId),
  ]);

  return {
    activities,
    followups,
    tasks,
  };
}

// ============================================================
// ➕ CREAR PROSPECTO
// ============================================================

export async function createProspect(
  companyId: string,
  payload: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    lead_source?: string;
    interested_service?: string;
    notes?: string;
    estimated_value?: number;
  }
) {
  const { data, error } = await supabase
    .from("prospects")
    .insert({
      company_id: companyId,
      name: payload.name || null,
      company_name: payload.company_name || null,
      email: payload.email || null,
      phone: payload.phone || null,
      lead_source: payload.lead_source || "manual",
      interested_service: payload.interested_service || null,
      notes: payload.notes || null,
      estimated_value: payload.estimated_value || null,
      status: "new",
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as Prospect;
}

// ============================================================
// ✏️ ACTUALIZAR PROSPECTO
// ============================================================

export async function updateProspect(
  prospectId: string,
  updates: Partial<Prospect>
) {
  const { error } = await supabase
    .from("prospects")
    .update(updates)
    .eq("id", prospectId);

  if (error) throw error;
}

// ============================================================
// ❌ DESACTIVAR PROSPECTO
// (NO borrar — auditoría)
// ============================================================

export async function archiveProspect(prospectId: string) {
  const { error } = await supabase
    .from("prospects")
    .update({
      is_active: false,
      status: "lost",
    })
    .eq("id", prospectId);

  if (error) throw error;
}

// ============================================================
// 📌 CAMBIAR ETAPA PIPELINE
// ============================================================

export async function updateProspectStage(
  prospectId: string,
  stage: ProspectStage
) {
  const { error } = await supabase
    .from("prospects")
    .update({
      status: stage,
    })
    .eq("id", prospectId);

  if (error) throw error;
}

// ============================================================
// 💰 ESTIMACIONES COMERCIALES
// ============================================================

export async function fetchEstimations(prospectId: string) {
  const { data } = await supabase
    .from("prospect_estimations")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });

  return data || [];
}
