"use client";

import React, { memo, useMemo, useState } from "react";
import type { Product, ProductFilters } from "../types/products.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS SIDEBAR — Virtualizado · escalable a 100K+ productos
//
// Patrón ERP-grade (Linear / Salesforce):
//   - 4 acciones header: Nuevo (primary) + Import + Export + PriceList
//   - Search siempre visible (SKU, nombre, categoría)
//   - Botón "Filtros (N)" → FilterDrawer con Status / Tipo / Categoría
//   - Chips de filtros activos removibles
//   - VirtualList con react-window — escalable a catálogos grandes
//
// Item compacto (2 rows, ~64px alto):
//   Row 1: [SKU pill] · nombre · OFF (si inactivo)
//   Row 2: stock/categoría · precio · margen %
// ═══════════════════════════════════════════════════════════════════

type Props = {
  products:    Product[];           // ya filtrados (vienen del page)
  totalCount?: number;              // total sin filtrar (para "X de Y")
  selected:    Product | null;
  setSelected: (p: Product) => void;
  filters:     ProductFilters;
  setFilters:  (f: ProductFilters) => void;
  categories:  string[];
  onNew:       () => void;
  onImport:    () => void;
  onExport:    () => void;
  onPriceList: () => void;
};

const ITEM_HEIGHT = 64;

// ── Iconos SVG inline (importables en headerActions del VirtualSidebar) ──
const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconUpload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconList = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// ── Etiquetas para chips activos ────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  active:    "Activos",
  inactive:  "Inactivos",
  low_stock: "Bajo mínimo",
  no_stock:  "Sin stock",
};

const TYPE_LABEL: Record<string, string> = {
  product: "Productos",
  service: "Servicios",
};

