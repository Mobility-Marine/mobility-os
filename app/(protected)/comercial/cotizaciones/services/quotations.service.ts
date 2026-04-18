// ============================================================
// QUOTATIONS SERVICE v1 — GOD LEVEL
// CRUD · Consecutivo configurable · Totales automáticos
// ============================================================
import { supabase } from "@/lib/supabaseClient";
import type {
  Quotation, QuotationItem, QuotationService, CompanySettings,
  CreateQuotationPayload, CreateItemPayload, CreateServicePayload,
  CreateBillingConceptPayload,
} from "../types/quotations.types";
import type { ShipmentServiceType } from "../../../logistica/embarques/types/shipments.types";

// ── CONSECUTIVO ───────────────────────────────────────────────
export async function generateQuoteNumber(
  companyId: string, clientName?: string, type?: string
): Promise<string> {
  const { data: settings } = await supabase
    .from("company_settings")
    .select("quote_number_format, quote_number_counter")
    .eq("company_id", companyId)
    .maybeSingle();
  const format  = settings?.quote_number_format ?? "COT-{AÑO}-{NUM}";
  const counter = settings?.quote_number_counter ?? 1;
  const now     = new Date();
  const año     = String(now.getFullYear());
  const mes     = String(now.getMonth() + 1).padStart(2, "0");
  const num     = String(counter).padStart(4, "0");
  const cliente = (clientName ?? "GEN").substring(0, 3).toUpperCase().replace(/\s/g, "");
  const tipo    = type === "services" ? "L" : "P";
  const quoteNumber = format
    .replace("{AÑO}",     año)
    .replace("{MES}",     mes)
    .replace("{NUM}",     num)
    .replace("{CLIENTE}", cliente)
    .replace("{TIPO}",    tipo);
  if (settings) {
    await supabase.from("company_settings")
      .update({ quote_number_counter: counter + 1, updated_at: new Date().toISOString() })
      .eq("company_id", companyId);
  } else {
    await supabase.from("company_settings")
      .insert({ company_id: companyId, quote_number_counter: 2 });
  }
  return quoteNumber;
}

