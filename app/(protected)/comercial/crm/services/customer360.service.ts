// ============================================================
// CUSTOMER 360 SERVICE — Fuente única empresarial
// Tablas correctas · Sin "use client"
// ============================================================

import { supabase } from "@/lib/supabaseClient";

export async function getClient(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", clientId)
    .single();
  return data ?? null;
}

export async function getClientAccounts(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("crm_accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("archived", false);
  return data ?? [];
}

export async function getClientContacts(companyId: string, clientId: string) {
  // Traemos contactos via crm_accounts ligadas al client_id
  const { data: accounts } = await supabase
    .from("crm_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("client_id", clientId);

  if (!accounts?.length) return [];
  const accountIds = accounts.map((a) => a.id);
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .in("account_id", accountIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientActivities(companyId: string, clientId: string) {
  const { data: accounts } = await supabase
    .from("crm_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("client_id", clientId);

  if (!accounts?.length) return [];
  const accountIds = accounts.map((a) => a.id);
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .in("account_id", accountIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientOpportunities(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("opportunities")
    .select("id, name, company_name, stage, value, probability, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientQuotations(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("quotations")
    .select("id, status, total, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientShipments(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("shipments")
    .select("id, status, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientInvoices(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("id, status, amount, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientTimeline(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("entity_timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("related_client_id", clientId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getCustomer360(companyId: string, clientId: string) {
  const [
    client, accounts, contacts, activities,
    opportunities, quotations, shipments, invoices, timeline,
  ] = await Promise.all([
    getClient(companyId, clientId),
    getClientAccounts(companyId, clientId),
    getClientContacts(companyId, clientId),
    getClientActivities(companyId, clientId),
    getClientOpportunities(companyId, clientId),
    getClientQuotations(companyId, clientId),
    getClientShipments(companyId, clientId),
    getClientInvoices(companyId, clientId),
    getClientTimeline(companyId, clientId),
  ]);
  return { client, accounts, contacts, activities, opportunities, quotations, shipments, invoices, timeline };
}
