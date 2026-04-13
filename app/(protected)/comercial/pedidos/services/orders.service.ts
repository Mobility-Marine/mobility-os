// ============================================================
// ORDERS SERVICE v1 — GOD LEVEL
// CRUD · Stock · Timeline · Facturación
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Order, OrderItem, OrderFilters, OrderKPIs, OrderStatus } from "../types/orders.types";

// ── CONSECUTIVO ───────────────────────────────────────────────

async function generateOrderNumber(companyId: string): Promise<string> {
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  const num  = String((count ?? 0) + 1).padStart(4, "0");
  const year = new Date().getFullYear();
  return `PED-${year}-${num}`;
}

// ── FETCH ─────────────────────────────────────────────────────

export async function fetchOrders(companyId: string): Promise<Order[]> {
  const { data } = await supabase
    .from("orders")
    .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

export async function fetchOrder(companyId: string, id: string): Promise<Order | null> {
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders")
      .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number)")
      .eq("company_id", companyId).eq("id", id).single(),
    supabase.from("order_items").select("*")
      .eq("company_id", companyId).eq("order_id", id).order("sort_order"),
  ]);
  if (!order) return null;
  return { ...order, items: items ?? [] } as Order;
}

// ── CREATE ────────────────────────────────────────────────────

export async function createOrderFromQuotation(
  companyId: string, userId: string,
  quotationId: string, clientId?: string, total?: number, currency?: string, notes?: string
): Promise<Order> {
  const orderNumber = await generateOrderNumber(companyId);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      company_id:   companyId,
      order_number: orderNumber,
      quotation_id: quotationId,
      client_id:    clientId    ?? null,
      status:       "pending",
      priority:     "normal",
      currency:     currency    ?? "MXN",
      total:        total       ?? 0,
      subtotal:     total       ?? 0,
      tax_rate:     16,
      tax_amount:   0,
      discount_amount: 0,
      notes:        notes       ?? null,
      created_by:   userId,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Copiar items de la cotización
  const { data: qItems } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("sort_order");

  if (qItems?.length) {
    const orderItems = qItems.map((qi: any, idx: number) => ({
      company_id:        companyId,
      order_id:          order.id,
      product_id:        qi.product_id      ?? null,
      quotation_item_id: qi.id,
      sort_order:        idx,
      sku:               qi.sku             ?? null,
      description:       qi.description,
      details:           qi.details         ?? null,
      quantity:          qi.quantity,
      quantity_delivered: 0,
      unit:              qi.unit,
      unit_price:        qi.unit_price,
      discount_pct:      qi.discount_pct    ?? 0,
      subtotal:          qi.subtotal,
    }));
    await supabase.from("order_items").insert(orderItems);

    // Recalcular totales
    const subtotal = qItems.reduce((s: number, qi: any) => s + (qi.subtotal ?? 0), 0);
    const discount  = 0;
    const taxBase   = subtotal - discount;
    const taxAmt    = taxBase * 0.16;
    await supabase.from("orders").update({
      subtotal, discount_amount: discount, tax_amount: taxAmt, total: taxBase + taxAmt,
    }).eq("id", order.id);
  }

  return order as Order;
}

// ── UPDATE STATUS ─────────────────────────────────────────────

export async function updateOrderStatus(
  companyId: string, id: string, status: OrderStatus, userId: string
): Promise<void> {
  const now      = new Date().toISOString();
  const updates: any = { status, updated_at: now };

  if (status === "confirmed")      updates.confirmed_at = now;
  if (status === "shipped")        updates.shipped_at   = now;
  if (status === "delivered")      updates.delivered_at = now;

  await supabase.from("orders").update(updates).eq("id", id).eq("company_id", companyId);

  // Descontar stock al confirmar
  if (status === "confirmed") {
    await deductStock(companyId, id);
  }

  // Timeline
  const labels: Record<string, string> = {
    confirmed:      "Pedido confirmado",
    in_preparation: "Pedido en preparación",
    shipped:        "Pedido enviado",
    delivered:      "Pedido entregado",
    cancelled:      "Pedido cancelado",
  };
  await supabase.from("entity_timeline_events").insert({
    company_id:     companyId,
    entity_type:    "order",
    entity_id:      id,
    module_key:     "pedidos",
    event_type:     `status_${status}`,
    event_category: "commercial",
    title:          labels[status] ?? `Estado: ${status}`,
    created_by:     userId,
  }).then(() => {});
}

