// ============================================================
// PROVIDERS SERVICE v1 — GOD LEVEL
// CRUD · Documentos · Facturas · IA extracción
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  LogisticsProvider, ProviderDocument, ProviderInvoice,
  ProviderFilters, ProviderKPIs, ProviderType,
} from "../types/providers.types";

// ── PROVIDERS ────────────────────────────────────────────────
// Mobility OS unifica los partners en `business_partners`. Los proveedores
// logísticos son business_partners con is_logistics_provider=true.
// Algunas columnas tienen nombres distintos en BD vs en el tipo UI legacy:
//   provider_type   ↔  logistics_provider_type
//   contact_name    ↔  contact
//   contact_email   ↔  email
//   contact_phone   ↔  phone
// Estos helpers traducen entre ambos formatos.

const SELECT_PROVIDER = `
  id, company_id, name, rfc,
  provider_type:logistics_provider_type,
  contact_name:contact,
  contact_email:email,
  contact_phone:phone,
  scac_code, website,
  coverage_routes, services_offered,
  is_active, rating, notes, payment_terms,
  created_by, created_at, updated_at
`;

/** Mapea payload del tipo UI (LogisticsProvider) al schema BD (business_partners). */
function uiToBP(payload: any) {
  const { provider_type, contact_name, contact_email, contact_phone, tax_id, ...rest } = payload;
  return {
    ...rest,
    ...(provider_type  !== undefined ? { logistics_provider_type: provider_type } : {}),
    ...(contact_name   !== undefined ? { contact: contact_name }                  : {}),
    ...(contact_email  !== undefined ? { email:   contact_email }                 : {}),
    ...(contact_phone  !== undefined ? { phone:   contact_phone }                 : {}),
    // tax_id se descarta: en business_partners solo existe `rfc`.
  };
}

/**
 * Lista proveedores logísticos (business_partners con is_logistics_provider=true).
 * Multi-tenant safe.
 */
export async function fetchProviders(companyId: string): Promise<LogisticsProvider[]> {
  const { data } = await supabase
    .from("business_partners")
    .select(SELECT_PROVIDER)
    .eq("company_id", companyId)
    .eq("is_logistics_provider", true)
    .order("name", { ascending: true });
  return (data ?? []) as unknown as LogisticsProvider[];
}

/**
 * Obtiene un proveedor logístico específico junto con sus documentos y facturas.
 */
