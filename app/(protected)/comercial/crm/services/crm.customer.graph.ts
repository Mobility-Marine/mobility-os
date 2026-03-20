"use client";

// ============================================================
// CUSTOMER GRAPH — Fuente única de datos de clientes
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  CrmAccount,
  CrmActivity,
  CrmContact,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
} from "../types/crm.types";

// ============================================================
// ACCOUNT MASTER
// ============================================================

export async function getAccount(accountId: string): Promise<CrmAccount | null> {
  const { data, error } = await supabase
    .from("crm_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error) return null;
  return data as CrmAccount;
}

// ============================================================
// CONTACTS
// ============================================================

export async function getAccountContacts(
  accountId: string
): Promise<CrmContact[]> {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("account_id", accountId);

  return (data || []) as CrmContact[];
}

// ============================================================
// ACTIVITIES
// ============================================================

export async function getAccountActivities(
  accountId: string
): Promise<CrmActivity[]> {
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (data || []) as CrmActivity[];
}

// ============================================================
// OPPORTUNITIES
// ============================================================

export async function getAccountOpportunities(
  accountId: string
): Promise<CrmOpportunity[]> {
  const { data } = await supabase
    .from("crm_opportunities")
    .select("*")
    .eq("account_id", accountId);

  return (data || []) as CrmOpportunity[];
}

// ============================================================
// QUOTES
// ============================================================

export async function getAccountQuotes(
  accountId: string
): Promise<CrmQuote[]> {
  const { data } = await supabase
    .from("crm_quotes")
    .select("*")
    .eq("account_id", accountId);

  return (data || []) as CrmQuote[];
}

// ============================================================
// ORDERS
// ============================================================

export async function getAccountOrders(
  accountId: string
): Promise<CrmOrder[]> {
  const { data } = await supabase
    .from("crm_orders")
    .select("*")
    .eq("account_id", accountId);

  return (data || []) as CrmOrder[];
}

// ============================================================
// FULL CUSTOMER SNAPSHOT
// ============================================================

export async function getCustomer360(accountId: string) {
  const [
    account,
    contacts,
    activities,
    opportunities,
    quotes,
    orders,
  ] = await Promise.all([
    getAccount(accountId),
    getAccountContacts(accountId),
    getAccountActivities(accountId),
    getAccountOpportunities(accountId),
    getAccountQuotes(accountId),
    getAccountOrders(accountId),
  ]);

  return {
    account,
    contacts,
    activities,
    opportunities,
    quotes,
    orders,
  };
}
