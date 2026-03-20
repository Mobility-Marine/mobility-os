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

// ============================================================
// ===== TIMELINE UNIFICADO DE CUENTA =====
// ============================================================

export async function fetchTimeline(accountId: string) {
  const items: any[] = [];

  const { data: acts } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId);

  acts?.forEach((a) => {
    items.push({
      id: a.id,
      type: "activity",
      title: a.title,
      description: a.type,
      date: a.created_at,
    });
  });

  const { data: docs } = await supabase
    .from("crm_documents")
    .select("*")
    .eq("account_id", accountId);

  docs?.forEach((d) => {
    items.push({
      id: d.id,
      type: "document",
      title: d.name,
      date: d.created_at,
    });
  });

  const { data: opps } = await supabase
    .from("sales_opportunities")
    .select("*")
    .eq("account_id", accountId);

  opps?.forEach((o) => {
    items.push({
      id: o.id,
      type: "opportunity",
      title: o.name,
      description: o.stage,
      date: o.created_at,
    });
  });

  const { data: qts } = await supabase
    .from("quotes")
    .select("*")
    .eq("account_id", accountId);

  qts?.forEach((q) => {
    items.push({
      id: q.id,
      type: "quote",
      title: q.quote_number,
      description: q.status,
      date: q.created_at,
    });
  });

  const { data: ords } = await supabase
    .from("orders")
    .select("*")
    .eq("account_id", accountId);

  ords?.forEach((o) => {
    items.push({
      id: o.id,
      type: "order",
      title: o.order_number,
      description: o.status,
      date: o.created_at,
    });
  });

  items.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return items;
}