export async function fetchProvider(
  companyId: string, id: string
): Promise<LogisticsProvider | null> {
  const [{ data: provider }, { data: docs }, { data: invoices }] = await Promise.all([
    supabase.from("business_partners")
      .select(SELECT_PROVIDER)
      .eq("company_id", companyId)
      .eq("id", id)
      .eq("is_logistics_provider", true)
      .single(),
    supabase.from("provider_documents")
      .select("*")
      .eq("provider_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("provider_invoices")
      .select("*")
      .eq("provider_id", id)
      .eq("company_id", companyId)
      .order("invoice_date", { ascending: false }),
  ]);
  if (!provider) return null;
  return { ...provider, documents: docs ?? [], invoices: invoices ?? [] } as unknown as LogisticsProvider;
}

/**
 * Crea un proveedor logístico en business_partners.
 * Marca explícitamente: is_logistics_provider=true, is_supplier=false, is_customer=false.
 */
export async function createProvider(
  companyId: string, userId: string,
  data: Omit<LogisticsProvider, "id" | "company_id" | "created_at" | "updated_at" | "created_by" | "documents" | "invoices">
): Promise<LogisticsProvider> {
  const mapped = uiToBP(data);
  const { data: created, error } = await supabase
    .from("business_partners")
    .insert({
      ...mapped,
      company_id:            companyId,
      created_by:            userId,
      is_customer:           false,
      is_supplier:           false,
      is_logistics_provider: true,
    })
    .select(SELECT_PROVIDER)
    .single();
  if (error) throw error;
  return created as unknown as LogisticsProvider;
}

/**
 * Actualiza un proveedor logístico. Verifica que sea logístico (no edita otros partners).
 */
export async function updateProvider(
  companyId: string, id: string, updates: Partial<LogisticsProvider>
): Promise<void> {
  const { documents, invoices, id: _id, company_id: _cid, created_at: _ca, ...rest } = updates as any;
  const mapped = uiToBP(rest);
  await supabase.from("business_partners")
    .update({ ...mapped, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("is_logistics_provider", true);
}

/**
 * Activa o desactiva un proveedor logístico.
 */
export async function toggleProviderStatus(
  companyId: string, id: string, isActive: boolean
): Promise<void> {
  await supabase.from("business_partners")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("is_logistics_provider", true);
}

/**
 * Elimina un proveedor logístico. Verifica que sea logístico (seguridad).
 */
export async function deleteProvider(companyId: string, id: string): Promise<void> {
  await supabase.from("business_partners")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("is_logistics_provider", true);
}

// ── DOCUMENTS ────────────────────────────────────────────────

export async function uploadProviderDocument(
  companyId: string, userId: string, providerId: string,
  file: File, docType: string, expiryDate?: string, notes?: string
): Promise<ProviderDocument> {
  // Upload to Supabase Storage
  const ext  = file.name.split(".").pop();
  const path = `providers/${companyId}/${providerId}/${docType}_${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("company-assets")
    .upload(path, file, { upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: { publicUrl } } = supabase.storage.from("company-assets").getPublicUrl(path);

  const { data, error } = await supabase.from("provider_documents")
    .insert({
      company_id:  companyId,
      provider_id: providerId,
      doc_type:    docType,
      doc_name:    file.name,
      file_url:    publicUrl,
      file_size:   file.size,
      file_type:   file.type,
      expiry_date: expiryDate || null,
      notes:       notes || null,
      uploaded_by: userId,
    })
    .select("*").single();
  if (error) throw error;
  return data as ProviderDocument;
}

export async function deleteProviderDocument(id: string): Promise<void> {
  await supabase.from("provider_documents").delete().eq("id", id);
}

// ── INVOICES ─────────────────────────────────────────────────

export async function uploadProviderInvoice(
  companyId: string, userId: string, providerId: string,
  file: File, invoiceData: Partial<ProviderInvoice>
): Promise<ProviderInvoice> {
  // Upload PDF
  const path = `invoices/${companyId}/${providerId}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabase.storage
    .from("company-assets")
    .upload(path, file, { upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: { publicUrl } } = supabase.storage.from("company-assets").getPublicUrl(path);

  const { data, error } = await supabase.from("provider_invoices")
    .insert({
      company_id:     companyId,
      provider_id:    providerId,
      invoice_number: invoiceData.invoice_number ?? "",
      invoice_date:   invoiceData.invoice_date   ?? new Date().toISOString().slice(0, 10),
      currency:       invoiceData.currency        ?? "USD",
      subtotal:       invoiceData.subtotal        ?? 0,
      tax_amount:     invoiceData.tax_amount      ?? 0,
      total:          invoiceData.total           ?? 0,
      concept:        invoiceData.concept         ?? null,
      status:         "pending",
      due_date:       invoiceData.due_date        ?? null,
      shipment_id:    invoiceData.shipment_id     ?? null,
      file_url:       publicUrl,
      extracted_by_ai: false,
      created_by:     userId,
    })
    .select("*").single();
  if (error) throw error;
  return data as ProviderInvoice;
}

export async function updateInvoiceStatus(
  companyId: string, id: string, status: string, paymentRef?: string
): Promise<void> {
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "paid") {
    updates.paid_at = new Date().toISOString();
    if (paymentRef) updates.payment_reference = paymentRef;
  }
  await supabase.from("provider_invoices").update(updates).eq("id", id).eq("company_id", companyId);
}

// ── AI INVOICE EXTRACTION ─────────────────────────────────────

export async function extractInvoiceWithAI(
  file: File, apiCall: (base64: string, mimeType: string) => Promise<any>
): Promise<Partial<ProviderInvoice>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await apiCall(base64, file.type);
        resolve(result);
      } catch (err) { reject(err); }
    };
    reader.readAsDataURL(file);
  });
}

// ── FILTERS + KPIs ────────────────────────────────────────────

export function filterProviders(
  providers: LogisticsProvider[], filters: ProviderFilters
): LogisticsProvider[] {
  return providers.filter((p) => {
    const q = filters.search.trim().toLowerCase();
    if (q && !p.name?.toLowerCase().includes(q) &&
        !p.rfc?.toLowerCase().includes(q) &&
        !p.services_offered?.toLowerCase().includes(q)) return false;
    if (filters.type !== "all" && p.provider_type !== filters.type) return false;
    if (filters.status === "active"   && !p.is_active) return false;
    if (filters.status === "inactive" && p.is_active)  return false;
    return true;
  });
}

export function computeProviderKPIs(providers: LogisticsProvider[]): ProviderKPIs {
  const active   = providers.filter((p) => p.is_active);
  const byType: Partial<Record<ProviderType, number>> = {};
  for (const p of active) {
    byType[p.provider_type] = (byType[p.provider_type] ?? 0) + 1;
  }

  // Docs por vencer en 30 días (si ya se cargaron)
  const now      = Date.now();
  const in30days = now + 30 * 86400000;
  let pendingDocs = 0;
  for (const p of providers) {
    for (const doc of p.documents ?? []) {
      if (doc.expiry_date) {
        const exp = new Date(doc.expiry_date).getTime();
        if (exp > now && exp <= in30days) pendingDocs++;
      }
    }
  }

  return {
    total:       providers.length,
    active:      active.length,
    inactive:    providers.length - active.length,
    byType,
    totalAP:     0, // Se calcula con facturas cuando se cargan
    pendingDocs,
  };
}
