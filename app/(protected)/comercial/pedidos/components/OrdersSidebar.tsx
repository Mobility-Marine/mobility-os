"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  Order,
  OrderFilters,
  OrderStatus,
  OrderPriority,
} from "../types/orders.types";
import {
  ORDER_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../types/orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// ORDERS SIDEBAR — Virtualizado · escalable a 100K+ pedidos
//
// Patrón ERP-grade (Linear / Salesforce):
//   - Acción header: Nuevo pedido (primary)
//   - Search siempre visible (número, cliente)
//   - Botón "Filtros (N)" → FilterDrawer con Status / Prioridad
//   - Chips de filtros activos removibles
//   - VirtualList con react-window
//
// Item compacto (3 rows, ~78px):
//   Row 1: número (mono) · priority (si !=normal) · status badge
//   Row 2: cliente (truncado)
//   Row 3: fecha · entrega · total
// ═══════════════════════════════════════════════════════════════════

type Props = {
  orders:      Order[];        // ya filtrados
  totalCount?: number;         // total sin filtrar
  selected:    Order | null;
  setSelected: (o: Order) => void;
  filters:     OrderFilters;
  setFilters:  (f: OrderFilters) => void;
  onNew:       () => void;
};

const ITEM_HEIGHT = 80;

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Etiquetas para chips activos ────────────────────────────────────
const STATUS_CHIP_LABEL: Record<string, string> = {
  active:         "Activos",
  pending:        "Pendiente",
  confirmed:      "Confirmado",
  in_preparation: "En preparación",
  shipped:        "Enviado",
  delivered:      "Entregado",
  cancelled:      "Cancelado",
};

const PRIORITY_CHIP_LABEL: Record<string, string> = {
  low:    "Baja",
  normal: "Normal",
  high:   "Alta",
  urgent: "Urgente",
};

export default function OrdersSidebar({
  orders,
  totalCount,
  selected,
  setSelected,
  filters,
  setFilters,
  onNew,
}: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";
  const to = (t.orders as any) ?? {};
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "status",
        label: to.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as OrderFilters["status"] }),
        options: [
          { value: "all",            label: to.filterAll       ?? "Todos" },
          { value: "active",         label: STATUS_CHIP_LABEL.active },
          { value: "pending",        label: STATUS_CHIP_LABEL.pending },
          { value: "confirmed",      label: STATUS_CHIP_LABEL.confirmed },
          { value: "in_preparation", label: STATUS_CHIP_LABEL.in_preparation },
          { value: "shipped",        label: STATUS_CHIP_LABEL.shipped },
          { value: "delivered",      label: STATUS_CHIP_LABEL.delivered },
          { value: "cancelled",      label: STATUS_CHIP_LABEL.cancelled },
        ],
      },
      {
        id: "priority",
        label: to.priorityLabel ?? "Prioridad",
        type: "select",
        value: filters.priority,
        onChange: (v) =>
          setFilters({ ...filters, priority: v as OrderFilters["priority"] }),
        options: [
          { value: "all",    label: to.filterAll ?? "Todas" },
          { value: "urgent", label: PRIORITY_CHIP_LABEL.urgent },
          { value: "high",   label: PRIORITY_CHIP_LABEL.high },
          { value: "normal", label: PRIORITY_CHIP_LABEL.normal },
          { value: "low",    label: PRIORITY_CHIP_LABEL.low },
        ],
      },
    ],
    [filters, to, setFilters],
  );

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.status !== "all") {
      chips.push({
        id: "status",
        label: `Estado: ${STATUS_CHIP_LABEL[filters.status] ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: "all" }),
      });
    }
    if (filters.priority !== "all") {
      chips.push({
        id: "priority",
        label: `Prioridad: ${PRIORITY_CHIP_LABEL[filters.priority] ?? filters.priority}`,
        onRemove: () => setFilters({ ...filters, priority: "all" }),
      });
    }
    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;

  const clearAll = () =>
    setFilters({ ...filters, status: "all", priority: "all" });

  return (
    <>
      <VirtualSidebar<Order>
        title={to.title ?? "Pedidos"}
        count={orders.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: to.search ?? "Número, cliente…",
          hint: "Número · cliente",
        }}
        headerActions={[
          {
            label: to.quickOrder ?? "Nuevo pedido",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
        ]}
        filterButton={{
          activeCount,
          onOpen: () => setDrawerOpen(true),
        }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={orders}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(o) => o.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(o, _i, isSelected) => (
          <OrderItem order={o} isSelected={isSelected} locale={locale} t={t} to={to} />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? to.noResults ?? "Sin resultados"
              : to.noOrders ?? "Sin pedidos",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Crea tu primer pedido para empezar",
          action:
            activeCount === 0 && !filters.search
              ? { label: to.quickOrder ?? "Nuevo pedido", onClick: onNew }
              : undefined,
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={to.filtersTitle ?? "Filtros de pedidos"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ORDER ITEM — card compacto (memo para react-window)
// ═══════════════════════════════════════════════════════════════════
const OrderItem = memo(function OrderItem({
  order: o,
  isSelected,
  locale,
  t,
  to,
}: {
  order:      Order;
  isSelected: boolean;
  locale:     string;
  t:          any;
  to:         any;
}) {
  const cfg     = ORDER_STATUS_CONFIG[o.status] ?? ORDER_STATUS_CONFIG.pending;
  const priCfg  = PRIORITY_CONFIG[o.priority];
  const showPri = o.priority !== "normal";

  // Resolver label de status: usa traducción si existe, si no nombre raw
  const statusLabel =
    (() => {
      const key = cfg.labelKey.split(".").pop() ?? "";
      return (to as any)?.[key] ?? o.status.replace(/_/g, " ");
    })();
  const priLabel = (t as any)?.[priCfg.labelKey] ?? o.priority;

  const clientName = (o as any).client?.name ?? "—";

  return (
    <div
      style={{
        // ── ANTI-OVERFLOW ──
        width:        "100%",
        boxSizing:    "border-box",
        overflow:     "hidden",
        // ── visual ──
        padding:      "8px 11px",
        borderRadius: "var(--radius-md)",
        background:   isSelected
          ? "var(--color-bg-active)"
          : "var(--color-bg-subtle)",
        border:       isSelected
          ? "1px solid var(--color-brand-blue)"
          : "1px solid var(--color-border-faint)",
        display:      "flex",
        flexDirection:"column",
        gap:          "3px",
        transition:   "var(--transition-fast)",
        height:       "calc(100% - 5px)",
      }}
    >
      {/* ROW 1 — número + priority + status */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "6px",
          minWidth:   0,
          width:      "100%",
        }}
      >
        <span
          style={{
            fontSize:           "10px",
            fontFamily:         "ui-monospace, monospace",
            fontWeight:         800,
            color:              "var(--color-text-primary)",
            flex:               1,
            minWidth:           0,
            overflow:           "hidden",
            textOverflow:       "ellipsis",
            whiteSpace:         "nowrap",
          }}
        >
          {o.order_number}
        </span>
        {showPri && (
          <span
            style={{
              fontSize:   "9px",
              fontWeight: 700,
              color:      priCfg.color,
              flexShrink: 0,
              textTransform: "uppercase",
            }}
          >
            {priLabel}
          </span>
        )}
        <span
          style={{
            fontSize:      "9px",
            fontWeight:    700,
            padding:       "2px 5px",
            borderRadius:  "var(--radius-full)",
            background:    cfg.bg,
            color:         cfg.color,
            border:        `1px solid ${cfg.border}`,
            flexShrink:    0,
            textTransform: "uppercase",
            whiteSpace:    "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ROW 2 — cliente */}
      <div
        style={{
          fontSize:     "11px",
          color:        "var(--color-text-second)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
        }}
      >
        {clientName}
      </div>

      {/* ROW 3 — fechas + total */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize:   "10px",
          gap:        "8px",
          minWidth:   0,
          width:      "100%",
        }}
      >
        <span
          style={{
            color:        "var(--color-text-muted)",
            flex:         1,
            minWidth:     0,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}
        >
          {formatShortDate(o.created_at, locale)}
          {o.delivery_date &&
            ` · ${to.deliveryShort ?? "Ent"}: ${formatShortDate(o.delivery_date, locale)}`}
        </span>
        <span
          style={{
            fontWeight:         700,
            color:              "var(--color-success-text)",
            fontVariantNumeric: "tabular-nums",
            flexShrink:         0,
            whiteSpace:         "nowrap",
          }}
        >
          {o.currency !== "MXN" && (
            <span style={{ fontSize: "9px", opacity: 0.7, marginRight: "3px" }}>
              {o.currency}
            </span>
          )}
          {formatCompactAmount(Number(o.total ?? 0))}
        </span>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.order.id === next.order.id &&
  prev.order.updated_at === next.order.updated_at &&
  prev.order.status === next.order.status &&
  prev.order.priority === next.order.priority &&
  prev.order.total === next.order.total &&
  prev.isSelected === next.isSelected
);

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
function formatShortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day:   "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function formatCompactAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)        return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}