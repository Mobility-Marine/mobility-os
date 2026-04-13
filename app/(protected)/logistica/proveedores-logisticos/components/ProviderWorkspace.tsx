"use client";

import { useState, useRef } from "react";
import type { LogisticsProvider, ProviderDocument, ProviderInvoice } from "../types/providers.types";
import { PROVIDER_TYPE_CONFIG, DOC_TYPE_CONFIG, INVOICE_STATUS_CONFIG, DOC_TYPES } from "../types/providers.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useAuth }   from "@/lib/auth/AuthProvider";
import { uploadProviderDocument, deleteProviderDocument, uploadProviderInvoice, updateInvoiceStatus, extractInvoiceWithAI } from "../services/providers.service";

type Tab = "info" | "documents" | "invoices" | "shipments";

type Props = {
  provider:      LogisticsProvider | null;
  onUpdate:      (id: string, updates: Partial<LogisticsProvider>) => Promise<void>;
  onToggle:      (id: string, active: boolean) => Promise<void>;
  onDelete:      (id: string) => Promise<void>;
  onReload:      () => Promise<void>;
  saving:        boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function ProviderWorkspace({ provider, onUpdate, onToggle, onDelete, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const { user }      = useAuth();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,         setTab]         = useState<Tab>("info");
  const [editing,     setEditing]     = useState(false);
  const [form,        setForm]        = useState<Partial<LogisticsProvider>>({});
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [showUploadDoc,  setShowUploadDoc]  = useState(false);
  const [showUploadInv,  setShowUploadInv]  = useState(false);

  // Upload doc form
  const docFileRef = useRef<HTMLInputElement>(null);
  const [docForm, setDocForm] = useState({ doc_type: "fiscal", expiry_date: "", notes: "" });
  const [docFile, setDocFile] = useState<File | null>(null);

  // Upload invoice form
  const invFileRef = useRef<HTMLInputElement>(null);
  const [invForm, setInvForm] = useState({ invoice_number: "", invoice_date: "", currency: "USD", total: "", concept: "", due_date: "", shipment_id: "" });
  const [invFile, setInvFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);

  if (!provider) return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "32px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "12px", height: "100%",
    }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tl.workspaceEmpty ?? "Selecciona un proveedor"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
        {tl.workspaceEmptyDesc ?? "Aquí verás información, documentos legales y facturas."}
      </div>
    </div>
  );

  const cfg       = PROVIDER_TYPE_CONFIG[provider.provider_type];
  const typeLabel = tl[`type${provider.provider_type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? provider.provider_type;
  const docs      = provider.documents ?? [];
  const invoices  = provider.invoices  ?? [];

  const TABS: { key: Tab; label: string }[] = [
    { key: "info",      label: tl.tabInfo      ?? "Información"      },
    { key: "documents", label: `${tl.tabDocuments ?? "Documentos"} (${docs.length})` },
    { key: "invoices",  label: `${tl.tabInvoices  ?? "Facturas"} (${invoices.length})` },
    { key: "shipments", label: tl.tabShipments  ?? "Embarques"       },
  ];

  function set(k: keyof LogisticsProvider, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  // ── UPLOAD DOCUMENT ───────────────────────────────────────

  async function handleUploadDoc() {
    if (!docFile || !companyId || !user) return;
    setUploading(true);
    try {
      await uploadProviderDocument(
        companyId, user.id, provider.id,
        docFile, docForm.doc_type, docForm.expiry_date || undefined, docForm.notes || undefined
      );
      await onReload();
      setShowUploadDoc(false);
      setDocFile(null);
      setDocForm({ doc_type: "fiscal", expiry_date: "", notes: "" });
    } catch (e: any) { alert(e.message); }
    finally { setUploading(false); }
  }

  // ── UPLOAD INVOICE ────────────────────────────────────────

  async function handleExtractWithAI() {
    if (!invFile) return;
    setExtracting(true);
    try {
      // Llamada a la API de Claude para extraer datos de la factura
      const response = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_invoice",
          file_name: invFile.name,
          file_size: invFile.size,
        }),
      });
      // Por ahora solo leer el archivo como base64 y dejar que el usuario edite
      // La integración completa de IA se hace cuando el API route esté listo
    } catch {}
    finally { setExtracting(false); }
  }

  async function handleUploadInvoice() {
    if (!invFile || !companyId || !user) return;
    setUploading(true);
    try {
      await uploadProviderInvoice(
        companyId, user.id, provider.id, invFile, {
          invoice_number: invForm.invoice_number,
          invoice_date:   invForm.invoice_date,
          currency:       invForm.currency,
          total:          parseFloat(invForm.total) || 0,
          concept:        invForm.concept || undefined,
          due_date:       invForm.due_date || undefined,
          shipment_id:    invForm.shipment_id || undefined,
        }
      );
      await onReload();
      setShowUploadInv(false);
      setInvFile(null);
      setInvForm({ invoice_number: "", invoice_date: "", currency: "USD", total: "", concept: "", due_date: "", shipment_id: "" });
    } catch (e: any) { alert(e.message); }
    finally { setUploading(false); }
  }

  // ── DOC EXPIRY CHECK ──────────────────────────────────────

  function getDocExpiryStatus(doc: ProviderDocument): "expired" | "soon" | "ok" | null {
    if (!doc.expiry_date) return null;
    const now  = Date.now();
    const exp  = new Date(doc.expiry_date).getTime();
    if (exp < now) return "expired";
    if (exp < now + 30 * 86400000) return "soon";
    return "ok";
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: provider.is_active ? cfg.color : "var(--color-text-muted)", flexShrink: 0 }} />
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {provider.name}
              </span>
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)",
                background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30`,
              }}>
                {typeLabel}
              </span>
              <span style={{
                fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-full)",
                background: provider.is_active ? "var(--color-success-bg)" : "var(--color-bg-subtle)",
                border: `1px solid ${provider.is_active ? "var(--color-success-border)" : "var(--color-border-faint)"}`,
                color: provider.is_active ? "var(--color-success-text)" : "var(--color-text-muted)",
                fontWeight: 700, textTransform: "uppercase",
              }}>
                {provider.is_active ? (tl.providerActive ?? "Activo") : (tl.providerInactive ?? "Inactivo")}
              </span>
            </div>
            {provider.contact_name && (
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                {provider.contact_name}
                {provider.contact_phone && ` · ${provider.contact_phone}`}
                {provider.contact_email && ` · ${provider.contact_email}`}
              </div>
            )}
          </div>
          {provider.rating && (
            <div style={{ fontSize: "16px", color: "var(--color-warning-text)", flexShrink: 0 }}>
              {"★".repeat(provider.rating)}{"☆".repeat(5 - provider.rating)}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {!editing ? (
            <button onClick={() => { setForm({ ...provider }); setEditing(true); }} style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "11px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t.general.edit ?? "Editar"}
            </button>
          ) : (
            <>
              <button onClick={async () => { await onUpdate(provider.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{
                height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-success-text)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
              }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{
                height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
              }}>
                {t.general.cancel}
              </button>
            </>
          )}
          <button onClick={() => onToggle(provider.id, !provider.is_active)} style={{
            height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
            background: provider.is_active ? "var(--color-warning-bg)" : "var(--color-success-bg)",
            border: `1px solid ${provider.is_active ? "var(--color-warning-border)" : "var(--color-success-border)"}`,
            color: provider.is_active ? "var(--color-warning-text)" : "var(--color-success-text)",
            fontSize: "11px", fontWeight: 600, cursor: "pointer",
          }}>
            {provider.is_active ? (tl.deactivate ?? "Desactivar") : (tl.activate ?? "Activar")}
          </button>
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {tl.delete ?? "Eliminar"}
            </button>
          ) : (
            <>
              <button onClick={() => onDelete(provider.id)} style={{
                height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-danger-text)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
              }}>
                {tl.confirmDelete ?? "¿Confirmar?"}
              </button>
              <button onClick={() => setConfirmDel(false)} style={{
                height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
              }}>
                {(t.general as any).no ?? "No"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            height: "36px", padding: "0 14px", border: "none", background: "transparent",
            borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
            color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400,
            cursor: "pointer", transition: "var(--transition-fast)",
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── INFO ── */}
        {tab === "info" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { k: "name",             label: tl.providerName    ?? "Nombre",       cols: "1 / -1" },
                  { k: "contact_name",     label: tl.contactName     ?? "Contacto"      },
                  { k: "contact_email",    label: tl.contactEmail    ?? "Email"         },
                  { k: "contact_phone",    label: tl.contactPhone    ?? "Teléfono"      },
                  { k: "website",          label: tl.website         ?? "Sitio web"     },
                  { k: "rfc",              label: tl.rfc             ?? "RFC"           },
                  { k: "tax_id",           label: tl.taxId           ?? "Tax ID"        },
                  { k: "scac_code",        label: tl.scacCode        ?? "SCAC"          },
                  { k: "payment_terms",    label: tl.paymentTerms    ?? "Condiciones pago" },
                  { k: "coverage_routes",  label: tl.coverageRoutes  ?? "Rutas", cols: "1 / -1" },
                  { k: "services_offered", label: tl.servicesOffered ?? "Servicios", cols: "1 / -1" },
                ].map((f) => (
                  <div key={f.k} style={{ gridColumn: (f as any).cols ?? "auto" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof LogisticsProvider, e.target.value)} style={INPUT} />
                  </div>
                ))}
                {/* Rating */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.rating ?? "Calificación"}</div>
                  <select value={(form as any).rating ?? ""} onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : null)} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">—</option>
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n}/5)</option>)}
                  </select>
                </div>
                {/* Notas */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.notes ?? "Notas"}</div>
                  <textarea value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                {[
                  { label: tl.providerType    ?? "Tipo",         value: typeLabel },
                  { label: tl.rfc             ?? "RFC",           value: provider.rfc },
                  { label: tl.taxId           ?? "Tax ID",        value: provider.tax_id },
                  { label: tl.scacCode        ?? "SCAC",          value: provider.scac_code },
                  { label: tl.contactName     ?? "Contacto",      value: provider.contact_name },
                  { label: tl.contactEmail    ?? "Email",         value: provider.contact_email },
                  { label: tl.contactPhone    ?? "Teléfono",      value: provider.contact_phone },
                  { label: tl.website         ?? "Web",           value: provider.website },
                  { label: tl.paymentTerms    ?? "Pago",          value: provider.payment_terms },
                  { label: tl.rating          ?? "Calificación",  value: provider.rating ? `${"★".repeat(provider.rating)} (${provider.rating}/5)` : null },
                ].map((r) => r.value ? (
                  <div key={r.label}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", wordBreak: "break-all" }}>{r.value}</div>
                  </div>
                ) : null)}
                {provider.coverage_routes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.coverageRoutes ?? "Rutas"}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{provider.coverage_routes}</div>
                  </div>
                )}
                {provider.services_offered && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.servicesOffered ?? "Servicios"}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{provider.services_offered}</div>
                  </div>
                )}
                {provider.notes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tl.notes ?? "Notas"}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>{provider.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {tl.tabDocuments ?? "Documentos legales del proveedor"}
              </div>
              <button onClick={() => setShowUploadDoc(true)} style={{
                height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {tl.uploadDoc ?? "Subir documento"}
              </button>
            </div>

            {/* Upload form */}
            {showUploadDoc && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Tipo de documento</div>
                    <select value={docForm.doc_type} onChange={(e) => setDocForm((p) => ({ ...p, doc_type: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {DOC_TYPES.map((dt) => {
                        const label = tl[`doc${dt.charAt(0).toUpperCase()}${dt.slice(1).replace("_", "")}`]
                          ?? tl[`doc${dt.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`]
                          ?? dt;
                        return <option key={dt} value={dt}>{label}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.docExpiry ?? "Fecha de vencimiento"}</div>
                    <input type="date" value={docForm.expiry_date} onChange={(e) => setDocForm((p) => ({ ...p, expiry_date: e.target.value }))} style={INPUT} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Archivo</div>
                  <div
                    onClick={() => docFileRef.current?.click()}
                    style={{
                      height: "40px", borderRadius: "var(--radius-md)", border: `2px dashed ${docFile ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                      background: docFile ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: "8px", fontSize: "12px",
                      color: docFile ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                    }}
                  >
                    {docFile ? `✓ ${docFile.name}` : "Haz clic para seleccionar archivo"}
                  </div>
                  <input ref={docFileRef} type="file" style={{ display: "none" }} onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleUploadDoc} disabled={uploading || !docFile} style={{
                    height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)",
                    background: "var(--color-brand-blue)", color: "#fff", border: "none",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}>
                    {uploading ? t.general.loading : "Subir"}
                  </button>
                  <button onClick={() => { setShowUploadDoc(false); setDocFile(null); }} style={{
                    height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer",
                  }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {docs.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {tl.noDocuments ?? "Sin documentos cargados"}
              </div>
            ) : docs.map((doc) => {
              const expiryStatus = getDocExpiryStatus(doc);
              const docLabel = tl[`doc${doc.doc_type.charAt(0).toUpperCase()}${doc.doc_type.slice(1).replace("_", "")}`]
                ?? tl[`doc${doc.doc_type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`]
                ?? doc.doc_type;
              return (
                <div key={doc.id} style={{
                  padding: "12px 14px", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                  display: "flex", gap: "12px", alignItems: "center",
                }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.doc_name}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "flex", gap: "8px", marginTop: "2px" }}>
                      <span>{docLabel}</span>
                      {doc.expiry_date && (
                        <span style={{ color: expiryStatus === "expired" ? "var(--color-danger-text)" : expiryStatus === "soon" ? "var(--color-warning-text)" : "var(--color-text-muted)", fontWeight: expiryStatus !== "ok" ? 700 : 400 }}>
                          {expiryStatus === "expired" ? (tl.docExpired ?? "VENCIDO") : expiryStatus === "soon" ? (tl.docExpiringSoon ?? "Por vencer") : ""}
                          {" "}{new Date(doc.expiry_date).toLocaleDateString(locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{
                      height: "26px", padding: "0 10px", borderRadius: "var(--radius-sm)",
                      background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
                      color: "var(--color-text-second)", fontSize: "10px", fontWeight: 600,
                      display: "flex", alignItems: "center", textDecoration: "none",
                    }}>
                      Ver
                    </a>
                    <button onClick={async () => { await deleteProviderDocument(doc.id); await onReload(); }} style={{
                      width: "26px", height: "26px", borderRadius: "var(--radius-sm)",
                      background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "var(--color-danger-text)",
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── INVOICES ── */}
        {tab === "invoices" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Facturas del proveedor — Cuentas por pagar
              </div>
              <button onClick={() => setShowUploadInv(true)} style={{
                height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {tl.newInvoice ?? "Cargar factura"}
              </button>
            </div>

            {/* Upload invoice form */}
            {showUploadInv && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Sube el PDF y el sistema extraerá los datos automáticamente con IA. Puedes editarlos antes de guardar.
                </div>

                {/* Archivo */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Archivo PDF de la factura</div>
                  <div
                    onClick={() => invFileRef.current?.click()}
                    style={{
                      height: "40px", borderRadius: "var(--radius-md)", border: `2px dashed ${invFile ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                      background: invFile ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: "8px", fontSize: "12px",
                      color: invFile ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                    }}
                  >
                    {invFile ? `✓ ${invFile.name}` : "Haz clic para seleccionar PDF"}
                  </div>
                  <input ref={invFileRef} type="file" accept=".pdf,.PDF" style={{ display: "none" }} onChange={(e) => setInvFile(e.target.files?.[0] ?? null)} />
                </div>

                {/* Datos de la factura */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { k: "invoice_number", label: tl.invoiceNumber ?? "No. Factura" },
                    { k: "invoice_date",   label: tl.invoiceDate   ?? "Fecha",        type: "date" },
                    { k: "total",          label: tl.invoiceTotal  ?? "Total",        type: "number" },
                    { k: "due_date",       label: tl.invoiceDueDate ?? "Fecha pago",  type: "date" },
                  ].map((f) => (
                    <div key={f.k}>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{f.label}</div>
                      <input type={f.type ?? "text"} value={(invForm as any)[f.k]} onChange={(e) => setInvForm((p) => ({ ...p, [f.k]: e.target.value }))} style={INPUT} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                    <select value={invForm.currency} onChange={(e) => setInvForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {["USD","MXN","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Referencia embarque</div>
                    <input value={invForm.shipment_id} onChange={(e) => setInvForm((p) => ({ ...p, shipment_id: e.target.value }))} placeholder="Opcional" style={INPUT} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{tl.invoiceConcept ?? "Concepto"}</div>
                  <input value={invForm.concept} onChange={(e) => setInvForm((p) => ({ ...p, concept: e.target.value }))} placeholder="Servicio de transporte…" style={INPUT} />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleUploadInvoice} disabled={uploading || !invFile || !invForm.invoice_number || !invForm.total} style={{
                    height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)",
                    background: "var(--color-brand-blue)", color: "#fff", border: "none",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}>
                    {uploading ? t.general.loading : "Guardar factura"}
                  </button>
                  <button onClick={() => { setShowUploadInv(false); setInvFile(null); }} style={{
                    height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer",
                  }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de facturas */}
            {invoices.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin facturas cargadas
              </div>
            ) : invoices.map((inv) => {
              const stCfg = INVOICE_STATUS_CONFIG[inv.status];
              const stLabel = tl[`invoice${inv.status.charAt(0).toUpperCase()}${inv.status.slice(1)}`] ?? inv.status;
              return (
                <div key={inv.id} style={{
                  padding: "12px 14px", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                  display: "grid", gap: "6px",
                }}>
                  {/* Row 1 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                        {inv.invoice_number}
                      </span>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)",
                        background: stCfg.bg, color: stCfg.color, border: `1px solid ${stCfg.border}`,
                      }}>
                        {stLabel}
                      </span>
                      {inv.extracted_by_ai && (
                        <span style={{ fontSize: "9px", color: "var(--color-info-text)", background: "var(--color-info-bg)", padding: "1px 5px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-info-border)" }}>
                          IA
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                      {inv.currency} ${Number(inv.total).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "flex", gap: "10px" }}>
                    <span>{new Date(inv.invoice_date).toLocaleDateString(locale)}</span>
                    {inv.due_date && <span>Pago: {new Date(inv.due_date).toLocaleDateString(locale)}</span>}
                    {inv.concept && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.concept}</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {inv.status === "pending" && (
                      <button onClick={async () => { await updateInvoiceStatus(provider.company_id, inv.id, "approved"); await onReload(); }} style={{
                        height: "24px", padding: "0 10px", borderRadius: "var(--radius-sm)",
                        background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                        color: "var(--color-info-text)", fontSize: "10px", fontWeight: 600, cursor: "pointer",
                      }}>
                        Aprobar
                      </button>
                    )}
                    {inv.status === "approved" && (
                      <button onClick={async () => { await updateInvoiceStatus(provider.company_id, inv.id, "paid"); await onReload(); }} style={{
                        height: "24px", padding: "0 10px", borderRadius: "var(--radius-sm)",
                        background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
                        color: "var(--color-success-text)", fontSize: "10px", fontWeight: 600, cursor: "pointer",
                      }}>
                        Marcar pagada
                      </button>
                    )}
                    {inv.file_url && (
                      <a href={inv.file_url} target="_blank" rel="noopener noreferrer" style={{
                        height: "24px", padding: "0 10px", borderRadius: "var(--radius-sm)",
                        background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
                        color: "var(--color-text-second)", fontSize: "10px", fontWeight: 600,
                        display: "flex", alignItems: "center", textDecoration: "none",
                      }}>
                        Ver PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SHIPMENTS ── */}
        {tab === "shipments" && (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
            Los embarques asignados a este proveedor aparecerán aquí cuando se construya el módulo de Embarques.
          </div>
        )}
      </div>
    </div>
  );
}
