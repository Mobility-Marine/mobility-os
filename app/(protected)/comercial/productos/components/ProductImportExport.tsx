"use client";

import { useState, useRef } from "react";
import { parseProductsCSV, downloadProductTemplate } from "../services/products.service";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  open:         boolean;
  onClose:      () => void;
  onBulkImport: (rows: any[]) => Promise<{ inserted: number; updated: number; errors: string[] }>;
};

type ImportStep = "upload" | "preview" | "result";

export default function ProductImportExport({ open, onClose, onBulkImport }: Props) {
  const { t, lang } = useTranslation();
  const tp          = (t.products as any) ?? {};
  const fileRef     = useRef<HTMLInputElement>(null);

  const [step,      setStep]      = useState<ImportStep>("upload");
  const [parsed,    setParsed]    = useState<{ valid: any[]; errors: any[] } | null>(null);
  const [result,    setResult]    = useState<{ inserted: number; updated: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver,  setDragOver]  = useState(false);

  function handleClose() { setStep("upload"); setParsed(null); setResult(null); onClose(); }

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text   = e.target?.result as string;
      const parsed = parseProductsCSV(text);
      setParsed(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) processFile(file);
  }

  async function handleImport() {
    if (!parsed?.valid.length) return;
    setImporting(true);
    try {
      const res = await onBulkImport(parsed.valid);
      setResult(res);
      setStep("result");
    } finally { setImporting(false); }
  }

  if (!open) return null;

  const stepSubtitle = step === "upload"
    ? (tp.importUpload  ?? "Sube tu archivo CSV")
    : step === "preview"
    ? (tp.importPreview ?? "Revisión antes de importar")
    : (tp.importResult  ?? "Resultado de la importación");

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 401, padding: "20px",
      }}>
        <div style={{
          width: "min(700px, 100%)", maxHeight: "90vh",
          background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* HEADER */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {tp.importTitle ?? "Importar productos — CSV"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {stepSubtitle}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

            {/* ── STEP 1: UPLOAD ── */}
            {step === "upload" && (
              <>
                <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-info-text)", marginBottom: "3px" }}>
                      {tp.firstTime ?? "¿Primera vez importando?"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {tp.firstTimeDesc ?? "Descarga la plantilla CSV con el formato correcto y todos los campos."}
                    </div>
                  </div>
                  <button onClick={downloadProductTemplate} style={{
                    height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)",
                    background: "var(--color-brand-blue)", color: "#fff", border: "none",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0,
                  }}>
                    {tp.downloadTemplate ?? "Descargar plantilla"}
                  </button>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    padding: "40px 20px", borderRadius: "var(--radius-lg)", textAlign: "center",
                    border: `2px dashed ${dragOver ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                    background: dragOver ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                    cursor: "pointer", transition: "var(--transition-fast)",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragOver ? "var(--color-brand-blue)" : "var(--color-text-muted)"} strokeWidth="1.5" style={{ marginBottom: "12px" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>
                    {tp.dropzone ?? "Arrastra tu archivo CSV aquí"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {tp.dropzoneHint ?? "o haz clic para seleccionar — solo archivos .csv"}
                  </div>
                  <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileChange} />
                </div>

                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    {tp.requiredFields ?? "Campos del CSV (primera fila = encabezados)"}
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {["sku *", "name *", "description", "category", "unit", "unit_price", "cost", "currency", "tax_rate", "stock", "stock_min", "is_active", "sat_product_code", "sat_unit_code", "tariff_code", "tariff_description", "country_of_origin", "notes"].map((f) => (
                      <span key={f} style={{
                        fontSize: "10px", fontFamily: "monospace", padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: f.endsWith("*") ? "var(--color-danger-bg)" : "var(--color-bg-base)",
                        border: `1px solid ${f.endsWith("*") ? "var(--color-danger-border)" : "var(--color-border-faint)"}`,
                        color: f.endsWith("*") ? "var(--color-danger-text)" : "var(--color-text-muted)",
                      }}>
                        {f}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px" }}>
                    {tp.csvFormatInfo ?? "* Campos obligatorios. Si el SKU ya existe se actualiza. Si no existe se crea."}
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: PREVIEW ── */}
            {step === "preview" && parsed && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-success-text)" }}>{parsed.valid.length}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{tp.validRows ?? "Filas válidas para importar"}</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: parsed.errors.length > 0 ? "var(--color-danger-bg)" : "var(--color-bg-subtle)", border: `1px solid ${parsed.errors.length > 0 ? "var(--color-danger-border)" : "var(--color-border-faint)"}`, textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: parsed.errors.length > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>{parsed.errors.length}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{tp.errorRows ?? "Filas con error (no se importarán)"}</div>
                  </div>
                </div>

                {parsed.errors.length > 0 && (
                  <div style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", marginBottom: "6px", textTransform: "uppercase" }}>
                      {tp.importErrors ?? "Errores encontrados"}
                    </div>
                    {parsed.errors.slice(0, 5).map((err, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "var(--color-danger-text)", marginBottom: "3px" }}>
                        {lang === "en" ? "Row" : "Fila"} {err._row}: {err._error} {err.sku ? `(SKU: ${err.sku})` : ""}
                      </div>
                    ))}
                    {parsed.errors.length > 5 && (
                      <div style={{ fontSize: "11px", color: "var(--color-danger-text)", marginTop: "4px" }}>
                        +{parsed.errors.length - 5} {lang === "en" ? "more errors…" : "errores más…"}
                      </div>
                    )}
                  </div>
                )}

                {parsed.valid.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {lang === "en" ? "Preview" : "Vista previa"} — {lang === "en" ? "first" : "primeros"} {Math.min(parsed.valid.length, 5)} {lang === "en" ? "of" : "de"} {parsed.valid.length} {tp.title ?? "productos"}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ background: "var(--color-bg-subtle)" }}>
                          {[
                            tp.sku       ?? "SKU",
                            tp.name      ?? "Nombre",
                            tp.category  ?? "Categoría",
                            tp.unitPrice ?? "Precio",
                            tp.cost      ?? "Costo",
                            tp.stock     ?? "Stock",
                          ].map((h) => (
                            <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-faint)", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.valid.slice(0, 5).map((row, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--color-border-faint)" }}>
                            <td style={{ padding: "6px 8px", fontFamily: "monospace", color: "var(--color-text-muted)" }}>{row.sku}</td>
                            <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--color-text-primary)" }}>{row.name}</td>
                            <td style={{ padding: "6px 8px", color: "var(--color-text-muted)" }}>{row.category || "—"}</td>
                            <td style={{ padding: "6px 8px", color: "var(--color-success-text)", fontWeight: 600 }}>${Number(row.unit_price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: "6px 8px", color: "var(--color-text-muted)" }}>${Number(row.cost).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: "6px 8px" }}>{row.stock} {row.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 3: RESULT ── */}
            {step === "result" && result && (
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-success-text)", marginBottom: "4px" }}>
                    {tp.importSuccess ?? "Importación completada"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { label: tp.inserted  ?? "Nuevos",       value: result.inserted,       color: "var(--color-success-text)" },
                    { label: tp.updated   ?? "Actualizados", value: result.updated,         color: "var(--color-brand-blue)"   },
                    { label: tp.withError ?? "Con error",    value: result.errors.length,   color: result.errors.length > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" },
                  ].map((k) => (
                    <div key={k.label} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: k.color }}>{k.value}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                {result.errors.length > 0 && (
                  <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger-text)", marginBottom: "6px" }}>
                      {tp.importErrors ?? "Errores durante la importación"}
                    </div>
                    {result.errors.map((e, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "var(--color-danger-text)", marginBottom: "3px" }}>{e}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
            {step === "upload" && (
              <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            )}
            {step === "preview" && (
              <>
                <button onClick={() => setStep("upload")} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
                  ← {(t.general as any).back ?? "Volver"}
                </button>
                <button onClick={handleImport} disabled={importing || !parsed?.valid.length} style={{
                  flex: 1, height: "40px", borderRadius: "var(--radius-md)",
                  background: "var(--color-brand-blue)", color: "#fff", border: "none",
                  fontSize: "13px", fontWeight: 700, cursor: importing ? "not-allowed" : "pointer",
                  opacity: importing ? 0.7 : 1,
                }}>
                  {importing ? t.general.loading : `${tp.importBtn ?? "Importar"} ${parsed?.valid.length ?? 0} ${tp.title ?? "productos"}`}
                </button>
              </>
            )}
            {step === "result" && (
              <button onClick={handleClose} style={{
                flex: 1, height: "40px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}>
                {t.general.confirm ?? "Listo"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
