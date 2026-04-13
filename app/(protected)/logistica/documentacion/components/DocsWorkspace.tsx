"use client";
import { useState, useRef } from "react";
import type { ShipmentDocument, DocCategory, DocStatus } from "../types/docs.types";
import { DOC_CATEGORY_CONFIG, DOC_STATUS_CONFIG } from "../types/docs.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }      from "@/lib/tenant/TenantProvider";
import { updateDocStatus, uploadDocumentFile } from "../services/docs.service";

type Props = {
  doc:       ShipmentDocument | null;
  onUpdate:  (id: string, updates: Partial<ShipmentDocument>) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
  onReload:  () => Promise<void>;
  saving:    boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      {children}
    </div>
  );
}

export default function DocsWorkspace({ doc, onUpdate, onDelete, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState<Partial<ShipmentDocument>>({});
  const [uploading,  setUploading]  = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!doc) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tl.docWorkspaceEmpty ?? "Selecciona un documento"}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{tl.docWorkspaceEmptyDesc ?? "Aquí verás el detalle del documento."}</div>
    </div>
  );

  const catCfg = DOC_CATEGORY_CONFIG[doc.category];
  const stCfg  = DOC_STATUS_CONFIG[doc.status];
  const catLabel = tl[`cat${doc.category.split("_").map((w: string) => w.charAt(0).toUpperCase()+w.slice(1)).join("")}`] ?? doc.category;
  const stLabel  = (stCfg as any) ? (tl[`status${doc.status.charAt(0).toUpperCase()}${doc.status.slice(1)}${doc.status === "pending" || doc.status === "rejected" ? "2" : ""}`] ?? doc.status) : doc.status;

  const isExpired  = doc.expiry_date && new Date(doc.expiry_date) < new Date();
  const isExpiring = doc.expiry_date && !isExpired && new Date(doc.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000);

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    setUploading(true);
    try {
      await uploadDocumentFile(companyId, doc.id, file);
      await onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    await onUpdate(doc.id, form);
    setEditing(false);
    setForm({});
  }

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: catCfg.bg, border: `1px solid ${catCfg.border}`, color: catCfg.color }}>{catLabel}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color }}>{stLabel}</span>
              {doc.required && <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)" }}>Requerido</span>}
              {isExpired  && <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)" }}>VENCIDO</span>}
              {isExpiring && <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", color: "var(--color-warning-text)" }}>Por vencer</span>}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {doc.shipment?.reference && `Embarque: ${doc.shipment.reference}`}
              {doc.client?.name && ` · ${doc.client.name}`}
              {` · v${doc.version}`}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {!editing ? (
            <button onClick={() => { setForm({ ...doc }); setEditing(true); }} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t.general.edit}
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {/* Status transitions */}
          {doc.status === "pending" && (
            <button onClick={async () => { await updateDocStatus(companyId!, doc.id, "received"); await onReload(); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              Marcar recibido
            </button>
          )}
          {doc.status === "received" && (
            <>
              <button onClick={async () => { await updateDocStatus(companyId!, doc.id, "validated"); await onReload(); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {tl.validateDoc ?? "Validar"}
              </button>
              <button onClick={async () => { await updateDocStatus(companyId!, doc.id, "rejected"); await onReload(); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {tl.rejectDoc ?? "Rechazar"}
              </button>
            </>
          )}

          {/* File actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar
              </a>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {uploading ? "Subiendo…" : (tl.uploadFile ?? "Subir archivo")}
            </button>
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUploadFile} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.xml" />
          </div>

          {/* Delete */}
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", cursor: "pointer" }}>
              {t.general.delete}
            </button>
          ) : (
            <>
              <button onClick={() => onDelete(doc.id)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>¿Eliminar?</button>
              <button onClick={() => setConfirmDel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>{(t.general as any).no ?? "No"}</button>
            </>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          {/* Nombre */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tl.docName2 ?? "Nombre del documento"}>
              {editing ? (
                <input value={(form as any).name ?? ""} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} style={INPUT} />
              ) : (
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{doc.name}</div>
              )}
            </Field>
          </div>

          {/* Categoría */}
          <Field label={tl.docCategory ?? "Categoría"}>
            {editing ? (
              <select value={(form as any).category ?? doc.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value as DocCategory }))} style={{ ...INPUT, cursor: "pointer" }}>
                {(Object.keys(DOC_CATEGORY_CONFIG) as DocCategory[]).map((k) => (
                  <option key={k} value={k}>{tl[`cat${k.split("_").map((w: string) => w.charAt(0).toUpperCase()+w.slice(1)).join("")}`] ?? k}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: "12px", fontWeight: 700, color: catCfg.color }}>{catLabel}</div>
            )}
          </Field>

          {/* Estado */}
          <Field label={tl.docStatus ?? "Estado"}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: stCfg.color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: stCfg.color }}>{stLabel}</span>
            </div>
          </Field>

          {/* Vinculado */}
          <Field label={tl.docLinkedShipment ?? "Embarque vinculado"}>
            <div style={{ fontSize: "12px", color: "var(--color-text-primary)", fontFamily: "monospace" }}>
              {doc.shipment?.reference ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
            </div>
          </Field>

          {/* Cliente */}
          <Field label={tl.docLinkedClient ?? "Cliente"}>
            <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>
              {doc.shipment?.client?.name ?? doc.client?.name ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
            </div>
          </Field>

          {/* Versión */}
          <Field label={tl.docVersion ?? "Versión"}>
            <div style={{ fontSize: "12px", color: "var(--color-text-primary)" }}>v{doc.version}</div>
          </Field>

          {/* Fecha vencimiento */}
          <Field label={tl.docExpiry2 ?? "Fecha de vencimiento"}>
            {editing ? (
              <input type="date" value={(form as any).expiry_date ?? ""} onChange={(e) => setForm(p => ({ ...p, expiry_date: e.target.value || null }))} style={INPUT} />
            ) : (
              <div style={{ fontSize: "12px", color: isExpired ? "var(--color-danger-text)" : isExpiring ? "var(--color-warning-text)" : "var(--color-text-primary)", fontWeight: (isExpired || isExpiring) ? 700 : 400 }}>
                {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString(locale) : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
              </div>
            )}
          </Field>

          {/* Requerido */}
          <Field label={tl.docRequired ?? "Requerido"}>
            {editing ? (
              <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-primary)" }}>
                <input type="checkbox" checked={!!(form as any).required} onChange={(e) => setForm(p => ({ ...p, required: e.target.checked }))} />
                {(form as any).required ? "Sí" : "No"}
              </label>
            ) : (
              <div style={{ fontSize: "12px", fontWeight: doc.required ? 700 : 400, color: doc.required ? "var(--color-warning-text)" : "var(--color-text-muted)" }}>
                {doc.required ? "Sí — requerido" : "No"}
              </div>
            )}
          </Field>

          {/* Archivo */}
          {doc.file_url && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Archivo">
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_url.split("/").pop()}</div>
                    {doc.file_size && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{(doc.file_size / 1024).toFixed(1)} KB</div>}
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", textDecoration: "none" }}>Ver →</a>
                </div>
              </Field>
            </div>
          )}

          {/* Notas */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tl.docNotes ?? "Notas"}>
              {editing ? (
                <textarea rows={3} value={(form as any).notes ?? ""} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }} />
              ) : (
                <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: doc.notes ? "var(--color-text-primary)" : "var(--color-text-muted)", lineHeight: 1.6, minHeight: "50px" }}>
                  {doc.notes ?? "Sin notas."}
                </div>
              )}
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
