"use client";

import React, { useMemo } from "react";
import VirtualList from "./VirtualList";
import SearchInput from "./SearchInput";
import EmptyState from "./EmptyState";
import { IconInbox, IconSliders, IconX } from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// VIRTUAL SIDEBAR — Sidebar virtualizado nivel ERP (v2 — patrón Linear/Salesforce)
//
// Composición del header (ahora SIMPLE, sin pills ni panel embebido):
//   ┌────────────────────────────────────────────────┐
//   │ TÍTULO              [count]                    │  ← row 1
//   │ [🔍 search input               ]               │  ← row 2 (opcional)
//   │ [⚙️ Filtros (3)]   [Acción opcional]           │  ← row 3 (opcional)
//   │ [chip 1 ×] [chip 2 ×] [chip 3 ×] [Limpiar]    │  ← row 4 (chips activos)
//   ├────────────────────────────────────────────────┤
//   │                                                │
//   │      VirtualList (react-window)                │
//   │                                                │
//   └────────────────────────────────────────────────┘
//
// Esto reemplaza al patrón anterior (multi-fila de pills + panel
// avanzado expandible). Razón: a más de 5–6 filtros simultáneos el
// header crecía verticalmente comiéndose el espacio de la lista. El
// patrón drawer + chips es el estándar de Linear, NetSuite, Salesforce.
//
// API:
//   - filterButton + activeChips son OPCIONALES; si no se pasan, no
//     se renderiza nada en esos rows. Útil para sidebars sin filtros.
//   - El consumer maneja el FilterDrawer aparte; aquí solo recibimos
//     el callback `filterButton.onOpen` para abrirlo.
// ═══════════════════════════════════════════════════════════════════

export type ActiveChip = {
  id: string;
  label: string;       // texto a mostrar (ej: "Tipo: Servicios")
  onRemove: () => void;
};

type FilterButton = {
  activeCount: number;
  onOpen: () => void;
  label?: string;       // default "Filtros"
};

type HeaderAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type Props<T> = {
  title: string;
  count: number;
  totalCount?: number;
  height?: number;
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: string;
  };
  filterButton?: FilterButton;
  activeChips?: ActiveChip[];
  onClearAllFilters?: () => void;
  headerAction?: HeaderAction;
  items: T[];
  selectedId?: string | number | null;
  onSelect: (item: T) => void;
  getItemId: (item: T) => string | number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
};

