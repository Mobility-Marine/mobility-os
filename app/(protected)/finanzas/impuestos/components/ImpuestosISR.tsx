"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { DeclaracionISR } from "../services/impuestos.service";

type Props = { data: DeclaracionISR; loading: boolean; onPagar: () => void };

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

const REGIMEN_LABELS: Record<string, { label: string; desc: string }> = {
  moral:      { label: "Persona Moral",  desc: "ISR = Utilidad fiscal × 30%" },
  pfae:       { label: "PFAE",           desc: "ISR = Tarifa progresiva Art. 96 LISR" },
  resico_pm:  { label: "RESICO PM",      desc: "ISR = Ingresos × tasa RESICO (1%-2%)" },
  resico_pf:  { label: "RESICO PF",      desc: "ISR = Ingresos × tasa RESICO (1%-2.5%)" },
  other:      { label: "Otro",           desc: "ISR configurado manualmente" },
};

export default function ImpuestosISR({ data: d, loading, onPagar }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const im = (t as any).impuestos ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando ISR…" : "Calculating income tax…"}
    </div>
  );

  const regimenInfo = REGIMEN_LABELS[d.regimen] ?? REGIMEN_LABELS.other;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Info régimen */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "24px" }}>🏛️</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-brand-blue)" }}>{regimenInfo.label}</div>
          <div style={{ fontSize: "11px", color: "var(--color-brand-blue)", opacity: 0.8 }}>{regimenInfo.desc}</div>
        </div>
      </div>

      {/* Cálculo ISR */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            💰 ISR Provisional — {d.periodo}
          </div>
        </div>
        {[
          { label: im.ingresos      ?? "Ingresos del período",     value: d.ingresos,        color: "var(--color-success-text)", indent: 0 },
          { label: im.deducciones   ?? "Deducciones autorizadas",  value: d.deducciones,     color: "var(--color-danger-text)",  indent: 0 },
          { label: es ? "— Gastos de operación" : "— Operating expenses", value: d.deducciones - d.depreciacion, color: "var(--color-text-muted)", indent: 1 },
          { label: es ? "— Depreciación fiscal" : "— Fiscal depreciation", value: d.depreciacion, color: "var(--color-text-muted)", indent: 1 },
          { label: im.utilidadFiscal ?? "Utilidad fiscal",         value: d.utilidad_fiscal, color: "var(--color-text-primary)", indent: 0, divider: true, bold: true },
          { label: `${im.isrCausado ?? "ISR causado"} (${d.tasa_efectiva.toFixed(1)}%)`, value: d.isr_causado, color: "var(--color-danger-text)", indent: 0 },
          { label: im.isrPagadoPrev ?? "Pagos provisionales previos", value: d.isr_pagado_prev, color: "var(--color-brand-blue)", indent: 1 },
          { label: im.isrAPagar     ?? "ISR a pagar este período", value: d.isr_a_pagar,     color: d.isr_a_pagar > 0 ? "var(--color-warning-text)" : "var(--color-success-text)", indent: 0, divider: true, bold: true, highlight: true },
        ].map((r, i) => (
          <div key={i}>
            {r.divider && <div style={{ height: "1px", background: "var(--color-border-faint)", margin: "0 20px" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${r.highlight ? "14px" : "9px"} 20px`, paddingLeft: `${20 + ((r.indent ?? 0) * 16)}px`, background: r.highlight ? "var(--color-bg-subtle)" : "transparent" }}>
              <span style={{ fontSize: r.bold ? "13px" : "12px", fontWeight: r.bold ? 800 : 400, color: r.bold ? "var(--color-text-primary)" : "var(--color-text-second)" }}>
                {r.label}
              </span>
              <span style={{ fontSize: r.bold ? "18px" : "13px", fontWeight: r.bold ? 900 : 600, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                MXN ${fmt(r.value)}
              </span>
            </div>
          </div>
        ))}

        {d.isr_a_pagar > 0 && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border-faint)" }}>
            <button onClick={onPagar}
              style={{ width: "100%", height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {im.registrarPago ?? "Registrar pago de ISR"}
            </button>
          </div>
        )}
      </div>

      {/* Acumulado del año */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
          📊 {im.acumuladoAnio ?? "Acumulado del año"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { l: es ? "Ingresos acumulados" : "YTD revenue",    v: d.ingresos_anio, color: "var(--color-success-text)" },
            { l: es ? "ISR acumulado"       : "YTD income tax", v: d.isr_anio,      color: "var(--color-danger-text)"  },
          ].map(r => (
            <div key={r.l} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>{r.l}</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                MXN ${fmt0(r.v)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
