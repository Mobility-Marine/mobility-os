import { supabase } from "@/lib/supabaseClient";
import type { RFQ, RFQItem, RFQResponse, RFQResponseItem, RFQStatus, RFQFilters } from "../types/rfq.types";

// ── RFQ ───────────────────────────────────────────────────────

export async function fetchRFQs(companyId: string): Promise<RFQ[]> {
  const { data } = await supabase
    .from("procurement_rfqs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as RFQ[];
}

export async function fetchRFQ(companyId: string, id: string): Promise<RFQ | null> {
  const { data: rfq } = await supabase
    .from("procurement_rfqs")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .single();
  if (!rfq) return null;

  const { data: items } = await supabase
    .from("procurement_rfq_items")
    .select("*, product:products(name, sku)")
    .eq("rfq_id", id)
    .eq("company_id", companyId)
    .order("sort_order");

  const { data: responses } = await supabase
    .from("procurement_rfq_responses")
    .select("*, supplier:suppliers(name)")
    .eq("rfq_id", id)
    .eq("company_id", companyId);

  const responseIds = (responses ?? []).map((r: any) => r.id);
  let responseItems: RFQResponseItem[] = [];

  if (responseIds.length > 0) {
    const { data: ri } = await supabase
      .from("procurement_rfq_response_items")
      .select("*")
      .in("response_id", responseIds)
      .eq("company_id", companyId);
    responseItems = (ri ?? []) as RFQResponseItem[];
  }

  const enrichedResponses = (responses ?? []).map((r: any) => ({
    ...r,
    items: responseItems.filter((i) => i.response_id === r.id),
  }));

  return { ...rfq, items: items ?? [], responses: enrichedResponses } as RFQ;
}

export async function createRFQ(
  companyId: string, userId: string, payload: Partial<RFQ>
): Promise<RFQ> {
  const { items, responses, id: _id, company_id: _cid, created_at: _ca, ...safe } = payload as any;

  const { count } = await supabase
    .from("procurement_rfqs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const rfqNumber = `RFQ-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("procurement_rfqs")
    .insert({ ...safe, company_id: companyId, created_by: userId, rfq_number: rfqNumber, status: "draft" })
    .select("*").single();
  if (error) throw error;
  return { ...data, items: [], responses: [] } as RFQ;
}

export async function updateRFQ(companyId: string, id: string, updates: Partial<RFQ>): Promise<void> {
  const { items, responses, id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("procurement_rfqs")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateRFQStatus(companyId: string, id: string, status: RFQStatus): Promise<void> {
  await supabase.from("procurement_rfqs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function deleteRFQ(companyId: string, id: string): Promise<void> {
  await supabase.from("procurement_rfqs").delete().eq("id", id).eq("company_id", companyId);
}

// ── ITEMS ──────────────────────────────────────────────────────

export async function upsertRFQItem(companyId: string, rfqId: string, item: Partial<RFQItem>): Promise<void> {
  if (item.id) {
    const { id, company_id: _cid, rfq_id: _rid, created_at: _ca, product: _p, ...safe } = item as any;
    await supabase.from("procurement_rfq_items").update(safe).eq("id", id).eq("company_id", companyId);
  } else {
    const { product: _p, id: _id, ...safe } = item as any;
    await supabase.from("procurement_rfq_items").insert({ ...safe, company_id: companyId, rfq_id: rfqId });
  }
}

export async function deleteRFQItem(companyId: string, id: string): Promise<void> {
  await supabase.from("procurement_rfq_items").delete().eq("id", id).eq("company_id", companyId);
}

// ── RESPONSES ──────────────────────────────────────────────────

export async function addSupplierToRFQ(
  companyId: string, rfqId: string, supplierId: string
): Promise<RFQResponse> {
  const { data, error } = await supabase
    .from("procurement_rfq_responses")
    .insert({ company_id: companyId, rfq_id: rfqId, supplier_id: supplierId, status: "pending" })
    .select("*, supplier:suppliers(name)").single();
  if (error) throw error;
  return { ...data, items: [] } as RFQResponse;
}

export async function removeSupplierFromRFQ(companyId: string, responseId: string): Promise<void> {
  await supabase.from("procurement_rfq_responses").delete().eq("id", responseId).eq("company_id", companyId);
}

export async function upsertResponseItem(
  companyId: string, responseId: string, rfqItemId: string,
  unitPrice: number, currency: string, notes?: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("procurement_rfq_response_items")
    .select("id")
    .eq("response_id", responseId)
    .eq("rfq_item_id", rfqItemId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("procurement_rfq_response_items")
      .update({ unit_price: unitPrice, currency, total_price: unitPrice, notes: notes ?? null })
      .eq("id", existing.id).eq("company_id", companyId);
  } else {
    await supabase.from("procurement_rfq_response_items").insert({
      company_id: companyId, response_id: responseId, rfq_item_id: rfqItemId,
      unit_price: unitPrice, currency, total_price: unitPrice, notes: notes ?? null,
    });
  }

  // Marcar respuesta como recibida
  await supabase.from("procurement_rfq_responses")
    .update({ status: "received", received_at: new Date().toISOString() })
    .eq("id", responseId).eq("company_id", companyId);
}

export async function awardRFQ(
  companyId: string, rfqId: string, winnerId: string
): Promise<void> {
  // Marcar ganador
  await supabase.from("procurement_rfq_responses")
    .update({ status: "awarded" })
    .eq("rfq_id", rfqId).eq("supplier_id", winnerId).eq("company_id", companyId);

  // Marcar resto como not_awarded
  await supabase.from("procurement_rfq_responses")
    .update({ status: "not_awarded" })
    .eq("rfq_id", rfqId).eq("company_id", companyId)
    .neq("supplier_id", winnerId);

  await updateRFQStatus(companyId, rfqId, "awarded");
}

export function filterRFQs(rfqs: RFQ[], f: RFQFilters): RFQ[] {
  const q = f.search.trim().toLowerCase();
  return rfqs.filter((r) => {
    if (q && !r.title.toLowerCase().includes(q) && !r.rfq_number?.toLowerCase().includes(q)) return false;
    if (f.status !== "all" && r.status !== f.status) return false;
    return true;
  });
}
