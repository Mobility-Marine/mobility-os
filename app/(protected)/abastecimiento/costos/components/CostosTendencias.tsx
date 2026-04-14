"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CostItem, PriceHistory, SupplierComparison } from "../types/costos.types";

type Props = {
  items:       CostItem[];
  selected:    CostItem | null;
  history:     PriceHistory[];
  suppliers:   SupplierComparison[];
  loading:     boolean;
  saving:      boolean;
  onSelect:    (item: CostItem | null) => void;
  onAddPrice:  (itemId: string, supplierId: string | null, price: number, currency: string, notes?: string) => Promise<void>;
};

const fmt  = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Mini SVG Line Chart ────────────────────────────────────────
function PriceLineChart({ data }: { data: { date: string; price: number }[] }) {
  if (data.length < 2) return null;
  const W = 520, H = 120, P = { t: 10, r: 10, b: 30, l: 50 };
  const cW = W - P.l - P.r;
  const cH = H - P.t - P.b;
  const prices = data.map((d) => d.price);
  const maxP = Math.max(...prices);
  const minP = Math.min(...prices);
  const range = maxP - minP || 1;

  const xS = (i: number) => (i / (data.length - 1)) * cW;
  const yS = (v: number) => cH - ((v - minP) / range) * cH;

  const pts = data.map((d, i) => `${P.l + xS(i)},${P.t + yS(d.price)}`).join(" ");
  const areaBottom = `${P.l + xS(data.length - 1)},${P.t + cH} ${P.l},${P.t + cH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {/* Area fill */}
      <polygon points={`${pts} ${areaBottom}`} fill="var(--color-brand-blue)" fillOpacity="0.07" />
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => (
        <line key={i} x1={P.l} y1={P.t + cH * (1 - t)} x2={P.l + cW} y2={P.t + cH * (1 - t)}
          stroke="var(--color-border-faint)" strokeWidth="1" />
      ))}
      {/* Y labels */}
      {[0, 0.5, 1].map((t, i) => (
        <text key={i} x={P.l - 4} y={P.t + cH * (1 - t) + 3.5} textAnchor="end" fontSize="8" fill="var(--color-text-muted)">
          {fmt(minP + range * t)}
        </text>
      ))}
      {/* Line */}
      <polyline points={pts} fill="none" stroke="var(--color-brand-blue)" strokeWidth="2" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={P.l + xS(i)} cy={P.t + yS(d.price)} r="3.5"
          fill="var(--color-bg-base)" stroke="var(--color-brand-blue)" strokeWidth="2" />
      ))}
      {/* X labels — first and last */}
      <text x={P.l} y={H - 5} fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">
        {new Date(data[0].date).toLocaleDateString("es-MX", { month: "short", year: "2-digit" })}
      </text>
      <text x={P.l + cW} y={H - 5} fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">
        {new Date(data[data.length - 1].date).toLocaleDateString("es-MX", { month: "short", year: "2-digit" })}
      </text>
    </svg>
  );
}

export default function CostosTendencias({ items, selected, history, suppliers, loading, saving, onSelect, onAddPrice }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [priceForm, setPriceForm] = useState({ supplier_id: "", price: "", currency: "MXN", notes: "" });

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.name.toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q);
  });

  const chartData = [...history]
    .reverse()
    .map((h) => ({ date: h.recorded_at, price: Number(h.unit_price) }));

  const prices = history.map((h) => Number(h.unit_price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const avgPrice = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;

  async function handleAddPrice() {
    if (!selected || !priceForm.price) return;
    await onAddPrice(
      selected.item_id,
      priceForm.supplier_id || null,
      Number(priceForm.price),
      priceForm.currency,
      priceForm.notes || undefined
    );
    setShowForm(false);
    setPriceForm({ supplier_id: "", price: "", currency: "MXN", notes: "" });
  }

  const INPUT: React.CSSProperties = {
    height: "32px", padding: "0 10px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
    color: "var(--color-text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", minHeight: "500px" }}>

      {/* PANEL IZQUIERDO: selector de producto */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={es ? "Buscar artículo…" : "Search item…"} style={{ ...INPUT, width: "100%", paddingLeft: "26px" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "520px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {filtered.map((item) => (
            <div key={item.item_id} onClick={() => onSelect(selected?.item_id === item.item_id ? null : item)}
              style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", cursor: "pointer", background: selected?.item_id === item.item_id ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `1px solid ${selected?.item_id === item.item_id ? "var(--color-info-border)" : "var(--color-border-faint)"}`, transition: "all 0.15s" }}>
              <div style={{ fontSize: "12px", fontWeight: selected?.item_id === item.item_id ? 700 : 600, color: selected?.item_id === item.item_id ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{item.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{item.sku ?? item.category ?? ""}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)" }}>${fmt(item.current_cost)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DERECHO: historial */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Selecciona un artículo" : "Select an item"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{es ? "Ver historial de precios y tendencias de costo." : "View price history and cost trends."}</div>
          </div>
        ) : (
          <>
            {/* Header del producto */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{selected.name}</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
                  {selected.sku && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{selected.sku}</span>}
                  {selected.category && <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{selected.category}</span>}
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)" }}>{selected.unit}</span>
                </div>
              </div>
              <button onClick={() => setShowForm((p) => !p)} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                + {es ? "Registrar precio" : "Add price"}
              </button>
            </div>

            {/* Form registro manual */}
            {showForm && (
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 100px 80px 1fr auto", gap: "8px", alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Precio nuevo *" : "New price *"}</div>
                  <input type="number" min="0" value={priceForm.price} onChange={(e) => setPriceForm((p) => ({ ...p, price: e.target.value }))} placeholder="0.00" style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "3px", textTransform: "uppercase" }}>{es ? "Moneda" : "Currency"}</div>
                  <select value={priceForm.currency} onChange={(e) => setPriceForm((p) => ({ ...p, currency: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                    {["MXN","USD","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={handleAddPrice} disabled={!priceForm.price || saving} style={{ height: "32px", padding: "0 12px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>✓</button>
                  <button onClick={() => setShowForm(false)} style={{ height: "32px", padding: "0 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando historial…" : "Loading history…"}</div>
            ) : (
              <>
                {/* KPIs de precios */}
                {history.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {[
                      { l: es ? "Precio actual"     : "Current price",  v: "$" + fmt(selected.current_cost), c: "var(--color-brand-blue)"   },
                      { l: es ? "Precio mínimo"     : "Min price",      v: "$" + fmt(minPrice),              c: "var(--color-success-text)" },
                      { l: es ? "Precio máximo"     : "Max price",      v: "$" + fmt(maxPrice),              c: "var(--color-danger-text)"  },
                      { l: es ? "Precio promedio"   : "Avg price",      v: "$" + fmt(avgPrice),              c: "var(--color-text-primary)" },
                    ].map((s) => (
                      <div key={s.l} style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gráfico */}
                {chartData.length >= 2 && (
                  <div style={{ padding: "12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      {es ? "Evolución del precio" : "Price evolution"} ({history.length} {es ? "registros" : "records"})
                    </div>
                    <PriceLineChart data={chartData} />
                  </div>
                )}

                {/* Historial tabla */}
                {history.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-muted)", fontSize: "12px" }}>
                    {es ? "Sin historial de precios. Registra el primer precio manualmente o crea una OC." : "No price history. Register the first price manually or create a PO."}
                  </div>
                ) : (
                  <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "130px 110px 100px 80px 80px 1fr", padding: "8px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <span>{es ? "Fecha" : "Date"}</span>
                      <span style={{ textAlign: "right" }}>{es ? "Precio" : "Price"}</span>
                      <span>{es ? "Proveedor" : "Supplier"}</span>
                      <span style={{ textAlign: "center" }}>{es ? "Origen" : "Source"}</span>
                      <span style={{ textAlign: "center" }}>{es ? "Moneda" : "Currency"}</span>
                      <span>{es ? "OC / Notas" : "PO / Notes"}</span>
                    </div>
                    {history.slice(0, 20).map((h, i) => (
                      <div key={h.id} style={{ display: "grid", gridTemplateColumns: "130px 110px 100px 80px 80px 1fr", padding: "8px 14px", borderBottom: i < history.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {new Date(h.recorded_at).toLocaleDateString(es ? "es-MX" : "en-US")}
                        </div>
                        <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>${fmt(h.unit_price)}</div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-second)" }}>{(h.supplier as any)?.name ?? "—"}</div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "var(--radius-full)", background: h.source === "purchase_order" ? "var(--color-info-bg)" : h.source === "import" ? "#f3e8ff" : "var(--color-bg-subtle)", color: h.source === "purchase_order" ? "var(--color-brand-blue)" : h.source === "import" ? "#7c3aed" : "var(--color-text-muted)" }}>
                            {h.source === "purchase_order" ? "OC" : h.source === "import" ? "IMP" : "MAN"}
                          </span>
                        </div>
                        <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)" }}>{h.currency}</div>
                        <div style={{ fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(h.po as any)?.po_number ?? h.notes ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
