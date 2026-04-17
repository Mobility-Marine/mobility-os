"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Shipment, ShipmentStatus, ShipmentService, ServiceLineType } from "../types/shipments.types";
import {
  SHIPMENT_STATUS_CONFIG, SERVICE_TYPE_CONFIG, SERVICE_TYPE_CATEGORY,
  NEXT_STATUS, STATUS_FLOW, SERVICE_LINE_TYPES, INCOTERMS, CURRENCIES,
} from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { upsertShipmentService, deleteShipmentService, fetchLogisticsProviders } from "../services/shipments.service";
import { fetchDocuments, createDocument, uploadDocumentFile, deleteDocument } from "../../../logistica/documentacion/services/docs.service";
import { supabase as sb } from "@/lib/supabaseClient";
import type { ShipmentDocument, DocCategory } from "../../../logistica/documentacion/types/docs.types";
import { DOC_CATEGORY_CONFIG, DOC_STATUS_CONFIG } from "../../../logistica/documentacion/types/docs.types";
import { useRef, useEffect } from "react";

// ── PANEL FACTURA PROVEEDOR ───────────────────────────────────
function ProveedorFacturaPanel({
  shipment, companyId, onCreated,
}: {
  shipment:   Shipment;
  companyId:  string;
  onCreated:  () => Promise<void>;
}) {
  // usa sb y las funciones importadas al inicio del archivo

  const [hasAP,     setHasAP]     = useState<boolean | null>(null);
  const [apData,    setApData]    = useState<{ id: string; pdf_url?: string } | null>(null);
  const [open,      setOpen]      = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [providers, setProviders] = useState<{ id: string; name: string; rfc?: string }[]>([]);
  const [pdfFile,   setPdfFile]   = useState<File | null>(null);
  const [xmlFile,   setXmlFile]   = useState<File | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const xmlRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    logistics_provider_id: shipment.provider_id ?? "",
    supplier_name:   (shipment as any).provider?.name ?? "",
    supplier_rfc:    "",
    document_number: "",
    document_date:   new Date().toISOString().split("T")[0],
    due_date:        "",
    currency:        shipment.currency ?? "USD",
    subtotal:        "",
    tax_amount:      "",
    total:           String(shipment.provider_cost > 0 ? shipment.provider_cost : ""),
    exchange_rate:   "1",
  });

  useEffect(() => {
    sb.from("accounts_payable")
      .select("id, pdf_url").eq("related_shipment_id", shipment.id).limit(1)
      .then(({ data }: any) => {
        if ((data ?? []).length > 0) { setHasAP(true); setApData(data[0]); }
        else setHasAP(false);
      });
    sb.from("logistics_providers")
      .select("id, name, rfc").eq("company_id", companyId).eq("is_active", true).order("name")
      .then(({ data }: any) => setProviders(data ?? []));
  }, [shipment.id, companyId]);

  function selectProvider(id: string) {
    const p = providers.find((x: any) => x.id === id);
    setForm(f => ({ ...f, logistics_provider_id: id, supplier_name: p?.name ?? "", supplier_rfc: p?.rfc ?? "" }));
  }

  function calcTotals(field: "subtotal" | "total", val: string) {
    const n = parseFloat(val) || 0;
    if (field === "total") {
      setForm(f => ({ ...f, total: val, subtotal: (n / 1.16).toFixed(2), tax_amount: (n - n / 1.16).toFixed(2) }));
    } else {
      setForm(f => ({ ...f, subtotal: val, tax_amount: (n * 0.16).toFixed(2), total: (n * 1.16).toFixed(2) }));
    }
  }

  async function handleSave() {
    if (!form.supplier_name || !form.total) return;
    setSaving(true);
    try {
      const { data: user } = await sb.auth.getUser();
      const userId = user.user?.id ?? null;
      const totalNum = parseFloat(form.total);
      if (!totalNum || totalNum <= 0) return;

      // 1. Crear registro en accounts_payable
      const { data: ap, error: apErr } = await sb.from("accounts_payable").insert({
        company_id:            companyId,
        logistics_provider_id: form.logistics_provider_id || null,
        supplier_type:         "logistics",
        supplier_name:         form.supplier_name,
        supplier_rfc:          form.supplier_rfc || null,
        document_type:         "invoice",
        document_number:       form.document_number || null,
        document_date:         form.document_date,
        due_date:              form.due_date || null,
        currency:              form.currency,
        subtotal:              parseFloat(form.subtotal) || 0,
        tax_amount:            parseFloat(form.tax_amount) || 0,
        total:                 totalNum,
        balance:               totalNum,
        exchange_rate:         parseFloat(form.exchange_rate) || 1,
        status:                "pending",
        payment_status:        "not_scheduled",
        related_shipment_id:   shipment.id,
        notes:                 `Servicio logístico — ${shipment.reference}`,
        created_by:            userId,
      }).select("id").single();

      if (apErr) { console.error("AP insert error:", apErr); return; }
      if (!ap)   { console.error("AP insert returned null"); return; }

      // 2. Actualizar provider_cost INMEDIATAMENTE después del insert
      //    Sumar facturas previas de este embarque + la nueva
      const { data: prevAP } = await sb
        .from("accounts_payable")
        .select("total")
        .eq("related_shipment_id", shipment.id)
        .neq("id", ap.id);

      const prevTotal         = (prevAP ?? []).reduce((s: number, r: any) => s + (parseFloat(r.total) || 0), 0);
      const totalProviderCost = prevTotal + totalNum;

      const { data: sh } = await sb
        .from("shipments")
        .select("total")
        .eq("id", shipment.id)
        .single();

      const { error: updateErr } = await sb
        .from("shipments")
        .update({
          provider_cost: totalProviderCost,
          profit:        (sh?.total ?? 0) - totalProviderCost,
          updated_at:    new Date().toISOString(),
        })
        .eq("id", shipment.id);

      if (updateErr) console.error("Shipment update error:", updateErr);

      // 3. Subir PDF si se adjuntó (secundario — no bloquea el flujo)
      let pdfUrl: string | null = null;
      if (pdfFile) {
        try {
          const doc = await createDocument(companyId, userId, {
            shipment_id: shipment.id,
            name:        `Factura proveedor — ${form.supplier_name}${form.document_number ? ` (${form.document_number})` : ""}`,
            category:    "factura_proveedor",
            status:      "approved",
            version:     1,
            required:    false,
          });
          pdfUrl = await uploadDocumentFile(companyId, doc.id, pdfFile);
          await sb.from("accounts_payable")
            .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
            .eq("id", ap.id);
        } catch (pdfErr) { console.error("PDF upload error:", pdfErr); }
      }

      // 4. Subir XML si se adjuntó (secundario)
      if (xmlFile) {
        try {
          const docXml = await createDocument(companyId, userId, {
            shipment_id: shipment.id,
            name:        `XML factura proveedor — ${form.supplier_name}${form.document_number ? ` (${form.document_number})` : ""}`,
            category:    "factura_proveedor",
            status:      "approved",
            version:     1,
            required:    false,
          });
          const xmlUrl = await uploadDocumentFile(companyId, docXml.id, xmlFile);
          await sb.from("accounts_payable")
            .update({ xml_url: xmlUrl, updated_at: new Date().toISOString() })
            .eq("id", ap.id);
        } catch (xmlErr) { console.error("XML upload error:", xmlErr); }
      }

      setHasAP(true);
      setApData({ id: ap.id, pdf_url: pdfUrl ?? undefined });
      setOpen(false);
      await onCreated();

    } finally { setSaving(false); }
  }

  const INPUT_S: React.CSSProperties = {
    width: "100%", height: "32px", padding: "0 8px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-base)", color: "var(--color-text-primary)",
    fontSize: "12px", outline: "none", boxSizing: "border-box",
  };

  if (hasAP === null) return null;

  // ── Ya tiene AP registrado ──
  if (hasAP) return (
    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", color: "var(--color-success-text)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Factura de proveedor registrada en Cuentas por Pagar
      </div>
      {apData?.pdf_url && (
        <a href={apData.pdf_url} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", textDecoration: "none", padding: "3px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-success-border)", background: "var(--color-bg-base)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Ver factura PDF
        </a>
      )}
    </div>
  );

  // ── Pendiente de registrar ──
  return (
    <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? "12px" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444" }}>
            Factura de proveedor pendiente de registrar
          </span>
        </div>
        <button onClick={() => setOpen(v => !v)}
          style={{ height: "26px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "#ef4444", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
          {open ? "Cancelar" : "Registrar factura"}
        </button>
      </div>

      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {/* Proveedor */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>Proveedor *</div>
            <select value={form.logistics_provider_id} onChange={e => selectProvider(e.target.value)} style={{ ...INPUT_S, cursor: "pointer" }}>
              <option value="">— Seleccionar —</option>
              {providers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {!form.logistics_provider_id && (
              <input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                placeholder="O escribe el nombre del proveedor" style={{ ...INPUT_S, marginTop: "4px" }} />
            )}
          </div>

          {/* Campos de documento */}
          {[
            { k: "document_number", label: "Folio factura",  type: "text" },
            { k: "document_date",   label: "Fecha factura",  type: "date" },
            { k: "due_date",        label: "Vencimiento",    type: "date" },
            { k: "currency",        label: "Moneda",         type: "select" },
          ].map(f => (
            <div key={f.k}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{f.label}</div>
              {f.type === "select" ? (
                <select value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ ...INPUT_S, cursor: "pointer" }}>
                  {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input type={f.type} value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={INPUT_S} />
              )}
            </div>
          ))}

{/* Tipo de cambio — solo si moneda difiere del embarque */}
          {form.currency !== (shipment.currency ?? "USD") && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>
                Tipo de cambio ({form.currency} → {shipment.currency ?? "USD"}) *
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.exchange_rate}
                  onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))}
                  placeholder="Ej: 17.50"
                  style={{ ...INPUT_S, flex: 1 }}
                />
                {form.total && form.exchange_rate && (
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                    = {shipment.currency} ${(parseFloat(form.total) / parseFloat(form.exchange_rate)).toFixed(2)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                Cuántos {form.currency} equivalen a 1 {shipment.currency ?? "USD"}
              </div>
            </div>
          )}
          
          {/* Importes */}
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              { k: "subtotal",   label: "Subtotal" },
              { k: "tax_amount", label: "IVA"      },
              { k: "total",      label: "Total *"  },
            ].map(f => (
              <div key={f.k}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{f.label}</div>
                <input type="number" min="0" value={(form as any)[f.k]}
                  onChange={e => f.k !== "tax_amount" ? calcTotals(f.k as any, e.target.value) : setForm(p => ({ ...p, tax_amount: e.target.value }))}
                  placeholder="0.00" style={INPUT_S} />
              </div>
            ))}
          </div>

          {/* Adjuntar archivos */}
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {/* PDF */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>
                Factura PDF
                <span style={{ color: "var(--color-text-muted)", fontWeight: 400, textTransform: "none", marginLeft: "4px" }}>(opcional)</span>
              </div>
              <div
                onClick={() => pdfRef.current?.click()}
                style={{ height: "36px", borderRadius: "var(--radius-md)", border: `1px dashed ${pdfFile ? "var(--color-success-text)" : "var(--color-border)"}`, background: pdfFile ? "var(--color-success-bg)" : "var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", fontSize: "11px", color: pdfFile ? "var(--color-success-text)" : "var(--color-text-muted)", fontWeight: pdfFile ? 600 : 400 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {pdfFile ? pdfFile.name.substring(0, 20) + (pdfFile.name.length > 20 ? "…" : "") : "Subir PDF"}
              </div>
              <input ref={pdfRef} type="file" accept=".pdf" style={{ display: "none" }}
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
            </div>

            {/* XML */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>
                XML SAT
                <span style={{ color: "var(--color-text-muted)", fontWeight: 400, textTransform: "none", marginLeft: "4px" }}>(opcional)</span>
              </div>
              <div
                onClick={() => xmlRef.current?.click()}
                style={{ height: "36px", borderRadius: "var(--radius-md)", border: `1px dashed ${xmlFile ? "var(--color-success-text)" : "var(--color-border)"}`, background: xmlFile ? "var(--color-success-bg)" : "var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", fontSize: "11px", color: xmlFile ? "var(--color-success-text)" : "var(--color-text-muted)", fontWeight: xmlFile ? 600 : 400 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                {xmlFile ? xmlFile.name.substring(0, 20) + (xmlFile.name.length > 20 ? "…" : "") : "Subir XML"}
              </div>
              <input ref={xmlRef} type="file" accept=".xml" style={{ display: "none" }}
                onChange={e => setXmlFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {/* Botón guardar */}
          <button onClick={handleSave} disabled={saving || !form.supplier_name || !form.total}
            style={{ gridColumn: "1 / -1", height: "36px", borderRadius: "var(--radius-md)", background: "#ef4444", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: saving || (!form.supplier_name || !form.total) ? "not-allowed" : "pointer", opacity: (!form.supplier_name || !form.total) ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            {saving ? (
              <>"Guardando…"</>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Registrar en Cuentas por Pagar{pdfFile || xmlFile ? " y subir archivos" : ""}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

type Tab = "detail" | "services" | "documents" | "timeline";
type Props = {
  shipment:       Shipment | null;
  onStatusChange: (id: string, status: ShipmentStatus) => Promise<void>;
  onUpdate:       (id: string, updates: Partial<Shipment>) => Promise<void>;
  onReload:       () => Promise<void>;
  saving:         boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

// ── FLUJOS POR CATEGORÍA ──────────────────────────────────────
// Logística: flujo completo con tracking físico
const LOGISTICS_FLOW: ShipmentStatus[] = [
  "draft", "coordinating", "pickup_scheduled",
  "in_transit", "at_destination", "delivered",
];

// Consultoría/Seguro: flujo simplificado
const CONSULTING_FLOW: ShipmentStatus[] = [
  "draft", "coordinating", "delivered",
];

const CONSULTING_NEXT: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  draft:        "coordinating",
  coordinating: "delivered",
};

// Etiquetas especiales para flujo de consultoría
const CONSULTING_LABELS: Partial<Record<ShipmentStatus, string>> = {
  draft:        "Borrador",
  coordinating: "En proceso",
  delivered:    "Completado",
  invoiced:     "Facturado",
  cancelled:    "Cancelado",
};

export default function ShipmentWorkspace({ shipment, onStatusChange, onUpdate, onReload, saving }: Props) {
  const { t, lang }   = useTranslation();
  const { companyId } = useTenant();
  const router        = useRouter();
  const tl            = (t.logistics as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [tab,           setTab]           = useState<Tab>("detail");
  const [editing,       setEditing]       = useState(false);
  const [form,          setForm]          = useState<Partial<Shipment>>({});
  const [confirmNext,   setConfirmNext]   = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Services
  const [addingSvc, setAddingSvc] = useState(false);
  const [svcForm, setSvcForm] = useState<Partial<ShipmentService> & { product_id?: string }>({
    service_type: "terrestre", currency: "USD", price: 0,
  });
  const [savingSvc,   setSavingSvc]   = useState(false);
  const [providers,       setProviders]       = useState<{ id: string; name: string }[]>([]);
  const [serviceProducts, setServiceProducts] = useState<{
    id: string; name: string; unit_price: number; currency: string;
    sat_product_code: string; sat_unit_code: string; unit: string;
  }[]>([]);

  useEffect(() => {
    if (!companyId) return;
    fetchLogisticsProviders(companyId).then(setProviders);
    // Cargar servicios del catálogo (product_type = 'service')
    sb.from("products")
      .select("id, name, unit_price, currency, sat_product_code, sat_unit_code, unit")
      .eq("company_id", companyId)
      .eq("product_type", "service")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setServiceProducts(data ?? []));
  }, [companyId]);

function selectServiceProduct(productId: string) {
    const p = serviceProducts.find(x => x.id === productId);
    if (!p) return;
    setSvcForm(prev => ({
      ...prev,
      product_id:  p.id,
      description: p.name,
      price:       p.unit_price,
      currency:    p.currency,
    }));
  }
  
  // Documents
  const [docs,         setDocs]         = useState<ShipmentDocument[]>([]);
  const [loadingDocs,  setLoadingDocs]  = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocName,   setNewDocName]   = useState("");
  const [newDocCat,    setNewDocCat]    = useState<DocCategory>("other");
  const [showDocForm,  setShowDocForm]  = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);
  const pendingDocRef = useRef<{ name: string; category: DocCategory } | null>(null);

  useEffect(() => {
    if (tab !== "documents" || !companyId || !shipment) return;
    setLoadingDocs(true);
    fetchDocuments(companyId, shipment.id)
      .then(setDocs)
      .finally(() => setLoadingDocs(false));
  }, [tab, shipment?.id, companyId]);

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !companyId || !pendingDocRef.current) return;
    setUploadingDoc(true);
    try {
      const doc = await createDocument(companyId, "system", {
        shipment_id: shipment!.id,
        name:        pendingDocRef.current.name || file.name,
        category:    pendingDocRef.current.category,
        status:      "pending",
        version:     1,
        required:    false,
      });
      await uploadDocumentFile(companyId, doc.id, file);
      const updated = await fetchDocuments(companyId, shipment!.id);
      setDocs(updated);
      setShowDocForm(false);
      setNewDocName("");
      setNewDocCat("other");
   } catch (err) {
      console.error(err);
    } finally {
      setUploadingDoc(false);
      pendingDocRef.current = null;
      if (docFileRef.current) docFileRef.current.value = "";
    }
  }

  async function handleDocDelete(docId: string) {
    if (!companyId) return;
    await deleteDocument(companyId, docId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  if (!shipment) return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tl.workspaceEmpty ?? "Selecciona un servicio"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
        {tl.workspaceEmptyDesc ?? "Aquí verás el detalle, documentos y estado del servicio."}
      </div>
    </div>
  );

  // ── Detectar categoría del servicio ───────────────────────
  const isConsulting = SERVICE_TYPE_CATEGORY[shipment.service_type] === "consulting";
  const activeFlow   = isConsulting ? CONSULTING_FLOW   : LOGISTICS_FLOW;
  const activeNext   = isConsulting ? CONSULTING_NEXT   : NEXT_STATUS;

  const stCfg       = SHIPMENT_STATUS_CONFIG[shipment.status];
  const svcCfg      = SERVICE_TYPE_CONFIG[shipment.service_type];
  const nextStatus  = activeNext[shipment.status];
  const isCancelled = shipment.status === "cancelled";
  const isDelivered = ["delivered", "invoiced"].includes(shipment.status);
  const isDone      = isCancelled || isDelivered;
  const services    = shipment.services ?? [];

  function getStatusLabel(s: ShipmentStatus): string {
    if (isConsulting && CONSULTING_LABELS[s]) return CONSULTING_LABELS[s]!;
    const key = `status${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[key] ?? s;
  }

  function getNextLabel(): string {
    if (!nextStatus) return "";
    if (isConsulting) {
      const labels: Partial<Record<ShipmentStatus, string>> = {
        coordinating: "Iniciar proceso",
        delivered:    "Marcar como completado",
      };
      return labels[nextStatus] ?? `Avanzar`;
    }
    const labels: Partial<Record<ShipmentStatus, string>> = {
      coordinating:     tl.confirmCoordinating ?? "Confirmar coordinación",
      pickup_scheduled: tl.confirmPickup       ?? "Confirmar recolección",
      in_transit:       tl.confirmInTransit    ?? "Confirmar en tránsito",
      at_destination:   tl.confirmAtDest       ?? "Confirmar en destino",
      delivered:        tl.confirmDelivered    ?? "Confirmar entrega",
    };
    return labels[nextStatus] ?? `Avanzar a ${getStatusLabel(nextStatus)}`;
  }

  async function handleAdvance() {
    if (!nextStatus) return;
    await onStatusChange(shipment.id, nextStatus);
    setConfirmNext(false);
  }

  async function handleCancel() {
    await onStatusChange(shipment.id, "cancelled");
    setConfirmCancel(false);
  }

  async function handleSaveService() {
    if (!companyId || !svcForm.description?.trim()) return;
    setSavingSvc(true);
    try {
      await upsertShipmentService(companyId, shipment.id, {
        ...svcForm,
        product_id: (svcForm as any).product_id ?? null,
      } as any);
      await onReload();
      setAddingSvc(false);
      setSvcForm({ service_type: "terrestre", currency: "USD", price: 0 });
    } finally { setSavingSvc(false); }
  }

  async function handleDeleteService(serviceId: string) {
    if (!companyId) return;
    await deleteShipmentService(companyId, shipment.id, serviceId);
    await onReload();
  }

  // Tabs — consultoría no tiene "Órdenes de servicio"
  const TABS: { key: Tab; label: string }[] = [
    { key: "detail",    label: tl.tabDetail   ?? "Detalle" },
    { key: "services",  label: `${tl.tabServices ?? "Servicios"} (${services.length})` },
    { key: "documents", label: tl.tabDocuments ?? "Documentos" },
    { key: "timeline",  label: tl.tabTimeline  ?? "Historial" },
  ];

  const profitPct = shipment.total > 0 ? ((shipment.profit ?? 0) / shipment.total) * 100 : 0;

  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: svcCfg.color, fontFamily: "monospace" }}>
                {shipment.reference}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, fontSize: "10px", fontWeight: 700, color: stCfg.color, textTransform: "uppercase" }}>
                {getStatusLabel(shipment.status)}
              </span>
              <span style={{ fontSize: "10px", color: svcCfg.color, background: `${svcCfg.color}15`, padding: "2px 7px", borderRadius: "var(--radius-full)", border: `1px solid ${svcCfg.color}30` }}>
                {shipment.service_type.charAt(0).toUpperCase() + shipment.service_type.slice(1).replace(/_/g, " ")}
              </span>
              {/* Badge categoría */}
              <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "var(--radius-full)", background: isConsulting ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)", border: `1px solid ${isConsulting ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.3)"}`, color: isConsulting ? "#8b5cf6" : "var(--color-brand-blue)", fontWeight: 600 }}>
                {isConsulting ? "📋 Consultoría" : "🚛 Logística"}
              </span>
              {shipment.quotation?.quote_number && (
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>← {shipment.quotation.quote_number}</span>
              )}
              {shipment.invoice_id && (
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Factura emitida
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {shipment.client?.name ?? "—"}
              {!isConsulting && (shipment.origin || shipment.destination) &&
                ` · ${[shipment.origin, shipment.destination].filter(Boolean).join(" → ")}`
              }
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {shipment.currency} ${Number(shipment.total ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "11px", color: profitPct >= 20 ? "var(--color-success-text)" : "var(--color-warning-text)", fontWeight: 700 }}>
              {tl.margin ?? "Margen"}: {profitPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* PROGRESO — adaptado según categoría */}
        {!isCancelled && (
          <div style={{ display: "flex", gap: "0", marginBottom: "10px", alignItems: "center" }}>
            {activeFlow.map((s, i) => {
              const sCfg = SHIPMENT_STATUS_CONFIG[s];
              const done = sCfg.step < stCfg.step;
              const cur  = s === shipment.status;
              const label = getStatusLabel(s);
              return (
                <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  {i > 0 && <div style={{ flex: 1, height: "2px", background: done || cur ? sCfg.color : "var(--color-border-faint)" }} />}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: done ? "var(--color-success-text)" : cur ? sCfg.color : "var(--color-border-faint)", border: `2px solid ${done ? "var(--color-success-text)" : cur ? sCfg.color : "var(--color-border-faint)"}` }} />
                    <span style={{ fontSize: "8px", color: cur ? sCfg.color : "var(--color-text-muted)", fontWeight: cur ? 700 : 400, whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  </div>
                  {i < activeFlow.length - 1 && <div style={{ flex: 1, height: "2px", background: done ? "var(--color-success-text)" : "var(--color-border-faint)" }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>

          {/* Avanzar estado */}
          {nextStatus && !isDone && (
            !confirmNext ? (
              <button onClick={() => setConfirmNext(true)} disabled={saving} style={{
                height: "28px", padding: "0 14px", borderRadius: "var(--radius-md)",
                background: isConsulting ? "#8b5cf6" : SHIPMENT_STATUS_CONFIG[nextStatus].color,
                color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                {getNextLabel()}
              </button>
            ) : (
              <>
                <button onClick={handleAdvance} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  {saving ? t.general.loading : "✓ Confirmar"}
                </button>
                <button onClick={() => setConfirmNext(false)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                  {t.general.cancel}
                </button>
              </>
            )
          )}

          {/* Editar */}
          {!isDone && !editing && (
            <button onClick={() => { setForm({ ...shipment }); setEditing(true); }} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t.general.edit}
            </button>
          )}

          {editing && (
            <>
              <button onClick={async () => { await onUpdate(shipment.id, form); setEditing(false); setForm({}); }} disabled={saving} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? t.general.loading : `✓ ${t.general.save}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </>
          )}

          {/* Órdenes de servicio — solo logística */}
          {!isDone && !isConsulting && (
            <button onClick={() => router.push("/logistica/ordenes-servicio")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
              color: "var(--color-info-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {tl.createServiceOrder ?? "Orden de servicio"}
            </button>
          )}

          {/* Subir documento — siempre visible */}
          {!isDone && (
            <button onClick={() => setTab("documents")} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
              color: "#8b5cf6", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Documentos
            </button>
          )}

          {/* Badge factura emitida */}
          {shipment.invoice_id && (
            <span style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Factura emitida
            </span>
          )}

          {/* Cancelar */}
          {!isDone && (
            !confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {tl.cancelShipment ?? "Cancelar"}
              </button>
            ) : (
              <>
                <button onClick={handleCancel} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  ¿Confirmar cancelación?
                </button>
                <button onClick={() => setConfirmCancel(false)} style={{ height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                  No
                </button>
              </>
            )
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            height: "36px", padding: "0 12px", border: "none", background: "transparent", whiteSpace: "nowrap",
            borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
            color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer",
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── DETAIL ── */}
        {tab === "detail" && (
          <div style={{ display: "grid", gap: "12px" }}>

            {/* Aviso especial para consultoría */}
            {isConsulting && !editing && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", fontSize: "12px", color: "#8b5cf6", lineHeight: 1.6 }}>
                📋 <strong>Servicio de consultoría</strong> — Sin tracking logístico. Sube los documentos del servicio (póliza, contrato, evidencia) en la pestaña Documentos y factura cuando esté completado.
              </div>
            )}

            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {/* Proveedor — logística y seguros */}
                {(!isConsulting || shipment.service_type === "seguro") && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Proveedor logístico</div>
                    <select
                      value={(form as any).provider_id ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, provider_id: e.target.value || null }))}
                      style={{ ...INPUT, cursor: "pointer" }}
                    >
                      <option value="">— Sin proveedor —</option>
                      {providers.map((pv) => (
                        <option key={pv.id} value={pv.id}>{pv.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Campos comunes */}
                {[
                  { k: "total",        label: "Precio de venta",  type: "number" },
                  { k: "provider_cost",label: "Costo proveedor",  type: "number" },
                  { k: "currency",     label: "Moneda",           type: "select-currency" },
                ].map((f) => (
                  <div key={f.k}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    {f.type === "select-currency" ? (
                      <select value={(form as any)[f.k] ?? "USD"} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))} style={INPUT} />
                    )}
                  </div>
                ))}

                {/* Campos solo logística */}
                {!isConsulting && ([
                  { k: "origin",              label: "Origen",              type: "text" },
                  { k: "destination",         label: "Destino",             type: "text" },
                  { k: "origin_country",      label: "País origen",         type: "text" },
                  { k: "destination_country", label: "País destino",        type: "text" },
                  { k: "pickup_date",         label: "Fecha recolección",   type: "date" },
                  { k: "estimated_delivery",  label: "Entrega estimada",    type: "date" },
                  { k: "tracking_number",     label: "No. rastreo",         type: "text" },
                  { k: "incoterm",            label: "Incoterm",            type: "select-incoterm" },
                ] as any[]).map((f) => (
                  <div key={f.k}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    {f.type === "select-incoterm" ? (
                      <select value={(form as any)[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                        <option value="">—</option>
                        {INCOTERMS.map((inc) => <option key={inc} value={inc}>{inc}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.k]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))} style={INPUT} />
                    )}
                  </div>
                ))}

                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notas</div>
                  <textarea rows={2} value={(form as any).notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                {[
                  { label: "Referencia",   value: shipment.reference },
                  { label: "Cliente",      value: shipment.client?.name },
                  { label: "Tipo",         value: shipment.service_type.charAt(0).toUpperCase() + shipment.service_type.slice(1).replace(/_/g, " ") },
                  { label: "Moneda",       value: shipment.currency },
                  // Campos logísticos
                  ...(!isConsulting ? [
                    { label: "Origen",         value: shipment.origin },
                    { label: "Destino",        value: shipment.destination },
                    { label: "País origen",    value: shipment.origin_country },
                    { label: "País destino",   value: shipment.destination_country },
                    { label: "Incoterm",       value: shipment.incoterm },
                    { label: "Recolección",    value: shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleDateString(locale) : null },
                    { label: "Entrega est.",   value: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString(locale) : null },
                    { label: "No. rastreo",    value: shipment.tracking_number },
                  ] : []),
                  { label: "Proveedor",    value: shipment.provider?.name },
                  { label: "Cotización",   value: shipment.quotation?.quote_number },
                ].map((r) => r.value ? (
                  <div key={r.label}>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{r.value}</div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* FINANCIERO */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { label: "Ingreso",  value: shipment.total,         color: "var(--color-success-text)" },
                { label: "Costo",    value: shipment.provider_cost, color: "var(--color-danger-text)"  },
                { label: "Ganancia", value: shipment.profit ?? 0,   color: (shipment.profit ?? 0) >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" },
              ].map((r) => (
                <div key={r.label} style={{ padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{r.label}</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                    {shipment.currency} ${Number(r.value ?? 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de margen */}
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Margen</span>
                <span style={{ fontWeight: 800, color: profitPct >= 20 ? "var(--color-success-text)" : profitPct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                  {profitPct.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "var(--radius-full)", transition: "width 0.5s ease", background: profitPct >= 20 ? "var(--color-success-text)" : profitPct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)", width: `${Math.min(Math.max(profitPct, 0), 100)}%` }} />
              </div>
            </div>

{/* ── FACTURA PROVEEDOR PENDIENTE ── */}
            {(shipment.status === "delivered" || shipment.status === "invoiced") && !editing && (
              <ProveedorFacturaPanel
                shipment={shipment}
                companyId={companyId}
                onCreated={onReload}
              />
            )}
            
            {shipment.notes && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
                {shipment.notes}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab === "services" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {isConsulting ? "Líneas de servicio y conceptos a facturar" : "Servicios del embarque"}
              </div>
              {!addingSvc && (
                <button onClick={() => setAddingSvc(true)} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Agregar
                </button>
              )}
            </div>

            {addingSvc && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {/* Selector desde catálogo de servicios */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
                      Servicio del catálogo
                    </div>
                    <select
                      value={(svcForm as any).product_id ?? ""}
                      onChange={(e) => selectServiceProduct(e.target.value)}
                      style={{ ...INPUT, cursor: "pointer" }}
                    >
                      <option value="">— Seleccionar servicio del catálogo —</option>
                      {serviceProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {serviceProducts.length === 0 && (
                      <div style={{ fontSize: "10px", color: "var(--color-warning-text)", marginTop: "3px" }}>
                        No hay servicios en el catálogo. Agrégalos en Comercial → Productos (tipo: Servicio).
                      </div>
                    )}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Descripción *</div>
                    <input value={svcForm.description ?? ""} onChange={(e) => setSvcForm((p) => ({ ...p, description: e.target.value }))} placeholder="Se auto-rellena al seleccionar del catálogo, o escribe manualmente" style={INPUT} />
                  </div>
                  {!isConsulting && [
                    { k: "origin",       label: "Origen"            },
                    { k: "destination",  label: "Destino"           },
                    { k: "transit_time", label: "Tiempo tránsito"   },
                    { k: "incoterm",     label: "Incoterm"          },
                  ].map((f) => (
                    <div key={f.k}>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{f.label}</div>
                      <input value={(svcForm as any)[f.k] ?? ""} onChange={(e) => setSvcForm((p) => ({ ...p, [f.k]: e.target.value }))} style={INPUT} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Precio venta *</div>
                    <input type="number" min="0" value={svcForm.price ?? 0} onChange={(e) => setSvcForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
                    <select value={svcForm.currency ?? "USD"} onChange={(e) => setSvcForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveService} disabled={savingSvc || !svcForm.description?.trim()} style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {savingSvc ? t.general.loading : t.general.save}
                  </button>
                  <button onClick={() => { setAddingSvc(false); setSvcForm({ service_type: "terrestre", currency: "USD", price: 0 }); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    {t.general.cancel}
                  </button>
                </div>
              </div>
            )}

            {services.length === 0 && !addingSvc ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {isConsulting ? "Sin conceptos capturados — agrega las líneas que se incluirán en la factura" : "Sin servicios capturados"}
              </div>
            ) : services.map((svc) => {
              const svcMargin = svc.price > 0 ? ((svc.price - svc.cost) / svc.price) * 100 : 0;
              return (
                <div key={svc.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", background: "var(--color-info-bg)", padding: "1px 6px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-info-border)", textTransform: "capitalize" }}>
                      {svc.service_type}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1 }}>{svc.description}</span>
                    <button onClick={() => handleDeleteService(svc.id)} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  {!isConsulting && (
                    <div style={{ display: "flex", gap: "10px", fontSize: "11px" }}>
                      {svc.origin && <span style={{ color: "var(--color-text-muted)" }}>{svc.origin} → {svc.destination}</span>}
                      {svc.transit_time && <span style={{ color: "var(--color-text-muted)" }}>⏱ {svc.transit_time}</span>}
                      {svc.incoterm && <span style={{ color: "var(--color-text-muted)" }}>{svc.incoterm}</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                    <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>
                      {svc.currency} ${Number(svc.price).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </span>
                    {svc.cost > 0 && (
                      <>
                        <span style={{ color: "var(--color-danger-text)" }}>
                          Costo: ${Number(svc.cost).toLocaleString(locale, { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ color: svcMargin >= 20 ? "var(--color-success-text)" : "var(--color-warning-text)", fontWeight: 700 }}>
                          {svcMargin.toFixed(0)}% margen
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {/* Aviso según categoría */}
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: isConsulting ? "rgba(139,92,246,0.08)" : "var(--color-info-bg)", border: `1px solid ${isConsulting ? "rgba(139,92,246,0.3)" : "var(--color-info-border)"}`, fontSize: "12px", color: isConsulting ? "#8b5cf6" : "var(--color-info-text)", lineHeight: 1.6 }}>
              {isConsulting
                ? "📋 Sube la póliza de seguro, contratos, evidencias o cualquier documento de soporte para este servicio."
                : "📄 BL, carta porte, packing list, pedimento, documentos aduanales y evidencias del embarque."}
            </div>

            {/* Botón nuevo documento */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {docs.length} documento{docs.length !== 1 ? "s" : ""} vinculado{docs.length !== 1 ? "s" : ""}
              </div>
              <button
                onClick={() => setShowDocForm((v) => !v)}
                style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: isConsulting ? "#8b5cf6" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Subir documento
              </button>
            </div>

            {/* Formulario de subida */}
            {showDocForm && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Nombre del documento</div>
                    <input
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Ej: Póliza de seguro, BL original…"
                      style={INPUT}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Categoría</div>
                    <select
                      value={newDocCat}
                      onChange={(e) => setNewDocCat(e.target.value as DocCategory)}
                      style={{ ...INPUT, cursor: "pointer" }}
                    >
                      {(Object.entries(DOC_CATEGORY_CONFIG) as [DocCategory, any][]).map(([k, v]) => (
                        <option key={k} value={k}>{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      if (!newDocName.trim()) { alert("Escribe un nombre para el documento"); return; }
                      pendingDocRef.current = { name: newDocName.trim(), category: newDocCat };
                      docFileRef.current?.click();
                    }}
                    disabled={uploadingDoc}
                    style={{ height: "32px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {uploadingDoc ? "Subiendo…" : "Seleccionar archivo"}
                  </button>
                  <button onClick={() => { setShowDocForm(false); setNewDocName(""); setNewDocCat("other"); }} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
                <input ref={docFileRef} type="file" style={{ display: "none" }} onChange={handleDocUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.xml" />
              </div>
            )}

            {/* Lista de documentos */}
            {loadingDocs ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando documentos…</div>
            ) : docs.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                Sin documentos — presiona "Subir documento" para agregar el primero
              </div>
            ) : (
              <div style={{ display: "grid", gap: "6px" }}>
                {docs.map((doc) => {
                  const catCfg = DOC_CATEGORY_CONFIG[doc.category];
                  const stCfg  = DOC_STATUS_CONFIG[doc.status];
                  const isExpired  = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                  return (
                    <div key={doc.id} style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", alignItems: "center" }}>
                      {/* Icono */}
                      <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", background: catCfg.bg, border: `1px solid ${catCfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={catCfg.color} strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.name}
                          </span>
                          <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: catCfg.bg, border: `1px solid ${catCfg.border}`, color: catCfg.color, flexShrink: 0 }}>
                            {doc.category.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: stCfg.bg, border: `1px solid ${stCfg.border}`, color: stCfg.color, flexShrink: 0 }}>
                            {doc.status}
                          </span>
                          {isExpired && (
                            <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", flexShrink: 0 }}>
                              VENCIDO
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB · ` : ""}
                          v{doc.version} · {new Date(doc.created_at).toLocaleDateString(locale)}
                          {doc.expiry_date && ` · Vence: ${new Date(doc.expiry_date).toLocaleDateString(locale)}`}
                        </div>
                      </div>
                      {/* Acciones */}
                      <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                     {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Ver
                          </a>
                        )}
                        <button
                          onClick={() => handleDocDelete(doc.id)}
                          style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Link al módulo completo */}
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center", paddingTop: "4px" }}>
              Ver todos los documentos en{" "}
              <span
                onClick={() => window.location.href = "/logistica/documentacion"}
                style={{ color: "var(--color-brand-blue)", cursor: "pointer", fontWeight: 600 }}
              >
                Documentación →
              </span>
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-muted)" }}>
              Historial — {shipment.reference}
            </div>
            {[
              { label: isConsulting ? "Servicio creado" : "Embarque creado",       date: shipment.created_at,         color: "var(--color-brand-blue)",   icon: "+" },
              { label: isConsulting ? "En proceso"      : "En recolección",        date: shipment.pickup_date,        color: "#a78bfa",                   icon: "↑" },
              { label: isConsulting ? "Entrega estimada": "Entrega estimada",      date: shipment.estimated_delivery, color: "var(--color-warning-text)", icon: "→" },
              { label: isConsulting ? "Completado"      : "Entregado",             date: shipment.actual_delivery,    color: "var(--color-success-text)", icon: "✓" },
            ].filter((e) => e.date).map((event, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: `${event.color}20`, border: `1px solid ${event.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: event.color }}>
                  {event.icon}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{event.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {new Date(event.date!).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
