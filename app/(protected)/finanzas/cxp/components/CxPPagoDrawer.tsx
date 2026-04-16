"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AccountPayable } from "../types/cxp.types";

type Props = {
  open:     boolean;
  ap:       AccountPayable | null;
  saving:   boolean;
  onClose:  () => void;
  onCreate: (payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

const PAYMENT_FORMS = [
  { key: "03", label: "Transferencia electrónica" },
  { key: "01", label: "Efectivo" },
  { key: "02", label: "Cheque nominativo" },
  { key: "04", label: "Tarjeta de crédito" },
  { key: "28", label: "Tarjeta de débito" },
  { key: "99", label: "Por definir" },
];

export default function CxPPagoDrawer({ open, ap, saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [form, setForm] = useState({
    amount:       "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_form: "03",
    reference:    "",
    notes:        "",
  });
  const [error, setError] = useState<string | null>(null);

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit() {
    if (!ap) return;
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError(es ? "Ingresa un monto válido" : "Enter a valid amount"); return; }
    if (amount > ap.balance)    { setError(es ? `El monto no puede superar el saldo de $${ap.balance.toFixed(2)}` : `Amount cannot exceed balance $${ap.balance.toFixed(2)}`); return; }
    setError(null);
    try {
      await onCreate({ ap_id: ap.id, amount, currency: ap.currency, payment_date: form.payment_date, payment_form: form.payment_form, reference: form.reference || undefined, notes: form.notes || undefined });
      setForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_form: "03", reference: "", notes: "" });
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  if (!open || !ap) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {es ? "Registrar pago a proveedor" : "Register supplier payment"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{ap.supplier_name}</div>
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {/* Resumen AP */}
          <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { l: es ? "Total factura" : "Invoice total", v: `${ap.currency} $${ap.total.toFixed(2)}` },
              { l: es ? "Ya pagado"     : "Already paid",  v: `${ap.currency} $${ap.paid_amount.toFixed(2)}`, color: "var(--color-success-text)" },
              { l: es ? "Saldo"         : "Balance",       v: `${ap.currency} $${ap.balance.toFixed(2)}`, color: "var(--color-danger-text)" },
            ].map(r => (
              <div key={r.l}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "3px" }}>{r.l}</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: (r as any).color ?? "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{r.v}</div>
              </div>
            ))}
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}

          {[
            { k: "amount",       label: es ? "Monto del pago *"     : "Payment amount *",    type: "number", placeholder: `Máx: ${ap.balance.toFixed(2)}` },
            { k: "payment_date", label: es ? "Fecha de pago *"       : "Payment date *",      type: "date",   placeholder: "" },
            { k: "reference",    label: es ? "Referencia / Folio"    : "Reference / Folio",   type: "text",   placeholder: "SPEI-001, CHQ-123…" },
            { k: "notes",        label: es ? "Notas"                 : "Notes",               type: "text",   placeholder: "" },
          ].map(f => (
            <div key={f.k}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
              <input type={f.type} value={(form as any)[f.k]} onChange={e => setF(f.k, e.target.value)} placeholder={f.placeholder} style={INPUT} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Forma de pago" : "Payment form"}</div>
            <select value={form.payment_form} onChange={e => setF("payment_form", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              {PAYMENT_FORMS.map(pf => <option key={pf.key} value={pf.key}>{pf.key} — {pf.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? "✓ Registrar pago" : "✓ Register payment")}
          </button>
          <button onClick={onClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
