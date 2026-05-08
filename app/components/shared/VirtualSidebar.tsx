"use client";

import React, { useMemo } from "react";
import VirtualList from "./VirtualList";
import SearchInput from "./SearchInput";
import FilterPills from "./FilterPills";
import AdvancedSearchPanel, {
  AdvancedFilters,
  AdvancedSearchConfig,
} from "./AdvancedSearchPanel";
import EmptyState from "./EmptyState";
import { IconInbox } from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// VIRTUAL SIDEBAR — Sidebar completo virtualizado nivel ERP
//
// Composición: header con count + search + N filas de pills +
// panel avanzado opcional + lista virtualizada (100K+ items) +
// empty state + auto-scroll al item seleccionado.
//
// Patrón industria: usado por Linear sidebar, Notion sidebar, Slack DMs.
//
// Uso típico:
//   <VirtualSidebar
//     title="Cotizaciones"
//     count={items.length}
//     totalCount={allItems.length}
//     search={{
//       value: query,
//       onChange: setQuery,
//       placeholder: "Buscar...",
//       hint: "Folio, cliente, RFC, monto",
//     }}
//     pillRows={[
//       { mode: "single", value: filterType, onChange: setFilterType, options: [...] },
//       { mode: "single", value: filterStatus, onChange: setFilterStatus, options: [...] },
//     ]}
//     advancedSearch={{ filters, onChange, config }}
//     items={items}
//     selectedId={selected?.id}
//     onSelect={handleSelect}
//     getItemId={(item) => item.id}
//     itemHeight={75}
//     renderItem={(item) => <RowComponent item={item} />}
//     emptyState={{ icon, title, description, action }}
//   />
// ═══════════════════════════════════════════════════════════════════

type PillRow = {
  mode: "single" | "multi";
  value: any;
  onChange: any;
  options: Array<{ value: string; label: string; count?: number }>;
  size?: "sm" | "md";
  shape?: "rect" | "round";
};

type Props<T> = {
  title: string;
  count: number;
  totalCount?: number; // Si difiere, muestra "N de M"
  height?: number; // Si no se da, usa flexbox auto
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: string;
  };
  pillRows?: PillRow[];
  advancedSearch?: {
    filters: AdvancedFilters;
    onChange: (f: AdvancedFilters) => void;
    config: AdvancedSearchConfig;
  };
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
  pillRows,
  advancedSearch,
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
      {/* HEADER — title + count */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: search || pillRows ? "10px" : "0",
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

        {/* SEARCH */}
        {search && (
          <div style={{ marginBottom: "8px" }}>
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              hint={search.hint}
            />
          </div>
        )}

        {/* PILL ROWS */}
        {pillRows?.map((row, idx) => (
          <div key={idx} style={{ marginBottom: "5px" }}>
            <FilterPills
              mode={row.mode as any}
              options={row.options}
              value={row.value}
              onChange={row.onChange}
              size={row.size}
              shape={row.shape}
            />
          </div>
        ))}

        {/* ADVANCED SEARCH PANEL */}
        {advancedSearch && (
          <div style={{ marginTop: "6px" }}>
            <AdvancedSearchPanel
              filters={advancedSearch.filters}
              onChange={advancedSearch.onChange}
              config={advancedSearch.config}
            />
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