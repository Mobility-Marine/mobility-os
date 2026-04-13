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

export async function fetchProviders(companyId: string): Promise<LogisticsProvider[]> {
  const { data } = await supabase
    .from("logistics_providers")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });
  return (data ?? []) as LogisticsProvider[];
}

export async function fetchProvider(
  companyId: string, id: string
): Promise<LogisticsProvider | null> {
  const [{ data: provider }, { data: docs }, { data: invoices }] = await Promise.all([
    supabase.from("logistics_providers").select("*").eq("company_id", companyId).eq("id", id).single(),
    supabase.from("provider_documents").select("*").eq("provider_id", id).order("created_at", { ascending: false }),
    supabase.from("provider_invoices").select("*").eq("provider_id", id).eq("company_id", companyId).order("invoice_date", { ascending: false }),
  ]);
  if (!provider) return null;
  return { ...provider, documents: docs ?? [], invoices: invoices ?? [] } as LogisticsProvider;
}

export async function createProvider(
  companyId: string, userId: string,
  data: Omit<LogisticsProvider, "id" | "company_id" | "created_at" | "updated_at" | "created_by" | "documents" | "invoices">
): Promise<LogisticsProvider> {
  const { data: created, error } = await supabase
    .from("logistics_providers")
    .insert({ ...data, company_id: companyId, created_by: userId })
    .select("*").single();
  if (error) throw error;
  return created as LogisticsProvider;
}

export async function updateProvider(
  companyId: string, id: string, updates: Partial<LogisticsProvider>
): Promise<void> {
  const { documents, invoices, id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("logistics_providers")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function toggleProviderStatus(
  companyId: string, id: string, isActive: boolean
): Promise<void> {
  await supabase.from("logistics_providers")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function deleteProvider(companyId: string, id: string): Promise<void> {
  await supabase.from("logistics_providers").delete().eq("id", id).eq("company_id", companyId);
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
