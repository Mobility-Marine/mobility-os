import { supabase } from "@/lib/supabaseClient";
import type {
  Warehouse, InventoryItem, InventoryStock, InventoryMovement,
  InventoryCount, InventoryStats,
  CreateWarehousePayload, CreateItemPayload, CreateMovementPayload,
  InventoryFilters, MovementFilters,
} from "../types/inventarios.types";

// ── ALMACENES ─────────────────────────────────────────────────

export async function fetchWarehouses(companyId: string): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("company_id", companyId)
    .order("is_default", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Warehouse[];
}

export async function createWarehouse(companyId: string, userId: string, payload: CreateWarehousePayload): Promise<Warehouse> {
  // Si es default, quitar default de los demás
  if (payload.is_default) {
    await supabase.from("warehouses").update({ is_default: false }).eq("company_id", companyId);
  }
  const { data, error } = await supabase
    .from("warehouses")
    .insert({ ...payload, company_id: companyId })
    .select().single();
  if (error) throw new Error(error.message);
  return data as Warehouse;
}

export async function updateWarehouse(id: string, payload: Partial<CreateWarehousePayload>): Promise<void> {
  const { error } = await supabase
    .from("warehouses")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── ITEMS ─────────────────────────────────────────────────────

export async function fetchItems(companyId: string, filters: InventoryFilters): Promise<InventoryItem[]> {
  let q = supabase
    .from("inventory_items")
    .select(`*, stock:inventory_stock(*, warehouse:warehouses(name, code))`)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");

  if (filters.search.trim()) {
    q = q.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
  }
  if (filters.category) q = q.eq("category", filters.category);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let items = (data ?? []) as InventoryItem[];

  // Calcular totales de stock por item
  items = items.map((item) => {
    const stocks = (item.stock ?? []) as InventoryStock[];
    const totalStock = stocks.reduce((s, st) => s + Number(st.qty_available), 0);
    const totalValue = stocks.reduce((s, st) => s + Number(st.total_value), 0);
    return { ...item, total_stock: totalStock, total_value: totalValue };
  });

  // Filtro de alertas en memoria
  if (filters.alert !== "all") {
    items = items.filter((item) => {
      const ts = item.total_stock ?? 0;
      if (filters.alert === "zero_stock")  return ts === 0;
      if (filters.alert === "below_min")   return ts < item.stock_min && item.stock_min > 0;
      if (filters.alert === "at_reorder")  return ts <= item.reorder_point && item.reorder_point > 0;
      return true;
    });
  }

  // Filtro por almacén en memoria
  if (filters.warehouse_id) {
    items = items.filter((item) =>
      (item.stock ?? []).some((st: any) => st.warehouse_id === filters.warehouse_id)
    );
  }

  return items;
}

export async function fetchItem(id: string): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select(`*, stock:inventory_stock(*, warehouse:warehouses(name, code))`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as InventoryItem;
}

export async function createItem(companyId: string, userId: string, payload: CreateItemPayload): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({ ...payload, company_id: companyId, created_by: userId })
    .select().single();
  if (error) throw new Error(error.message);
  return data as InventoryItem;
}

