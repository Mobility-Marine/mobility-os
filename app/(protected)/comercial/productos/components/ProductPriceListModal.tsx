"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import type { Product } from "../types/products.types";
import type { PriceListConfig } from "../services/pricelist.service";
import {
  DEFAULT_PRICELIST_CONFIG,
  fetchClientsWithProductHistory,
  fetchProductsQuotedToClient,
  generateAndDownloadPriceList,
} from "../services/pricelist.service";

type FilterMode = "all" | "category" | "client" | "manual";

type Props = {
  open:       boolean;
  onClose:    () => void;
  products:   Product[];
  categories: string[];
};

const TOGGLE_BTN = (active: boolean, color = "var(--color-brand-blue)"): React.CSSProperties => ({
  width: "40px", height: "22px", borderRadius: "11px",
  background: active ? color : "var(--color-border)",
  position: "relative", cursor: "pointer", border: "none",
  transition: "background 0.2s", flexShrink: 0,
});

const TOGGLE_KNOB = (active: boolean): React.CSSProperties => ({
  position: "absolute", top: "3px",
  left: active ? "21px" : "3px",
  width: "16px", height: "16px",
  borderRadius: "50%", background: "#fff",
  transition: "left 0.2s", pointerEvents: "none",
});

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Toggle({ value, onChange, color }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button style={TOGGLE_BTN(value, color)} onClick={() => onChange(!value)}>
      <div style={TOGGLE_KNOB(value)} />
    </button>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
      <span style={{ fontSize: "13px", color: "var(--color-text-second)" }}>{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "14px 18px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function ProductPriceListModal({ open, onClose, products, categories }: Props) {
  const { t, lang }  = useTranslation();
  const { companyId } = useTenant();
  const tp            = (t.products as any) ?? {};
  const locale        = lang === "en" ? "en-US" : "es-MX";

  const [config,         setConfig]         = useState<PriceListConfig>({ ...DEFAULT_PRICELIST_CONFIG, title: tp.plCustomTitleDefault ?? "Lista de precios" });
  const [filterMode,     setFilterMode]     = useState<FilterMode>("all");
  const [selCategory,    setSelCategory]    = useState("");
  const [selClientId,    setSelClientId]    = useState("");
  const [clients,        setClients]        = useState<{ id: string; name: string; count: number }[]>([]);
  const [clientProdIds,  setClientProdIds]  = useState<string[]>([]);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [settings,       setSettings]       = useState<any>(null);
  const [generating,     setGenerating]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // Cargar settings y clientes al abrir
  useEffect(() => {
    if (!open || !companyId) return;
    fetchCompanySettings(companyId).then(setSettings);
    fetchClientsWithProductHistory(companyId).then(setClients);
  }, [open, companyId]);

  // Resetear al abrir
  useEffect(() => {
    if (!open) return;
    setFilterMode("all");
    setSelCategory("");
    setSelClientId("");
    setClientProdIds([]);
    setSelectedIds(new Set());
    setError(null);
  }, [open]);

  // Cargar productos del cliente cuando se selecciona
  useEffect(() => {
    if (!selClientId || !companyId) { setClientProdIds([]); return; }
    fetchProductsQuotedToClient(companyId, selClientId).then(setClientProdIds);
  }, [selClientId, companyId]);

  // Productos a exportar según filtro
  const filteredProducts = useCallback((): Product[] => {
    const active = products.filter((p) => p.is_active);
    switch (filterMode) {
      case "all":      return active;
      case "category": return selCategory ? active.filter((p) => p.category === selCategory) : active;
      case "client":   return selClientId ? active.filter((p) => clientProdIds.includes(p.id)) : [];
      case "manual":   return active.filter((p) => selectedIds.has(p.id));
    }
  }, [products, filterMode, selCategory, selClientId, clientProdIds, selectedIds]);

  const toExport    = filteredProducts();
  const allActive   = products.filter((p) => p.is_active);

  function toggleProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === allActive.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allActive.map((p) => p.id)));
    }
  }

  function setConf<K extends keyof PriceListConfig>(k: K, v: PriceListConfig[K]) {
    setConfig((prev) => ({ ...prev, [k]: v }));
  }

  async function handleDownload() {
    if (toExport.length === 0) { setError(tp.plNoProducts ?? "No hay productos para exportar."); return; }
    setGenerating(true); setError(null);
    try {
      await generateAndDownloadPriceList(toExport, settings, config);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  if (!open) return null;

  const FILTER_MODES: { key: FilterMode; label: string }[] = [
    { key: "all",      label: tp.plFilterAll      ?? "Todos los activos"     },
    { key: "category", label: tp.plFilterCategory ?? "Por categoría"         },
    { key: "client",   label: tp.plFilterClient   ?? "Por cliente"           },
    { key: "manual",   label: tp.plFilterManual   ?? "Selección manual"      },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 501, padding: "20px",
      }}>
        <div style={{
          width: "min(1000px, 100%)", maxHeight: "92vh",
          background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* HEADER */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {tp.priceListTitle ?? "Generar lista de precios"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {tp.priceListSubtitle ?? "Configura y descarga una lista profesional con logo y datos de empresa."}
              </div>
            </div>
            <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* BODY — 2 COLUMNAS */}
          <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 340px", minHeight: 0 }}>

            {/* COLUMNA IZQUIERDA — Filtros + Productos */}
            <div style={{ overflowY: "auto", padding: "18px 20px", display: "grid", gap: "14px", alignContent: "start", borderRight: "1px solid var(--color-border-faint)" }}>

              {/* MODO DE FILTRO */}
              <Section title={tp.plFilterAll ? "Filtro" : "Filtrar productos"}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {FILTER_MODES.map((f) => (
                    <button key={f.key} onClick={() => setFilterMode(f.key)} style={{
                      padding: "8px 12px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                      background: filterMode === f.key ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                      border: `2px solid ${filterMode === f.key ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                      fontSize: "12px", fontWeight: filterMode === f.key ? 700 : 400,
                      color: filterMode === f.key ? "var(--color-brand-blue)" : "var(--color-text-second)",
                    }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sub-filtro por categoría */}
                {filterMode === "category" && (
                  <div style={{ marginTop: "10px" }}>
                    <select value={selCategory} onChange={(e) => setSelCategory(e.target.value)} style={{ ...INPUT }}>
                      <option value="">{tp.plSelectCategory ?? "Seleccionar categoría…"}</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {/* Sub-filtro por cliente */}
                {filterMode === "client" && (
                  <div style={{ marginTop: "10px" }}>
                    {clients.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "8px 0" }}>
                        {tp.plNoClientHistory ?? "Sin historial de cotizaciones de productos."}
                      </div>
                    ) : (
                      <select value={selClientId} onChange={(e) => setSelClientId(e.target.value)} style={{ ...INPUT }}>
                        <option value="">{tp.plSelectClient ?? "Seleccionar cliente…"}</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.count} cotizaciones)</option>
                        ))}
                      </select>
                    )}
                    {selClientId && clientProdIds.length > 0 && (
                      <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--color-info-text)" }}>
                        {clientProdIds.length} productos cotizados a este cliente
                      </div>
                    )}
                  </div>
                )}
              </Section>

              {/* SELECCIÓN MANUAL */}
              {filterMode === "manual" && (
                <Section title={tp.plFilterManual ?? "Selección manual"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {selectedIds.size} {tp.plProductsSelected ?? "productos seleccionados"}
                    </span>
                    <button onClick={toggleAll} style={{
                      height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)",
                      background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                      color: "var(--color-text-second)", fontSize: "11px", cursor: "pointer",
                    }}>
                      {selectedIds.size === allActive.length
                        ? (tp.plDeselectAll ?? "Deseleccionar todos")
                        : (tp.plSelectAll   ?? "Seleccionar todos")}
                    </button>
                  </div>
                  <div style={{ maxHeight: "320px", overflowY: "auto", display: "grid", gap: "4px" }}>
                    {allActive.map((p) => {
                      const isChecked = selectedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          style={{
                            padding: "8px 10px", borderRadius: "var(--radius-md)", cursor: "pointer",
                            background: isChecked ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                            border: `1px solid ${isChecked ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                            display: "flex", gap: "8px", alignItems: "center",
                          }}
                        >
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0,
                            background: isChecked ? "var(--color-brand-blue)" : "var(--color-bg-base)",
                            border: `2px solid ${isChecked ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isChecked && (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--color-text-muted)", flexShrink: 0 }}>{p.sku}</span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                          {p.category && <span style={{ fontSize: "10px", color: "var(--color-text-muted)", flexShrink: 0 }}>{p.category}</span>}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* PREVIEW COUNT */}
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: toExport.length > 0 ? "var(--color-success-bg)" : "var(--color-warning-bg)", border: `1px solid ${toExport.length > 0 ? "var(--color-success-border)" : "var(--color-warning-border)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: toExport.length > 0 ? "var(--color-success-text)" : "var(--color-warning-text)" }}>
                  {toExport.length} {tp.plProductsSelected ?? "productos para exportar"}
                </span>
                {toExport.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {[...new Set(toExport.map((p) => p.category ?? "General"))].slice(0, 4).map((cat) => (
                      <span key={cat} style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", color: "var(--color-success-text)" }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA — Configuración */}
            <div style={{ overflowY: "auto", padding: "18px 20px", display: "grid", gap: "14px", alignContent: "start" }}>

              {/* DATOS DEL DOCUMENTO */}
              <Section title={tp.plCustomTitle ?? "Documento"}>
                <div style={{ display: "grid", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {tp.plCustomTitle ?? "Título"}
                    </div>
                    <input
                      value={config.title}
                      onChange={(e) => setConf("title", e.target.value)}
                      placeholder={tp.plCustomTitleDefault ?? "Lista de precios"}
                      style={INPUT}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {tp.plValidUntil ?? "Vigencia"}
                    </div>
                    <input type="date" value={config.validUntil} onChange={(e) => setConf("validUntil", e.target.value)} style={INPUT} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {tp.plCurrency ?? "Moneda"}
                    </div>
                    <select value={config.currency} onChange={(e) => setConf("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                      {["MXN", "USD", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {tp.plFooterNote ?? "Nota al pie"}
                    </div>
                    <input value={config.footerNote} onChange={(e) => setConf("footerNote", e.target.value)} placeholder={lang === "en" ? "Additional note…" : "Nota adicional…"} style={INPUT} />
                  </div>
                </div>
              </Section>

              {/* PLANTILLA */}
              <Section title={tp.plTemplate ?? "Plantilla"}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {(["elegante", "moderna", "corporativa"] as const).map((tpl) => (
                    <button key={tpl} onClick={() => setConf("template", tpl)} style={{
                      padding: "10px 6px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                      background: config.template === tpl ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                      border: `2px solid ${config.template === tpl ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                    }}>
                      <div style={{ fontSize: "18px", marginBottom: "3px" }}>
                        {tpl === "elegante" ? "✦" : tpl === "moderna" ? "◇" : "▣"}
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: config.template === tpl ? "var(--color-brand-blue)" : "var(--color-text-primary)", textTransform: "capitalize" }}>
                        {tpl}
                      </div>
                    </button>
                  ))}
                </div>
              </Section>

              {/* OPCIONES DE COLUMNAS */}
              <Section title={lang === "en" ? "Columns" : "Columnas"}>
                <ToggleRow label={tp.plShowSku    ?? "Mostrar SKU"}           value={config.showSku}    onChange={(v) => setConf("showSku",    v)} />
                <ToggleRow label={tp.plShowPrices ?? "Mostrar precios"}        value={config.showPrices} onChange={(v) => setConf("showPrices", v)} />
                <ToggleRow label={tp.plShowIva    ?? "Mostrar precio con IVA"} value={config.showIva}    onChange={(v) => setConf("showIva",    v)} />
              </Section>

              {/* EMPRESA */}
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "11px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
                {tp.plPreviewInfo ?? "El PDF incluirá logo y datos fiscales de la empresa configurados en Settings."}
                {settings?.logo_url && (
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Logo configurado
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            {error && (
              <div style={{ flex: 1, fontSize: "12px", color: "var(--color-danger-text)" }}>{error}</div>
            )}
            {!error && <div style={{ flex: 1 }} />}
            <button onClick={onClose} style={{
              height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer",
            }}>
              {t.general.cancel}
            </button>
            <button onClick={handleDownload} disabled={generating || toExport.length === 0} style={{
              height: "40px", padding: "0 24px", borderRadius: "var(--radius-md)",
              background: toExport.length > 0 ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
              color: toExport.length > 0 ? "#fff" : "var(--color-text-muted)", border: "none",
              fontSize: "13px", fontWeight: 700, cursor: generating || toExport.length === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              opacity: generating ? 0.7 : 1,
            }}>
              {generating ? (
                tp.plGenerating ?? "Generando PDF…"
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {tp.plDownload ?? "Descargar lista de precios"}
                  {toExport.length > 0 && ` (${toExport.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
