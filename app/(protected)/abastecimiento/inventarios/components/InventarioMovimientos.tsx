"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { InventoryMovement, Warehouse, MovementFilters, MovementType } from "../types/inventarios.types";
import { MOVEMENT_CONFIG } from "../types/inventarios.types";

type Props = {
  movements:  InventoryMovement[];
  warehouses: Warehouse[];
  loading:    boolean;
  filters:    MovementFilters;
  onFilter:   (f: Partial<MovementFilters>) => void;
  onNew:      () => void;
};

const fmt = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MOVEMENT_TYPES: (MovementType | "all")[] = ["all", "entry", "exit", "transfer", "adjustment", "loss", "return"];

export default function InventarioMovimientos({ movements, warehouses, loading, filters, onFilter, onNew }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const INPUT: React.CSSProperties = {
    height: "34px", padding: "0 10px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* TOOLBAR */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 180px" }}>
          <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onFilter({ search: e.target.value })}
            placeholder={es ? "Buscar por lote, referencia…" : "Search by lot, reference…"}
            style={{ ...INPUT, width: "100%", paddingLeft: "28px", boxSizing: "border-box" }}
          />
        </div>

        <select value={filters.movement_type} onChange={(e) => onFilter({ movement_type: e.target.value as any })} style={INPUT}>
          {MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all"
                ? (es ? "Todos los tipos" : "All types")
                : (es ? MOVEMENT_CONFIG[t as MovementType].labelEs : MOVEMENT_CONFIG[t as MovementType].labelEn)
              }
            </option>
          ))}
        </select>

        <select value={filters.warehouse_id} onChange={(e) => onFilter({ warehouse_id: e.target.value })} style={INPUT}>
          <option value="">{es ? "Todos los almacenes" : "All warehouses"}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <input type="date" value={filters.date_from} onChange={(e) => onFilter({ date_from: e.target.value })} style={{ ...INPUT, width: "130px" }} title={es ? "Fecha desde" : "Date from"} />
        <input type="date" value={filters.date_to}   onChange={(e) => onFilter({ date_to:   e.target.value })} style={{ ...INPUT, width: "130px" }} title={es ? "Fecha hasta" : "Date to"} />

        <button onClick={onNew} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nuevo movimiento" : "New movement"}
        </button>
      </div>

      {/* TABLE */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 120px 80px 90px 90px 90px 90px", padding: "10px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{es ? "Fecha" : "Date"}</span>
          <span>{es ? "Artículo" : "Item"}</span>
          <span>{es ? "Almacén" : "Warehouse"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Tipo" : "Type"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Cantidad" : "Quantity"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Antes" : "Before"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Después" : "After"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Costo" : "Cost"}</span>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
        ) : movements.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Sin movimientos" : "No movements"}</div>
          </div>
        ) : (
          movements.map((mv, i) => {
            const mc = MOVEMENT_CONFIG[mv.movement_type];
            return (
              <div key={mv.id} style={{ display: "grid", gridTemplateColumns: "130px 1fr 120px 80px 90px 90px 90px 90px", padding: "10px 16px", borderBottom: i < movements.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {new Date(mv.created_at).toLocaleDateString(es ? "es-MX" : "en-US")}
                  <div style={{ fontSize: "10px" }}>{new Date(mv.created_at).toLocaleTimeString(es ? "es-MX" : "en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {(mv.item as any)?.name ?? "—"}
                  </div>
                  {mv.source_number && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{mv.source_number}</div>}
                  {mv.lot_number    && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{es ? "Lote:" : "Lot:"} {mv.lot_number}</div>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{(mv.warehouse as any)?.name ?? "—"}</div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", color: mc.color, background: mc.color + "18" }}>
                    {es ? mc.labelEs : mc.labelEn}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 800, color: mc.color, fontVariantNumeric: "tabular-nums" }}>
                  {mc.sign === "+" ? "+" : mc.sign === "-" ? "-" : ""}{fmt(Math.abs(mv.quantity))}
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmt(mv.stock_before)}</div>
                <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{fmt(mv.stock_after)}</div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>${fmt(mv.total_cost)}</div>
              </div>
            );
          })
        )}
      </div>

      {movements.length > 0 && (
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "right" }}>
          {movements.length} {es ? "movimientos" : "movements"}
        </div>
      )}
    </div>
  );
}
