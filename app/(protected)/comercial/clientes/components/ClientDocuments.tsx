"use client";

import { useState } from "react";
import type { ClientDocument, ClientDocumentType } from "../types/clients.types";
import { DOCUMENT_TYPE_CONFIG } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  documents:  ClientDocument[];
  clientId:   string | null;
  onAdd:      (payload: { name: string; type: ClientDocumentType; url?: string; notes?: string; expires_at?: string }) => Promise<void>;
  onRemove:   (id: string) => Promise<void>;
  loading?:   boolean;
};

const DOC_TYPES: ClientDocumentType[] = [
  "contract", "nda", "power_of_attorney", "tax_id", "certificate", "invoice", "other",
];

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function ClientDocuments({ documents, clientId, onAdd, onRemove, loading }: Props) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    name: "", type: "contract" as ClientDocumentType,
    url: "", notes: "", expires_at: "",
  });

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        name:       form.name,
        type:       form.type,
        url:        form.url       || undefined,
        notes:      form.notes     || undefined,
        expires_at: form.expires_at || undefined,
      });
      setForm({ name: "", type: "contract", url: "", notes: "", expires_at: "" });
      setShowForm(false);
    } finally { setSaving(false); }
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "14px",
      height: "100%", width: "100%",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-second)" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {(t.clients as any)?.documents ?? "Documentos legales"}
          </span>
          <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {documents.length}
          </span>
        </div>
        {clientId && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}
          >
            + {(t.clients as any)?.addDocument ?? "Agregar"}
          </button>
        )}
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div style={{
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", padding: "14px",
          display: "grid", gap: "10px", flexShrink: 0,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.docName ?? "Nombre"} *
              </div>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contrato de servicio 2024" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.docType ?? "Tipo"}
              </div>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ClientDocumentType }))} style={{ ...INPUT, cursor: "pointer" }}>
                {DOC_TYPES.map((type) => {
                  const cfg = DOCUMENT_TYPE_CONFIG[type];
                  const label = (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? type;
                  return <option key={type} value={type}>{label}</option>;
                })}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>URL / Link</div>
              <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://drive.google.com/…" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {(t.clients as any)?.expiresAt ?? "Vence"}
              </div>
              <input type="date" value={form.expires_at} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} style={INPUT} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleAdd} disabled={saving || !form.name.trim()} style={{
              height: "30px", padding: "0 14px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              {saving ? t.general.loading : t.general.save}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer",
            }}>
              {t.general.cancel}
            </button>
          </div>
        </div>
      )}

      {/* DOCUMENT LIST */}
      {!clientId ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {(t.clients as any)?.workspaceEmpty ?? "Selecciona un cliente"}
        </div>
      ) : loading ? (
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>
      ) : documents.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "8px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
          color: "var(--color-text-muted)", fontSize: "13px", padding: "24px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {(t.clients as any)?.noDocuments ?? "Sin documentos legales"}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gap: "8px", alignContent: "start" }}>
          {documents.map((doc) => {
            const cfg   = DOCUMENT_TYPE_CONFIG[doc.type];
            const label = (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? doc.type;
            const expired = doc.expires_at && new Date(doc.expires_at) < new Date();

            return (
              <div key={doc.id} style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)",
                border: `1px solid ${expired ? "var(--color-danger-border)" : "var(--color-border-faint)"}`,
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: cfg.color, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.name}
                  </div>
                  <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    <span style={{ color: cfg.color, fontWeight: 600 }}>{label}</span>
                    {doc.expires_at && (
                      <span style={{ color: expired ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>
                        {expired ? (t.clients as any)?.expired ?? "Vencido" : doc.expires_at.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{
                      height: "26px", width: "26px", borderRadius: "var(--radius-sm)",
                      background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--color-info-text)", textDecoration: "none",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  )}
                  <button onClick={() => onRemove(doc.id)} style={{
                    height: "26px", width: "26px", borderRadius: "var(--radius-sm)",
                    background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--color-danger-text)",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
