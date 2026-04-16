import { supabase } from "@/lib/supabaseClient";
import type {
  Shipment, ShipmentService, ShipmentFilters, ShipmentKPIs,
  ShipmentStatus, ShipmentServiceType,
} from "../types/shipments.types";

// ── REFERENCIA ────────────────────────────────────────────────

export async function generateShipmentReference(
  companyId: string, clientName: string, serviceType: ShipmentServiceType
): Promise<string> {
  const { data: settings } = await supabase
    .from("company_settings")
    .select("shipment_ref_format, shipment_ref_counter")
    .eq("company_id", companyId)
    .single();

  const format  = settings?.shipment_ref_format ?? "LOG_{CLIENTE}_{TIPO}{NUM}";
  let   counter = settings?.shipment_ref_counter ?? 1;

  // Código de tipo
  const TYPE_CODES: Record<string, string> = {
    terrestre_mx: "T", terrestre_usa: "T", maritimo: "M",
    aereo: "A", multimodal: "X", almacenaje: "W", aduanal: "D", otro: "O",
  };

  // Clave de cliente: primeras 3 letras sin espacios, mayúsculas
  const clientKey = clientName.replace(/\s+/g, "").substring(0, 3).toUpperCase();

  const reference = format
    .replace("{CLIENTE}", clientKey)
    .replace("{TIPO}",    TYPE_CODES[serviceType] ?? "O")
    .replace("{NUM}",     String(counter).padStart(4, "0"))
    .replace("{AÑO}",     String(new Date().getFullYear()))
    .replace("{MES}",     String(new Date().getMonth() + 1).padStart(2, "0"));

  // Incrementar counter
  await supabase.from("company_settings")
    .update({ shipment_ref_counter: counter + 1 })
    .eq("company_id", companyId);

  return reference;
}

// ── FETCH ─────────────────────────────────────────────────────

export async function fetchShipments(companyId: string): Promise<Shipment[]> {
  const { data } = await supabase
    .from("shipments")
    .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number), provider:logistics_providers(name, contact_phone)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Shipment[];
}

export async function fetchShipment(companyId: string, id: string): Promise<Shipment | null> {
  const [{ data: shipment }, { data: services }] = await Promise.all([
    // DESPUÉS:
    supabase.from("shipments")
      .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number), provider:logistics_providers(name, contact_phone)")
      .eq("company_id", companyId).eq("id", id).single(),
    supabase.from("shipment_services")
      .select("*").eq("shipment_id", id).order("sort_order"),
  ]);
  if (!shipment) return null;
  return { ...shipment, services: services ?? [] } as Shipment;
}

// ── PRECIO PROMEDIO HISTÓRICO ─────────────────────────────────

export async function fetchAvgPrice(
  companyId: string, serviceType: ShipmentServiceType,
  origin?: string, destination?: string
): Promise<{ avg: number; count: number } | null> {
  let query = supabase
    .from("shipments")
    .select("total")
    .eq("company_id", companyId)
    .eq("service_type", serviceType)
    .not("total", "is", null)
    .gt("total", 0);

  if (origin)      query = query.ilike("origin",      `%${origin}%`);
  if (destination) query = query.ilike("destination", `%${destination}%`);

  const { data } = await query.limit(20);
  if (!data?.length) return null;

  const avg = data.reduce((s, r) => s + (r.total ?? 0), 0) / data.length;
  return { avg, count: data.length };
}

// ── CREATE ────────────────────────────────────────────────────

export async function createShipment(
  companyId: string, userId: string,
  payload: Partial<Shipment> & { clientName: string }
): Promise<Shipment> {
  const reference = await generateShipmentReference(
    companyId, payload.clientName, payload.service_type ?? "terrestre_mx"
  );

  const { data, error } = await supabase
    .from("shipments")
    .insert({
      company_id:          companyId,
      reference,
      quotation_id:        payload.quotation_id    ?? null,
      client_id:           payload.client_id       ?? null,
      status:              "draft",
      service_type:        payload.service_type    ?? "terrestre_mx",
      origin:              payload.origin          ?? null,
      destination:         payload.destination     ?? null,
      origin_country:      payload.origin_country  ?? "México",
      destination_country: payload.destination_country ?? "México",
      incoterm:            payload.incoterm        ?? null,
      provider_id:         payload.provider_id     ?? null,
      currency:            payload.currency        ?? "USD",
      subtotal:            payload.subtotal        ?? 0,
      tax_rate:            payload.tax_rate        ?? 16,
      tax_amount:          payload.tax_amount      ?? 0,
      total:               payload.total           ?? 0,
      provider_cost:       payload.provider_cost   ?? 0,
      provider_currency:   payload.provider_currency ?? "USD",
      profit:              (payload.total ?? 0) - (payload.provider_cost ?? 0),
      pickup_date:         payload.pickup_date     ?? null,
      estimated_delivery:  payload.estimated_delivery ?? null,
      notes:               payload.notes           ?? null,
      internal_notes:      payload.internal_notes  ?? null,
      created_by:          userId,
    })
    .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number)")
    .single();

  if (error) throw error;
  return data as Shipment;
}

// ── UPDATE ────────────────────────────────────────────────────

