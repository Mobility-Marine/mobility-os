"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TaxPayment } from "../services/impuestos.service";

type Props = { payments: TaxPayment[]; loading: boolean };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendiente", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  paid:    { label: "Pagado",    color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  favor:   { label: "A favor",  color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
  exempt:  { label: "Exento",   color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
};

const TAX_LABELS: Record<string, string> = {
  iva: "IVA",
  isr: "ISR",
  isr_retention: "ISR Retención",
  other: "Otro",
};

export default function ImpuestosHistorial({ payments, loading }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const im = (t as any).impuestos ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Cargando historial…" : "Loading history…"}
    </div>
  );

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount_paid ?? 0), 0);
  const totalDue  = payments.filter(p => p.status === "pending").reduce((s, p) => s + (p.amount_due ?? 0), 0);

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {[
          { l: es ? "Total pagado"    : "Total paid",    v: totalPaid, color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
          { l: es ? "Pendiente"       : "Pending",       v: totalDue,  color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
          { l: es ? "Declaraciones"   : "Declarations",  v: payments.length, color: "var(--color-brand-blue)", bg: "var(--color-info-bg)", isCount: true },
        ].map(c => (
          <div key={c.l} style={{ padding: "14px 18px", background: c.bg, border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: c.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{c.l}</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>
              {(c as any).isCount ? c.v : `$${fmt(c.v as number)}`}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla historial */}
      {payments.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>📋</div>
          <div style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
            {es ? "Sin pagos registrados" : "No payments registered"}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 80px 120px 120px 120px 130px 80px", padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>{im.periodo   ?? "Período"}</span>
            <span>Impuesto</span>
            <span style={{ textAlign: "right" }}>Por pagar</span>
            <span style={{ textAlign: "right" }}>Pagado</span>
            <span>{im.fechaPago ?? "Fecha pago"}</span>
            <span>{im.referencia ?? "Referencia"}</span>
            <span style={{ textAlign: "center" }}>Estado</span>
          </div>
          {payments.map((p, i) => {
            const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
            const [y, m] = p.period.split("-");
            return (
              <div key={p.id}
                style={{ display: "grid", gridTemplateColumns: "80px 80px 120px 120px 120px 130px 80px", padding: "10px 18px", borderBottom: i < payments.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {MESES[parseInt(m)-1]} {y}
                </div>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: p.tax_type === "iva" ? "var(--color-info-bg)" : "var(--color-warning-bg)", color: p.tax_type === "iva" ? "var(--color-brand-blue)" : "var(--color-warning-text)" }}>
                    {TAX_LABELS[p.tax_type] ?? p.tax_type}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  MXN ${fmt(p.amount_due)}
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                  {p.amount_paid > 0 ? `MXN $${fmt(p.amount_paid)}` : "—"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {p.payment_date ? new Date(p.payment_date).toLocaleDateString("es-MX") : "—"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.payment_ref ?? "—"}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
