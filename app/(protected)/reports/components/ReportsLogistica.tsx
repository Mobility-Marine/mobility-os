"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReportLogistica } from "../types/reports.types";
import BarChart   from "./charts/BarChart";
import DonutChart from "./charts/DonutChart";

type Props = { data: ReportLogistica; loading: boolean };
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function ReportsLogistica({ data: d, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Cargando…</div>;

  const STATUS_COLORS = ["var(--color-success-text)", "var(--color-warning-text)", "var(--color-danger-text)", "var(--color-text-muted)"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { l: es ? "Total embarques"  : "Total shipments",  v: d.embarques_total,      color: "var(--color-text-primary)", icon: "📦" },
          { l: es ? "Tasa de entrega"  : "Delivery rate",    v: `${d.tasa_entrega}%`,    color: d.tasa_entrega >= 90 ? "var(--color-success-text)" : d.tasa_entrega >= 70 ? "var(--color-warning-text)" : "var(--color-danger-text)", icon: "✅" },
          { l: "Margen %",             v: `${d.margen_pct}%`, color: d.margen_pct >= 20 ? "var(--color-success-text)" : "var(--color-warning-text)", icon: "📊" },
          { l: es ? "En tránsito"      : "In transit",        v: d.embarques_transito,   color: "var(--color-brand-blue)", icon: "🚢" },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.l}</div>
              <span style={{ fontSize: "20px" }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: "8px" }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Ingresos por moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {[
          { l: es ? "Ingresos MXN" : "Revenue MXN",     v: d.ingresos.mxn,     color: "var(--color-success-text)" },
          { l: es ? "Ingresos USD" : "Revenue USD",     v: d.ingresos.usd,     color: "var(--color-brand-blue)"   },
          { l: es ? "Margen MXN equiv." : "Margin equiv.", v: d.margen.total_mxn_equiv, color: d.margen.total_mxn_equiv >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>{c.l}</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(c.v)}</div>
          </div>
        ))}
      </div>

      {/* Donut estado + Tendencia */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Estado de embarques" : "Shipment status"}
          </div>
          <DonutChart
            data={[
              { label: es ? "Entregados"  : "Delivered",  value: d.embarques_entregados, color: "var(--color-success-text)" },
              { label: es ? "En tránsito" : "In transit", value: d.embarques_transito,   color: "var(--color-brand-blue)"   },
              { label: es ? "Cancelados"  : "Cancelled",  value: d.embarques_cancelados, color: "var(--color-danger-text)"  },
            ]}
            size={140}
            centerLabel="total" centerValue={String(d.embarques_total)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            {[
              { l: es ? "Entregados" : "Delivered",  v: d.embarques_entregados, c: "var(--color-success-text)" },
              { l: es ? "En tránsito": "In transit", v: d.embarques_transito,   c: "var(--color-brand-blue)"   },
              { l: es ? "Cancelados" : "Cancelled",  v: d.embarques_cancelados, c: "var(--color-danger-text)"  },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>● {r.l}</span>
                <span style={{ fontWeight: 700, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            📈 {es ? "Ingresos por mes — MXN vs USD" : "Monthly revenue — MXN vs USD"}
          </div>
          <BarChart
            data={d.tendencia.map(t => ({ label: t.mes.substring(0,3), value: t.ingresos_mxn, value2: t.ingresos_usd }))}
            dual label1="MXN" label2="USD" height={160}
            formatValue={v => "$" + v.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          />
        </div>
      </div>

      {/* Top clientes */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          🏆 {es ? "Top clientes por ingresos logísticos" : "Top clients by logistics revenue"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px", padding: "7px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
          <span>Cliente</span><span style={{ textAlign: "center" }}>Embarques</span><span style={{ textAlign: "right" }}>Ingreso</span><span style={{ textAlign: "center" }}>Moneda</span>
        </div>
        {d.top_clientes.map((c, i) => (
          <div key={c.nombre} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 80px", padding: "10px 18px", borderBottom: i < d.top_clientes.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.nombre}</span>
            <span style={{ textAlign: "center", fontSize: "12px", fontWeight: 700 }}>{c.embarques}</span>
            <span style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>${fmt0(c.ingreso)}</span>
            <span style={{ textAlign: "center", fontSize: "10px", color: "var(--color-text-muted)" }}>{c.currency}</span>
          </div>
        ))}
        {d.top_clientes.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Sin datos</div>}
      </div>
    </div>
  );
}
