"use client";

import React, { useRef } from "react";
import { FixedSizeList, VariableSizeList, ListChildComponentProps } from "react-window";

// ═══════════════════════════════════════════════════════════════════
// VIRTUAL LIST — Wrapper de react-window para listas de N items
//
// Solo renderiza los ~25 items visibles en pantalla + buffer de 5
// arriba/abajo. Permite escalar listas a 100,000+ items sin lag.
//
// Uso típico:
//   <VirtualList
//     items={cotizaciones}
//     height={500}
//     itemHeight={75}
//     renderItem={(item, index) => <CotizacionRow item={item} />}
//   />
//
// Para items con altura variable (ej: cards que se expanden):
//   <VirtualList
//     items={cotizaciones}
//     height={500}
//     itemHeight={(index) => cotizaciones[index].expanded ? 120 : 75}
//     renderItem={...}
//   />
//
// Patrón industria: usado por Linear, Slack, GitHub, Notion.
// ═══════════════════════════════════════════════════════════════════

type VirtualListProps<T> = {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  emptyState?: React.ReactNode;
  // Auto-scroll a un item específico (ej: cuando el usuario selecciona uno)
  scrollToIndex?: number;
};

export default function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  emptyState,
  scrollToIndex,
}: VirtualListProps<T>) {
  const listRef = useRef<any>(null);

  // Auto-scroll cuando cambia scrollToIndex
  React.useEffect(() => {
    if (scrollToIndex !== undefined && listRef.current && scrollToIndex >= 0) {
      listRef.current.scrollToItem(scrollToIndex, "smart");
    }
  }, [scrollToIndex]);

  if (items.length === 0 && emptyState) {
    return (
      <div
        className={className}
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {emptyState}
      </div>
    );
  }

  // Render — variable height
  if (typeof itemHeight === "function") {
    return (
      <VariableSizeList
        ref={listRef}
        className={className}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscan}
        width="100%"
        style={{ overflowX: "hidden" }}
      >
        {({ index, style }: ListChildComponentProps) => (
          <div style={{ ...style, overflow: "hidden" }}>
            {renderItem(items[index], index)}
          </div>
        )}
      </VariableSizeList>
    );
  }

  // Render — fixed height (más performante)
  return (
    <FixedSizeList
      ref={listRef}
      className={className}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscan}
      width="100%"
      style={{ overflowX: "hidden" }}
    >
      {({ index, style }: ListChildComponentProps) => (
        <div style={{ ...style, overflow: "hidden" }}>
          {renderItem(items[index], index)}
        </div>
      )}
    </FixedSizeList>
  );
}