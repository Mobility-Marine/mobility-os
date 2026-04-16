"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { IndicadoresFinancieros } from "../services/contabilidad.service";

type Props = { data: IndicadoresFinancieros; loading: boolean };

export default function ContabilidadIndicadores({ data: d, loading }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const co = (t as any).contabilidad ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando indicadores…" : "Calculating indicators…"}
    </div>
  );

  const indicadores = [
    {
      label:  co.liquidez     ?? "Razón de liquidez",
      value:  d.liquidez.toFixed(2) + "x",
      desc:   es ? "Activo circulante ÷ Pasivo a corto plazo. >1.5 es saludable" : "Current ratio. >1.5 is healthy",
      status: d.liquidez >= 1.5 ? "saludable" : d.liquidez >= 1 ? "atencion" : "critico",
      icon:   "💧",
    },
    {
      label:  co.endeudamiento ?? "Nivel de endeudamiento",
      value:  (d.endeudamiento * 100).toFixed(1) + "%",
      desc:   es ? "Pasivo total ÷ Activo total. <50% es saludable" : "Total liabilities ÷ Total assets. <50% is healthy",
      status: d.endeudamiento <= 0.5 ? "saludable" : d.endeudamiento <= 0.7 ? "atencion" : "critico",
      icon:   "⚖️",
    },
    {
      label:  co.margenBruto   ?? "Margen bruto",
      value:  d.margen_bruto.toFixed(1) + "%",
      desc:   es ? "Utilidad bruta ÷ Ingresos. >30% es saludable" : "Gross profit ÷ Revenue. >30% is healthy",
      status: d.margen_bruto >= 30 ? "saludable" : d.margen_bruto >= 15 ? "atencion" : "critico",
      icon:   "📊",
    },
    {
      label:  co.margenNeto    ?? "Margen neto",
      value:  d.margen_neto.toFixed(1) + "%",
      desc:   es ? "Utilidad neta ÷ Ingresos. >10% es saludable" : "Net profit ÷ Revenue. >10% is healthy",
      status: d.margen_neto >= 10 ? "saludable" : d.margen_neto >= 5 ? "atencion" : "critico",
      icon:   "💰",
    },
    {
      label:  co.dso           ?? "DSO — Días por cobrar",
      value:  d.dso + " días",
      desc:   es ? "Días promedio para cobrar a clientes. <30d es saludable" : "Avg days to collect from clients. <30d is healthy",
      status: d.dso <= 30 ? "saludable" : d.dso <= 60 ? "atencion" : "critico",
      icon:   "📥",
    },
    {
      label:  co.dpo           ?? "DPO — Días por pagar",
      value:  d.dpo + " días",
      desc:   es ? "Días promedio para pagar proveedores. 30-60d es óptimo" : "Avg days to pay suppliers. 30-60d is optimal",
      status: d.dpo >= 30 && d.dpo <= 60 ? "saludable" : d.dpo < 15 || d.dpo > 90 ? "critico" : "atencion",
      icon:   "📤",
    },
    {
      label:  co.cicloEfectivo ?? "Ciclo de efectivo",
      value:  d.ciclo_efectivo + " días",
      desc:   es ? "DSO − DPO. Menor es mejor — días que el negocio financia la operación" : "DSO − DPO. Lower is better — days business finances operations",
      status: d.ciclo_efectivo <= 0 ? "saludable" : d.ciclo_efectivo <= 30 ? "atencion" : "critico",
      icon:   "🔄",
    },
  ];

  const STATUS = {
    saludable: { color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)", label: co.saludable ?? "Saludable" },
    atencion:  { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", label: co.atencion  ?? "Atención"  },
    critico:   { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  label: co.critico   ?? "Crítico"   },
  };

  const resumen = { saludable: 0, atencion: 0, critico: 0 };
  indicadores.forEach(i => resumen[i.status as keyof typeof resumen]++);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Semáforo general */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
        {(["saludable","atencion","critico"] as const).map(s => (
          <div key={s} style={{ padding: "14px 18px", borderRadius: "var(--radius-lg)", background: STATUS[s].bg, border: `1px solid ${STATUS[s].border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "28px", fontWeight: 900, color: STATUS[s].color }}>{resumen[s]}</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: STATUS[s].color }}>{STATUS[s].label}</div>
              <div style={{ fontSize: "10px", color: STATUS[s].color, opacity: 0.8 }}>{es ? "indicadores" : "indicators"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de indicadores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {indicadores.map((ind) => {
          const st = STATUS[ind.status as keyof typeof STATUS];
          return (
            <div key={ind.label} style={{ background: "var(--color-bg-base)", border: `1px solid ${st.border}`, borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                {ind.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", lineHeight: 1.3 }}>{ind.label}</div>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0, marginLeft: "8px" }}>
                    {st.label}
                  </span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: st.color, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: "6px" }}>
                  {ind.value}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{ind.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
