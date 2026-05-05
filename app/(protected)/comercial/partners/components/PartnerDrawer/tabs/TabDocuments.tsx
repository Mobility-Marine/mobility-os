// ════════════════════════════════════════════════════════════════════════
// TabDocuments — Tab 7 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Lista de documentos legales del partner con:
//   - Upload directo a Supabase Storage (bucket partner-documents)
//   - Tipos sugeridos según rol del partner (cliente/proveedor/logístico)
//   - Vencimientos con badges (vigente / próximo a vencer / vencido)
//   - Descarga vía URL firmada (1 hora)
//   - CRUD inmediato (a diferencia de contactos/direcciones que esperan
//     al save) — porque las subidas son operaciones costosas que no se
//     pueden deferir.
//
// REQUIERE partner.id existente (modo EDIT). En modo CREATE muestra
// un mensaje pidiendo que primero se guarde el partner.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState, useRef } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import {
  PartnerDocument,
  DOCUMENT_TYPES,
  listDocumentsByPartner,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getSignedUrl,
} from "../services/partner-documents.service";
import { Field, FIELD_INPUT, FIELD_SELECT, FIELD_TEXTAREA, SectionTitle } from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabDocumentsProps = {
  partnerId?:  string;
  companyId:   string;
  userId?:     string;
  isCustomer:  boolean;
  isSupplier:  boolean;
  isLogistics: boolean;
};

// ── Estilos ───────────────────────────────────────────────────────────
const ROW: CSSProperties = {
  padding:       "14px 16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems:    "center",
  gap:           "12px",
};

const ICON_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          "30px",
  height:         "30px",
  borderRadius:   "var(--radius-sm, 4px)",
  border:         "1px solid var(--color-border)",
  background:     "transparent",
  color:          "var(--color-text-muted)",
  cursor:         "pointer",
  fontSize:       "14px",
  outline:        "none",
};

const BADGE_BASE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  padding:        "2px 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     700,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
};

const ADD_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  height:         "34px",
  padding:        "0 14px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "13px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px dashed var(--color-brand-blue, #3b82f6)",
  background:     "transparent",
  color:          "var(--color-brand-blue, #3b82f6)",
  outline:        "none",
  alignSelf:      "flex-start",
};

const PRIMARY_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  height:         "32px",
  padding:        "0 14px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "12px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px solid var(--color-brand-blue, #3b82f6)",
  background:     "var(--color-brand-blue, #3b82f6)",
  color:          "#fff",
  outline:        "none",
};

const SECONDARY_BUTTON: CSSProperties = {
  ...PRIMARY_BUTTON,
  background:  "transparent",
  color:       "var(--color-text-primary)",
  borderColor: "var(--color-border)",
};

const EMPTY_STATE: CSSProperties = {
  padding:       "32px 20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "13px",
  lineHeight:    1.6,
};

// ── Helpers ───────────────────────────────────────────────────────────
function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function expiryStatus(date?: string | null): {
  label: string;
  color: string;
  bg:    string;
} | null {
  if (!date) return null;
  const now    = new Date();
  const exp    = new Date(date);
  const days   = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return { label: "Vencido",          color: "var(--color-danger-text)",  bg: "rgba(239, 68, 68, 0.15)"   };
  }
  if (days <= 30) {
    return { label: `Vence en ${days}d`, color: "var(--color-warning-text)", bg: "rgba(245, 158, 11, 0.15)" };
  }
  return { label: "Vigente",           color: "var(--color-success-text)", bg: "rgba(34, 197, 94, 0.15)"   };
}

function getTypeLabel(code: string): string {
  return DOCUMENT_TYPES.find((t) => t.code === code)?.label ?? code;
}

function fileEmoji(fileType?: string): string {
  if (!fileType)              return "📄";
  if (fileType.includes("pdf"))   return "📕";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("word"))  return "📝";
  if (fileType.includes("excel") || fileType.includes("sheet")) return "📊";
  return "📄";
}

