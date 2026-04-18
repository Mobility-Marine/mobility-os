"use client";
import { useEffect, useState } from "react";
import { Field, SectionTitle, INPUT, SELECT } from "../drawerShared";
import { UNITS } from "../../../types/quotations.types";
import { fetchProductBySearch } from "../../../services/quotations.service";
import type { CreateItemPayload } from "../../../types/quotations.types";

type ItemDraft = Omit<CreateItemPayload, "quotation_id">;

type Props = {
  items:     ItemDraft[];
  setItems:  React.Dispatch<React.SetStateAction<ItemDraft[]>>;
  companyId: string;
};

export default function StepItems({ items, setItems, companyId }: Props) {
  const [prodSearch,    setProdSearch]    = useState("");
  const [suggestions,   setSuggestions]   = useState<any[]>([]);
  const [form, setForm] = useState({ sku: "", description: "", details: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0" });

  useEffect(() => {
    if (!prodSearch.trim() || !companyId) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const prods = await fetchProductBySearch(companyId, prodSearch);
      setSuggestions(prods);
    }, 300);
    return () => clearTimeout(timer);
  }, [prodSearch, companyId]);

  function selectProduct(p: any) {
    setForm(prev => ({ ...prev, sku: p.sku ?? "", description: p.name, unit: p.unit ?? "pza", unit_price: String(p.unit_price ?? "") }));
    setSuggestions([]); setProdSearch(p.name);
  }

  function addItem() {
    if (!form.description.trim() || !form.unit_price) return;
    setItems(p => [...p, {
      sku:         form.sku       || undefined,
      description: form.description,
      details:     form.details   || undefined,
      quantity:    Number(form.quantity)     || 1,
      unit:        form.unit,
      unit_price:  Number(form.unit_price)   || 0,
      discount_pct:Number(form.discount_pct) || 0,
    }]);
    setForm({ sku: "", description: "", details: "", quantity: "1", unit: "pza", unit_price: "", discount_pct: "0" });
    setProdSearch(""); setSuggestions([]);
  }

  return (
    <>
      <SectionTitle>Agregar productos</SectionTitle>

      {/* Búsqueda catálogo */}
      <div style={{ position: "relative" }}>
        <Field label="Buscar en catálogo (SKU o nombre)">
          <input value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder="Caja de cartón, SKU-001…" style={INPUT} />
        </Field>
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
            {suggestions.map((p) => (
              <div key={p.id} onClick={() => selectProduct(p)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{p.name}</span>
                  {p.sku && <span style={{ marginLeft: "8px", fontSize: "10px", color: "var(--color-text-muted)" }}>{p.sku}</span>}
                </div>
                <span style={{ fontSize: "12px", color: "var(--color-success-text)", fontWeight: 600 }}>${Number(p.unit_price).toLocaleString()} / {p.unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario */}
      <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
          <Field label="SKU">
            <input value={form.sku} onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="SKU-001" style={INPUT} />
          </Field>
          <Field label="Descripción *">
            <input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Nombre del producto…" style={INPUT} />
          </Field>
        </div>
        <Field label="Detalles / Especificaciones">
          <input value={form.details} onChange={(e) => setForm(p => ({ ...p, details: e.target.value }))} placeholder="Medidas, calibre, color…" style={INPUT} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
          <Field label="Cant. *">
            <input type="number" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} min="0.001" style={INPUT} />
          </Field>
          <Field label="Unidad">
            <select value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))} style={SELECT}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Precio unit. *">
            <input type="number" value={form.unit_price} onChange={(e) => setForm(p => ({ ...p, unit_price: e.target.value }))} placeholder="0.00" style={INPUT} />
          </Field>
          <Field label="Desc. %">
            <input type="number" value={form.discount_pct} onChange={(e) => setForm(p => ({ ...p, discount_pct: e.target.value }))} placeholder="0" min="0" max="100" style={INPUT} />
          </Field>
          <button onClick={addItem} disabled={!form.description.trim() || !form.unit_price} style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Lista */}
      {items.length > 0 && (
        <div style={{ display: "grid", gap: "5px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", alignItems: "center" }}>
              {item.sku && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", background: "var(--color-bg-base)", padding: "1px 5px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-faint)", fontFamily: "monospace" }}>{item.sku}</span>}
              <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.quantity} {item.unit}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
                ${(item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} style={{ width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", cursor: "pointer", color: "var(--color-danger-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
