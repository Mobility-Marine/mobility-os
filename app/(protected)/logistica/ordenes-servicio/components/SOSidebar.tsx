"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  ServiceOrder,
  SOFilters,
  ServiceOrderType,
} from "../types/service-orders.types";
import {
  SO_TYPE_CONFIG,
  SO_STATUS_CONFIG,
} from "../types/service-orders.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// SO (SERVICE ORDERS) SIDEBAR — Órdenes de servicio virtualizado
// CCP / BOL USA / Carta Aduanal
// ═══════════════════════════════════════════════════════════════════

type Props = {
  orders:      ServiceOrder[];
  totalCount?: number;
  selected:    ServiceOrder | null;
  setSelected: (o: ServiceOrder) => void;
  filters:     SOFilters;
  setFilters:  (f: SOFilters) => void;
  onNew:       () => void;
};

const ITEM_HEIGHT = 92;

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TYPE_OPTIONS: { value: ServiceOrderType | "all"; label: string }[] = [
  { value: "all",           label: "Todas" },
  { value: "ccp_carta",     label: "CCP" },
  { value: "bol_usa",       label: "BOL USA" },
  { value: "carta_aduanal", label: "Carta Aduanal" },
];

export default function SOSidebar({
  orders,
  totalCount,
  selected,
  setSelected,
  filters,
  setFilters,
  onNew,
}: Props) {
  const { t, lang } = useTranslation();
  const tl = (t.logistics as any) ?? {};
  const locale = lang === "en" ? "en-US" : "es-MX";
  const [drawerOpen, setDrawerOpen] = useState(false);

  function getTypeLabel(type: ServiceOrderType): string {
    const k =
      "type" +
      type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    return tl[k] ?? type;
  }

  function getStatusLabel(status: string): string {
    return tl[`status${status.charAt(0).toUpperCase()}${status.slice(1)}SO`] ?? status;
  }

  // ── Grupo único: Tipo ─────────────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "type",
        label: tl.typeLabel ?? "Tipo de orden",
        type: "select",
        value: filters.type,
        onChange: (v) =>
          setFilters({ ...filters, type: v as SOFilters["type"] }),
        options: TYPE_OPTIONS.map((o) => ({
          value: String(o.value),
          label: o.value === "all" ? tl.filterAll ?? o.label : o.label,
        })),
      },
    ],
    [filters, tl, setFilters],
  );

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.type !== "all") {
      const opt = TYPE_OPTIONS.find((o) => o.value === filters.type);
      chips.push({
        id: "type",
        label: `Tipo: ${opt?.label ?? filters.type}`,
        onRemove: () => setFilters({ ...filters, type: "all" }),
      });
    }
    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;
  const clearAll = () => setFilters({ ...filters, type: "all" });

  return (
    <>
      <VirtualSidebar<ServiceOrder>
        title={tl.serviceOrders ?? "Órdenes"}
        count={orders.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tl.searchServiceOrder ?? "Referencia, carrier…",
          hint: "Referencia · carrier · consignee",
        }}
        headerActions={[
          {
            label: tl.newServiceOrder ?? "Nueva orden",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
        ]}
        filterButton={{ activeCount, onOpen: () => setDrawerOpen(true) }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={orders}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(o) => o.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(o, _i, isSelected) => (
          <SOItem
            order={o}
            isSelected={isSelected}
            locale={locale}
            typeLabel={getTypeLabel(o.order_type)}
            statusLabel={getStatusLabel(o.status)}
          />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? tl.noResults ?? "Sin resultados"
              : tl.noServiceOrders ?? "Sin órdenes",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Crea tu primera orden de servicio",
          action:
            activeCount === 0 && !filters.search
              ? { label: tl.newServiceOrder ?? "Nueva orden", onClick: onNew }
              : undefined,
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={tl.filtersTitle ?? "Filtros"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SO ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const SOItem = memo(function SOItem({
  order: o,
  isSelected,
  locale,
  typeLabel,
  statusLabel,
}: {
  order:       ServiceOrder;
  isSelected:  boolean;
  locale:      string;
  typeLabel:   string;
  statusLabel: string;
}) {
  const typeCfg = SO_TYPE_CONFIG[o.order_type];
  const stCfg = SO_STATUS_CONFIG[o.status];
  const ref = (o as any).shipment?.reference ?? o.id.slice(0, 8).toUpperCase();
  const counterparty = o.carrier_name ?? o.consignee_name ?? "—";

  return (
    <div
      style={{
        width:        "100%",
        boxSizing:    "border-box",
        overflow:     "hidden",
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
      {/* ROW 1 — type + status */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "5px",
          minWidth:   0,
          width:      "100%",
        }}
      >
        <span
          style={{
            fontSize:     "9px",
            fontWeight:   700,
            padding:      "1px 5px",
            borderRadius: "var(--radius-full)",
            background:   typeCfg.bg,
            color:        typeCfg.color,
            border:       `1px solid ${typeCfg.border}`,
            flexShrink:   0,
            whiteSpace:   "nowrap",
          }}
        >
          {typeLabel}
        </span>
        <div style={{ flex: 1, minWidth: 0 }} />
        <span
          style={{
            fontSize:     "9px",
            fontWeight:   700,
            padding:      "1px 5px",
            borderRadius: "var(--radius-full)",
            background:   stCfg.bg,
            color:        stCfg.color,
            border:       `1px solid ${stCfg.border}`,
            flexShrink:   0,
            whiteSpace:   "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ROW 2 — referencia */}
      <div
        style={{
          fontSize:     "11px",
          fontWeight:   700,
          color:        "var(--color-text-primary)",
          fontFamily:   "ui-monospace, monospace",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
        }}
      >
        {ref}
      </div>

      {/* ROW 3 — counterparty */}
      <div
        style={{
          fontSize:     "10px",
          color:        "var(--color-text-muted)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
        }}
      >
        {counterparty}
      </div>

      {/* ROW 4 — fecha */}
      <div
        style={{
          fontSize: "10px",
          color:    "var(--color-text-muted)",
        }}
      >
        {new Date(o.created_at).toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.order.id === next.order.id &&
  prev.order.status === next.order.status &&
  prev.order.order_type === next.order.order_type &&
  prev.isSelected === next.isSelected
);