import { supabase } from "@/lib/supabaseClient";
import type {
  Shipment, ShipmentService, ShipmentFilters, ShipmentKPIs,
  ShipmentStatus, ShipmentServiceType, CurrencyTotals, CurrencyAmounts,
} from "../types/shipments.types";

// ── HELPERS MULTI-MONEDA ──────────────────────────────────────
export function calcTotalsByCurrency(services: ShipmentService[]): CurrencyTotals {
  const byCurrency: CurrencyTotals = {};
  for (const svc of services) {
    const cur   = svc.currency ?? "USD";
    const price = Number(svc.price ?? 0);
    const tax   = price * 0.16; // IVA estándar por línea
    if (!byCurrency[cur]) byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
    byCurrency[cur].subtotal += price;
    byCurrency[cur].tax      += tax;
    byCurrency[cur].total    += price + tax;
  }
  return byCurrency;
}

export function calcCostByCurrency(services: ShipmentService[]): CurrencyAmounts {
  const byCurrency: CurrencyAmounts = {};
  for (const svc of services) {
    const cur  = svc.currency ?? "USD";
    const cost = Number(svc.cost ?? 0);
    byCurrency[cur] = (byCurrency[cur] ?? 0) + cost;
  }
  return byCurrency;
}

// Agrega totales calculados a cada embarque
function enrichWithTotals(shipment: Shipment & { services?: ShipmentService[] }): Shipment {
  const services = shipment.services ?? [];
  return {
    ...shipment,
    totals_by_currency: calcTotalsByCurrency(services),
    cost_by_currency:   calcCostByCurrency(services),
  };
}

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
  const counter = settings?.shipment_ref_counter ?? 1;

  const TYPE_CODES: Record<string, string> = {
    terrestre_mx:  "T", terrestre_usa: "T", maritimo: "M",
    aereo:         "A", multimodal:    "X", almacenaje: "W",
    aduanal:       "D", consultoria:   "C", seguro:     "S",
    otro:          "O",
  };

  const clientKey = clientName.replace(/\s+/g, "").substring(0, 3).toUpperCase();
  const reference = format
    .replace("{CLIENTE}", clientKey)
    .replace("{TIPO}",    TYPE_CODES[serviceType] ?? "O")
    .replace("{NUM}",     String(counter).padStart(4, "0"))
    .replace("{AÑO}",     String(new Date().getFullYear()))
    .replace("{MES}",     String(new Date().getMonth() + 1).padStart(2, "0"));

  await supabase.from("company_settings")
    .update({ shipment_ref_counter: counter + 1 })
    .eq("company_id", companyId);

  return reference;
}

// ── FETCH ─────────────────────────────────────────────────────
export async function fetchShipments(companyId: string): Promise<Shipment[]> {
  // 1. Lista base de embarques
  const { data: shipments } = await supabase
    .from("shipments")
    .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number), provider:logistics_providers(name, contact_phone)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (!shipments?.length) return [];

  // 2. Todos los servicios en un solo query (batch)
  const shipmentIds = shipments.map(s => s.id);
  const { data: allServices } = await supabase
    .from("shipment_services")
    .select("*")
    .in("shipment_id", shipmentIds)
    .order("sort_order");

  // 3. Agrupar servicios por shipment_id
  const servicesByShipment: Record<string, ShipmentService[]> = {};
  for (const svc of allServices ?? []) {
    const sid = svc.shipment_id;
    if (!servicesByShipment[sid]) servicesByShipment[sid] = [];
    servicesByShipment[sid].push(svc as ShipmentService);
  }

  // 4. Enriquecer con totales multi-moneda
  return shipments.map(s => enrichWithTotals({
    ...s,
    services: servicesByShipment[s.id] ?? [],
  } as Shipment));
}

export async function fetchShipment(companyId: string, id: string): Promise<Shipment | null> {
  const [{ data: shipment }, { data: services }] = await Promise.all([
    supabase.from("shipments")
      .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number), provider:logistics_providers(name, contact_phone)")
      .eq("company_id", companyId).eq("id", id).single(),
    supabase.from("shipment_services")
      .select("*").eq("shipment_id", id).order("sort_order"),
  ]);

  if (!shipment) return null;

  return enrichWithTotals({
    ...shipment,
    services: (services ?? []) as ShipmentService[],
  } as Shipment);
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
      quotation_id:        payload.quotation_id        ?? null,
      client_id:           payload.client_id           ?? null,
      status:              "draft",
      service_type:        payload.service_type        ?? "terrestre_mx",
      origin:              payload.origin              ?? null,
      destination:         payload.destination         ?? null,
      origin_country:      payload.origin_country      ?? "México",
      destination_country: payload.destination_country ?? "México",
      incoterm:            payload.incoterm            ?? null,
      provider_id:         payload.provider_id         ?? null,
      currency:            payload.currency            ?? "USD",
      subtotal:            payload.subtotal            ?? 0,
      tax_rate:            payload.tax_rate            ?? 16,
      tax_amount:          payload.tax_amount          ?? 0,
      total:               payload.total               ?? 0,
      provider_cost:       payload.provider_cost       ?? 0,
      provider_currency:   payload.provider_currency   ?? "USD",
      profit:              (payload.total ?? 0) - (payload.provider_cost ?? 0),
      pickup_date:         payload.pickup_date         ?? null,
      estimated_delivery:  payload.estimated_delivery  ?? null,
      notes:               payload.notes               ?? null,
      internal_notes:      payload.internal_notes      ?? null,
      created_by:          userId,
    })
    .select("*, client:clients(name, email, rfc), quotation:quotations(quote_number)")
    .single();

  if (error) throw error;
  return enrichWithTotals({ ...data, services: [] } as Shipment);
}

