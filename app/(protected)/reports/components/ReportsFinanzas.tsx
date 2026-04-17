"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReportFinanzas } from "../types/reports.types";
import LineChart  from "./charts/LineChart";
import BarChart   from "./charts/BarChart";

type Props = { data: ReportFinanzas; loading: boolean };
const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

function AgingRow({ label, data, currency }: { label: string; data: { total: number; c0_30: number; c31_60: number; c61_90: number; c90plus: number }; currency: string }) {
  const total = data.total || 1;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{label} — {currency}</span>
        <span style={{ fontSize: "13px", fontWeight: 900, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>${fmt0(data.total)}</span>
      </div>
      <div style={{ height: "12px", borderRadius: "6px", overflow: "hidden", display: "flex", marginBottom: "6px" }}>
        {[
          { v: data.c0_30,   color: "#22c55e" },
          { v: data.c31_60,  color: "#f59e0b" },
          { v: data.c61_90,  color: "#f97316" },
          { v: data.c90plus, color: "#ef4444" },
        ].filter(b => b.v > 0).map((b, i) => (
          <div key={i} style={{ width: `${(b.v / total) * 100}%`, background: b.color, minWidth: b.v > 0 ? "4px" : "0" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "4px" }}>
        {[
          { l: "0-30d",  v: data.c0_30,   c: "#22c55e" },
          { l: "31-60d", v: data.c31_60,  c: "#f59e0b" },
          { l: "61-90d", v: data.c61_90,  c: "#f97316" },
          { l: "+90d",   v: data.c90plus, c: "#ef4444" },
        ].map(r => (
          <div key={r.l} style={{ padding: "6px 8px", borderRadius: "var(--radius-sm)", background: `${r.c}15`, border: `1px solid ${r.c}30` }}>
            <div style={{ fontSize: "8px", fontWeight: 700, color: r.c, marginBottom: "2px" }}>{r.l}</div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: r.c, fontVariantNumeric: "tabular-nums" }}>${fmt0(r.v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsFinanzas({ data: d, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Cargando…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* P&L */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Estado de resultados mini */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            📊 {es ? "P&L del período" : "P&L for period"}
          </div>
          {[
            { l: es ? "Ingresos"         : "Revenue",          mxn: d.ingresos.mxn,        usd: d.ingresos.usd,        color: "var(--color-success-text)", bold: false, sign: "+" },
            { l: es ? "Costo de ventas"  : "Cost of sales",    mxn: d.costo_ventas.mxn,    usd: d.costo_ventas.usd,    color: "var(--color-danger-text)",  bold: false, sign: "−" },
            { l: es ? "Utilidad bruta"   : "Gross profit",     mxn: d.utilidad_bruta.mxn,  usd: d.utilidad_bruta.usd,  color: d.utilidad_bruta.total_mxn_equiv >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", bold: true, sign: "" },
            { l: es ? "Gastos operativos": "Operating exp.",   mxn: d.gastos_operativos.mxn,usd: d.gastos_operativos.usd,color: "var(--color-danger-text)", bold: false, sign: "−" },
            { l: es ? "Utilidad neta"    : "Net profit",       mxn: d.utilidad_neta.mxn,   usd: d.utilidad_neta.usd,   color: d.utilidad_neta.total_mxn_equiv >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", bold: true, sign: "" },
          ].map((r, i) => (
            <div key={r.l} style={{ padding: `${r.bold ? "12px" : "9px"} 18px`, borderBottom: "1px solid var(--color-border-faint)", background: r.bold ? "var(--color-bg-subtle)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: r.bold ? "13px" : "12px", fontWeight: r.bold ? 800 : 400, color: r.bold ? "var(--color-text-primary)" : "var(--color-text-second)" }}>{r.l}</span>
                <div style={{ display: "flex", gap: "14px" }}>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>🇲🇽 <span style={{ fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(Math.abs(r.mxn))}</span></span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>🇺🇸 <span style={{ fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(Math.abs(r.usd))}</span></span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 18px", background: "var(--color-bg-subtle)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{es ? "Margen neto" : "Net margin"}</span>
            <span style={{ fontSize: "13px", fontWeight: 900, color: d.margen_neto_pct >= 10 ? "var(--color-success-text)" : d.margen_neto_pct >= 5 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
              {d.margen_neto_pct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Bancos */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>🏦 {es ? "Posición bancaria" : "Bank position"}</span>
            <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
              <span>🇲🇽 <strong style={{ color: "var(--color-brand-blue)" }}>${fmt0(d.efectivo_total.mxn)}</strong></span>
              <span>🇺🇸 <strong style={{ color: "var(--color-brand-blue)" }}>${fmt0(d.efectivo_total.usd)}</strong></span>
            </div>
          </div>
          {d.bancos.map((b, i) => (
            <div key={b.nombre} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < d.bancos.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🏦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{b.nombre}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{b.banco}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: b.saldo >= 0 ? "var(--color-brand-blue)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>${fmt0(b.saldo)}</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{b.currency}</div>
              </div>
            </div>
          ))}
          {d.bancos.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Sin cuentas registradas</div>}
        </div>
      </div>

      {/* Aging CXC y CXP por moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>📥 {es ? "Aging CXC — Por cobrar" : "AR Aging"}</div>
          <AgingRow label="MXN" data={d.cxc_aging.mxn} currency="MXN" />
          <AgingRow label="USD" data={d.cxc_aging.usd} currency="USD" />
        </div>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>📤 {es ? "Aging CXP — Por pagar" : "AP Aging"}</div>
          <AgingRow label="MXN" data={d.cxp_aging.mxn} currency="MXN" />
          <AgingRow label="USD" data={d.cxp_aging.usd} currency="USD" />
        </div>
      </div>

      {/* Tendencia P&L + Impuestos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
            📈 {es ? "Tendencia P&L — 6 meses" : "P&L trend — 6 months"}
          </div>
          <LineChart
            data={d.tendencia.map(t => ({ label: t.mes.substring(0,3), value: t.ingresos, value2: t.costos }))}
            height={160}
            color1="var(--color-success-text)"
            color2="var(--color-danger-text)"
            label1={es ? "Ingresos" : "Revenue"}
            label2={es ? "Costos" : "Costs"}
            formatValue={v => "$" + v.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          />
        </div>

        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>🧾 {es ? "Posición fiscal" : "Tax position"}</div>
          {[
            {
              l: "IVA",
              v: d.iva_posicion,
              desc: d.iva_posicion > 0 ? (es ? "IVA a pagar" : "VAT to pay") : (es ? "IVA a favor" : "VAT credit"),
              color: d.iva_posicion > 0 ? "var(--color-warning-text)" : "var(--color-success-text)",
              bg:    d.iva_posicion > 0 ? "var(--color-warning-bg)"   : "var(--color-success-bg)",
            },
            {
              l: "ISR estimado (30%)",
              v: d.isr_estimado,
              desc: es ? "Provisional mensual" : "Monthly provisional",
              color: "var(--color-danger-text)",
              bg:    "var(--color-danger-bg)",
            },
          ].map(r => (
            <div key={r.l} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: r.bg, border: "1px solid transparent" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: r.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{r.l}</div>
              <div style={{ fontSize: "20px", fontWeight: 900, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                {r.v < 0 ? "−" : ""}${fmt0(Math.abs(r.v))}
              </div>
              <div style={{ fontSize: "10px", color: r.color, opacity: 0.8, marginTop: "3px" }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
