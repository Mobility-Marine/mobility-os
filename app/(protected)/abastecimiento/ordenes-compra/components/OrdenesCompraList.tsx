"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PurchaseOrder, Supplier, POFilters, POStatus } from "../types/ordenes-compra.types";
import { PO_STATUS_CONFIG } from "../types/ordenes-compra.types";

type Props = {
  orders:    PurchaseOrder[];
  suppliers: Supplier[];
  loading:   boolean;
  filters:   POFilters;
  onFilter:  (f: Partial<POFilters>) => void;
  onSelect:  (o: PurchaseOrder) => void;
  onNew:     () => void;
};

const STATUS_OPTIONS: (POStatus | "all")[] = ["all", "draft", "pending_approval", "approved", "sent", "partial", "complete", "cancelled"];
const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrdenesCompraList({ orders, suppliers, loading, filters, onFilter, onSelect, onNew }: Props) {
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
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={filters.search} onChange={(e) => onFilter({ search: e.target.value })} placeholder={es ? "Buscar por número u notas…" : "Search by number or notes…"} style={{ ...INPUT, width: "100%", paddingLeft: "28px", boxSizing: "border-box" }} />
        </div>

        <select value={filters.status} onChange={(e) => onFilter({ status: e.target.value as any })} style={INPUT}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? (es ? "Todos los estados" : "All statuses") : (es ? PO_STATUS_CONFIG[s as POStatus].labelEs : PO_STATUS_CONFIG[s as POStatus].labelEn)}
            </option>
          ))}
        </select>

        <select value={filters.supplier_id} onChange={(e) => onFilter({ supplier_id: e.target.value })} style={INPUT}>
          <option value="">{es ? "Todos los proveedores" : "All suppliers"}</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <input type="date" value={filters.date_from} onChange={(e) => onFilter({ date_from: e.target.value })} style={{ ...INPUT, width: "130px" }} title={es ? "Desde" : "From"} />
        <input type="date" value={filters.date_to}   onChange={(e) => onFilter({ date_to:   e.target.value })} style={{ ...INPUT, width: "130px" }} title={es ? "Hasta" : "To"} />

        <button onClick={onNew} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nueva OC" : "New PO"}
        </button>
      </div>

      {/* TABLE */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 130px 110px 110px 120px", padding: "10px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{es ? "Número" : "Number"}</span>
          <span>{es ? "Proveedor" : "Supplier"}</span>
          <span>{es ? "Fecha esperada" : "Expected date"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Estado" : "Status"}</span>
          <span style={{ textAlign: "right" }}>{es ? "Total" : "Total"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Recibido" : "Received"}</span>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Sin órdenes de compra" : "No purchase orders"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>{es ? "Crea tu primera OC para comenzar" : "Create your first PO to get started"}</div>
          </div>
        ) : (
          orders.map((o, i) => {
            const sc = PO_STATUS_CONFIG[o.status];
            const items = o.items ?? [];
            const totalQty    = items.reduce((s, it) => s + Number(it.quantity), 0);
            const receivedQty = items.reduce((s, it) => s + Number(it.quantity_received ?? 0), 0);
            const pct = totalQty > 0 ? Math.round((receivedQty / totalQty) * 100) : 0;

            return (
              <div key={o.id} onClick={() => onSelect(o)} style={{ display: "grid", gridTemplateColumns: "160px 1fr 130px 110px 110px 120px", padding: "12px 16px", borderBottom: i < orders.length - 1 ? "1px solid var(--color-border-faint)" : "none", cursor: "pointer", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>{o.po_number}</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{o.supplier?.name ?? "—"}</div>
                  {o.supplier?.city && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{o.supplier.city}</div>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {o.expected_date ? new Date(o.expected_date).toLocaleDateString(es ? "es-MX" : "en-US") : "—"}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {es ? sc.labelEs : sc.labelEn}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {o.currency} ${fmt(o.total)}
                </div>
                <div style={{ textAlign: "center" }}>
                  {totalQty > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "var(--color-border-faint)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? "var(--color-success-text)" : "var(--color-brand-blue)", borderRadius: "2px", transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{pct}%</div>
                    </div>
                  ) : <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>—</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {orders.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
          <span>{orders.length} {es ? "órdenes" : "orders"}</span>
          <span>{es ? "Valor total:" : "Total value:"} {orders[0]?.currency ?? "MXN"} ${fmt(orders.reduce((s, o) => s + Number(o.total), 0))}</span>
        </div>
      )}
    </div>
  );
}
