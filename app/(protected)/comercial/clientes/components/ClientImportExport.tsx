"use client";

import { useRef, useState } from "react";
import type { Client } from "../types/clients.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  parseCSV, validateImportRows, bulkImportClients,
  exportClientsToCSV, downloadCSV, downloadTemplate,
} from "../services/clients.bulk";
import type { ImportRow } from "../services/clients.bulk";

type Props = {
  clients:  Client[];
  onImported: () => void;
};

type ImportState = "idle" | "preview" | "importing" | "done";

export default function ClientImportExport({ clients, onImported }: Props) {
  const { t }              = useTranslation();
  const { companyId }      = useTenant();
  const fileRef            = useRef<HTMLInputElement>(null);
  const [state, setState]  = useState<ImportState>("idle");
  const [rows,  setRows]   = useState<ImportRow[]>([]);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  // ── EXPORT ──────────────────────────────────────────────

  function handleExport() {
    const csv = exportClientsToCSV(clients);
    downloadCSV(csv, `clientes_mobility_os_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // ── IMPORT ──────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed  = parseCSV(text);
      const validated = validateImportRows(parsed);
      setRows(validated);
      setState("preview");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  async function handleImport() {
    if (!companyId) return;
    setState("importing");
    const res = await bulkImportClients(companyId, rows);
    setResult({ success: res.success, failed: res.failed });
    setState("done");
    if (res.success > 0) onImported();
  }

  function reset() {
    setState("idle");
    setRows([]);
    setResult(null);
  }

  const validCount   = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      display: "flex", flexDirection: "column", gap: "14px",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-second)" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {(t.clients as any)?.importExport ?? "Importar / Exportar"}
        </span>
      </div>

      {/* IDLE STATE */}
      {state === "idle" && (
        <>
          <div style={{ display: "grid", gap: "8px" }}>
            {/* EXPORT */}
            <button
              onClick={handleExport}
              disabled={clients.length === 0}
              style={{
                height: "38px", padding: "0 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-second)",
                fontSize: "13px", fontWeight: 600,
                cursor: clients.length === 0 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px",
                opacity: clients.length === 0 ? 0.5 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {(t.clients as any)?.exportClients ?? "Exportar clientes"} ({clients.length})
            </button>

            {/* IMPORT */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                height: "38px", padding: "0 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)",
                border: "none", color: "#fff",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {(t.clients as any)?.importClients ?? "Importar clientes (CSV)"}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFileChange} />

            {/* TEMPLATE */}
            <button
              onClick={downloadTemplate}
              style={{
                height: "34px", padding: "0 16px",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                border: "1px dashed var(--color-border)",
                color: "var(--color-text-muted)",
                fontSize: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {(t.clients as any)?.downloadTemplate ?? "Descargar plantilla CSV"}
            </button>
          </div>

          {/* HELP */}
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius-md)",
            background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
            fontSize: "11px", color: "var(--color-info-text)", lineHeight: 1.6,
          }}>
            <strong>{(t.clients as any)?.importFormatLabel ?? "Formato aceptado"}:</strong>{" "}
{(t.clients as any)?.importFormatDesc ?? "CSV con encabezados en español. Descarga la plantilla para ver el formato exacto."}{" "}
{(t.clients as any)?.importRequired ?? "Columnas requeridas:"}{" "}
<strong>nombre_comercial</strong>.
          </div>
        </>
      )}

      {/* PREVIEW STATE */}
      {state === "preview" && (
        <>
          {/* SUMMARY */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{
              padding: "12px", borderRadius: "var(--radius-md)",
              background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-success-text)" }}>{validCount}</div>
              <div style={{ fontSize: "11px", color: "var(--color-success-text)", fontWeight: 600 }}>
                {(t.clients as any)?.readyToImport ?? "Listos para importar"}
              </div>
            </div>
            <div style={{
              padding: "12px", borderRadius: "var(--radius-md)",
              background: invalidCount > 0 ? "var(--color-danger-bg)" : "var(--color-bg-subtle)",
              border: `1px solid ${invalidCount > 0 ? "var(--color-danger-border)" : "var(--color-border-faint)"}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: invalidCount > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>
                {invalidCount}
              </div>
              <div style={{ fontSize: "11px", color: invalidCount > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)", fontWeight: 600 }}>
                {(t.clients as any)?.withErrors ?? "Con errores"}
              </div>
            </div>
          </div>

          {/* ROW PREVIEW */}
          <div style={{ maxHeight: "220px", overflowY: "auto", display: "grid", gap: "6px" }}>
            {rows.slice(0, 20).map((row) => (
              <div key={row.rowIndex} style={{
                padding: "8px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)",
                border: `1px solid ${row.isValid ? "var(--color-border-faint)" : "var(--color-danger-border)"}`,
                display: "flex", alignItems: "flex-start", gap: "8px",
              }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                  background: row.isValid ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                  border: `1px solid ${row.isValid ? "var(--color-success-border)" : "var(--color-danger-border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {row.isValid ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Fila {row.rowIndex}: {row.data.name ?? "Sin nombre"}
                  </div>
                  {row.errors.length > 0 && (
                    <div style={{ fontSize: "10px", color: "var(--color-danger-text)", marginTop: "2px" }}>
                      {row.errors.join(" · ")}
                    </div>
                  )}
                  {row.isValid && (
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {[row.data.rfc, row.data.email, row.data.city].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {rows.length > 20 && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center", padding: "6px" }}>
                +{rows.length - 20} más…
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleImport}
              disabled={validCount === 0}
              style={{
                flex: 1, height: "38px", borderRadius: "var(--radius-md)",
                background: validCount > 0 ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
                border: "none", color: validCount > 0 ? "#fff" : "var(--color-text-muted)",
                fontSize: "13px", fontWeight: 700,
                cursor: validCount === 0 ? "not-allowed" : "pointer",
              }}
            >
              {(t.clients as any)?.confirmImport ?? "Importar"} {validCount} {(t.clients as any)?.records ?? "registros"}
            </button>
            <button onClick={reset} style={{
              height: "38px", padding: "0 16px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer",
            }}>
              {t.general.cancel}
            </button>
          </div>
        </>
      )}

      {/* IMPORTING */}
      {state === "importing" && (
        <div style={{ textAlign: "center", padding: "16px", color: "var(--color-text-muted)", fontSize: "13px" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "50%",
            border: "2px solid var(--color-brand-blue)", borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite", margin: "0 auto 10px",
          }} />
          {t.general.loading}
        </div>
      )}

      {/* DONE */}
      {state === "done" && result && (
        <>
          <div style={{
            padding: "14px", borderRadius: "var(--radius-md)",
            background: result.success > 0 ? "var(--color-success-bg)" : "var(--color-danger-bg)",
            border: `1px solid ${result.success > 0 ? "var(--color-success-border)" : "var(--color-danger-border)"}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: "22px", fontWeight: 800, color: result.success > 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
              {result.success}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: result.success > 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
              {(t.clients as any)?.importedSuccessfully ?? "clientes importados exitosamente"}
            </div>
            {result.failed > 0 && (
              <div style={{ fontSize: "11px", color: "var(--color-warning-text)", marginTop: "4px" }}>
                {result.failed} {(t.clients as any)?.failedImport ?? "fallaron"}
              </div>
            )}
          </div>
          <button onClick={reset} style={{
            height: "36px", borderRadius: "var(--radius-md)",
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer",
          }}>
            {(t.clients as any)?.importAnother ?? "Importar otro archivo"}
          </button>
        </>
      )}
    </div>
  );
}
