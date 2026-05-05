// ════════════════════════════════════════════════════════════════════════
// PARTNER DOCUMENTS SERVICE — CRUD + uploads para partner_documents
// ════════════════════════════════════════════════════════════════════════
// Tabla: partner_documents (FK partner_id → business_partners.id)
// Bucket: partner-documents (privado, 10MB, PDF/PNG/JPG/DOCX/XLSX)
// Path:   {company_id}/{partner_id}/{uuid}.{ext}
//
// Funciones:
//   - listDocumentsByPartner: lista docs del partner ordenados
//   - uploadDocument: sube archivo al bucket + crea row en BD
//   - updateDocument: actualiza metadata (nombre, tipo, vencimiento, notas)
//   - deleteDocument: borra row + archivo del bucket
//   - getSignedUrl: genera URL firmada (válida por 1 hora) para descargar
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

// ── Tipos ────────────────────────────────────────────────────────────
export type PartnerDocument = {
  id?:           string;
  company_id?:   string;
  partner_id?:   string;
  doc_type:      string;
  doc_name:      string;
  file_url:      string;       // path en el bucket (NO URL firmada)
  file_size?:    number;
  file_type?:    string;
  expiry_date?:  string | null;
  notes?:        string;
  uploaded_by?:  string;
  created_at?:   string;
  // Tracking local (modo wizard, sin persistir):
  _localId?:     string;
  _isDeleted?:   boolean;
};

// ── Catálogo de tipos de documento (extensible) ─────────────────────
export type DocumentTypeOption = {
  code:               string;
  label:              string;
  applies_to:         ("customer" | "supplier" | "logistics" | "all")[];
  default_expiry_days?: number;
  recommended:        boolean;
};

export const DOCUMENT_TYPES: DocumentTypeOption[] = [
  // Fiscales
  { code: "constancia_fiscal",     label: "Constancia de situación fiscal",   applies_to: ["all"],         recommended: true,  default_expiry_days: 365 },
  { code: "acta_constitutiva",     label: "Acta constitutiva",                applies_to: ["all"],         recommended: true  },
  { code: "rfc",                    label: "Cédula RFC",                       applies_to: ["all"],         recommended: false },
  { code: "opinion_cumplimiento",  label: "Opinión de cumplimiento (32-D)",   applies_to: ["supplier", "logistics"], recommended: true,  default_expiry_days: 30 },

  // Identidad
  { code: "ine_curp",              label: "INE / CURP del representante",     applies_to: ["all"],         recommended: false },
  { code: "poderes_legales",       label: "Poderes legales notariados",       applies_to: ["all"],         recommended: false },

  // Domicilio
  { code: "comprobante_domicilio", label: "Comprobante de domicilio",         applies_to: ["all"],         recommended: false, default_expiry_days: 90 },

  // Comerciales
  { code: "contrato_marco",         label: "Contrato marco firmado",           applies_to: ["all"],         recommended: true  },
  { code: "nda",                    label: "NDA / Convenio confidencialidad", applies_to: ["all"],         recommended: false },
  { code: "credit_app",              label: "Solicitud de crédito",             applies_to: ["customer"],    recommended: false },

  // Específicos de logística
  { code: "permiso_sct",            label: "Permiso SCT",                      applies_to: ["logistics"],   recommended: true,  default_expiry_days: 365 },
  { code: "poliza_seguro",          label: "Póliza de seguro",                 applies_to: ["logistics"],   recommended: true,  default_expiry_days: 365 },
  { code: "tarjeta_circulacion",    label: "Tarjeta de circulación",           applies_to: ["logistics"],   recommended: false, default_expiry_days: 365 },

  // Otros
  { code: "certificacion_iso",      label: "Certificación ISO / calidad",      applies_to: ["supplier"],    recommended: false, default_expiry_days: 1095 },
  { code: "otro",                    label: "Otro",                              applies_to: ["all"],         recommended: false },
];

// ── SELECT estándar ──────────────────────────────────────────────────
const SELECT_DOC = `
  id, company_id, partner_id, doc_type, doc_name,
  file_url, file_size, file_type, expiry_date, notes,
  uploaded_by, created_at
`;

const BUCKET = "partner-documents";

// ── Helper: extensión del archivo ────────────────────────────────────
function fileExtension(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "bin";
}

// ── Helper: UUID local ───────────────────────────────────────────────
function genUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Listar documentos de un partner ──────────────────────────────────
export async function listDocumentsByPartner(
  companyId: string,
  partnerId: string,
): Promise<PartnerDocument[]> {
  const { data, error } = await supabase
    .from("partner_documents")
    .select(SELECT_DOC)
    .eq("company_id", companyId)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerDocument[];
}

// ── Subir archivo + crear row en BD ──────────────────────────────────
// Retorna el documento recién creado.
export async function uploadDocument(
  companyId: string,
  partnerId: string,
  file: File,
  metadata: {
    doc_type:    string;
    doc_name:    string;
    expiry_date?: string | null;
    notes?:      string;
  },
  userId?: string,
): Promise<PartnerDocument> {
  // 1. Subir archivo al bucket
  const ext        = fileExtension(file);
  const docId      = genUuid();
  const objectPath = `${companyId}/${partnerId}/${docId}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert:       false,
      contentType:  file.type || undefined,
    });

  if (upErr) throw new Error(`Error al subir archivo: ${upErr.message}`);

  // 2. Insertar row en BD
  const { data, error: insErr } = await supabase
    .from("partner_documents")
    .insert({
      company_id:  companyId,
      partner_id:  partnerId,
      doc_type:    metadata.doc_type,
      doc_name:    metadata.doc_name,
      file_url:    objectPath,
      file_size:   file.size,
      file_type:   file.type || `application/${ext}`,
      expiry_date: metadata.expiry_date ?? null,
      notes:       metadata.notes       ?? null,
      uploaded_by: userId               ?? null,
    })
    .select(SELECT_DOC)
    .single();

  if (insErr) {
    // Rollback: borrar archivo del bucket si falló el insert
    await supabase.storage.from(BUCKET).remove([objectPath]).catch(() => {});
    throw new Error(`Error al guardar documento: ${insErr.message}`);
  }

  return data as PartnerDocument;
}

// ── Actualizar metadata de un documento ──────────────────────────────
export async function updateDocument(
  companyId: string,
  documentId: string,
  patch: {
    doc_type?:    string;
    doc_name?:    string;
    expiry_date?: string | null;
    notes?:       string;
  },
): Promise<PartnerDocument> {
  const { data, error } = await supabase
    .from("partner_documents")
    .update(patch)
    .eq("id", documentId)
    .eq("company_id", companyId)
    .select(SELECT_DOC)
    .single();

  if (error) throw new Error(error.message);
  return data as PartnerDocument;
}

// ── Eliminar documento (row + archivo) ───────────────────────────────
export async function deleteDocument(
  companyId: string,
  doc: PartnerDocument,
): Promise<void> {
  if (!doc.id) return;

  // 1. Borrar archivo del bucket
  if (doc.file_url) {
    await supabase.storage.from(BUCKET).remove([doc.file_url]).catch(() => {});
  }

  // 2. Borrar row
  const { error } = await supabase
    .from("partner_documents")
    .delete()
    .eq("id", doc.id)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);
}

// ── Generar URL firmada para descargar (válida 1 hora) ───────────────
export async function getSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}