"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BankAccount, BankStats, BankTransaction } from "../types/bancos.types";
import { ACCOUNT_TYPE_CONFIG, TX_TYPE_CONFIG } from "../types/bancos.types";

type Props = {
  accounts:     BankAccount[];
  stats:        BankStats;
  transactions: BankTransaction[];
  loading:      boolean;
  onSelectAccount: (a: BankAccount) => void;
  onAddAccount:    () => void;
  onAddTransaction:() => void;
};

const fmt  = (n: number, dec = 2) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: dec });

export default function BancosDashboard({ accounts, stats: s, transactions, loading, onSelectAccount, onAddAccount, onAddTransaction }: Props) {
  const { lang, t } = useTranslation();
  const es   = lang !== "en";
  const bnk  = (t as any).bancos ?? {};

  const recent = transactions.slice(0, 8);

  const kpis = [
    {
      label: bnk.totalBalance ?? "Saldo total",
      value: `$${fmt(s.total_balance)}`,
      sub:   `${accounts.length} ${es ? "cuentas activas" : "active accounts"}`,
      color: "var(--color-brand-blue)", bg: "var(--color-info-bg)",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    },
    {
      label: bnk.totalIncome ?? "Cobrado este mes",
      value: `$${fmt(s.total_income)}`,
      sub:   es ? "ingresos del mes" : "monthly income",
      color: "var(--color-success-text)", bg: "var(--color-success-bg)",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
    {
      label: bnk.totalExpense ?? "Pagado este mes",
      value: `$${fmt(s.total_expense)}`,
      sub:   es ? "egresos del mes" : "monthly expenses",
      color: s.total_expense > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)",
      bg:    s.total_expense > 0 ? "var(--color-danger-bg)"   : "var(--color-bg-base)",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    },
    {
      label: bnk.projected ?? "Proyección de liquidez",
      value: `$${fmt(s.projected_net)}`,
      sub:   `CXC $${fmt(s.projected_ar, 0)} − CXP $${fmt(s.projected_ap, 0)}`,
      color: s.projected_net >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)",
      bg:    s.projected_net >= 0 ? "var(--color-success-bg)"   : "var(--color-danger-bg)",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {kpis.map(c => (
          <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", flex: 1, lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ width: "34px", height: "34px", borderRadius: "var(--radius-md)", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerta conciliación pendiente */}
      {s.unreconciled > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-text)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-warning-text)" }}>
            {s.unreconciled} {es ? "movimiento(s) automáticos pendientes de conciliar" : "automatic transaction(s) pending reconciliation"}
          </span>
        </div>
      )}

      {/* Cuentas + Movimientos recientes */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px" }}>

        {/* Cuentas bancarias */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Cuentas" : "Accounts"}
            </div>
            <button onClick={onAddAccount}
              style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {bnk.addAccount ?? "+ Nueva cuenta"}
            </button>
          </div>
          {accounts.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏦</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{bnk.noAccounts ?? "Sin cuentas registradas"}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{bnk.noAccountsDesc}</div>
            </div>
          ) : (
            accounts.map((acc, i) => {
              const cfg = ACCOUNT_TYPE_CONFIG[acc.account_type];
              return (
                <div key={acc.id} onClick={() => onSelectAccount(acc)}
                  style={{ padding: "14px 18px", borderBottom: i < accounts.length - 1 ? "1px solid var(--color-border-faint)" : "none", cursor: "pointer", display: "flex", gap: "12px", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: `${acc.color}20`, border: `2px solid ${acc.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                      {acc.bank_name} · {cfg.label}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: acc.current_balance >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                      {acc.currency} ${fmt(acc.current_balance)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Movimientos recientes */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Movimientos recientes" : "Recent transactions"}
            </div>
            <button onClick={onAddTransaction}
              style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              {bnk.addTransaction ?? "+ Movimiento manual"}
            </button>
          </div>
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{bnk.noTransactions ?? "Sin movimientos"}</div>
            </div>
          ) : (
            recent.map((tx, i) => {
              const tc = TX_TYPE_CONFIG[tx.type];
              return (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderBottom: i < recent.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", background: `${tc.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "14px" }}>{tc.sign === 1 ? "↑" : "↓"}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.concept}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                      {tx.bank_account?.name} · {new Date(tx.transaction_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                      {tx.is_manual ? "" : ` · ${bnk.autoLinked ?? "Auto"}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: tc.color, fontVariantNumeric: "tabular-nums" }}>
                      {tc.sign === 1 ? "+" : "−"}{tx.currency} ${fmt(tx.amount)}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      Saldo: ${fmt(tx.balance_after)}
                    </div>
                  </div>
                  {!tx.reconciled && !tx.is_manual && (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-warning-text)", flexShrink: 0 }} title="Sin conciliar" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
