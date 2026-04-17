"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CrmAccount } from "../types/crm.types";
import { LIFECYCLE_CONFIG } from "../types/crm.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  search:      string;
  setSearch:   (v: string) => void;
  accounts:    CrmAccount[];
  selected:    CrmAccount | null;
  setSelected: (a: CrmAccount) => void;
};

type Filter = "all" | "customer" | "strategic" | "lead";

export default function AccountsSidebar({
  search, setSearch, accounts, selected, setSelected,
}: Props) {
  const { t }  = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const customers = accounts.filter((a) => a.lifecycle_stage === "customer" || a.is_customer);
  const strategic = accounts.filter((a) => a.strategic_account);
  const leads     = accounts.filter((a) => a.lifecycle_stage === "lead" || a.lifecycle_stage === "opportunity");

  const kpis = [
    { label: (t.crm as any)?.totalAccounts  ?? "Total",        value: accounts.length,  color: "var(--color-brand-blue)"   },
    { label: (t.crm as any)?.customers      ?? "Clientes",     value: customers.length, color: "var(--color-success-text)" },
    { label: (t.crm as any)?.strategicShort ?? "Estratégicas", value: strategic.length, color: "#a78bfa"                   },
    { label: (t.crm as any)?.leadsShort     ?? "Leads",        value: leads.length,     color: "var(--color-warning-text)" },
  ];

  const filteredByStage = accounts.filter((a) => {
    if (filter === "all")       return true;
    if (filter === "strategic") return !!a.strategic_account;
    if (filter === "customer")  return a.lifecycle_stage === "customer" || !!a.is_customer;
    if (filter === "lead")      return a.lifecycle_stage === "lead" || a.lifecycle_stage === "opportunity";
    return true;
  });

  const FILTER_LABELS: Record<Filter, string> = {
    all:       (t.crm as any)?.filterAll       ?? "Todos",
    customer:  (t.crm as any)?.filterCustomer  ?? "Clientes",
    strategic: (t.crm as any)?.filterStrategic ?? "Estratégicos",
    lead:      (t.crm as any)?.filterLead      ?? "Leads",
  };

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px",
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

        {/* INFO — ir a Clientes */}
        <div
          onClick={() => router.push("/comercial/clientes")}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: "var(--radius-md)",
            background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
            fontSize: "11px", color: "var(--color-info-text)", lineHeight: 1.5,
            marginBottom: "10px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            boxSizing: "border-box",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          <span>
            <strong>{(t.crm as any)?.accountsFromClients ?? "Ir a Clientes"}</strong>
            {" — "}{(t.crm as any)?.accountsFromClientsDesc ?? "las cuentas se generan al crear un cliente."}
          </span>
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
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

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0, flexWrap: "wrap" }}>
        {(["all", "customer", "strategic", "lead"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            height: "24px", padding: "0 8px", borderRadius: "var(--radius-full)",
            background: filter === f ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
            border: `1px solid ${filter === f ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
            color: filter === f ? "#fff" : "var(--color-text-muted)",
            fontSize: "10px", fontWeight: filter === f ? 700 : 500,
            cursor: "pointer", transition: "var(--transition-fast)",
          }}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, display: "grid", gap: "6px", alignContent: "start" }}>
        {filteredByStage.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {(t.crm as any)?.noAccounts ?? "Sin cuentas registradas"}
          </div>
        ) : filteredByStage.map((a) => {
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
                padding: "10px 12px", borderRadius: "var(--radius-md)",
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
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.3 }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {a.industry ?? a.city ?? "—"}
                  </div>
                </div>
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "2px 5px",
                  borderRadius: "var(--radius-full)", background: cfg.bg,
                  color: cfg.color, border: `1px solid ${cfg.border}`,
                  flexShrink: 0, textTransform: "uppercase",
                }}>
                  {stageLabel}
                </span>
              </div>

              {/* BADGES */}
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {a.strategic_account && (
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                    ★ {(t.crm as any)?.strategic ?? "Estratégica"}
                  </span>
                )}
                {a.client?.rfc && (
                  <span style={{ fontSize: "9px", color: "var(--color-text-muted)", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)" }}>
                    {a.client.rfc}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
