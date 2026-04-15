// ============================================================
// PRODUCTS SERVICE v1 — GOD LEVEL
// CRUD · Búsqueda · Conexiones módulos · Stock
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Product, CreateProductPayload, ProductFilters } from "../types/products.types";
import { CSV_HEADERS } from "../types/products.types";

// ── CRUD ──────────────────────────────────────────────────────

export async function fetchProducts(companyId: string): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });
  return (data ?? []) as Product[];
}

export async function fetchProduct(companyId: string, id: string): Promise<Product | null> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .single();
  return (data as Product) ?? null;
}

export async function createProduct(
  companyId: string, userId: string, payload: CreateProductPayload
): Promise<Product> {
  // Verificar SKU único
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("company_id", companyId)
    .eq("sku", payload.sku.trim())
    .maybeSingle();
  if (existing) throw new Error(`El SKU "${payload.sku}" ya existe en el catálogo.`);

  const { data, error } = await supabase
    .from("products")
    .insert({
      company_id:          companyId,
      sku:                 payload.sku.trim().toUpperCase(),
      name:                payload.name.trim(),
      description:         payload.description         || null,
      category:            payload.category            || null,
      unit:                payload.unit                || "pza",
      unit_price:          payload.unit_price          || 0,
      cost:                payload.cost                || 0,
      currency:            payload.currency            || "MXN",
      tax_rate:            payload.tax_rate            ?? 16,
      stock:               payload.stock               || 0,
      stock_min:           payload.stock_min           || 0,
      is_active:           payload.is_active           ?? true,
      sat_product_code:    payload.sat_product_code    || null,
      sat_unit_code:       payload.sat_unit_code       || null,
      tariff_code:         payload.tariff_code         || null,
      tariff_description:  payload.tariff_description  || null,
      country_of_origin:   payload.country_of_origin   || "México",
      image_url:           payload.image_url           || null,
      notes:               payload.notes               || null,
      created_by:          userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  companyId: string, id: string, updates: Partial<Product>
): Promise<void> {
  const { id: _id, company_id: _cid, created_at: _ca, created_by: _cb, ...safe } = updates as any;
  // Si cambia SKU, verificar unicidad
  if (safe.sku) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("company_id", companyId)
      .eq("sku", safe.sku.trim())
      .neq("id", id)
      .maybeSingle();
    if (existing) throw new Error(`El SKU "${safe.sku}" ya existe en el catálogo.`);
    safe.sku = safe.sku.trim().toUpperCase();
  }
  await supabase
    .from("products")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

export async function deleteProduct(companyId: string, id: string): Promise<void> {
  await supabase.from("products").delete().eq("id", id).eq("company_id", companyId);
}

export async function toggleProductStatus(
  companyId: string, id: string, isActive: boolean
): Promise<void> {
  await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", companyId);
}

// ── CATEGORÍAS ────────────────────────────────────────────────

export async function fetchCategories(companyId: string): Promise<string[]> {
  const { data } = await supabase
    .from("products")
    .select("category")
    .eq("company_id", companyId)
    .not("category", "is", null);
  const cats = [...new Set((data ?? []).map((r) => r.category).filter(Boolean))] as string[];
  return cats.sort();
}

// ── FILTROS ───────────────────────────────────────────────────

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter((p) => {
    const q = filters.search.trim().toLowerCase();
    if (q && !p.sku?.toLowerCase().includes(q) &&
        !p.name?.toLowerCase().includes(q) &&
        !p.description?.toLowerCase().includes(q) &&
        !p.category?.toLowerCase().includes(q)) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.status === "active"    && !p.is_active)                   return false;
    if (filters.status === "inactive"  && p.is_active)                    return false;
    if (filters.status === "low_stock" && !(p.stock > 0 && p.stock <= p.stock_min)) return false;
    if (filters.status === "no_stock"  && p.stock > 0)                    return false;
    if (filters.product_type && filters.product_type !== "all" && p.product_type !== filters.product_type) return false;
    return true;
  });
}

// ── KPIs ──────────────────────────────────────────────────────

export type ProductKPIs = {
  total:        number;
  active:       number;
  inactive:     number;
  lowStock:     number;
  noStock:      number;
  totalValue:   number;
  totalCost:    number;
  margin:       number;
  categories:   number;
};

