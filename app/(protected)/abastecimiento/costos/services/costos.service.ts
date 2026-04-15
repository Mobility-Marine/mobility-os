import { supabase } from "@/lib/supabaseClient";
import type {
  CostItem, PriceHistory, SupplierComparison, CostStats, ImportRow, CostFilters,
} from "../types/costos.types";

// ── ANÁLISIS DE COSTOS ────────────────────────────────────────

export async function fetchCostItems(companyId: string): Promise<CostItem[]> {
  // Traer inventory_items con join a products e inventory_stock
  const { data: items, error } = await supabase
    .from("inventory_items")
    .select(`
      id, company_id, product_id, name, sku, category, unit, unit_cost,
      product:products(unit_price),
      stock:inventory_stock(qty_available, total_value, avg_cost)
    `)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .eq("product_type", "product")
    .order("name");

  if (error) throw new Error(error.message);

  // Traer último precio histórico por item
  const { data: lastPrices } = await supabase
    .from("product_price_history")
    .select("item_id, unit_price, recorded_at, supplier:suppliers(name)")
    .eq("company_id", companyId)
    .order("recorded_at", { ascending: false });

  // Traer antepenúltimo precio para calcular variación (agrupar por item)
  const lastByItem: Record<string, { current: number; prev: number | null; supplier: string | null; date: string | null }> = {};
  for (const row of lastPrices ?? []) {
    if (!row.item_id) continue;
    if (!lastByItem[row.item_id]) {
      lastByItem[row.item_id] = {
        current: row.unit_price,
        prev:    null,
        supplier:(row.supplier as any)?.name ?? null,
        date:    row.recorded_at,
      };
    } else if (!lastByItem[row.item_id].prev) {
      lastByItem[row.item_id].prev = row.unit_price;
    }
  }

  return (items ?? []).map((item: any) => {
    const stocks    = (item.stock ?? []) as any[];
    const stockQty  = stocks.reduce((s: number, st: any) => s + Number(st.qty_available ?? 0), 0);
    const stockValue= stocks.reduce((s: number, st: any) => s + Number(st.total_value  ?? 0), 0);
    const avgCost   = stockQty > 0 ? stockValue / stockQty : Number(item.unit_cost ?? 0);
    const salePrice = Number((item.product as any)?.unit_price ?? 0);
    const cost      = Number(item.unit_cost ?? 0);
    const marginPct = salePrice > 0 ? ((salePrice - cost) / salePrice * 100) : 0;
    const hist      = lastByItem[item.id];

    let variationPct: number | null = null;
    if (hist?.prev && hist.prev > 0) {
      variationPct = ((hist.current - hist.prev) / hist.prev) * 100;
    }

    return {
      item_id:       item.id,
      company_id:    item.company_id,
      product_id:    item.product_id,
      name:          item.name,
      sku:           item.sku,
      category:      item.category,
      unit:          item.unit,
      current_cost:  cost,
      sale_price:    salePrice,
      margin_pct:    Math.round(marginPct * 100) / 100,
      stock_qty:     stockQty,
      stock_value:   stockValue,
      avg_cost:      avgCost,
      prev_cost:     hist?.prev ?? null,
      variation_pct: variationPct !== null ? Math.round(variationPct * 100) / 100 : null,
      last_supplier: hist?.supplier ?? null,
      last_po_date:  hist?.date ?? null,
    } as CostItem;
  });
}

// ── HISTORIAL DE PRECIOS ──────────────────────────────────────

