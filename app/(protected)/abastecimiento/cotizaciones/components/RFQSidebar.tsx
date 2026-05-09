"use client";

import React, { memo, useMemo, useState } from "react";
import type { RFQ, RFQFilters, RFQStatus } from "../types/rfq.types";
import { RFQ_STATUS_CONFIG } from "../types/rfq.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// RFQ SIDEBAR — Cotizaciones a proveedores virtualizado
// (Distinto a Cotizaciones comerciales — aquí cotizan PROVEEDORES)
// ═══════════════════════════════════════════════════════════════════

type Props = {
  rfqs:        RFQ[];
  totalCount?: number;
  selected:    RFQ | null;
  onSelect:    (r: RFQ) => void;
  filters:     RFQFilters;
  setFilters:  (f: RFQFilters) => void;
  onNew:       () => void;
};

const ITEM_HEIGHT = 78;

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const STATUS_OPTIONS: { v: RFQStatus | "all"; l: string }[] = [
  { v: "all",                l: "Todas" },
  { v: "draft",              l: "Borrador" },
  { v: "sent",               l: "Enviada" },
  { v: "responses_received", l: "Con respuestas" },
  { v: "awarded",            l: "Adjudicada" },
  { v: "cancelled",          l: "Cancelada" },
];

export default function RFQSidebar({
  rfqs,
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

  function getStatusLabel(s: RFQStatus): string {
    const cfg = RFQ_STATUS_CONFIG[s];
    return tp[cfg.labelKey.replace("procurement.", "")] ?? s;
  }

  // ── Grupo único: Estado ───────────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "status",
        label: tp.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as RFQFilters["status"] }),
        options: STATUS_OPTIONS.map((o) => ({
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
    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;
  const clearAll = () => setFilters({ ...filters, status: "all" });

  return (
    <>
      <VirtualSidebar<RFQ>
        title={tp.rfqs ?? "Cotizaciones"}
        count={rfqs.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tp.searchRfq ?? "Número, título…",
          hint: "Número · título",
        }}
        headerActions={[
          {
            label: tp.newRfq ?? "Nueva solicitud",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
        ]}
        filterButton={{ activeCount, onOpen: () => setDrawerOpen(true) }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={rfqs}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        getItemId={(r) => r.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(r, _i, isSelected) => (
          <RFQItem
            rfq={r}
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
              : tp.noRfqs ?? "Sin solicitudes",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Crea tu primera solicitud a proveedores",
          action:
            activeCount === 0 && !filters.search
              ? { label: tp.newRfq ?? "Nueva solicitud", onClick: onNew }
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
// RFQ ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const RFQItem = memo(function RFQItem({
  rfq: r,
  isSelected,
  locale,
  statusLabel,
}: {
  rfq:         RFQ;
  isSelected:  boolean;
  locale:      string;
  statusLabel: string;
}) {
  const stCfg = RFQ_STATUS_CONFIG[r.status];
  const respCount = r.responses?.length ?? 0;

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
      {/* ROW 1 — número + status */}
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
          {r.rfq_number ?? "—"}
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

      {/* ROW 3 — proveedores cotizando + deadline */}
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
          {respCount} prov. cotizando
        </span>
        <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          {r.deadline
            ? new Date(r.deadline).toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
              })
            : ""}
        </span>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.rfq.id === next.rfq.id &&
  prev.rfq.status === next.rfq.status &&
  prev.rfq.title === next.rfq.title &&
  (prev.rfq.responses?.length ?? 0) === (next.rfq.responses?.length ?? 0) &&
  prev.isSelected === next.isSelected
);