export default function ProductsSidebar({
  products,
  totalCount,
  selected,
  setSelected,
  filters,
  setFilters,
  categories,
  onNew,
  onImport,
  onExport,
  onPriceList,
}: Props) {
  const { t, lang } = useTranslation();
  const locale = lang === "en" ? "en-US" : "es-MX";
  const tp = (t.products as any) ?? {};
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Construir grupos del FilterDrawer ─────────────────────────────
  const groups: FilterGroup[] = useMemo(() => {
    const g: FilterGroup[] = [
      {
        id: "status",
        label: tp.statusLabel ?? "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters({ ...filters, status: v as ProductFilters["status"] }),
        options: [
          { value: "all",       label: tp.filterAll      ?? "Todos" },
          { value: "active",    label: STATUS_LABEL.active },
          { value: "inactive",  label: STATUS_LABEL.inactive },
          { value: "low_stock", label: STATUS_LABEL.low_stock },
          { value: "no_stock",  label: STATUS_LABEL.no_stock },
        ],
      },
      {
        id: "product_type",
        label: tp.productTypeLabel ?? "Tipo",
        type: "select",
        value: filters.product_type ?? "all",
        onChange: (v) =>
          setFilters({
            ...filters,
            product_type: v as ProductFilters["product_type"],
          }),
        options: [
          { value: "all",     label: tp.filterAll ?? "Todos" },
          { value: "product", label: TYPE_LABEL.product },
          { value: "service", label: TYPE_LABEL.service },
        ],
      },
    ];

    if (categories.length > 0) {
      g.push({
        id: "category",
        label: tp.categoryLabel ?? "Categoría",
        type: "select",
        value: filters.category ?? "",
        onChange: (v) => setFilters({ ...filters, category: v }),
        options: [
          { value: "", label: tp.allCategories ?? "Todas" },
          ...categories.map((c) => ({ value: c, label: c })),
        ],
      });
    }

    return g;
  }, [filters, categories, tp, setFilters]);

  // ── Construir chips activos ───────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];

    if (filters.status !== "all") {
      chips.push({
        id: "status",
        label: `Estado: ${STATUS_LABEL[filters.status] ?? filters.status}`,
        onRemove: () => setFilters({ ...filters, status: "all" }),
      });
    }
    if (filters.product_type && filters.product_type !== "all") {
      chips.push({
        id: "product_type",
        label: `Tipo: ${TYPE_LABEL[filters.product_type] ?? filters.product_type}`,
        onRemove: () => setFilters({ ...filters, product_type: "all" }),
      });
    }
    if (filters.category) {
      chips.push({
        id: "category",
        label: `Categoría: ${filters.category}`,
        onRemove: () => setFilters({ ...filters, category: "" }),
      });
    }

    return chips;
  }, [filters, setFilters]);

  const activeCount = activeChips.length;

  const clearAll = () =>
    setFilters({
      ...filters,
      status: "all",
      product_type: "all",
      category: "",
    });

  return (
    <>
      <VirtualSidebar<Product>
        title={tp.title ?? "Productos"}
        count={products.length}
        totalCount={totalCount}
        search={{
          value: filters.search,
          onChange: (v) => setFilters({ ...filters, search: v }),
          placeholder: tp.search ?? "SKU, nombre o categoría…",
          hint: "SKU · nombre · categoría",
        }}
        headerActions={[
          {
            label: tp.newProduct ?? "Nuevo",
            icon: <IconPlus />,
            onClick: onNew,
            variant: "primary",
          },
          {
            icon: <IconUpload />,
            title: tp.importTitle ?? "Importar CSV",
            onClick: onImport,
          },
          {
            icon: <IconDownload />,
            title: tp.exportBtn ?? "Exportar CSV",
            onClick: onExport,
          },
          {
            icon: <IconList />,
            title: tp.priceList ?? "Lista de precios",
            onClick: onPriceList,
          },
        ]}
        filterButton={{
          activeCount,
          onOpen: () => setDrawerOpen(true),
        }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={products}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(p) => p.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(p, _i, isSelected) => (
          <ProductItem product={p} isSelected={isSelected} locale={locale} tp={tp} />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title: activeCount > 0 || filters.search
            ? tp.noResults ?? "Sin resultados"
            : tp.noProducts ?? "Sin productos",
          description: activeCount > 0 || filters.search
            ? "Ajusta los filtros o limpia la búsqueda"
            : "Crea tu primer producto para empezar",
          action:
            activeCount === 0 && !filters.search
              ? { label: tp.newProduct ?? "Nuevo producto", onClick: onNew }
              : undefined,
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={tp.filtersTitle ?? "Filtros de productos"}
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT ITEM — card compacto del sidebar (memo para react-window)
// ═══════════════════════════════════════════════════════════════════
const ProductItem = memo(function ProductItem({
  product: p,
  isSelected,
  locale,
  tp,
}: {
  product:    Product;
  isSelected: boolean;
  locale:     string;
  tp:         any;
}) {
  const isService = p.product_type === "service";
  const margin =
    p.unit_price > 0 ? ((p.unit_price - p.cost) / p.unit_price) * 100 : 0;

  const stockColor = !p.is_active
    ? "var(--color-text-muted)"
    : p.stock <= 0
    ? "var(--color-danger-text)"
    : p.stock <= p.stock_min
    ? "var(--color-warning-text)"
    : "var(--color-success-text)";

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
        opacity:      p.is_active ? 1 : 0.6,
        transition:   "var(--transition-fast)",
        height:       "calc(100% - 5px)",
      }}
    >
      {/* ROW 1 — SKU + nombre + OFF */}
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
            fontSize:     "9px",
            fontWeight:   800,
            padding:      "1px 5px",
            borderRadius: "var(--radius-sm)",
            background:   "var(--color-bg-base)",
            border:       "1px solid var(--color-border-faint)",
            color:        "var(--color-text-muted)",
            flexShrink:   0,
            fontFamily:   "ui-monospace, monospace",
            maxWidth:     "70px",
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}
        >
          {p.sku}
        </span>
        <span
          style={{
            fontSize:           "12px",
            fontWeight:         700,
            color:              "var(--color-text-primary)",
            flex:               1,
            minWidth:           0,
            overflow:           "hidden",
            textOverflow:       "ellipsis",
            whiteSpace:         "nowrap",
          }}
        >
          {p.name}
        </span>
        {!p.is_active && (
          <span
            style={{
              fontSize:     "9px",
              color:        "var(--color-text-muted)",
              background:   "var(--color-bg-base)",
              padding:      "1px 4px",
              borderRadius: "var(--radius-sm)",
              border:       "1px solid var(--color-border-faint)",
              flexShrink:   0,
            }}
          >
            OFF
          </span>
        )}
      </div>

      {/* ROW 2 — stock/categoría · precio · margen */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          fontSize:   "10px",
          minWidth:   0,
          gap:        "6px",
          width:      "100%",
        }}
      >
        <div
          style={{
            display:    "flex",
            gap:        "6px",
            minWidth:   0,
            overflow:   "hidden",
            flex:       1,
            alignItems: "center",
          }}
        >
          {isService ? (
            <span
              style={{
                color:      "var(--color-info-text)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ⚙ Servicio
            </span>
          ) : (
            <span
              style={{
                color:      stockColor,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow:   "hidden",
                textOverflow: "ellipsis",
                flexShrink: 0,
              }}
            >
              {tp.stock ?? "Stock"}: {p.stock} {p.unit}
            </span>
          )}
          {p.category && (
            <span
              style={{
                color:        "var(--color-text-muted)",
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                minWidth:     0,
              }}
            >
              {p.category}
            </span>
          )}
        </div>
        <div
          style={{
            display:    "flex",
            gap:        "6px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color:              "var(--color-success-text)",
              fontWeight:         700,
              fontVariantNumeric: "tabular-nums",
              whiteSpace:         "nowrap",
            }}
          >
            ${Number(p.unit_price).toLocaleString(locale, {
              maximumFractionDigits: 0,
            })}
          </span>
          {margin > 0 && (
            <span
              style={{
                fontSize:   "9px",
                color:
                  margin >= 30
                    ? "var(--color-success-text)"
                    : margin >= 15
                    ? "var(--color-warning-text)"
                    : "var(--color-danger-text)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {margin.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.product.id === next.product.id &&
  prev.product.updated_at === next.product.updated_at &&
  prev.product.is_active === next.product.is_active &&
  prev.product.stock === next.product.stock &&
  prev.product.unit_price === next.product.unit_price &&
  prev.isSelected === next.isSelected
);