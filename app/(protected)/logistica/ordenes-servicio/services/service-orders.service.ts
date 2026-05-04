import { supabase } from "@/lib/supabaseClient";
import type { ServiceOrder, ServiceOrderItem, SOFilters, ServiceOrderType, ServiceOrderStatus } from "../types/service-orders.types";

// ── FETCH ─────────────────────────────────────────────────────

export async function fetchServiceOrders(companyId: string): Promise<ServiceOrder[]> {
  const { data } = await supabase
    .from("service_orders")
    .select("*, shipment:shipments(reference, client:business_partners!client_id(name))")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ServiceOrder[];
}

export async function fetchServiceOrder(companyId: string, id: string): Promise<ServiceOrder | null> {
  const [{ data: so }, { data: items }] = await Promise.all([
    supabase.from("service_orders")
      .select("*, shipment:shipments(reference, client:business_partners!client_id(name))")
      .eq("company_id", companyId).eq("id", id).single(),
    supabase.from("service_order_items")
      .select("*").eq("service_order_id", id).order("sort_order"),
  ]);
  if (!so) return null;
  return { ...so, items: items ?? [] } as ServiceOrder;
}

// ── CREATE ────────────────────────────────────────────────────

export async function createServiceOrder(
  companyId: string, userId: string,
  data: Partial<ServiceOrder>
): Promise<ServiceOrder> {
  const { items, shipment, id: _id, company_id: _cid, created_at: _ca, ...safe } = data as any;
  const { data: created, error } = await supabase
    .from("service_orders")
    .insert({ ...safe, company_id: companyId, created_by: userId, status: "draft" })
    .select("*, shipment:shipments(reference, client:business_partners!client_id(name))")
    .single();
  if (error) throw error;
  return { ...created, items: [] } as ServiceOrder;
}

// ── UPDATE ────────────────────────────────────────────────────

export async function updateServiceOrder(
  companyId: string, id: string, updates: Partial<ServiceOrder>
): Promise<void> {
  const { items, shipment, id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("service_orders")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateSOStatus(
  companyId: string, id: string, status: ServiceOrderStatus
): Promise<void> {
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (status === "sent") updates.sent_at = new Date().toISOString();
  await supabase.from("service_orders").update(updates).eq("id", id).eq("company_id", companyId);
}

export async function deleteServiceOrder(companyId: string, id: string): Promise<void> {
  await supabase.from("service_orders").delete().eq("id", id).eq("company_id", companyId);
}

// ── ITEMS ─────────────────────────────────────────────────────

export async function upsertSOItem(
  companyId: string, serviceOrderId: string,
  item: Partial<ServiceOrderItem>
): Promise<void> {
  if (item.id) {
    const { id, company_id: _cid, service_order_id: _sid, created_at: _ca, ...safe } = item as any;
    await supabase.from("service_order_items").update(safe).eq("id", id).eq("company_id", companyId);
  } else {
    await supabase.from("service_order_items").insert({
      ...item, company_id: companyId, service_order_id: serviceOrderId,
    });
  }
}

export async function deleteSOItem(companyId: string, itemId: string): Promise<void> {
  await supabase.from("service_order_items").delete().eq("id", itemId).eq("company_id", companyId);
}

// ── FILTERS ───────────────────────────────────────────────────

export function filterServiceOrders(orders: ServiceOrder[], filters: SOFilters): ServiceOrder[] {
  return orders.filter((o) => {
    const q = filters.search.trim().toLowerCase();
    if (q &&
      !o.shipment?.reference?.toLowerCase().includes(q) &&
      !o.carrier_name?.toLowerCase().includes(q) &&
      !o.consignee_name?.toLowerCase().includes(q)
    ) return false;
    if (filters.type   !== "all" && o.order_type !== filters.type)   return false;
    if (filters.status !== "all" && o.status     !== filters.status) return false;
    return true;
  });
}

// ── PDF GENERATION ────────────────────────────────────────────

export async function generateAndDownloadSO(
  order: ServiceOrder, settings: any, template: string = "elegante"
): Promise<void> {
  const { pdf }           = await import("@react-pdf/renderer");
  const { createElement } = await import("react");

  let Template: any;
  const type = order.order_type;

  if (type === "ccp_carta") {
    if (template === "moderna")      Template = (await import("../components/templates/CCPModerna")).default;
    else if (template === "corporativa") Template = (await import("../components/templates/CCPCorporativa")).default;
    else                             Template = (await import("../components/templates/CCPElegante")).default;
  } else if (type === "bol_usa") {
    if (template === "moderna")      Template = (await import("../components/templates/BOLModerna")).default;
    else if (template === "corporativa") Template = (await import("../components/templates/BOLCorporativa")).default;
    else                             Template = (await import("../components/templates/BOLElegante")).default;
  } else {
    if (template === "moderna")      Template = (await import("../components/templates/AduanalModerna")).default;
    else if (template === "corporativa") Template = (await import("../components/templates/AduanalCorporativa")).default;
    else                             Template = (await import("../components/templates/AduanalElegante")).default;
  }

  const doc  = createElement(Template, { order, settings });
  const blob = await pdf(doc as any).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${order.order_type}-${order.shipment?.reference ?? order.id.slice(0,8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
