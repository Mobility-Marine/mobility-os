import { supabase } from "@/lib/supabaseClient";
import type {
  Requisition, RequisitionItem, RequisitionStatus,
  RequisitionPriority, RequisitionFilters,
} from "../types/requisition.types";

// ── REQUISITIONS ───────────────────────────────────────────────

export async function fetchRequisitions(companyId: string): Promise<Requisition[]> {
  const { data } = await supabase
    .from("procurement_requisitions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Requisition[];
}

export async function fetchRequisition(companyId: string, id: string): Promise<Requisition | null> {
  const { data: req } = await supabase
    .from("procurement_requisitions")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .single();
  if (!req) return null;

  const { data: items } = await supabase
    .from("procurement_requisition_items")
    .select("*, product:products(name, sku)")
    .eq("requisition_id", id)
    .eq("company_id", companyId)
    .order("sort_order");

  return { ...req, items: items ?? [] } as Requisition;
}

export async function createRequisition(
  companyId: string, userId: string,
  payload: Partial<Requisition>
): Promise<Requisition> {
  const { items, id: _id, company_id: _cid, created_at: _ca, ...safe } = payload as any;

  // Generar número de requisición
  const { count } = await supabase
    .from("procurement_requisitions")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const reqNumber = `REQ-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("procurement_requisitions")
    .insert({
      ...safe,
      company_id:        companyId,
      requested_by:      userId,
      requisition_number: reqNumber,
      status:            "draft",
      auto_generated:    false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, items: [] } as Requisition;
}

export async function updateRequisition(
  companyId: string, id: string, updates: Partial<Requisition>
): Promise<void> {
  const { items, id: _id, company_id: _cid, created_at: _ca, ...safe } = updates as any;
  await supabase.from("procurement_requisitions")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateRequisitionStatus(
  companyId: string, id: string,
  status: RequisitionStatus,
  extra?: { approved_by?: string; rejected_by?: string; rejection_reason?: string }
): Promise<void> {
  const now = new Date().toISOString();
  const updates: any = { status, updated_at: now };
  if (extra?.approved_by)      { updates.approved_by = extra.approved_by; updates.approved_at = now; }
  if (extra?.rejected_by)      { updates.rejected_by = extra.rejected_by; updates.rejected_at = now; }
  if (extra?.rejection_reason) { updates.rejection_reason = extra.rejection_reason; }
  await supabase.from("procurement_requisitions").update(updates).eq("id", id).eq("company_id", companyId);
}

export async function deleteRequisition(companyId: string, id: string): Promise<void> {
  await supabase.from("procurement_requisitions").delete().eq("id", id).eq("company_id", companyId);
}

// ── ITEMS ──────────────────────────────────────────────────────

export async function upsertRequisitionItem(
  companyId: string, requisitionId: string, item: Partial<RequisitionItem>
): Promise<void> {
  if (item.id) {
    const { id, company_id: _cid, requisition_id: _rid, created_at: _ca, product: _p, ...safe } = item as any;
    await supabase.from("procurement_requisition_items").update(safe).eq("id", id).eq("company_id", companyId);
  } else {
    const { product: _p, id: _id, ...safe } = item as any;
    await supabase.from("procurement_requisition_items").insert({
      ...safe, company_id: companyId, requisition_id: requisitionId,
    });
  }
}

export async function deleteRequisitionItem(companyId: string, id: string): Promise<void> {
  await supabase.from("procurement_requisition_items").delete().eq("id", id).eq("company_id", companyId);
}

// ── FILTROS ────────────────────────────────────────────────────

export function filterRequisitions(reqs: Requisition[], f: RequisitionFilters): Requisition[] {
  const q = f.search.trim().toLowerCase();
  return reqs.filter((r) => {
    if (q &&
      !r.title.toLowerCase().includes(q) &&
      !r.requisition_number?.toLowerCase().includes(q) &&
      !r.department?.toLowerCase().includes(q)
    ) return false;
    if (f.status   !== "all" && r.status   !== f.status)   return false;
    if (f.priority !== "all" && r.priority !== f.priority) return false;
    return true;
  });
}