export async function updateItem(id: string, payload: Partial<CreateItemPayload>): Promise<void> {
  const { error } = await supabase
    .from("inventory_items")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── STOCK ─────────────────────────────────────────────────────

export async function fetchStock(companyId: string, warehouseId?: string): Promise<InventoryStock[]> {
  let q = supabase
    .from("inventory_stock")
    .select(`*, warehouse:warehouses(name, code), item:inventory_items(name, sku, unit)`)
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (warehouseId) q = q.eq("warehouse_id", warehouseId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as InventoryStock[];
}

// ── MOVIMIENTOS ───────────────────────────────────────────────

export async function fetchMovements(companyId: string, filters: MovementFilters): Promise<InventoryMovement[]> {
  let q = supabase
    .from("inventory_movements")
    .select(`*, item:inventory_items(name, sku), warehouse:warehouses(name)`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.movement_type !== "all") q = q.eq("movement_type", filters.movement_type);
  if (filters.warehouse_id)            q = q.eq("warehouse_id", filters.warehouse_id);
  if (filters.date_from)               q = q.gte("created_at", filters.date_from);
  if (filters.date_to)                 q = q.lte("created_at", filters.date_to + "T23:59:59");
  if (filters.search.trim()) {
    q = q.or(`source_number.ilike.%${filters.search}%,lot_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as InventoryMovement[];
}

export async function registerMovement(
  companyId: string,
  userId: string,
  payload: CreateMovementPayload
): Promise<void> {
  const { error } = await supabase.rpc("register_inventory_movement", {
    p_company_id:    companyId,
    p_item_id:       payload.item_id,
    p_warehouse_id:  payload.warehouse_id,
    p_movement_type: payload.movement_type,
    p_quantity:      payload.quantity,
    p_unit_cost:     payload.unit_cost ?? 0,
    p_source_type:   payload.source_type ?? null,
    p_source_number: payload.source_number ?? null,
    p_lot_number:    payload.lot_number ?? null,
    p_notes:         payload.notes ?? null,
    p_created_by:    userId,
  });
  if (error) throw new Error(error.message);
}

// ── CONTEOS ───────────────────────────────────────────────────

export async function fetchCounts(companyId: string): Promise<InventoryCount[]> {
  const { data, error } = await supabase
    .from("inventory_counts")
    .select(`*, warehouse:warehouses(name)`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as InventoryCount[];
}

export async function fetchCount(id: string): Promise<InventoryCount | null> {
  const { data, error } = await supabase
    .from("inventory_counts")
    .select(`*, warehouse:warehouses(name), items:inventory_count_items(*, item:inventory_items(name, sku, unit))`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as InventoryCount;
}

export async function createCount(
  companyId: string,
  userId: string,
  warehouseId: string,
  countDate: string,
  notes?: string
): Promise<InventoryCount> {
  // Generar número de conteo
  const now = new Date();
  const year = now.getFullYear();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("count_number_format, count_number_counter")
    .eq("company_id", companyId)
    .single();

  const format  = (settings as any)?.count_number_format  ?? "CNT-{AÑO}-{NUM}";
  const counter = (settings as any)?.count_number_counter ?? 1;
  const number  = format
    .replace("{AÑO}", String(year))
    .replace("{MES}", String(now.getMonth() + 1).padStart(2, "0"))
    .replace("{NUM}", String(counter).padStart(4, "0"));

  await supabase.from("company_settings")
    .update({ count_number_counter: counter + 1 })
    .eq("company_id", companyId);

  // Tomar snapshot del stock actual del almacén
  const { data: stockData } = await supabase
    .from("inventory_stock")
    .select(`*, item:inventory_items(name, sku, unit, unit_cost)`)
    .eq("company_id", companyId)
    .eq("warehouse_id", warehouseId);

  const { data: count, error } = await supabase
    .from("inventory_counts")
    .insert({
      company_id:   companyId,
      warehouse_id: warehouseId,
      count_number: number,
      status:       "draft",
      count_date:   countDate,
      notes:        notes || null,
      created_by:   userId,
    })
    .select().single();
  if (error) throw new Error(error.message);

  // Crear ítems del conteo con stock actual como base
  if (stockData && stockData.length > 0) {
    const countItems = stockData.map((st: any) => ({
      company_id:       companyId,
      count_id:         (count as any).id,
      item_id:          st.item_id,
      system_quantity:  st.qty_available,
      counted_quantity: 0,
      difference:       -st.qty_available,
      unit_cost:        (st.item as any)?.unit_cost ?? 0,
      adjusted:         false,
    }));
    await supabase.from("inventory_count_items").insert(countItems);
  }

  return count as InventoryCount;
}

export async function updateCountItem(
  itemId: string,
  countedQty: number,
  notes?: string
): Promise<void> {
  const { data: item } = await supabase
    .from("inventory_count_items")
    .select("system_quantity")
    .eq("id", itemId)
    .single();

  const diff = countedQty - Number((item as any)?.system_quantity ?? 0);
  const { error } = await supabase
    .from("inventory_count_items")
    .update({ counted_quantity: countedQty, difference: diff, notes: notes ?? null })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
}

export async function completeCount(countId: string, companyId: string, userId: string): Promise<void> {
  // Obtener todos los ítems con diferencia
  const { data: items } = await supabase
    .from("inventory_count_items")
    .select("*")
    .eq("count_id", countId)
    .neq("difference", 0);

  // Registrar ajustes en movimientos
  for (const item of items ?? []) {
    if (!item.item_id || item.difference === 0) continue;
    const { data: stock } = await supabase
      .from("inventory_stock")
      .select("warehouse_id")
      .eq("item_id", item.item_id)
      .eq("company_id", companyId)
      .single();
    if (!stock) continue;
    await supabase.rpc("register_inventory_movement", {
      p_company_id:    companyId,
      p_item_id:       item.item_id,
      p_warehouse_id:  (stock as any).warehouse_id,
      p_movement_type: "adjustment",
      p_quantity:      item.difference,
      p_unit_cost:     item.unit_cost ?? 0,
      p_source_type:   "count",
      p_source_id:     countId,
      p_notes:         "Ajuste por conteo físico",
      p_created_by:    userId,
    });
    await supabase.from("inventory_count_items")
      .update({ adjusted: true, adjusted_by: userId, adjusted_at: new Date().toISOString() })
      .eq("id", item.id);
  }

  await supabase.from("inventory_counts").update({
    status:       "completed",
    completed_at: new Date().toISOString(),
    adjusted_by:  userId,
    adjusted_at:  new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }).eq("id", countId);
}

// ── STATS ─────────────────────────────────────────────────────

export async function fetchInventoryStats(companyId: string): Promise<InventoryStats> {
  const { data, error } = await supabase.rpc("get_inventory_stats", { p_company_id: companyId });
  if (error || !data) {
    return { total_items: 0, total_value: 0, below_min: 0, at_reorder: 0, zero_stock: 0, warehouses_count: 0 };
  }
  return data as InventoryStats;
}
