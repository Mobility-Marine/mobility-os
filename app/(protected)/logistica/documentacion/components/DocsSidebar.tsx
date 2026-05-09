"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  ShipmentDocument,
  DocFilters,
  DocStatus,
} from "../types/docs.types";
import { DOC_CATEGORY_CONFIG } from "../types/docs.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualList from "@/app/components/shared/VirtualList";
import SearchInput from "@/app/components/shared/SearchInput";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox, IconSliders, IconX } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// DOCS SIDEBAR — Document Manager 360° con grupos colapsables virtualizados
//
// Patrón ERP-grade especial: mixed-row VirtualList
//   - Cada row puede ser GROUP_HEADER o DOC
//   - Pre-flatten en useMemo: O(n) y respeta colapsados
//   - VariableSizeList: GROUP_HEADER (40px) vs DOC (90px)
//
// Filtros principales en drawer: Estado + Fuente (Embarque/CXP/CFDI)
// ═══════════════════════════════════════════════════════════════════

type Props = {
  docs:        ShipmentDocument[];
  totalCount?: number;
  selected:    ShipmentDocument | null;
  setSelected: (d: ShipmentDocument) => void;
  filters:     DocFilters;
  setFilters:  (f: DocFilters) => void;
  onNew:       () => void;
};

const HEADER_HEIGHT = 40;
const DOC_HEIGHT = 92;

const STATUS_COLORS: Record<DocStatus, string> = {
  pending:   "#94a3b8",
  received:  "#3b82f6",
  validated: "#10b981",
  rejected:  "#ef4444",
  approved:  "#10b981",
};

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const STATUS_OPTIONS: { v: DocStatus | "all"; l: string }[] = [
  { v: "all",       l: "Todos" },
  { v: "pending",   l: "Pendientes" },
  { v: "received",  l: "Recibidos" },
  { v: "validated", l: "Validados" },
  { v: "approved",  l: "Aprobados" },
  { v: "rejected",  l: "Rechazados" },
];

const SOURCE_OPTIONS: { v: "all" | "direct" | "cxp" | "cfdi"; l: string }[] = [
  { v: "all",    l: "Todas" },
  { v: "direct", l: "Embarque" },
  { v: "cxp",    l: "CXP" },
  { v: "cfdi",   l: "CFDI" },
];

// ── Tipo de row (GROUP_HEADER | DOC) ────────────────────────────────
type Row =
  | {
      kind: "header";
      key: string;
      label: string;
      sub: string;
      docCount: number;
      hasSelected: boolean;
      isCollapsed: boolean;
    }
  | {
      kind: "doc";
      key: string;
      doc: ShipmentDocument;
    };

