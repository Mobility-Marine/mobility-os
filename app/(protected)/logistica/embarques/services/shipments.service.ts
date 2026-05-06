import { supabase } from "@/lib/supabaseClient";
import { generateFolio, generateShipmentRef } from "@/lib/folios/generators";
import type {
  Shipment, ShipmentService, ShipmentFilters, ShipmentKPIs,
  ShipmentStatus, ShipmentServiceType, CurrencyTotals, CurrencyAmounts,
} from "../types/shipments.types";

// ── HELPERS MULTI-MONEDA ──────────────────────────────────────
// Cada línea respeta su propio tax_rate (espejo de quotation_services):
//   tax_rate = 16            → IVA estándar MX
//   tax_rate = 0             → sin IVA (típico USD/EUR de comercio exterior)
//   tax_rate = -1            → exento (no causa IVA, declarable en CFDI)
//   tax_rate = null/undefined → fallback 16% (retrocompatibilidad)
export function calcTotalsByCurrency(services: ShipmentService[]): CurrencyTotals {
  const byCurrency: CurrencyTotals = {};
  for (const svc of services) {
    const cur   = svc.currency ?? "USD";
    const price = Number(svc.price ?? 0);
    const rate  = svc.tax_rate;
    const taxRate =
      rate === null || rate === undefined ? 16 :
      rate === -1                          ?  0 :
      Number(rate);
    const tax = price * (taxRate / 100);
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
// ── Códigos legacy de tipo de servicio (para formatos anteriores con {TIPO}) ──
// Mantenemos este map para empresas que aún usan el formato viejo
// LOG_{CLIENTE}_{TIPO}{NUM}. En el formato nuevo {SUBTIPO}-{EMPRESA}-{NUM},
// los servicios se agrupan en CON (consultoría/seguro) y LOG (todo lo demás).
const TYPE_CODES: Record<ShipmentServiceType, string> = {
  terrestre_mx:  "T", terrestre_usa: "T", maritimo: "M",
  aereo:         "A", multimodal:    "X", almacenaje: "W",
  aduanal:       "D", consultoria:   "C", seguro:     "S",
  otro:          "O",
};

/**
 * Genera el folio para un nuevo servicio logístico (embarque).
 *
 * El formato es configurable por empresa en company_settings.shipment_ref_format.
 *
 * Soporta dos esquemas:
 * 1) NUEVO (recomendado): formatos con {SUBTIPO}-{EMPRESA}-{NUM}
 *    Usa contadores separados por subtipo (CON/LOG) para auditoría limpia.
 *    Ej: "CON-MMA-0001", "LOG-MMA-0042"
 *
 * 2) LEGACY: formatos con {CLIENTE} y {TIPO}
 *    Usa el contador único shipment_ref_counter (compatibilidad backwards).
 *    Ej: "LOG_FER_C0004"
 */
export async function generateShipmentReference(
  companyId:   string,
  clientName:  string,
  serviceType: ShipmentServiceType,
): Promise<string> {
  // Determinar el subtipo agregado:
  // - CON: consultoría y seguro (servicios profesionales sin transporte)
  // - LOG: todo lo demás (servicios con movimiento de mercancía)
  const subtipo: "CON" | "LOG" =
    serviceType === "consultoria" || serviceType === "seguro" ? "CON" : "LOG";

  // Leer el formato actual para detectar si es nuevo o legacy
  const { data: settings, error } = await supabase
    .from("company_settings")
    .select("shipment_ref_format")
    .eq("company_id", companyId)
    .single();

  if (error) {
    throw new Error(
      `No se pudo leer shipment_ref_format de la empresa: ${error.message}`,
    );
  }

  const format = String(settings?.shipment_ref_format ?? "{SUBTIPO}-{EMPRESA}-{NUM}");
  const isLegacyFormat = format.includes("{CLIENTE}") || format.includes("{TIPO}");

  // ── Caso LEGACY: formato viejo con tokens {CLIENTE} y {TIPO} ──────
  // Usa el contador único shipment_ref_counter (compatibilidad backwards)
  if (isLegacyFormat) {
    const clientCode = (clientName || "")
      .toUpperCase()
      .replace(/[^A-ZÑ]/g, "")
      .substring(0, 3) || "XXX";

    const { folio } = await generateFolio({
      companyId,
      formatField:  "shipment_ref_format",
      counterField: "shipment_ref_counter",
      tokenValues:  {
        SUBTIPO: subtipo,
        CLIENTE: clientCode,
        TIPO:    TYPE_CODES[serviceType] ?? "O",
      },
    });
    return folio;
  }

  // ── Caso NUEVO: formato {SUBTIPO}-{EMPRESA}-{NUM} ─────────────────
  // Usa contadores separados por subtipo (CON / LOG) para mejor auditoría
  const { folio } = await generateShipmentRef(companyId, subtipo);
  return folio;
}

// ── FETCH ─────────────────────────────────────────────────────
export async function fetchShipments(companyId: string): Promise<Shipment[]> {
  // 1. Lista base de embarques
  const { data: shipments } = await supabase
    .from("shipments")
    .select("*, client:business_partners!client_id(name, email, rfc), quotation:quotations(quote_number), provider:business_partners!provider_id(name, contact_phone:phone)")
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
      .select("*, client:business_partners!client_id(name, email, rfc), quotation:quotations(quote_number), provider:business_partners!provider_id(name, contact_phone:phone)")
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
    .select("*, client:business_partners!client_id(name, email, rfc), quotation:quotations(quote_number)")
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

// Recalcula totales respetando moneda y tax_rate por línea.
// El campo total/subtotal de la tabla usa la moneda de referencia del embarque.
// Cada línea aporta su propio IVA según su tax_rate (no se aplica tasa global).
async function recalcShipmentTotals(companyId: string, shipmentId: string): Promise<void> {
  const [{ data: shipment }, { data: services }] = await Promise.all([
    supabase.from("shipments").select("currency").eq("id", shipmentId).single(),
    supabase.from("shipment_services").select("price, cost, currency, tax_rate").eq("shipment_id", shipmentId),
  ]);

  const mainCurrency = shipment?.currency ?? "USD";
  const lines        = services ?? [];

  // Subtotal e IVA solo de líneas en la moneda principal del embarque
  const mainLines = lines.filter(l => (l.currency ?? "USD") === mainCurrency);
  const subtotal  = mainLines.reduce((s, l) => s + Number(l.price ?? 0), 0);
  const taxAmt    = mainLines.reduce((s, l) => {
    const rate = (l as any).tax_rate;
    const r =
      rate === null || rate === undefined ? 16 :
      rate === -1                          ?  0 :
      Number(rate);
    return s + Number(l.price ?? 0) * (r / 100);
  }, 0);
  const total = subtotal + taxAmt;

  // Costo total (sumado sin importar moneda — la moneda del proveedor puede diferir)
  const providerCost = lines.reduce((s, l) => s + Number(l.cost ?? 0), 0);
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
/**
 * Lista cotizaciones de servicios aceptadas listas para crear embarques.
 * Incluye general_info, service_subtype y datos financieros para que el
 * drawer "Desde cotización" pueda pre-poblar el form correctamente.
 */
export async function fetchAcceptedServiceQuotations(companyId: string) {
  const { data } = await supabase
    .from("quotations")
    .select(`
      id, quote_number, client_id, client_name, currency,
      subtotal, tax_rate, tax_amount, total,
      origin, destination, incoterm, notes,
      service_subtype, general_info,
      accepted_at, shipment_id,
      client:business_partners!client_id(name, rfc, email)
    `)
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
/**
 * Lista proveedores logísticos activos para el dropdown del wizard de embarques.
 * Lee desde business_partners filtrando por is_logistics_provider=true.
 */
export async function fetchLogisticsProviders(
  companyId: string
): Promise<{ id: string; name: string; contact_phone?: string }[]> {
  const { data } = await supabase
    .from("business_partners")
    .select("id, name, contact_phone:phone")
    .eq("company_id", companyId)
    .eq("is_logistics_provider", true)
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────────────────────
// COSTOS MULTI-FACTURA EN EMBARQUES
// Modelo: shipments (1) ── (N) accounts_payable
// document_type: 'cost_pending' (registro provisional sin factura)
//                'invoice'      (factura recibida del proveedor)
// ─────────────────────────────────────────────────────────────

export interface ShipmentCost {
  id:                    string;
  related_shipment_id:   string;
  document_type:         "invoice" | "cost_pending" | "credit_note" | "debit_note" | "expense";
  document_number:       string | null;
  document_date:         string;
  due_date:              string | null;
  supplier_type:         string;
  supplier_id:           string | null;
  logistics_provider_id: string | null;
  supplier_name:         string;
  supplier_rfc:          string | null;
  supplier_email:        string | null;
  currency:              string;
  has_tax:               boolean;
  subtotal:              number;
  tax_amount:            number;
  total:                 number;
  paid_amount:           number;
  balance:               number;
  status:                string;
  payment_status:        string;
  xml_url:               string | null;
  pdf_url:               string | null;
  notes:                 string | null;
  created_at:            string;
  updated_at:            string;
  supplier?:             { name: string; rfc?: string | null } | null;
  logistics_provider?:   { name: string } | null;
}

export interface ShipmentFinancials {
  shipment_id:               string;
  company_id:                string;
  reference:                 string;
  service_type:              string;
  currency:                  string;
  status:                    string;
  requires_supplier_invoice: boolean;
  revenue:                   number;
  total_costs:               number;
  confirmed_costs:           number;
  pending_costs:             number;
  invoices_count:            number;
  pending_count:             number;
  margin:                    number;
  margin_pct:                number;
}

/**
 * Lee la vista shipment_financials para un embarque.
 * Devuelve revenue, costos totales/confirmados/provisionales y márgenes calculados.
 */
export async function fetchShipmentFinancials(
  companyId: string,
  shipmentId: string,
): Promise<ShipmentFinancials | null> {
  const { data } = await supabase
    .from("shipment_financials")
    .select("*")
    .eq("company_id", companyId)
    .eq("shipment_id", shipmentId)
    .maybeSingle();
  return (data as ShipmentFinancials | null) ?? null;
}

/**
 * Lista todos los costos asociados a un embarque (cost_pending + invoices),
 * ordenados por fecha descendente. Excluye cancelados.
 */
export async function listShipmentCosts(
  companyId: string,
  shipmentId: string,
): Promise<ShipmentCost[]> {
  const { data, error } = await supabase
    .from("accounts_payable")
    .select(`
      *,
      supplier:business_partners!supplier_id(name, rfc),
      logistics_provider:business_partners!logistics_provider_id(name)
    `)
    .eq("company_id", companyId)
    .eq("related_shipment_id", shipmentId)
    .neq("status", "cancelled")
    .order("document_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShipmentCost[];
}

/**
 * Crea un nuevo costo asociado a un embarque.
 *  - document_type='cost_pending' → registro provisional sin factura
 *  - document_type='invoice'      → factura recibida (con o sin XML/PDF)
 *
 * Soporta múltiples llamadas para el mismo shipment_id (modelo multi-factura).
 */
export async function createShipmentCost(
  companyId: string,
  userId:    string,
  payload: {
    shipment_id:            string;
    document_type:          "cost_pending" | "invoice";
    supplier_type:          "logistics" | "procurement" | "operating";
    supplier_id?:           string | null;
    logistics_provider_id?: string | null;
    supplier_name:          string;
    supplier_rfc?:          string | null;
    supplier_email?:        string | null;
    document_number?:       string | null;
    document_date:          string;            // ISO YYYY-MM-DD
    due_date?:              string | null;
    currency:               string;
    has_tax:                boolean;
    subtotal:               number;
    tax_amount:             number;
    total:                  number;
    notes?:                 string | null;
    xml_url?:               string | null;
    pdf_url?:               string | null;
    expense_category?:      string | null;
  },
): Promise<ShipmentCost> {
  const { shipment_id, ...rest } = payload;
  const { data, error } = await supabase
    .from("accounts_payable")
    .insert({
      company_id:          companyId,
      created_by:          userId,
      related_shipment_id: shipment_id,
      ...rest,
      paid_amount:    0,
      balance:        rest.total,
      status:         "pending",
      payment_status: "not_scheduled",
    })
    .select(`
      *,
      supplier:business_partners!supplier_id(name, rfc),
      logistics_provider:business_partners!logistics_provider_id(name)
    `)
    .single();
  if (error) throw new Error(error.message);
  return data as ShipmentCost;
}

/**
 * Actualiza un costo existente. Si cambia `total`, recalcula `balance` y `status`
 * respetando lo ya pagado.
 */
export async function updateShipmentCost(
  companyId: string,
  costId:    string,
  patch: Partial<{
    document_type:         "cost_pending" | "invoice";
    document_number:       string | null;
    document_date:         string;
    due_date:              string | null;
    supplier_id:           string | null;
    logistics_provider_id: string | null;
    supplier_name:         string;
    supplier_rfc:          string | null;
    supplier_email:        string | null;
    currency:              string;
    has_tax:               boolean;
    subtotal:              number;
    tax_amount:            number;
    total:                 number;
    notes:                 string | null;
    xml_url:               string | null;
    pdf_url:               string | null;
    expense_category:      string | null;
  }>,
): Promise<void> {
  const updates: any = { ...patch, updated_at: new Date().toISOString() };

  if (patch.total !== undefined) {
    const { data: current } = await supabase
      .from("accounts_payable")
      .select("paid_amount")
      .eq("id", costId)
      .eq("company_id", companyId)
      .single();
    const paid = Number(current?.paid_amount ?? 0);
    updates.balance = Math.max(0, patch.total - paid);
    updates.status  = paid <= 0.01            ? "pending"
                    : paid >= patch.total - 0.01 ? "paid"
                    : "partial";
  }

  const { error } = await supabase
    .from("accounts_payable")
    .update(updates)
    .eq("id", costId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

/**
 * Elimina un costo. Solo permitido si NO tiene pagos registrados.
 * Para registros con pagos, usar updateAPStatus(id, 'cancelled') desde CXP.
 */
export async function deleteShipmentCost(
  companyId: string,
  costId:    string,
): Promise<void> {
  const { data: ap } = await supabase
    .from("accounts_payable")
    .select("paid_amount")
    .eq("id", costId)
    .eq("company_id", companyId)
    .single();
  if (!ap) throw new Error("Costo no encontrado");
  if (Number(ap.paid_amount ?? 0) > 0.01) {
    throw new Error(
      "No se puede eliminar un costo con pagos registrados. " +
      "Cancélalo desde Cuentas por Pagar.",
    );
  }
  const { error } = await supabase
    .from("accounts_payable")
    .delete()
    .eq("id", costId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}

/**
 * Activa o desactiva el flag `requires_supplier_invoice` de un embarque.
 *  - false: el embarque NO genera costos ni aparece en CXP.
 *  - true:  el embarque espera una o más facturas de proveedor.
 */
export async function toggleRequiresSupplierInvoice(
  companyId:  string,
  shipmentId: string,
  value:      boolean,
): Promise<void> {
  const { error } = await supabase
    .from("shipments")
    .update({
      requires_supplier_invoice: value,
      updated_at:                new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .eq("company_id", companyId);
  if (error) throw new Error(error.message);
}