// ════════════════════════════════════════════════════════════════════════
// PARTNERS BULK — Import/Export CSV de Business Partners
// ════════════════════════════════════════════════════════════════════════
// Maneja la importación masiva desde CSV y la exportación a CSV de
// business_partners. Soporta importar partners con cualquier combinación
// de roles (cliente/proveedor/logístico) en una sola operación.
//
// Workflow de importación:
//   1. parseCSV(text)          → array de filas como Record<string, string>
//   2. validateImportRows(rows) → ImportRow[] con flags de validación
//   3. bulkImportPartners()    → inserta en business_partners con company_id
//
// Workflow de exportación:
//   1. exportPartnersToCSV(partners) → string CSV
//   2. downloadCSV(content, filename) → dispara descarga del browser
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

// ── Definición de columnas del CSV ───────────────────────────────────
export type ImportColumn = {
  key:      string;
  label:    string;
  required: boolean;
  type:     "text" | "boolean" | "number";
};

export const IMPORT_COLUMNS: ImportColumn[] = [
  // Identidad
  { key: "name",          label: "Nombre comercial",       required: true,  type: "text"    },
  { key: "legal_name",    label: "Razón social",           required: false, type: "text"    },
  { key: "rfc",           label: "RFC",                    required: false, type: "text"    },
  { key: "email",         label: "Email",                  required: false, type: "text"    },
  { key: "phone",         label: "Teléfono",               required: false, type: "text"    },
  // Dirección básica
  { key: "city",          label: "Ciudad",                 required: false, type: "text"    },
  { key: "zip_code",      label: "Código postal",          required: false, type: "text"    },
  { key: "country",       label: "País",                   required: false, type: "text"    },
  // Roles
  { key: "is_customer",            label: "Es cliente",     required: false, type: "boolean" },
  { key: "is_supplier",            label: "Es proveedor",   required: false, type: "boolean" },
  { key: "is_logistics_provider",  label: "Es logístico",   required: false, type: "boolean" },
  // Fiscal
  { key: "tax_regime",    label: "Régimen fiscal",         required: false, type: "text"    },
  { key: "cfdi_use",      label: "Uso CFDI",               required: false, type: "text"    },
  { key: "billing_email", label: "Email facturación",      required: false, type: "text"    },
  // Comerciales
  { key: "payment_method", label: "Método de pago",        required: false, type: "text"    },
  { key: "payment_form",   label: "Forma de pago",         required: false, type: "text"    },
  { key: "payment_terms",  label: "Términos de pago",      required: false, type: "text"    },
  { key: "credit_limit",   label: "Límite de crédito",     required: false, type: "number"  },
  // Otros
  { key: "industry",      label: "Industria",              required: false, type: "text"    },
  { key: "website",       label: "Sitio web",              required: false, type: "text"    },
  { key: "notes",         label: "Notas",                  required: false, type: "text"    },
];

export type ImportRow = {
  data:   Record<string, string | boolean | number | null>;
  valid:  boolean;
  errors: string[];
  rowIndex: number;
};

// ── PARSE CSV ────────────────────────────────────────────────────────
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  out.push(current);
  return out;
}

// ── VALIDATE ─────────────────────────────────────────────────────────
export function validateImportRows(rows: Record<string, string>[]): ImportRow[] {
  return rows.map((row, idx) => {
    const data: Record<string, string | boolean | number | null> = {};
    const errors: string[] = [];

    for (const col of IMPORT_COLUMNS) {
      const raw = row[col.key] ?? "";

      if (col.required && !raw) {
        errors.push(`Falta "${col.label}" (columna ${col.key})`);
        data[col.key] = null;
        continue;
      }

      if (!raw) {
        data[col.key] = null;
        continue;
      }

      switch (col.type) {
        case "boolean": {
          const lower = raw.toLowerCase().trim();
          data[col.key] = ["true", "si", "sí", "1", "yes", "x"].includes(lower);
          break;
        }
        case "number": {
          const n = Number(raw);
          if (Number.isNaN(n)) {
            errors.push(`"${col.label}" debe ser un número, recibido: "${raw}"`);
            data[col.key] = null;
          } else {
            data[col.key] = n;
          }
          break;
        }
        default:
          data[col.key] = raw;
      }
    }

    const hasAnyRole =
      data.is_customer === true ||
      data.is_supplier === true ||
      data.is_logistics_provider === true;
    if (!hasAnyRole) {
      data.is_customer = true;
    }

    return {
      data,
      valid:    errors.length === 0,
      errors,
      rowIndex: idx + 2,
    };
  });
}

