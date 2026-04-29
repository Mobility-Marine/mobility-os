"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AccountPayable } from "../types/cxp.types";

type Props = {
  open:    boolean;
  ap:      AccountPayable | null;
  saving:  boolean;
  onClose: () => void;
  onCreate:(payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const PAYMENT_FORMS = [
  { k: "03", l: "Transferencia electrónica" },
  { k: "01", l: "Efectivo" },
  { k: "02", l: "Cheque nominativo" },
  { k: "04", l: "Tarjeta de crédito" },
  { k: "28", l: "Tarjeta de débito" },
  { k: "99", l: "Por definir" },
];

export default function CxPPagoDrawer({ open, ap, saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [amount,       setAmount]       = useState("");
  const [paymentDate,  setPaymentDate]  = useState(new Date().toISOString().split("T")[0]);
  const [paymentForm,  setPaymentForm]  = useState("03");
  const [reference,    setReference]    = useState("");
  const [notes,        setNotes]        = useState("");
  const [error,        setError]        = useState<string | null>(null);

  const amountNum = Number(amount) || 0;
  const isTotal   = ap ? amountNum >= ap.balance - 0.01 : false;
  const remaining = ap ? Math.max(0, ap.balance - amountNum) : 0;

  async function handleCreate() {
    if (!ap) return;
    if (!amount || amountNum <= 0) { setError(es ? "Ingresa el monto del pago" : "Enter payment amount"); return; }
    if (amountNum > ap.balance + 0.01) { setError(es ? "El monto supera el saldo pendiente" : "Amount exceeds outstanding balance"); return; }
    setError(null);
    try {
      await onCreate({
        ap_id:        ap.id,
        amount:       amountNum,
        currency:     ap.currency,
        payment_date: paymentDate,
        payment_form: paymentForm,
        reference:    reference || undefined,
        notes:        notes || undefined,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setAmount(""); setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentForm("03"); setReference(""); setNotes(""); setError(null);
    onClose();
  }

  if (!open || !ap) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(520px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Registrar pago a proveedor" : "Register supplier payment"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {ap.supplier_name}{ap.document_number ? ` · ${ap.document_number}` : ""}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Resumen de la cuenta por pagar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, background: "var(--color-bg-subtle)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {[
              { l: es ? "Total factura" : "Invoice total", v: `${ap.currency} $${fmt(ap.total)}`,        c: "var(--color-text-primary)" },
              { l: es ? "Ya pagado"     : "Already paid",  v: `${ap.currency} $${fmt(ap.paid_amount)}`,  c: "var(--color-success-text)" },
              { l: es ? "Saldo actual"  : "Balance",       v: `${ap.currency} $${fmt(ap.balance)}`,      c: "var(--color-danger-text)" },
            ].map(s => (
              <div key={s.l} style={{ padding: "8px 10px", background: "var(--color-bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "3px" }}>{s.l}</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
          )}

          {/* Monto */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Monto del pago *" : "Payment amount *"}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="number" min="0.01" max={ap.balance} step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={fmt(ap.balance)}
                style={{ ...INPUT, paddingLeft: "52px", fontSize: "20px", fontWeight: 800, height: "48px" }}
              />
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", fontWeight: 700, color: "var(--color-text-muted)" }}>
                {ap.currency}
              </div>
            </div>
            {/* Botones rápidos */}
            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              <button onClick={() => setAmount(String(ap.balance))}
                style={{ flex: 1, height: "28px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {es ? "Pago total" : "Full amount"} (${fmt(ap.balance)})
              </button>
              {[50, 25].map(pct => (
                <button key={pct} onClick={() => setAmount(String(Math.round(ap.balance * pct / 100 * 100) / 100))}
                  style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer" }}>
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Preview del saldo restante */}
          {amountNum > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: isTotal ? "var(--color-success-bg)" : "var(--color-warning-bg)", border: `1px solid ${isTotal ? "var(--color-success-border)" : "var(--color-warning-border)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: isTotal ? "var(--color-success-text)" : "var(--color-warning-text)", fontWeight: 600 }}>
                  {isTotal ? (es ? "Pago total — la cuenta quedará pagada" : "Full payment — account will be closed") : (es ? "Pago parcial — saldo restante:" : "Partial payment — remaining:")}
                </span>
                {!isTotal && (
                  <span style={{ fontWeight: 800, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                    {ap.currency} ${fmt(remaining)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Fecha y forma de pago */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? "Fecha del pago *" : "Payment date *"}
              </div>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? "Forma de pago *" : "Payment form *"}
              </div>
              <select value={paymentForm} onChange={e => setPaymentForm(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {PAYMENT_FORMS.map(p => <option key={p.k} value={p.k}>{p.k} — {p.l}</option>)}
              </select>
            </div>
          </div>

          {/* Referencia */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Referencia bancaria / folio" : "Bank reference / folio"}
            </div>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder={es ? "SPEI, cheque, número de operación, etc." : "SPEI, check, operation number, etc."} style={INPUT} />
          </div>

          {/* Notas */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Notas" : "Notes"}
            </div>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={es ? "Observaciones del pago…" : "Payment notes…"} style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "none" }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving || !amount}
            style={{ flex: 1, height: "42px", borderRadius: "var(--radius-md)", background: amount ? "var(--color-success-text)" : "var(--color-bg-subtle)", color: amount ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: amount ? "pointer" : "not-allowed", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Registrando…" : "Registering…") : (es ? "Registrar pago" : "Register payment")}
          </button>
          <button onClick={handleClose} style={{ height: "42px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