export default function VirtualSidebar<T>({
  title,
  count,
  totalCount,
  height,
  search,
  filterButton,
  activeChips,
  onClearAllFilters,
  headerAction,
  items,
  selectedId,
  onSelect,
  getItemId,
  itemHeight,
  renderItem,
  emptyState,
}: Props<T>) {
  // Auto-scroll al item seleccionado
  const scrollToIndex = useMemo(() => {
    if (selectedId === null || selectedId === undefined) return undefined;
    const idx = items.findIndex((item) => getItemId(item) === selectedId);
    return idx >= 0 ? idx : undefined;
  }, [items, selectedId, getItemId]);

  const hasChips = !!activeChips && activeChips.length > 0;
  const hasActionsRow = !!filterButton || !!headerAction;

  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: height ? `${height}px` : "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        {/* ROW 1 — title + count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: search || hasActionsRow || hasChips ? "10px" : "0",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border-faint)",
              color: "var(--color-text-muted)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {totalCount !== undefined && totalCount !== count
              ? `${count} de ${totalCount}`
              : count}
          </span>
        </div>

        {/* ROW 2 — search */}
        {search && (
          <div style={{ marginBottom: hasActionsRow || hasChips ? "8px" : "0" }}>
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              hint={search.hint}
            />
          </div>
        )}

        {/* ROW 3 — filter button + opcional headerAction */}
        {hasActionsRow && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              marginBottom: hasChips ? "8px" : "0",
            }}
          >
            {filterButton && (
              <button
                onClick={filterButton.onOpen}
                style={filterBtnStyle(filterButton.activeCount > 0)}
              >
                <IconSliders size={12} />
                <span>{filterButton.label ?? "Filtros"}</span>
                {filterButton.activeCount > 0 && (
                  <span style={filterBtnBadgeStyle}>
                    {filterButton.activeCount}
                  </span>
                )}
              </button>
            )}
            {headerAction && (
              <button
                onClick={headerAction.onClick}
                style={headerActionStyle(headerAction.variant === "primary")}
              >
                {headerAction.label}
              </button>
            )}
          </div>
        )}

        {/* ROW 4 — chips de filtros activos */}
        {hasChips && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              alignItems: "center",
            }}
          >
            {activeChips!.map((chip) => (
              <ActiveChipPill key={chip.id} chip={chip} />
            ))}
            {onClearAllFilters && activeChips!.length > 1 && (
              <button
                onClick={onClearAllFilters}
                style={{
                  height: "22px",
                  padding: "0 8px",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                  border: "1px dashed var(--color-border)",
                  color: "var(--color-text-muted)",
                  fontSize: "9px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                Limpiar todo
              </button>
            )}
          </div>
        )}
      </div>

      {/* LIST — virtualizada */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {items.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EmptyState
              icon={emptyState?.icon ?? <IconInbox size={32} />}
              title={emptyState?.title ?? "Sin resultados"}
              description={emptyState?.description}
              action={emptyState?.action}
              size="sm"
            />
          </div>
        ) : (
          <AutoSizer>
            {({ height: h }) => (
              <VirtualList
                items={items}
                height={h}
                itemHeight={itemHeight}
                scrollToIndex={scrollToIndex}
                renderItem={(item, index) => {
                  const id = getItemId(item);
                  const isSelected = id === selectedId;
                  return (
                    <div
                      onClick={() => onSelect(item)}
                      style={{
                        cursor: "pointer",
                        paddingBottom: "5px",
                        height: "100%",
                      }}
                    >
                      {renderItem(item, index, isSelected)}
                    </div>
                  );
                }}
              />
            )}
          </AutoSizer>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTE — ActiveChipPill
// Cada chip muestra el filtro activo y permite removerlo con × inline.
// ═══════════════════════════════════════════════════════════════════
function ActiveChipPill({ chip }: { chip: ActiveChip }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        height: "22px",
        padding: "0 4px 0 8px",
        borderRadius: "var(--radius-sm)",
        background: "var(--color-info-bg)",
        border: "1px solid var(--color-info-border)",
        color: "var(--color-info-text)",
        fontSize: "10px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "180px",
        }}
      >
        {chip.label}
      </span>
      <button
        onClick={chip.onRemove}
        aria-label={`Quitar filtro ${chip.label}`}
        style={{
          width: "16px",
          height: "16px",
          padding: 0,
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: 0.7,
        }}
      >
        <IconX size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTO-SIZER — calcula height del container automáticamente
// (sin dependencia adicional react-virtualized-auto-sizer)
// ═══════════════════════════════════════════════════════════════════
function AutoSizer({
  children,
}: {
  children: (size: { height: number; width: number }) => React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ height: 0, width: 0 });

  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          height: entry.contentRect.height,
          width: entry.contentRect.width,
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ height: "100%", width: "100%" }}>
      {size.height > 0 && children(size)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS — botones del header
// ═══════════════════════════════════════════════════════════════════
function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    height: "28px",
    padding: "0 10px",
    borderRadius: "var(--radius-md)",
    background: active ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
    border: `1px solid ${active ? "var(--color-info-border)" : "var(--color-border-faint)"}`,
    color: active ? "var(--color-info-text)" : "var(--color-text-second)",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "var(--transition-fast)",
    whiteSpace: "nowrap",
  };
}

const filterBtnBadgeStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  padding: "1px 6px",
  borderRadius: "var(--radius-full)",
  background: "var(--color-brand-blue)",
  color: "#fff",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.3,
};

function headerActionStyle(primary: boolean): React.CSSProperties {
  return {
    height: "28px",
    padding: "0 12px",
    borderRadius: "var(--radius-md)",
    background: primary ? "var(--color-brand-blue)" : "transparent",
    border: `1px solid ${primary ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
    color: primary ? "#fff" : "var(--color-text-second)",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}