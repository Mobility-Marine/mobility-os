"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { APStats, SupplierAPSummary } from "../types/cxp.types";
import { AP_AGING_CONFIG, AP_SUPPLIER_TYPE_CONFIG } from "../types/cxp.types";

type Props = {
  stats:     APStats;
  suppliers: SupplierAPSummary[];
  loading:   boolean;
  onSupplierSelect: (s: SupplierAPSummary) => void;
  onNewPayable:     () => void;
};

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function CxPDashboard({ stats: s, suppliers, loading, onSupplierSelect, onNewPayable }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const cxp = (t as any).cxp ?? {};
  const totalBuckets = s.bucket_0_30 + s.bucket_31_60 + s.bucket_61_90 + s.bucket_90plus || 1;

  const RISK_CONFIG = {
    LOW:      { label: "Bajo",    color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    MEDIUM:   { label: "Medio",   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    HIGH:     { label: "Alto",    color: "#f97316",                   bg: "rgba(249,115,22,0.1)"   },
    CRITICAL: { label: "Crítico", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── KPIs por moneda ── */}
      {Object.entries(s.por_moneda ?? {}).sort().map(([cur, v]) => (
        <div key={cur} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "8px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>{cur === "MXN" ? "🇲🇽" : cur === "USD" ? "🇺🇸" : cur === "EUR" ? "🇪🇺" : "💱"}</span>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-text-primary)" }}>{cur}</span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>· {v.count} {es ? "documentos activos" : "active documents"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { l: cxp.totalPayable ?? "Por pagar",  v: v.balance, color: "var(--color-danger-text)",                                             icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
              { l: cxp.totalOverdue ?? "Vencido",    v: v.overdue, color: v.overdue > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg> },
              { l: cxp.paidMonth    ?? "Pagado mes", v: v.paid,    color: "var(--color-success-text)",                                            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="20 6 9 17 4 12"/></svg> },
            ].map((c, i) => (
              <div key={c.l} style={{ padding: "16px 18px", borderRight: i < 2 ? "1px solid var(--color-border-faint)" : "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.l}</div>
                  <div style={{ color: c.color, opacity: 0.7 }}>{c.icon}</div>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {cur} ${fmt(c.v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Totales consolidados + Por tipo ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
            {es ? "Resumen consolidado" : "Consolidated summary"}
          </div>
          {[
            { l: es ? "Total activo"  : "Total active",  v: "$" + fmt0(s.total_balance) },
            { l: es ? "Vencido total" : "Total overdue", v: "$" + fmt0(s.total_overdue) },
            { l: es ? "Obligaciones"  : "Obligations",   v: String(s.count_pending)     },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
              <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {es ? "Por tipo de gasto" : "By expense type"}
          </div>
          {(["procurement","logistics","operating"] as const).map((type) => {
            const cfg = AP_SUPPLIER_TYPE_CONFIG[type];
            const amt = s.by_type[type];
            const pct = (amt / (s.total_balance || 1)) * 100;
            return (
              <div key={type}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-second)" }}>{cfg.icon} {cfg.labelEs}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: cfg.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(amt)}</span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: "var(--color-border-faint)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: cfg.color, borderRadius: "2px" }} />
                </div>
              </div>
            );
          })}
          <button onClick={onNewPayable} style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}>
            {cxp.newPayable ?? "+ Nueva cuenta por pagar"}
          </button>
        </div>
      </div>

      {/* ── Aging ── */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>
          {cxp.distribution ?? "Distribución por antigüedad"}
        </div>
        <div style={{ height: "24px", borderRadius: "var(--radius-md)", overflow: "hidden", display: "flex", marginBottom: "16px" }}>
          {[
            { pct: s.bucket_0_30   / totalBuckets, ...AP_AGING_CONFIG["0-30"]  },
            { pct: s.bucket_31_60  / totalBuckets, ...AP_AGING_CONFIG["31-60"] },
            { pct: s.bucket_61_90  / totalBuckets, ...AP_AGING_CONFIG["61-90"] },
            { pct: s.bucket_90plus / totalBuckets, ...AP_AGING_CONFIG["+90"]   },
          ].filter(b => b.pct > 0).map((b, i) => (
            <div key={i} style={{ width: `${b.pct * 100}%`, background: b.color, transition: "width 0.5s" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {([
            { key: "0-30",  amount: s.bucket_0_30,   count: s.count_0_30   },
            { key: "31-60", amount: s.bucket_31_60,  count: s.count_31_60  },
            { key: "61-90", amount: s.bucket_61_90,  count: s.count_61_90  },
            { key: "+90",   amount: s.bucket_90plus, count: s.count_90plus },
          ] as const).map(({ key, amount, count }) => {
            const cfg = AP_AGING_CONFIG[key];
            return (
              <div key={key} style={{ padding: "10px", borderRadius: "var(--radius-md)", background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{cfg.labelEs}</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: cfg.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(amount)}</div>
                <div style={{ fontSize: "10px", color: cfg.color, opacity: 0.8, marginTop: "2px" }}>{count} {es ? "cuentas" : "accounts"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top proveedores ── */}
      {suppliers.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{cxp.topSuppliers ?? "Principales proveedores"}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{cxp.topSubtitle ?? "Ordenado por saldo pendiente."}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 130px 130px 80px 100px", padding: "8px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>Proveedor</span>
            <span style={{ textAlign: "center" }}>Tipo</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span style={{ textAlign: "right" }}>Vencido</span>
            <span style={{ textAlign: "center" }}>Antigüedad</span>
            <span style={{ textAlign: "center" }}>Riesgo</span>
          </div>
          {suppliers.slice(0, 8).map((sup, i) => {
            const risk = RISK_CONFIG[sup.risk];
            const cfg  = AP_SUPPLIER_TYPE_CONFIG[sup.supplier_type];
            const days = Math.floor((new Date().getTime() - new Date(sup.oldest_date).getTime()) / 86400000);
            return (
              <div key={`${sup.supplier_name}-${i}`} onClick={() => onSupplierSelect(sup)}
                style={{ display: "grid", gridTemplateColumns: "1fr 100px 130px 130px 80px 100px", padding: "11px 20px", borderBottom: i < suppliers.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{sup.supplier_name}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{sup.supplier_rfc || "—"}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: `${cfg.color}20`, color: cfg.color }}>
                    {cfg.icon} {cfg.labelEs}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                  {sup.currency} ${fmt(sup.balance)}
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: sup.overdue > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {sup.overdue > 0 ? `${sup.currency} $${fmt(sup.overdue)}` : "—"}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: days > 90 ? "var(--color-danger-bg)" : days > 30 ? "var(--color-warning-bg)" : "var(--color-success-bg)", color: days > 90 ? "var(--color-danger-text)" : days > 30 ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
                    {days}d
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: risk.bg, color: risk.color }}>
                    {risk.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
