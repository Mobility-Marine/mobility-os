"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  Shipment,
  ShipmentFilters,
  ShipmentServiceType,
  ShipmentStatus,
} from "../types/shipments.types";
import {
  SHIPMENT_STATUS_CONFIG,
  SERVICE_TYPE_CONFIG,
  SHIPMENT_SERVICE_TYPES,
} from "../types/shipments.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// SHIPMENTS SIDEBAR — Virtualizado · escalable a 100K+ embarques
//
// Patrón ERP-grade (Linear / Salesforce):
//   - Acción header: Nuevo servicio (primary)
//   - Search siempre visible (referencia, cliente, ruta)
//   - Botón "Filtros (N)" → drawer con Status (8) + Tipo de servicio (10)
//   - Chips removibles
//   - VirtualList con react-window
//
// Item compacto (4 rows, ~110px):
//   Row 1: referencia (mono color por tipo) · status badge
//   Row 2: cliente (truncado)
//   Row 3: ruta (origen → destino, truncado)
//   Row 4: fecha · totales multi-moneda inline
// ═══════════════════════════════════════════════════════════════════

type Props = {
  shipments:   Shipment[];     // ya filtrados
  totalCount?: number;          // total sin filtrar
  selected:    Shipment | null;
  setSelected: (s: Shipment) => void;
  filters:     ShipmentFilters;
  setFilters:  (f: ShipmentFilters) => void;
  onNew:       () => void;
};

const ITEM_HEIGHT = 110;

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Totales multi-moneda — específico de Shipment ───────────────────
// (Distinto a computeTotalsByCurrency de Cotizaciones porque shipments
//  pre-calcula totals_by_currency en el service)
function getShipmentTotals(s: Shipment): Record<string, number> {
  if (s.totals_by_currency) {
    const result: Record<string, number> = {};
    for (const [cur, vals] of Object.entries(s.totals_by_currency)) {
      if (vals.total > 0) result[cur] = vals.total;
    }
    if (Object.keys(result).length > 0) return result;
  }
  const services = s.services ?? [];
  if (services.length > 0) {
    const totals: Record<string, number> = {};
    for (const svc of services) {
      const cur = svc.currency ?? "USD";
      const price = Number(svc.price ?? 0);
      const tax = price * 0.16;
      totals[cur] = (totals[cur] ?? 0) + price + tax;
    }
    if (Object.keys(totals).length > 0) return totals;
  }
  return { [s.currency ?? "USD"]: s.total ?? 0 };
}

