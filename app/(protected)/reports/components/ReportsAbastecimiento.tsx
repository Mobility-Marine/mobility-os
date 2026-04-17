"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReportAbastecimiento } from "../types/reports.types";
import DonutChart from "./charts/DonutChart";

type Props = { data: ReportAbastecimiento; loading: boolean };
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function ReportsAbastecimiento({ data: d, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Cargando…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { l: es ? "Órdenes de compra"     : "Purchase orders",   v: d.ordenes_total,        color: "var(--color-text-primary)", icon: "📋" },
          { l: es ? "Órdenes abiertas"      : "Open orders",       v: d.ordenes_abiertas,     color: "var(--color-warning-text)", icon: "🔓" },
          { l: es ? "Proveedores activos"   : "Active suppliers",  v: d.proveedores_activos,  color: "var(--color-brand-blue)",   icon: "🏭" },
          { l: es ? "Valor inventario"      : "Inventory value",   v: `$${fmt0(d.valor_inventario)}`, color: "var(--color-success-text)", icon: "📦" },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.l}</div>
              <span style={{ fontSize: "20px" }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: "8px" }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Monto OC por moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 260px", gap: "12px" }}>
        {[
          { l: es ? "Monto OC — MXN" : "PO amount MXN", v: d.monto_oc.mxn, color: "var(--color-warning-text)" },
          { l: es ? "Monto OC — USD" : "PO amount USD", v: d.monto_oc.usd, color: "var(--color-brand-blue)"   },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>{c.l}</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(c.v)}</div>
          </div>
        ))}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Estado OC" : "PO status"}
          </div>
          <DonutChart
            data={[
              { label: es ? "Recibidas" : "Received",  value: d.ordenes_recibidas, color: "var(--color-success-text)" },
              { label: es ? "Abiertas"  : "Open",      value: d.ordenes_abiertas,  color: "var(--color-warning-text)" },
            ]}
            size={100}
            centerLabel="total"
            centerValue={String(d.ordenes_total)}
          />
        </div>
      </div>

      {/* Top proveedores */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          🏆 {es ? "Top proveedores por monto" : "Top suppliers by amount"}
        </div>
        {d.top_proveedores.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Sin datos</div>
        ) : d.top_proveedores.map((p, i) => {
          const maxMonto = Math.max(...d.top_proveedores.map(x => x.monto), 1);
          const pct = (p.monto / maxMonto) * 100;
          return (
            <div key={p.nombre} style={{ padding: "10px 18px", borderBottom: i < d.top_proveedores.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{p.nombre}</span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{p.ordenes} OC</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>{p.currency} ${fmt0(p.monto)}</span>
                </div>
              </div>
              <div style={{ height: "5px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-warning-text)", borderRadius: "3px" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
