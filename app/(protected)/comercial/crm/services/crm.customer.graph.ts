// ============================================================
// CUSTOMER GRAPH — Datos por cuenta CRM
// Tablas correctas · Sin "use client"
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  CrmAccount, CrmActivity, CrmContact,
  CrmOpportunity, CrmQuote, CrmOrder,
} from "../types/crm.types";

export async function getAccount(accountId: string): Promise<CrmAccount | null> {
  const { data } = await supabase
    .from("crm_accounts")
    .select("*")
    .eq("id", accountId)
    .single();
  return (data as CrmAccount) ?? null;
}

export async function getAccountContacts(accountId: string): Promise<CrmContact[]> {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CrmContact[];
}

export async function getAccountActivities(accountId: string): Promise<CrmActivity[]> {
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CrmActivity[];
}

// Oportunidades conectadas al account (via crm_account_id o account_id)
export async function getAccountOpportunities(
  companyId: string, accountId: string, clientId?: string | null
): Promise<CrmOpportunity[]> {
  const filter = clientId
    ? `crm_account_id.eq.${accountId},client_id.eq.${clientId}`
    : `crm_account_id.eq.${accountId}`;
  const { data } = await supabase
    .from("opportunities")
    .select("id, name, company_name, stage, value, probability, created_at")
    .or(filter)
    .eq("company_id", companyId)
    .eq("archived", false);
  return (data ?? []).map((o: any) => ({
    id: o.id, name: o.company_name ?? o.name, stage: o.stage,
    estimated_value: o.value ?? null, probability: o.probability,
    created_at: o.created_at,
  }));
}

export async function getAccountQuotes(
  companyId: string, clientId?: string | null
): Promise<CrmQuote[]> {
  if (!clientId) return [];
  const { data } = await supabase
    .from("quotations")
    .select("id, status, total, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((q: any) => ({
    id: q.id, quote_number: q.id.slice(0, 8).toUpperCase(),
    total_amount: q.total ?? null, status: q.status, created_at: q.created_at,
  }));
}

export async function getAccountOrders(
  companyId: string, clientId?: string | null
): Promise<CrmOrder[]> {
  if (!clientId) return [];
  const { data } = await supabase
    .from("shipments")
    .select("id, status, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((o: any) => ({
    id: o.id, order_number: o.id.slice(0, 8).toUpperCase(),
    status: o.status, total_amount: null, created_at: o.created_at,
  }));
}

export async function getCustomer360(accountId: string) {
  const [account, contacts, activities] = await Promise.all([
    getAccount(accountId),
    getAccountContacts(accountId),
    getAccountActivities(accountId),
  ]);
  return { account, contacts, activities, opportunities: [], quotes: [], orders: [] };
}
