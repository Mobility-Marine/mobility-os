"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  TrackingShipment,
  TrackingFilters,
} from "../types/tracking.types";
import { EVENT_CONFIG } from "../types/tracking.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// TRACKING SIDEBAR — Virtualizado · escalable a 100K+ embarques
//
// Patrón ERP-grade (Linear / Salesforce):
//   - SIN botón "Nuevo" — tracking solo lee, no crea embarques
//   - Search siempre visible (referencia, cliente)
//   - Botón "Filtros (N)" → drawer con Vista (active/completed/all)
//   - Chips removibles
//   - VirtualList con react-window
//
// Item compacto (4 rows, ~95px):
//   Row 1: referencia (mono color por tipo) · badge notificaciones
//   Row 2: cliente
//   Row 3: ruta (si existe)
//   Row 4: último evento con ícono color + ubicación
// ═══════════════════════════════════════════════════════════════════

type Props = {
  shipments:   TrackingShipment[]; // ya filtrados
  totalCount?: number;
  selected:    TrackingShipment | null;
  onSelect:    (s: TrackingShipment) => void;
  filters:     TrackingFilters;
  setFilters:  (f: TrackingFilters) => void;
};

const ITEM_HEIGHT = 95;

const SERVICE_COLORS: Record<string, string> = {
  terrestre_mx:  "#2563eb",
  terrestre_usa: "#7c3aed",
  maritimo:      "#0891b2",
  aereo:         "#059669",
  multimodal:    "#d97706",
  default:       "#64748b",
};

const VIEW_MODE_LABEL: Record<string, string> = {
  active:    "Activos",
  completed: "Completados",
  all:       "Todos",
};

export default function TrackingSidebar({
  shipments,
  totalCount,
  selected,
  onSelect,
  filters,
  setFilters,
}: Props) {
  const { t } = useTranslation();
  const tl = (t.logistics as any) ?? {};
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Grupo único: Vista (modo) ─────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "view_mode",
        label: tl.viewModeLabel ?? "Vista",
        type: "select",
        value: filters.view_mode,
        onChange: (v) =>
          setFilters({
            ...filters,
            view_mode: v as TrackingFilters["view_mode"],
          }),
        options: [
          { value: "active",    label: tl.trackingViewActive    ?? VIEW_MODE_LABEL.active },
          { value: "completed", label: tl.trackingViewCompleted ?? VIEW_MODE_LABEL.completed },
          { value: "all",       label: tl.trackingViewAll       ?? VIEW_MODE_LABEL.all },
        ],
      },
    ],
    [filters, tl, setFilters],
  );

  // ── Chip activo solo si view_mode != active (default) ─────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.view_mode !== "active") {
      chips.push({
        id: "view_mode",
        label: `Vista: ${VIEW_MODE_LABEL[filters.view_mode] ?? filters.view_mode}`,
        onRemove: () => setFilters({ ...filters, view_mode: "active" }),
      });
    }
    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;

  const clearAll = () => setFilters({ ...filters, view_mode: "active" });

  return (
    <>
      <VirtualSidebar<TrackingShipment>
        title={tl.tracking ?? "Tracking"}
        count={shipments.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tl.searchTracking ?? "Buscar embarque…",
          hint: "Referencia · cliente · ruta",
        }}
        filterButton={{
          activeCount,
          onOpen: () => setDrawerOpen(true),
        }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={shipments}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        getItemId={(s) => s.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(s, _i, isSelected) => (
          <TrackingItem shipment={s} isSelected={isSelected} tl={tl} />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? tl.noResults ?? "Sin resultados"
              : tl.noTracking ?? "Sin embarques activos",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Los embarques aparecerán aquí cuando comiencen su tránsito",
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={tl.filtersTitle ?? "Filtros de tracking"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRACKING ITEM — card compacto (memo para react-window)
// ═══════════════════════════════════════════════════════════════════
const TrackingItem = memo(function TrackingItem({
  shipment: s,
  isSelected,
  tl,
}: {
  shipment:   TrackingShipment;
  isSelected: boolean;
  tl:         any;
}) {
  const lastEv = s.lastEvent;
  const evCfg = lastEv ? EVENT_CONFIG[lastEv.event_type] : null;
  const svcColor = SERVICE_COLORS[s.service_type] ?? SERVICE_COLORS.default;
  const clientName = (s as any).client?.name ?? "—";
  const route = s.origin && s.destination ? `${s.origin} → ${s.destination}` : null;
  const evLabel = evCfg
    ? tl[evCfg.labelKey.replace("logistics.", "")] ?? lastEv?.event_type
    : null;

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
      {/* ROW 1 — referencia + notificaciones pendientes */}
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
            fontSize:           "11px",
            fontWeight:         800,
            color:              svcColor,
            fontFamily:         "ui-monospace, monospace",
            flex:               1,
            minWidth:           0,
            overflow:           "hidden",
            textOverflow:       "ellipsis",
            whiteSpace:         "nowrap",
          }}
        >
          {s.reference}
        </span>
        {s.pendingNotifs > 0 && (
          <span
            style={{
              fontSize:     "9px",
              fontWeight:   800,
              padding:      "1px 5px",
              borderRadius: "var(--radius-full)",
              background:   "var(--color-warning-bg)",
              border:       "1px solid var(--color-warning-border)",
              color:        "var(--color-warning-text)",
              flexShrink:   0,
              whiteSpace:   "nowrap",
            }}
            title="Notificaciones pendientes"
          >
            {s.pendingNotifs}
          </span>
        )}
      </div>

      {/* ROW 2 — cliente */}
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
        {clientName}
      </div>

      {/* ROW 3 — ruta (opcional) */}
      {route && (
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
      )}

      {/* ROW 4 — último evento */}
      {lastEv && evCfg ? (
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "5px",
            marginTop:  "1px",
            minWidth:   0,
            width:      "100%",
          }}
        >
          <span
            style={{
              width:        "6px",
              height:       "6px",
              borderRadius: "50%",
              background:   evCfg.color,
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontSize:     "10px",
              fontWeight:   600,
              color:        evCfg.color,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              minWidth:     0,
              flex:         lastEv.location ? "0 1 auto" : 1,
            }}
          >
            {evLabel}
          </span>
          {lastEv.location && (
            <span
              style={{
                fontSize:     "9px",
                color:        "var(--color-text-muted)",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
                flex:         1,
                minWidth:     0,
              }}
            >
              · {lastEv.location}
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: "10px",
            color:    "var(--color-text-muted)",
            fontStyle:"italic",
          }}
        >
          Sin eventos aún
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.shipment.id === next.shipment.id &&
  prev.shipment.pendingNotifs === next.shipment.pendingNotifs &&
  prev.shipment.lastEvent?.id === next.shipment.lastEvent?.id &&
  prev.isSelected === next.isSelected
);