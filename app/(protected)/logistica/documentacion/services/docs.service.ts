import { supabase } from "@/lib/supabaseClient";
import type { ShipmentDocument, DocFilters, DocStatus } from "../types/docs.types";

// ═══════════════════════════════════════════════════════════════════════
// Document Manager 360° — Lee de la vista unificada vw_shipment_all_documents
//
// La vista combina 3 fuentes:
//   1) shipment_documents       (editables, source="direct")
//   2) accounts_payable PDF/XML (readonly,  source="cxp_pdf"/"cxp_xml")
//   3) cfdi_documents PDF/XML   (readonly,  source="cfdi_pdf"/"cfdi_xml")
//
// Las funciones de write (create/update/delete/upload) solo aplican a
// documentos directos. Los derivados (CXP/CFDI) son readonly desde aquí.
// ═══════════════════════════════════════════════════════════════════════

// Mapea un row de la vista al formato ShipmentDocument que espera la UI
function mapRowToDocument(row: any): ShipmentDocument {
  return {
    ...row,
    shipment: row.shipment_reference
      ? { reference: row.shipment_reference, client: row.shipment_client_name ? { name: row.shipment_client_name } : null }
      : null,
    client: row.doc_client_name ? { name: row.doc_client_name } : null,
  };
}

// Quita el prefijo de la vista. Retorna UUID si es directo, null si es derivado.
function stripSourcePrefix(viewId: string): string | null {
  if (viewId.startsWith("cxp_pdf_")  || viewId.startsWith("cxp_xml_") ||
      viewId.startsWith("cfdi_pdf_") || viewId.startsWith("cfdi_xml_")) {
    return null;
  }
  return viewId;
}

// ─── READ ──────────────────────────────────────────────────────────────

export async function fetchDocuments(companyId: string, shipmentId?: string): Promise<ShipmentDocument[]> {
  let q = supabase
    .from("vw_shipment_all_documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (shipmentId) q = q.eq("shipment_id", shipmentId);
  const { data } = await q;
  return (data ?? []).map(mapRowToDocument);
}

export async function fetchDocument(companyId: string, id: string): Promise<ShipmentDocument | null> {
  const { data } = await supabase
    .from("vw_shipment_all_documents")
    .select("*")
    .eq("company_id", companyId).eq("id", id).maybeSingle();
  return data ? mapRowToDocument(data) : null;
}

// ─── WRITE (solo para documentos directos) ─────────────────────────────

export async function createDocument(
  companyId: string, userId: string, payload: Partial<ShipmentDocument>
): Promise<ShipmentDocument> {
  const {
    shipment, client, source, source_id, source_label, is_editable,
    id: _id, company_id: _cid, created_at: _ca, ...safe
  } = payload as any;

  const { data, error } = await supabase
    .from("shipment_documents")
    .insert({ ...safe, company_id: companyId, uploaded_by: userId, status: "pending", version: 1 })
    .select("id")
    .single();
  if (error) throw error;

  // Re-fetch desde la vista para tener el formato unificado
  const created = await fetchDocument(companyId, data.id);
  if (!created) throw new Error("Documento creado pero no encontrado en vista");
  return created;
}

export async function updateDocument(
  companyId: string, id: string, updates: Partial<ShipmentDocument>
): Promise<void> {
  const realId = stripSourcePrefix(id);
  if (!realId) throw new Error("Este documento es de solo lectura (origen externo)");

  const {
    shipment, client, source, source_id, source_label, is_editable,
    id: _id, company_id: _cid, created_at: _ca, ...safe
  } = updates as any;

  await supabase.from("shipment_documents")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", realId).eq("company_id", companyId);
}

export async function updateDocStatus(companyId: string, id: string, status: DocStatus): Promise<void> {
  const realId = stripSourcePrefix(id);
  if (!realId) throw new Error("Este documento es de solo lectura (origen externo)");
  await supabase.from("shipment_documents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", realId).eq("company_id", companyId);
}

export async function deleteDocument(companyId: string, id: string): Promise<void> {
  const realId = stripSourcePrefix(id);
  if (!realId) throw new Error("Este documento es de solo lectura (origen externo)");
  await supabase.from("shipment_documents").delete().eq("id", realId).eq("company_id", companyId);
}

export async function uploadDocumentFile(
  companyId: string, docId: string, file: File
): Promise<string> {
  const realId = stripSourcePrefix(docId);
  if (!realId) throw new Error("Este documento es de solo lectura (origen externo)");

  const ext  = file.name.split(".").pop() ?? "pdf";
  const path = `${companyId}/docs/${realId}.${ext}`;
  const { error } = await supabase.storage.from("shipment-documents").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("shipment-documents").getPublicUrl(path);
  await supabase.from("shipment_documents")
    .update({ file_url: data.publicUrl, file_size: file.size, mime_type: file.type, updated_at: new Date().toISOString() })
    .eq("id", realId).eq("company_id", companyId);
  return data.publicUrl;
}

// ─── FILTERS ───────────────────────────────────────────────────────────

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
    // Filtro por origen — agrupa PDF + XML
    if (filters.source === "direct" && d.source !== "direct")            return false;
    if (filters.source === "cxp"    && !d.source.startsWith("cxp_"))     return false;
    if (filters.source === "cfdi"   && !d.source.startsWith("cfdi_"))    return false;
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