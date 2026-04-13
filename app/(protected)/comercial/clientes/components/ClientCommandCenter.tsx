"use client";

import type { Client } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { hasCompleteProfile } from "../services/clients.normalization";

type Props = { clients: Client[]; onSelect: (c: Client) => void; };

export default function ClientCommandCenter({ clients, onSelect }: Props) {
  const { t } = useTranslation();

  const active    = clients.filter((c) => c.is_active);
  const customers = clients.filter((c) => c.is_customer && c.is_active);
  const suppliers = clients.filter((c) => c.is_supplier && c.is_active);
  const both      = clients.filter((c) => c.is_customer && c.is_supplier && c.is_active);
  const incomplete = active.filter((c) => !hasCompleteProfile(c));

  const cards = [
    {
      key:    "customers",
      label:  (t.clients as any)?.customers ?? "Clientes",
      hint:   (t.clients as any)?.customersHint ?? "Compradores activos",
      value:  customers.length,
      color:  "var(--color-brand-blue)",
      bg:     "var(--color-info-bg)",
      border: "var(--color-info-border)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      first: customers[0],
    },
    {
      key:    "suppliers",
      label:  (t.clients as any)?.suppliers ?? "Proveedores",
      hint:   (t.clients as any)?.suppliersHint ?? "Proveedores activos",
      value:  suppliers.length,
      color:  "var(--color-success-text)",
      bg:     "var(--color-success-bg)",
      border: "var(--color-success-border)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
      first: suppliers[0],
    },
    {
      key:    "both",
      label:  (t.clients as any)?.both ?? "Ambos roles",
      hint:   (t.clients as any)?.bothHint ?? "Cliente y proveedor",
      value:  both.length,
      color:  "#a78bfa",
      bg:     "rgba(167,139,250,0.1)",
      border: "rgba(167,139,250,0.3)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      ),
      first: both[0],
    },
    {
      key:    "incomplete",
      label:  (t.clients as any)?.incomplete ?? "Perfil incompleto",
      hint:   (t.clients as any)?.incompleteHint ?? "Faltan datos clave",
      value:  incomplete.length,
      color:  incomplete.length > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)",
      bg:     incomplete.length > 0 ? "var(--color-warning-bg)" : "var(--color-bg-base)",
      border: incomplete.length > 0 ? "var(--color-warning-border)" : "var(--color-border-faint)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      first: incomplete[0],
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.key}
          onClick={() => card.first && onSelect(card.first)}
          style={{
            background:   card.value > 0 ? card.bg   : "var(--color-bg-base)",
            border:       `1px solid ${card.value > 0 ? card.border : "var(--color-border-faint)"}`,
            borderRadius: "var(--radius-lg)", padding: "16px",
            cursor:       card.first ? "pointer" : "default",
            transition:   "var(--transition-fast)", display: "grid", gap: "8px",
          }}
          onMouseEnter={(e) => { if (card.first) (e.currentTarget as HTMLDivElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: card.value > 0 ? card.color : "var(--color-text-muted)" }}>{card.icon}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: card.value > 0 ? card.color : "var(--color-text-muted)" }}>{card.label}</span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: card.value > 0 ? card.color : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {card.value}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{card.hint}</div>
        </div>
      ))}
    </>
  );
}
