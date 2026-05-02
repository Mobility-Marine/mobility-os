"use client";

// ═══════════════════════════════════════════════════════════════════════
// Service de Carta Porte: llama a los endpoints /api/facturacion/carta-porte
// 
// Sigue el mismo patrón que facturacion.service.ts (proformas):
//   - getAuthToken: obtiene el JWT de Supabase para mandar al backend
//   - Cada función es una llamada HTTP con manejo de errores
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";
import type {
  CFDIConCartaPorteData,
  CartaPorteParentType,
} from "../types/carta_porte.types";

const API = "/api/facturacion/carta-porte";

// ─── Helper para obtener el access token actual ───
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  return session.access_token;
}

// ─── Crear borrador ───
export async function saveCartaPorteDraft(
  companyId: string,
  parentType: CartaPorteParentType,
  data: CFDIConCartaPorteData,
) {
  const token = await getAuthToken();
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      company_id:  companyId,
      parent_type: parentType,
      data,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error guardando borrador de Carta Porte");
  return json as { success: true; cfdi_id: string; carta_porte_id: string };
}

// ─── Actualizar borrador existente ───
export async function updateCartaPorteDraft(
  cfdiId: string,
  data: CFDIConCartaPorteData,
) {
  const token = await getAuthToken();
  const res = await fetch(`${API}/${cfdiId}`, {
    method: "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error actualizando borrador");
  return json;
}

// ─── Eliminar borrador ───
export async function deleteCartaPorteDraft(cfdiId: string) {
  const token = await getAuthToken();
  const res = await fetch(`${API}/${cfdiId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error eliminando borrador");
  return json;
}

// ─── Timbrar (convierte borrador en CFDI 'valid' al SAT) ───
export async function stampCartaPorte(cfdiId: string) {
  const token = await getAuthToken();
  const res = await fetch(`${API}/${cfdiId}/timbrar`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error al timbrar CFDI con Carta Porte");
  return json as { success: true; cfdi: any; invoice: any };
}
