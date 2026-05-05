// ════════════════════════════════════════════════════════════════════════
// PARTNER ADDRESSES SERVICE — CRUD para client_addresses
// ════════════════════════════════════════════════════════════════════════
// Tabla actual: client_addresses (FK client_id → business_partners.id)
// Será renombrada a partner_addresses en el Commit #5.
//
// Funciones:
//   - listByPartner: lista todas las direcciones de un partner
//   - create: inserta una nueva dirección
//   - update: actualiza una dirección existente
//   - remove: elimina una dirección
//   - bulkInsert: inserta múltiples direcciones a la vez
//   - syncDiff: aplica cambios pendientes (insert/update/delete) en modo EDIT
//
// Multi-tenant: todas las queries filtran por company_id.
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";
import type { PartnerAddress } from "../types";

// ── SELECT estándar ──────────────────────────────────────────────────
const SELECT_ADDRESS = `
  id, company_id, client_id, type, alias,
  street, ext_number, int_number, neighborhood, city, state, zip_code, country,
  is_default, notes, latitude, longitude, created_at, created_by
`;

// ── Listar direcciones de un partner ──────────────────────────────────
export async function listAddressesByPartner(
  companyId: string,
  partnerId: string,
): Promise<PartnerAddress[]> {
  const { data, error } = await supabase
    .from("client_addresses")
    .select(SELECT_ADDRESS)
    .eq("company_id", companyId)
    .eq("client_id", partnerId)
    .order("is_default", { ascending: false })
    .order("type", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerAddress[];
}

// ── Crear una dirección individual ────────────────────────────────────
export async function createAddress(
  companyId: string,
  partnerId: string,
  payload: Omit<PartnerAddress, "id" | "company_id" | "client_id" | "created_at" | "created_by" | "_localId" | "_isDirty" | "_isDeleted">,
  userId?: string,
): Promise<PartnerAddress> {
  const insertData = {
    ...payload,
    company_id: companyId,
    client_id:  partnerId,
    created_by: userId ?? null,
    country:    payload.country    ?? "México",
    is_default: payload.is_default ?? false,
  };

  const { data, error } = await supabase
    .from("client_addresses")
    .insert(insertData)
    .select(SELECT_ADDRESS)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerAddress;
}

// ── Actualizar una dirección ──────────────────────────────────────────
export async function updateAddress(
  companyId: string,
  addressId: string,
  payload: Partial<PartnerAddress>,
): Promise<PartnerAddress> {
  // Limpiar campos solo-frontend antes de enviar al BD
  const { _localId, _isDirty, _isDeleted, id, company_id, client_id, created_at, created_by, ...clean } = payload;

  const { data, error } = await supabase
    .from("client_addresses")
    .update(clean)
    .eq("id", addressId)
    .eq("company_id", companyId)
    .select(SELECT_ADDRESS)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerAddress;
}

// ── Eliminar una dirección ────────────────────────────────────────────
export async function deleteAddress(companyId: string, addressId: string): Promise<void> {
  const { error } = await supabase
    .from("client_addresses")
    .delete()
    .eq("id", addressId)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
}

// ── Insert masivo (modo CREATE del partner) ──────────────────────────
export async function bulkInsertAddresses(
  companyId: string,
  partnerId: string,
  addresses: PartnerAddress[],
  userId?: string,
): Promise<PartnerAddress[]> {
  if (addresses.length === 0) return [];

  const toInsert = addresses
    .filter((a) => !a._isDeleted)
    .map((a) => ({
      company_id:    companyId,
      client_id:     partnerId,
      type:          a.type,
      alias:         a.alias        ?? null,
      street:        a.street       ?? null,
      ext_number:    a.ext_number   ?? null,
      int_number:    a.int_number   ?? null,
      neighborhood:  a.neighborhood ?? null,
      city:          a.city         ?? null,
      state:         a.state        ?? null,
      zip_code:      a.zip_code,
      country:       a.country      ?? "México",
      is_default:    a.is_default   ?? false,
      notes:         a.notes        ?? null,
      latitude:      a.latitude     ?? null,
      longitude:     a.longitude    ?? null,
      created_by:    userId         ?? null,
    }));

  if (toInsert.length === 0) return [];

  const { data, error } = await supabase
    .from("client_addresses")
    .insert(toInsert)
    .select(SELECT_ADDRESS);

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerAddress[];
}

// ── Sincronizar diff (modo EDIT del partner) ─────────────────────────
export async function syncAddressesDiff(
  companyId: string,
  partnerId: string,
  addresses: PartnerAddress[],
  userId?: string,
): Promise<PartnerAddress[]> {
  // 1. Eliminar los marcados
  const toDelete = addresses.filter((a) => a._isDeleted && a.id);
  for (const a of toDelete) {
    await deleteAddress(companyId, a.id!);
  }

  // 2. Insertar los nuevos
  const toInsert = addresses.filter((a) => !a.id && !a._isDeleted);
  if (toInsert.length > 0) {
    await bulkInsertAddresses(companyId, partnerId, toInsert, userId);
  }

  // 3. Actualizar los modificados
  const toUpdate = addresses.filter((a) => a.id && a._isDirty && !a._isDeleted);
  for (const a of toUpdate) {
    await updateAddress(companyId, a.id!, a);
  }

  // 4. Releer desde BD
  return listAddressesByPartner(companyId, partnerId);
}