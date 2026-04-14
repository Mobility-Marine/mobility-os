"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CFDIDocument } from "../types/facturacion.types";
import { PAYMENT_FORMS, CFDI_USES, FISCAL_REGIMES } from "../types/facturacion.types";

type Props = {
  open:    boolean;
  saving:  boolean;
  cfdis:   CFDIDocument[];
  onClose: () => void;
  onCreate:(payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CFDINotaCredito({ open, saving, cfdis, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const validInvoices = cfdis.filter((c) => c.type === "I" && c.status === "valid");

  const [relatedUUID,  setRelatedUUID]  = useState("");
  const [manualData,   setManualData]   = useState(false);
  const [form, setForm] = useState({
    receiver_rfc: "", receiver_name: "", receiver_email: "",
    receiver_zip: "", receiver_regime: "601", receiver_cfdi_use: "G02",
    currency: "MXN", payment_form: "03",
  });
  const [concepts, setConcepts] = useState<any[]>([]);
  const [conceptForm, setConceptForm] = useState({ description: "", product_key: "84111506", unit_key: "E48", unit: "Servicio", quantity: 1, unit_price: 0, tax_rate: 0.16 });
  const [error, setError] = useState<string | null>(null);

  const selectedInvoice = validInvoices.find((c) => c.uuid === relatedUUID);

  useEffect(() => {
    if (selectedInvoice) {
      setForm((p) => ({
        ...p,
        receiver_rfc:  selectedInvoice.receiver_rfc,
        receiver_name: selectedInvoice.receiver_name,
        receiver_email:selectedInvoice.receiver_email ?? "",
        currency:      selectedInvoice.currency,
      }));
    }
  }, [selectedInvoice]);

  function addConcept() {
    if (!conceptForm.description || !conceptForm.unit_price) return;
    const base = conceptForm.quantity * conceptForm.unit_price;
    setConcepts((p) => [...p, { ...conceptForm, subtotal: base, tax_amount: base * conceptForm.tax_rate, total: base + base * conceptForm.tax_rate }]);
    setConceptForm({ description: "", product_key: "84111506", unit_key: "E48", unit: "Servicio", quantity: 1, unit_price: 0, tax_rate: 0.16 });
  }

  const total = concepts.reduce((s, c) => s + c.total, 0);

  async function handleCreate() {
    if (!form.receiver_rfc) { setError(es ? "RFC del receptor requerido" : "Receiver RFC required"); return; }
    if (concepts.length === 0) { setError(es ? "Agrega al menos un concepto a acreditar" : "Add at least one concept to credit"); return; }
    setError(null);
    try {
      await onCreate({ ...form, related_uuid: relatedUUID || undefined, concepts });
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setRelatedUUID(""); setManualData(false);
    setForm({ receiver_rfc: "", receiver_name: "", receiver_email: "", receiver_zip: "", receiver_regime: "601", receiver_cfdi_use: "G02", currency: "MXN", payment_form: "03" });
    setConcepts([]); setError(null);
    setConceptForm({ description: "", product_key: "84111506", unit_key: "E48", unit: "Servicio", quantity: 1, unit_price: 0, tax_rate: 0.16 });
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(720px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{es ? "Nota de Crédito" : "Credit Note"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{es ? "CFDI Tipo E — Devolución, descuento o bonificación" : "CFDI Type E — Return, discount or bonus"}</div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
          )}

          {/* Factura relacionada (opcional) */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Factura relacionada (opcional)" : "Related invoice (optional)"}
            </div>
            <select value={relatedUUID} onChange={(e) => { setRelatedUUID(e.target.value); if (!e.target.value) setManualData(true); }} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">{es ? "— Sin relación a factura específica —" : "— No relation to specific invoice —"}</option>
              {validInvoices.map((c) => (
                <option key={c.id} value={c.uuid ?? c.id}>
                  {c.serie ?? ""}{c.folio ?? "—"} · {c.receiver_name} · ${fmt(c.total)}
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--color-text-muted)", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontFamily: "monospace" }}>
                UUID: {selectedInvoice.uuid}
              </div>
            )}
          </div>

          {/* Datos del receptor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>RFC *</div>
              <input value={form.receiver_rfc} onChange={(e) => setForm((p) => ({ ...p, receiver_rfc: e.target.value.toUpperCase() }))} placeholder="RFC del receptor" style={INPUT} maxLength={13} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Razón social *" : "Legal name *"}</div>
              <input value={form.receiver_name} onChange={(e) => setForm((p) => ({ ...p, receiver_name: e.target.value }))} placeholder={es ? "Nombre o razón social" : "Legal name"} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Código postal *" : "Zip code *"}</div>
              <input value={form.receiver_zip} onChange={(e) => setForm((p) => ({ ...p, receiver_zip: e.target.value }))} placeholder="00000" style={INPUT} maxLength={5} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Uso CFDI" : "CFDI Use"}</div>
              <select value={form.receiver_cfdi_use} onChange={(e) => setForm((p) => ({ ...p, receiver_cfdi_use: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                {CFDI_USES.map((u) => <option key={u.key} value={u.key}>{u.key} — {u.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Régimen receptor" : "Tax regime"}</div>
              <select value={form.receiver_regime} onChange={(e) => setForm((p) => ({ ...p, receiver_regime: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                {FISCAL_REGIMES.map((r) => <option key={r.key} value={r.key}>{r.key} — {r.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Forma de pago" : "Payment form"}</div>
              <select value={form.payment_form} onChange={(e) => setForm((p) => ({ ...p, payment_form: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                {PAYMENT_FORMS.filter((p) => p.key !== "99").map((p) => <option key={p.key} value={p.key}>{p.key} — {p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Conceptos a acreditar */}
          <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Conceptos a acreditar *" : "Concepts to credit *"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 60px auto", gap: "8px", alignItems: "end" }}>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Descripción" : "Description"}</div>
                <input value={conceptForm.description} onChange={(e) => setConceptForm((p) => ({ ...p, description: e.target.value }))} placeholder={es ? "Concepto a acreditar" : "Credit concept"} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Cant." : "Qty"}</div>
                <input type="number" min="0.001" value={conceptForm.quantity} onChange={(e) => setConceptForm((p) => ({ ...p, quantity: Number(e.target.value) }))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "P.Unit." : "Price"}</div>
                <input type="number" min="0" value={conceptForm.unit_price} onChange={(e) => setConceptForm((p) => ({ ...p, unit_price: Number(e.target.value) }))} style={{ ...INPUT, height: "32px", fontSize: "12px" }} />
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>IVA</div>
                <select value={conceptForm.tax_rate} onChange={(e) => setConceptForm((p) => ({ ...p, tax_rate: Number(e.target.value) }))} style={{ ...INPUT, height: "32px", fontSize: "11px", cursor: "pointer" }}>
                  <option value={0.16}>16%</option>
                  <option value={0.08}>8%</option>
                  <option value={0}>0%</option>
                </select>
              </div>
              <button onClick={addConcept} disabled={!conceptForm.description || !conceptForm.unit_price}
                style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: conceptForm.description && conceptForm.unit_price ? "var(--color-brand-blue)" : "var(--color-bg-base)", color: conceptForm.description && conceptForm.unit_price ? "#fff" : "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                +
              </button>
            </div>
          </div>

          {concepts.length > 0 && (
            <div style={{ display: "grid", gap: "4px" }}>
              {concepts.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.description}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)" }}>-${fmt(c.total)}</div>
                  <button onClick={() => setConcepts((p) => p.filter((_, idx) => idx !== i))} style={{ width: "20px", height: "20px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "14px", fontWeight: 800, color: "var(--color-warning-text)", padding: "6px 12px" }}>
                Total a acreditar: -${fmt(total)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Timbrando…" : "Stamping…") : (es ? "Timbrar Nota de Crédito" : "Stamp Credit Note")}
          </button>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
