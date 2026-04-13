"use client";

import type { ClientConnection, ClientStats } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  connections:  ClientConnection[];
  stats?:       ClientStats;
  clientName?:  string;
  loading?:     boolean;
};

const TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; labelKey: string }> = {
  opportunity: {
    color: "var(--color-brand-blue)",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    labelKey: "clients.connectionOpportunity",
  },
  prospect: {
    color: "var(--color-warning-text)",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    labelKey: "clients.connectionProspect",
  },
  order: {
    color: "var(--color-success-text)",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      </svg>
    ),
    labelKey: "clients.connectionOrder",
  },
  invoice: {
    color: "#a78bfa",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    labelKey: "clients.connectionInvoice",
  },
};

export default function ClientConnections({ connections, stats, clientName, loading }: Props) {
  const { t } = useTranslation();

  const statCards = [
    { label: (t.clients as any)?.totalRevenue  ?? "Ingresos totales", value: stats ? `$${(stats.totalRevenue ?? 0).toLocaleString()}` : "—", color: "var(--color-success-text)" },
    { label: (t.clients as any)?.openBalance   ?? "Saldo pendiente",  value: stats ? `$${(stats.openBalance ?? 0).toLocaleString()}`  : "—", color: "var(--color-warning-text)" },
    { label: (t.clients as any)?.opportunities ?? "Oportunidades",    value: stats ? String(stats.opportunities) : "—",                     color: "var(--color-brand-blue)"   },
    { label: (t.clients as any)?.openOrders    ?? "Pedidos abiertos", value: stats ? String(stats.openOrders)    : "—",                     color: "var(--color-info-text)"    },
  ];

  return (
    <div style={{
      gridColumn: "1 / -1",
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "18px",
      display: "flex", flexDirection: "column", gap: "14px",
      height: "100%",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-second)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {(t.clients as any)?.customer360 ?? "Customer 360"} {clientName ? `— ${clientName}` : ""}
          </span>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", flexShrink: 0 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)", padding: "12px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* CONNECTIONS */}
      {loading ? (
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>
      ) : connections.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)",
          color: "var(--color-text-muted)", fontSize: "13px",
        }}>
          {clientName
            ? (t.clients as any)?.noConnections ?? "Sin historial comercial registrado"
            : (t.clients as any)?.workspaceEmpty ?? "Selecciona un cliente"}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", alignContent: "start" }}>
          {connections.map((conn) => {
            const cfg = TYPE_CONFIG[conn.type] ?? TYPE_CONFIG.opportunity;
            const label = (t.clients as any)?.[cfg.labelKey.replace("clients.", "")] ?? conn.type;

            return (
              <div key={conn.id} style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                display: "grid", gap: "4px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conn.label}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {conn.status && <span>{conn.status}</span>}
                  {conn.value && <span style={{ color: "var(--color-success-text)" }}>${Number(conn.value).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