export default function DocsSidebar({
  docs,
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Agrupar y aplanar en una sola pasada ──────────────────────────
  const rows = useMemo<Row[]>(() => {
    const groupsMap: Record<
      string,
      { label: string; sub: string; docs: ShipmentDocument[] }
    > = {};
    const order: string[] = [];

    for (const doc of docs) {
      const key = doc.shipment_id ?? `client_${doc.client_id ?? "sin_vincular"}`;
      if (!groupsMap[key]) {
        const label =
          doc.shipment?.reference ??
          doc.client?.name ??
          (doc.shipment_id
            ? `EMB-${doc.shipment_id.slice(0, 6)}`
            : "Sin vincular");
        const sub = doc.shipment?.client?.name ?? doc.client?.name ?? "";
        groupsMap[key] = { label, sub, docs: [] };
        order.push(key);
      }
      groupsMap[key].docs.push(doc);
    }

    const result: Row[] = [];
    for (const key of order) {
      const grp = groupsMap[key];
      const isCollapsed = collapsedGroups.has(key);
      const hasSelected = grp.docs.some((d) => d.id === selected?.id);

      result.push({
        kind:        "header",
        key,
        label:       grp.label,
        sub:         grp.sub,
        docCount:    grp.docs.length,
        hasSelected,
        isCollapsed,
      });

      if (!isCollapsed) {
        for (const d of grp.docs) {
          result.push({ kind: "doc", key: d.id, doc: d });
        }
      }
    }
    return result;
  }, [docs, collapsedGroups, selected?.id]);

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(
    () => [
      {
        id: "status",
        label: tl.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as DocFilters["status"] }),
        options: STATUS_OPTIONS.map((o) => ({
          value: String(o.v),
          label: o.v === "all" ? tl.filterAll ?? o.l : o.l,
        })),
      },
      {
        id: "source",
        label: tl.sourceLabel ?? "Fuente",
        type: "select",
        value: filters.source,
        onChange: (v) =>
          setFilters({ ...filters, source: v as DocFilters["source"] }),
        options: SOURCE_OPTIONS.map((o) => ({
          value: String(o.v),
          label: o.v === "all" ? tl.filterAll ?? o.l : o.l,
        })),
      },
    ],
    [filters, tl, setFilters],
  );

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (filters.status !== "all") {
      const opt = STATUS_OPTIONS.find((o) => o.v === filters.status);
      chips.push({
        id: "status",
        label: `Estado: ${opt?.l ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: "all" }),
      });
    }
    if (filters.source !== "all") {
      const opt = SOURCE_OPTIONS.find((o) => o.v === filters.source);
      chips.push({
        id: "source",
        label: `Fuente: ${opt?.l ?? filters.source}`,
        onRemove: () => setFilters({ ...filters, source: "all" }),
      });
    }
    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;
  const clearAll = () =>
    setFilters({ ...filters, status: "all", source: "all" });

  // ── Altura variable por row ───────────────────────────────────────
  const itemHeight = (index: number) =>
    rows[index]?.kind === "header" ? HEADER_HEIGHT : DOC_HEIGHT;

  return (
    <>
      <div
        style={{
          background:   "var(--color-bg-base)",
          border:       "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding:      "14px",
          display:      "flex",
          flexDirection:"column",
          gap:          "10px",
          height:       "100%",
          minHeight:    0,
          overflow:     "hidden",
        }}
      >
        {/* HEADER */}
        <div style={{ flexShrink: 0 }}>
          {/* Title + count */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginBottom:   "10px",
            }}
          >
            <span
              style={{
                fontSize:      "10px",
                fontWeight:    700,
                color:         "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {tl.documentation ?? "Documentos"}
            </span>
            <span
              style={{
                fontSize:           "10px",
                fontWeight:         700,
                padding:            "2px 8px",
                borderRadius:       "var(--radius-full)",
                background:         "var(--color-bg-subtle)",
                border:             "1px solid var(--color-border-faint)",
                color:              "var(--color-text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totalCount !== undefined && totalCount !== docs.length
                ? `${docs.length} de ${totalCount}`
                : docs.length}
            </span>
          </div>

          {/* Search */}
          <div style={{ marginBottom: activeCount > 0 ? "18px" : "8px" }}>
            <SearchInput
              value={filters.search}
              onChange={(v) => setFilters({ ...filters, search: v })}
              placeholder={tl.searchDocument ?? "Buscar documento…"}
              hint="Nombre · embarque · cliente"
            />
          </div>

          {/* Actions row: Nuevo + Filtros */}
          <div
            style={{
              display:      "flex",
              gap:          "6px",
              alignItems:   "center",
              marginBottom: activeCount > 0 ? "8px" : "0",
            }}
          >
            <button
              onClick={() => setDrawerOpen(true)}
              style={filterBtnStyle(activeCount > 0)}
            >
              <IconSliders size={12} />
              <span>{tl.filtersBtn ?? "Filtros"}</span>
              {activeCount > 0 && (
                <span style={filterBtnBadgeStyle}>{activeCount}</span>
              )}
            </button>
            <button onClick={onNew} style={primaryBtnStyle}>
              <IconPlus />
              {tl.newDocument ?? "Subir"}
            </button>
          </div>

          {/* Chips */}
          {activeCount > 0 && (
            <div
              style={{
                display:    "flex",
                flexWrap:   "wrap",
                gap:        "5px",
                alignItems: "center",
              }}
            >
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  style={{
                    display:      "inline-flex",
                    alignItems:   "center",
                    gap:          "5px",
                    height:       "22px",
                    padding:      "0 4px 0 8px",
                    borderRadius: "var(--radius-sm)",
                    background:   "var(--color-info-bg)",
                    border:       "1px solid var(--color-info-border)",
                    color:        "var(--color-info-text)",
                    fontSize:     "10px",
                    fontWeight:   600,
                  }}
                >
                  <span
                    style={{
                      maxWidth:     "180px",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}
                  >
                    {chip.label}
                  </span>
                  <button
                    onClick={chip.onRemove}
                    style={{
                      width:      "16px",
                      height:     "16px",
                      padding:    0,
                      border:     "none",
                      background: "transparent",
                      color:      "inherit",
                      cursor:     "pointer",
                      display:    "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      opacity:    0.7,
                    }}
                  >
                    <IconX size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* LIST */}
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {rows.length === 0 ? (
            <div
              style={{
                height:         "100%",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                color:          "var(--color-text-muted)",
                fontSize:       "13px",
                textAlign:      "center",
                padding:        "20px",
              }}
            >
              <div>
                <IconInbox size={32} />
                <div style={{ marginTop: "8px" }}>
                  {tl.noDocuments2 ?? "Sin documentos"}
                </div>
              </div>
            </div>
          ) : (
            <AutoSizer>
              {({ height }) => (
                <VirtualList
                  items={rows}
                  height={height}
                  itemHeight={itemHeight}
                  renderItem={(row, _index) => (
                    <RowRenderer
                      row={row}
                      selected={selected}
                      setSelected={setSelected}
                      toggleGroup={toggleGroup}
                      locale={locale}
                      tl={tl}
                    />
                  )}
                />
              )}
            </AutoSizer>
          )}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={tl.filtersTitle ?? "Filtros de documentos"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROW RENDERER — decide GROUP_HEADER vs DOC
// ═══════════════════════════════════════════════════════════════════
const RowRenderer = memo(function RowRenderer({
  row,
  selected,
  setSelected,
  toggleGroup,
  locale,
  tl,
}: {
  row:         Row;
  selected:    ShipmentDocument | null;
  setSelected: (d: ShipmentDocument) => void;
  toggleGroup: (key: string) => void;
  locale:      string;
  tl:          any;
}) {
  if (row.kind === "header") {
    return (
      <div
        onClick={() => toggleGroup(row.key)}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "6px",
          padding:      "6px 8px",
          borderRadius: "var(--radius-sm)",
          cursor:       "pointer",
          background:   row.hasSelected
            ? "var(--color-info-bg)"
            : "var(--color-bg-subtle)",
          border:       `1px solid ${row.hasSelected ? "var(--color-info-border)" : "var(--color-border-faint)"}`,
          height:       "calc(100% - 4px)",
          width:        "100%",
          boxSizing:    "border-box",
          overflow:     "hidden",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="2"
          style={{
            transform:  row.isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize:     "11px",
              fontWeight:   700,
              color:        "var(--color-text-primary)",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {row.label}
          </div>
          {row.sub && (
            <div
              style={{
                fontSize:     "9px",
                color:        "var(--color-text-muted)",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}
            >
              {row.sub}
            </div>
          )}
        </div>
        <span
          style={{
            fontSize:     "9px",
            fontWeight:   700,
            padding:      "1px 5px",
            borderRadius: "var(--radius-full)",
            background:   "var(--color-bg-base)",
            border:       "1px solid var(--color-border-faint)",
            color:        "var(--color-text-muted)",
            flexShrink:   0,
          }}
        >
          {row.docCount}
        </span>
      </div>
    );
  }

  // DOC row
  const d = row.doc;
  const isSelected = selected?.id === d.id;
  const catCfg = DOC_CATEGORY_CONFIG[d.category];
  const catLabel =
    tl[
      `cat${d.category
        .split("_")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("")}`
    ] ?? d.category;
  const isExpiringSoon =
    d.expiry_date &&
    new Date(d.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div
      onClick={() => setSelected(d)}
      style={{
        marginLeft:   "12px",
        paddingLeft:  "8px",
        borderLeft:   "2px solid var(--color-border-faint)",
        height:       "calc(100% - 4px)",
        boxSizing:    "border-box",
      }}
    >
      <div
        style={{
          width:        "100%",
          boxSizing:    "border-box",
          overflow:     "hidden",
          padding:      "8px 10px",
          borderRadius: "var(--radius-md)",
          background:   isSelected
            ? "var(--color-bg-active)"
            : "var(--color-bg-base)",
          border:       isSelected
            ? "1px solid var(--color-brand-blue)"
            : "1px solid var(--color-border-faint)",
          cursor:       "pointer",
          display:      "flex",
          flexDirection:"column",
          gap:          "3px",
          transition:   "var(--transition-fast)",
          height:       "100%",
        }}
      >
        {/* ROW 1 — categoría + status dot */}
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
              fontWeight:   700,
              padding:      "1px 5px",
              borderRadius: "var(--radius-full)",
              background:   catCfg.bg,
              color:        catCfg.color,
              border:       `1px solid ${catCfg.border}`,
              flexShrink:   0,
              maxWidth:     "120px",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {catLabel}
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              width:        "7px",
              height:       "7px",
              borderRadius: "50%",
              background:   STATUS_COLORS[d.status],
              flexShrink:   0,
            }}
          />
        </div>

        {/* ROW 2 — nombre */}
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
          {d.name}
        </div>

        {/* ROW 3 — fecha + badges */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            width:          "100%",
          }}
        >
          <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>
            {new Date(d.created_at).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
            })}
          </span>
          <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
            {d.required && (
              <span
                style={{
                  fontSize:     "8px",
                  fontWeight:   700,
                  color:        "var(--color-warning-text)",
                  background:   "var(--color-warning-bg)",
                  border:       "1px solid var(--color-warning-border)",
                  padding:      "0 4px",
                  borderRadius: "3px",
                }}
              >
                REQ
              </span>
            )}
            {isExpiringSoon && (
              <span
                style={{
                  fontSize:     "8px",
                  fontWeight:   700,
                  color:        "var(--color-danger-text)",
                  background:   "var(--color-danger-bg)",
                  border:       "1px solid var(--color-danger-border)",
                  padding:      "0 4px",
                  borderRadius: "3px",
                }}
              >
                VCE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════
// AUTO-SIZER (igual al de VirtualSidebar)
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

// ═══════════════════════════════════════════════════════════════════
// ESTILOS LOCALES
// ═══════════════════════════════════════════════════════════════════
function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    height:       "28px",
    padding:      "0 10px",
    borderRadius: "var(--radius-md)",
    background:   active ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
    border:       `1px solid ${active ? "var(--color-info-border)" : "var(--color-border-faint)"}`,
    color:        active ? "var(--color-info-text)" : "var(--color-text-second)",
    fontSize:     "11px",
    fontWeight:   700,
    cursor:       "pointer",
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "6px",
    whiteSpace:   "nowrap",
  };
}

const filterBtnBadgeStyle: React.CSSProperties = {
  fontSize:           "9px",
  fontWeight:         800,
  padding:            "1px 6px",
  borderRadius:       "var(--radius-full)",
  background:         "var(--color-brand-blue)",
  color:              "#fff",
  fontVariantNumeric: "tabular-nums",
  lineHeight:         1.3,
};

const primaryBtnStyle: React.CSSProperties = {
  flex:           1,
  height:         "28px",
  padding:        "0 12px",
  borderRadius:   "var(--radius-md)",
  background:     "var(--color-brand-blue)",
  border:         "none",
  color:          "#fff",
  fontSize:       "11px",
  fontWeight:     700,
  cursor:         "pointer",
  whiteSpace:     "nowrap",
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  gap:            "5px",
};