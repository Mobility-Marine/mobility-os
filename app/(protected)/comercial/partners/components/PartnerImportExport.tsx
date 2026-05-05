// ════════════════════════════════════════════════════════════════════════
// PartnerImportExport — Modal de importación/exportación masiva
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import type { PartnerListItem } from "../types/partners.types";
import {
  parseCSV,
  validateImportRows,
  bulkImportPartners,
  exportPartnersToCSV,
  downloadCSV,
  downloadTemplate,
  type ImportRow,
  type BulkImportResult,
} from "../services/partners.bulk";

export type PartnerImportExportProps = {
  open:           boolean;
  onClose:        () => void;
  companyId:      string | undefined;
  partners:       PartnerListItem[];
  onImportDone:   () => void;
};

const OVERLAY: CSSProperties = {
  position:        "fixed",
  inset:           0,
  background:      "rgba(0, 0, 0, 0.5)",
  backdropFilter:  "blur(2px)",
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "center",
  zIndex:          1000,
  padding:         "20px",
};

const MODAL: CSSProperties = {
  width:           "min(680px, 100%)",
  maxHeight:       "85vh",
  background:      "var(--color-bg-elevated)",
  borderRadius:    "var(--radius-lg, 12px)",
  border:          "1px solid var(--color-border)",
  display:         "flex",
  flexDirection:   "column",
  overflow:        "hidden",
};

const HEADER: CSSProperties = {
  display:         "flex",
  alignItems:      "center",
  justifyContent:  "space-between",
  padding:         "16px 20px",
  borderBottom:    "1px solid var(--color-border)",
  background:      "var(--color-bg-subtle)",
};

const TITLE: CSSProperties = {
  fontSize:        "16px",
  fontWeight:      700,
  color:           "var(--color-text-primary)",
};

const CLOSE_BTN: CSSProperties = {
  background:      "transparent",
  border:          "none",
  color:           "var(--color-text-muted)",
  fontSize:        "18px",
  cursor:          "pointer",
  outline:         "none",
  padding:         "4px 8px",
};

const BODY: CSSProperties = {
  flex:            1,
  overflowY:       "auto",
  padding:         "20px",
  display:         "flex",
  flexDirection:   "column",
  gap:             "20px",
};

const SECTION: CSSProperties = {
  display:         "flex",
  flexDirection:   "column",
  gap:             "10px",
};

const SECTION_TITLE: CSSProperties = {
  fontSize:        "11px",
  fontWeight:      700,
  letterSpacing:   "0.5px",
  textTransform:   "uppercase",
  color:           "var(--color-text-muted)",
};

const HINT: CSSProperties = {
  fontSize:        "12px",
  color:           "var(--color-text-muted)",
  lineHeight:      1.5,
};

const ACTION_ROW: CSSProperties = {
  display:         "flex",
  gap:             "8px",
  flexWrap:        "wrap",
};

const BTN_PRIMARY: CSSProperties = {
  display:         "inline-flex",
  alignItems:      "center",
  gap:             "6px",
  padding:         "8px 16px",
  borderRadius:    "var(--radius-md)",
  background:      "var(--color-brand-blue, #3b82f6)",
  color:           "#fff",
  fontSize:        "13px",
  fontWeight:      600,
  border:          "none",
  cursor:          "pointer",
  outline:         "none",
};

const BTN_SECONDARY: CSSProperties = {
  display:         "inline-flex",
  alignItems:      "center",
  gap:             "6px",
  padding:         "8px 14px",
  borderRadius:    "var(--radius-md)",
  background:      "var(--color-bg-elevated)",
  color:           "var(--color-text-primary)",
  fontSize:        "13px",
  fontWeight:      600,
  border:          "1px solid var(--color-border)",
  cursor:          "pointer",
  outline:         "none",
};

const BTN_DISABLED: CSSProperties = {
  ...BTN_PRIMARY,
  background:      "var(--color-text-muted)",
  cursor:          "not-allowed",
  opacity:         0.6,
};

const PREVIEW_TABLE: CSSProperties = {
  width:           "100%",
  borderCollapse:  "collapse",
  fontSize:        "12px",
  border:          "1px solid var(--color-border)",
  borderRadius:    "var(--radius-md)",
  overflow:        "hidden",
};