// ── IMPORT ───────────────────────────────────────────────────────────
export type BulkImportResult = {
  inserted: number;
  failed:   number;
  errors:   { row: number; message: string }[];
};

export async function bulkImportPartners(
  companyId: string,
  rows: ImportRow[],
): Promise<BulkImportResult> {
  const validRows = rows.filter((r) => r.valid);
  if (validRows.length === 0) {
    return { inserted: 0, failed: rows.length, errors: rows.flatMap((r) => r.errors.map((e) => ({ row: r.rowIndex, message: e }))) };
  }

  const payload = validRows.map((r) => ({
    ...r.data,
    company_id: companyId,
    is_active:  true,
    is_customer:           r.data.is_customer === true,
    is_supplier:           r.data.is_supplier === true,
    is_logistics_provider: r.data.is_logistics_provider === true,
  }));

  const { error } = await supabase
    .from("business_partners")
    .insert(payload);

  if (error) {
    return {
      inserted: 0,
      failed:   validRows.length,
      errors:   [{ row: 0, message: error.message }],
    };
  }

  return {
    inserted: validRows.length,
    failed:   rows.length - validRows.length,
    errors:   rows.filter((r) => !r.valid).flatMap((r) => r.errors.map((e) => ({ row: r.rowIndex, message: e }))),
  };
}

// ── EXPORT ───────────────────────────────────────────────────────────
export function exportPartnersToCSV(partners: Array<Record<string, unknown>>): string {
  const headers = IMPORT_COLUMNS.map((c) => c.key).join(",");

  const rows = partners.map((p) => {
    return IMPORT_COLUMNS.map((c) => {
      const value = p[c.key];
      if (value === null || value === undefined) return "";
      if (typeof value === "boolean") return value ? "true" : "false";
      if (typeof value === "number") return String(value);
      const str = String(value);
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",");
  });

  return [headers, ...rows].join("\n");
}

// ── DOWNLOAD helpers ─────────────────────────────────────────────────
export function downloadCSV(content: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTemplate(): void {
  const headers = IMPORT_COLUMNS.map((c) => c.key).join(",");
  const example = IMPORT_COLUMNS.map((c) => {
    switch (c.key) {
      case "name":                  return "Acme Corp SA de CV";
      case "legal_name":            return "Acme Corporation S.A. de C.V.";
      case "rfc":                   return "ACM010101AB1";
      case "email":                 return "contacto@acme.com";
      case "phone":                 return "+52 55 1234 5678";
      case "city":                  return "Ciudad de México";
      case "zip_code":              return "06000";
      case "country":               return "México";
      case "is_customer":           return "true";
      case "is_supplier":           return "false";
      case "is_logistics_provider": return "false";
      case "tax_regime":            return "601";
      case "cfdi_use":              return "G03";
      case "billing_email":         return "facturacion@acme.com";
      case "payment_method":        return "PUE";
      case "payment_form":          return "03";
      case "payment_terms":         return "30 días";
      case "credit_limit":          return "100000";
      case "industry":              return "manufactura";
      case "website":               return "https://acme.com";
      case "notes":                 return "Cliente VIP";
      default:                      return "";
    }
  }).join(",");
  downloadCSV([headers, example].join("\n"), "plantilla_partners.csv");
}