// ── Componente ────────────────────────────────────────────────────────
export function TabDocuments({
  partnerId,
  companyId,
  userId,
  isCustomer,
  isSupplier,
  isLogistics,
}: TabDocumentsProps) {
  const [docs,            setDocs]            = useState<PartnerDocument[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [showAddForm,     setShowAddForm]     = useState(false);
  const [newDocType,      setNewDocType]      = useState<string>("constancia_fiscal");
  const [newDocName,      setNewDocName]      = useState<string>("");
  const [newDocExpiry,    setNewDocExpiry]    = useState<string>("");
  const [newDocNotes,     setNewDocNotes]     = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Tipos relevantes según rol del partner ────────────────────────
  const relevantTypes = DOCUMENT_TYPES.filter((t) =>
    t.applies_to.includes("all") ||
    (isCustomer  && t.applies_to.includes("customer")) ||
    (isSupplier  && t.applies_to.includes("supplier")) ||
    (isLogistics && t.applies_to.includes("logistics")),
  );

  // ── Cargar docs si hay partnerId ──────────────────────────────────
  useEffect(() => {
    if (!partnerId || !companyId) return;
    let cancelled = false;
    setLoading(true);
    listDocumentsByPartner(companyId, partnerId)
      .then((d) => { if (!cancelled) setDocs(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [partnerId, companyId]);

  // ── Auto-rellenar nombre al cambiar tipo ──────────────────────────
  function handleTypeChange(code: string) {
    setNewDocType(code);
    if (!newDocName) setNewDocName(getTypeLabel(code));
  }

  // ── Handler: subir archivo seleccionado ──────────────────────────
  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !partnerId || !companyId) return;

    setUploading(true);
    setError(null);
    try {
      const created = await uploadDocument(
        companyId,
        partnerId,
        file,
        {
          doc_type:    newDocType,
          doc_name:    newDocName || file.name,
          expiry_date: newDocExpiry || null,
          notes:       newDocNotes,
        },
        userId,
      );
      setDocs((prev) => [created, ...prev]);
      // Reset form
      setNewDocName("");
      setNewDocExpiry("");
      setNewDocNotes("");
      setShowAddForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  // ── Handler: descargar (URL firmada) ──────────────────────────────
  async function handleDownload(doc: PartnerDocument) {
    setError(null);
    try {
      const url = await getSignedUrl(doc.file_url);
      if (url) window.open(url, "_blank");
      else throw new Error("No se pudo generar la URL de descarga.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── Handler: editar metadata ──────────────────────────────────────
  async function handleEdit(doc: PartnerDocument) {
    const newName = window.prompt("Nuevo nombre del documento:", doc.doc_name);
    if (newName === null) return;
    try {
      const updated = await updateDocument(companyId, doc.id!, { doc_name: newName });
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── Handler: eliminar ─────────────────────────────────────────────
  async function handleDelete(doc: PartnerDocument) {
    const ok = window.confirm(`¿Eliminar "${doc.doc_name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await deleteDocument(companyId, doc);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── Modo CREATE: bloquear hasta guardar el partner ────────────────
  if (!partnerId) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={EMPTY_STATE}>
          📑 <strong>Guarda primero el partner</strong>
          <br />
          Los documentos se asocian al partner. Completa los tabs Identidad y Fiscal,
          presiona <strong>Guardar</strong>, vuelve a abrir el partner en modo edición y
          carga los documentos legales aquí.
        </div>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Documentos legales del partner</SectionTitle>

      <div
        style={{
          fontSize:    "12px",
          color:       "var(--color-text-muted)",
          lineHeight:  1.55,
        }}
      >
        Sube documentos legales (constancia fiscal, acta constitutiva, INE, contratos, etc.).
        Tipos de archivo aceptados: PDF, PNG, JPG, DOCX, XLSX. Tamaño máximo: 10 MB.
        Los archivos se guardan en un bucket privado y solo son accesibles por miembros de tu empresa.
      </div>

      {error && (
        <div
          style={{
            padding:      "10px 14px",
            borderRadius: "var(--radius-md)",
            background:   "rgba(239, 68, 68, 0.1)",
            color:        "var(--color-danger-text)",
            fontSize:     "12px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && <div style={{ color: "var(--color-text-muted)" }}>⏳ Cargando documentos...</div>}

      {!loading && docs.length === 0 && !showAddForm && (
        <div style={EMPTY_STATE}>
          📑 No hay documentos cargados.
          <br />
          Haz clic en <strong>Agregar documento</strong> para subir el primero.
        </div>
      )}

      {/* ─── Lista de documentos ─── */}
      {docs.map((d) => {
        const status = expiryStatus(d.expiry_date);
        return (
          <div key={d.id} style={ROW}>
            <span style={{ fontSize: "24px" }}>{fileEmoji(d.file_type)}</span>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize:   "13px",
                    fontWeight: 700,
                    color:      "var(--color-text-primary)",
                    overflow:   "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {d.doc_name}
                </span>
                {status && (
                  <span style={{ ...BADGE_BASE, color: status.color, background: status.bg }}>
                    {status.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <span>📁 {getTypeLabel(d.doc_type)}</span>
                <span>📦 {formatBytes(d.file_size)}</span>
                {d.expiry_date && <span>⏰ Vence {formatDate(d.expiry_date)}</span>}
                <span>📅 Subido {formatDate(d.created_at)}</span>
              </div>
              {d.notes && (
                <div
                  style={{
                    fontSize:   "11px",
                    color:      "var(--color-text-muted)",
                    fontStyle:  "italic",
                    marginTop:  "2px",
                  }}
                >
                  {d.notes}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleDownload(d)}
                style={ICON_BUTTON}
                title="Descargar"
                aria-label="Descargar"
              >
                ⬇️
              </button>
              <button
                type="button"
                onClick={() => handleEdit(d)}
                style={ICON_BUTTON}
                title="Renombrar"
                aria-label="Renombrar"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => handleDelete(d)}
                style={ICON_BUTTON}
                title="Eliminar"
                aria-label="Eliminar"
              >
                🗑️
              </button>
            </div>
          </div>
        );
      })}

      {/* ─── Formulario de subida ─── */}
      {showAddForm && (
        <div
          style={{
            padding:        "16px",
            borderRadius:   "var(--radius-md)",
            border:         "1px solid var(--color-brand-blue, #3b82f6)",
            background:     "rgba(59, 130, 246, 0.05)",
            display:        "flex",
            flexDirection:  "column",
            gap:            "12px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            ➕ Agregar nuevo documento
          </div>

          <div
            style={{
              display:             "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap:                 "12px",
            }}
          >
            <Field label="Tipo de documento" required>
              <select
                value={newDocType}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={FIELD_SELECT}
              >
                {relevantTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.recommended ? "★ " : ""}{t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nombre del documento" required>
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder={getTypeLabel(newDocType)}
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Fecha de vencimiento (opcional)" hint="Si no aplica, déjalo vacío.">
              <input
                type="date"
                value={newDocExpiry}
                onChange={(e) => setNewDocExpiry(e.target.value)}
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Notas (opcional)">
              <input
                type="text"
                value={newDocNotes}
                onChange={(e) => setNewDocNotes(e.target.value)}
                placeholder="Observaciones internas"
                style={FIELD_INPUT}
              />
            </Field>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.doc,.xls"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !newDocName}
              style={{
                ...PRIMARY_BUTTON,
                opacity: uploading || !newDocName ? 0.5 : 1,
                cursor:  uploading || !newDocName ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "Subiendo..." : "📂 Seleccionar archivo y subir"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewDocName("");
                setNewDocExpiry("");
                setNewDocNotes("");
              }}
              disabled={uploading}
              style={SECONDARY_BUTTON}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!showAddForm && !loading && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={ADD_BUTTON}
        >
          ➕ Agregar documento
        </button>
      )}
    </div>
  );
}