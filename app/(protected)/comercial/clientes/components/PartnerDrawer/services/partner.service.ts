// ════════════════════════════════════════════════════════════════════════
// PARTNER SERVICE — CRUD para business_partners desde el drawer unificado
// ════════════════════════════════════════════════════════════════════════
// Todas las queries usan filtro por company_id (multi-tenant nivel ERP).
// Defaults seguros: si no se especifica, los flags de rol se asumen false
// excepto is_active (true por defecto).
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";
import type { Partner, CreatePartnerPayload, UpdatePartnerPayload } from "../types";

// ── SELECT estándar (todas las columnas relevantes) ──────────────────
const SELECT_PARTNER = `
  id, company_id, name, legal_name, rfc, industry, website, notes,
  contact, email, phone,
  address, city, state, zip_code, country,
  is_customer, is_supplier, is_logistics_provider, is_active, roles,
  tax_regime, cfdi_use, payment_method, payment_form,
  billing_email, billing_address,
  billing_street, billing_ext_number, billing_int_number,
  billing_neighborhood, billing_city, billing_state, billing_country,
  payment_terms, credit_limit, credit_days, currency, rating,
  validation_sat_status, validation_sat_date, validation_sat_error,
  validation_69b_status, validation_69b_date, validation_69b_notes, validation_69b_evidence_url,
  logistics_provider_type, scac_code, coverage_routes, services_offered, default_incoterm,
  created_at, updated_at, created_by
`;

// ── Crear partner ─────────────────────────────────────────────────────
export async function createPartner(
  companyId: string,
  payload: CreatePartnerPayload,
  userId?: string,
): Promise<Partner> {
  const insertData = {
    ...payload,
    company_id:            companyId,
    created_by:            userId ?? null,
    // Defaults seguros nivel ERP
    is_active:             payload.is_active ?? true,
    is_customer:           payload.is_customer ?? false,
    is_supplier:           payload.is_supplier ?? false,
    is_logistics_provider: payload.is_logistics_provider ?? false,
    currency:              payload.currency ?? "MXN",
    country:               payload.country ?? "México",
    payment_form:          payload.payment_form ?? "PPD",
    validation_sat_status: payload.validation_sat_status ?? "not_verified",
    validation_69b_status: payload.validation_69b_status ?? "not_verified",
  };

  const { data, error } = await supabase
    .from("business_partners")
    .insert(insertData)
    .select(SELECT_PARTNER)
    .single();

  if (error) throw new Error(error.message);
  return data as Partner;
}

// ── Actualizar partner ────────────────────────────────────────────────
export async function updatePartner(
  companyId: string,
  partnerId: string,
  payload: UpdatePartnerPayload,
): Promise<Partner> {
  const { data, error } = await supabase
    .from("business_partners")
    .update(payload)
    .eq("company_id", companyId)
    .eq("id", partnerId)
    .select(SELECT_PARTNER)
    .single();

  if (error) throw new Error(error.message);
  return data as Partner;
}

// ── Obtener partner por ID ────────────────────────────────────────────
export async function fetchPartnerById(
  companyId: string,
  partnerId: string,
): Promise<Partner | null> {
  const { data, error } = await supabase
    .from("business_partners")
    .select(SELECT_PARTNER)
    .eq("company_id", companyId)
    .eq("id", partnerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Partner) ?? null;
}

// ── Buscar duplicado por RFC (anti-duplicado nivel ERP) ──────────────
// Si excludeId está presente (modo EDIT), excluye al partner que estamos
// editando para no marcarlo como duplicado de sí mismo.
export async function findPartnerByRFC(
  companyId: string,
  rfc: string,
  excludeId?: string,
): Promise<Partner | null> {
  const cleanRfc = rfc.trim().toUpperCase();
  if (cleanRfc.length < 12) return null;

  let q = supabase
    .from("business_partners")
    .select(SELECT_PARTNER)
    .eq("company_id", companyId)
    .eq("rfc", cleanRfc)
    .limit(1);

  if (excludeId) q = q.neq("id", excludeId);

  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Partner) ?? null;
}

// ── Validación SAT vía Facturapi (endpoint backend) ──────────────────
// El frontend llama a /api/sat/validate-customer (que se crea en Sub-fase
// 7.2). Este endpoint usa Facturapi customers.create con datos de prueba
// para validar que el RFC + régimen + CP coinciden con el padrón SAT.
// Se hace en backend para no exponer la API key de Facturapi.
export type SATValidationResult =
  | { status: "valid" }
  | { status: "invalid"; error: string }
  | { status: "error"; error: string };

export async function validateSATData(params: {
  rfc:        string;
  taxRegime:  string;
  zipCode:    string;
  legalName?: string;
  email?:     string;
}): Promise<SATValidationResult> {
  try {
    const res = await fetch("/api/sat/validate-customer", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(params),
    });

    if (!res.ok) {
      const errorBody = await res
        .json()
        .catch(() => ({ error: "Error desconocido" }));
      return {
        status: "invalid",
        error:  errorBody?.error ?? `HTTP ${res.status}`,
      };
    }
    return { status: "valid" };
  } catch (e) {
    return {
      status: "error",
      error:  e instanceof Error ? e.message : String(e),
    };
  }
}