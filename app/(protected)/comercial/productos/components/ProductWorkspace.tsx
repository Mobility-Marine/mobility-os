"use client";

import { useState } from "react";
import type { Product } from "../types/products.types";
import { PRODUCT_MODULE_LINKS } from "../types/products.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Tab = "info" | "fiscal" | "stock" | "connections";

type Props = {
  product:  Product | null;
  onUpdate: (id: string, updates: Partial<Product>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  saving:   boolean;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function ProductWorkspace({ product, onUpdate, onDelete, onToggle, saving }: Props) {
  const { t, lang } = useTranslation();
  const locale      = lang === "en" ? "en-US" : "es-MX";
  const tp          = (t.products as any) ?? {};

  const [tab,     setTab]     = useState<Tab>("info");
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<Partial<Product>>({});
  const [confirm, setConfirm] = useState(false);

  if (!product) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "32px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", height: "100%",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {tp.title ? `${tp.selectProduct ?? "Selecciona un producto"}` : "Selecciona un producto"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
          {tp.connectionsDesc ?? "Aquí verás el detalle, información fiscal, stock y conexiones con otros módulos."}
        </div>
      </div>
    );
  }

  const margin = product.unit_price > 0
    ? ((product.unit_price - product.cost) / product.unit_price) * 100
    : 0;

  const TABS: { key: Tab; label: string }[] = [
    { key: "info",        label: tp.tabInfo        ?? "Información"  },
    { key: "fiscal",      label: tp.tabFiscal      ?? "Fiscal / SAT" },
    { key: "stock",       label: tp.tabStock       ?? "Stock"        },
    { key: "connections", label: tp.tabConnections ?? "Conexiones"   },
  ];

  function startEdit() { setForm({ ...product }); setEditing(true); }

  async function saveEdit() {
    await onUpdate(product.id, form);
    setEditing(false);
    setForm({});
  }

  function set(k: keyof Product, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  const stockColor = !product.is_active        ? "var(--color-text-muted)"
    : product.stock <= 0                        ? "var(--color-danger-text)"
    : product.stock <= product.stock_min        ? "var(--color-warning-text)"
    : "var(--color-success-text)";

  // Field labels para el form de edición
  const infoFields = [
    { k: "sku",        label: tp.sku       ?? "SKU",      type: "text"   },
    { k: "name",       label: tp.name      ?? "Nombre",   type: "text"   },
    { k: "category",   label: tp.category  ?? "Categoría",type: "text"   },
    { k: "unit",       label: tp.unit      ?? "Unidad",   type: "text"   },
    { k: "unit_price", label: tp.unitPrice ?? "Precio",   type: "number" },
    { k: "cost",       label: tp.cost      ?? "Costo",    type: "number" },
    { k: "currency",   label: tp.currency  ?? "Moneda",   type: "text"   },
    { k: "tax_rate",   label: tp.taxRate   ?? "IVA %",    type: "number" },
  ];

  const infoRows = [
    { label: tp.sku       ?? "SKU",      value: product.sku },
    { label: tp.unit      ?? "Unidad",   value: product.unit },
    { label: tp.category  ?? "Categoría",value: product.category },
    { label: tp.currency  ?? "Moneda",   value: product.currency },
    { label: tp.unitPrice ?? "Precio",   value: `${product.currency} $${Number(product.unit_price).toLocaleString(locale, { minimumFractionDigits: 2 })}` },
    { label: tp.cost      ?? "Costo",    value: `${product.currency} $${Number(product.cost).toLocaleString(locale, { minimumFractionDigits: 2 })}` },
    { label: tp.taxRate   ?? "IVA",      value: `${product.tax_rate}%` },
    { label: tp.margin    ?? "Margen",   value: `${margin.toFixed(1)}%` },
  ];

  const fiscalFields = [
    { k: "sat_product_code",   label: tp.satProductCode   ?? "Clave de producto SAT",      placeholder: "ej: 14111500" },
    { k: "sat_unit_code",      label: tp.satUnitCode      ?? "Clave de unidad SAT",         placeholder: "ej: H87 (Pieza)" },
    { k: "tariff_code",        label: tp.tariffCode       ?? "Fracción arancelaria",        placeholder: "ej: 4819.10.01" },
    { k: "tariff_description", label: tp.tariffDescription?? "Descripción de la fracción",  placeholder: "ej: Cajas de cartón corrugado" },
    { k: "country_of_origin",  label: tp.countryOfOrigin  ?? "País de origen",              placeholder: "México" },
  ];

  const fiscalRows = [
    { label: tp.satProductCode    ?? "Clave de producto SAT",     value: product.sat_product_code,    required: true,  module: "Facturación CFDI" },
    { label: tp.satUnitCode       ?? "Clave de unidad SAT",       value: product.sat_unit_code,       required: true,  module: "Facturación CFDI" },
    { label: tp.tariffCode        ?? "Fracción arancelaria",      value: product.tariff_code,         required: false, module: "Carta Porte / Comercio Exterior" },
    { label: tp.tariffDescription ?? "Descripción de la fracción",value: product.tariff_description,  required: false, module: "Carta Porte / Comercio Exterior" },
    { label: tp.countryOfOrigin   ?? "País de origen",            value: product.country_of_origin,   required: false, module: "Comercio Exterior" },
  ];

  const stockKpis = [
    { label: tp.stockCurrent   ?? "Stock actual",    value: `${product.stock} ${product.unit}`,     color: stockColor },
    { label: tp.stockMinLabel  ?? "Stock mínimo",    value: `${product.stock_min} ${product.unit}`, color: "var(--color-text-muted)" },
    { label: tp.warehouseValue ?? "Valor en bodega", value: `$${(product.stock * product.unit_price).toLocaleString(locale, { maximumFractionDigits: 0 })}`, color: "var(--color-success-text)" },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 800, padding: "2px 7px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                {product.sku}
              </span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {product.name}
              </span>
              {product.category && (
                <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-info-text)" }}>
                  {product.category}
                </span>
              )}
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-full)", background: product.is_active ? "var(--color-success-bg)" : "var(--color-bg-subtle)", border: `1px solid ${product.is_active ? "var(--color-success-border)" : "var(--color-border-faint)"}`, color: product.is_active ? "var(--color-success-text)" : "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                {product.is_active ? (tp.active ?? "Activo") : (tp.inactive ?? "Inactivo")}
              </span>
            </div>
            {product.description && (
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                {product.description}
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {product.currency} ${Number(product.unit_price).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {tp.cost ?? "Costo"}: ${Number(product.cost).toLocaleString(locale, { minimumFractionDigits: 2 })} · {tp.margin ?? "Margen"}: <span style={{ color: margin >= 30 ? "var(--color-success-text)" : margin >= 15 ? "var(--color-warning-text)" : "var(--color-danger-text)", fontWeight: 700 }}>{margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {!editing ? (
            <button onClick={startEdit} style={{
              height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
              background: "var(--color-brand-blue)", color: "#fff", border: "none",
              fontSize: "11px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "5px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {tp.edit ?? "Editar"}
            </button>
          ) : (
            <>
              <button onClick={saveEdit} disabled={saving} style={{
                height: "28px", padding: "0 14px", borderRadius: "var(--radius-md)",
                background: "var(--color-success-text)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
              }}>
                {saving ? t.general.loading : `✓ ${tp.save ?? "Guardar"}`}
              </button>
              <button onClick={() => { setEditing(false); setForm({}); }} style={{
                height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
              }}>
                {tp.cancel ?? "Cancelar"}
              </button>
            </>
          )}
          <button onClick={() => onToggle(product.id, !product.is_active)} style={{
            height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
            background: product.is_active ? "var(--color-warning-bg)" : "var(--color-success-bg)",
            border: `1px solid ${product.is_active ? "var(--color-warning-border)" : "var(--color-success-border)"}`,
            color: product.is_active ? "var(--color-warning-text)" : "var(--color-success-text)",
            fontSize: "11px", fontWeight: 600, cursor: "pointer",
          }}>
            {product.is_active ? (tp.deactivate ?? "Desactivar") : (tp.activate ?? "Activar")}
          </button>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} style={{
              height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {tp.delete ?? "Eliminar"}
            </button>
          ) : (
            <>
              <button onClick={() => onDelete(product.id)} style={{
                height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)",
                background: "var(--color-danger-text)", color: "#fff", border: "none",
                fontSize: "11px", fontWeight: 700, cursor: "pointer",
              }}>
                {tp.confirmDelete ?? "¿Confirmar?"}
              </button>
              <button onClick={() => setConfirm(false)} style={{
                height: "28px", padding: "0 8px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
              }}>
                {t.general.no ?? "No"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            height: "36px", padding: "0 14px", border: "none", background: "transparent",
            borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
            color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400,
            cursor: "pointer", transition: "var(--transition-fast)",
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

        {/* ── INFO ── */}
        {tab === "info" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {infoFields.map((f) => (
                  <div key={f.k}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    <input type={f.type} value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof Product, f.type === "number" ? Number(e.target.value) : e.target.value)} style={INPUT} />
                  </div>
                ))}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tp.description ?? "Descripción"}</div>
                  <textarea value={(form as any).description ?? ""} onChange={(e) => set("description", e.target.value)} rows={2} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tp.notes ?? "Notas"}</div>
                  <textarea value={(form as any).notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {infoRows.map((r) => r.value ? (
                    <div key={r.label}>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{r.label}</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{r.value}</div>
                    </div>
                  ) : null)}
                </div>
                {product.description && (
                  <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>
                    {product.description}
                  </div>
                )}
                {product.notes && (
                  <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
                    {product.notes}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── FISCAL / SAT ── */}
        {tab === "fiscal" && (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
              {tp.fiscalInfo ?? "Estos datos son obligatorios para generar CFDI 4.0. La clave de producto y unidad se usan en Facturación. La fracción arancelaria se usa en Carta Porte y Comercio Exterior."}
            </div>
            {editing ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {fiscalFields.map((f) => (
                  <div key={f.k}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                    <input value={(form as any)[f.k] ?? ""} onChange={(e) => set(f.k as keyof Product, e.target.value)} placeholder={f.placeholder} style={INPUT} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "10px" }}>
                {fiscalRows.map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{r.label}</div>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{r.module}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {r.value ? (
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)", fontFamily: "monospace" }}>
                          {r.value}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-full)",
                          background: r.required ? "var(--color-danger-bg)" : "var(--color-bg-base)",
                          border: `1px solid ${r.required ? "var(--color-danger-border)" : "var(--color-border-faint)"}`,
                          color: r.required ? "var(--color-danger-text)" : "var(--color-text-muted)",
                          fontWeight: r.required ? 700 : 400,
                        }}>
                          {r.required ? (lang === "en" ? "Required" : "Requerido") : (lang === "en" ? "Not set" : "No configurado")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STOCK ── */}
        {tab === "stock" && (
          <div style={{ display: "grid", gap: "12px" }}>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tp.stockCurrent ?? "Stock actual"}</div>
                  <input type="number" value={(form as any).stock ?? 0} onChange={(e) => set("stock", Number(e.target.value))} min="0" style={INPUT} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tp.stockMinLabel ?? "Stock mínimo"}</div>
                  <input type="number" value={(form as any).stock_min ?? 0} onChange={(e) => set("stock_min", Number(e.target.value))} min="0" style={INPUT} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {stockKpis.map((k) => (
                    <div key={k.label} style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{k.label}</div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                    <span>0</span>
                    <span>{tp.stockMinLabel ?? "Mínimo"}: {product.stock_min}</span>
                    <span>{tp.stockCurrent ?? "Actual"}: {product.stock}</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", position: "relative" }}>
                    {product.stock_min > 0 && (
                      <div style={{
                        position: "absolute", left: `${Math.min((product.stock_min / Math.max(product.stock, product.stock_min * 1.5)) * 100, 90)}%`,
                        top: 0, bottom: 0, width: "2px", background: "var(--color-warning-text)", zIndex: 2,
                      }} />
                    )}
                    <div style={{
                      height: "100%", borderRadius: "var(--radius-full)", background: stockColor,
                      width: `${product.stock_min > 0 ? Math.min((product.stock / (product.stock_min * 3)) * 100, 100) : Math.min(product.stock, 100)}%`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  {product.stock <= 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: 700, color: "var(--color-danger-text)" }}>
                      {tp.outOfStock ?? "Sin stock — actualiza desde Inventario o Recepciones"}
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= product.stock_min && (
                    <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)" }}>
                      {tp.belowMin ?? "Bajo mínimo — considera reabastecer"}
                    </div>
                  )}
                </div>

                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.5 }}>
                  {tp.stockInfo ?? "El stock se actualiza automáticamente desde Recepciones (aumenta) y Pedidos (disminuye)."}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CONNECTIONS ── */}
        {tab === "connections" && (
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px", lineHeight: 1.6 }}>
              {tp.connectionsDesc ?? "Este producto está conectado con los siguientes módulos del sistema."}
            </div>
            {PRODUCT_MODULE_LINKS.map((link) => {
              const moduleColor: Record<string, string> = {
                cotizaciones:      "var(--color-brand-blue)",
                pedidos:           "var(--color-success-text)",
                facturacion:       "var(--color-warning-text)",
                carta_porte:       "var(--color-info-text)",
                comercio_exterior: "#a78bfa",
                compras:           "#f59e0b",
                inventario:        "var(--color-success-text)",
              };
              const color = moduleColor[link.module] ?? "var(--color-text-muted)";
              return (
                <div key={link.module} style={{
                  padding: "12px 14px", borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
                  display: "flex", gap: "12px", alignItems: "flex-start",
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, marginTop: "4px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                      {link.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px" }}>
                      {link.description}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {link.field.split(", ").map((f) => (
                        <span key={f} style={{ fontSize: "10px", fontFamily: "monospace", padding: "1px 6px", borderRadius: "var(--radius-sm)", background: `${color}15`, border: `1px solid ${color}30`, color }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