async function deductStock(companyId: string, orderId: string): Promise<void> {
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId)
    .not("product_id", "is", null);

  if (!items?.length) return;

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .eq("company_id", companyId)
      .single();

    if (product) {
      const newStock = Math.max(0, (product.stock ?? 0) - item.quantity);
      await supabase.from("products")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", item.product_id)
        .eq("company_id", companyId);
    }
  }
}

export async function updateOrder(
  companyId: string, id: string, updates: Partial<Order>
): Promise<void> {
  const { client, items, quotation, ...safe } = updates as any;
  await supabase.from("orders")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

// ── ITEMS ─────────────────────────────────────────────────────

export async function updateOrderItemDelivered(
  companyId: string, itemId: string, quantityDelivered: number
): Promise<void> {
  await supabase.from("order_items")
    .update({ quantity_delivered: quantityDelivered })
    .eq("id", itemId).eq("company_id", companyId);
}

// ── FILTERS + KPIs ────────────────────────────────────────────

export function filterOrders(orders: Order[], filters: OrderFilters): Order[] {
  return orders.filter((o) => {
    const q = filters.search.trim().toLowerCase();
    if (q && !o.order_number?.toLowerCase().includes(q) &&
        !o.client?.name?.toLowerCase().includes(q) &&
        !(o.items ?? []).some((i) => i.sku?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q))
    ) return false;

    if (filters.status === "active") {
      if (["delivered", "cancelled"].includes(o.status)) return false;
    } else if (filters.status !== "all") {
      if (o.status !== filters.status) return false;
    }

    if (filters.priority !== "all" && o.priority !== filters.priority) return false;
    return true;
  });
}

export function computeOrderKPIs(orders: Order[]): OrderKPIs {
  const active    = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  return {
    total:          orders.length,
    pending:        orders.filter((o) => o.status === "pending").length,
    active:         active.length,
    delivered:      delivered.length,
    cancelled:      orders.filter((o) => o.status === "cancelled").length,
    totalValue:     orders.reduce((s, o) => s + (o.total ?? 0), 0),
    pendingValue:   active.reduce((s, o) => s + (o.total ?? 0), 0),
    deliveredValue: delivered.reduce((s, o) => s + (o.total ?? 0), 0),
  };
}

// ── INTELLIGENCE ──────────────────────────────────────────────

export async function checkOrderStock(
  companyId: string, orderId: string
): Promise<{ ok: boolean; alerts: { sku: string; name: string; needed: number; available: number }[] }> {
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, sku, description, quantity")
    .eq("order_id", orderId)
    .not("product_id", "is", null);

  if (!items?.length) return { ok: true, alerts: [] };

  const alerts: any[] = [];
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock, name, sku")
      .eq("id", item.product_id)
      .eq("company_id", companyId)
      .single();

    if (product && product.stock < item.quantity) {
      alerts.push({
        sku:       item.sku ?? product.sku,
        name:      product.name,
        needed:    item.quantity,
        available: product.stock,
      });
    }
  }
  return { ok: alerts.length === 0, alerts };
}

export async function checkClientFinancial(
  companyId: string, clientId: string
): Promise<{ hasOverdue: boolean; overdueAmount: number }> {
  const { data } = await supabase
    .from("accounts_receivable")
    .select("amount, days_overdue")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .gt("days_overdue", 0);

  if (!data?.length) return { hasOverdue: false, overdueAmount: 0 };
  const overdueAmount = data.reduce((s, r) => s + (r.amount ?? 0), 0);
  return { hasOverdue: true, overdueAmount };
}
