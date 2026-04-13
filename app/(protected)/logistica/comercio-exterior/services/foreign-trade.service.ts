import { supabase }   from "@/lib/supabaseClient";
import type { ForeignTradeOperation, ForeignTradeItem, FTFilters, TradeStatus } from "../types/foreign-trade.types";

const SELECT_OP = `
  *,
  shipment:shipments(reference, client:clients(name)),
  client:clients(name),
  customs_broker:logistics_providers(provider_name)
`;

export async function fetchOperations(companyId: string): Promise<ForeignTradeOperation[]> {
  const { data } = await supabase
    .from("foreign_trade_operations")
    .select(SELECT_OP)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ForeignTradeOperation[];
}

export async function fetchOperation(companyId: string, id: string): Promise<ForeignTradeOperation | null> {
  const [{ data: op }, { data: items }] = await Promise.all([
    supabase.from("foreign_trade_operations").select(SELECT_OP).eq("company_id", companyId).eq("id", id).single(),
    supabase.from("foreign_trade_items").select("*").eq("operation_id", id).order("sort_order"),
  ]);
  if (!op) return null;
  return { ...op, items: items ?? [] } as ForeignTradeOperation;
}

export async function createOperation(
  companyId: string, userId: string, data: Partial<ForeignTradeOperation>
): Promise<ForeignTradeOperation> {
  const { items, shipment, client, customs_broker, id: _id, company_id: _cid, created_at: _ca, total_taxes: _tt, ...safe } = data as any;
  const { data: created, error } = await supabase
    .from("foreign_trade_operations")
    .insert({ ...safe, company_id: companyId, created_by: userId, status: "open", igi: 0, iva: 0, dta: 0, prevalidacion: 0, otros_impuestos: 0, alert_inspection: false, alert_embargo: false, invoice_currency: safe.invoice_currency ?? "USD" })
    .select(SELECT_OP).single();
  if (error) throw error;
  return { ...created, items: [] } as ForeignTradeOperation;
}

export async function updateOperation(
  companyId: string, id: string, updates: Partial<ForeignTradeOperation>
): Promise<void> {
  const { items, shipment, client, customs_broker, id: _id, company_id: _cid, created_at: _ca, total_taxes: _tt, ...safe } = updates as any;
  await supabase.from("foreign_trade_operations")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateTradeStatus(companyId: string, id: string, status: TradeStatus): Promise<void> {
  const extra: any = { updated_at: new Date().toISOString() };
  if (status === "at_customs")  extra.entry_date   = new Date().toISOString().split("T")[0];
  if (status === "released")    extra.release_date  = new Date().toISOString().split("T")[0];
  await supabase.from("foreign_trade_operations").update({ status, ...extra }).eq("id", id).eq("company_id", companyId);
}

export async function deleteOperation(companyId: string, id: string): Promise<void> {
  await supabase.from("foreign_trade_operations").delete().eq("id", id).eq("company_id", companyId);
}

export async function upsertFTItem(
  companyId: string, operationId: string, item: Partial<ForeignTradeItem>
): Promise<void> {
  if (item.id) {
    const { id, company_id: _cid, operation_id: _oid, created_at: _ca, ...safe } = item as any;
    await supabase.from("foreign_trade_items").update({ ...safe, total_value: (safe.quantity ?? 1) * (safe.unit_value ?? 0) }).eq("id", id).eq("company_id", companyId);
  } else {
    const total_value = (item.quantity ?? 1) * (item.unit_value ?? 0);
    await supabase.from("foreign_trade_items").insert({ ...item, total_value, company_id: companyId, operation_id: operationId });
  }
}

export async function deleteFTItem(companyId: string, itemId: string): Promise<void> {
  await supabase.from("foreign_trade_items").delete().eq("id", itemId).eq("company_id", companyId);
}

export function filterOperations(ops: ForeignTradeOperation[], f: FTFilters): ForeignTradeOperation[] {
  const q = f.search.trim().toLowerCase();
  return ops.filter((o) => {
    if (q &&
      !o.pedimento_number?.toLowerCase().includes(q) &&
      !o.invoice_number?.toLowerCase().includes(q) &&
      !o.shipment?.reference?.toLowerCase().includes(q) &&
      !o.shipment?.client?.name?.toLowerCase().includes(q) &&
      !o.client?.name?.toLowerCase().includes(q)
    ) return false;
    if (f.operation_type !== "all" && o.operation_type !== f.operation_type) return false;
    if (f.status         !== "all" && o.status         !== f.status)         return false;
    return true;
  });
}

export function fmtCurrency(v: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, minimumFractionDigits: 2 }).format(v);
}
