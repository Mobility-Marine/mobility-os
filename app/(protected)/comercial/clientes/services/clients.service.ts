// ============================================================
// CLIENTS SERVICE v2 — GOD LEVEL
// CRUD + Contacts + Documents + Connections + Stats
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  Client, CreateClientPayload, ClientDocument, ClientDocumentType,
  ClientContact, ClientContactRole, ClientConnection,
} from "../types/clients.types";

// ── CLIENTS ────────────────────────────────────────────────

export async function fetchClients(companyId: string): Promise<Client[]> {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });
  return (data ?? []) as Client[];
}

export async function fetchClientById(
  companyId: string, id: string
): Promise<Client | null> {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  return data as Client | null;
}

export async function createClient(
  companyId: string, payload: CreateClientPayload
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_id:     companyId,
      name:           payload.name,
      legal_name:     payload.legal_name     ?? null,
      rfc:            payload.rfc            ?? null,
      email:          payload.email          ?? null,
      phone:          payload.phone          ?? null,
      website:        payload.website        ?? null,
      address:        payload.address        ?? null,
      city:           payload.city           ?? null,
      zip_code:       payload.zip_code       ?? null,
      country:        payload.country        ?? "México",
      tax_regime:     payload.tax_regime     ?? null,
      cfdi_use:       payload.cfdi_use       ?? null,
      billing_email:  payload.billing_email  ?? null,
      billing_address:payload.billing_address?? null,
      payment_method: payload.payment_method ?? null,
      payment_terms:  payload.payment_terms  ?? null,
      credit_limit:   payload.credit_limit   ?? null,
      is_customer:    payload.is_customer,
      is_supplier:    payload.is_supplier,
      is_active:      true,
      notes:          payload.notes          ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  companyId: string, id: string, updates: Partial<Client>
): Promise<void> {
  const { stats, documents, contacts, ...dbUpdates } = updates as any;
  const { error } = await supabase
    .from("clients")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function toggleClientStatus(
  companyId: string, id: string, is_active: boolean
): Promise<void> {
  await supabase
    .from("clients")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── CONTACTS ───────────────────────────────────────────────

export async function fetchClientContacts(
  companyId: string, clientId: string
): Promise<ClientContact[]> {
  const { data } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as ClientContact[];
}

export async function createClientContact(
  companyId: string, clientId: string, userId: string,
  payload: {
    name:       string;
    role:       ClientContactRole;
    title?:     string;
    email?:     string;
    phone?:     string;
    is_primary?: boolean;
    notes?:     string;
  }
): Promise<ClientContact> {
  const { data, error } = await supabase
    .from("client_contacts")
    .insert({
      company_id: companyId,
      client_id:  clientId,
      created_by: userId,
      name:       payload.name,
      role:       payload.role,
      title:      payload.title      ?? null,
      email:      payload.email      ?? null,
      phone:      payload.phone      ?? null,
      is_primary: payload.is_primary ?? false,
      notes:      payload.notes      ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientContact;
}

export async function updateClientContact(
  companyId: string, id: string, updates: Partial<ClientContact>
): Promise<void> {
  await supabase
    .from("client_contacts")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function deleteClientContact(
  companyId: string, id: string
): Promise<void> {
  await supabase
    .from("client_contacts")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── DOCUMENTS ──────────────────────────────────────────────

export async function fetchClientDocuments(
  companyId: string, clientId: string
): Promise<ClientDocument[]> {
  const { data } = await supabase
    .from("client_documents")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ClientDocument[];
}

export async function createClientDocument(
  companyId: string, clientId: string, userId: string,
  payload: { name: string; type: ClientDocumentType; url?: string; notes?: string; expires_at?: string }
): Promise<ClientDocument> {
  const { data, error } = await supabase
    .from("client_documents")
    .insert({
      company_id:  companyId,
      client_id:   clientId,
      created_by:  userId,
      name:        payload.name,
      type:        payload.type,
      url:         payload.url         ?? null,
      notes:       payload.notes       ?? null,
      expires_at:  payload.expires_at  ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientDocument;
}

export async function updateClientDocument(
  companyId: string, id: string,
  updates: { name?: string; url?: string; notes?: string; expires_at?: string }
): Promise<void> {
  await supabase
    .from("client_documents")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function deleteClientDocument(
  companyId: string, id: string
): Promise<void> {
  await supabase
    .from("client_documents")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── CONNECTIONS ────────────────────────────────────────────

export async function fetchClientConnections(
  companyId: string, clientId: string
): Promise<ClientConnection[]> {
  const connections: ClientConnection[] = [];

  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, name, company_name, stage, value, created_at")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(10);

  for (const o of opps ?? []) {
    connections.push({ type: "opportunity", id: o.id, label: o.company_name ?? o.name, status: o.stage, value: o.value, date: o.created_at });
  }

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, name, company_name, status, created_at")
    .eq("company_id", companyId)
    .eq("converted_to_client_id", clientId)
    .limit(5);

  for (const p of prospects ?? []) {
    connections.push({ type: "prospect", id: p.id, label: p.company_name ?? p.name ?? "Prospecto", status: p.status, date: p.created_at });
  }

  return connections;
}

// ── STATS ──────────────────────────────────────────────────

export async function fetchClientStats(
  companyId: string, clientId: string
) {
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, value, stage")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("archived", false);

  const totalRevenue = (opps ?? [])
    .filter((o) => o.stage === "won")
    .reduce((s, o) => s + (o.value ?? 0), 0);

  return {
    opportunities: (opps ?? []).length,
    openOrders:    0,
    totalRevenue,
    openBalance:   0,
    riskLevel:     "LOW" as const,
  };
}

// ── ADDRESSES ──────────────────────────────────────────────

export async function fetchClientAddresses(
  companyId: string, clientId: string
): Promise<ClientAddress[]> {
  const { data } = await supabase
    .from("client_addresses")
    .select("*")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as ClientAddress[];
}

export async function createClientAddress(
  companyId: string, clientId: string, userId: string,
  payload: {
    type:          AddressType;
    alias?:        string;
    street?:       string;
    ext_number?:   string;
    int_number?:   string;
    neighborhood?: string;
    city?:         string;
    state?:        string;
    zip_code:      string;
    country?:      string;
    is_default?:   boolean;
    notes?:        string;
  }
): Promise<ClientAddress> {
  const { data, error } = await supabase
    .from("client_addresses")
    .insert({
      company_id:   companyId,
      client_id:    clientId,
      created_by:   userId,
      type:         payload.type,
      alias:        payload.alias        ?? null,
      street:       payload.street       ?? null,
      ext_number:   payload.ext_number   ?? null,
      int_number:   payload.int_number   ?? null,
      neighborhood: payload.neighborhood ?? null,
      city:         payload.city         ?? null,
      state:        payload.state        ?? null,
      zip_code:     payload.zip_code,
      country:      payload.country      ?? "México",
      is_default:   payload.is_default   ?? false,
      notes:        payload.notes        ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientAddress;
}

export async function updateClientAddress(
  companyId: string, id: string, updates: Partial<ClientAddress>
): Promise<void> {
  await supabase
    .from("client_addresses")
    .update(updates)
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function deleteClientAddress(
  companyId: string, id: string
): Promise<void> {
  await supabase
    .from("client_addresses")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function setDefaultAddress(
  companyId: string, clientId: string, addressId: string
): Promise<void> {
  // Quitar default de todas
  await supabase
    .from("client_addresses")
    .update({ is_default: false })
    .eq("company_id", companyId)
    .eq("client_id", clientId);
  // Poner default en la seleccionada
  await supabase
    .from("client_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("company_id", companyId);
}
