"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReportRH } from "../types/reports.types";
import BarChart   from "./charts/BarChart";
import DonutChart from "./charts/DonutChart";

type Props = { data: ReportRH; loading: boolean };
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

const CONTRATO_LABELS: Record<string, string> = {
  indefinite: "Indefinido", fixed_term: "Tiempo det.", project: "Por proyecto",
  per_hour: "Por hora", internship: "Prácticas",
};
const CONTRATO_COLORS = ["var(--color-brand-blue)", "var(--color-success-text)", "var(--color-warning-text)", "#f97316", "#8b5cf6"];

export default function ReportsRH({ data: d, loading }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>Cargando…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { l: es ? "Headcount total"  : "Total headcount", v: d.headcount,          color: "var(--color-text-primary)", icon: "👥" },
          { l: es ? "Activos"          : "Active",          v: d.activos,             color: "var(--color-success-text)", icon: "✅" },
          { l: es ? "En vacaciones"    : "On vacation",     v: d.en_vacaciones,       color: "var(--color-brand-blue)",   icon: "🏖️" },
          { l: es ? "Bajas en el año"  : "YTD terminations",v: d.bajas_ytd,           color: "var(--color-danger-text)",  icon: "📤" },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.l}</div>
              <span style={{ fontSize: "20px" }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: c.color, lineHeight: 1, marginTop: "8px" }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Costo nómina */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {[
          { l: es ? "Nómina neta"         : "Net payroll",       v: d.nomina_periodo,     color: "var(--color-brand-blue)"   },
          { l: es ? "IMSS patrón"          : "IMSS employer",     v: d.imss_patron,        color: "var(--color-warning-text)" },
          { l: es ? "Costo total empresa"  : "Total company cost",v: d.costo_total_patron, color: "var(--color-danger-text)"  },
        ].map(c => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>{c.l}</div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(c.v)}</div>
          </div>
        ))}
      </div>

      {/* Por departamento + Por contrato */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
            🏢 {es ? "Distribución por departamento" : "By department"}
          </div>
          {d.por_departamento.map(dept => {
            const pct = d.activos > 0 ? (dept.count / d.activos) * 100 : 0;
            return (
              <div key={dept.dept} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-second)" }}>{dept.dept}</span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{dept.count} {es ? "personas" : "people"}</span>
                  </div>
                </div>
                <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-brand-blue)", borderRadius: "3px" }} />
                </div>
              </div>
            );
          })}
          {d.por_departamento.length === 0 && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center", padding: "20px" }}>Sin datos</div>}
        </div>

        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            📋 {es ? "Tipo de contrato" : "Contract type"}
          </div>
          <DonutChart
            data={d.por_contrato.map((c, i) => ({
              label: CONTRATO_LABELS[c.tipo] ?? c.tipo,
              value: c.count,
              color: CONTRATO_COLORS[i % CONTRATO_COLORS.length],
            }))}
            size={120}
            centerLabel={es ? "total" : "total"}
            centerValue={String(d.activos)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            {d.por_contrato.map((c, i) => (
              <div key={c.tipo} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  <span style={{ color: CONTRATO_COLORS[i % CONTRATO_COLORS.length] }}>●</span> {CONTRATO_LABELS[c.tipo] ?? c.tipo}
                </span>
                <span style={{ fontWeight: 700, color: CONTRATO_COLORS[i % CONTRATO_COLORS.length] }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historial nóminas */}
      {d.historial.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
            💰 {es ? "Historial de nóminas — últimos 12 períodos" : "Payroll history — last 12 periods"}
          </div>
          <BarChart
            data={d.historial.map(n => ({ label: n.periodo, value: n.neto, value2: n.percepciones }))}
            dual label1={es ? "Neto" : "Net"} label2={es ? "Percepciones" : "Gross"} height={160}
            formatValue={v => "$" + v.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          />
        </div>
      )}
    </div>
  );
}
