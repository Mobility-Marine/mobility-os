// ============================================================
// CLIENTS BULK SERVICE v1 — GOD LEVEL
// Import masivo (CSV/Excel) + Export con plantilla
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Client, CreateClientPayload } from "../types/clients.types";

// ── COLUMNAS DE LA PLANTILLA ─────────────────────────────────
// Mapeamos headers amigables → campos del sistema

export const IMPORT_COLUMNS = [
  { key: "name",             label: "nombre_comercial",     required: true  },
  { key: "legal_name",       label: "razon_social",         required: false },
  { key: "rfc",              label: "rfc",                  required: false },
  { key: "email",            label: "email",                required: false },
  { key: "phone",            label: "telefono",             required: false },
  { key: "city",             label: "ciudad",               required: false },
  { key: "zip_code",         label: "codigo_postal",        required: false },
  { key: "country",          label: "pais",                 required: false },
  { key: "is_customer",      label: "es_cliente",           required: false },
  { key: "is_supplier",      label: "es_proveedor",         required: false },
  { key: "tax_regime",       label: "regimen_fiscal",       required: false },
  { key: "cfdi_use",         label: "uso_cfdi",             required: false },
  { key: "billing_email",    label: "email_facturacion",    required: false },
  { key: "payment_method",   label: "forma_pago_sat",       required: false },
  { key: "payment_form",     label: "pue_ppd",              required: false },
  { key: "payment_terms",    label: "condiciones_pago",     required: false },
  { key: "credit_limit",     label: "limite_credito",       required: false },
  { key: "website",          label: "sitio_web",            required: false },
  { key: "notes",            label: "notas",                required: false },
] as const;

export type ImportRow = {
  rowIndex:  number;
  data:      Partial<CreateClientPayload>;
  errors:    string[];
  isValid:   boolean;
};

// ── PARSEAR CSV ─────────────────────────────────────────────

export function parseCSV(text: string): Record<string, string>[] {
  const lines  = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

// ── VALIDAR Y TRANSFORMAR FILAS ──────────────────────────────

export function validateImportRows(rows: Record<string, string>[]): ImportRow[] {
  return rows.map((row, i) => {
    const errors: string[] = [];

    // Busca el nombre_comercial
    const name = row["nombre_comercial"] ?? row["name"] ?? row["nombre"] ?? "";
    if (!name.trim()) errors.push("Nombre comercial requerido");

    const isCustomerRaw = (row["es_cliente"] ?? "SI").toUpperCase();
    const isSupplierRaw = (row["es_proveedor"] ?? "NO").toUpperCase();
    const is_customer   = isCustomerRaw === "SI" || isCustomerRaw === "YES" || isCustomerRaw === "1" || isCustomerRaw === "TRUE";
    const is_supplier   = isSupplierRaw === "SI" || isSupplierRaw === "YES" || isSupplierRaw === "1" || isSupplierRaw === "TRUE";

    if (!is_customer && !is_supplier) errors.push("Debe ser Cliente y/o Proveedor");

    const credit = row["limite_credito"] ?? row["credit_limit"] ?? "";
    if (credit && isNaN(Number(credit))) errors.push("Límite de crédito debe ser número");

    const data: Partial<CreateClientPayload> = {
      name:           name.trim(),
      legal_name:     row["razon_social"]        || undefined,
      rfc:            row["rfc"]?.toUpperCase()  || undefined,
      email:          row["email"]               || undefined,
      phone:          row["telefono"]            || undefined,
      city:           row["ciudad"]              || undefined,
      zip_code:       row["codigo_postal"]       || undefined,
      country:        row["pais"]                || "México",
      is_customer,
      is_supplier,
      tax_regime:     row["regimen_fiscal"]      || undefined,
      cfdi_use:       row["uso_cfdi"]            || undefined,
      billing_email:  row["email_facturacion"]   || undefined,
      payment_method: row["forma_pago_sat"]      || undefined,
      payment_form:   row["pue_ppd"]             || "PPD",
      payment_terms:  row["condiciones_pago"]    || undefined,
      credit_limit:   credit ? Number(credit)    : undefined,
      website:        row["sitio_web"]           || undefined,
      notes:          row["notas"]               || undefined,
    };

    return { rowIndex: i + 2, data, errors, isValid: errors.length === 0 };
  });
}

// ── IMPORT MASIVO ────────────────────────────────────────────

export async function bulkImportClients(
  companyId: string,
  rows: ImportRow[]
): Promise<{ success: number; failed: number; errors: { row: number; error: string }[] }> {
  const valid  = rows.filter((r) => r.isValid);
  let success  = 0;
  let failed   = 0;
  const errors: { row: number; error: string }[] = [];

  // Insert en batches de 50
  const BATCH = 50;
  for (let i = 0; i < valid.length; i += BATCH) {
    const batch = valid.slice(i, i + BATCH).map((r) => ({
      company_id:    companyId,
      is_active:     true,
      payment_form:  "PPD",
      country:       "México",
      ...r.data,
    }));
    const { error } = await supabase.from("clients").insert(batch);
    if (error) {
      failed += batch.length;
      errors.push({ row: i + 2, error: error.message });
    } else {
      success += batch.length;
    }
  }

  return { success, failed, errors };
}

// ── EXPORT ──────────────────────────────────────────────────

export function exportClientsToCSV(clients: Client[]): string {
  const headers = IMPORT_COLUMNS.map((c) => c.label).join(",");
  const rows = clients.map((c) => {
    return [
      c.name            ?? "",
      c.legal_name      ?? "",
      c.rfc             ?? "",
      c.email           ?? "",
      c.phone           ?? "",
      c.city            ?? "",
      c.zip_code        ?? "",
      c.country         ?? "México",
      c.is_customer ? "SI" : "NO",
      c.is_supplier ? "SI" : "NO",
      c.tax_regime      ?? "",
      c.cfdi_use        ?? "",
      c.billing_email   ?? "",
      c.payment_method  ?? "",
      c.payment_form    ?? "",
      c.payment_terms   ?? "",
      c.credit_limit    ?? "",
      c.website         ?? "",
      c.notes           ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });
  return [headers, ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTemplate() {
  const headers = IMPORT_COLUMNS.map((c) => c.label).join(",");
  const example = [
    '"Empresa Ejemplo S.A."',
    '"Empresa Ejemplo S.A. de C.V."',
    '"EJE123456ABC"',
    '"contacto@empresa.com"',
    '"+52 33 1234 5678"',
    '"Guadalajara"',
    '"44100"',
    '"México"',
    '"SI"',   // es_cliente
    '"NO"',   // es_proveedor
    '"601"',  // regimen_fiscal
    '"G03"',  // uso_cfdi
    '"facturas@empresa.com"',
    '"03"',   // forma_pago_sat
    '"PPD"',  // pue_ppd
    '"30 días neto"',
    '"50000"',
    '"www.empresa.com"',
    '"Notas adicionales"',
  ].join(",");
  const content = [headers, example].join("\n");
  downloadCSV(content, "plantilla_clientes_mobility_os.csv");
}
