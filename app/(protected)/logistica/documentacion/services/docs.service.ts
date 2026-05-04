import { supabase } from "@/lib/supabaseClient";
import type { ShipmentDocument, DocFilters, DocStatus } from "../types/docs.types";

export async function fetchDocuments(companyId: string, shipmentId?: string): Promise<ShipmentDocument[]> {
  let q = supabase
    .from("shipment_documents")
    .select("*, shipment:shipments(reference, client:business_partners!client_id(name)), client:business_partners!client_id(name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (shipmentId) q = q.eq("shipment_id", shipmentId);
  const { data } = await q;
  return (data ?? []) as ShipmentDocument[];
}

export async function fetchDocument(companyId: string, id: string): Promise<ShipmentDocument | null> {
  const { data } = await supabase
    .from("shipment_documents")
    .select("*, shipment:shipments(reference, client:business_partners!client_id(name)), client:business_partners!client_id(name)")
    .eq("company_id", companyId).eq("id", id).single();
  return data as ShipmentDocument | null;
}

export async function createDocument(
  companyId: string, userId: string, payload: Partial<ShipmentDocument>
): Promise<ShipmentDocument> {
  const { shipment, client, id: _id, company_id: _cid, created_at: _ca, ...safe } = payload as any;
  const { data, error } = await supabase
    .from("shipment_documents")
    .insert({ ...safe, company_id: companyId, uploaded_by: userId, status: "pending", version: 1 })
    .select("*, shipment:shipments(reference, client:business_partners!client_id(name)), client:business_partners!client_id(name)")
    .single();
  if (error) throw error;
  return data as ShipmentDocument;
}

export async function updateDocument(
  companyId: string, id: string, updates: Partial<ShipmentDocument>
): Promise<void> {
  const { shipment, client, id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("shipment_documents")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateDocStatus(companyId: string, id: string, status: DocStatus): Promise<void> {
  await supabase.from("shipment_documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function deleteDocument(companyId: string, id: string): Promise<void> {
  await supabase.from("shipment_documents").delete().eq("id", id).eq("company_id", companyId);
}

export async function uploadDocumentFile(
  companyId: string, docId: string, file: File
): Promise<string> {
  const ext  = file.name.split(".").pop() ?? "pdf";
  const path = `${companyId}/docs/${docId}.${ext}`;
  const { error } = await supabase.storage.from("shipment-documents").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("shipment-documents").getPublicUrl(path);
  await supabase.from("shipment_documents")
    .update({ file_url: data.publicUrl, file_size: file.size, mime_type: file.type, updated_at: new Date().toISOString() })
    .eq("id", docId).eq("company_id", companyId);
  return data.publicUrl;
}

export function filterDocuments(docs: ShipmentDocument[], filters: DocFilters): ShipmentDocument[] {
  const q = filters.search.trim().toLowerCase();
  return docs.filter((d) => {
    if (q &&
      !d.name.toLowerCase().includes(q) &&
      !d.shipment?.reference?.toLowerCase().includes(q) &&
      !d.client?.name?.toLowerCase().includes(q)
    ) return false;
    if (filters.category !== "all" && d.category !== filters.category) return false;
    if (filters.status   !== "all" && d.status   !== filters.status)   return false;
    if (filters.shipment !== "all" && d.shipment_id !== filters.shipment) return false;
    return true;
  });
}

export function getExpiringDocs(docs: ShipmentDocument[], days = 30): ShipmentDocument[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return docs.filter((d) => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return exp <= cutoff && exp >= new Date();
  });
}
