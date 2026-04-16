"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BankAccount, BankTransaction, BankFilters } from "../types/bancos.types";
import { TX_TYPE_CONFIG, TX_CATEGORY_CONFIG, DEFAULT_BANK_FILTERS } from "../types/bancos.types";

type Props = {
  transactions:  BankTransaction[];
  accounts:      BankAccount[];
  loading:       boolean;
  filters:       BankFilters;
  onFilter:      (f: Partial<BankFilters>) => void;
  onReconcile:   (id: string) => void;
  onUnreconcile: (id: string) => void;
  onDelete:      (id: string) => void;
  onAdd:         () => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const SELECT: React.CSSProperties = { height: "32px", padding: "0 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", cursor: "pointer" };

export default function BancosMovimientos({ transactions, accounts, loading, filters, onFilter, onReconcile, onUnreconcile, onDelete, onAdd }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const bnk = (t as any).bancos ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={filters.search}
          onChange={e => onFilter({ search: e.target.value })}
          placeholder={es ? "Buscar concepto, referencia…" : "Search concept, reference…"}
          style={{ height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "12px", outline: "none", width: "200px" }}
        />
        <select value={filters.account_id} onChange={e => onFilter({ account_id: e.target.value })} style={SELECT}>
          <option value="all">{es ? "Todas las cuentas" : "All accounts"}</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filters.type} onChange={e => onFilter({ type: e.target.value as any })} style={SELECT}>
          <option value="all">{es ? "Todos los tipos" : "All types"}</option>
          {Object.entries(TX_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filters.reconciled} onChange={e => onFilter({ reconciled: e.target.value as any })} style={SELECT}>
          <option value="all">{es ? "Todos" : "All"}</option>
          <option value="yes">{bnk.reconciled   ?? "Conciliado"}</option>
          <option value="no"> {bnk.unreconciled ?? "Sin conciliar"}</option>
        </select>
        <input type="date" value={filters.from} onChange={e => onFilter({ from: e.target.value })} style={{ ...SELECT, width: "130px" }} />
        <input type="date" value={filters.to}   onChange={e => onFilter({ to:   e.target.value })} style={{ ...SELECT, width: "130px" }} />
        {(filters.search || filters.type !== "all" || filters.account_id !== "all" || filters.reconciled !== "all") && (
          <button onClick={() => onFilter(DEFAULT_BANK_FILTERS)} style={{ height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
            ✕ {es ? "Limpiar" : "Clear"}
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{transactions.length} {es ? "movimientos" : "transactions"}</span>
          <button onClick={onAdd} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
            {bnk.addTransaction ?? "+ Movimiento"}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 130px 110px 90px 80px", padding: "8px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>Fecha</span>
          <span>Concepto</span>
          <span>Cuenta</span>
          <span>Tipo</span>
          <span style={{ textAlign: "right" }}>Monto</span>
          <span style={{ textAlign: "right" }}>Saldo tras mov.</span>
          <span style={{ textAlign: "center" }}>Estado</span>
          <span style={{ textAlign: "center" }}>Acción</span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{bnk.noTransactions ?? "Sin movimientos"}</div>
          </div>
        ) : transactions.map((tx, i) => {
          const tc = TX_TYPE_CONFIG[tx.type];
          return (
            <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 130px 110px 90px 80px", padding: "10px 16px", borderBottom: i < transactions.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {new Date(tx.transaction_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.concept}</div>
                {tx.reference && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{tx.reference}</div>}
                {!tx.is_manual && <div style={{ fontSize: "9px", color: "var(--color-brand-blue)", fontWeight: 600 }}>AUTO</div>}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tx.bank_account?.name ?? "—"}
              </div>
              <div>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: `${tc.color}15`, color: tc.color }}>
                  {tc.label}
                </span>
              </div>
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 800, color: tc.color, fontVariantNumeric: "tabular-nums" }}>
                {tc.sign === 1 ? "+" : "−"}{tx.currency} ${fmt(tx.amount)}
              </div>
              <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                ${fmt(tx.balance_after)}
              </div>
              <div style={{ textAlign: "center" }}>
                {tx.reconciled ? (
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)" }}>
                    ✓ {bnk.reconciled ?? "Conciliado"}
                  </span>
                ) : (
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", color: "var(--color-warning-text)" }}>
                    {bnk.unreconciled ?? "Pendiente"}
                  </span>
                )}
              </div>
              <div style={{ textAlign: "center", display: "flex", gap: "4px", justifyContent: "center" }}>
                {!tx.reconciled ? (
                  <button onClick={() => onReconcile(tx.id)}
                    style={{ height: "22px", padding: "0 6px", borderRadius: "var(--radius-sm)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>
                    ✓
                  </button>
                ) : (
                  <button onClick={() => onUnreconcile(tx.id)}
                    style={{ height: "22px", padding: "0 6px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "9px", cursor: "pointer" }}>
                    ↩
                  </button>
                )}
                {tx.is_manual && (
                  <button onClick={() => onDelete(tx.id)}
                    style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
