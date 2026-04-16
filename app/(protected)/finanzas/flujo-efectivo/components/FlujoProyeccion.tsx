"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { FlujoProyeccion } from "../services/flujo.service";

type Props = {
  proyeccion:    FlujoProyeccion[];
  saldoInicial:  number;
  loading:       boolean;
};

const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function FlujoProyeccionView({ proyeccion, saldoInicial, loading }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const fl  = (t as any).flujo ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando proyección…" : "Calculating projection…"}
    </div>
  );

  const maxSaldo = Math.max(...proyeccion.map(p => Math.abs(p.saldo_acumulado)), saldoInicial, 1);
  const minSaldo = Math.min(...proyeccion.map(p => p.saldo_acumulado), 0);
  const hasNegative = minSaldo < 0;

  const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {hasNegative && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", fontSize: "13px", fontWeight: 700, color: "var(--color-danger-text)" }}>
          🚨 {es ? "Hay períodos con saldo negativo proyectado — revisar vencimientos de CXP y acelerar cobros en CXC" : "Projected negative balance detected — review AP due dates and accelerate AR collections"}
        </div>
      )}

      {/* Gráfica de línea del saldo acumulado */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>
          {fl.acumulado ?? "Saldo acumulado proyectado"} — {es ? "próximos 90 días" : "next 90 days"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
          {es ? "Basado en fechas de vencimiento de CXC y CXP. Saldo inicial:" : "Based on CXC and CXP due dates. Opening balance:"} <strong>${fmt0(saldoInicial)}</strong>
        </div>

        {/* SVG line chart */}
        <svg viewBox="0 0 800 200" style={{ width: "100%", height: "200px" }}>
          {/* Línea de cero */}
          {hasNegative && (() => {
            const range = maxSaldo - minSaldo;
            const y0    = ((maxSaldo) / range) * 180 + 10;
            return <line x1="0" y1={y0} x2="800" y2={y0} stroke="var(--color-danger-text)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />;
          })()}

          {/* Área bajo la curva */}
          {proyeccion.length > 1 && (() => {
            const range  = Math.max(maxSaldo - minSaldo, 1);
            const offset = hasNegative ? -minSaldo : 0;
            const pts = proyeccion.map((p, i) => {
              const x = (i / (proyeccion.length - 1)) * 780 + 10;
              const y = ((maxSaldo + offset - p.saldo_acumulado) / range) * 180 + 10;
              return `${x},${y}`;
            });
            const baseline = ((maxSaldo + offset) / range) * 180 + 10;
            return (
              <>
                <path
                  d={`M10,${baseline} L${pts[0]} ${pts.slice(1).map((p, i) => `L${p}`).join(" ")} L${(proyeccion.length - 1) / (proyeccion.length - 1) * 780 + 10},${baseline} Z`}
                  fill="var(--color-brand-blue)" opacity="0.1"
                />
                <polyline
                  points={pts.join(" ")}
                  fill="none"
                  stroke="var(--color-brand-blue)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Puntos */}
                {proyeccion.map((p, i) => {
                  const x = (i / (proyeccion.length - 1)) * 780 + 10;
                  const y = ((maxSaldo + offset - p.saldo_acumulado) / range) * 180 + 10;
                  const color = p.saldo_acumulado < 0 ? "#ef4444" : "var(--color-brand-blue)";
                  return <circle key={i} cx={x} cy={y} r="4" fill={color} />;
                })}
              </>
            );
          })()}

          {/* Labels eje X */}
          {proyeccion.filter((_, i) => i % 2 === 0).map((p, idx) => {
            const i = idx * 2;
            const x = (i / (proyeccion.length - 1)) * 780 + 10;
            const d = new Date(p.fecha);
            return (
              <text key={i} x={x} y="198" textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
                {`${d.getDate()} ${MESES_ES[d.getMonth()]}`}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Tabla de proyección semanal */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 140px", padding: "8px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{es ? "Semana" : "Week"}</span>
          <span style={{ textAlign: "right" }}>{fl.entradasEsperadas ?? "Entradas CXC"}</span>
          <span style={{ textAlign: "right" }}>{fl.salidasEsperadas  ?? "Salidas CXP"}</span>
          <span style={{ textAlign: "right" }}>{fl.neto ?? "Neto semana"}</span>
          <span style={{ textAlign: "right" }}>{fl.acumulado ?? "Saldo acumulado"}</span>
        </div>
        {proyeccion.map((p, i) => {
          const d    = new Date(p.fecha);
          const isNeg = p.saldo_acumulado < 0;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 140px", padding: "9px 20px", borderBottom: i < proyeccion.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", background: isNeg ? "rgba(239,68,68,0.04)" : "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = isNeg ? "rgba(239,68,68,0.08)" : "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = isNeg ? "rgba(239,68,68,0.04)" : "transparent")}>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {`${d.getDate()} ${MESES_ES[d.getMonth()]}`}
              </div>
              <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                {p.entradas_cxc > 0 ? `+$${fmt0(p.entradas_cxc)}` : "—"}
              </div>
              <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                {p.salidas_cxp > 0 ? `−$${fmt0(p.salidas_cxp)}` : "—"}
              </div>
              <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: p.neto_dia >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                {p.neto_dia !== 0 ? `${p.neto_dia > 0 ? "+" : "−"}$${fmt0(Math.abs(p.neto_dia))}` : "—"}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 900, color: isNeg ? "var(--color-danger-text)" : "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                {isNeg ? "−" : ""}${fmt0(Math.abs(p.saldo_acumulado))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