export async function fetchPriceHistory(companyId: string, itemId: string): Promise<PriceHistory[]> {
  const { data, error } = await supabase
    .from("product_price_history")
    .select("*, supplier:suppliers(name), po:purchase_orders(po_number)")
    .eq("company_id", companyId)
    .eq("item_id", itemId)
    .order("recorded_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PriceHistory[];
}

export async function insertManualPrice(
  companyId: string, userId: string,
  itemId: string, supplierId: string | null,
  price: number, currency: string, notes?: string
): Promise<void> {
  const { error } = await supabase.from("product_price_history").insert({
    company_id:  companyId,
    item_id:     itemId,
    supplier_id: supplierId,
    unit_price:  price,
    currency,
    notes:       notes ?? null,
    source:      "manual",
    created_by:  userId,
  });
  if (error) throw new Error(error.message);
}

// ── COMPARATIVA DE PROVEEDORES ────────────────────────────────

export async function fetchSupplierComparison(companyId: string, itemId: string): Promise<SupplierComparison[]> {
  const { data, error } = await supabase
    .from("product_price_history")
    .select("supplier_id, unit_price, recorded_at, supplier:suppliers(name)")
    .eq("company_id", companyId)
    .eq("item_id", itemId)
    .not("supplier_id", "is", null)
    .order("recorded_at", { ascending: false });
  if (error) throw new Error(error.message);

  const map: Record<string, { prices: number[]; dates: string[]; name: string }> = {};
  for (const row of data ?? []) {
    if (!row.supplier_id) continue;
    if (!map[row.supplier_id]) {
      map[row.supplier_id] = { prices: [], dates: [], name: (row.supplier as any)?.name ?? "—" };
    }
    map[row.supplier_id].prices.push(Number(row.unit_price));
    map[row.supplier_id].dates.push(row.recorded_at);
  }

  return Object.entries(map).map(([supplierId, v]) => ({
    supplier_id:    supplierId,
    supplier_name:  v.name,
    last_price:     v.prices[0],
    min_price:      Math.min(...v.prices),
    max_price:      Math.max(...v.prices),
    last_date:      v.dates[0],
    purchase_count: v.prices.length,
  })).sort((a, b) => a.last_price - b.last_price);
}

// ── STATS ─────────────────────────────────────────────────────

export async function fetchCostStats(companyId: string): Promise<CostStats> {
  const { data, error } = await supabase.rpc("get_cost_stats", { p_company_id: companyId });
  if (error || !data) return { total_items: 0, total_stock_value: 0, avg_margin: 0, negative_margin: 0, low_margin: 0, no_price: 0 };
  return data as CostStats;
}

// ── IMPORT MASIVO ─────────────────────────────────────────────

export async function resolveImportRows(companyId: string, rows: ImportRow[]): Promise<ImportRow[]> {
  // Traer todos los inventory_items de la empresa para matching
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, product_id, sku, name, unit_cost")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const bySkuMap: Record<string, any> = {};
  const byNameMap: Record<string, any> = {};
  for (const item of items ?? []) {
    if (item.sku) bySkuMap[item.sku.toLowerCase()] = item;
    byNameMap[item.name.toLowerCase()] = item;
  }

  return rows.map((row) => {
    const key = row.sku?.toLowerCase();
    const match = (key && bySkuMap[key]) || byNameMap[row.name?.toLowerCase() ?? ""];
    if (!match) return { ...row, found: false, current_cost: 0, variation_pct: 0, error: "No encontrado" };
    const variation = match.unit_cost > 0
      ? ((row.new_cost - match.unit_cost) / match.unit_cost) * 100
      : 0;
    return {
      ...row,
      item_id:      match.id,
      product_id:   match.product_id,
      found:        true,
      current_cost: Number(match.unit_cost),
      variation_pct:Math.round(variation * 100) / 100,
    };
  });
}

export async function applyImport(
  companyId: string, userId: string, rows: ImportRow[]
): Promise<{ updated: number; errors: number }> {
  const validRows = rows.filter((r) => r.found && !r.error && r.item_id);
  let updated = 0; let errors = 0;

  for (const row of validRows) {
    try {
      // Actualizar inventory_item
      await supabase.from("inventory_items")
        .update({ unit_cost: row.new_cost, updated_at: new Date().toISOString() })
        .eq("id", row.item_id!).eq("company_id", companyId);

      // Actualizar products.cost si tiene product_id
      if (row.product_id) {
        await supabase.from("products")
          .update({ cost: row.new_cost, updated_at: new Date().toISOString() })
          .eq("id", row.product_id).eq("company_id", companyId);
      }

      // Registrar en historial
      await supabase.from("product_price_history").insert({
        company_id:  companyId,
        item_id:     row.item_id,
        product_id:  row.product_id ?? null,
        unit_price:  row.new_cost,
        currency:    row.currency ?? "MXN",
        source:      "import",
        notes:       row.notes ?? null,
        created_by:  userId,
      });
      updated++;
    } catch { errors++; }
  }

  return { updated, errors };
}
