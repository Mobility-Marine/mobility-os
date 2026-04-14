"use client";
import { useState, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CostItem, ImportRow } from "../types/costos.types";

type Props = {
  items:      CostItem[];
  importRows: ImportRow[];
  saving:     boolean;
  onResolve:  (rows: ImportRow[]) => Promise<void>;
  onApply:    () => Promise<{ updated: number; errors: number }>;
  onClear:    () => void;
};

const fmt  = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n: number) => Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function CostosImportExport({ items, importRows, saving, onResolve, onApply, onClear }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ updated: number; errors: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // ── EXPORT ──────────────────────────────────────────────────
  function handleExport() {
    const headers = es
      ? ["SKU","Nombre","Categoría","Unidad","Costo Actual","Precio Venta","Margen %","Stock","Valor Stock","Variación %","Últ. Proveedor"]
      : ["SKU","Name","Category","Unit","Current Cost","Sale Price","Margin %","Stock","Stock Value","Variation %","Last Supplier"];

    const rows = items.map((i) => [
      i.sku ?? "",
      i.name,
      i.category ?? "",
      i.unit,
      i.current_cost,
      i.sale_price,
      i.sale_price > 0 ? fmtP(i.margin_pct) : "",
      i.stock_qty,
      fmt(i.stock_value),
      i.variation_pct !== null ? fmtP(i.variation_pct) : "",
      i.last_supplier ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analisis-costos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── DOWNLOAD TEMPLATE ────────────────────────────────────────
  function handleDownloadTemplate() {
    const headers = es
      ? ["sku","nombre","costo_nuevo","moneda","notas"]
      : ["sku","name","new_cost","currency","notes"];

    const examples = items.slice(0, 3).map((i) => [
      i.sku ?? "", i.name, i.current_cost, "MXN", "",
    ]);

    const csv = [headers, ...examples]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-importacion-costos.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── PARSE CSV ────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null); setResult(null);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { setParseError(es ? "El archivo está vacío o sin datos." : "File is empty or has no data."); return; }

      const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
      // Detectar columnas
      const iSku     = header.findIndex((h) => ["sku"].includes(h));
      const iName    = header.findIndex((h) => ["nombre","name"].includes(h));
      const iCost    = header.findIndex((h) => ["costo_nuevo","new_cost","costo","cost","precio","price"].includes(h));
      const iCurr    = header.findIndex((h) => ["moneda","currency"].includes(h));
      const iNotes   = header.findIndex((h) => ["notas","notes"].includes(h));

      if (iCost < 0) { setParseError(es ? "No se encontró columna de costo (costo_nuevo / new_cost)." : "Cost column not found (new_cost / costo_nuevo)."); return; }

      const rows: ImportRow[] = lines.slice(1).map((line, idx) => {
        const cols = line.match(/("([^"]*(?:""[^"]*)*)"|[^,]*)/g)
          ?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
        const newCost = parseFloat((cols[iCost] ?? "").replace(/,/g, ""));
        return {
          row:      idx + 2,
          sku:      iSku   >= 0 ? (cols[iSku]   ?? "") : "",
          name:     iName  >= 0 ? (cols[iName]  ?? "") : "",
          new_cost: isNaN(newCost) ? 0 : newCost,
          currency: iCurr  >= 0 ? (cols[iCurr]  ?? "MXN") : "MXN",
          notes:    iNotes >= 0 ? (cols[iNotes] ?? "") : "",
          found:    false,
          current_cost: 0,
          variation_pct: 0,
          error: isNaN(newCost) ? (es ? "Costo inválido" : "Invalid cost") : undefined,
        };
      }).filter((r) => r.sku || r.name);

      if (rows.length === 0) { setParseError(es ? "No se encontraron filas válidas." : "No valid rows found."); return; }
      await onResolve(rows);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) { setParseError(err.message); }
  }

  async function handleApply() {
    const r = await onApply();
    setResult(r);
  }

  const foundCount   = importRows.filter((r) => r.found).length;
  const notFound     = importRows.filter((r) => !r.found).length;
  const priceUp      = importRows.filter((r) => r.found && r.variation_pct > 5).length;
  const priceDown    = importRows.filter((r) => r.found && r.variation_pct < -5).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* EXPORT SECTION */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {es ? "Exportar análisis de costos" : "Export cost analysis"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "14px" }}>
          {es
            ? `Descarga un CSV con todos los ${items.length} artículos incluyendo costos, precios de venta, márgenes, stock valorizado y variaciones.`
            : `Download a CSV with all ${items.length} items including costs, sale prices, margins, stock value and variations.`}
        </div>
        <button onClick={handleExport} disabled={items.length === 0} style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {es ? "Descargar análisis CSV" : "Download analysis CSV"}
        </button>
      </div>

      {/* IMPORT SECTION */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            {es ? "Importar lista de precios" : "Import price list"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {es
              ? "Importa los nuevos costos de tu proveedor en formato CSV. El sistema actualizará automáticamente el catálogo de productos, el inventario y registrará el historial de precios."
              : "Import new supplier costs in CSV format. The system will automatically update the product catalog, inventory and record price history."}
          </div>
        </div>

        {/* Flujo */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {[
            es ? "1. Descargar template" : "1. Download template",
            es ? "2. Llenar costos nuevos" : "2. Fill new costs",
            es ? "3. Subir CSV" : "3. Upload CSV",
            es ? "4. Revisar preview" : "4. Review preview",
            es ? "5. Aplicar cambios" : "5. Apply changes",
          ].map((s, i, arr) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", color: "var(--color-text-second)" }}>{s}</span>
              {i < arr.length - 1 && <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>→</span>}
            </div>
          ))}
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={handleDownloadTemplate} style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {es ? "Descargar template CSV" : "Download CSV template"}
          </button>

          {importRows.length === 0 && (
            <label style={{ height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {saving ? (es ? "Procesando…" : "Processing…") : (es ? "Subir CSV de precios" : "Upload price CSV")}
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          )}
        </div>

        {parseError && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
            {parseError}
          </div>
        )}

        {/* RESULTADO DE APLICACIÓN */}
        {result && (
          <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)", marginBottom: "4px" }}>
              {es ? "✓ Importación completada" : "✓ Import completed"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-second)" }}>
              {result.updated} {es ? "artículos actualizados" : "items updated"}
              {result.errors > 0 && ` · ${result.errors} ${es ? "errores" : "errors"}`}
            </div>
          </div>
        )}

        {/* PREVIEW TABLE */}
        {importRows.length > 0 && !result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Resumen preview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[
                { l: es ? "Total filas"      : "Total rows",    v: String(importRows.length), c: "var(--color-text-primary)"  },
                { l: es ? "Encontrados"      : "Found",         v: String(foundCount),        c: "var(--color-success-text)"  },
                { l: es ? "No encontrados"   : "Not found",     v: String(notFound),          c: notFound > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" },
                { l: es ? "Precios subieron" : "Prices up",     v: String(priceUp),           c: priceUp > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)" },
              ].map((s) => (
                <div key={s.l} style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Tabla preview */}
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: "360px", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "50px 80px 1fr 110px 110px 90px 120px", padding: "8px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", position: "sticky", top: 0 }}>
                <span>{es ? "Fila" : "Row"}</span>
                <span>SKU</span>
                <span>{es ? "Artículo" : "Item"}</span>
                <span style={{ textAlign: "right" }}>{es ? "Costo actual" : "Current cost"}</span>
                <span style={{ textAlign: "right" }}>{es ? "Costo nuevo" : "New cost"}</span>
                <span style={{ textAlign: "right" }}>{es ? "Variación" : "Variation"}</span>
                <span style={{ textAlign: "center" }}>{es ? "Estado" : "Status"}</span>
              </div>
              {importRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "50px 80px 1fr 110px 110px 90px 120px", padding: "8px 14px", borderBottom: i < importRows.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", background: !row.found ? "rgba(239,68,68,0.04)" : row.variation_pct > 5 ? "rgba(245,158,11,0.04)" : "transparent" }}>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{row.row}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{row.sku || "—"}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: row.found ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    {row.name || (row.found ? "✓" : "—")}
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {row.found ? "$" + fmt(row.current_cost) : "—"}
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {row.new_cost > 0 ? "$" + fmt(row.new_cost) : "—"}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {row.found && row.current_cost > 0 ? (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: row.variation_pct > 5 ? "var(--color-danger-text)" : row.variation_pct < -5 ? "var(--color-success-text)" : "var(--color-text-muted)" }}>
                        {row.variation_pct > 0 ? "+" : ""}{fmtP(row.variation_pct)}%
                      </span>
                    ) : <span style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>—</span>}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {row.error ? (
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)" }}>{row.error}</span>
                    ) : row.found ? (
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)", border: "1px solid var(--color-success-border)" }}>{es ? "Encontrado" : "Found"}</span>
                    ) : (
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger-border)" }}>{es ? "No encontrado" : "Not found"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones confirmar/cancelar */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleApply} disabled={saving || foundCount === 0} style={{ height: "38px", padding: "0 24px", borderRadius: "var(--radius-md)", background: foundCount > 0 ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: foundCount > 0 ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: foundCount > 0 ? "pointer" : "not-allowed", opacity: saving ? 0.7 : 1 }}>
                {saving ? (es ? "Aplicando…" : "Applying…") : (es ? `Aplicar ${foundCount} actualizaciones` : `Apply ${foundCount} updates`)}
              </button>
              <button onClick={onClear} style={{ height: "38px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
                {es ? "Cancelar importación" : "Cancel import"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