export async function updateShipment(
  companyId: string, id: string, updates: Partial<Shipment>
): Promise<void> {
  const { client, quotation, provider, services, id: _id, company_id: _cid, created_at: _ca, reference: _ref, ...safe } = updates as any;

  // Recalcular profit si cambia total o provider_cost
  if (safe.total !== undefined || safe.provider_cost !== undefined) {
    const { data: current } = await supabase
      .from("shipments").select("total, provider_cost").eq("id", id).single();
    const total       = safe.total         ?? current?.total         ?? 0;
    const provCost    = safe.provider_cost ?? current?.provider_cost ?? 0;
    safe.profit       = total - provCost;
  }

  await supabase.from("shipments")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

// ── STATUS ────────────────────────────────────────────────────

export async function updateShipmentStatus(
  companyId: string, id: string, status: ShipmentStatus, userId: string
): Promise<void> {
  const now     = new Date().toISOString();
  const updates: any = { status, updated_at: now };
  if (status === "delivered") updates.actual_delivery = now;

  await supabase.from("shipments").update(updates).eq("id", id).eq("company_id", companyId);

  // Timeline
  const labels: Partial<Record<ShipmentStatus, string>> = {
    coordinating:      "Servicio en coordinación",
    pickup_scheduled:  "Recolección programada",
    in_transit:        "Servicio en tránsito",
    at_destination:    "Servicio en destino",
    delivered:         "Servicio entregado",
    invoiced:          "Servicio facturado",
    cancelled:         "Servicio cancelado",
  };

  await supabase.from("entity_timeline_events").insert({
    company_id:     companyId,
    entity_type:    "shipment",
    entity_id:      id,
    module_key:     "embarques",
    event_type:     `status_${status}`,
    event_category: "logistics",
    title:          labels[status] ?? `Estado: ${status}`,
    created_by:     userId,
  }).then(() => {});
}

// ── SERVICES ─────────────────────────────────────────────────

export async function upsertShipmentService(
  companyId: string, shipmentId: string,
  service: Partial<ShipmentService> & { description: string; service_type: string }
): Promise<void> {
  if (service.id) {
    const { id, company_id: _cid, shipment_id: _sid, created_at: _ca, ...safe } = service as any;
    await supabase.from("shipment_services").update(safe).eq("id", id).eq("company_id", companyId);
  } else {
    await supabase.from("shipment_services").insert({
      ...service, company_id: companyId, shipment_id: shipmentId,
    });
  }

  // Recalcular totales del embarque
  await recalcShipmentTotals(companyId, shipmentId);
}

export async function deleteShipmentService(
  companyId: string, shipmentId: string, serviceId: string
): Promise<void> {
  await supabase.from("shipment_services").delete().eq("id", serviceId).eq("company_id", companyId);
  await recalcShipmentTotals(companyId, shipmentId);
}

async function recalcShipmentTotals(companyId: string, shipmentId: string): Promise<void> {
  const { data: services } = await supabase
    .from("shipment_services")
    .select("price, cost")
    .eq("shipment_id", shipmentId);

  const subtotal     = (services ?? []).reduce((s, sv) => s + (sv.price ?? 0), 0);
  const providerCost = (services ?? []).reduce((s, sv) => s + (sv.cost  ?? 0), 0);
  const taxAmt       = subtotal * 0.16;
  const total        = subtotal + taxAmt;
  const profit       = total - providerCost;

  await supabase.from("shipments").update({
    subtotal, tax_amount: taxAmt, total, provider_cost: providerCost, profit,
    updated_at: new Date().toISOString(),
  }).eq("id", shipmentId).eq("company_id", companyId);
}

// ── FILTERS + KPIs ────────────────────────────────────────────

export function filterShipments(shipments: Shipment[], filters: ShipmentFilters): Shipment[] {
  return shipments.filter((s) => {
    const q = filters.search.trim().toLowerCase();
    if (q &&
      !s.reference?.toLowerCase().includes(q) &&
      !s.client?.name?.toLowerCase().includes(q) &&
      !s.origin?.toLowerCase().includes(q) &&
      !s.destination?.toLowerCase().includes(q)
    ) return false;

    if (filters.status === "active") {
      if (["delivered", "invoiced", "cancelled"].includes(s.status)) return false;
    } else if (filters.status !== "all") {
      if (s.status !== filters.status) return false;
    }

    if (filters.service_type !== "all" && s.service_type !== filters.service_type) return false;
    return true;
  });
}

export function computeShipmentKPIs(shipments: Shipment[]): ShipmentKPIs {
  const active    = shipments.filter((s) => !["delivered","invoiced","cancelled"].includes(s.status));
  const delivered = shipments.filter((s) => ["delivered","invoiced"].includes(s.status));
  const totalRev  = delivered.reduce((s, sh) => s + (sh.total        ?? 0), 0);
  const totalCost = delivered.reduce((s, sh) => s + (sh.provider_cost ?? 0), 0);
  const totalProfit = totalRev - totalCost;
  const avgMargin   = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

  return {
    total:        shipments.length,
    active:       active.length,
    delivered:    delivered.length,
    cancelled:    shipments.filter((s) => s.status === "cancelled").length,
    totalRevenue: totalRev,
    totalCost,
    totalProfit,
    avgMargin,
  };
}

// ── ACCEPTED SERVICE QUOTATIONS ───────────────────────────────

export async function fetchAcceptedServiceQuotations(companyId: string) {
  const { data } = await supabase
    .from("quotations")
    .select("id, quote_number, client_id, client_name, currency, total, accepted_at, client:clients(name, rfc, email)")
    .eq("company_id", companyId)
    .eq("type", "services")
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false });
  return data ?? [];
}

export async function fetchQuotationServices(quotationId: string) {
  const { data } = await supabase
    .from("quotation_services")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("sort_order");
  return data ?? [];
}

// ── PROVEEDORES LOGÍSTICOS ────────────────────────────────────
export async function fetchLogisticsProviders(companyId: string): Promise<{ id: string; name: string; contact_phone?: string }[]> {
  const { data } = await supabase
    .from("logistics_providers")
    .select("id, name, contact_phone")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as any[];
}
