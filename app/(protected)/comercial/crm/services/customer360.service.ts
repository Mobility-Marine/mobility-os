"use client";

// ============================================================
// 👑 CUSTOMER 360 SERVICE — Fuente única empresarial
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// 🏢 CLIENTE GLOBAL
// ============================================================

export async function getClient(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", clientId)
    .single();

  return data || null;
}

// ============================================================
// 📊 CUENTAS CRM RELACIONADAS
// ============================================================

export async function getClientAccounts(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("crm_accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("archived", false);

  return data || [];
}

// ============================================================
// 👥 CONTACTOS
// ============================================================

export async function getClientContacts(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("crm_contacts")
    .select(`
      *,
      crm_accounts!inner (
        client_id
      )
    `)
    .eq("company_id", companyId)
    .eq("crm_accounts.client_id", clientId)
    .eq("archived", false);

  return data || [];
}

// ============================================================
// 📝 ACTIVIDADES
// ============================================================

export async function getClientActivities(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("crm_activities")
    .select(`
      *,
      crm_accounts!inner (
        client_id
      )
    `)
    .eq("company_id", companyId)
    .eq("crm_accounts.client_id", clientId)
    .eq("archived", false);

  return data || [];
}

// ============================================================
// 💼 OPORTUNIDADES
// ============================================================

export async function getClientOpportunities(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("sales_opportunities")
    .select(`
      *,
      crm_accounts!inner (
        client_id
      )
    `)
    .eq("company_id", companyId)
    .eq("crm_accounts.client_id", clientId);

  return data || [];
}

// ============================================================
// 💰 COTIZACIONES
// ============================================================

export async function getClientQuotations(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("quotations")
    .select(`
      *,
      crm_accounts!inner (
        client_id
      )
    `)
    .eq("company_id", companyId)
    .eq("crm_accounts.client_id", clientId);

  return data || [];
}

// ============================================================
// 🚚 OPERACIONES / ENVÍOS
// ============================================================

export async function getClientShipments(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("shipments")
    .select(`
      *,
      quotations!inner (
        client_id
      )
    `)
    .eq("company_id", companyId)
    .eq("quotations.client_id", clientId);

  return data || [];
}

// ============================================================
// 🧾 FACTURACIÓN
// ============================================================

export async function getClientInvoices(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId);

  return data || [];
}

// ============================================================
// 🕓 TIMELINE GLOBAL (TODOS LOS MÓDULOS)
// ============================================================

export async function getClientTimeline(
  companyId: string,
  clientId: string
) {
  const { data } = await supabase
    .from("entity_timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("related_client_id", clientId)
    .order("occurred_at", { ascending: false });

  return data || [];
}

// ============================================================
// 🌐 SNAPSHOT COMPLETO 360
// ============================================================

export async function getCustomer360(
  companyId: string,
  clientId: string
) {
  const [
    client,
    accounts,
    contacts,
    activities,
    opportunities,
    quotations,
    shipments,
    invoices,
    timeline,
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

  return {
    client,
    accounts,
    contacts,
    activities,
    opportunities,
    quotations,
    shipments,
    invoices,
    timeline,
  };
}
