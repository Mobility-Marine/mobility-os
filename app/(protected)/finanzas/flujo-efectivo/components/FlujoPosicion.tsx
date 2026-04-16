"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { FlujoPosicion } from "../services/flujo.service";

type Props = { posicion: FlujoPosicion; loading: boolean };

const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });
const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function FlujoPosicionView({ posicion: p, loading }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const fl = (t as any).flujo ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando posición…" : "Calculating position…"}
    </div>
  );

  // Todas las monedas presentes en el sistema
  const todasMonedas = Array.from(new Set([
    ...Object.keys(p.saldo_por_moneda),
    ...Object.keys(p.cxc_por_moneda),
    ...Object.keys(p.cxp_por_moneda),
    ...Object.keys(p.flujo_por_moneda),
  ])).sort();

  // Semáforo — basado en moneda principal
  const minSaldo = Math.min(p.saldo_30d, p.saldo_60d, p.saldo_90d);
  const salud = minSaldo < 0
    ? "critico"
    : minSaldo < p.saldo_bancos * 0.2
    ? "precaucion"
    : "saludable";
  const saludConfig = {
    saludable:  { color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)", icon: "✅" },
    precaucion: { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", border: "var(--color-warning-border)", icon: "⚠️" },
    critico:    { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)",  border: "var(--color-danger-border)",  icon: "🚨" },
  }[salud];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Alerta días negativos */}
      {p.dias_negativo && (
        <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", fontSize: "14px", fontWeight: 700, color: "var(--color-danger-text)" }}>
          {fl.alertaNegativo ?? "⚠️ Saldo proyectado negativo en"} <strong>{p.dias_negativo}</strong> {fl.alertaNegativoDias ?? "días — revisar CXP y disponibilidad"}
        </div>
      )}

      {/* Semáforo */}
      <div style={{ padding: "16px 20px", borderRadius: "var(--radius-lg)", background: saludConfig.bg, border: `1px solid ${saludConfig.border}`, display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{ fontSize: "32px" }}>{saludConfig.icon}</span>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: saludConfig.color }}>
            {fl[salud] ?? salud}
          </div>
          <div style={{ fontSize: "12px", color: saludConfig.color, opacity: 0.8, marginTop: "2px" }}>
            {es
              ? `Proyección en ${p.moneda_principal} — moneda principal del sistema`
              : `Projection in ${p.moneda_principal} — primary system currency`}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: saludConfig.color, opacity: 0.7 }}>
            {es ? "Mínimo proyectado 90d" : "90d projected minimum"}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 900, color: saludConfig.color, fontVariantNumeric: "tabular-nums" }}>
            {p.moneda_principal} {minSaldo < 0 ? "−" : ""}${fmt0(Math.abs(minSaldo))}
          </div>
        </div>
      </div>

      {/* ── KPIs POR MONEDA ── */}
      {todasMonedas.map(cur => {
        const saldo  = p.saldo_por_moneda[cur] ?? 0;
        const cxc    = p.cxc_por_moneda[cur]   ?? 0;
        const cxp    = p.cxp_por_moneda[cur]   ?? 0;
        const flujo  = p.flujo_por_moneda[cur]  ?? { ingresos: 0, egresos: 0, neto: 0 };
        const esPrincipal = cur === p.moneda_principal;

        return (
          <div key={cur} style={{ background: "var(--color-bg-base)", border: `1px solid ${esPrincipal ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

            {/* Header moneda */}
            <div style={{ padding: "10px 20px", background: esPrincipal ? "var(--color-info-bg)" : "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: esPrincipal ? "var(--color-brand-blue)" : "var(--color-text-second)" }}>
                {cur === "MXN" ? "🇲🇽" : cur === "USD" ? "🇺🇸" : cur === "EUR" ? "🇪🇺" : "💱"} {cur}
              </span>
              {esPrincipal && (
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)", color: "#fff" }}>
                  {es ? "MONEDA PRINCIPAL" : "PRIMARY CURRENCY"}
                </span>
              )}
            </div>

            {/* 4 KPIs de esta moneda */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
              {[
                { label: fl.saldoBancos  ?? "Saldo bancos",   value: saldo,       color: "var(--color-brand-blue)",   icon: "🏦" },
                { label: fl.cxcPendiente ?? "CXC por cobrar", value: cxc,         color: "var(--color-success-text)", icon: "📥" },
                { label: fl.cxpPendiente ?? "CXP por pagar",  value: cxp,         color: "var(--color-danger-text)",  icon: "📤" },
                { label: fl.flujaNeto    ?? "Flujo del mes",   value: flujo.neto,  color: flujo.neto >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", icon: "📊" },
              ].map((c, i) => (
                <div key={c.label} style={{ padding: "16px 18px", borderRight: i < 3 ? "1px solid var(--color-border-faint)" : "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "14px" }}>{c.icon}</span>
                    <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>
                    {c.value < 0 ? "−" : ""}{cur} ${fmt0(Math.abs(c.value))}
                  </div>
                </div>
              ))}
            </div>

            {/* Detalle flujo del mes */}
            {(flujo.ingresos > 0 || flujo.egresos > 0) && (
              <div style={{ padding: "8px 20px", borderTop: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", display: "flex", gap: "20px" }}>
                <span style={{ fontSize: "11px", color: "var(--color-success-text)", fontWeight: 600 }}>
                  ↑ +{cur} ${fmt(flujo.ingresos)} {es ? "ingresos" : "income"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-danger-text)", fontWeight: 600 }}>
                  ↓ −{cur} ${fmt(flujo.egresos)} {es ? "egresos" : "expenses"}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* ── PROYECCIÓN 30/60/90 — solo moneda principal ── */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {fl.saldoProyectado ?? "Saldo proyectado"} — {es ? "CXC cobrable menos CXP por vencer" : "collectible AR minus upcoming AP"}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)" }}>
            {p.moneda_principal}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: fl.dias30 ?? "En 30 días", value: p.saldo_30d },
            { label: fl.dias60 ?? "En 60 días", value: p.saldo_60d },
            { label: fl.dias90 ?? "En 90 días", value: p.saldo_90d },
          ].map((r, i) => {
            const base  = p.saldo_bancos;
            const pct   = base > 0 ? Math.min((r.value / base) * 100, 200) : 0;
            const color = r.value < 0
              ? "var(--color-danger-text)"
              : r.value < base * 0.5
              ? "var(--color-warning-text)"
              : "var(--color-success-text)";
            const diff  = r.value - base;
            return (
              <div key={i} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{r.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
                  {r.value < 0 ? "−" : ""}{p.moneda_principal} ${fmt0(Math.abs(r.value))}
                </div>
                <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(Math.min(pct, 100), 0)}%`, background: color, borderRadius: "3px", transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: "10px", color: diff >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontWeight: 600 }}>
                  {diff >= 0 ? "↑" : "↓"} {diff >= 0 ? "+" : ""}{fmt0(diff)} {es ? "vs hoy" : "vs today"}
                </div>
              </div>
            );
          })}
        </div>
        {todasMonedas.length > 1 && (
          <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "11px", color: "var(--color-text-muted)" }}>
            ℹ️ {es
              ? `La proyección usa únicamente ${p.moneda_principal}. Las operaciones en otras monedas requieren tipo de cambio para consolidarse.`
              : `Projection uses ${p.moneda_principal} only. Multi-currency consolidation requires exchange rates.`}
          </div>
        )}
      </div>

    </div>
  );
}
