"use client";
import { useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { InventoryCount, Warehouse, CountStatus } from "../types/inventarios.types";
import { COUNT_STATUS_CONFIG } from "../types/inventarios.types";

type Props = {
  counts:      InventoryCount[];
  warehouses:  Warehouse[];
  loading:     boolean;
  saving:      boolean;
  onCreate:    (warehouseId: string, countDate: string, notes?: string) => Promise<void>;
  onLoadDetail:(id: string) => Promise<void>;
  selectedCount: InventoryCount | null;
  onUpdateItem:(itemId: string, qty: number, notes?: string) => Promise<void>;
  onComplete:  (countId: string) => Promise<void>;
  onClose:     () => void;
};

const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InventarioConteos({
  counts, warehouses, loading, saving,
  onCreate, onLoadDetail, selectedCount,
  onUpdateItem, onComplete, onClose,
}: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const fileRef = useRef<HTMLInputElement>(null);

  const [showNew,     setShowNew]     = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newForm,     setNewForm]     = useState({
    warehouse_id: warehouses[0]?.id ?? "",
    count_date:   new Date().toISOString().split("T")[0],
    notes:        "",
  });

  // ── Descargar template CSV ────────────────────────────────
  function downloadTemplate(count: InventoryCount) {
    const items = count.items ?? [];
    const header = es
      ? ["count_id", "item_id", "SKU", "Artículo", "Unidad", "Stock Sistema", "Cantidad Contada", "Notas"]
      : ["count_id", "item_id", "SKU", "Item", "Unit", "System Stock", "Counted Quantity", "Notes"];

    const rows = items.map((ci) => [
      count.id,
      ci.id,
      (ci.item as any)?.sku ?? "",
      (ci.item as any)?.name ?? "",
      (ci.item as any)?.unit ?? "",
      fmt(ci.system_quantity),
      "",
      "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `conteo-${count.count_number}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Procesar CSV subido ───────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedCount) return;
    setUploadError(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      // Saltar header
      const dataLines = lines.slice(1);
      let processed = 0;
      let errors = 0;

      for (const line of dataLines) {
        // Parsear CSV respetando comillas
        const cols = line.match(/("([^"]*(?:""[^"]*)*)"|[^,]*)/g)
          ?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];

        const itemId    = cols[1]?.trim();
        const qtyStr    = cols[6]?.trim();

        if (!itemId || !qtyStr) continue;
        const qty = parseFloat(qtyStr.replace(/,/g, ""));
        if (isNaN(qty)) { errors++; continue; }

        await onUpdateItem(itemId, qty, cols[7]?.trim() || undefined);
        processed++;
      }

      if (errors > 0) {
        setUploadError(es
          ? `${processed} ítems procesados. ${errors} líneas ignoradas por datos inválidos.`
          : `${processed} items processed. ${errors} lines skipped due to invalid data.`
        );
      }
      // Resetear input
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setUploadError(es ? "Error al leer el archivo: " + err.message : "Error reading file: " + err.message);
    }
  }

  const INPUT: React.CSSProperties = {
    width: "100%", height: "36px", padding: "0 10px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  // ── DETALLE DEL CONTEO ────────────────────────────────────
  if (selectedCount) {
    const sc    = COUNT_STATUS_CONFIG[selectedCount.status];
    const items = selectedCount.items ?? [];
    const isOpen = ["draft", "in_progress"].includes(selectedCount.status);

    const totalDiff = items.reduce((s, i) => s + Math.abs(Number(i.difference ?? 0)), 0);
    const withDiff  = items.filter((i) => Number(i.difference ?? 0) !== 0).length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>{selectedCount.count_number}</div>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                  {es ? sc.labelEs : sc.labelEn}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {(selectedCount.warehouse as any)?.name ?? "—"}
                </span>
                {withDiff > 0 && (
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: "var(--color-warning-text)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
                    {withDiff} {es ? "con diferencia" : "with difference"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones del conteo */}
          {isOpen && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* Descargar template */}
              <button
                onClick={() => downloadTemplate(selectedCount)}
                style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {es ? "Descargar template CSV" : "Download CSV template"}
              </button>

              {/* Subir CSV llenado */}
              <label style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", color: "var(--color-brand-blue)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {es ? "Subir CSV completado" : "Upload completed CSV"}
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>

              {/* Completar */}
              {!confirming ? (
                <button onClick={() => setConfirming(true)} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  {es ? "Completar y ajustar" : "Complete & adjust"}
                </button>
              ) : (
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-warning-text)", fontWeight: 600 }}>
                    {es ? "¿Aplicar ajustes?" : "Apply adjustments?"}
                  </span>
                  <button onClick={async () => { await onComplete(selectedCount.id); setConfirming(false); }} disabled={saving} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                    {es ? "Sí, aplicar" : "Yes, apply"}
                  </button>
                  <button onClick={() => setConfirming(false)} style={{ height: "28px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                    {es ? "Cancelar" : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info CSV */}
        {isOpen && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
            {es
              ? "Descarga el template CSV → llena la columna \"Cantidad Contada\" → sube el archivo. El sistema calculará las diferencias automáticamente."
              : "Download the CSV template → fill in the \"Counted Quantity\" column → upload the file. The system will calculate differences automatically."
            }
          </div>
        )}

        {/* Error de upload */}
        {uploadError && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)" }}>
            {uploadError}
          </div>
        )}

        {/* Resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {[
            { l: es ? "Total ítems"    : "Total items",    v: String(items.length),    c: "var(--color-text-primary)" },
            { l: es ? "Con diferencia" : "With diff",      v: String(withDiff),        c: withDiff > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)" },
            { l: es ? "Pendientes"     : "Pending",        v: String(items.filter((i) => !i.counted_quantity && Number(i.counted_quantity) !== 0 && i.counted_quantity !== 0).length), c: "var(--color-text-muted)" },
            { l: es ? "Diff. total"    : "Total diff",     v: fmt(totalDiff),          c: totalDiff > 0 ? "var(--color-warning-text)" : "var(--color-success-text)" },
          ].map((s) => (
            <div key={s.l} style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabla de ítems */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 110px 110px 110px 90px", padding: "8px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>SKU</span>
            <span>{es ? "Artículo" : "Item"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Unidad" : "Unit"}</span>
            <span style={{ textAlign: "right" }}>{es ? "Stock sistema" : "System stock"}</span>
            <span style={{ textAlign: "right" }}>{es ? "Contado" : "Counted"}</span>
            <span style={{ textAlign: "right" }}>{es ? "Diferencia" : "Difference"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Ajustado" : "Adjusted"}</span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
              {es ? "No hay ítems en este conteo" : "No items in this count"}
            </div>
          ) : (
            items.map((ci, i) => {
              const diff      = Number(ci.difference ?? 0);
              const counted   = Number(ci.counted_quantity ?? 0);
              const hasCount  = ci.counted_quantity !== null && ci.counted_quantity !== undefined;
              const diffColor = diff > 0 ? "var(--color-success-text)" : diff < 0 ? "var(--color-danger-text)" : "var(--color-text-muted)";

              return (
                <div key={ci.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 110px 110px 110px 90px", padding: "10px 16px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", background: diff !== 0 && hasCount ? "rgba(251,191,36,0.03)" : "transparent" }}>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{(ci.item as any)?.sku ?? "—"}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{(ci.item as any)?.name ?? "—"}</div>
                  <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)" }}>{(ci.item as any)?.unit ?? "—"}</div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "var(--color-text-second)", fontVariantNumeric: "tabular-nums" }}>{fmt(ci.system_quantity)}</div>
                  <div style={{ textAlign: "right", fontSize: "12px", fontWeight: hasCount ? 700 : 400, color: hasCount ? "var(--color-text-primary)" : "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {hasCount ? fmt(counted) : (es ? "Pendiente" : "Pending")}
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: diffColor, fontVariantNumeric: "tabular-nums" }}>
                    {hasCount ? (diff > 0 ? "+" + fmt(diff) : fmt(diff)) : "—"}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {ci.adjusted ? (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: "var(--color-success-text)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
                        ✓
                      </span>
                    ) : (
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── LISTA DE CONTEOS ──────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {counts.length} {es ? "conteos registrados" : "counts registered"}
        </div>
        <button onClick={() => setShowNew(true)} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nuevo conteo" : "New count"}
        </button>
      </div>

      {/* Info flujo */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
        <strong style={{ color: "var(--color-text-primary)" }}>
          {es ? "Flujo de conteo físico:" : "Physical count flow:"}
        </strong>
        <span> {es
          ? "1. Crear conteo → 2. Descargar template CSV → 3. Contar físicamente → 4. Subir CSV completado → 5. Completar y aplicar ajustes"
          : "1. Create count → 2. Download CSV template → 3. Physical count → 4. Upload completed CSV → 5. Complete and apply adjustments"
        }</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
          {es ? "Cargando…" : "Loading…"}
        </div>
      ) : counts.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-faint)" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔢</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Sin conteos físicos" : "No physical counts"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {es ? "Crea un conteo para inventariar un almacén" : "Create a count to inventory a warehouse"}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 130px 110px 110px 100px", padding: "10px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>{es ? "Número" : "Number"}</span>
            <span>{es ? "Almacén" : "Warehouse"}</span>
            <span>{es ? "Fecha" : "Date"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Estado" : "Status"}</span>
            <span style={{ textAlign: "center" }}>{es ? "Ítems" : "Items"}</span>
            <span></span>
          </div>
          {counts.map((c, i) => {
            const sc = COUNT_STATUS_CONFIG[c.status];
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "160px 1fr 130px 110px 110px 100px", padding: "12px 16px", borderBottom: i < counts.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{c.count_number}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-second)" }}>{(c.warehouse as any)?.name ?? "—"}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {c.count_date ? new Date(c.count_date).toLocaleDateString(es ? "es-MX" : "en-US") : "—"}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {es ? sc.labelEs : sc.labelEn}
                  </span>
                </div>
                <div style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {(c.items ?? []).length > 0 ? (c.items ?? []).length : "—"}
                </div>
                <div style={{ textAlign: "right" }}>
                  <button onClick={() => onLoadDetail(c.id)} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>
                    {es ? "Ver" : "View"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM NUEVO CONTEO */}
      {showNew && (
        <>
          <div onClick={() => setShowNew(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 400 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Nuevo conteo físico" : "New physical count"}
              </div>
              <button onClick={() => setShowNew(false)} style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)" }}>
                {es
                  ? "Se generará automáticamente un listado con todos los artículos del almacén seleccionado y sus cantidades actuales en sistema."
                  : "A list will be automatically generated with all items in the selected warehouse and their current system quantities."
                }
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Almacén *" : "Warehouse *"}
                </div>
                <select
                  value={newForm.warehouse_id}
                  onChange={(e) => setNewForm((p) => ({ ...p, warehouse_id: e.target.value }))}
                  style={{ ...INPUT, cursor: "pointer" }}
                >
                  <option value="">{es ? "Selecciona un almacén…" : "Select a warehouse…"}</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Fecha del conteo *" : "Count date *"}
                </div>
                <input
                  type="date"
                  value={newForm.count_date}
                  onChange={(e) => setNewForm((p) => ({ ...p, count_date: e.target.value }))}
                  style={INPUT}
                />
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Notas" : "Notes"}
                </div>
                <textarea
                  rows={3}
                  value={newForm.notes}
                  onChange={(e) => setNewForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={es ? "Motivo del conteo, observaciones…" : "Reason for count, observations…"}
                  style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
              <button
                onClick={async () => {
                  if (!newForm.warehouse_id) return;
                  await onCreate(newForm.warehouse_id, newForm.count_date, newForm.notes || undefined);
                  setShowNew(false);
                }}
                disabled={saving || !newForm.warehouse_id}
                style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: newForm.warehouse_id ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: newForm.warehouse_id ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: newForm.warehouse_id ? "pointer" : "not-allowed" }}
              >
                {saving ? (es ? "Creando…" : "Creating…") : (es ? "Crear conteo" : "Create count")}
              </button>
              <button onClick={() => setShowNew(false)} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
                {es ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
