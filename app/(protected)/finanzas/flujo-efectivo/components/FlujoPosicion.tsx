"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { FlujoPosicion } from "../services/flujo.service";

type Props = { posicion: FlujoPosicion; loading: boolean };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function FlujoPosicionView({ posicion: p, loading }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const fl  = (t as any).flujo ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando posición…" : "Calculating position…"}
    </div>
  );

  // Semáforo de liquidez
  const minSaldo = Math.min(p.saldo_30d, p.saldo_60d, p.saldo_90d);
  const salud = minSaldo < 0 ? "critico" : minSaldo < p.saldo_bancos * 0.2 ? "precaucion" : "saludable";
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
            {es ? "Basado en saldo actual + CXC cobrable − CXP por pagar en 90 días" : "Based on current balance + collectible AR − payable AP in 90 days"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: saludConfig.color, opacity: 0.7 }}>{es ? "Mínimo proyectado" : "Projected minimum"}</div>
          <div style={{ fontSize: "20px", fontWeight: 900, color: saludConfig.color, fontVariantNumeric: "tabular-nums" }}>
            ${fmt0(minSaldo)}
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
        {[
          { label: fl.saldoBancos    ?? "Saldo en bancos",    value: p.saldo_bancos,    color: "var(--color-brand-blue)",   icon: "🏦", sub: es ? "disponible ahora" : "available now" },
          { label: fl.cxcPendiente   ?? "CXC por cobrar",     value: p.cxc_pendiente,   color: "var(--color-success-text)", icon: "📥", sub: es ? "por ingresar" : "incoming" },
          { label: fl.cxpPendiente   ?? "CXP por pagar",      value: p.cxp_pendiente,   color: "var(--color-danger-text)",  icon: "📤", sub: es ? "comprometido" : "committed" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
              <span style={{ fontSize: "18px" }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(c.value)}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Proyección 30/60/90 días */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>
          {fl.saldoProyectado ?? "Saldo proyectado"} — {es ? "incluyendo CXC cobrable y CXP por vencer" : "including collectible AR and upcoming AP"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: fl.dias30 ?? "En 30 días", value: p.saldo_30d, base: p.saldo_bancos },
            { label: fl.dias60 ?? "En 60 días", value: p.saldo_60d, base: p.saldo_bancos },
            { label: fl.dias90 ?? "En 90 días", value: p.saldo_90d, base: p.saldo_bancos },
          ].map((r, i) => {
            const pct   = r.base > 0 ? Math.min((r.value / r.base) * 100, 200) : 0;
            const color = r.value < 0 ? "var(--color-danger-text)" : r.value < r.base * 0.5 ? "var(--color-warning-text)" : "var(--color-success-text)";
            return (
              <div key={i} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>{r.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
                  {r.value < 0 ? "−" : ""}${fmt0(Math.abs(r.value))}
                </div>
                <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(Math.min(pct, 100), 0)}%`, background: color, borderRadius: "3px", transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                  {r.value >= r.base
                    ? `↑ +${fmt0(r.value - r.base)} vs hoy`
                    : `↓ ${fmt0(r.value - r.base)} vs hoy`
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flujo del mes actual */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "14px" }}>
          {es ? "Flujo real del mes actual" : "Current month real cash flow"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: fl.ingresos ?? "Ingresos", value: p.ingresos_mes, color: "var(--color-success-text)", sign: "+" },
            { label: fl.egresos  ?? "Egresos",  value: p.egresos_mes,  color: "var(--color-danger-text)",  sign: "−" },
            { label: fl.flujaNeto?? "Neto",     value: p.flujo_neto_mes, color: p.flujo_neto_mes >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", sign: p.flujo_neto_mes >= 0 ? "+" : "−" },
          ].map(r => (
            <div key={r.label} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>{r.label}</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: r.color, fontVariantNumeric: "tabular-nums" }}>
                {r.sign}${fmt(Math.abs(r.value))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