const PREVIEW_TH: CSSProperties = {
  textAlign:       "left",
  padding:         "6px 10px",
  background:      "var(--color-bg-subtle)",
  borderBottom:    "1px solid var(--color-border)",
  fontSize:        "10px",
  fontWeight:      700,
  letterSpacing:   "0.4px",
  textTransform:   "uppercase",
  color:           "var(--color-text-muted)",
};

const PREVIEW_TD: CSSProperties = {
  padding:         "6px 10px",
  borderBottom:    "1px solid var(--color-border)",
};

const RESULT_BOX: CSSProperties = {
  padding:         "12px 14px",
  borderRadius:    "var(--radius-md)",
  fontSize:        "13px",
};

const RESULT_OK: CSSProperties = {
  ...RESULT_BOX,
  background:      "rgba(34, 197, 94, 0.1)",
  color:           "var(--color-success-text)",
  border:          "1px solid rgba(34, 197, 94, 0.25)",
};

const RESULT_ERROR: CSSProperties = {
  ...RESULT_BOX,
  background:      "rgba(239, 68, 68, 0.1)",
  color:           "var(--color-danger-text)",
  border:          "1px solid rgba(239, 68, 68, 0.25)",
};

export default function PartnerImportExport({
  open,
  onClose,
  companyId,
  partners,
  onImportDone,
}: PartnerImportExportProps) {
  const fileInputRef                = useRef<HTMLInputElement | null>(null);
  const [parsedRows,    setParsedRows]    = useState<ImportRow[] | null>(null);
  const [importing,     setImporting]     = useState(false);
  const [importResult,  setImportResult]  = useState<BulkImportResult | null>(null);
  const [parseError,    setParseError]    = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setParsedRows(null);
    setImporting(false);
    setImportResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setImportResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setParseError("El archivo no contiene filas válidas o le falta el header.");
          setParsedRows(null);
          return;
        }
        const validated = validateImportRows(rows);
        setParsedRows(validated);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : String(err));
      }
    };
    reader.onerror = () => setParseError("Error al leer el archivo.");
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!companyId || !parsedRows) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await bulkImportPartners(companyId, parsedRows);
      setImportResult(result);
      if (result.inserted > 0) {
        onImportDone();
      }
    } catch (err) {
      setImportResult({
        inserted: 0,
        failed:   parsedRows.length,
        errors:   [{ row: 0, message: err instanceof Error ? err.message : String(err) }],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    const csv = exportPartnersToCSV(partners);
    const ts = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `partners_export_${ts}.csv`);
  };

  const validCount   = parsedRows?.filter((r) => r.valid).length ?? 0;
  const invalidCount = parsedRows?.filter((r) => !r.valid).length ?? 0;

  return (
    <div style={OVERLAY} onClick={handleClose}>
      <div style={MODAL} onClick={(e) => e.stopPropagation()}>
        <div style={HEADER}>
          <div style={TITLE}>📥 Importar / Exportar Partners</div>
          <button type="button" onClick={handleClose} style={CLOSE_BTN}>
            ✕
          </button>
        </div>

        <div style={BODY}>
          <div style={SECTION}>
            <div style={SECTION_TITLE}>1. Descargar plantilla</div>
            <p style={HINT}>
              Descarga el archivo CSV con todas las columnas soportadas y un
              renglón de ejemplo. Edítalo en Excel o Google Sheets antes de importar.
            </p>
            <div style={ACTION_ROW}>
              <button type="button" onClick={downloadTemplate} style={BTN_SECONDARY}>
                📄 Descargar plantilla CSV
              </button>
            </div>
          </div>

          <div style={SECTION}>
            <div style={SECTION_TITLE}>2. Importar archivo CSV</div>
            <p style={HINT}>
              Selecciona el archivo CSV con tus partners. El sistema validará
              cada fila antes de insertar. Si una fila no tiene rol marcado, se
              asume cliente por defecto.
            </p>
            <div style={ACTION_ROW}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={BTN_SECONDARY}
              >
                📂 Seleccionar archivo CSV
              </button>
              {parsedRows && (
                <button
                  type="button"
                  onClick={reset}
                  style={{ ...BTN_SECONDARY, color: "var(--color-text-muted)" }}
                >
                  Cancelar
                </button>
              )}
            </div>

            {parseError && (
              <div style={RESULT_ERROR}>
                ⚠️ {parseError}
              </div>
            )}

            {parsedRows && parsedRows.length > 0 && (
              <>
                <div style={{ ...HINT, color: "var(--color-text-primary)", fontWeight: 600 }}>
                  {parsedRows.length} fila(s) detectadas · {validCount} válidas
                  {invalidCount > 0 && (
                    <span style={{ color: "var(--color-danger-text)" }}>
                      {" "}· {invalidCount} con errores
                    </span>
                  )}
                </div>

                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <table style={PREVIEW_TABLE}>
                    <thead>
                      <tr>
                        <th style={PREVIEW_TH}>#</th>
                        <th style={PREVIEW_TH}>Estado</th>
                        <th style={PREVIEW_TH}>Nombre</th>
                        <th style={PREVIEW_TH}>RFC</th>
                        <th style={PREVIEW_TH}>Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 50).map((row) => (
                        <tr key={row.rowIndex}>
                          <td style={{ ...PREVIEW_TD, color: "var(--color-text-muted)" }}>
                            {row.rowIndex}
                          </td>
                          <td style={PREVIEW_TD}>
                            {row.valid ? (
                              <span style={{ color: "var(--color-success-text)" }}>✓</span>
                            ) : (
                              <span style={{ color: "var(--color-danger-text)" }} title={row.errors.join("; ")}>
                                ✗
                              </span>
                            )}
                          </td>
                          <td style={PREVIEW_TD}>{String(row.data.name ?? "—")}</td>
                          <td style={{ ...PREVIEW_TD, fontFamily: "monospace" }}>
                            {String(row.data.rfc ?? "—")}
                          </td>
                          <td style={PREVIEW_TD}>
                            {row.data.is_customer && "🤝"}
                            {row.data.is_supplier && "🏭"}
                            {row.data.is_logistics_provider && "🚚"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 50 && (
                    <div style={{ ...HINT, padding: "6px 10px", textAlign: "center" }}>
                      Mostrando primeras 50 filas (total: {parsedRows.length})
                    </div>
                  )}
                </div>

                {invalidCount > 0 && (
                  <details>
                    <summary
                      style={{
                        cursor:    "pointer",
                        fontSize:  "12px",
                        color:     "var(--color-danger-text)",
                        fontWeight: 600,
                      }}
                    >
                      Ver {invalidCount} error(es)
                    </summary>
                    <ul style={{ ...HINT, marginTop: "6px", paddingLeft: "20px" }}>
                      {parsedRows
                        .filter((r) => !r.valid)
                        .flatMap((r) => r.errors.map((e) => `Fila ${r.rowIndex}: ${e}`))
                        .slice(0, 30)
                        .map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                    </ul>
                  </details>
                )}

                <div style={ACTION_ROW}>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!companyId || validCount === 0 || importing}
                    style={
                      !companyId || validCount === 0 || importing
                        ? BTN_DISABLED
                        : BTN_PRIMARY
                    }
                  >
                    {importing
                      ? "⏳ Importando..."
                      : `✓ Importar ${validCount} partner(s)`}
                  </button>
                </div>
              </>
            )}

            {importResult && (
              <div style={importResult.inserted > 0 ? RESULT_OK : RESULT_ERROR}>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                  {importResult.inserted > 0
                    ? `✅ ${importResult.inserted} partner(s) importado(s)`
                    : `⚠️ Importación fallida`}
                </div>
                {importResult.failed > 0 && (
                  <div>{importResult.failed} fila(s) no importadas.</div>
                )}
                {importResult.errors.length > 0 && (
                  <ul style={{ marginTop: "4px", paddingLeft: "20px", fontSize: "12px" }}>
                    {importResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>
                        {e.row > 0 ? `Fila ${e.row}: ` : ""}
                        {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div style={SECTION}>
            <div style={SECTION_TITLE}>3. Exportar partners actuales</div>
            <p style={HINT}>
              Descarga un CSV con los <strong>{partners.length}</strong> partner(s)
              actualmente visible(s) (respeta los filtros aplicados en el sidebar).
            </p>
            <div style={ACTION_ROW}>
              <button
                type="button"
                onClick={handleExport}
                disabled={partners.length === 0}
                style={partners.length === 0 ? BTN_DISABLED : BTN_SECONDARY}
              >
                📤 Exportar a CSV ({partners.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}