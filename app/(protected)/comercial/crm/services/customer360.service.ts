// ============================================================
// CUSTOMER 360 SERVICE v2 — GOD LEVEL
// Snapshot completo: Comercial + Logística + Finanzas + CRM
// Sin "use client"
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ── IDENTIDAD ─────────────────────────────────────────────────

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

// Helper: obtiene IDs de cuentas CRM de este cliente
async function getAccountIds(companyId: string, clientId: string): Promise<string[]> {
  const { data } = await supabase
    .from("crm_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("client_id", clientId);
  return (data ?? []).map((a: any) => a.id);
}

// ── COMERCIAL ─────────────────────────────────────────────────

export async function getClientContacts(companyId: string, clientId: string) {
  const accountIds = await getAccountIds(companyId, clientId);
  if (!accountIds.length) return [];
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .in("account_id", accountIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientActivities(companyId: string, clientId: string) {
  const accountIds = await getAccountIds(companyId, clientId);
  if (!accountIds.length) return [];
  const { data } = await supabase
    .from("crm_activities")
    .select("*")
    .in("account_id", accountIds)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientDocuments(companyId: string, clientId: string) {
  const accountIds = await getAccountIds(companyId, clientId);
  const [crmDocs, clientDocs] = await Promise.all([
    // Documentos CRM
    accountIds.length ? supabase
      .from("crm_documents")
      .select("*")
      .in("account_id", accountIds)
      .order("created_at", { ascending: false })
      .then(({ data }) => data ?? []) : Promise.resolve([]),
    // Documentos legales del cliente
    supabase
      .from("client_documents")
      .select("*")
      .eq("company_id", companyId)
      .eq("client_id", clientId)
      .then(({ data }) => data ?? []),
  ]);
  return { crmDocs, clientDocs };
}

export async function getClientOpportunities(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("opportunities")
    .select("id, name, company_name, stage, value, probability, expected_close_date, created_at, archived")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientQuotations(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("quotations")
    .select("id, status, total, created_at, currency")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── LOGÍSTICA ────────────────────────────────────────────────

export async function getClientShipments(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("shipments")
    .select("id, status, created_at, delivered_at, scheduled_date")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientServiceOrders(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("service_orders")
    .select("id, status, created_at, priority")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── FINANZAS ─────────────────────────────────────────────────

export async function getClientInvoices(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("id, status, amount, currency, due_date, paid_at, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getClientAccountsReceivable(companyId: string, clientId: string) {
  // CxC — saldos pendientes de cobro de este cliente
  const { data } = await supabase
    .from("accounts_receivable")
    .select("id, amount, due_date, status, days_overdue, invoice_id, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("due_date", { ascending: true });
  return data ?? [];
}

export async function getClientCreditStatus(companyId: string, clientId: string) {
  // Límite de crédito y saldo actual del cliente
  const { data } = await supabase
    .from("clients")
    .select("credit_limit, payment_terms, payment_form")
    .eq("company_id", companyId)
    .eq("id", clientId)
    .single();
  return data ?? null;
}

// ── COMPRAS (si el cliente también es proveedor) ──────────────

export async function getClientPurchaseOrders(companyId: string, clientId: string) {
  // Si el cliente también es supplier
  const { data } = await supabase
    .from("purchase_orders")
    .select("id, status, total, created_at")
    .eq("company_id", companyId)
    .eq("supplier_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ── TIMELINE ─────────────────────────────────────────────────

export async function getClientTimeline(companyId: string, clientId: string) {
  const { data } = await supabase
    .from("entity_timeline_events")
    .select("*")
    .eq("company_id", companyId)
    .eq("related_client_id", clientId)
    .order("occurred_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

// ── SNAPSHOT COMPLETO 360 ────────────────────────────────────

export async function getCustomer360(companyId: string, clientId: string) {
  const [
    client,
    accounts,
    contacts,
    activities,
    documents,
    opportunities,
    quotations,
    shipments,
    serviceOrders,
    invoices,
    accountsReceivable,
    creditStatus,
    purchaseOrders,
    timeline,
  ] = await Promise.all([
    getClient(companyId, clientId),
    getClientAccounts(companyId, clientId),
    getClientContacts(companyId, clientId),
    getClientActivities(companyId, clientId),
    getClientDocuments(companyId, clientId),
    getClientOpportunities(companyId, clientId),
    getClientQuotations(companyId, clientId),
    getClientShipments(companyId, clientId),
    getClientServiceOrders(companyId, clientId),
    getClientInvoices(companyId, clientId),
    getClientAccountsReceivable(companyId, clientId),
    getClientCreditStatus(companyId, clientId),
    getClientPurchaseOrders(companyId, clientId),
    getClientTimeline(companyId, clientId),
  ]);

  return {
    client,
    accounts,
    contacts,
    activities,
    documents,
    opportunities,
    quotations,
    shipments,
    serviceOrders,
    invoices,
    accountsReceivable,
    creditStatus,
    purchaseOrders,
    timeline,
  };
}
