// ============================================================
// CRM SERVICE v2 — GOD LEVEL
// Fuente única de datos — tablas correctas — sin "use client"
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  CrmAccount, CrmDocument, CrmActivity, CrmContact,
  CrmOpportunity, CrmQuote, CrmOrder, TimelineItem,
  CreateAccountPayload, CreateContactPayload, CreateActivityPayload,
} from "../types/crm.types";

// ── ACCOUNTS ────────────────────────────────────────────────

export async function fetchAccounts(companyId: string): Promise<CrmAccount[]> {
  const { data } = await supabase
    .from("crm_accounts")
    .select(`*, client:clients(id, name, email, rfc, is_active)`)
    .eq("company_id", companyId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  return (data ?? []) as CrmAccount[];
}

export async function updateAccount(
  companyId: string, id: string, updates: Partial<CrmAccount>
): Promise<void> {
  const { client, ...dbUpdates } = updates as any;
  await supabase
    .from("crm_accounts")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── CONTACTS ────────────────────────────────────────────────

export async function fetchContacts(accountId: string): Promise<CrmContact[]> {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CrmContact[];
}

export async function createContact(
  companyId: string, payload: CreateContactPayload
): Promise<CrmContact> {
  const { data, error } = await supabase
    .from("crm_contacts")
    .insert({
      company_id:       companyId,
      account_id:       payload.account_id,
      first_name:       payload.first_name,
      last_name:        payload.last_name        ?? null,
      job_title:        payload.job_title        ?? null,
      department:       payload.department       ?? null,
      email:            payload.email            ?? null,
      phone:            payload.phone            ?? null,
      mobile_phone:     payload.mobile_phone     ?? null,
      role_in_decision: payload.role_in_decision ?? "user",
      influence_level:  payload.influence_level  ?? 3,
      notes:            payload.notes            ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmContact;
}

export async function deleteContact(companyId: string, id: string): Promise<void> {
  await supabase.from("crm_contacts").delete().eq("id", id).eq("company_id", companyId);
}

// ── ACTIVITIES ──────────────────────────────────────────────

export async function fetchActivities(accountId: string): Promise<CrmActivity[]> {
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CrmActivity[];
}

export async function createActivity(
  companyId: string, payload: CreateActivityPayload
): Promise<CrmActivity> {
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      company_id:   companyId,
      account_id:   payload.account_id,
      type:         payload.type,
      title:        payload.title,
      description:  payload.description  ?? null,
      scheduled_at: payload.scheduled_at ?? null,
      completed:    false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CrmActivity;
}

export async function toggleActivity(
  companyId: string, id: string, completed: boolean
): Promise<void> {
  await supabase
    .from("crm_activities")
    .update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── DOCUMENTS ───────────────────────────────────────────────

export async function fetchDocuments(accountId: string): Promise<CrmDocument[]> {
  const { data } = await supabase
    .from("crm_documents")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CrmDocument[];
}

// ── RELATIONS (connected to real tables) ────────────────────

export async function fetchRelations(
  companyId: string, accountId: string, clientId?: string | null
) {
  // Opportunities — busca por crm_account_id O client_id
  const oppFilters = clientId
    ? `crm_account_id.eq.${accountId},client_id.eq.${clientId}`
    : `crm_account_id.eq.${accountId}`;

  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, name, company_name, stage, value, probability, created_at, archived")
    .or(oppFilters)
    .eq("company_id", companyId)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(10);

  // Shipments (logística)
  const { data: shipments } = clientId ? await supabase
    .from("shipments")
    .select("id, status, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(5) : { data: [] };

  const opportunities: CrmOpportunity[] = (opps ?? []).map((o) => ({
    id:              o.id,
    name:            o.company_name ?? o.name,
    stage:           o.stage,
    estimated_value: o.value ?? null,
    value:           o.value ?? null,
    probability:     o.probability ?? null,
    created_at:      o.created_at,
  }));

  const orders: CrmOrder[] = (shipments ?? []).map((s: any) => ({
    id:           s.id,
    order_number: s.id.slice(0, 8).toUpperCase(),
    status:       s.status,
    total_amount: null,
    created_at:   s.created_at,
  }));

  return { opportunities, quotes: [] as CrmQuote[], orders };
}

// ── TIMELINE GLOBAL ─────────────────────────────────────────

export async function fetchTimeline(
  companyId: string, accountId: string
): Promise<TimelineItem[]> {
  // Usa entity_timeline_events como fuente única
  const { data: events } = await supabase
    .from("entity_timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("related_account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (events?.length) {
    return events.map((e) => ({
      id:          e.id,
      entity_type: e.entity_type,
      entity_id:   e.entity_id,
      type:        e.event_type,
      title:       e.title,
      description: e.description ?? null,
      date:        e.occurred_at ?? e.created_at,
      module_key:  e.module_key,
    }));
  }

  // Fallback: activities locales
  const { data: acts } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (acts ?? []).map((a) => ({
    id: a.id, type: "activity", title: a.title,
    description: a.type, date: a.created_at, module_key: "crm",
  }));
}

// ── CLIENT MASTER HELPERS ────────────────────────────────────

export async function findClientByName(
  companyId: string, name: string
) {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .ilike("name", name)
    .maybeSingle();
  return data ?? null;
}

export async function createGlobalClient(
  companyId: string,
  payload: { name: string; legal_name?: string; country?: string; city?: string; notes?: string }
) {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_id:  companyId,
      name:        payload.name,
      legal_name:  payload.legal_name ?? null,
      city:        payload.city       ?? null,
      country:     payload.country    ?? null,
      notes:       payload.notes      ?? null,
      is_active:   true,
      is_customer: true,
      is_supplier: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
