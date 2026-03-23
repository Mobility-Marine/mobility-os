"use client";

// ============================================================
// 🔄 PROSPECT → CLIENT CONVERSION SERVICE
// Customer Master + CRM + Identity Bridge
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// CONVERTIR PROSPECTO A CLIENTE REAL
// ============================================================

export async function convertProspectToCustomer(
  companyId: string,
  prospectId: string,
  payload: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }
) {

  // ==========================================================
  // 1) OBTENER PROSPECTO
  // ==========================================================

  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .single();

  if (!prospect) throw new Error("Prospect not found");

  const name =
    payload.company_name ||
    payload.name ||
    prospect.company_name ||
    prospect.name ||
    "Cliente sin nombre";

  // ==========================================================
  // 2) VERIFICAR SI YA EXISTE CLIENTE GLOBAL
  // ==========================================================

  const { data: existingClient } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .ilike("name", name)
    .maybeSingle();

  let client = existingClient;

  // ==========================================================
  // 3) CREAR CLIENTE GLOBAL SI NO EXISTE
  // ==========================================================

  if (!client) {
    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({
        company_id: companyId,
        name,
        legal_name: payload.company_name || prospect.company_name,
        email: payload.email || prospect.email,
        phone: payload.phone || prospect.phone,
        notes: payload.notes || prospect.notes,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    client = newClient;
  }

  // ==========================================================
  // 4) CREAR CUENTA CRM
  // ==========================================================

  const { data: account, error: accError } = await supabase
    .from("crm_accounts")
    .insert({
      company_id: companyId,
      client_id: client.id,
      name,
      legal_name: payload.company_name || prospect.company_name,
      status: "active",
      lifecycle_stage: "customer",
      is_customer: true,
      notes: payload.notes || prospect.notes,
    })
    .select("*")
    .single();

  if (accError) throw accError;

  // ==========================================================
  // 5) CREAR BRIDGE DE IDENTIDAD
  // ==========================================================

  await supabase.from("customer_identity_bridge").insert({
    company_id: companyId,
    crm_account_id: account.id,
    client_id: client.id,
    prospect_id: prospectId,
    bridge_status: "converted",
    source_of_truth: "crm_accounts",
    conversion_type: "prospect_to_customer",
    conversion_source: "prospects_module",
    is_primary: true,
  });

  // ==========================================================
  // 6) MARCAR PROSPECTO COMO CONVERTIDO
  // ==========================================================

  await supabase
    .from("prospects")
    .update({
      status: "converted",
      is_active: false,
      converted_to_client_id: client.id,
      converted_to_account_id: account.id,
      converted_at: new Date().toISOString(),
    })
    .eq("id", prospectId)
    .eq("company_id", companyId);

  // ==========================================================
  // 7) EVENTO GLOBAL
  // ==========================================================

  await supabase.from("entity_timeline_events").insert({
    company_id: companyId,
    entity_type: "crm_account",
    entity_id: account.id,
    related_account_id: account.id,
    related_client_id: client.id,
    related_prospect_id: prospectId,
    module_key: "prospects",
    event_type: "converted_from_prospect",
    event_category: "commercial",
    title: "Prospecto convertido a cliente",
    description: name,
  });

  return {
    client,
    account,
  };
}
