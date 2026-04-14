"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { CFDIDocument } from "../types/facturacion.types";
import { PAYMENT_FORMS } from "../types/facturacion.types";

type Props = {
  open:    boolean;
  saving:  boolean;
  cfdis:   CFDIDocument[]; // facturas PPD disponibles
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

export default function CFDIComplementoPago({ open, saving, cfdis, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const ppdInvoices = cfdis.filter((c) => c.type === "I" && c.status === "valid" && c.payment_method === "PPD");

  const [selectedUUID, setSelectedUUID] = useState("");
  const [amount,       setAmount]       = useState("");
  const [paymentDate,  setPaymentDate]  = useState(new Date().toISOString().split("T")[0]);
  const [paymentForm,  setPaymentForm]  = useState("03");
  const [installment,  setInstallment]  = useState("1");
  const [error,        setError]        = useState<string | null>(null);

  const selectedInvoice = ppdInvoices.find((c) => c.uuid === selectedUUID);

  async function handleCreate() {
    if (!selectedInvoice) { setError(es ? "Selecciona la factura a pagar" : "Select the invoice to pay"); return; }
    if (!amount || Number(amount) <= 0) { setError(es ? "Ingresa el monto del pago" : "Enter the payment amount"); return; }
    setError(null);
    try {
      await onCreate({
        client_id:         selectedInvoice.related_client_id ?? undefined,
        receiver_rfc:      selectedInvoice.receiver_rfc,
        receiver_name:     selectedInvoice.receiver_name,
        receiver_email:    selectedInvoice.receiver_email ?? undefined,
        receiver_zip:      "00000", // TODO: obtener del cliente
        receiver_regime:   "601",
        payment_date:      paymentDate,
        payment_form:      paymentForm,
        currency:          selectedInvoice.currency,
        amount:            Number(amount),
        related_uuid:      selectedInvoice.uuid!,
        related_folio:     `${selectedInvoice.serie ?? ""}${selectedInvoice.folio ?? ""}`,
        related_currency:  selectedInvoice.currency,
        related_balance:   selectedInvoice.total,
        installment:       Number(installment),
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setSelectedUUID(""); setAmount(""); setPaymentForm("03");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setInstallment("1"); setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(600px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Complemento de Pago (REP)" : "Payment Complement (REP)"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {es ? "CFDI Tipo P — Registra el pago de una factura PPD" : "CFDI Type P — Records payment for a PPD invoice"}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
          )}

          {/* Selector factura */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Factura PPD a pagar *" : "PPD Invoice to pay *"}
            </div>
            {ppdInvoices.length === 0 ? (
              <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)" }}>
                {es ? "No hay facturas PPD pendientes de complemento de pago." : "No PPD invoices pending payment complement."}
              </div>
            ) : (
              <>
                <select value={selectedUUID} onChange={(e) => setSelectedUUID(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                  <option value="">{es ? "— Selecciona la factura —" : "— Select invoice —"}</option>
                  {ppdInvoices.map((c) => (
                    <option key={c.id} value={c.uuid ?? c.id}>
                      {c.serie ?? ""}{c.folio ?? "—"} · {c.receiver_name} · {c.currency} ${fmt(c.total)}
                    </option>
                  ))}
                </select>

                {selectedInvoice && (
                  <div style={{ marginTop: "8px", padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", display: "grid", gap: "4px" }}>
                    {[
                      { l: "UUID",                         v: selectedInvoice.uuid ?? "—"                            },
                      { l: es ? "Cliente" : "Client",      v: selectedInvoice.receiver_name                          },
                      { l: es ? "Total factura" : "Total", v: `${selectedInvoice.currency} $${fmt(selectedInvoice.total)}` },
                      { l: es ? "Fecha" : "Date",          v: new Date(selectedInvoice.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US") },
                    ].map((r) => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                        <span style={{ fontWeight: 600, color: "var(--color-success-text)", fontFamily: r.l === "UUID" ? "monospace" : "inherit", fontSize: r.l === "UUID" ? "9px" : "11px" }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedInvoice && (
            <>
              {/* Datos del pago */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Fecha de pago *" : "Payment date *"}</div>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Forma de pago *" : "Payment form *"}</div>
                  <select value={paymentForm} onChange={(e) => setPaymentForm(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                    {PAYMENT_FORMS.filter((p) => p.key !== "99").map((p) => <option key={p.key} value={p.key}>{p.key} — {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Monto del pago *" : "Payment amount *"}</div>
                  <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "# de Parcialidad" : "Installment #"}</div>
                  <input type="number" min="1" value={installment} onChange={(e) => setInstallment(e.target.value)} style={INPUT} />
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                {es
                  ? "El SAT requiere que emitas un Complemento de Pago (REP) cada vez que recibes el pago de una factura PPD. Esto cierra el ciclo fiscal de la factura."
                  : "The SAT requires you to issue a Payment Complement (REP) each time you receive payment for a PPD invoice. This closes the fiscal cycle of the invoice."}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving || !selectedInvoice || !amount}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: selectedInvoice && amount ? "var(--color-success-text)" : "var(--color-bg-subtle)", color: selectedInvoice && amount ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: selectedInvoice && amount ? "pointer" : "not-allowed", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Timbrando…" : "Stamping…") : (es ? "Timbrar Complemento de Pago" : "Stamp Payment Complement")}
          </button>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
