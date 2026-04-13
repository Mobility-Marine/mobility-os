"use client";

import type { Product, ProductFilters } from "../types/products.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  products:     Product[];
  selected:     Product | null;
  setSelected:  (p: Product) => void;
  filters:      ProductFilters;
  setFilters:   (f: ProductFilters) => void;
  categories:   string[];
  onNew:        () => void;
  onImport:     () => void;
  onExport:     () => void;
};

const STATUS_OPTS = [
  { value: "all",        label: "Todos"         },
  { value: "active",     label: "Activos"       },
  { value: "inactive",   label: "Inactivos"     },
  { value: "low_stock",  label: "Bajo mínimo"   },
  { value: "no_stock",   label: "Sin stock"     },
];

export default function ProductsSidebar({
  products, selected, setSelected, filters, setFilters,
  categories, onNew, onImport, onExport,
}: Props) {
  const { lang } = useTranslation();
  const locale   = lang === "en" ? "en-US" : "es-MX";

  function getStockColor(p: Product) {
    if (!p.is_active)              return "var(--color-text-muted)";
    if (p.stock <= 0)              return "var(--color-danger-text)";
    if (p.stock <= p.stock_min)    return "var(--color-warning-text)";
    return "var(--color-success-text)";
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Productos
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)" }}>
            {products.length}
          </span>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "5px", marginBottom: "10px" }}>
          <button onClick={onNew} style={{
            height: "34px", borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)", color: "#fff", border: "none",
            fontSize: "12px", fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo
          </button>
          <button onClick={onImport} title="Importar CSV" style={{
            width: "34px", height: "34px", borderRadius: "var(--radius-md)",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            color: "var(--color-text-second)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button onClick={onExport} title="Exportar CSV" style={{
            width: "34px", height: "34px", borderRadius: "var(--radius-md)",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            color: "var(--color-text-second)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>

        {/* SEARCH */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
            style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder="SKU, nombre o categoría…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: "100%", height: "32px", paddingLeft: "28px", paddingRight: "8px",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
              fontSize: "12px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* FILTROS */}
        <div style={{ display: "grid", gap: "5px" }}>
          {/* Status */}
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {STATUS_OPTS.map((s) => (
              <button key={s.value} onClick={() => setFilters({ ...filters, status: s.value as any })} style={{
                height: "22px", padding: "0 7px", borderRadius: "var(--radius-full)",
                background: filters.status === s.value ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                border: `1px solid ${filters.status === s.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                color: filters.status === s.value ? "#fff" : "var(--color-text-muted)",
                fontSize: "10px", fontWeight: filters.status === s.value ? 700 : 500,
                cursor: "pointer",
              }}>
                {s.label}
              </button>
            ))}
          </div>
          {/* Categoría */}
          {categories.length > 0 && (
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
                color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer",
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "4px", alignContent: "start" }}>
        {products.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            Sin productos
          </div>
        ) : products.map((p) => {
          const isSelected   = selected?.id === p.id;
          const stockColor   = getStockColor(p);
          const margin       = p.unit_price > 0 ? ((p.unit_price - p.cost) / p.unit_price) * 100 : 0;

          return (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: "9px 11px", borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected ? "1px solid var(--color-brand-blue)" : "1px solid var(--color-border-faint)",
                cursor: "pointer", display: "grid", gap: "3px",
                opacity: p.is_active ? 1 : 0.6,
                transition: "var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* SKU badge */}
                <span style={{
                  fontSize: "9px", fontWeight: 800, padding: "1px 5px", borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
                  color: "var(--color-text-muted)", flexShrink: 0, fontFamily: "monospace",
                }}>
                  {p.sku}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                {!p.is_active && (
                  <span style={{ fontSize: "9px", color: "var(--color-text-muted)", background: "var(--color-bg-base)", padding: "1px 4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
                    OFF
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ color: stockColor, fontWeight: 600 }}>
                    Stock: {p.stock} {p.unit}
                  </span>
                  {p.category && (
                    <span style={{ color: "var(--color-text-muted)" }}>{p.category}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: "var(--color-success-text)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ${Number(p.unit_price).toLocaleString(locale, { maximumFractionDigits: 0 })}
                  </span>
                  {margin > 0 && (
                    <span style={{ fontSize: "9px", color: margin >= 30 ? "var(--color-success-text)" : margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)", fontWeight: 600 }}>
                      {margin.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
