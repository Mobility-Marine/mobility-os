"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { InventoryItem, Warehouse, InventoryFilters } from "../types/inventarios.types";

type Props = {
  items:      InventoryItem[];
  warehouses: Warehouse[];
  loading:    boolean;
  filters:    InventoryFilters;
  onFilter:   (f: Partial<InventoryFilters>) => void;
  onSelect:   (item: InventoryItem) => void;
  onNewItem:  () => void;
  onNewMovement: () => void;
};

const ALERT_OPTIONS = [
  { value: "all",        labelEs: "Todas",           labelEn: "All"             },
  { value: "below_min",  labelEs: "Bajo mínimo",     labelEn: "Below min"       },
  { value: "at_reorder", labelEs: "Punto reorden",   labelEn: "At reorder"      },
  { value: "zero_stock", labelEs: "Sin stock",       labelEn: "Zero stock"      },
];

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InventarioStock({ items, warehouses, loading, filters, onFilter, onSelect, onNewItem, onNewMovement }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const INPUT: React.CSSProperties = {
    height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none",
  };

  function getStockAlert(item: InventoryItem): "danger" | "warning" | "ok" | "empty" {
    const ts = item.total_stock ?? 0;
    if (ts === 0)                                                return "empty";
    if (item.stock_min > 0 && ts < item.stock_min)              return "danger";
    if (item.reorder_point > 0 && ts <= item.reorder_point)     return "warning";
    return "ok";
  }

  const alertColors = {
    danger:  { color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
    warning: { color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
    ok:      { color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
    empty:   { color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* TOOLBAR */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onFilter({ search: e.target.value })}
            placeholder={es ? "Buscar por nombre o SKU…" : "Search by name or SKU…"}
            style={{ ...INPUT, width: "100%", paddingLeft: "28px", boxSizing: "border-box" }}
          />
        </div>

        <select value={filters.warehouse_id} onChange={(e) => onFilter({ warehouse_id: e.target.value })} style={INPUT}>
          <option value="">{es ? "Todos los almacenes" : "All warehouses"}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <select value={filters.alert} onChange={(e) => onFilter({ alert: e.target.value as any })} style={INPUT}>
          {ALERT_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>{es ? a.labelEs : a.labelEn}</option>
          ))}
        </select>

        <button onClick={onNewMovement} style={{ height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          {es ? "Registrar movimiento" : "Register movement"}
        </button>

        <button onClick={onNewItem} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nuevo artículo" : "New item"}
        </button>
      </div>

      {/* TABLE */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {/* Head */}
        <div style={{ display: "grid", gridTemplateColumns: "40px 200px 80px 80px 90px 90px 90px 100px 110px", padding: "10px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span></span>
          <span>{es ? "Artículo" : "Item"}</span>
          <span>{es ? "SKU" : "SKU"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Unidad" : "Unit"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Disponible" : "Available"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Mínimo" : "Minimum"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Reorden" : "Reorder"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Costo prom." : "Avg. cost"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Valor total" : "Total value"}</span>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
            {es ? "Cargando…" : "Loading…"}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📦</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Sin artículos" : "No items"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {es ? "Agrega artículos al inventario para comenzar" : "Add items to inventory to get started"}
            </div>
          </div>
        ) : (
          items.map((item, i) => {
            const alert = getStockAlert(item);
            const ac = alertColors[alert];
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                style={{ display: "grid", gridTemplateColumns: "40px 200px 80px 80px 90px 90px 90px 100px 110px", padding: "11px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", cursor: "pointer", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Indicador de alerta */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ac.color }} />
                </div>
                {/* Nombre */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.name}</div>
                  {item.category && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.category}</div>}
                </div>
                {/* SKU */}
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{item.sku ?? "—"}</div>
                {/* Unidad */}
                <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)" }}>{item.unit}</div>
                {/* Stock disponible */}
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: ac.color, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(item.total_stock ?? 0)}
                  </span>
                </div>
                {/* Mínimo */}
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {item.stock_min > 0 ? fmt(item.stock_min) : "—"}
                </div>
                {/* Reorden */}
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {item.reorder_point > 0 ? fmt(item.reorder_point) : "—"}
                </div>
                {/* Costo promedio */}
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-second)", fontVariantNumeric: "tabular-nums" }}>
                  ${fmt(item.unit_cost)}
                </div>
                {/* Valor total */}
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  ${fmt(item.total_value ?? 0)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
          <span>{items.length} {es ? "artículos" : "items"}</span>
          <span>{es ? "Valor total:" : "Total value:"} ${fmt(items.reduce((s, i) => s + (i.total_value ?? 0), 0))}</span>
        </div>
      )}
    </div>
  );
}
