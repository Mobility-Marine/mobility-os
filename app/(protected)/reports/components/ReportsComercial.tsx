"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReportComercial } from "../types/reports.types";
import FunnelChart from "./charts/FunnelChart";
import BarChart    from "./charts/BarChart";

type Props = { data: ReportComercial; loading: boolean };
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });
const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function ReportsComercial({ data: d, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Cargando…</div>;

  const ESTADO_COLORS: Record<string, string> = {
    draft: "#64748b", sent: "var(--color-brand-blue)", approved: "var(--color-success-text)",
    accepted: "var(--color-success-text)", rejected: "var(--color-danger-text)", expired: "#f97316",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs tasas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { l: es ? "Tasa prospecto→cotización" : "Lead→Quote rate",  v: `${d.tasa_cotizacion}%`, sub: `${d.cotizaciones_emitidas} de ${d.prospectos_total}`, color: d.tasa_cotizacion >= 50 ? "var(--color-success-text)" : "var(--color-warning-text)" },
          { l: es ? "Tasa de cierre"            : "Close rate",         v: `${d.tasa_cierre}%`,    sub: `${d.cotizaciones_ganadas} de ${d.cotizaciones_emitidas}`, color: d.tasa_cierre >= 30 ? "var(--color-success-text)" : "var(--color-warning-text)" },
          { l: es ? "Pipeline MXN"              : "Pipeline MXN",       v: `$${fmt0(d.pipeline_valor.mxn)}`,   sub: "cotizaciones abiertas", color: "var(--color-brand-blue)" },
          { l: es ? "Pipeline USD"              : "Pipeline USD",       v: `$${fmt0(d.pipeline_valor.usd)}`,   sub: "cotizaciones abiertas", color: "var(--color-brand-blue)" },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{c.l}</div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.v}</div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Funnel + Por estado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "14px" }}>
            🎯 {es ? "Embudo de ventas" : "Sales funnel"}
          </div>
          <FunnelChart stages={[
            { label: es ? "Prospectos"    : "Prospects",    value: d.prospectos_total,       color: "#64748b" },
            { label: es ? "Calificados"   : "Qualified",    value: d.prospectos_calificados,  color: "var(--color-brand-blue)" },
            { label: es ? "Cotizaciones"  : "Quotes",       value: d.cotizaciones_emitidas,   color: "#f59e0b" },
            { label: es ? "Ganadas"       : "Won",          value: d.cotizaciones_ganadas,    color: "var(--color-success-text)" },
            { label: es ? "Facturas"      : "Invoiced",     value: d.facturas_emitidas,       color: "#10b981" },
          ]} />
        </div>

        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "14px" }}>
            📋 {es ? "Cotizaciones por estado" : "Quotes by status"}
          </div>
          {d.por_estado.map(e => {
            const pct = d.cotizaciones_emitidas > 0 ? (e.count / d.cotizaciones_emitidas) * 100 : 0;
            const color = ESTADO_COLORS[e.estado] ?? "var(--color-text-muted)";
            return (
              <div key={e.estado} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-second)", textTransform: "capitalize" }}>{e.estado}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{e.count}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>${fmt0(e.monto)}</span>
                  </div>
                </div>
                <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tendencia + Top clientes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            📈 {es ? "Monto cotizaciones — 6 meses" : "Quote amounts — 6 months"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "12px" }}>MXN vs USD</div>
          <BarChart
            data={d.tendencia.map(t => ({ label: t.mes.substring(0,3), value: t.monto_mxn, value2: t.monto_usd }))}
            dual
            label1="MXN" label2="USD" height={160}
            formatValue={v => "$" + v.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          />
        </div>

        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            🏆 {es ? "Top clientes por facturación" : "Top clients by revenue"}
          </div>
          {d.top_clientes.slice(0, 8).map((c, i) => (
            <div key={c.nombre} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 18px", borderBottom: i < Math.min(d.top_clientes.length, 8) - 1 ? "1px solid var(--color-border-faint)" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: "20px", fontSize: "11px", fontWeight: 700, color: i < 3 ? "var(--color-warning-text)" : "var(--color-text-muted)", textAlign: "right" }}>#{i+1}</div>
              <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{c.facturas} facturas</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>${fmt0(c.monto)}</div>
            </div>
          ))}
          {d.top_clientes.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Sin datos</div>}
        </div>
      </div>
    </div>
  );
}
