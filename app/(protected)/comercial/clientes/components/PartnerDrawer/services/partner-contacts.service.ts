// ════════════════════════════════════════════════════════════════════════
// PARTNER CONTACTS SERVICE — CRUD para client_contacts
// ════════════════════════════════════════════════════════════════════════
// Tabla actual: client_contacts (FK client_id → business_partners.id)
// Será renombrada a partner_contacts en el Commit #5.
//
// Funciones:
//   - listByPartner: lista todos los contactos de un partner
//   - create: inserta un nuevo contacto
//   - update: actualiza un contacto existente
//   - remove: elimina un contacto
//   - bulkInsert: inserta múltiples contactos a la vez (modo CREATE del partner)
//
// Multi-tenant: todas las queries filtran por company_id.
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";
import type { PartnerContact } from "../types";

// ── SELECT estándar ──────────────────────────────────────────────────
const SELECT_CONTACT = `
  id, company_id, client_id, name, role, title, email, phone,
  is_primary, notes, created_at, created_by
`;

// ── Listar contactos de un partner ────────────────────────────────────
export async function listContactsByPartner(
  companyId: string,
  partnerId: string,
): Promise<PartnerContact[]> {
  const { data, error } = await supabase
    .from("client_contacts")
    .select(SELECT_CONTACT)
    .eq("company_id", companyId)
    .eq("client_id", partnerId)
    .order("is_primary", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerContact[];
}

// ── Crear un contacto individual ──────────────────────────────────────
export async function createContact(
  companyId: string,
  partnerId: string,
  payload: Omit<PartnerContact, "id" | "company_id" | "client_id" | "created_at" | "created_by" | "_localId" | "_isDirty" | "_isDeleted">,
  userId?: string,
): Promise<PartnerContact> {
  const insertData = {
    ...payload,
    company_id: companyId,
    client_id:  partnerId,
    created_by: userId ?? null,
    is_primary: payload.is_primary ?? false,
  };

  const { data, error } = await supabase
    .from("client_contacts")
    .insert(insertData)
    .select(SELECT_CONTACT)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerContact;
}

// ── Actualizar un contacto ───────────────────────────────────────────
export async function updateContact(
  companyId: string,
  contactId: string,
  payload: Partial<PartnerContact>,
): Promise<PartnerContact> {
  // Limpiar campos solo-frontend antes de enviar al BD
  const { _localId, _isDirty, _isDeleted, id, company_id, client_id, created_at, created_by, ...clean } = payload;

  const { data, error } = await supabase
    .from("client_contacts")
    .update(clean)
    .eq("id", contactId)
    .eq("company_id", companyId)
    .select(SELECT_CONTACT)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerContact;
}

// ── Eliminar un contacto ─────────────────────────────────────────────
export async function deleteContact(companyId: string, contactId: string): Promise<void> {
  const { error } = await supabase
    .from("client_contacts")
    .delete()
    .eq("id", contactId)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
}

// ── Insert masivo (modo CREATE del partner) ──────────────────────────
// Tras insertar el partner, persistimos todos los contactos acumulados
// en estado local. Devuelve los contactos creados con sus IDs reales.
export async function bulkInsertContacts(
  companyId: string,
  partnerId: string,
  contacts: PartnerContact[],
  userId?: string,
): Promise<PartnerContact[]> {
  if (contacts.length === 0) return [];

  // Filtrar contactos eliminados y limpiar campos solo-frontend
  const toInsert = contacts
    .filter((c) => !c._isDeleted)
    .map((c) => ({
      company_id: companyId,
      client_id:  partnerId,
      name:       c.name,
      role:       c.role        ?? null,
      title:      c.title       ?? null,
      email:      c.email       ?? null,
      phone:      c.phone       ?? null,
      is_primary: c.is_primary  ?? false,
      notes:      c.notes       ?? null,
      created_by: userId        ?? null,
    }));

  if (toInsert.length === 0) return [];

  const { data, error } = await supabase
    .from("client_contacts")
    .insert(toInsert)
    .select(SELECT_CONTACT);

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerContact[];
}

// ── Sincronizar diff (modo EDIT del partner) ─────────────────────────
// Aplica los cambios pendientes en estado local contra la BD:
//   - Inserta los que no tienen id (nuevos)
//   - Actualiza los marcados como _isDirty
//   - Elimina los marcados como _isDeleted
// Retorna la lista actualizada desde BD.
export async function syncContactsDiff(
  companyId: string,
  partnerId: string,
  contacts: PartnerContact[],
  userId?: string,
): Promise<PartnerContact[]> {
  // 1. Eliminar los marcados
  const toDelete = contacts.filter((c) => c._isDeleted && c.id);
  for (const c of toDelete) {
    await deleteContact(companyId, c.id!);
  }

  // 2. Insertar los nuevos (sin id, sin _isDeleted)
  const toInsert = contacts.filter((c) => !c.id && !c._isDeleted);
  if (toInsert.length > 0) {
    await bulkInsertContacts(companyId, partnerId, toInsert, userId);
  }

  // 3. Actualizar los modificados
  const toUpdate = contacts.filter((c) => c.id && c._isDirty && !c._isDeleted);
  for (const c of toUpdate) {
    await updateContact(companyId, c.id!, c);
  }

  // 4. Releer desde BD para tener el estado fresco
  return listContactsByPartner(companyId, partnerId);
}