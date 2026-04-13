// ============================================================
// PROSPECT → CLIENT CONVERSION SERVICE v2
// Customer Master + CRM + Identity Bridge
// GOD LEVEL: lógica intacta, sin "use client"
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { ProspectConversionInput, ProspectConversionResult } from "../types/prospects.types";

export async function convertProspectToCustomer(
  companyId: string,
  prospectId: string,
  payload: ProspectConversionInput
): Promise<ProspectConversionResult> {

  // 1) Obtener prospecto
  const { data: prospect, error: pErr } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .single();

  if (pErr || !prospect) throw new Error("Prospect not found");

  const name = payload.company_name
    || payload.name
    || prospect.company_name
    || prospect.name
    || "Cliente sin nombre";

  // 2) Verificar si ya existe cliente global
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id, name")
    .eq("company_id", companyId)
    .ilike("name", name)
    .maybeSingle();

  let client = existingClient;

  // 3) Crear cliente global si no existe
  if (!client) {
    const { data: newClient, error: cErr } = await supabase
      .from("clients")
      .insert({
        company_id: companyId,
        name,
        legal_name: payload.company_name || prospect.company_name,
        email:      payload.email  || prospect.email,
        phone:      payload.phone  || prospect.phone,
        notes:      payload.notes  || prospect.notes,
        is_active:  true,
      })
      .select("id, name")
      .single();

    if (cErr || !newClient) throw new Error("Error creating client: " + cErr?.message);
    client = newClient;
  }

  // 4) Crear cuenta CRM
  const { data: account, error: accErr } = await supabase
    .from("crm_accounts")
    .insert({
      company_id:     companyId,
      client_id:      client.id,
      name,
      legal_name:     payload.company_name || prospect.company_name,
      status:         "active",
      lifecycle_stage:"customer",
      is_customer:    true,
      notes:          payload.notes || prospect.notes,
    })
    .select("id, name")
    .single();

  if (accErr || !account) throw new Error("Error creating CRM account: " + accErr?.message);

  // 5) Bridge de identidad
  await supabase.from("customer_identity_bridge").insert({
    company_id:        companyId,
    crm_account_id:    account.id,
    client_id:         client.id,
    prospect_id:       prospectId,
    bridge_status:     "converted",
    source_of_truth:   "crm_accounts",
    conversion_type:   "prospect_to_customer",
    conversion_source: "prospects_module",
    is_primary:        true,
  });

  // 6) Marcar prospecto como convertido
  await supabase
    .from("prospects")
    .update({
      status:                  "converted",
      is_active:               false,
      converted_to_client_id:  client.id,
      converted_to_account_id: account.id,
      converted_at:            new Date().toISOString(),
    })
    .eq("id", prospectId)
    .eq("company_id", companyId);

  // 7) Evento global en timeline
  await supabase.from("entity_timeline_events").insert({
    company_id:         companyId,
    entity_type:        "crm_account",
    entity_id:          account.id,
    related_account_id: account.id,
    related_client_id:  client.id,
    related_prospect_id:prospectId,
    module_key:         "prospects",
    event_type:         "converted_from_prospect",
    event_category:     "commercial",
    title:              "Prospecto convertido a cliente",
    description:        name,
  });

  // 8) Crear oportunidad automática
  const { data: opp } = await supabase
    .from("opportunities")
    .insert({
      company_id:              companyId,
      client_id:               client.id,
      crm_account_id:          account.id,
      source_prospect_id:      prospectId,
      name,
      stage:                   "qualification",
      status:                  "open",
      estimated_value:         prospect.estimated_value,
      source_module:           "prospects",
      origin_type:             "prospect_conversion",
      created_from_conversion: true,
    })
    .select("id")
    .single();

  return {
    client:  { id: client.id,  name: client.name  },
    account: { id: account.id, name: account.name },
    opportunityId: opp?.id,
  };
}
