"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { InventoryItem, Warehouse, CreateMovementPayload, MovementType } from "../types/inventarios.types";
import { MOVEMENT_CONFIG } from "../types/inventarios.types";

type Props = {
  open:       boolean;
  items:      InventoryItem[];
  warehouses: Warehouse[];
  saving:     boolean;
  onClose:    () => void;
  onCreate:   (payload: CreateMovementPayload) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

const TYPES: MovementType[] = ["entry", "exit", "adjustment", "transfer", "loss", "return"];

export default function MovimientoDrawer({ open, items, warehouses, saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [form, setForm] = useState({
    item_id:       "",
    warehouse_id:  "",
    movement_type: "entry" as MovementType,
    quantity:      "",
    unit_cost:     "",
    lot_number:    "",
    source_number: "",
    notes:         "",
  });
  const [error, setError] = useState<string | null>(null);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleCreate() {
    if (!form.item_id || !form.warehouse_id || !form.quantity) {
      setError(es ? "Artículo, almacén y cantidad son requeridos" : "Item, warehouse and quantity are required");
      return;
    }
    setError(null);
    try {
      await onCreate({
        item_id:       form.item_id,
        warehouse_id:  form.warehouse_id,
        movement_type: form.movement_type,
        quantity:      Number(form.quantity),
        unit_cost:     form.unit_cost ? Number(form.unit_cost) : undefined,
        lot_number:    form.lot_number    || undefined,
        source_number: form.source_number || undefined,
        notes:         form.notes         || undefined,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setForm({ item_id: "", warehouse_id: "", movement_type: "entry", quantity: "", unit_cost: "", lot_number: "", source_number: "", notes: "" });
    setError(null);
    onClose();
  }

  if (!open) return null;

  const selectedItem = items.find((i) => i.id === form.item_id);
  const mc = MOVEMENT_CONFIG[form.movement_type];

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(520px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {es ? "Registrar movimiento" : "Register movement"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {es ? mc.labelEs : mc.labelEn}
            </div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* Tipo de movimiento */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Tipo de movimiento *" : "Movement type *"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {TYPES.map((t) => {
                const c = MOVEMENT_CONFIG[t];
                const active = form.movement_type === t;
                return (
                  <button key={t} onClick={() => set("movement_type", t)} style={{ padding: "10px 8px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center", background: active ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${active ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: active ? "var(--color-brand-blue)" : c.color }}>
                      {c.sign}
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)", marginTop: "2px" }}>
                      {es ? c.labelEs : c.labelEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Artículo */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Artículo *" : "Item *"}
            </div>
            <select value={form.item_id} onChange={(e) => set("item_id", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">{es ? "Selecciona un artículo…" : "Select an item…"}</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.sku ? ` (${item.sku})` : ""}
                </option>
              ))}
            </select>
            {selectedItem && (
              <div style={{ marginTop: "6px", padding: "8px 10px", background: "var(--color-info-bg)", borderRadius: "var(--radius-sm)", fontSize: "11px", color: "var(--color-info-text)" }}>
                {es ? "Stock actual:" : "Current stock:"} <strong>{Number(selectedItem.total_stock ?? 0).toLocaleString("es-MX")} {selectedItem.unit}</strong>
              </div>
            )}
          </div>

          {/* Almacén */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Almacén *" : "Warehouse *"}
            </div>
            <select value={form.warehouse_id} onChange={(e) => set("warehouse_id", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">{es ? "Selecciona un almacén…" : "Select a warehouse…"}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.is_default ? (es ? " (Principal)" : " (Default)") : ""}</option>)}
            </select>
          </div>

          {/* Cantidad y costo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? "Cantidad *" : "Quantity *"}
              </div>
              <input type="number" min="0.001" step="0.001" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? "Costo unitario" : "Unit cost"}
              </div>
              <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
          </div>

          {/* Lote y referencia */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? "Número de lote" : "Lot number"}
              </div>
              <input value={form.lot_number} onChange={(e) => set("lot_number", e.target.value)} placeholder="LOT-001" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? "Referencia / Doc" : "Reference / Doc"}
              </div>
              <input value={form.source_number} onChange={(e) => set("source_number", e.target.value)} placeholder="OC-2026-001" style={INPUT} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Notas" : "Notes"}
            </div>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={es ? "Observaciones…" : "Notes…"} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Registrando…" : "Saving…") : (es ? "Registrar movimiento" : "Register movement")}
          </button>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
