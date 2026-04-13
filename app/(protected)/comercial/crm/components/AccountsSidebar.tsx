"use client";

import type { CrmAccount } from "../types/crm.types";
import { LIFECYCLE_CONFIG } from "../types/crm.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  search:      string;
  setSearch:   (v: string) => void;
  accounts:    CrmAccount[];
  selected:    CrmAccount | null;
  setSelected: (a: CrmAccount) => void;
  onNewAccount:() => void;
};

export default function AccountsSidebar({
  search, setSearch, accounts, selected, setSelected, onNewAccount,
}: Props) {
  const { t } = useTranslation();

  const customers  = accounts.filter((a) => a.lifecycle_stage === "customer" || a.is_customer);
  const strategic  = accounts.filter((a) => a.strategic_account);
  const leads      = accounts.filter((a) => a.lifecycle_stage === "lead" || a.lifecycle_stage === "opportunity");

  const kpis = [
    { label: (t.crm as any)?.totalAccounts   ?? "Total",        value: accounts.length,  color: "var(--color-brand-blue)"   },
    { label: (t.crm as any)?.customers       ?? "Clientes",     value: customers.length, color: "var(--color-success-text)" },
    { label: (t.crm as any)?.strategicShort  ?? "Estratégicas", value: strategic.length, color: "#a78bfa"                   },
    { label: (t.crm as any)?.leadsShort      ?? "Leads",        value: leads.length,     color: "var(--color-warning-text)" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {(t.crm as any)?.title ?? "CRM"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {accounts.length}
          </span>
        </div>
        <button onClick={onNewAccount} style={{
          width: "100%", height: "36px", borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)", color: "#fff", border: "none",
          fontSize: "13px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          marginBottom: "10px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {(t.crm as any)?.newAccount ?? "Nueva cuenta"}
        </button>
        <div style={{ position: "relative" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={(t.crm as any)?.search ?? "Buscar cuenta…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "34px", paddingLeft: "30px", paddingRight: "12px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
              fontSize: "13px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* KPIS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", flexShrink: 0 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)", padding: "8px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{k.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "6px", alignContent: "start" }}>
        {accounts.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {(t.crm as any)?.noAccounts ?? "Sin cuentas registradas"}
          </div>
        ) : accounts.map((a) => {
          const isSelected = selected?.id === a.id;
          const stage      = (a.lifecycle_stage ?? "customer") as any;
          const cfg        = LIFECYCLE_CONFIG[stage] ?? LIFECYCLE_CONFIG.customer;
          const stageLabel = (t.crm as any)?.[cfg.labelKey.replace("crm.", "")] ?? stage;
          const initials   = a.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

          return (
            <div
              key={a.id}
              onClick={() => setSelected(a)}
              style={{
                padding: "11px 12px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "5px",
                transition: "var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 800, color: cfg.color,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {a.industry ?? a.city ?? "—"}
                  </div>
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "var(--radius-full)", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, textTransform: "uppercase" }}>
                  {stageLabel}
                </span>
              </div>
              {a.strategic_account && (
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#a78bfa", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {(t.crm as any)?.strategic ?? "Estratégica"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
