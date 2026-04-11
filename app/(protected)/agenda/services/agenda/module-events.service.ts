import { supabase } from "@/lib/supabaseClient";

export interface ModuleEvent {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  color: string;
  module: string;
  module_label: string;
  entity_id: string;
  read_only: boolean;
}

const MODULE_COLORS: Record<string, string> = {
  finanzas:   "#1D9E75",
  comercial:  "#274B97",
  logistica:  "#BA7517",
  compras:    "#534AB7",
};

async function upsertModuleEvent(
  companyId: string,
  payload: {
    title: string;
    start_datetime: string;
    end_datetime: string;
    color: string;
    event_type: string;
    visibility: string;
    company_id: string;
    description?: string;
  },
  entityRef: string
) {
  const { data: existing } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("company_id", companyId)
    .eq("event_type", payload.event_type)
    .eq("description", entityRef)
    .maybeSingle();

  if (existing) return;

  await supabase.from("calendar_events").insert({
    ...payload,
    description: entityRef,
    status: "Programado",
    priority: "Media",
    all_day: true,
    timezone: "America/Mexico_City",
  } as any);
}

export async function syncFinanzasEvents(companyId: string) {
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, due_date, total_amount, status, client_id")
    .eq("company_id", companyId)
    .in("status", ["pending", "overdue", "sent"])
    .not("due_date", "is", null)
    .limit(30);

  if (!invoices) return;

  for (const inv of invoices) {
    const dueDate = new Date(inv.due_date);
    const isOverdue = dueDate < new Date();

    await upsertModuleEvent(companyId, {
      company_id:     companyId,
      title:          `Vencimiento factura ${inv.invoice_number ?? inv.id.slice(0, 8)}`,
      start_datetime: dueDate.toISOString(),
      end_datetime:   dueDate.toISOString(),
      color:          isOverdue ? "#E44E36" : MODULE_COLORS.finanzas,
      event_type:     "module_finanzas",
      visibility:     "company",
    }, `invoice:${inv.id}`);
  }
}

export async function syncComercialEvents(companyId: string) {
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, name, next_contact_date, status")
    .eq("company_id", companyId)
    .in("status", ["active", "follow_up", "negotiation"])
    .not("next_contact_date", "is", null)
    .limit(30);

  if (prospects) {
    for (const p of prospects) {
      const d = new Date(p.next_contact_date);
      await upsertModuleEvent(companyId, {
        company_id:     companyId,
        title:          `Seguimiento: ${p.name}`,
        start_datetime: d.toISOString(),
        end_datetime:   d.toISOString(),
        color:          MODULE_COLORS.comercial,
        event_type:     "module_comercial",
        visibility:     "company",
      }, `prospect:${p.id}`);
    }
  }

  const { data: quotations } = await supabase
    .from("quotations")
    .select("id, quotation_number, expires_at, status")
    .eq("company_id", companyId)
    .in("status", ["sent", "pending", "review"])
    .not("expires_at", "is", null)
    .limit(20);

  if (quotations) {
    for (const q of quotations) {
      const d = new Date(q.expires_at);
      await upsertModuleEvent(companyId, {
        company_id:     companyId,
        title:          `Vence cotización ${q.quotation_number ?? q.id.slice(0, 8)}`,
        start_datetime: d.toISOString(),
        end_datetime:   d.toISOString(),
        color:          MODULE_COLORS.comercial,
        event_type:     "module_comercial",
        visibility:     "company",
      }, `quotation:${q.id}`);
    }
  }
}

export async function syncLogisticaEvents(companyId: string) {
  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, tracking_number, estimated_arrival, status, destination")
    .eq("company_id", companyId)
    .in("status", ["in_transit", "pending", "customs"])
    .not("estimated_arrival", "is", null)
    .limit(20);

  if (!shipments) return;

  for (const s of shipments) {
    const d = new Date(s.estimated_arrival);
    await upsertModuleEvent(companyId, {
      company_id:     companyId,
      title:          `ETA embarque ${s.tracking_number ?? s.id.slice(0, 8)}`,
      start_datetime: d.toISOString(),
      end_datetime:   d.toISOString(),
      color:          MODULE_COLORS.logistica,
      event_type:     "module_logistica",
      visibility:     "company",
    }, `shipment:${s.id}`);
  }
}

export async function syncComprasEvents(companyId: string) {
  const { data: orders } = await supabase
    .from("purchase_orders")
    .select("id, order_number, expected_delivery, status, supplier_id")
    .eq("company_id", companyId)
    .in("status", ["ordered", "pending", "in_transit"])
    .not("expected_delivery", "is", null)
    .limit(20);

  if (!orders) return;

  for (const o of orders) {
    const d = new Date(o.expected_delivery);
    await upsertModuleEvent(companyId, {
      company_id:     companyId,
      title:          `Recepción OC ${o.order_number ?? o.id.slice(0, 8)}`,
      start_datetime: d.toISOString(),
      end_datetime:   d.toISOString(),
      color:          MODULE_COLORS.compras,
      event_type:     "module_compras",
      visibility:     "company",
    }, `purchase_order:${o.id}`);
  }
}

export async function syncAllModuleEvents(companyId: string) {
  await Promise.allSettled([
    syncFinanzasEvents(companyId),
    syncComercialEvents(companyId),
    syncLogisticaEvents(companyId),
    syncComprasEvents(companyId),
  ]);
}

export function getModuleFromEventType(eventType: string): {
  label: string; color: string; module: string;
} | null {
  if (eventType === "module_finanzas")  return { label: "Finanzas",   color: MODULE_COLORS.finanzas,  module: "finanzas" };
  if (eventType === "module_comercial") return { label: "Comercial",  color: MODULE_COLORS.comercial, module: "comercial" };
  if (eventType === "module_logistica") return { label: "Logística",  color: MODULE_COLORS.logistica, module: "logistica" };
  if (eventType === "module_compras")   return { label: "Compras",    color: MODULE_COLORS.compras,   module: "compras" };
  return null;
}

export function isModuleEvent(eventType?: string | null): boolean {
  return Boolean(eventType?.startsWith("module_"));
}
