"use client";

import type { Order, OrderFilters, OrderStatus, OrderPriority } from "../types/orders.types";
import { ORDER_STATUS_CONFIG, PRIORITY_CONFIG } from "../types/orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  orders:      Order[];
  selected:    Order | null;
  setSelected: (o: Order) => void;
  filters:     OrderFilters;
  setFilters:  (f: OrderFilters) => void;
  onNew:       () => void;
};

export default function OrdersSidebar({ orders, selected, setSelected, filters, setFilters, onNew }: Props) {
  const { t, lang } = useTranslation();
  const locale      = lang === "en" ? "en-US" : "es-MX";
  const to          = (t.orders as any) ?? {};

  const STATUS_FILTERS = [
    { value: "all",       label: to.filterAll       ?? "Todos"      },
    { value: "active",    label: to.filterActive    ?? "Activos"    },
    { value: "pending",   label: to.statusPending   ?? "Pendiente"  },
    { value: "delivered", label: to.statusDelivered ?? "Entregados" },
  ];

  function getStatusLabel(s: OrderStatus) {
    const cfg = ORDER_STATUS_CONFIG[s];
    return (t as any)?.[cfg.labelKey] ?? s;
  }

  function getStatusCfg(s: OrderStatus) {
    return ORDER_STATUS_CONFIG[s] ?? ORDER_STATUS_CONFIG.pending;
  }

  function getPriorityLabel(p: OrderPriority) {
    const cfg = PRIORITY_CONFIG[p];
    return (t as any)?.[cfg.labelKey] ?? p;
  }

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
            {to.title ?? "Pedidos"}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {orders.length}
          </span>
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder={to.search ?? "Número, cliente…"}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
              fontSize: "12px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* FILTROS STATUS */}
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilters({ ...filters, status: f.value as any })} style={{
              height: "22px", padding: "0 7px", borderRadius: "var(--radius-full)",
              background: filters.status === f.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              border: `1px solid ${filters.status === f.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
              color: filters.status === f.value ? "#fff" : "var(--color-text-muted)",
              fontSize: "10px", fontWeight: filters.status === f.value ? 700 : 500, cursor: "pointer",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "5px", alignContent: "start" }}>
        {orders.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {to.noOrders ?? "Sin pedidos"}
          </div>
        ) : orders.map((o) => {
          const isSelected = selected?.id === o.id;
          const cfg        = getStatusCfg(o.status);
          const statusLabel = to[`status${o.status.charAt(0).toUpperCase() + o.status.slice(1).replace("_p","P").replace("_preparation","Preparation")}`]
            ?? o.status.replace("_", " ");
          const priCfg     = PRIORITY_CONFIG[o.priority];

          return (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              style={{
                padding: "10px 12px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "4px",
                transition: "var(--transition-fast)",
              }}
            >
              {/* ROW 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 800, color: "var(--color-text-primary)", flex: 1 }}>
                  {o.order_number}
                </span>
                {o.priority !== "normal" && (
                  <span style={{ fontSize: "9px", fontWeight: 700, color: priCfg.color, flexShrink: 0 }}>
                    {o.priority.toUpperCase()}
                  </span>
                )}
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "2px 5px",
                  borderRadius: "var(--radius-full)", background: cfg.bg,
                  color: cfg.color, border: `1px solid ${cfg.border}`,
                  flexShrink: 0, textTransform: "uppercase",
                }}>
                  {statusLabel}
                </span>
              </div>

              {/* ROW 2 */}
              <div style={{ fontSize: "11px", color: "var(--color-text-second)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.client?.name ?? "—"}
              </div>

              {/* ROW 3 */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {new Date(o.created_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                  {o.delivery_date && ` · Entrega: ${new Date(o.delivery_date).toLocaleDateString(locale, { day: "numeric", month: "short" })}`}
                </span>
                <span style={{ fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                  {o.currency} ${Number(o.total ?? 0).toLocaleString(locale, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
