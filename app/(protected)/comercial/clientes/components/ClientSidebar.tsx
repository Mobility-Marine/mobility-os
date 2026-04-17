"use client";

import type { Client } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getClientRole, getClientInitials, hasCompleteProfile } from "../services/clients.normalization";

type Props = {
  search:      string;
  setSearch:   (v: string) => void;
  clients:     Client[];
  selected:    Client | null;
  setSelected: (c: Client) => void;
  onOpenCreate:() => void;
};

const ROLE_BADGE: Record<string, { color: string; bg: string; border: string }> = {
  customer: { color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    border: "var(--color-info-border)"    },
  supplier: { color: "var(--color-success-text)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
  both:     { color: "#a78bfa",                   bg: "rgba(167,139,250,0.1)",   border: "rgba(167,139,250,0.3)"       },
  none:     { color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  border: "var(--color-border-faint)"   },
};

export default function ClientSidebar({
  search, setSearch, clients, selected, setSelected, onOpenCreate,
}: Props) {
  const { t } = useTranslation();

  const active    = clients.filter((c) => c.is_active).length;
  const customers = clients.filter((c) => c.is_customer).length;
  const both      = clients.filter((c) => c.is_customer && c.is_supplier).length;
  const withBalance = clients.filter((c) => (c.stats?.openBalance ?? 0) > 0).length;
  // Ya cargado desde el controller via load()

  const kpis = [
    { label: (t.clients as any)?.active    ?? "Activos",  value: active,         color: "var(--color-brand-blue)"  },
    { label: (t.clients as any)?.customersS ?? "Clientes", value: customers,      color: "var(--color-info-text)"  },
    { label: (t.clients as any)?.withBalance ?? "Con saldo", value: withBalance, color: withBalance > 0 ? "var(--color-warning-text)" : "var(--color-success-text)" },
    { label: (t.clients as any)?.total     ?? "Total",    value: clients.length, color: "var(--color-text-second)"},
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
            {(t.clients as any)?.title ?? "Clientes"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {clients.length}
          </span>
        </div>
        <button onClick={onOpenCreate} style={{
          width: "100%", height: "36px", borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)", color: "#fff", border: "none",
          fontSize: "13px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          marginBottom: "10px",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {(t.clients as any)?.newClient ?? "Nuevo cliente"}
        </button>
        {/* SEARCH */}
        <div style={{ position: "relative" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={(t.clients as any)?.search ?? "Buscar cliente…"}
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", flexShrink: 0, overflow: "hidden" }}>
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
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, display: "grid", gap: "6px", alignContent: "start" }}>
        {clients.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {(t.clients as any)?.noClients ?? "Sin clientes registrados"}
          </div>
        ) : clients.map((c) => {
          const isSelected = selected?.id === c.id;
          const role       = getClientRole(c);
          const badge      = ROLE_BADGE[role];
          const initials   = getClientInitials(c);
          const complete   = hasCompleteProfile(c);

          return (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: "11px 12px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "5px",
                transition: "var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* AVATAR */}
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: badge.bg, border: `1px solid ${badge.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 800, color: badge.color,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.rfc ?? c.email ?? c.city ?? "—"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", flexShrink: 0 }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, textTransform: "uppercase" }}>
                    {(t.clients as any)?.[role] ?? role}
                  </span>
                  {!complete && (
                    <span style={{ fontSize: "9px", color: "var(--color-warning-text)" }}>
                      {(t.clients as any)?.incompleteShort ?? "Incompleto"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
