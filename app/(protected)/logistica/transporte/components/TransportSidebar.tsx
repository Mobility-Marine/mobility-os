"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  TransportUnit,
  UnitFilters,
  UnitStatus,
} from "../types/transport.types";
import {
  UNIT_STATUS_CONFIG,
  UNIT_TYPE_LABELS,
  getUnitAlerts,
} from "../types/transport.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// TRANSPORT SIDEBAR — Unidades de transporte virtualizado
// Patrón ERP: VirtualSidebar + FilterDrawer + memo item
// ═══════════════════════════════════════════════════════════════════

type Props = {
  units:       TransportUnit[];
  totalCount?: number;
  selected:    TransportUnit | null;
  setSelected: (u: TransportUnit) => void;
  filters:     UnitFilters;
  setFilters:  (f: UnitFilters) => void;
  onNew:       () => void;
};

const ITEM_HEIGHT = 92;

const STATUS_DOT: Record<UnitStatus, string> = {
  active:      "var(--color-success-text)",
  maintenance: "#d97706",
  inactive:    "var(--color-text-muted)",
};

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Icono de unidad según tipo
function UnitIcon({ type }: { type: string }) {
  const isTank = type === "pipa";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      {isTank ? (
        <>
          <ellipse cx="12" cy="10" rx="9" ry="5" />
          <line x1="3" y1="10" x2="3" y2="16" />
          <line x1="21" y1="10" x2="21" y2="16" />
          <path d="M3 16c0 2.8 4 5 9 5s9-2.2 9-5" />
        </>
      ) : (
        <>
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h5l3 5v5h-8V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </>
      )}
    </svg>
  );
}

const STATUS_OPTIONS: { v: UnitStatus | "all"; l: string }[] = [
  { v: "all",         l: "Todas" },
  { v: "active",      l: "Activas" },
  { v: "maintenance", l: "Mantenimiento" },
  { v: "inactive",    l: "Inactivas" },
];

export default function TransportSidebar({
  units,
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

  function getTypeLabel(type: string): string {
    const key = UNIT_TYPE_LABELS[type as keyof typeof UNIT_TYPE_LABELS];
    if (!key) return type;
    return tl[key.replace("logistics.", "")] ?? type;
  }

  function getStatusLabel(status: UnitStatus): string {
    const cfg = UNIT_STATUS_CONFIG[status];
    return tl[cfg.labelKey.replace("logistics.", "")] ?? status;
  }

  // ── Tipos de unidad disponibles (para filtro tipo en drawer) ──────
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const u of units) {
      if (u.unit_type) set.add(u.unit_type);
    }
    return Array.from(set).sort().map((v) => ({
      value: v,
      label: getTypeLabel(v),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, tl]);

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(() => {
    const g: FilterGroup[] = [
      {
        id: "status",
        label: tl.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as UnitFilters["status"] }),
        options: STATUS_OPTIONS.map((o) => ({
          value: String(o.v),
          label: o.v === "all" ? tl.filterAll ?? o.l : o.l,
        })),
      },
    ];

    if (typeOptions.length > 0) {
      g.push({
        id: "unit_type",
        label: tl.unitTypeLabel ?? "Tipo de unidad",
        type: "select",
        value: (filters as any).unit_type ?? "all",
        onChange: (v) =>
          setFilters({ ...filters, unit_type: v as any }),
        options: [
          { value: "all", label: tl.filterAll ?? "Todas" },
          ...typeOptions,
        ],
      });
    }

    return g;
  }, [filters, tl, typeOptions, setFilters]);

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.status !== "all") {
      const opt = STATUS_OPTIONS.find((o) => o.v === filters.status);
      chips.push({
        id: "status",
        label: `Estado: ${opt?.l ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: "all" }),
      });
    }
    if ((filters as any).unit_type && (filters as any).unit_type !== "all") {
      chips.push({
        id: "unit_type",
        label: `Tipo: ${getTypeLabel((filters as any).unit_type)}`,
        onRemove: () => setFilters({ ...filters, unit_type: "all" } as any),
      });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, tl]);

  const activeCount = activeChips.length;
  const clearAll = () =>
    setFilters({ ...filters, status: "all", unit_type: "all" } as any);

  return (
    <>
      <VirtualSidebar<TransportUnit>
        title={tl.transport ?? "Transporte"}
        count={units.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tl.searchUnit ?? "Nombre, placas, marca…",
          hint: "Nombre · placas · marca",
        }}
        headerActions={[
          {
            label: tl.newUnit ?? "Nueva unidad",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
        ]}
        filterButton={{ activeCount, onOpen: () => setDrawerOpen(true) }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={units}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(u) => u.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(u, _i, isSelected) => (
          <UnitItem
            unit={u}
            isSelected={isSelected}
            typeLabel={getTypeLabel(u.unit_type)}
          />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? tl.noResults ?? "Sin resultados"
              : tl.noUnits ?? "Sin unidades",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Registra tu primera unidad para empezar",
          action:
            activeCount === 0 && !filters.search
              ? { label: tl.newUnit ?? "Nueva unidad", onClick: onNew }
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
// UNIT ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const UnitItem = memo(function UnitItem({
  unit: u,
  isSelected,
  typeLabel,
}: {
  unit:       TransportUnit;
  isSelected: boolean;
  typeLabel:  string;
}) {
  const alerts = getUnitAlerts(u);

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
      {/* ROW 1 — icono + nombre + status dot */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "6px",
          minWidth:   0,
          width:      "100%",
        }}
      >
        <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
          <UnitIcon type={u.unit_type} />
        </span>
        <span
          style={{
            fontSize:     "12px",
            fontWeight:   700,
            color:        "var(--color-text-primary)",
            flex:         1,
            minWidth:     0,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}
        >
          {u.name}
        </span>
        <span
          style={{
            width:        "7px",
            height:       "7px",
            borderRadius: "50%",
            background:   STATUS_DOT[u.status],
            flexShrink:   0,
          }}
        />
      </div>

      {/* ROW 2 — tipo + placas */}
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
        {typeLabel}
        {u.plates && ` · ${u.plates}`}
      </div>

      {/* ROW 3 — marca/modelo/año */}
      {u.brand && (
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
          {u.brand}
          {u.model ? ` ${u.model}` : ""}
          {u.year ? ` ${u.year}` : ""}
        </div>
      )}

      {/* ROW 4 — alertas (vencimientos) */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", gap: "3px", flexWrap: "nowrap", overflow: "hidden" }}>
          {alerts.slice(0, 3).map((a) => (
            <span
              key={a.field}
              style={{
                fontSize:     "9px",
                fontWeight:   700,
                padding:      "1px 4px",
                borderRadius: "3px",
                background:   a.severity === "expired"
                  ? "var(--color-danger-bg)"
                  : "var(--color-warning-bg)",
                color:        a.severity === "expired"
                  ? "var(--color-danger-text)"
                  : "var(--color-warning-text)",
                border:       `1px solid ${a.severity === "expired" ? "var(--color-danger-border)" : "var(--color-warning-border)"}`,
                whiteSpace:   "nowrap",
                flexShrink:   0,
              }}
              title={a.field}
            >
              {a.severity === "expired" ? "VCE" : "VCE~"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.unit.id === next.unit.id &&
  prev.unit.status === next.unit.status &&
  prev.unit.name === next.unit.name &&
  prev.unit.plates === next.unit.plates &&
  prev.isSelected === next.isSelected
);