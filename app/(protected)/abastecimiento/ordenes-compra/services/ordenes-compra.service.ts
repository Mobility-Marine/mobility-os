import { supabase } from "@/lib/supabaseClient";
import type {
  PurchaseOrder, POItem, Supplier, POStats,
  CreatePOPayload, CreatePOItemPayload, UpdatePOPayload,
  POFilters,
} from "../types/ordenes-compra.types";

// ── PROVEEDORES ───────────────────────────────────────────────

export async function fetchSuppliers(companyId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Supplier[];
}

// ── OCs ───────────────────────────────────────────────────────

export async function fetchPOs(companyId: string, filters: POFilters): Promise<PurchaseOrder[]> {
  let q = supabase
    .from("purchase_orders")
    .select(`*, supplier:suppliers(name, email, tax_id, city)`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.supplier_id)      q = q.eq("supplier_id", filters.supplier_id);
  if (filters.date_from)        q = q.gte("order_date", filters.date_from);
  if (filters.date_to)          q = q.lte("order_date", filters.date_to);
  if (filters.search.trim()) {
    q = q.or(`po_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PurchaseOrder[];
}

export async function fetchPO(id: string): Promise<PurchaseOrder | null> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`*, supplier:suppliers(name, email, tax_id, city, address, phone), items:purchase_order_items(*)`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as PurchaseOrder;
}

export async function createPO(
  companyId: string,
  userId: string,
  payload: CreatePOPayload,
  items: CreatePOItemPayload[]
): Promise<PurchaseOrder> {
  // Generar número
  const { data: num, error: numErr } = await supabase
    .rpc("generate_po_number", { p_company_id: companyId });
  if (numErr) throw new Error(numErr.message);

  // Calcular totales
  const subtotal = items.reduce((s, i) => {
    const base = i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100);
    return s + base;
  }, 0);
  const discountAmt = payload.discount_amount ?? 0;
  const taxBase     = Math.max(0, subtotal - discountAmt);
  const taxAmt      = taxBase * ((payload.tax_rate ?? 16) / 100);
  const total       = taxBase + taxAmt;

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      company_id:      companyId,
      po_number:       num,
      status:          "draft",
      currency:        payload.currency ?? "MXN",
      subtotal,
      discount_amount: discountAmt,
      tax_rate:        payload.tax_rate ?? 16,
      tax_amount:      taxAmt,
      total,
      order_date:      payload.order_date ?? new Date().toISOString().split("T")[0],
      created_by:      userId,
      ...payload,
    })
    .select().single();
  if (error) throw new Error(error.message);

  const po = data as PurchaseOrder;

  // Insertar ítems
  if (items.length > 0) {
    const poItems = items.map((item, i) => {
      const base     = item.quantity * item.unit_price * (1 - (item.discount_pct ?? 0) / 100);
      const itemTax  = base * ((item.tax_rate ?? payload.tax_rate ?? 16) / 100);
      return {
        company_id:       companyId,
        po_id:            po.id,
        description:      item.description,
        quantity:         item.quantity,
        unit:             item.unit ?? "pza",
        unit_price:       item.unit_price,
        discount_pct:     item.discount_pct ?? 0,
        tax_rate:         item.tax_rate ?? payload.tax_rate ?? 16,
        subtotal:         base,
        tax_amount:       itemTax,
        total:            base + itemTax,
        quantity_received:0,
        quantity_pending: item.quantity,
        notes:            item.notes ?? null,
        sort_order:       item.sort_order ?? i,
      };
    });
    const { error: itemsErr } = await supabase.from("purchase_order_items").insert(poItems);
    if (itemsErr) throw new Error(itemsErr.message);
  }

  return po;
}

export async function updatePO(id: string, payload: UpdatePOPayload): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function approvePO(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .update({
      status:      "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function sendPO(id: string): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function cancelPO(id: string, reason: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("purchase_orders")
    .update({
      status:        "cancelled",
      cancel_reason: reason,
      cancelled_at:  new Date().toISOString(),
      cancelled_by:  userId,
      updated_at:    new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── STATS ─────────────────────────────────────────────────────

export async function fetchPOStats(companyId: string): Promise<POStats> {
  const { data, error } = await supabase.rpc("get_po_stats", { p_company_id: companyId });
  if (error || !data) return { total: 0, draft: 0, pending_approval: 0, approved: 0, sent: 0, partial: 0, complete: 0, total_value: 0, pending_value: 0 };
  return data as POStats;
}

// ── PRODUCTOS DEL CATÁLOGO ────────────────────────────────────
export async function fetchProductCatalog(companyId: string): Promise<{
  id: string; sku: string | null; name: string; unit: string;
  cost: number; unit_price: number; category: string | null;
}[]> {
  const { data } = await supabase
    .from("products")
    .select("id, sku, name, unit, cost, unit_price, category")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .eq("product_type", "product")
    .order("name");
  return (data ?? []) as any[];
}
