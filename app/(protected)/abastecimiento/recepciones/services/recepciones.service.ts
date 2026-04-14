import { supabase } from "@/lib/supabaseClient";
import type {
  Reception, ReceptionItem,
  CreateReceptionPayload, UpdateReceptionPayload, UpdateReceptionItemPayload,
  ReceptionFilters, POForReception,
} from "../types/recepciones.types";

// ── Fetch lista ───────────────────────────────────────────────

export async function fetchReceptions(
  companyId: string,
  filters: ReceptionFilters
): Promise<Reception[]> {
  let q = supabase
    .from("purchase_receptions")
    .select(`
  *,
  purchase_order:purchase_orders(po_number, expected_date),
  supplier:suppliers!purchase_receptions_supplier_id_fkey(name, email)
`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.qc     !== "all") q = q.eq("qc_status", filters.qc);
  if (filters.search.trim()) {
    q = q.or(
      `reception_number.ilike.%${filters.search}%,` +
      `supplier_invoice.ilike.%${filters.search}%,` +
      `supplier_remission.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Reception[];
}

// ── Fetch detalle ─────────────────────────────────────────────

export async function fetchReception(id: string): Promise<Reception | null> {
  const { data, error } = await supabase
    .from("purchase_receptions")
    .select(`
  *,
  purchase_order:purchase_orders(po_number, expected_date),
  supplier:suppliers!purchase_receptions_supplier_id_fkey(name, email),
  items:purchase_reception_items(*)
`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Reception;
}

// ── Fetch OCs pendientes de recepción ─────────────────────────

export async function fetchPendingPOs(companyId: string): Promise<POForReception[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      id, po_number, supplier_id, expected_date, currency, total,
      supplier:suppliers(name),
      items:purchase_order_items(
        id, description, sku, unit,
        quantity, quantity_received, quantity_pending, unit_price
      )
    `)
    .eq("company_id", companyId)
    .in("status", ["approved", "sent", "partial"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as POForReception[];
}

// ── Crear recepción ───────────────────────────────────────────

export async function createReception(
  companyId: string,
  userId: string,
  payload: CreateReceptionPayload,
  items: Omit<ReceptionItem, "id" | "company_id" | "reception_id" | "created_at">[]
): Promise<Reception> {
  // Generar número
  const { data: numData, error: numErr } = await supabase
    .rpc("generate_reception_number", { p_company_id: companyId });
  if (numErr) throw new Error(numErr.message);

  const { data, error } = await supabase
    .from("purchase_receptions")
    .insert({
      company_id:        companyId,
      reception_number:  numData,
      status:            "in_progress",
      qc_status:         "pending",
      has_discrepancies: false,
      created_by:        userId,
      received_date:     payload.received_date ?? new Date().toISOString().split("T")[0],
      ...payload,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const reception = data as Reception;

  // Insertar ítems
  if (items.length > 0) {
    const { error: itemsErr } = await supabase
      .from("purchase_reception_items")
      .insert(
        items.map((item, i) => ({
          ...item,
          company_id:   companyId,
          reception_id: reception.id,
          sort_order:   i,
        }))
      );
    if (itemsErr) throw new Error(itemsErr.message);
  }

  return reception;
}

// ── Actualizar recepción ──────────────────────────────────────

export async function updateReception(
  id: string,
  payload: UpdateReceptionPayload
): Promise<void> {
  const { error } = await supabase
    .from("purchase_receptions")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Actualizar ítem ───────────────────────────────────────────

export async function updateReceptionItem(
  id: string,
  payload: UpdateReceptionItemPayload
): Promise<void> {
  const { error } = await supabase
    .from("purchase_reception_items")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Completar recepción (calcula status automático) ───────────

export async function completeReception(receptionId: string): Promise<void> {
  // Traer todos los ítems
  const { data: items, error: itemsErr } = await supabase
    .from("purchase_reception_items")
    .select("quantity_expected, quantity_accepted, quantity_rejected, quantity_quarantine")
    .eq("reception_id", receptionId);
  if (itemsErr) throw new Error(itemsErr.message);

  const totalExpected = items?.reduce((s, i) => s + Number(i.quantity_expected), 0) ?? 0;
  const totalAccepted = items?.reduce((s, i) => s + Number(i.quantity_accepted), 0) ?? 0;
  const totalRejected = items?.reduce((s, i) => s + Number(i.quantity_rejected), 0) ?? 0;
  const hasDiscrepancies = totalRejected > 0 || totalAccepted < totalExpected;

  let status: string;
  let qcStatus: string;

  if (totalAccepted === 0) {
    status   = "rejected";
    qcStatus = "rejected";
  } else if (totalAccepted >= totalExpected && totalRejected === 0) {
    status   = "complete";
    qcStatus = "approved";
  } else {
    status   = "partial";
    qcStatus = "partial";
  }

  const { error } = await supabase
    .from("purchase_receptions")
    .update({
      status,
      qc_status:         qcStatus,
      has_discrepancies: hasDiscrepancies,
      updated_at:        new Date().toISOString(),
    })
    .eq("id", receptionId);
  if (error) throw new Error(error.message);

  // Actualizar cantidades recibidas en los ítems de la OC
  if (items && items.length > 0) {
    const { data: receptionItems } = await supabase
      .from("purchase_reception_items")
      .select("po_item_id, quantity_accepted")
      .eq("reception_id", receptionId)
      .not("po_item_id", "is", null);

    for (const ri of receptionItems ?? []) {
      if (!ri.po_item_id) continue;
      const { data: poItem } = await supabase
        .from("purchase_order_items")
        .select("quantity, quantity_received")
        .eq("id", ri.po_item_id)
        .single();
      if (!poItem) continue;
      const newReceived = Number(poItem.quantity_received) + Number(ri.quantity_accepted);
      const newPending  = Math.max(0, Number(poItem.quantity) - newReceived);
      await supabase
        .from("purchase_order_items")
        .update({ quantity_received: newReceived, quantity_pending: newPending })
        .eq("id", ri.po_item_id);
    }
  }
}

// ── Stats ─────────────────────────────────────────────────────

export async function fetchReceptionStats(companyId: string): Promise<{
  total: number; complete: number; partial: number;
  pending: number; discrepancies: number;
}> {
  const { data, error } = await supabase
    .from("purchase_receptions")
    .select("status, has_discrepancies")
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    total:         rows.length,
    complete:      rows.filter((r) => r.status === "complete").length,
    partial:       rows.filter((r) => r.status === "partial").length,
    pending:       rows.filter((r) => ["draft", "in_progress"].includes(r.status)).length,
    discrepancies: rows.filter((r) => r.has_discrepancies).length,
  };
}