export function computeKPIs(products: Product[]): ProductKPIs {
  const active    = products.filter((p) => p.is_active);
  const lowStock  = products.filter((p) => p.is_active && p.stock > 0 && p.stock <= p.stock_min);
  const noStock   = products.filter((p) => p.is_active && p.stock <= 0);
  const totalValue= active.reduce((s, p) => s + (p.unit_price * p.stock), 0);
  const totalCost = active.reduce((s, p) => s + (p.cost       * p.stock), 0);
  const margin    = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;
  const categories= new Set(products.map((p) => p.category).filter(Boolean)).size;

  return {
    total:      products.length,
    active:     active.length,
    inactive:   products.length - active.length,
    lowStock:   lowStock.length,
    noStock:    noStock.length,
    totalValue,
    totalCost,
    margin,
    categories,
  };
}

// ── IMPORT CSV ────────────────────────────────────────────────

export function parseProductsCSV(text: string): { valid: any[]; errors: any[] } {
  const lines  = text.trim().split("\n");
  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const valid: any[] = [];
  const errors: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols: string[] = [];
    let inQuote = false, cur = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur.trim());

    const row: any = {};
    header.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });

    if (!row.sku?.trim())  { errors.push({ ...row, _row: i + 1, _error: "SKU requerido" }); continue; }
    if (!row.name?.trim()) { errors.push({ ...row, _row: i + 1, _error: "Nombre requerido" }); continue; }

    valid.push({
      sku:                row.sku.trim().toUpperCase(),
      name:               row.name.trim(),
      description:        row.description?.trim()        || null,
      category:           row.category?.trim()           || null,
      unit:               row.unit?.trim()               || "pza",
      unit_price:         parseFloat(row.unit_price)     || 0,
      cost:               parseFloat(row.cost)           || 0,
      currency:           row.currency?.trim()           || "MXN",
      tax_rate:           parseFloat(row.tax_rate)       || 16,
      stock:              parseFloat(row.stock)          || 0,
      stock_min:          parseFloat(row.stock_min)      || 0,
      is_active:          row.is_active?.toLowerCase() !== "false",
      sat_product_code:   row.sat_product_code?.trim()   || null,
      sat_unit_code:      row.sat_unit_code?.trim()      || null,
      tariff_code:        row.tariff_code?.trim()        || null,
      tariff_description: row.tariff_description?.trim() || null,
      country_of_origin:  row.country_of_origin?.trim()  || "México",
      notes:              row.notes?.trim()              || null,
    });
  }

  return { valid, errors };
}

export async function bulkImportProducts(
  companyId: string, userId: string, rows: any[]
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  let inserted = 0, updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("company_id", companyId)
        .eq("sku", row.sku)
        .maybeSingle();

      if (existing) {
        await supabase.from("products")
          .update({ ...row, updated_at: new Date().toISOString() })
          .eq("id", existing.id).eq("company_id", companyId);
        updated++;
      } else {
        await supabase.from("products")
          .insert({ ...row, company_id: companyId, created_by: userId });
        inserted++;
      }
    } catch (e: any) {
      errors.push(`SKU ${row.sku}: ${e.message}`);
    }
  }

  return { inserted, updated, errors };
}

// ── EXPORT CSV ────────────────────────────────────────────────

export function exportProductsCSV(products: Product[]): void {
  const header = CSV_HEADERS.join(",");
  const rows   = products.map((p) =>
    CSV_HEADERS.map((h) => {
      const val = (p as any)[h];
      if (val === null || val === undefined) return "";
      const s = String(val);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(",")
  );
  const csv  = [header, ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadProductTemplate(): void {
  const header  = CSV_HEADERS.join(",");
  const example = [
    "SKU-001", "Caja de cartón corrugado", "Caja doble corrugado 60x40x40cm",
    "Embalaje", "pza", "45.00", "28.00", "MXN", "16", "500", "50", "true",
    "14111500", "H87", "4819.10.01", "Cajas de cartón corrugado", "México", "",
  ].join(",");
  const csv  = [header, example].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = "template_productos.csv";
  a.click();
  URL.revokeObjectURL(url);
}
