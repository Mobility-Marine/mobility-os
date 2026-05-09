"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  ForeignTradeOperation,
  FTFilters,
  OperationType,
} from "../types/foreign-trade.types";
import { TRADE_STATUS_CONFIG } from "../types/foreign-trade.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// FT (FOREIGN TRADE) SIDEBAR — Comercio Exterior virtualizado
// Patrón ERP-grade: VirtualSidebar + FilterDrawer + memo item
// ═══════════════════════════════════════════════════════════════════

type Props = {
  ops:         ForeignTradeOperation[];
  totalCount?: number;
  selected:    ForeignTradeOperation | null;
  setSelected: (o: ForeignTradeOperation) => void;
  filters:     FTFilters;
  setFilters:  (f: FTFilters) => void;
  onNew:       () => void;
};

const ITEM_HEIGHT = 92;
const TYPE_COLORS = { import: "#2563eb", export: "#7c3aed" };

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TYPE_LABEL: Record<string, string> = {
  import: "Importación",
  export: "Exportación",
};

export default function FTSidebar({
  ops,
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

  // Status labels desde el TRADE_STATUS_CONFIG
  const STATUS_LABEL_MAP: Record<string, string> = useMemo(
    () => ({
      open:       tl.statusOpen        ?? "Abierta",
      in_process: tl.statusInProcess   ?? "En proceso",
      at_customs: tl.statusAtCustoms   ?? "En aduana",
      released:   tl.statusReleased    ?? "Liberada",
      closed:     tl.statusClosed      ?? "Cerrada",
      cancelled:  tl.ftStatusCancelled ?? "Cancelada",
    }),
    [tl],
  );

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "operation_type",
        label: tl.operationTypeLabel ?? "Tipo",
        type: "select",
        value: filters.operation_type,
        onChange: (v) =>
          setFilters({
            ...filters,
            operation_type: v as OperationType | "all",
          }),
        options: [
          { value: "all",    label: tl.filterAll      ?? "Todos" },
          { value: "import", label: tl.opTypeImport   ?? TYPE_LABEL.import },
          { value: "export", label: tl.opTypeExport   ?? TYPE_LABEL.export },
        ],
      },
      {
        id: "status",
        label: tl.statusLabel ?? "Estado",
        type: "select",
        value: filters.status ?? "all",
        onChange: (v) =>
          setFilters({ ...filters, status: v as FTFilters["status"] }),
        options: [
          { value: "all",        label: tl.filterAll ?? "Todos" },
          ...Object.entries(STATUS_LABEL_MAP).map(([v, l]) => ({ value: v, label: l })),
        ],
      },
    ],
    [filters, tl, STATUS_LABEL_MAP, setFilters],
  );

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.operation_type !== "all") {
      chips.push({
        id: "operation_type",
        label: `Tipo: ${TYPE_LABEL[filters.operation_type] ?? filters.operation_type}`,
        onRemove: () => setFilters({ ...filters, operation_type: "all" }),
      });
    }
    if (filters.status && filters.status !== "all") {
      chips.push({
        id: "status",
        label: `Estado: ${STATUS_LABEL_MAP[filters.status] ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: "all" }),
      });
    }
    return chips;
  }, [filters, STATUS_LABEL_MAP, setFilters]);

  const activeCount = activeChips.length;
  const clearAll = () =>
    setFilters({ ...filters, operation_type: "all", status: "all" });

  return (
    <>
      <VirtualSidebar<ForeignTradeOperation>
        title={tl.foreignTrade ?? "Comercio Ext."}
        count={ops.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tl.searchOperation ?? "Pedimento, factura, cliente…",
          hint: "Pedimento · factura · cliente",
        }}
        headerActions={[
          {
            label: tl.newOperation ?? "Nueva operación",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
        ]}
        filterButton={{ activeCount, onOpen: () => setDrawerOpen(true) }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={ops}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(o) => o.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(o, _i, isSelected) => (
          <FTItem
            op={o}
            isSelected={isSelected}
            locale={locale}
            stLabel={STATUS_LABEL_MAP[o.status] ?? o.status}
          />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            activeCount > 0 || filters.search
              ? tl.noResults ?? "Sin resultados"
              : tl.noOperations ?? "Sin operaciones",
          description:
            activeCount > 0 || filters.search
              ? "Ajusta los filtros o limpia la búsqueda"
              : "Crea tu primera operación para empezar",
          action:
            activeCount === 0 && !filters.search
              ? { label: tl.newOperation ?? "Nueva operación", onClick: onNew }
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
// FT ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const FTItem = memo(function FTItem({
  op: o,
  isSelected,
  locale,
  stLabel,
}: {
  op:         ForeignTradeOperation;
  isSelected: boolean;
  locale:     string;
  stLabel:    string;
}) {
  const stCfg = TRADE_STATUS_CONFIG[o.status];
  const isImport = o.operation_type === "import";
  const ref = o.pedimento_number ?? o.invoice_number ?? o.id.slice(0, 8).toUpperCase();
  const clientName = (o as any).shipment?.client?.name ?? (o as any).client?.name ?? "—";
  const hasAlert = o.alert_inspection || o.alert_embargo;

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
      {/* ROW 1 — IMP/EXP + status */}
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
            fontWeight:   800,
            padding:      "1px 6px",
            borderRadius: "var(--radius-full)",
            background:   isImport ? "#dbeafe" : "#ede9fe",
            color:        TYPE_COLORS[o.operation_type],
            border:       `1px solid ${isImport ? "#93c5fd" : "#c4b5fd"}`,
            flexShrink:   0,
          }}
        >
          {isImport ? "IMP" : "EXP"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }} />
        <span
          style={{
            fontSize:      "9px",
            fontWeight:    700,
            padding:       "1px 5px",
            borderRadius:  "var(--radius-full)",
            background:    stCfg.bg,
            color:         stCfg.color,
            border:        `1px solid ${stCfg.border}`,
            flexShrink:    0,
            whiteSpace:    "nowrap",
          }}
        >
          {stLabel}
        </span>
      </div>

      {/* ROW 2 — referencia (pedimento/factura) */}
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

      {/* ROW 3 — cliente */}
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

      {/* ROW 4 — fecha + alerta */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          fontSize:       "10px",
          width:          "100%",
        }}
      >
        <span style={{ color: "var(--color-text-muted)" }}>
          {new Date(o.created_at).toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          })}
        </span>
        {hasAlert && (
          <span
            style={{
              fontSize:     "9px",
              fontWeight:   700,
              color:        "var(--color-danger-text)",
              background:   "var(--color-danger-bg)",
              border:       "1px solid var(--color-danger-border)",
              padding:      "0 5px",
              borderRadius: "3px",
              flexShrink:   0,
            }}
          >
            ALERTA
          </span>
        )}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.op.id === next.op.id &&
  prev.op.status === next.op.status &&
  prev.op.alert_inspection === next.op.alert_inspection &&
  prev.op.alert_embargo === next.op.alert_embargo &&
  prev.isSelected === next.isSelected
);