// ── QUOTATIONS CRUD ───────────────────────────────────────────
export async function fetchQuotations(companyId: string): Promise<Quotation[]> {
  const { data } = await supabase
    .from("quotations")
    .select("*, client:clients(name, email, rfc)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Quotation[];
}

export async function fetchQuotation(
  companyId: string, id: string
): Promise<Quotation | null> {
  const [{ data: quot }, { data: items }, { data: services }, concepts] = await Promise.all([
    supabase.from("quotations").select(`
      *,
      client:clients(
        name, email, rfc,
        contacts:client_contacts(name, is_primary)
      )
    `).eq("company_id", companyId).eq("id", id).single(),
    supabase.from("quotation_items").select("*")
      .eq("company_id", companyId).eq("quotation_id", id).order("sort_order"),
    supabase.from("quotation_services").select("*")
      .eq("company_id", companyId).eq("quotation_id", id).order("sort_order"),
    fetchBillingConcepts(id),
  ]);
  if (!quot) return null;
  const contacts       = (quot as any)?.client?.contacts ?? [];
  const primaryContact = contacts.find((c: any) => c.is_primary) ?? contacts[0] ?? null;
  return {
    ...quot,
    client_contact_name: primaryContact?.name ?? null,
    items:              items    ?? [],
    services:           services ?? [],
    billing_concepts:   concepts ?? [],
  } as Quotation;
}

export async function createQuotation(
  companyId: string, userId: string,
  payload: CreateQuotationPayload,
  clientName?: string
): Promise<Quotation> {
  const { data: settings } = await supabase
    .from("company_settings")
    .select("template_products, template_services, quote_validity_days, quote_terms")
    .eq("company_id", companyId)
    .maybeSingle();
  const template   = payload.template ??
    (payload.type === "services" ? settings?.template_services : settings?.template_products) ??
    "elegante";
  const validity   = settings?.quote_validity_days ?? 15;
  const validUntil = payload.valid_until ?? new Date(Date.now() + validity * 86400000).toISOString().slice(0, 10);
  const terms      = payload.terms ??
    (payload.type === "services"
      ? (settings as any)?.quote_terms_services
      : (settings as any)?.quote_terms_products) ?? null;
  const quoteNumber = await generateQuoteNumber(companyId, clientName ?? payload.client_name, payload.type);
  const { data, error } = await supabase
    .from("quotations")
    .insert({
      company_id:      companyId,
      quote_number:    quoteNumber,
      type:            payload.type,
      status:          "draft",
      client_id:       payload.client_id       ?? null,
      crm_account_id:  payload.crm_account_id  ?? null,
      opportunity_id:  payload.opportunity_id  ?? null,
      template,
      currency:        payload.currency        ?? "MXN",
      client_name:     payload.client_name     ?? null,
      client_email:    payload.client_email    ?? null,
      client_rfc:      payload.client_rfc      ?? null,
      notes:           payload.notes           ?? null,
      terms,
      valid_until:     validUntil,
      incoterm:        payload.incoterm        ?? null,
      origin:          payload.origin          ?? null,
      destination:     payload.destination     ?? null,
      discount_amount: payload.discount_amount ?? 0,
      tax_rate:        payload.tax_rate        ?? 16,
      subtotal:        0, tax_amount: 0, total: 0,
      created_by:      userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Quotation;
}

export async function updateQuotation(
  companyId: string, id: string, updates: Partial<Quotation>
): Promise<void> {
  const { client, items, services, ...dbUpdates } = updates as any;
  await supabase.from("quotations")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);
}

export async function updateQuotationStatus(
  companyId: string, id: string, status: string
): Promise<void> {
  const now = new Date().toISOString();
  const statusDates: Record<string, any> = {
    sent:     { sent_at: now },
    accepted: { accepted_at: now },
    rejected: { rejected_at: now },
  };
  await supabase.from("quotations")
    .update({ status, ...statusDates[status], updated_at: now })
    .eq("id", id).eq("company_id", companyId);
}

// ── ITEMS (Productos) ─────────────────────────────────────────
export async function addItem(
  companyId: string, payload: CreateItemPayload
): Promise<QuotationItem> {
  const subtotal = payload.quantity * payload.unit_price * (1 - (payload.discount_pct ?? 0) / 100);
  // DESPUÉS:
  const { data: existing } = await supabase
    .from("quotation_items")
    .select("sort_order")
    .eq("quotation_id", payload.quotation_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("quotation_items")
    .insert({
      company_id:   companyId,
      quotation_id: payload.quotation_id,
      product_id:   payload.product_id   ?? null,
      sort_order,
      sku:          payload.sku          ?? null,
      description:  payload.description,
      details:      payload.details      ?? null,
      quantity:     payload.quantity,
      unit:         payload.unit         ?? "pza",
      unit_price:   payload.unit_price,
      discount_pct: payload.discount_pct ?? 0,
      subtotal,
    })
    .select("*").single();
  if (error) throw error;
  await recalcTotals(companyId, payload.quotation_id);
  return data as QuotationItem;
}

export async function updateItem(
  companyId: string, id: string, updates: Partial<QuotationItem>
): Promise<void> {
  const { quotation_id } = updates;
  if (updates.quantity !== undefined || updates.unit_price !== undefined || updates.discount_pct !== undefined) {
    const { data: current } = await supabase.from("quotation_items").select("*").eq("id", id).single();
    const qty   = updates.quantity     ?? current?.quantity     ?? 1;
    const price = updates.unit_price   ?? current?.unit_price   ?? 0;
    const disc  = updates.discount_pct ?? current?.discount_pct ?? 0;
    updates.subtotal = qty * price * (1 - disc / 100);
  }
  await supabase.from("quotation_items").update(updates).eq("id", id).eq("company_id", companyId);
  if (quotation_id) await recalcTotals(companyId, quotation_id);
}

export async function deleteItem(companyId: string, id: string, quotationId: string): Promise<void> {
  await supabase.from("quotation_items").delete().eq("id", id).eq("company_id", companyId);
  await recalcTotals(companyId, quotationId);
}

// ── SERVICES (Logística) ──────────────────────────────────────
export async function addService(
  companyId: string, payload: CreateServicePayload
): Promise<QuotationService> {
  const sort_order = payload.sort_order !== undefined
    ? payload.sort_order
    : ((await supabase
        .from("quotation_services")
        .select("sort_order")
        .eq("quotation_id", payload.quotation_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .then(({ data }) => data?.[0]?.sort_order ?? -1)) + 1);
  const { data, error } = await supabase
    .from("quotation_services")
    .insert({
      company_id:   companyId,
      quotation_id: payload.quotation_id,
      sort_order,
      service_type: payload.service_type,
      description:  payload.description,
      origin:       payload.origin       ?? null,
      destination:  payload.destination  ?? null,
      incoterm:     payload.incoterm     ?? null,
      transit_time: payload.transit_time ?? null,
      currency:     payload.currency     ?? "USD",
      price:        payload.price,
      notes:        payload.notes        ?? null,
      product_id:          payload.product_id          ?? null,
      billing_concept_id:  payload.billing_concept_id  ?? null,
    })
    .select("*").single();
  if (error) throw error;
  await recalcTotals(companyId, payload.quotation_id);
  return data as QuotationService;
}

export async function updateService(
  companyId: string, id: string, updates: Partial<QuotationService>
): Promise<void> {
  const { quotation_id } = updates;
  await supabase.from("quotation_services").update(updates).eq("id", id).eq("company_id", companyId);
  if (quotation_id) await recalcTotals(companyId, quotation_id);
}

export async function deleteService(companyId: string, id: string, quotationId: string): Promise<void> {
  await supabase.from("quotation_services").delete().eq("id", id).eq("company_id", companyId);
  await recalcTotals(companyId, quotationId);
}

// ── TOTALES ───────────────────────────────────────────────────
async function recalcTotals(companyId: string, quotationId: string): Promise<void> {
  const [{ data: quot }, { data: items }, { data: services }] = await Promise.all([
    supabase.from("quotations").select("discount_amount, tax_rate").eq("id", quotationId).single(),
    supabase.from("quotation_items").select("subtotal").eq("quotation_id", quotationId),
    supabase.from("quotation_services").select("price, currency").eq("quotation_id", quotationId),
  ]);
  const itemsTotal    = (items    ?? []).reduce((s: number, i:  any) => s + (i.subtotal ?? 0), 0);
  const servicesTotal = (services ?? []).reduce((s: number, sv: any) => s + (sv.price   ?? 0), 0);
  const subtotal      = itemsTotal + servicesTotal;
  const discount      = quot?.discount_amount ?? 0;
  const taxRate       = quot?.tax_rate        ?? 16;
  const taxBase       = Math.max(0, subtotal - discount);
  const taxAmount     = taxBase * (taxRate / 100);
  const total         = taxBase + taxAmount;
  await supabase.from("quotations")
    .update({ subtotal, tax_amount: taxAmount, total, updated_at: new Date().toISOString() })
    .eq("id", quotationId).eq("company_id", companyId);
}

// ── INTELIGENCIA ──────────────────────────────────────────────
export async function fetchRouteHistory(
  companyId: string, origin: string, destination: string
): Promise<{ avg: number; last: number; lastDate: string; currency: string; count: number } | null> {
  const { data } = await supabase
    .from("quotation_services")
    .select("price, currency, created_at, quotation_id")
    .eq("company_id", companyId)
    .ilike("origin", `%${origin}%`)
    .ilike("destination", `%${destination}%`)
    .order("created_at", { ascending: false })
    .limit(10);
  if (!data?.length) return null;
  const prices = data.map((d) => d.price);
  const avg    = prices.reduce((s, p) => s + p, 0) / prices.length;
  return {
    avg:      Math.round(avg),
    last:     data[0].price,
    lastDate: data[0].created_at,
    currency: data[0].currency,
    count:    data.length,
  };
}

export async function fetchClientFinancialAlert(
  companyId: string, clientId: string
): Promise<{ hasOverdue: boolean; overdueAmount: number; maxDays: number } | null> {
  const { data } = await supabase
    .from("accounts_receivable")
    .select("amount, days_overdue")
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .gt("days_overdue", 0);
  if (!data?.length) return { hasOverdue: false, overdueAmount: 0, maxDays: 0 };
  const overdueAmount = data.reduce((s, r) => s + (r.amount ?? 0), 0);
  const maxDays       = Math.max(...data.map((r) => r.days_overdue ?? 0));
  return { hasOverdue: true, overdueAmount, maxDays };
}

export async function fetchProductBySearch(
  companyId: string, query: string
): Promise<any[]> {
  const { data } = await supabase
    .from("products")
    .select("id, sku, name, unit, unit_price, description")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(8);
  return data ?? [];
}

// ── COMPANY SETTINGS ─────────────────────────────────────────
export async function fetchCompanySettings(companyId: string): Promise<CompanySettings | null> {
  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();
  return (data as CompanySettings) ?? null;
}

export async function upsertCompanySettings(
  companyId: string, updates: Partial<CompanySettings>
): Promise<void> {
  const { id, ...rest } = updates as any;
  const { error } = await supabase
    .from("company_settings")
    .upsert(
      { company_id: companyId, ...rest, updated_at: new Date().toISOString() },
      { onConflict: "company_id" }
    );
  if (error) throw new Error(error.message);
}

// ── HELPER: detectar tipo de servicio desde líneas de cotización ──
const LOGISTICS_SERVICE_TYPES = [
  "terrestre", "aereo", "maritimo", "almacenaje", "aduanal",
  "terrestre_mx", "terrestre_usa", "multimodal",
];

function detectShipmentServiceType(
  quotServices: any[]
): ShipmentServiceType {
  if (!quotServices.length) return "consultoria";

  // Buscar si hay algún servicio logístico
  const hasLogistics = quotServices.some((s) =>
    LOGISTICS_SERVICE_TYPES.includes(s.service_type?.toLowerCase() ?? "")
  );
  if (!hasLogistics) return "consultoria";

  // Determinar el tipo logístico predominante
  const typeMap: Record<string, ShipmentServiceType> = {
    terrestre:    "terrestre_mx",
    terrestre_mx: "terrestre_mx",
    terrestre_usa:"terrestre_usa",
    aereo:        "aereo",
    maritimo:     "maritimo",
    almacenaje:   "almacenaje",
    aduanal:      "aduanal",
    multimodal:   "multimodal",
  };

  for (const svc of quotServices) {
    const mapped = typeMap[svc.service_type?.toLowerCase() ?? ""];
    if (mapped) return mapped;
  }

  return "terrestre_mx";
}

// ── ACEPTAR COTIZACIÓN ────────────────────────────────────────
export async function acceptQuotation(
  companyId: string, quotation: Quotation, userId: string
): Promise<{ type: "order" | "shipment"; id: string }> {
  await updateQuotationStatus(companyId, quotation.id, "accepted");

  if (quotation.type === "products") {
    // ── Cotización de productos → crear Pedido ────────────────
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        company_id:   companyId,
        client_id:    quotation.client_id ?? null,
        quotation_id: quotation.id,
        status:       "pending",
        total:        quotation.total,
        currency:     quotation.currency,
        notes:        quotation.notes    ?? null,
        created_by:   userId,
      })
      .select("id")
      .single();

    if (!error && order) {
      await supabase.from("quotations").update({ order_id: order.id }).eq("id", quotation.id);
      await supabase.from("entity_timeline_events").insert({
        company_id:     companyId,
        entity_type:    "quotation",
        entity_id:      quotation.id,
        module_key:     "cotizaciones",
        event_type:     "accepted_to_order",
        event_category: "commercial",
        title:          "Cotización aceptada → Pedido creado",
        description:    quotation.quote_number,
      }).then(() => {});
      return { type: "order", id: order.id };
    }

  } else {
    // ── Cotización de servicios → crear Embarque/Servicio ─────

    // 1. Leer las líneas de servicios para detectar el tipo
    const quotServices = await fetchQuotationServices(quotation.id);
    const serviceType  = detectShipmentServiceType(quotServices);
    const isLogistics  = LOGISTICS_SERVICE_TYPES.includes(serviceType);

    // 2. Generar referencia
    const { generateShipmentReference } = await import(
      "../../../logistica/embarques/services/shipments.service"
    );
    const clientName = (quotation as any).client?.name ?? quotation.client_name ?? "GEN";
    const reference  = await generateShipmentReference(companyId, clientName, serviceType);

    // 3. Crear el registro
    const { data: shipment, error } = await supabase
      .from("shipments")
      .insert({
        company_id:    companyId,
        client_id:     quotation.client_id ?? null,
        quotation_id:  quotation.id,
        status:        "draft",
        reference,
        service_type:  serviceType,
        // Campos logísticos — solo si aplica
        origin:        isLogistics ? (quotation.origin      ?? null) : null,
        destination:   isLogistics ? (quotation.destination ?? null) : null,
        incoterm:      isLogistics ? (quotation.incoterm    ?? null) : null,
        // Financiero
        total:         quotation.total,
        subtotal:      quotation.subtotal   ?? quotation.total,
        tax_rate:      quotation.tax_rate   ?? 16,
        tax_amount:    quotation.tax_amount ?? 0,
        provider_cost: 0,
        provider_currency: quotation.currency ?? "USD",
        profit:        quotation.total,
        currency:      quotation.currency,
        notes:         quotation.notes      ?? null,
        created_by:    userId,
      })
      .select("id")
      .single();

    if (!error && shipment) {
      await supabase.from("quotations").update({ shipment_id: shipment.id }).eq("id", quotation.id);

      const eventTitle = isLogistics
        ? "Cotización aceptada → Embarque creado"
        : "Cotización aceptada → Servicio de consultoría creado";

      await supabase.from("entity_timeline_events").insert({
        company_id:     companyId,
        entity_type:    "quotation",
        entity_id:      quotation.id,
        module_key:     "cotizaciones",
        event_type:     "accepted_to_shipment",
        event_category: "logistics",
        title:          eventTitle,
        description:    quotation.quote_number,
      }).then(() => {});

      return { type: "shipment", id: shipment.id };
    }
  }

  return { type: quotation.type === "products" ? "order" : "shipment", id: "" };
}

export async function fetchQuotationServices(quotationId: string) {
  const { data } = await supabase
    .from("quotation_services")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("sort_order");
  return data ?? [];
}

// ── BILLING CONCEPTS ──────────────────────────────────────────
export async function fetchBillingConcepts(
  quotationId: string
): Promise<any[]> {
  const { data: concepts } = await supabase
    .from("quotation_billing_concepts")
    .select(`
      *,
      product:products(name, sat_product_code, sat_unit_code, unit),
      lines:quotation_services(*)
    `)
    .eq("quotation_id", quotationId)
    .order("sort_order");
  // Calcular total de cada concepto sumando sus líneas
  return (concepts ?? []).map((c: any) => ({
    ...c,
    lines: (c.lines ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    total: (c.lines ?? []).reduce((s: number, l: any) => s + (l.price ?? 0), 0),
  }));
}

export async function createBillingConcept(
  companyId: string,
  payload:   CreateBillingConceptPayload
): Promise<any> {
  const { data: existing } = await supabase
    .from("quotation_billing_concepts")
    .select("sort_order")
    .eq("quotation_id", payload.quotation_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("quotation_billing_concepts")
    .insert({
      company_id:   companyId,
      quotation_id: payload.quotation_id,
      sort_order:   payload.sort_order ?? sort_order,
      product_id:   payload.product_id ?? null,
      description:  payload.description,
      currency:     payload.currency ?? "USD",
      total:        0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBillingConcept(
  companyId: string,
  id:        string,
  quotationId: string
): Promise<void> {
  // Eliminar líneas asociadas primero
  await supabase.from("quotation_services")
    .delete()
    .eq("billing_concept_id", id)
    .eq("company_id", companyId);
  await supabase.from("quotation_billing_concepts")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  await recalcTotals(companyId, quotationId);
}

export async function recalcBillingConceptTotal(
  companyId:  string,
  conceptId:  string,
  quotationId:string
): Promise<void> {
  const { data: lines } = await supabase
    .from("quotation_services")
    .select("price")
    .eq("billing_concept_id", conceptId);
  const total = (lines ?? []).reduce((s: number, l: any) => s + (l.price ?? 0), 0);
  await supabase.from("quotation_billing_concepts")
    .update({ total })
    .eq("id", conceptId)
    .eq("company_id", companyId);
  await recalcTotals(companyId, quotationId);
}

export async function deleteQuotation(
  companyId: string,
  id: string,
): Promise<void> {
  await supabase.from("quotation_items").delete().eq("quotation_id", id).eq("company_id", companyId);
  await supabase.from("quotation_services").delete().eq("quotation_id", id).eq("company_id", companyId);
  const { error } = await supabase.from("quotations").delete().eq("id", id).eq("company_id", companyId);
  if (error) throw error;
}
