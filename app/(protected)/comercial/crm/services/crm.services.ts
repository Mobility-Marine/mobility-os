"use client";

import { supabase } from "@/lib/supabaseClient";

import type {
  CrmAccount,
  CrmDocument,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  CrmContact
} from "../types/crm.types";

// =====================================================
// ===== CRM SERVICE — ACCESO A DATOS SUPABASE =====
// =====================================================

// ===== CUENTAS =====

export async function fetchAccounts(companyId: string) {
  const { data } = await supabase
    .from("crm_accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data || []) as CrmAccount[];
}

// ===== DOCUMENTOS =====

export async function fetchDocuments(accountId: string) {
  const { data } = await supabase
    .from("crm_documents")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (data || []) as CrmDocument[];
}

// ===== ACTIVIDADES =====

export async function fetchActivities(accountId: string) {
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (data || []) as CrmActivity[];
}

// ===== CONTACTOS =====

export async function fetchContacts(accountId: string) {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (data || []) as CrmContact[];
}

// ===== RELACIONES COMERCIALES =====

export async function fetchRelations(accountId: string) {
  const { data: opps } = await supabase
    .from("sales_opportunities")
    .select("id, name, stage, estimated_value")
    .eq("account_id", accountId);

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, total_amount, status")
    .eq("account_id", accountId);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount")
    .eq("account_id", accountId);

  return {
    opportunities: (opps || []) as CrmOpportunity[],
    quotes: (quotes || []) as CrmQuote[],
    orders: (orders || []) as CrmOrder[],
  };
}
