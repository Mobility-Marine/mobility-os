"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { DeclaracionIVA } from "../services/impuestos.service";

type Props = { data: DeclaracionIVA; loading: boolean; onPagar: () => void };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function ImpuestosIVA({ data: d, loading, onPagar }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const im = (t as any).impuestos ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando IVA…" : "Calculating VAT…"}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Resumen IVA */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            🧾 Declaración de IVA — {d.periodo}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {d.cfdi_count} {es ? "CFDIs emitidos" : "issued invoices"} · {d.ap_count} {es ? "facturas de proveedores" : "supplier invoices"}
          </div>
        </div>

        {/* Líneas IVA */}
        {[
          { label: im.ivaTraslado    ?? "IVA trasladado (cobrado a clientes)", value: d.iva_cobrado,  color: "var(--color-success-text)", sign: "+", bold: false },
          { label: im.ivaAcreditable ?? "IVA acreditable (pagado a proveedores)", value: d.iva_pagado, color: "var(--color-danger-text)", sign: "−", bold: false },
          { label: d.favor ? (im.ivaFavor ?? "IVA a favor") : (im.ivaPagar ?? "IVA a pagar"), value: Math.abs(d.iva_neto), color: d.favor ? "var(--color-brand-blue)" : "var(--color-warning-text)", sign: d.favor ? "↑" : "↓", bold: true },
        ].map((r, i) => (
          <div key={i}>
            {r.bold && <div style={{ height: "1px", background: "var(--color-border-faint)", margin: "0 20px" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${r.bold ? "14px" : "10px"} 20px`, background: r.bold ? "var(--color-bg-subtle)" : "transparent" }}>
              <span style={{ fontSize: r.bold ? "14px" : "13px", fontWeight: r.bold ? 800 : 400, color: r.bold ? "var(--color-text-primary)" : "var(--color-text-second)" }}>
                {r.label}
              </span>
              <span style={{ fontSize: r.bold ? "20px" : "14px", fontWeight: r.bold ? 900 : 600, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                {r.sign} MXN ${fmt(r.value)}
              </span>
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
            {Object.entries(d.por_moneda).sort().map(([cur, v], i, arr) => (
              <div key={cur} style={{ padding: "16px 20px", borderRight: i < arr.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "10px" }}>
                  {cur === "MXN" ? "🇲🇽" : cur === "USD" ? "🇺🇸" : "💱"} {cur}
                </div>
                {[
                  { l: "IVA cobrado",    v: v.cobrado, color: "var(--color-success-text)" },
                  { l: "IVA acreditable",v: v.pagado,  color: "var(--color-danger-text)"  },
                  { l: "IVA neto",       v: v.neto,    color: v.neto >= 0 ? "var(--color-warning-text)" : "var(--color-brand-blue)" },
                ].map(r => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "11px" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                    <span style={{ fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>{cur} ${fmt(Math.abs(r.v))}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota informativa */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
        ℹ️ {es
          ? "El IVA se calcula sobre la diferencia entre el IVA de tus CFDIs timbrados y el IVA de las facturas de proveedores del período. Para una declaración precisa, verifica que todas las facturas estén registradas."
          : "VAT is calculated on the difference between VAT on your stamped invoices and supplier invoice VAT for the period."}
      </div>
    </div>
  );
}
