"use client";

import React, { useMemo } from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";

// ═══════════════════════════════════════════════════════════════════
// VIRTUAL TABLE — Tabla virtualizada nivel ERP
//
// Patrón Linear/Salesforce/Airtable:
//   - Header sticky con columnas configurables (grid)
//   - Body virtualizado con react-window (FixedSizeList)
//   - Cada celda data-driven: {key, header, width, render, align}
//   - Empty/loading state inline
//
// Uso típico (consumidor):
//   <VirtualTable
//     items={rows}
//     columns={[
//       { key: "type",   header: "Tipo",   width: "90px",  render: (r) => <TypePill t={r.type}/> },
//       { key: "client", header: "Cliente", width: "1fr",  render: (r) => r.client_name },
//       { key: "total",  header: "Total",   width: "110px", align: "right", render: (r) => fmt(r.total) },
//     ]}
//     onRowClick={(r) => setSelected(r)}
//     getRowId={(r) => r.id}
//     selectedId={selected?.id}
//   />
// ═══════════════════════════════════════════════════════════════════

export type ColumnAlign = "left" | "center" | "right";

export type Column<T> = {
  key:     string;
  header:  React.ReactNode;
  width:   string;            // "120px", "1fr", "minmax(0, 200px)", etc.
  align?:  ColumnAlign;       // default: "left"
  render:  (row: T, index: number) => React.ReactNode;
};

type Props<T> = {
  items:        T[];
  columns:      Column<T>[];
  height?:      number | string;     // default: 100% — usa el container
  rowHeight?:   number;              // default: 56
  loading?:     boolean;
  loadingText?: string;
  emptyState?: {
    icon?:        React.ReactNode;
    title:        string;
    description?: string;
    action?:      { label: string; onClick: () => void };
  };
  onRowClick?:  (row: T, index: number) => void;
  getRowId:     (row: T) => string | number;
  selectedId?:  string | number | null;
  // Footer opcional (totales, paginación, etc.) — render libre
  footer?:      React.ReactNode;
};

const DEFAULT_ROW_HEIGHT = 56;

export default function VirtualTable<T>({
  items,
  columns,
  height,
  rowHeight = DEFAULT_ROW_HEIGHT,
  loading,
  loadingText,
  emptyState,
  onRowClick,
  getRowId,
  selectedId,
  footer,
}: Props<T>) {
  // Grid template construido desde columnas
  const gridTemplate = useMemo(
    () => columns.map((c) => c.width).join(" "),
    [columns],
  );

  return (
    <div
      style={{
        background:   "var(--color-bg-base)",
        border:       "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        overflow:     "hidden",
        display:      "flex",
        flexDirection:"column",
        height:       height ?? "100%",
        minHeight:    0,
      }}
    >
      {/* HEADER STICKY */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: gridTemplate,
          padding:             "10px 16px",
          background:          "var(--color-bg-subtle)",
          borderBottom:        "1px solid var(--color-border-faint)",
          fontSize:            "10px",
          fontWeight:          700,
          color:               "var(--color-text-muted)",
          textTransform:       "uppercase",
          letterSpacing:       "0.5px",
          flexShrink:          0,
          gap:                 "12px",
        }}
      >
        {columns.map((col) => (
          <span
            key={col.key}
            style={{
              textAlign:    col.align ?? "left",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {col.header}
          </span>
        ))}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {loading ? (
          <div
            style={{
              padding:    "40px",
              textAlign:  "center",
              color:      "var(--color-text-muted)",
              fontSize:   "13px",
            }}
          >
            {loadingText ?? "Cargando…"}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding:        "48px",
              textAlign:      "center",
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            "8px",
            }}
          >
            {emptyState?.icon}
            <div
              style={{
                fontSize:   "14px",
                fontWeight: 700,
                color:      "var(--color-text-primary)",
              }}
            >
              {emptyState?.title ?? "Sin resultados"}
            </div>
            {emptyState?.description && (
              <div
                style={{
                  fontSize:  "12px",
                  color:     "var(--color-text-muted)",
                  marginTop: "2px",
                  maxWidth:  "400px",
                }}
              >
                {emptyState.description}
              </div>
            )}
            {emptyState?.action && (
              <button
                onClick={emptyState.action.onClick}
                style={{
                  marginTop:    "12px",
                  height:       "32px",
                  padding:      "0 16px",
                  borderRadius: "var(--radius-md)",
                  background:   "var(--color-brand-blue)",
                  border:       "none",
                  color:        "#fff",
                  fontSize:     "12px",
                  fontWeight:   700,
                  cursor:       "pointer",
                }}
              >
                {emptyState.action.label}
              </button>
            )}
          </div>
        ) : (
          <AutoSizer>
            {({ height: h }) => (
              <FixedSizeList
                height={h}
                itemCount={items.length}
                itemSize={rowHeight}
                width="100%"
                style={{ overflowX: "hidden" }}
              >
                {({ index, style }: ListChildComponentProps) => {
                  const row = items[index];
                  const id = getRowId(row);
                  const isSelected = id === selectedId;
                  return (
                    <div
                      style={{
                        ...style,
                        overflow:     "hidden",
                        boxSizing:    "border-box",
                      }}
                    >
                      <div
                        onClick={() => onRowClick?.(row, index)}
                        style={{
                          display:             "grid",
                          gridTemplateColumns: gridTemplate,
                          padding:             "11px 16px",
                          borderBottom:        "1px solid var(--color-border-faint)",
                          cursor:              onRowClick ? "pointer" : "default",
                          alignItems:          "center",
                          background:          isSelected
                            ? "var(--color-bg-active)"
                            : "transparent",
                          transition:          "background 0.1s",
                          height:              "100%",
                          boxSizing:           "border-box",
                          gap:                 "12px",
                          width:               "100%",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.background =
                              "var(--color-bg-subtle)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.background =
                              "transparent";
                          }
                        }}
                      >
                        {columns.map((col) => (
                          <div
                            key={col.key}
                            style={{
                              textAlign:    col.align ?? "left",
                              overflow:     "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace:   "nowrap",
                              minWidth:     0,
                            }}
                          >
                            {col.render(row, index)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              </FixedSizeList>
            )}
          </AutoSizer>
        )}
      </div>

      {/* FOOTER OPCIONAL */}
      {footer && items.length > 0 && (
        <div
          style={{
            flexShrink:   0,
            padding:      "10px 16px",
            borderTop:    "1px solid var(--color-border-faint)",
            background:   "var(--color-bg-subtle)",
            fontSize:     "11px",
            color:        "var(--color-text-muted)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUTO-SIZER (mismo patrón que VirtualSidebar y DocsSidebar)
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
          width:  entry.contentRect.width,
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