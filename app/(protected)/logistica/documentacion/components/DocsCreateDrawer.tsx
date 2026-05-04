"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }       from "@/lib/tenant/TenantProvider";
import type { ShipmentDocument, DocCategory } from "../types/docs.types";
import { DOC_CATEGORY_CONFIG } from "../types/docs.types";
import { supabase }            from "@/lib/supabaseClient";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (data: Partial<ShipmentDocument>) => Promise<ShipmentDocument | undefined>;
  defaultShipmentId?: string;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function DocsCreateDrawer({ open, onClose, onCreate, defaultShipmentId }: Props) {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const tl            = (t.logistics as any) ?? {};

  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [name,      setName]      = useState("");
  const [category,  setCategory]  = useState<DocCategory>("commercial_invoice");
  const [shipment,  setShipment]  = useState(defaultShipmentId ?? "");
  const [expiry,    setExpiry]    = useState("");
  const [required,  setRequired]  = useState(false);
  const [notes,     setNotes]     = useState("");

  useEffect(() => {
    if (!open || !companyId) return;
    supabase.from("shipments")
      .select("id, reference, client:business_partners!client_id(name)")
      .eq("company_id", companyId)
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false })
      .then(({ data }) => setShipments(data ?? []));
    if (defaultShipmentId) setShipment(defaultShipmentId);
  }, [open, companyId, defaultShipmentId]);

  async function handleCreate() {
    if (!name.trim()) { setError("El nombre es requerido"); return; }
    setSaving(true); setError(null);
    try {
      await onCreate({
        name: name.trim(), category,
        shipment_id: shipment || undefined,
        expiry_date: expiry || undefined,
        required, notes: notes || undefined,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setName(""); setCategory("commercial_invoice"); setShipment(defaultShipmentId ?? "");
    setExpiry(""); setRequired(false); setNotes(""); setError(null); onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tl.newDocument ?? "Subir documento"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tl.documentationDesc ?? "Repositorio de documentos"}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* Nombre */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.docName2 ?? "Nombre"} *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Factura comercial expedición 2025-01…" style={INPUT} />
          </div>

          {/* Categoría */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.docCategory ?? "Categoría"} *</div>
            <select value={category} onChange={(e) => setCategory(e.target.value as DocCategory)} style={{ ...INPUT, cursor: "pointer" }}>
              {(Object.keys(DOC_CATEGORY_CONFIG) as DocCategory[]).map((k) => (
                <option key={k} value={k}>
                  {tl[`cat${k.split("_").map((w: string) => w.charAt(0).toUpperCase()+w.slice(1)).join("")}`] ?? k}
                </option>
              ))}
            </select>
          </div>

          {/* Embarque */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.docLinkedShipment ?? "Embarque vinculado"}</div>
            <select value={shipment} onChange={(e) => setShipment(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">— Sin embarque —</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>{s.reference}{s.client?.name ? ` · ${s.client.name}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Vencimiento */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.docExpiry2 ?? "Fecha de vencimiento"}</div>
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={INPUT} />
          </div>

          {/* Requerido */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tl.docRequired ?? "Documento requerido"}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Se marcará como pendiente obligatorio en el embarque</div>
              </div>
            </label>
          </div>

          {/* Notas */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.docNotes ?? "Notas"}</div>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones, observaciones…" style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.5 }} />
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: name.trim() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: name.trim() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving || !name.trim() ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tl.newDocument ?? "Registrar documento")}
          </button>
        </div>
      </div>
    </>
  );
}
