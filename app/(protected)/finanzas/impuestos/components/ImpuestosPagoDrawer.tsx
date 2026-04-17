"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  open:      boolean;
  taxType:   "iva" | "isr";
  period:    string;
  amountDue: number;
  saving:    boolean;
  onClose:   () => void;
  onSave:    (payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function ImpuestosPagoDrawer({ open, taxType, period, amountDue, saving, onClose, onSave }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const im = (t as any).impuestos ?? {};

  const [form, setForm] = useState({
    amount_paid:  String(amountDue.toFixed(2)),
    payment_date: new Date().toISOString().split("T")[0],
    payment_ref:  "",
    notes:        "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const amount = parseFloat(form.amount_paid);
    if (!amount || amount <= 0) { setError(es ? "Ingresa un monto válido" : "Enter a valid amount"); return; }
    setError(null);
    try {
      await onSave({
        tax_type:     taxType,
        period,
        amount_due:   amountDue,
        amount_paid:  amount,
        payment_date: form.payment_date,
        payment_ref:  form.payment_ref || undefined,
        notes:        form.notes       || undefined,
      });
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  if (!open) return null;

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const [y, m] = period.split("-");
  const periodoLabel = `${MESES[parseInt(m)-1]} ${y}`;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px,96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {taxType === "iva" ? "🧾" : "💰"} {im.registrarPago ?? "Registrar pago"} — {taxType.toUpperCase()}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {es ? "Período:" : "Period:"} {periodoLabel}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* Resumen */}
          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-warning-text)" }}>
              {taxType === "iva" ? (im.ivaPagar ?? "IVA a pagar") : (im.isrAPagar ?? "ISR a pagar")}
            </span>
            <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
              MXN ${amountDue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {[
            { k: "amount_paid",  label: es ? "Monto pagado *"         : "Amount paid *",     type: "number" },
            { k: "payment_date", label: es ? "Fecha de pago *"         : "Payment date *",    type: "date"   },
            { k: "payment_ref",  label: es ? "Línea de captura / Ref." : "Capture line / Ref.", type: "text"  },
            { k: "notes",        label: es ? "Notas"                    : "Notes",             type: "text"   },
          ].map(f => (
            <div key={f.k}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
              <input type={f.type} value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={INPUT} />
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? "✓ Registrar pago" : "✓ Register payment")}
          </button>
          <button onClick={onClose}
            style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
