"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { FlujoHistorico } from "../services/flujo.service";

type Props = { historico: FlujoHistorico[]; loading: boolean };

const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function FlujoHistoricoView({ historico, loading }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const fl  = (t as any).flujo ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Cargando histórico…" : "Loading history…"}
    </div>
  );

  const maxVal = Math.max(...historico.map(h => Math.max(h.ingresos, h.egresos)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Barras comparativas */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "20px" }}>
          {es ? "Ingresos vs Egresos — últimos 6 meses" : "Income vs Expenses — last 6 months"}
        </div>

        {/* Leyenda */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          {[
            { color: "var(--color-success-text)", label: fl.ingresos ?? "Ingresos" },
            { color: "var(--color-danger-text)",  label: fl.egresos  ?? "Egresos"  },
            { color: "var(--color-brand-blue)",   label: fl.neto     ?? "Neto"     },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: l.color }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Gráfica de barras */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", height: "200px" }}>
          {historico.map((h, i) => {
            const pctIng = (h.ingresos / maxVal) * 100;
            const pctEgr = (h.egresos  / maxVal) * 100;
            return (
              <div key={h.periodo} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                {/* Barras */}
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", gap: "3px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ height: `${pctIng}%`, background: "var(--color-success-text)", borderRadius: "3px 3px 0 0", opacity: 0.85, transition: "height 0.5s", minHeight: h.ingresos > 0 ? "3px" : "0" }} title={`Ingresos: $${fmt0(h.ingresos)}`} />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ height: `${pctEgr}%`, background: "var(--color-danger-text)", borderRadius: "3px 3px 0 0", opacity: 0.85, transition: "height 0.5s", minHeight: h.egresos > 0 ? "3px" : "0" }} title={`Egresos: $${fmt0(h.egresos)}`} />
                  </div>
                </div>
                {/* Label */}
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.2 }}>{h.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla resumen */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "8px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{es ? "Período" : "Period"}</span>
          <span style={{ textAlign: "right" }}>{fl.ingresos ?? "Ingresos"}</span>
          <span style={{ textAlign: "right" }}>{fl.egresos  ?? "Egresos"}</span>
          <span style={{ textAlign: "right" }}>{fl.neto     ?? "Neto"}</span>
        </div>
        {historico.map((h, i) => (
          <div key={h.periodo} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 20px", borderBottom: i < historico.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{h.label}</div>
            <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {h.ingresos > 0 ? `+$${fmt0(h.ingresos)}` : "—"}
            </div>
            <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
              {h.egresos > 0 ? `−$${fmt0(h.egresos)}` : "—"}
            </div>
            <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 900, color: h.neto >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
              {h.neto >= 0 ? "+" : "−"}${fmt0(Math.abs(h.neto))}
            </div>
          </div>
        ))}
        {/* Totales */}
        {historico.length > 0 && (() => {
          const totIng = historico.reduce((s, h) => s + h.ingresos, 0);
          const totEgr = historico.reduce((s, h) => s + h.egresos,  0);
          const totNet = totIng - totEgr;
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 20px", background: "var(--color-bg-subtle)", borderTop: "2px solid var(--color-border-faint)" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)" }}>TOTAL</div>
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 900, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>+${fmt0(totIng)}</div>
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 900, color: "var(--color-danger-text)",  fontVariantNumeric: "tabular-nums" }}>−${fmt0(totEgr)}</div>
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 900, color: totNet >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                {totNet >= 0 ? "+" : "−"}${fmt0(Math.abs(totNet))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
