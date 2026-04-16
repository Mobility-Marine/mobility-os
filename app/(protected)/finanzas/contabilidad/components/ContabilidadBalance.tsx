"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BalanceGeneral } from "../services/contabilidad.service";

type Props = { data: BalanceGeneral; loading: boolean };

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function ContabilidadBalance({ data: d, loading }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const co = (t as any).contabilidad ?? {};

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
      {es ? "Calculando balance…" : "Calculating balance…"}
    </div>
  );

  const pctCxC = d.total_activo > 0 ? (d.cxc_pendiente / d.total_activo) * 100 : 0;
  const pctEfectivo = d.total_activo > 0 ? (d.efectivo_bancos / d.total_activo) * 100 : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

      {/* ACTIVOS */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "var(--color-info-bg)", borderBottom: "1px solid var(--color-info-border)" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)" }}>
            📈 {co.activos ?? "Activos"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-brand-blue)", opacity: 0.7, marginTop: "2px" }}>
            {co.activoCirculante ?? "Activo circulante"}
          </div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: co.efectivo   ?? "Efectivo y bancos",    value: d.efectivo_bancos, pct: pctEfectivo, color: "var(--color-brand-blue)"   },
            { label: es ? "Activos fijos netos" : "Net fixed assets", value: (d as any).activos_fijos_netos ?? 0, pct: d.total_activo > 0 ? (((d as any).activos_fijos_netos ?? 0) / d.total_activo) * 100 : 0, color: "#8b5cf6" },
            { label: co.cxcActivo  ?? "Cuentas por cobrar",   value: d.cxc_pendiente,   pct: pctCxC,      color: "var(--color-warning-text)" },
          ].map(r => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-second)" }}>{r.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>${fmt(r.value)}</span>
              </div>
              <div style={{ height: "5px", background: "var(--color-border-faint)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(r.pct, 100)}%`, background: r.color, borderRadius: "3px" }} />
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px", textAlign: "right" }}>{r.pct.toFixed(1)}%</div>
            </div>
          ))}
          <div style={{ borderTop: "2px solid var(--color-brand-blue)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{co.totalActivo ?? "Total activo"}</span>
            <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>${fmt(d.total_activo)}</span>
          </div>
        </div>
      </div>

      {/* PASIVOS + CAPITAL */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Pasivos */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "var(--color-danger-bg)", borderBottom: "1px solid var(--color-danger-border)" }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-danger-text)" }}>
              📉 {co.pasivos ?? "Pasivos"}
            </div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-second)" }}>{co.cxpPasivo ?? "Cuentas por pagar"}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(d.cxp_pendiente)}</span>
            </div>
            <div style={{ borderTop: "2px solid var(--color-danger-text)", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-danger-text)" }}>{co.totalPasivo ?? "Total pasivo"}</span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(d.total_pasivo)}</span>
            </div>
          </div>
        </div>

        {/* Capital */}
        <div style={{ background: "var(--color-bg-base)", border: `2px solid ${d.capital_contable >= 0 ? "var(--color-success-border)" : "var(--color-danger-border)"}`, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: d.capital_contable >= 0 ? "var(--color-success-bg)" : "var(--color-danger-bg)", borderBottom: `1px solid ${d.capital_contable >= 0 ? "var(--color-success-border)" : "var(--color-danger-border)"}` }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: d.capital_contable >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
              ⚖️ {co.capital ?? "Capital contable"}
            </div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>Activos − Pasivos</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>${fmt(d.total_activo)} − ${fmt(d.total_pasivo)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: 900, color: d.capital_contable >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                  {d.capital_contable < 0 ? "−" : ""}${fmt(Math.abs(d.capital_contable))}
                </div>
              </div>
            </div>
            {/* Barra activo vs pasivo */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ height: "10px", borderRadius: "5px", overflow: "hidden", background: "var(--color-border-faint)", display: "flex" }}>
                <div style={{ height: "100%", width: `${d.total_activo > 0 ? Math.min((d.efectivo_bancos / d.total_activo) * 100, 100) : 0}%`, background: "var(--color-brand-blue)" }} />
                <div style={{ height: "100%", width: `${d.total_activo > 0 ? Math.min((d.cxc_pendiente / d.total_activo) * 100, 100) : 0}%`, background: "var(--color-warning-text)", opacity: 0.7 }} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "9px", color: "var(--color-text-muted)" }}>
                <span>🔵 {es ? "Efectivo" : "Cash"}</span>
                <span>🟡 CXC</span>
                <span>🔴 CXP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ecuación contable */}
        <div style={{ padding: "12px 16px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center" }}>
          {es ? "Activo = Pasivo + Capital" : "Assets = Liabilities + Equity"}<br />
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "var(--color-text-primary)" }}>
            ${fmt(d.total_activo)} = ${fmt(d.total_pasivo)} + ${fmt(d.capital_contable)}
          </span>
        </div>
      </div>
    </div>
  );
}