export default function ShipmentsSidebar({
  shipments,
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

  // ── Helpers de label (con i18n) ───────────────────────────────────
  const getStatusLabel = (s: ShipmentStatus): string => {
    const key = `status${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[key] ?? s;
  };

  const getServiceLabel = (s: ShipmentServiceType): string => {
    const key = `service${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
    return tl[key] ?? s;
  };

  // ── Status posibles para el filtro (todos + active virtual) ───────
  const STATUS_OPTIONS: { value: ShipmentFilters["status"]; label: string }[] = [
    { value: "all",              label: tl.filterAll ?? "Todos" },
    { value: "active",           label: tl.filterActive ?? "Activos" },
    { value: "draft",            label: getStatusLabel("draft") },
    { value: "coordinating",     label: getStatusLabel("coordinating") },
    { value: "pickup_scheduled", label: getStatusLabel("pickup_scheduled") },
    { value: "in_transit",       label: getStatusLabel("in_transit") },
    { value: "at_destination",   label: getStatusLabel("at_destination") },
    { value: "delivered",        label: getStatusLabel("delivered") },
    { value: "invoiced",         label: getStatusLabel("invoiced") },
    { value: "cancelled",        label: getStatusLabel("cancelled") },
  ];

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "status",
        label: tl.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as ShipmentFilters["status"] }),
        options: STATUS_OPTIONS.map((o) => ({
          value: String(o.value),
          label: o.label,
        })),
      },
      {
        id: "service_type",
        label: tl.serviceTypeLabel ?? "Tipo de servicio",
        type: "select",
        value: filters.service_type,
        onChange: (v) =>
          setFilters({
            ...filters,
            service_type: v as ShipmentFilters["service_type"],
          }),
        options: [
          { value: "all", label: tl.filterAll ?? "Todos" },
          ...SHIPMENT_SERVICE_TYPES.map((type) => ({
            value: type,
            label: getServiceLabel(type),
          })),
        ],
      },
    ],
    [filters, tl, setFilters, STATUS_OPTIONS],
  );

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.status !== "all") {
      const opt = STATUS_OPTIONS.find((o) => o.value === filters.status);
      chips.push({
        id: "status",
        label: `Estado: ${opt?.label ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: "all" }),
      });
    }
    if (filters.service_type !== "all") {
      chips.push({
        id: "service_type",
        label: `Tipo: ${getServiceLabel(filters.service_type as ShipmentServiceType)}`,
        onRemove: () => setFilters({ ...filters, service_type: "all" }),
      });
    }
    return chips;
  }, [filters, setFilters, STATUS_OPTIONS]);

  const activeCount = activeChips.length;

  const clearAll = () =>
    setFilters({ ...filters, status: "all", service_type: "all" });

  return (
    <>
      <VirtualSidebar<Shipment>
        title={tl.shipments ?? "Servicios"}
        count={shipments.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tl.searchShipment ?? "Referencia, cliente, ruta…",
          hint: "Referencia · cliente · ruta",
        }}
        headerActions={[
          {
            label: tl.newShipment ?? "Nuevo servicio",
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
        items={shipments}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(s) => s.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(s, _i, isSelected) => (
          <ShipmentItem
            shipment={s}
            isSelected={isSelected}
            locale={locale}
            getStatusLabel={getStatusLabel}
          />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? tl.noResults ?? "Sin resultados"
              : tl.noShipments ?? "Sin servicios",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Crea tu primer servicio para empezar",
          action:
            activeCount === 0 && !filters.search
              ? { label: tl.newShipment ?? "Nuevo servicio", onClick: onNew }
              : undefined,
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={tl.filtersTitle ?? "Filtros de servicios"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHIPMENT ITEM — card compacto (memo para react-window)
// ═══════════════════════════════════════════════════════════════════
const ShipmentItem = memo(function ShipmentItem({
  shipment: s,
  isSelected,
  locale,
  getStatusLabel,
}: {
  shipment:       Shipment;
  isSelected:     boolean;
  locale:         string;
  getStatusLabel: (s: ShipmentStatus) => string;
}) {
  const stCfg = SHIPMENT_STATUS_CONFIG[s.status];
  const svcCfg = SERVICE_TYPE_CONFIG[s.service_type];
  const totals = getShipmentTotals(s);
  const entries = Object.entries(totals).filter(([, v]) => v > 0);
  const route = [s.origin, s.destination].filter(Boolean).join(" → ") || "—";
  const clientName = (s as any).client?.name ?? "—";

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
      {/* ROW 1 — referencia + status */}
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
            color:              svcCfg.color,
            flex:               1,
            minWidth:           0,
            overflow:           "hidden",
            textOverflow:       "ellipsis",
            whiteSpace:         "nowrap",
          }}
        >
          {s.reference}
        </span>
        <span
          style={{
            fontSize:      "9px",
            fontWeight:    700,
            padding:       "1px 5px",
            borderRadius:  "var(--radius-full)",
            background:    stCfg.bg,
            color:         stCfg.color,
            border:        `1px solid ${stCfg.border}`,
            textTransform: "uppercase",
            flexShrink:    0,
            whiteSpace:    "nowrap",
          }}
        >
          {getStatusLabel(s.status)}
        </span>
      </div>

      {/* ROW 2 — cliente */}
      <div
        style={{
          fontSize:     "11px",
          fontWeight:   600,
          color:        "var(--color-text-primary)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
        }}
      >
        {clientName}
      </div>

      {/* ROW 3 — ruta */}
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
        {route}
      </div>

      {/* ROW 4 — fecha + totales multi-moneda inline */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
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
          {formatShortDate(s.created_at, locale)}
        </span>
        <div
          style={{
            display:    "flex",
            gap:        "6px",
            alignItems: "center",
            flexShrink: 0,
            maxWidth:   "65%",
            overflow:   "hidden",
          }}
        >
          {entries.length > 0 ? (
            entries.map(([cur, val]) => (
              <span
                key={cur}
                style={{
                  fontWeight:         700,
                  color:              "var(--color-success-text)",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace:         "nowrap",
                  flexShrink:         0,
                }}
              >
                {cur !== "MXN" && (
                  <span
                    style={{
                      fontSize:    "9px",
                      opacity:     0.7,
                      marginRight: "3px",
                    }}
                  >
                    {cur}
                  </span>
                )}
                {formatCompactAmount(val)}
              </span>
            ))
          ) : (
            <span style={{ color: "var(--color-text-muted)" }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.shipment.id === next.shipment.id &&
  prev.shipment.updated_at === next.shipment.updated_at &&
  prev.shipment.status === next.shipment.status &&
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