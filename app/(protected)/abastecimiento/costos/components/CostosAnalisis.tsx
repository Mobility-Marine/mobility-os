"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CostItem, CostFilters } from "../types/costos.types";

type Props = {
  items:    CostItem[];
  loading:  boolean;
  filters:  CostFilters;
  onFilter: (f: Partial<CostFilters>) => void;
  onSelect: (item: CostItem) => void;
};

const fmt  = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const ALERTS = [
  { v: "all",      labelEs: "Todos",             labelEn: "All"              },
  { v: "negative", labelEs: "Margen negativo",    labelEn: "Negative margin"  },
  { v: "low",      labelEs: "Margen bajo (<20%)", labelEn: "Low margin (<20%)"},
  { v: "no_price", labelEs: "Sin precio venta",   labelEn: "No sale price"    },
  { v: "ok",       labelEs: "Margen sano",        labelEn: "Healthy margin"   },
];

export default function CostosAnalisis({ items, loading, filters, onFilter, onSelect }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const INPUT: React.CSSProperties = {
    height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none",
  };

  // Filtros en memoria
  let filtered = items;
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((i) => i.name.toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q) || (i.category ?? "").toLowerCase().includes(q));
  }
  if (filters.category) filtered = filtered.filter((i) => i.category === filters.category);
  if (filters.margin_alert !== "all") {
    filtered = filtered.filter((i) => {
      if (filters.margin_alert === "negative") return i.sale_price > 0 && i.margin_pct < 0;
      if (filters.margin_alert === "low")      return i.sale_price > 0 && i.margin_pct >= 0 && i.margin_pct < 20;
      if (filters.margin_alert === "no_price") return i.sale_price === 0;
      if (filters.margin_alert === "ok")       return i.sale_price > 0 && i.margin_pct >= 20;
      return true;
    });
  }

  // Ordenar
  filtered = [...filtered].sort((a, b) => {
    let va = 0, vb = 0;
    if (filters.sort_by === "name")        { return filters.sort_dir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); }
    if (filters.sort_by === "cost")        { va = a.current_cost;  vb = b.current_cost;  }
    if (filters.sort_by === "margin")      { va = a.margin_pct;    vb = b.margin_pct;    }
    if (filters.sort_by === "stock_value") { va = a.stock_value;   vb = b.stock_value;   }
    if (filters.sort_by === "variation")   { va = a.variation_pct ?? 0; vb = b.variation_pct ?? 0; }
    return filters.sort_dir === "asc" ? va - vb : vb - va;
  });

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort() as string[];

  function marginColor(pct: number, hasPrice: boolean) {
    if (!hasPrice) return "var(--color-text-muted)";
    if (pct < 0)   return "var(--color-danger-text)";
    if (pct < 20)  return "var(--color-warning-text)";
    return "var(--color-success-text)";
  }

  function sort(col: CostFilters["sort_by"]) {
    if (filters.sort_by === col) onFilter({ sort_dir: filters.sort_dir === "asc" ? "desc" : "asc" });
    else onFilter({ sort_by: col, sort_dir: "asc" });
  }

  const SortIcon = ({ col }: { col: CostFilters["sort_by"] }) => (
    <span style={{ marginLeft: "3px", opacity: filters.sort_by === col ? 1 : 0.3, fontSize: "9px" }}>
      {filters.sort_by === col ? (filters.sort_dir === "asc" ? "▲" : "▼") : "▼"}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* TOOLBAR */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={filters.search} onChange={(e) => onFilter({ search: e.target.value })} placeholder={es ? "Buscar por nombre, SKU o categoría…" : "Search by name, SKU or category…"} style={{ ...INPUT, width: "100%", paddingLeft: "28px", boxSizing: "border-box" }} />
        </div>
        <select value={filters.category} onChange={(e) => onFilter({ category: e.target.value })} style={INPUT}>
          <option value="">{es ? "Todas las categorías" : "All categories"}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.margin_alert} onChange={(e) => onFilter({ margin_alert: e.target.value as any })} style={INPUT}>
          {ALERTS.map((a) => <option key={a.v} value={a.v}>{es ? a.labelEs : a.labelEn}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "200px 80px 100px 100px 90px 90px 110px 100px", padding: "10px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span onClick={() => sort("name")} style={{ cursor: "pointer" }}>{es ? "Artículo" : "Item"}<SortIcon col="name"/></span>
          <span style={{ textAlign: "center" }}>{es ? "Unidad" : "Unit"}</span>
          <span style={{ textAlign: "right", cursor: "pointer" }} onClick={() => sort("cost")}>{es ? "Costo" : "Cost"}<SortIcon col="cost"/></span>
          <span style={{ textAlign: "right" }}>{es ? "Precio venta" : "Sale price"}</span>
          <span style={{ textAlign: "right", cursor: "pointer" }} onClick={() => sort("margin")}>{es ? "Margen" : "Margin"}<SortIcon col="margin"/></span>
          <span style={{ textAlign: "right", cursor: "pointer" }} onClick={() => sort("variation")}>{es ? "Variación" : "Variation"}<SortIcon col="variation"/></span>
          <span style={{ textAlign: "right", cursor: "pointer" }} onClick={() => sort("stock_value")}>{es ? "Val. stock" : "Stock val."}<SortIcon col="stock_value"/></span>
          <span>{es ? "Últ. proveedor" : "Last supplier"}</span>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Sin artículos" : "No items"}</div>
          </div>
        ) : (
          filtered.map((item, i) => {
            const mc  = marginColor(item.margin_pct, item.sale_price > 0);
            const vc  = item.variation_pct === null ? null : item.variation_pct > 0 ? "var(--color-danger-text)" : item.variation_pct < 0 ? "var(--color-success-text)" : "var(--color-text-muted)";
            return (
              <div key={item.item_id} onClick={() => onSelect(item)}
                style={{ display: "grid", gridTemplateColumns: "200px 80px 100px 100px 90px 90px 110px 100px", padding: "11px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-faint)" : "none", cursor: "pointer", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.name}</div>
                  <div style={{ display: "flex", gap: "5px", marginTop: "2px" }}>
                    {item.sku && <span style={{ fontSize: "9px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{item.sku}</span>}
                    {item.category && <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{item.category}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)" }}>{item.unit}</div>
                <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>${fmt(item.current_cost)}</div>
                <div style={{ textAlign: "right", fontSize: "12px", color: item.sale_price > 0 ? "var(--color-text-second)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {item.sale_price > 0 ? "$" + fmt(item.sale_price) : "—"}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: mc, fontVariantNumeric: "tabular-nums" }}>
                    {item.sale_price > 0 ? fmtP(item.margin_pct) + "%" : "—"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  {item.variation_pct !== null ? (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: vc ?? "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {item.variation_pct > 0 ? "+" : ""}{fmtP(item.variation_pct)}%
                    </span>
                  ) : <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>—</span>}
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  ${fmt(item.stock_value)}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.last_supplier ?? "—"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
          <span>{filtered.length} {es ? "artículos" : "items"}</span>
          <span>{es ? "Valor total:" : "Total value:"} ${fmt(filtered.reduce((s, i) => s + i.stock_value, 0))}</span>
        </div>
      )}
    </div>
  );
}
