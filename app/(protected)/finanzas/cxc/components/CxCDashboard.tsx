"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ARStats, ClientARSummary, ARActivity } from "../types/cxc.types";
import { AR_AGING_CONFIG } from "../types/cxc.types";

type Props = {
  stats:   ARStats;
  clients: ClientARSummary[];
  loading: boolean;
  onClientSelect:(c: ClientARSummary) => void;
  onNewPayment:  () => void;
  onSync:        () => void;
  syncing:       boolean;
};

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function CxCDashboard({ stats: s, clients, loading, onClientSelect, onNewPayment, onSync, syncing }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const totalBuckets = s.bucket_0_30 + s.bucket_31_60 + s.bucket_61_90 + s.bucket_90plus || 1;

  const RISK_CONFIG = {
    LOW:      { es: "Bajo",     en: "Low",      color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    MEDIUM:   { es: "Medio",    en: "Medium",   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    HIGH:     { es: "Alto",     en: "High",     color: "#f97316",                   bg: "#fff7ed"                 },
    CRITICAL: { es: "Crítico",  en: "Critical", color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          {
            l: es ? "Total por cobrar"   : "Total receivable",
            v: "$" + fmt0(s.total_balance),
            sub: `${s.count_pending} ${es ? "cuentas activas" : "active accounts"}`,
            color: "var(--color-brand-blue)", bg: "var(--color-info-bg)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
          },
          {
            l: es ? "Cartera vencida (+30d)" : "Overdue (+30d)",
            v: "$" + fmt0(s.total_overdue),
            sub: `${s.count_overdue} ${es ? "cuentas vencidas" : "overdue accounts"}`,
            color: s.total_overdue > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)",
            bg:    s.total_overdue > 0 ? "var(--color-danger-bg)"   : "var(--color-bg-base)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
          },
          {
            l: es ? "Cobrado este mes"    : "Collected this month",
            v: "$" + fmt0(s.collected_month),
            sub: es ? "pagos registrados" : "registered payments",
            color: "var(--color-success-text)", bg: "var(--color-success-bg)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="20 6 9 17 4 12"/></svg>,
          },
          {
            l: es ? "DSO — Días de cobro" : "DSO — Days outstanding",
            v: `${s.dso} ${es ? "días" : "days"}`,
            sub: es ? "promedio de cobro" : "average collection",
            color: s.dso > 60 ? "var(--color-danger-text)" : s.dso > 30 ? "var(--color-warning-text)" : "var(--color-success-text)",
            bg: s.dso > 60 ? "var(--color-danger-bg)" : s.dso > 30 ? "var(--color-warning-bg)" : "var(--color-success-bg)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
          },
        ].map((c) => (
          <div key={c.l} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", flex: 1, lineHeight: 1.3 }}>{c.l}</div>
              <div style={{ width: "34px", height: "34px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.v}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Aging + Acciones rápidas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>

        {/* Aging Distribution */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px" }}>
            {es ? "Distribución de cartera por antigüedad" : "Portfolio distribution by age"}
          </div>

          {/* Barra stacked */}
          <div style={{ height: "24px", borderRadius: "var(--radius-md)", overflow: "hidden", display: "flex", marginBottom: "16px" }}>
            {[
              { pct: s.bucket_0_30  / totalBuckets, ...AR_AGING_CONFIG["0-30"]  },
              { pct: s.bucket_31_60 / totalBuckets, ...AR_AGING_CONFIG["31-60"] },
              { pct: s.bucket_61_90 / totalBuckets, ...AR_AGING_CONFIG["61-90"] },
              { pct: s.bucket_90plus/ totalBuckets, ...AR_AGING_CONFIG["+90"]   },
            ].filter(b => b.pct > 0).map((b, i) => (
              <div key={i} style={{ width: `${b.pct * 100}%`, background: b.color, transition: "width 0.5s" }} title={`$${fmt0(b.pct * totalBuckets)}`} />
            ))}
          </div>

          {/* Leyenda con detalles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {([
              { key: "0-30",  amount: s.bucket_0_30,   count: s.count_0_30   },
              { key: "31-60", amount: s.bucket_31_60,  count: s.count_31_60  },
              { key: "61-90", amount: s.bucket_61_90,  count: s.count_61_90  },
              { key: "+90",   amount: s.bucket_90plus, count: s.count_90plus },
            ] as const).map(({ key, amount, count }) => {
              const cfg = AR_AGING_CONFIG[key];
              return (
                <div key={key} style={{ padding: "10px", borderRadius: "var(--radius-md)", background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                    {es ? cfg.labelEs : cfg.labelEn}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: cfg.color, fontVariantNumeric: "tabular-nums" }}>${fmt0(amount)}</div>
                  <div style={{ fontSize: "10px", color: cfg.color, opacity: 0.8, marginTop: "2px" }}>{count} {es ? "cuentas" : "accounts"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            {es ? "Acciones rápidas" : "Quick actions"}
          </div>
          {[
            { es: "Registrar pago recibido",   en: "Register received payment",  action: onNewPayment, color: "var(--color-success-text)" },
            { es: "Sincronizar CFDIs a CxC", en: "Sync CFDIs to AR", action: onSync, color: "var(--color-brand-blue)", loading: syncing },
          ].map((a, i) => (
            <button key={i} onClick={a.action} disabled={a.loading}
              style={{ height: "40px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.1s", opacity: a.loading ? 0.6 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = a.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-faint)"; e.currentTarget.style.color = "var(--color-text-second)"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {a.loading ? (es ? "Sincronizando…" : "Syncing…") : (es ? a.es : a.en)}
            </button>
          ))}

          <div style={{ borderTop: "1px solid var(--color-border-faint)", paddingTop: "10px", marginTop: "4px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              {es ? "Resumen cartera" : "Portfolio summary"}
            </div>
            {[
              { l: es ? "Total activo"   : "Total active",   v: "$" + fmt0(s.total_balance) },
              { l: es ? "Vencido"        : "Overdue",        v: "$" + fmt0(s.total_overdue) },
              { l: es ? "Cobrado (mes)"  : "Collected (mo)", v: "$" + fmt0(s.collected_month) },
              { l: "DSO",                                     v: `${s.dso}d` },
            ].map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top deudores ── */}
      {clients.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border-faint)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Principales cuentas por cobrar" : "Top accounts receivable"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {es ? "Ordenado por saldo pendiente. Haz clic en cualquier cliente para ver su estado de cuenta completo." : "Sorted by outstanding balance. Click any client to view their full account statement."}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px 130px 80px 100px", padding: "8px 20px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>{es ? "Cliente" : "Client"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Docs." : "Docs."}</span>
            <span style={{ textAlign: "right" }}>{es ? "Total" : "Total"}</span>
            <span style={{ textAlign: "right" }}>{es ? "Vencido" : "Overdue"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Antigüedad" : "Oldest"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Riesgo" : "Risk"}</span>
          </div>

          {clients.slice(0, 8).map((c, i) => {
            const risk = RISK_CONFIG[c.risk];
            const oldestDays = Math.floor((new Date().getTime() - new Date(c.oldest_date).getTime()) / 86400000);
            return (
              <div key={`${c.client_name}-${i}`} onClick={() => onClientSelect(c)}
                style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px 130px 80px 100px", padding: "11px 20px", borderBottom: i < Math.min(clients.length, 8) - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.client_name}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{c.client_rfc || "—"}</div>
                </div>
                <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "var(--color-text-second)" }}>{c.count}</div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                  {c.currency} ${fmt(c.balance)}
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: c.overdue > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {c.overdue > 0 ? `${c.currency} $${fmt(c.overdue)}` : "—"}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: oldestDays > 90 ? "var(--color-danger-bg)" : oldestDays > 30 ? "var(--color-warning-bg)" : "var(--color-success-bg)", color: oldestDays > 90 ? "var(--color-danger-text)" : oldestDays > 30 ? "var(--color-warning-text)" : "var(--color-success-text)" }}>
                    {oldestDays}d
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: risk.bg, color: risk.color }}>
                    {es ? risk.es : risk.en}
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
