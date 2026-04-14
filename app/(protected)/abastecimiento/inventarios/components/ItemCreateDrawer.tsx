"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CreateItemPayload, CostMethod } from "../types/inventarios.types";
import { UNITS, CATEGORIES } from "../types/inventarios.types";

type Props = {
  open:    boolean;
  saving:  boolean;
  onClose: () => void;
  onCreate:(payload: CreateItemPayload) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function ItemCreateDrawer({ open, saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [form, setForm] = useState<Partial<CreateItemPayload>>({
    unit: "pza", cost_method: "average",
    stock_min: 0, stock_max: 0, reorder_point: 0, reorder_qty: 0, unit_cost: 0,
    track_serial: false, track_lot: false, track_expiry: false,
  });
  const [error, setError] = useState<string | null>(null);

  function set(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleCreate() {
    if (!form.name?.trim()) { setError(es ? "El nombre es requerido" : "Name is required"); return; }
    setError(null);
    try {
      await onCreate(form as CreateItemPayload);
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setForm({ unit: "pza", cost_method: "average", stock_min: 0, stock_max: 0, reorder_point: 0, reorder_qty: 0, unit_cost: 0 });
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(560px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {es ? "Nuevo artículo" : "New item"}
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* Nombre y SKU */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Nombre *" : "Name *"}</div>
              <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder={es ? "Tornillo M6 × 20mm" : "M6 × 20mm screw"} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>SKU</div>
              <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} placeholder="SKU-001" style={INPUT} />
            </div>
          </div>

          {/* Categoría y unidad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Categoría" : "Category"}</div>
              <select value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">{es ? "Sin categoría" : "No category"}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Unidad *" : "Unit *"}</div>
              <select value={form.unit ?? "pza"} onChange={(e) => set("unit", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Descripción" : "Description"}</div>
            <textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder={es ? "Descripción detallada…" : "Detailed description…"} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>

          {/* Stock mínimo, máximo, reorden */}
          <div style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Control de stock" : "Stock control"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
              {[
                { k: "stock_min",     l: es ? "Mínimo"    : "Minimum"  },
                { k: "stock_max",     l: es ? "Máximo"    : "Maximum"  },
                { k: "reorder_point", l: es ? "Reorden"   : "Reorder"  },
                { k: "reorder_qty",   l: es ? "Cant. OC"  : "Order qty" },
              ].map((f) => (
                <div key={f.k}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{f.l}</div>
                  <input type="number" min="0" step="0.01" value={(form as any)[f.k] ?? 0} onChange={(e) => set(f.k, Number(e.target.value))} style={{ ...INPUT, height: "30px", fontSize: "12px" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Costo y método */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Costo unitario" : "Unit cost"}</div>
              <input type="number" min="0" step="0.01" value={form.unit_cost ?? 0} onChange={(e) => set("unit_cost", Number(e.target.value))} placeholder="0.00" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Método de costeo" : "Cost method"}</div>
              <select value={form.cost_method ?? "average"} onChange={(e) => set("cost_method", e.target.value as CostMethod)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="average">{es ? "Costo promedio" : "Average cost"}</option>
                <option value="fifo">FIFO</option>
                <option value="lifo">LIFO</option>
                <option value="standard">{es ? "Costo estándar" : "Standard cost"}</option>
              </select>
            </div>
          </div>

          {/* Rastreo */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { k: "track_serial", l: es ? "Rastrear número de serie" : "Track serial number" },
              { k: "track_lot",    l: es ? "Rastrear lote"            : "Track lot number"    },
              { k: "track_expiry", l: es ? "Rastrear caducidad"       : "Track expiry date"   },
            ].map((f) => (
              <label key={f.k} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-second)" }}>
                <input type="checkbox" checked={!!(form as any)[f.k]} onChange={(e) => set(f.k, e.target.checked)} style={{ cursor: "pointer" }} />
                {f.l}
              </label>
            ))}
          </div>

          {/* Notas */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas" : "Notes"}</div>
            <textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>

          {error && (
            <div style={{ padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? "Crear artículo" : "Create item")}
          </button>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
