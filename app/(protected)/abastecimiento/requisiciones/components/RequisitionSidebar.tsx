"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  Requisition,
  RequisitionFilters,
  RequisitionStatus,
  RequisitionPriority,
} from "../types/requisition.types";
import {
  REQUISITION_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../types/requisition.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// REQUISITION SIDEBAR — Requisiciones virtualizado
// Patrón ERP: VirtualSidebar + FilterDrawer + memo item
// ═══════════════════════════════════════════════════════════════════

type Props = {
  requisitions: Requisition[];
  totalCount?:  number;
  selected:     Requisition | null;
  onSelect:     (r: Requisition) => void;
  filters:      RequisitionFilters;
  setFilters:   (f: RequisitionFilters) => void;
  onNew:        () => void;
};

const ITEM_HEIGHT = 78;

const PRIORITY_DOT: Record<RequisitionPriority, string> = {
  low:    "var(--color-text-muted)",
  normal: "var(--color-brand-blue)",
  high:   "#d97706",
  urgent: "var(--color-danger-text)",
};

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const STATUS_OPTIONS: { v: RequisitionStatus | "all"; l: string }[] = [
  { v: "all",              l: "Todas" },
  { v: "draft",            l: "Borrador" },
  { v: "pending_approval", l: "Pendiente" },
  { v: "approved",         l: "Aprobada" },
  { v: "rejected",         l: "Rechazada" },
  { v: "in_quotation",     l: "En cotización" },
  { v: "ordered",          l: "Ordenada" },
  { v: "received",         l: "Recibida" },
  { v: "cancelled",        l: "Cancelada" },
];

const PRIORITY_OPTIONS: { v: RequisitionPriority | "all"; l: string }[] = [
  { v: "all",    l: "Todas" },
  { v: "urgent", l: "Urgente" },
  { v: "high",   l: "Alta" },
  { v: "normal", l: "Normal" },
  { v: "low",    l: "Baja" },
];

export default function RequisitionSidebar({
  requisitions,
  totalCount,
  selected,
  onSelect,
  filters,
  setFilters,
  onNew,
}: Props) {
  const { t, lang } = useTranslation();
  const tp = (t.procurement as any) ?? {};
  const locale = lang === "en" ? "en-US" : "es-MX";
  const [drawerOpen, setDrawerOpen] = useState(false);

  function getStatusLabel(status: RequisitionStatus): string {
    const cfg = REQUISITION_STATUS_CONFIG[status];
    return tp[cfg.labelKey.replace("procurement.", "")] ?? status;
  }

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "status",
        label: tp.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as RequisitionFilters["status"] }),
        options: STATUS_OPTIONS.map((o) => ({
          value: String(o.v),
          label: o.v === "all" ? tp.filterAll ?? o.l : o.l,
        })),
      },
      {
        id: "priority",
        label: tp.priorityLabel ?? "Prioridad",
        type: "select",
        value: (filters.priority as string) ?? "all",
        onChange: (v) =>
          setFilters({
            ...filters,
            priority: v as RequisitionFilters["priority"],
          }),
        options: PRIORITY_OPTIONS.map((o) => ({
          value: String(o.v),
          label: o.v === "all" ? tp.filterAll ?? o.l : o.l,
        })),
      },
    ],
    [filters, tp, setFilters],
  );

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
    if (filters.priority && (filters.priority as string) !== "all") {
      const opt = PRIORITY_OPTIONS.find((o) => o.v === filters.priority);
      chips.push({
        id: "priority",
        label: `Prioridad: ${opt?.l ?? filters.priority}`,
        onRemove: () =>
          setFilters({
            ...filters,
            priority: "all" as RequisitionFilters["priority"],
          }),
      });
    }
    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;
  const clearAll = () =>
    setFilters({
      ...filters,
      status: "all",
      priority: "all" as RequisitionFilters["priority"],
    });

  return (
    <>
      <VirtualSidebar<Requisition>
        title={tp.requisitions ?? "Requisiciones"}
        count={requisitions.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tp.searchRequisition ?? "Número, título, depto…",
          hint: "Número · título · departamento",
        }}
        headerActions={[
          {
            label: tp.newRequisition ?? "Nueva requisición",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
        ]}
        filterButton={{ activeCount, onOpen: () => setDrawerOpen(true) }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={requisitions}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        getItemId={(r) => r.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(r, _i, isSelected) => (
          <ReqItem
            req={r}
            isSelected={isSelected}
            locale={locale}
            statusLabel={getStatusLabel(r.status)}
          />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? tp.noResults ?? "Sin resultados"
              : tp.noRequisitions ?? "Sin requisiciones",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Crea tu primera requisición para empezar",
          action:
            activeCount === 0 && !filters.search
              ? { label: tp.newRequisition ?? "Nueva requisición", onClick: onNew }
              : undefined,
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={tp.filtersTitle ?? "Filtros"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REQ ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const ReqItem = memo(function ReqItem({
  req: r,
  isSelected,
  locale,
  statusLabel,
}: {
  req:         Requisition;
  isSelected:  boolean;
  locale:      string;
  statusLabel: string;
}) {
  const stCfg = REQUISITION_STATUS_CONFIG[r.status];

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
      {/* ROW 1 — priority dot + número + status */}
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
            width:        "6px",
            height:       "6px",
            borderRadius: "50%",
            background:   PRIORITY_DOT[r.priority],
            flexShrink:   0,
          }}
          title={`Prioridad: ${r.priority}`}
        />
        <span
          style={{
            fontSize:     "11px",
            fontWeight:   700,
            color:        "var(--color-text-muted)",
            fontFamily:   "ui-monospace, monospace",
            flex:         1,
            minWidth:     0,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}
        >
          {r.requisition_number ?? "—"}
        </span>
        <span
          style={{
            fontSize:     "9px",
            fontWeight:   700,
            padding:      "1px 5px",
            borderRadius: "3px",
            background:   stCfg.bg,
            border:       `1px solid ${stCfg.border}`,
            color:        stCfg.color,
            flexShrink:   0,
            whiteSpace:   "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ROW 2 — título */}
      <div
        style={{
          fontSize:     "12px",
          fontWeight:   700,
          color:        "var(--color-text-primary)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
        }}
      >
        {r.title}
      </div>

      {/* ROW 3 — depto + needed_by */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          fontSize:       "10px",
          color:          "var(--color-text-muted)",
          gap:            "8px",
          width:          "100%",
        }}
      >
        <span
          style={{
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            flex:         1,
            minWidth:     0,
          }}
        >
          {r.department ?? "—"}
        </span>
        <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          {r.needed_by
            ? new Date(r.needed_by).toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
              })
            : ""}
        </span>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.req.id === next.req.id &&
  prev.req.status === next.req.status &&
  prev.req.priority === next.req.priority &&
  prev.req.title === next.req.title &&
  prev.isSelected === next.isSelected
);