// ── UPDATE ────────────────────────────────────────────────────
export async function updateShipment(
  companyId: string, id: string, updates: Partial<Shipment>
): Promise<void> {
  const {
    client, quotation, provider, services,
    totals_by_currency, cost_by_currency,
    id: _id, company_id: _cid, created_at: _ca, reference: _ref,
    ...safe
  } = updates as any;

  if (safe.total !== undefined || safe.provider_cost !== undefined) {
    const { data: current } = await supabase
      .from("shipments").select("total, provider_cost").eq("id", id).single();
    const total    = safe.total         ?? current?.total         ?? 0;
    const provCost = safe.provider_cost ?? current?.provider_cost ?? 0;
    safe.profit    = total - provCost;
  }

  await supabase.from("shipments")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

// ── STATUS ────────────────────────────────────────────────────
export async function updateShipmentStatus(
  companyId: string, id: string, status: ShipmentStatus, userId: string
): Promise<void> {
  const now      = new Date().toISOString();
  const updates: any = { status, updated_at: now };
  if (status === "delivered") updates.actual_delivery = now;

  await supabase.from("shipments").update(updates).eq("id", id).eq("company_id", companyId);

  const labels: Partial<Record<ShipmentStatus, string>> = {
    coordinating:     "Servicio en coordinación",
    pickup_scheduled: "Recolección programada",
    in_transit:       "Servicio en tránsito",
    at_destination:   "Servicio en destino",
    delivered:        "Servicio entregado",
    invoiced:         "Servicio facturado",
    cancelled:        "Servicio cancelado",
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
  await recalcShipmentTotals(companyId, shipmentId);
}

export async function deleteShipmentService(
  companyId: string, shipmentId: string, serviceId: string
): Promise<void> {
  await supabase.from("shipment_services").delete().eq("id", serviceId).eq("company_id", companyId);
  await recalcShipmentTotals(companyId, shipmentId);
}

// Recalcula totales respetando moneda por línea
// El campo total/subtotal de la tabla usa la moneda de referencia del embarque
async function recalcShipmentTotals(companyId: string, shipmentId: string): Promise<void> {
  const [{ data: shipment }, { data: services }] = await Promise.all([
    supabase.from("shipments").select("currency, tax_rate").eq("id", shipmentId).single(),
    supabase.from("shipment_services").select("price, cost, currency").eq("shipment_id", shipmentId),
  ]);

  const mainCurrency = shipment?.currency ?? "USD";
  const lines        = services ?? [];

  // Subtotal solo de líneas en la moneda principal del embarque
  const mainLines    = lines.filter(l => (l.currency ?? "USD") === mainCurrency);
  const subtotal     = mainLines.reduce((s, l) => s + (l.price ?? 0), 0);
  const taxAmt       = subtotal * 0.16;
  const total        = subtotal + taxAmt;

  // Costo total en moneda del proveedor (puede ser distinta)
  const providerCost = lines.reduce((s, l) => s + (l.cost ?? 0), 0);
  const profit       = total - providerCost;

  await supabase.from("shipments").update({
    subtotal, tax_amount: taxAmt, total,
    provider_cost: providerCost, profit,
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
  const active    = shipments.filter(s => !["delivered","invoiced","cancelled"].includes(s.status));
  const delivered = shipments.filter(s => ["delivered","invoiced"].includes(s.status));

  // Totales multi-moneda desde servicios
  const revenueByCurrency: CurrencyAmounts = {};
  const costByCurrency:    CurrencyAmounts = {};
  const profitByCurrency:  CurrencyAmounts = {};

  for (const shipment of delivered) {
    const mainCur  = shipment.currency ?? "USD";
    const provCost = Number(shipment.provider_cost ?? 0);
    // Usar siempre currency del embarque para el costo cuando coincide con AP
    // provider_currency puede estar mal guardado — AP es la fuente de verdad
    const provCur  = shipment.provider_currency && shipment.provider_currency !== "USD" || mainCur === "USD"
      ? (shipment.provider_currency ?? mainCur)
      : mainCur;

    // Ingreso: usar shipment.total (incluye IVA) — fuente más confiable
    revenueByCurrency[mainCur] = (revenueByCurrency[mainCur] ?? 0) + (shipment.total ?? 0);

    // Costo desde provider_cost (actualizado por AP)
    if (provCost > 0) {
      costByCurrency[provCur]   = (costByCurrency[provCur]   ?? 0) + provCost;
      profitByCurrency[mainCur] = (profitByCurrency[mainCur] ?? 0) + ((shipment.total ?? 0) - provCost);
    } else {
      // Sin costo registrado: ganancia = ingreso total (pendiente de registrar factura)
      profitByCurrency[mainCur] = (profitByCurrency[mainCur] ?? 0) + (shipment.total ?? 0);
    }
  }

  // Legacy single-currency para compatibilidad
  const totalRevenue = Object.values(revenueByCurrency).reduce((s, v) => s + v, 0);
  const totalCost    = Object.values(costByCurrency).reduce((s, v) => s + v, 0);
  const totalProfit  = totalRevenue - totalCost;
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    total:     shipments.length,
    active:    active.length,
    delivered: delivered.length,
    cancelled: shipments.filter(s => s.status === "cancelled").length,
    revenueByCurrency,
    costByCurrency,
    profitByCurrency,
    avgMargin,
    totalRevenue,
    totalCost,
    totalProfit,
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
export async function fetchLogisticsProviders(
  companyId: string
): Promise<{ id: string; name: string; contact_phone?: string }[]> {
  const { data } = await supabase
    .from("logistics_providers")
    .select("id, name, contact_phone")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as any[];
}
