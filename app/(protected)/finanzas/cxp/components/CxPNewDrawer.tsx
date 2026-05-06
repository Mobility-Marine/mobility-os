"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { APSupplierType, APDocumentType } from "../types/cxp.types";
import { EXPENSE_CATEGORIES } from "../types/cxp.types";
import { fetchSuppliersForAP } from "../services/cxp.service";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";

type Props = {
  open:          boolean;
  saving:        boolean;
  preloadFromShipment?: any | null;
  preloadFromPO?:       any | null;
  onClose:       () => void;
  onCreate:      (payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function CxPNewDrawer({ open, saving, preloadFromShipment, preloadFromPO, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [suppliers,  setSuppliers]  = useState<any[]>([]);
  const [providers,  setProviders]  = useState<any[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [pdfFile,    setPdfFile]    = useState<File | null>(null);
  const [xmlFile,    setXmlFile]    = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [form, setForm] = useState({
    supplier_type:    "procurement" as APSupplierType,
    supplier_id:      "",
    logistics_provider_id: "",
    supplier_name:    "",
    supplier_rfc:     "",
    supplier_email:   "",
    document_type:    "invoice" as APDocumentType,
    document_number:  "",
    document_date:    new Date().toISOString().split("T")[0],
    due_date:         "",
    expense_category: "",
    currency:         "MXN",
    has_tax:          true,
    subtotal:         "",
    tax_amount:       "",
    total:            "",
    related_po_id:    "",
    related_shipment_id: "",
    notes:            "",
  });

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  useEffect(() => {
    if (!open || !companyId) return;
    fetchSuppliersForAP(companyId).then(({ suppliers: s, providers: p }) => {
      setSuppliers(s); setProviders(p);
    });
  }, [open, companyId]);

  // Precargar desde embarque
  useEffect(() => {
    if (!preloadFromShipment) return;
    const sh = preloadFromShipment;
    const cur    = sh.currency ?? "USD";
    const hasTax = cur === "MXN";
    const cost   = Number(sh.provider_cost ?? 0);
    setForm(p => ({
      ...p,
      supplier_type:         "logistics",
      logistics_provider_id: sh.provider?.id ?? "",
      supplier_name:         sh.provider?.name ?? "",
      currency:              cur,
      has_tax:               hasTax,
      total:                 String(cost || ""),
      subtotal:              String(hasTax ? (cost / 1.16) : cost),
      tax_amount:            String(hasTax ? (cost - cost / 1.16) : 0),
      related_shipment_id:   sh.id,
      notes:                 `Servicio logístico — ${sh.reference}`,
    }));
  }, [preloadFromShipment]);

  // Precargar desde PO
  useEffect(() => {
    if (!preloadFromPO) return;
    const po     = preloadFromPO;
    const cur    = po.currency ?? "MXN";
    const hasTax = cur === "MXN";
    const total  = Number(po.total ?? 0);
    setForm(p => ({
      ...p,
      supplier_type:  "procurement",
      supplier_id:    po.supplier?.id ?? "",
      supplier_name:  po.supplier?.name ?? "",
      currency:       cur,
      has_tax:        hasTax,
      total:          String(total || ""),
      subtotal:       String(po.subtotal   ?? (hasTax ? (total / 1.16)        : total)),
      tax_amount:     String(po.tax_amount ?? (hasTax ? (total - total / 1.16) : 0)),
      related_po_id:  po.id,
      document_date:  po.order_date ?? new Date().toISOString().split("T")[0],
      notes:          `Orden de compra — ${po.po_number}`,
    }));
  }, [preloadFromPO]);

  function selectSupplier(id: string) {
    const s = suppliers.find(x => x.id === id);
    if (!s) return;
    setForm(p => ({ ...p, supplier_id: id, supplier_name: s.name, supplier_rfc: s.tax_id ?? "", supplier_email: s.email ?? "" }));
  }

  function selectProvider(id: string) {
    const p = providers.find(x => x.id === id);
    if (!p) return;
    setForm(p2 => ({ ...p2, logistics_provider_id: id, supplier_name: p.name, supplier_rfc: p.rfc ?? "", supplier_email: p.contact_email ?? "" }));
  }

  function calcTotals(field: "subtotal" | "tax_amount" | "total", val: string) {
    const n = parseFloat(val) || 0;
    setForm(p => {
      const hasTax = p.has_tax;
      if (field === "subtotal") {
        if (hasTax) {
          const tax = n * 0.16;
          return { ...p, subtotal: val, tax_amount: tax.toFixed(2), total: (n + tax).toFixed(2) };
        }
        return { ...p, subtotal: val, tax_amount: "0", total: val };
      }
      if (field === "total") {
        if (hasTax) {
          const sub = n / 1.16;
          return { ...p, total: val, subtotal: sub.toFixed(2), tax_amount: (n - sub).toFixed(2) };
        }
        return { ...p, total: val, subtotal: val, tax_amount: "0" };
      }
      return { ...p, [field]: val };
    });
  }

  function setHasTax(value: boolean) {
    setForm(p => {
      const sub = parseFloat(p.subtotal) || 0;
      if (value) {
        const tax = sub * 0.16;
        return { ...p, has_tax: true, tax_amount: tax.toFixed(2), total: (sub + tax).toFixed(2) };
      }
      return { ...p, has_tax: false, tax_amount: "0", total: p.subtotal || "0" };
    });
  }

  async function uploadFile(file: File, type: "pdf" | "xml"): Promise<string | null> {
    if (!companyId) return null;
    const ext  = type === "pdf" ? "pdf" : "xml";
    const path = `${companyId}/cxp/${Date.now()}-${type}.${ext}`;
    const { error } = await supabase.storage
      .from("financial-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("financial-documents").getPublicUrl(path);
    return data?.publicUrl ?? null;
  }
  
  async function handleSubmit() {
    if (!form.supplier_name.trim()) { setError(es ? "Selecciona o escribe el proveedor" : "Select or enter supplier"); return; }
    if (!form.total || parseFloat(form.total) <= 0) { setError(es ? "Ingresa el total" : "Enter total"); return; }
            setError(null);
    setUploading(true);
    try {
      let pdf_url: string | undefined;
      let xml_url: string | undefined;
      if (pdfFile) { const url = await uploadFile(pdfFile, "pdf"); if (url) pdf_url = url; }
      if (xmlFile) { const url = await uploadFile(xmlFile, "xml"); if (url) xml_url = url; }

      await onCreate({
        supplier_type:         form.supplier_type,
        supplier_id:           form.supplier_id    || undefined,
        logistics_provider_id: form.logistics_provider_id || undefined,
        supplier_name:         form.supplier_name,
        supplier_rfc:          form.supplier_rfc   || undefined,
        supplier_email:        form.supplier_email || undefined,
        document_type:         form.document_type,
        document_number:       form.document_number || undefined,
        document_date:         form.document_date,
        due_date:              form.due_date        || undefined,
        expense_category:      form.expense_category || undefined,
        currency:              form.currency,
        has_tax:               form.has_tax,
        subtotal:              parseFloat(form.subtotal) || 0,
        tax_amount:            parseFloat(form.tax_amount) || 0,
        total:                 parseFloat(form.total),
        related_po_id:         form.related_po_id       || undefined,
        related_shipment_id:   form.related_shipment_id || undefined,
        notes:                 form.notes || undefined,
        pdf_url,
        xml_url,
      });
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  if (!open) return null;

  const isLogistics  = form.supplier_type === "logistics";
  const isOperating  = form.supplier_type === "operating";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(560px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {preloadFromShipment ? `Factura proveedor — ${preloadFromShipment.reference}` : preloadFromPO ? `Factura proveedor — ${preloadFromPO.po_number}` : (es ? "Nueva cuenta por pagar" : "New payable")}
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}

          {/* Tipo de proveedor */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tipo de proveedor *</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {(["procurement","logistics","operating"] as APSupplierType[]).map(type => {
                const cfg = { procurement: { label: "📦 Abastecimiento", color: "var(--color-brand-blue)" }, logistics: { label: "🚛 Logística", color: "var(--color-warning-text)" }, operating: { label: "🏢 Operativo", color: "#8b5cf6" } }[type];
                return (
                  <button key={type} onClick={() => setF("supplier_type", type)}
                    style={{ height: "40px", borderRadius: "var(--radius-md)", border: `2px solid ${form.supplier_type === type ? cfg.color : "var(--color-border-faint)"}`, background: form.supplier_type === type ? `${cfg.color}15` : "var(--color-bg-subtle)", color: form.supplier_type === type ? cfg.color : "var(--color-text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector proveedor — siempre visible. Filtra por tipo seleccionado. */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {isLogistics ? "Proveedor logístico" : isOperating ? "Proveedor operativo (opcional)" : "Proveedor"}
            </div>
            <select
              value={isLogistics ? form.logistics_provider_id : form.supplier_id}
              onChange={e => isLogistics ? selectProvider(e.target.value) : selectSupplier(e.target.value)}
              style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">— {isOperating ? "Seleccionar o capturar manualmente" : "Seleccionar"} —</option>
              {(isLogistics
                ? providers
                : isOperating
                  ? suppliers.filter(s => s.type === "operating")
                  : suppliers.filter(s => s.type !== "operating")
              ).map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.tax_id ? ` · ${s.tax_id}` : ""}</option>
              ))}
            </select>
            {isOperating && (
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Si es un gasto suelto sin proveedor registrado, deja vacío y escribe el nombre abajo.
              </div>
            )}
          </div>

          {/* Nombre manual si es operativo o no está en catálogo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ gridColumn: "1" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Nombre proveedor *</div>
              <input value={form.supplier_name} onChange={e => setF("supplier_name", e.target.value)} placeholder="Nombre o razón social" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>RFC</div>
              <input value={form.supplier_rfc} onChange={e => setF("supplier_rfc", e.target.value.toUpperCase())} placeholder="RFC del proveedor" style={INPUT} />
            </div>
          </div>

          {/* Categoría de gasto — solo operativo */}
          {isOperating && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Categoría de gasto *</div>
              <select value={form.expense_category} onChange={e => setF("expense_category", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">— Seleccionar —</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          {/* Documento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Folio / No. documento</div>
              <input value={form.document_number} onChange={e => setF("document_number", e.target.value)} placeholder="FAC-001" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Moneda</div>
              <select value={form.currency} onChange={e => {
                const cur = e.target.value;
                setForm(p => ({ ...p, currency: cur }));
                setHasTax(cur === "MXN");
              }} style={{ ...INPUT, cursor: "pointer" }}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fecha documento *</div>
              <input type="date" value={form.document_date} onChange={e => setF("document_date", e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fecha vencimiento</div>
              <input type="date" value={form.due_date} onChange={e => setF("due_date", e.target.value)} style={INPUT} />
            </div>
          </div>

          {/* Toggle has_tax */}
          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.has_tax} onChange={e => setHasTax(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>Calcular IVA (16%)</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {form.has_tax ? "El IVA se calculará y sumará al subtotal" : "Sin IVA — total = subtotal (típico USD/EUR)"}
                </div>
              </div>
            </label>
          </div>

          {/* Importes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { k: "subtotal",   label: "Subtotal"  },
              { k: "tax_amount", label: "IVA"       },
              { k: "total",      label: "Total *"   },
            ].map(f => (
              <div key={f.k}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                <input
                  type="number" min="0"
                  value={(form as any)[f.k]}
                  onChange={e => calcTotals(f.k as any, e.target.value)}
                  disabled={f.k === "tax_amount" && !form.has_tax}
                  placeholder="0.00"
                  style={{ ...INPUT, opacity: (f.k === "tax_amount" && !form.has_tax) ? 0.5 : 1 }}
                />
              </div>
            ))}
          </div>

          {/* Archivos — PDF y XML */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Adjuntar factura (opcional)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "PDF", accept: ".pdf,application/pdf", file: pdfFile, setFile: setPdfFile, color: "var(--color-danger-text)" },
                { label: "XML", accept: ".xml,text/xml,application/xml", file: xmlFile, setFile: setXmlFile, color: "var(--color-brand-blue)" },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{f.label}</div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", border: `1px dashed ${f.file ? f.color : "var(--color-border)"}`, background: f.file ? `${f.color}10` : "var(--color-bg-subtle)", cursor: "pointer", fontSize: "12px", color: f.file ? f.color : "var(--color-text-muted)", fontWeight: f.file ? 600 : 400 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {f.file ? f.file.name.slice(0, 20) + (f.file.name.length > 20 ? "…" : "") : `Subir ${f.label}`}
                    <input type="file" accept={f.accept} style={{ display: "none" }}
                      onChange={e => f.setFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {f.file && (
                    <button onClick={() => f.setFile(null)} style={{ marginTop: "3px", fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      × Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Notas */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notas</div>
            <textarea rows={2} value={form.notes} onChange={e => setF("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>

          {/* Referencias */}
          {(form.related_shipment_id || form.related_po_id) && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)" }}>
              {form.related_shipment_id ? `🚛 Vinculado a embarque: ${preloadFromShipment?.reference}` : `📦 Vinculado a OC: ${preloadFromPO?.po_number}`}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                        {(saving || uploading) ? (es ? "Guardando…" : "Saving…") : (es ? "Crear cuenta por pagar" : "Create payable")}
          </button>
          <button onClick={onClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
