"use client";

// ============================================================
// CRM SERVICE — CUSTOMER MASTER INTEGRATION
// Fuente única de datos conectada a TODA la plataforma
// ============================================================

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


// ============================================================
// 🏢 ACCOUNTS (Customer Master conectado a clients)
// ============================================================

export async function fetchAccounts(companyId: string) {
  const { data } = await supabase
    .from("crm_accounts")
    .select(`
      *,
      client:clients (
        id,
        name,
        email,
        rfc,
        is_active
      )
    `)
    .eq("company_id", companyId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (data || []) as CrmAccount[];
}


// ============================================================
// 📄 DOCUMENTOS
// ============================================================

export async function fetchDocuments(accountId: string) {
  const { data } = await supabase
    .from("crm_documents")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  return (data || []) as CrmDocument[];
}


// ============================================================
// 📝 ACTIVIDADES
// ============================================================

export async function fetchActivities(accountId: string) {
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .eq("account_id", accountId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (data || []) as CrmActivity[];
}


// ============================================================
// 👥 CONTACTOS
// ============================================================

export async function fetchContacts(accountId: string) {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("account_id", accountId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  return (data || []) as CrmContact[];
}

// ============================================================
// 💼 RELACIONES COMERCIALES
// ============================================================

export async function fetchRelations(accountId: string) {

  const { data: opps } = await supabase
    .from("sales_opportunities")
    .select("id, name, stage, estimated_value")
    .eq("account_id", accountId);

  const { data: quotes } = await supabase
    .from("quotations")
    .select("id, total, status")
    .eq("account_id", accountId);

  const { data: orders } = await supabase
    .from("shipments")
    .select("id, status, profit")
    .eq("account_id", accountId);

  return {
    opportunities: (opps || []) as CrmOpportunity[],
    quotes: (quotes || []) as CrmQuote[],
    orders: (orders || []) as CrmOrder[],
  };
}


// ============================================================
// 🕓 TIMELINE GLOBAL DE CLIENTE
// Integra TODA la plataforma
// ============================================================

export async function fetchTimeline(accountId: string) {

  const items: any[] = [];

  // ACTIVIDADES
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


  // DOCUMENTOS
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


  // OPORTUNIDADES
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


  // COTIZACIONES
  const { data: qts } = await supabase
    .from("quotations")
    .select("*")
    .eq("account_id", accountId);

  qts?.forEach((q) => {
    items.push({
      id: q.id,
      type: "quote",
      title: `Cotización`,
      description: q.status,
      date: q.created_at,
    });
  });


  // ENVÍOS / ÓRDENES
  const { data: ords } = await supabase
    .from("shipments")
    .select("*")
    .eq("account_id", accountId);

  ords?.forEach((o) => {
    items.push({
      id: o.id,
      type: "shipment",
      title: "Envío",
      description: o.status,
      date: o.created_at,
    });
  });


  // ORDENAR
  items.sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );

  return items;
}
