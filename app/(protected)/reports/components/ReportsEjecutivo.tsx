"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReportEjecutivo } from "../types/reports.types";
import LineChart from "./charts/LineChart";

type Props = { data: ReportEjecutivo; loading: boolean; limitado?: boolean };

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

function CurrencyKPI({ label, value, icon, colorMXN = "var(--color-success-text)", colorUSD = "var(--color-brand-blue)" }: {
  label: string; value: { mxn: number; usd: number }; icon: string; colorMXN?: string; colorUSD?: string;
}) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>🇲🇽 MXN</span>
          <span style={{ fontSize: "16px", fontWeight: 900, color: colorMXN, fontVariantNumeric: "tabular-nums" }}>${fmt0(value.mxn)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>🇺🇸 USD</span>
          <span style={{ fontSize: "16px", fontWeight: 900, color: colorUSD, fontVariantNumeric: "tabular-nums" }}>${fmt0(value.usd)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportsEjecutivo({ data: d, loading, limitado = false }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Cargando reporte ejecutivo…" : "Loading executive report…"}
    </div>
  );

  const balance = d.efectivo_bancos.total_mxn_equiv - d.por_pagar.total_mxn_equiv;
  const balancePositivo = balance >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs por moneda */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        <CurrencyKPI label={es ? "Facturado" : "Billed"} value={d.facturado} icon="🧾" colorMXN="var(--color-success-text)" colorUSD="var(--color-success-text)" />
        <CurrencyKPI label={es ? "Por cobrar" : "Receivable"} value={d.por_cobrar} icon="📥" colorMXN="var(--color-warning-text)" colorUSD="var(--color-warning-text)" />
        <CurrencyKPI label={es ? "Por pagar" : "Payable"} value={d.por_pagar} icon="📤" colorMXN="var(--color-danger-text)" colorUSD="var(--color-danger-text)" />
        <CurrencyKPI label={es ? "Efectivo en bancos" : "Cash in banks"} value={d.efectivo_bancos} icon="🏦" colorMXN="var(--color-brand-blue)" colorUSD="var(--color-brand-blue)" />
      </div>

      {/* Balance de liquidez + KPIs operativos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {/* Balance */}
        <div style={{ background: balancePositivo ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: `2px solid ${balancePositivo ? "var(--color-success-border)" : "var(--color-danger-border)"}`, borderRadius: "var(--radius-lg)", padding: "18px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: balancePositivo ? "var(--color-success-text)" : "var(--color-danger-text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            {es ? "Posición de liquidez (equiv. MXN)" : "Liquidity position (MXN equiv.)"}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: balancePositivo ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {balancePositivo ? "+" : "−"}${fmt0(Math.abs(balance))}
          </div>
          <div style={{ fontSize: "10px", color: balancePositivo ? "var(--color-success-text)" : "var(--color-danger-text)", marginTop: "6px", opacity: 0.8 }}>
            {es ? "Efectivo − Por pagar" : "Cash − Payables"}
          </div>
        </div>

        {/* Operativos */}
        {[
          { l: es ? "Embarques activos" : "Active shipments", v: d.embarques_activos, icon: "🚢", color: "var(--color-brand-blue)"   },
          { l: es ? "Empleados activos" : "Active employees", v: d.empleados_activos, icon: "👥", color: "var(--color-success-text)" },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.l}</div>
              <span style={{ fontSize: "20px" }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Tendencia 6 meses */}
      {!limitado && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            {es ? "Tendencia de ingresos vs egresos — últimos 6 meses" : "Revenue vs expenses trend — last 6 months"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
            {es ? "Valores en MXN" : "Values in MXN"}
          </div>
          <LineChart
            data={d.tendencia.map(t => ({ label: t.mes.substring(0,3), value: t.ingresos, value2: t.egresos }))}
            height={180}
            color1="var(--color-success-text)"
            color2="var(--color-danger-text)"
            label1={es ? "Ingresos" : "Revenue"}
            label2={es ? "Egresos" : "Expenses"}
            formatValue={v => "$" + v.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          />
        </div>
      )}

      {/* Nómina si no es limitado */}
      {!limitado && d.nomina_mes > 0 && (
        <div style={{ padding: "14px 18px", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-second)" }}>💰 {es ? "Nómina pagada en el período" : "Payroll paid in period"}</div>
          <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>${fmt0(d.nomina_mes)}</div>
        </div>
      )}
    </div>
  );
}
