"use client";
import type { ShipmentKPIs, CurrencyAmounts } from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = { kpis: ShipmentKPIs | null };

export default function ShipmentCommandCenter({ kpis }: Props) {
  const { t, lang } = useTranslation();
  const tl          = (t.logistics as any) ?? {};
  const locale      = lang === "en" ? "en-US" : "es-MX";

  if (!kpis) return null;

  const fmtCur = (val: number, cur: string) => {
    const prefix = cur === "MXN" ? "$" : `${cur} $`;
    return `${prefix}${val.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  // Render multi-moneda: una línea por moneda
  function renderAmounts(byCurrency: CurrencyAmounts, color: string, fontSize = "22px") {
    const entries = Object.entries(byCurrency).filter(([, v]) => v !== 0);
    if (entries.length === 0) {
      return <span style={{ fontSize, fontWeight: 800, color }}>$0</span>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {entries.map(([cur, val]) => (
          <div key={cur} style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{
              fontSize: entries.length > 1 ? "18px" : fontSize,
              fontWeight: 800, color,
              fontVariantNumeric: "tabular-nums", lineHeight: 1.1,
            }}>
              {fmtCur(Math.abs(val), cur)}
            </span>
            {val < 0 && <span style={{ fontSize: "10px", color: "var(--color-danger-text)" }}>↓</span>}
          </div>
        ))}
      </div>
    );
  }

  // Sub-texto de revenue con desglose
  function revenueSubText() {
    const entries = Object.entries(kpis.revenueByCurrency).filter(([, v]) => v > 0);
    if (entries.length === 0) return `${kpis.delivered} operaciones entregadas`;
    return `${kpis.delivered} entregadas`;
  }

  // Sub-texto de costo
  function costSubText() {
    const entries = Object.entries(kpis.costByCurrency).filter(([, v]) => v > 0);
    if (entries.length === 0) return "Sin costo registrado";
    return entries.map(([cur, val]) => fmtCur(val, cur)).join(" · ");
  }

  const profitColor = kpis.totalProfit >= 0
    ? "var(--color-success-text)"
    : "var(--color-danger-text)";

  return (
    <>
      {/* KPI 1 — Embarques */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {tl.shipments ?? "Embarques"}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--color-brand-blue)", lineHeight: 1.1 }}>
          {kpis.total}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {kpis.active} activos · {kpis.delivered} entregados
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)", width: `${kpis.total > 0 ? Math.min((kpis.active / kpis.total) * 100, 100) : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* KPI 2 — Ingresos por moneda */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {tl.revenue ?? "Ingresos"}
        </div>
        {renderAmounts(kpis.revenueByCurrency, "var(--color-success-text)", "22px")}
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {revenueSubText()}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: "var(--color-success-text)", width: `${kpis.total > 0 ? Math.min((kpis.delivered / kpis.total) * 100, 100) : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* KPI 3 — Ganancia por moneda */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {tl.profit ?? "Ganancia"}
        </div>
        {renderAmounts(kpis.profitByCurrency, profitColor, "22px")}
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          Costo: {costSubText()}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: profitColor, width: `${kpis.totalRevenue > 0 ? Math.min(Math.max(kpis.totalProfit / kpis.totalRevenue, 0) * 100, 100) : 0}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* KPI 4 — Margen promedio */}
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {tl.margin ?? "Margen promedio"}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1.1, color: kpis.avgMargin >= 20 ? "var(--color-success-text)" : kpis.avgMargin >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
          {kpis.avgMargin.toFixed(1)}%
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {kpis.avgMargin >= 20 ? "Margen saludable" : kpis.avgMargin >= 10 ? "Margen moderado" : "Margen bajo"}
        </div>
        <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
          <div style={{ height: "100%", borderRadius: "var(--radius-full)", background: kpis.avgMargin >= 20 ? "var(--color-success-text)" : kpis.avgMargin >= 10 ? "var(--color-warning-text)" : "var(--color-danger-text)", width: `${Math.min(kpis.avgMargin / 40 * 100, 100)}%`, transition: "width 0.5s ease" }} />
        </div>
      </div>
    </>
  );
}
