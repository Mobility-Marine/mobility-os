"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { EstadoResultados } from "../services/contabilidad.service";

type Props = { data: EstadoResultados; loading: boolean; desde: string; hasta: string };

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmtP = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export default function ContabilidadEstadoResultados({ data: d, loading }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const co  = (t as any).contabilidad ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando estado de resultados…" : "Calculating income statement…"}
    </div>
  );

  const lineas = [
    { label: co.ingresos        ?? "Ingresos facturados",   value: d.ingresos_facturados, indent: 0, bold: false, color: "var(--color-success-text)",  sign: "+" },
    { label: es ? "Ingresos cobrados"  : "Collected revenue", value: d.ingresos_cobrados, indent: 1, bold: false, color: "var(--color-text-muted)",    sign: "+" },
    { label: co.costoVentas     ?? "Costo de ventas",        value: d.costo_ventas,        indent: 0, bold: false, color: "var(--color-danger-text)",   sign: "−" },
    { label: co.utilidadBruta   ?? "Utilidad bruta",         value: d.utilidad_bruta,      indent: 0, bold: true,  color: d.utilidad_bruta   >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", sign: d.utilidad_bruta   >= 0 ? "+" : "−", pct: d.margen_bruto_pct,  divider: true },
    { label: co.gastosOperativos?? "Gastos operativos",      value: d.gastos_operativos,   indent: 0, bold: false, color: "var(--color-danger-text)",   sign: "−" },
    { label: co.utilidadOperativa ?? "Utilidad operativa",   value: d.utilidad_operativa,  indent: 0, bold: true,  color: d.utilidad_operativa >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", sign: d.utilidad_operativa >= 0 ? "+" : "−", divider: true },
    { label: co.isr ?? "ISR estimado",    value: d.isr_estimado,        indent: 1, bold: false, color: "var(--color-danger-text)",   sign: "−" },
    { label: co.utilidadNeta    ?? "Utilidad neta",          value: d.utilidad_neta,       indent: 0, bold: true,  color: d.utilidad_neta    >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", sign: d.utilidad_neta    >= 0 ? "+" : "−", pct: d.margen_neto_pct, divider: true, highlight: true },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Estado de resultados */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 24px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            📊 {co.tabEstadoResultados ?? "Estado de Resultados"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {es ? "Basado en CFDIs timbrados y facturas de proveedores del período" : "Based on stamped invoices and supplier bills for the period"}
          </div>
        </div>
        {lineas.map((l, i) => (
          <div key={i}>
            {l.divider && <div style={{ height: "1px", background: "var(--color-border-faint)", margin: "0 24px" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${l.highlight ? "14px" : "10px"} 24px`, paddingLeft: `${24 + (l.indent * 20)}px`, background: l.highlight ? "var(--color-bg-subtle)" : "transparent" }}>
              <div style={{ fontSize: l.bold ? "13px" : "12px", fontWeight: l.bold ? 800 : 400, color: l.bold ? "var(--color-text-primary)" : "var(--color-text-second)" }}>
                {l.label}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {l.pct !== undefined && (
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "1px 8px", borderRadius: "var(--radius-full)", background: l.pct >= 20 ? "var(--color-success-bg)" : l.pct >= 10 ? "var(--color-warning-bg)" : "var(--color-danger-bg)", color: l.pct >= 20 ? "var(--color-success-text)" : l.pct >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                    {fmtP(l.pct)}
                  </span>
                )}
                <span style={{ fontSize: l.bold ? "16px" : "13px", fontWeight: l.bold ? 900 : 600, color: l.color, fontVariantNumeric: "tabular-nums" }}>
                  {l.sign} ${fmt(Math.abs(l.value))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desglose por moneda */}
      {Object.keys(d.por_moneda).length > 1 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Desglose por moneda" : "Breakdown by currency"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Object.keys(d.por_moneda).length, 4)}, 1fr)` }}>
            {Object.entries(d.por_moneda).sort().map(([cur, v], i, arr) => {
              const util = v.ingresos - v.costo - v.gastos;
              const margen = v.ingresos > 0 ? (util / v.ingresos) * 100 : 0;
              return (
                <div key={cur} style={{ padding: "16px 20px", borderRight: i < arr.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "14px" }}>{cur === "MXN" ? "🇲🇽" : cur === "USD" ? "🇺🇸" : "💱"}</span>
                    <span style={{ fontSize: "13px", fontWeight: 800 }}>{cur}</span>
                  </div>
                  {[
                    { l: co.ingresos     ?? "Ingresos",  v: v.ingresos, color: "var(--color-success-text)" },
                    { l: co.costoVentas  ?? "Costo",     v: v.costo,    color: "var(--color-danger-text)"  },
                    { l: co.gastosOperativos ?? "Gastos", v: v.gastos,   color: "var(--color-danger-text)"  },
                    { l: co.utilidadNeta ?? "Utilidad",  v: util,       color: util >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" },
                  ].map(r => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "11px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                      <span style={{ fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>{cur} ${fmt(Math.abs(r.v))}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--color-border-faint)", marginTop: "6px", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{co.margenNeto ?? "Margen"}</span>
                    <span style={{ fontWeight: 800, color: margen >= 20 ? "var(--color-success-text)" : margen >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                      {margen.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
