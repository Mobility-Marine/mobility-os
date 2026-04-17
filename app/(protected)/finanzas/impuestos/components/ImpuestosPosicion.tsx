"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PosicionFiscal, TaxRegime } from "../services/impuestos.service";

type Props = {
  posicion:  PosicionFiscal;
  loading:   boolean;
  onPagarIVA:() => void;
  onPagarISR:() => void;
};

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

const REGIMEN_LABELS: Record<TaxRegime, string> = {
  moral:      "Persona Moral",
  pfae:       "PFAE",
  resico_pm:  "RESICO PM",
  resico_pf:  "RESICO PF",
  other:      "Otro",
};

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)" },
  paid:    { label: "Pagado",    color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  favor:   { label: "A favor",  color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
};

export default function ImpuestosPosicion({ posicion: p, loading, onPagarIVA, onPagarISR }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const im  = (t as any).impuestos ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando posición fiscal…" : "Calculating tax position…"}
    </div>
  );

  const ivaStatus = STATUS_CONFIG[p.iva_status];
  const isrStatus = STATUS_CONFIG[p.isr_status];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header régimen + vencimiento */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ padding: "14px 18px", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>🏛️</span>
          <div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{im.regimen ?? "Régimen fiscal"}</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{REGIMEN_LABELS[p.regimen]}</div>
          </div>
        </div>
        <div style={{ padding: "14px 18px", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>📅</span>
          <div>
            <div style={{ fontSize: "10px", color: "var(--color-warning-text)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{im.vencimiento ?? "Vencimiento"}</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-warning-text)" }}>
              {new Date(p.fecha_vencimiento).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-warning-text)", opacity: 0.8 }}>{im.dia17 ?? "Vence el día 17 del mes siguiente"}</div>
          </div>
        </div>
      </div>

      {/* IVA + ISR cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* IVA */}
        <div style={{ background: "var(--color-bg-base)", border: `2px solid ${ivaStatus.border}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: ivaStatus.bg, borderBottom: `1px solid ${ivaStatus.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: ivaStatus.color }}>
              🧾 IVA — {p.periodo}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: ivaStatus.bg, color: ivaStatus.color, border: `1px solid ${ivaStatus.border}` }}>
              {ivaStatus.label}
            </span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { l: im.ivaTraslado    ?? "IVA trasladado",   v: p.iva_trasladado,  color: "var(--color-success-text)", sign: "+" },
              { l: im.ivaAcreditable ?? "IVA acreditable",  v: p.iva_acreditable, color: "var(--color-danger-text)",  sign: "−" },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-second)" }}>{r.l}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                  {r.sign} MXN ${fmt(r.v)}
                </span>
              </div>
            ))}
            <div style={{ borderTop: "2px solid var(--color-border-faint)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {p.iva_favor ? (im.ivaFavor ?? "IVA a favor") : (im.ivaPagar ?? "IVA a pagar")}
              </span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: ivaStatus.color, fontVariantNumeric: "tabular-nums" }}>
                MXN ${fmt(p.iva_neto)}
              </span>
            </div>
            {p.iva_status === "pending" && !p.iva_favor && (
              <button onClick={onPagarIVA}
                style={{ height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {im.registrarPago ?? "Registrar pago de IVA"}
              </button>
            )}
            {p.iva_status === "paid" && (
              <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600, textAlign: "center" }}>
                ✓ {im.pagado ?? "Pagado"}
              </div>
            )}
          </div>
        </div>

        {/* ISR */}
        <div style={{ background: "var(--color-bg-base)", border: `2px solid ${isrStatus.border}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: isrStatus.bg, borderBottom: `1px solid ${isrStatus.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: isrStatus.color }}>
              💰 ISR — {p.periodo}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: isrStatus.bg, color: isrStatus.color, border: `1px solid ${isrStatus.border}` }}>
              {isrStatus.label}
            </span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { l: im.ingresos     ?? "Ingresos",         v: p.ingresos,        color: "var(--color-success-text)" },
              { l: im.deducciones  ?? "Deducciones",       v: p.deducciones,     color: "var(--color-danger-text)"  },
              { l: im.utilidadFiscal?? "Utilidad fiscal",  v: p.utilidad_fiscal, color: "var(--color-text-primary)" },
              { l: `${im.tasaISR ?? "Tasa ISR"} (${p.tasa_isr.toFixed(1)}%)`, v: p.isr_causado, color: "var(--color-danger-text)" },
              { l: im.isrPagadoPrev ?? "Pagos previos",    v: p.isr_pagado_prev, color: "var(--color-brand-blue)"   },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-second)" }}>{r.l}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                  MXN ${fmt(r.v)}
                </span>
              </div>
            ))}
            <div style={{ borderTop: "2px solid var(--color-border-faint)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {im.isrAPagar ?? "ISR a pagar"}
              </span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: isrStatus.color, fontVariantNumeric: "tabular-nums" }}>
                MXN ${fmt(p.isr_a_pagar)}
              </span>
            </div>
            {p.isr_status === "pending" && p.isr_a_pagar > 0 && (
              <button onClick={onPagarISR}
                style={{ height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {im.registrarPago ?? "Registrar pago de ISR"}
              </button>
            )}
            {p.isr_status === "paid" && (
              <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600, textAlign: "center" }}>
                ✓ {im.pagado ?? "Pagado"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
