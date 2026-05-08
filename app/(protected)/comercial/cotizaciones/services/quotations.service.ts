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
import {
  mapServiceSubtypeToShipmentType,
  extractRouteFromGeneralInfo,
  extractCargoFromGeneralInfo,
  LOGISTICS_SHIPMENT_TYPES,
} from "@/lib/logistics/quotationToShipment";

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
  // 1. Traer la lista base de cotizaciones
  const { data: quotations } = await supabase
    .from("quotations")
    .select("*, client:business_partners!client_id(name, email, rfc)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (!quotations?.length) return [];

  // 2. Traer TODOS los billing_concepts de la empresa en un solo query
  const quotationIds = quotations.map((q) => q.id);

  const { data: allConcepts } = await supabase
    .from("quotation_billing_concepts")
    .select("*, lines:quotation_services(*)")
    .in("quotation_id", quotationIds)
    .order("sort_order");

  // 3. Agrupar concepts por quotation_id
  const conceptsByQuotation: Record<string, any[]> = {};
  for (const concept of allConcepts ?? []) {
    const qid = concept.quotation_id;
    if (!conceptsByQuotation[qid]) conceptsByQuotation[qid] = [];
    conceptsByQuotation[qid].push({
      ...concept,
      lines: (concept.lines ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    });
  }

  // 4. Unir concepts a cada cotización
  return quotations.map((q) => ({
    ...q,
    billing_concepts: conceptsByQuotation[q.id] ?? [],
  })) as Quotation[];
}

export async function fetchQuotation(
  companyId: string, id: string
): Promise<Quotation | null> {
  const [{ data: quot }, { data: items }, { data: services }, concepts] = await Promise.all([
    supabase.from("quotations").select(`
      *,
      client:business_partners!client_id(
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
      service_subtype:  payload.service_subtype  ?? null,
      language:         payload.language          ?? "es",
      general_info:     payload.general_info      ?? null,
      contact_name:     payload.contact_name      ?? null,
      contact_email:    payload.contact_email     ?? null,
      contact_title:    payload.contact_title     ?? null,
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
      tax_rate:            payload.tax_rate             ?? 16,
      unit_label:          payload.unit_label           ?? null,
      quantity:            payload.quantity            ?? 1,
      unit_price:          payload.unit_price          ?? null,
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
    supabase.from("quotation_items").select("subtotal, tax_rate").eq("quotation_id", quotationId),
    supabase.from("quotation_services").select("price, currency, tax_rate").eq("quotation_id", quotationId),
  ]);

  const discount      = quot?.discount_amount ?? 0;
  const globalTaxRate = quot?.tax_rate        ?? 16;

  // Items: usan tasa global de la cotización
  const itemsSubtotal = (items ?? []).reduce((s: number, i: any) => s + (i.subtotal ?? 0), 0);
  const itemsTax      = itemsSubtotal * (globalTaxRate / 100);

  // Servicios: cada línea tiene su propia tasa — NO se aplica la tasa global
  const servicesSubtotal = (services ?? []).reduce((s: number, sv: any) => s + (sv.price ?? 0), 0);
  const servicesTax      = (services ?? []).reduce((s: number, sv: any) => {
    const rate = sv.tax_rate;
    if (rate === null || rate === undefined || rate === -1 || rate === 0) return s;
    return s + (sv.price ?? 0) * (rate / 100);
  }, 0);

  const subtotal  = itemsSubtotal + servicesSubtotal;
  const taxBase   = Math.max(0, subtotal - discount);
  const ratio     = subtotal > 0 ? taxBase / subtotal : 1;
  const taxAmount = (itemsTax + servicesTax) * ratio;
  const total     = taxBase + taxAmount;

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

// ── ACEPTAR COTIZACIÓN ────────────────────────────────────────
// El mapeo de service_subtype → service_type vive en
// lib/logistics/quotationToShipment.ts (compartido con ShipmentCreateDrawer)
export async function acceptQuotation(
  companyId: string, quotation: Quotation, userId: string,
  deliveryInfo?: {
    delivery_date?:    string;
    delivery_type?:    string;
    delivery_address?: string;
    delivery_city?:    string;
    delivery_state?:   string;
    delivery_notes?:   string;
  }
): Promise<{ type: "order" | "shipment"; id: string }> {
  await updateQuotationStatus(companyId, quotation.id, "accepted");

    if (quotation.type === "products") {
    // ── Cotización de productos → crear Pedido ────────────────

    // 1. Generar número de pedido
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);
    const num         = String((count ?? 0) + 1).padStart(4, "0");
    const year        = new Date().getFullYear();
    const orderNumber = `PED-${year}-${num}`;

    // 2. Crear el pedido con totales completos
          const { data: order, error } = await supabase
        .from("orders")
        .insert({
          company_id:      companyId,
          order_number:    orderNumber,
          client_id:       quotation.client_id ?? null,
          quotation_id:    quotation.id,
          status:          "pending",
          priority:        "normal",
          currency:        quotation.currency  ?? "MXN",
          subtotal:        quotation.subtotal  ?? quotation.total ?? 0,
          discount_amount: quotation.discount_amount ?? 0,
          tax_rate:        quotation.tax_rate  ?? 16,
          tax_amount:      quotation.tax_amount ?? 0,
          total:           quotation.total     ?? 0,
          notes:           quotation.notes     ?? null,
          delivery_date:   deliveryInfo?.delivery_date    ?? null,
          delivery_type:   deliveryInfo?.delivery_type    ?? "client_address",
          delivery_address:deliveryInfo?.delivery_address ?? null,
          delivery_city:   deliveryInfo?.delivery_city    ?? null,
          delivery_state:  deliveryInfo?.delivery_state   ?? null,
          delivery_notes:  deliveryInfo?.delivery_notes   ?? null,
          created_by:      userId,
        })
      .select("id")
      .single();

    if (!error && order) {
      // 3. Copiar items de la cotización al pedido
      const { data: qItems } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotation.id)
        .order("sort_order");

      if (qItems?.length) {
        await supabase.from("order_items").insert(
          qItems.map((qi: any, idx: number) => ({
            company_id:         companyId,
            order_id:           order.id,
            product_id:         qi.product_id      ?? null,
            quotation_item_id:  qi.id,
            sort_order:         idx,
            sku:                qi.sku             ?? null,
            description:        qi.description,
            details:            qi.details         ?? null,
            quantity:           qi.quantity,
            quantity_delivered: 0,
            unit:               qi.unit,
            unit_price:         qi.unit_price,
            discount_pct:       qi.discount_pct    ?? 0,
            subtotal:           qi.subtotal,
          }))
        );
      }

      // 4. Vincular pedido a la cotización
      await supabase.from("quotations")
        .update({ order_id: order.id })
        .eq("id", quotation.id);

      // 5. Timeline
      await supabase.from("entity_timeline_events").insert({
        company_id:     companyId,
        entity_type:    "quotation",
        entity_id:      quotation.id,
        module_key:     "cotizaciones",
        event_type:     "accepted_to_order",
        event_category: "commercial",
        title:          `Cotización aceptada → Pedido ${orderNumber} creado`,
        description:    quotation.quote_number,
      }).then(() => {});

      return { type: "order", id: order.id };
    }


  } else {
    // ── Cotización de servicios → crear Embarque/Servicio ─────

    // 1. Extraer datos derivados de la cotización (ruta, mercancía, tipo)
    const generalInfo = (quotation as any).general_info ?? null;
    const route       = extractRouteFromGeneralInfo(generalInfo);
    const cargo       = extractCargoFromGeneralInfo(generalInfo);
    const subtype     = (quotation as any).service_subtype ?? null;
    const serviceType = mapServiceSubtypeToShipmentType(
      subtype, route.origin, route.destination,
    );
    const isLogistics = LOGISTICS_SHIPMENT_TYPES.includes(serviceType);

    // Servicios de consultoría/seguro NO requieren factura de proveedor
    const requiresSupplierInvoice =
      serviceType !== "consultoria" && serviceType !== "seguro";

    // 2. Generar referencia
    const { generateShipmentReference } = await import(
      "../../../logistica/embarques/services/shipments.service"
    );
    const clientName = (quotation as any).client?.name ?? quotation.client_name ?? "GEN";
    const reference  = await generateShipmentReference(companyId, clientName, serviceType);

    // 3. Crear el embarque con TODOS los datos derivados de la cotización
    const { data: shipment, error } = await supabase
      .from("shipments")
      .insert({
        company_id:    companyId,
        client_id:     quotation.client_id ?? null,
        quotation_id:  quotation.id,
        status:        "draft",
        reference,
        service_type:  serviceType,
        requires_supplier_invoice: requiresSupplierInvoice,
        // Ruta — extraída de general_info.rutas[0] (no de quotation.origin/destination que están NULL)
        origin:              isLogistics ? route.origin              : null,
        destination:         isLogistics ? route.destination         : null,
        origin_country:      isLogistics ? route.origin_country      : null,
        destination_country: isLogistics ? route.destination_country : null,
        incoterm:            isLogistics ? (route.incoterm ?? quotation.incoterm ?? null) : null,
        // Datos físicos de la mercancía (visibles para logística sin pedir info al área comercial)
        cargo_merchandise:    cargo.cargo_merchandise,
        cargo_pieces:         cargo.cargo_pieces,
        cargo_weight_kg:      cargo.cargo_weight_kg,
        cargo_length_cm:      cargo.cargo_length_cm,
        cargo_width_cm:       cargo.cargo_width_cm,
        cargo_height_cm:      cargo.cargo_height_cm,
        cargo_volume_m3:      cargo.cargo_volume_m3,
        cargo_value:          cargo.cargo_value,
        cargo_value_currency: cargo.cargo_value_currency,
        // Financiero — copia 1:1 (respeta tax_rate=0 si la cotización es sin IVA)
        currency:      quotation.currency,
        subtotal:      quotation.subtotal   ?? quotation.total,
        tax_rate:      quotation.tax_rate   ?? 16,
        tax_amount:    quotation.tax_amount ?? 0,
        total:         quotation.total,
        provider_cost: 0,
        provider_currency: quotation.currency ?? "USD",
        profit:        quotation.total,
        notes:         quotation.notes      ?? null,
        created_by:    userId,
      })
      .select("id")
      .single();

    if (!error && shipment) {
      // 4. Copiar quotation_services → shipment_services (CON tax_rate)
      //    Sin esto, la pestaña Servicios y los totales del workspace
      //    quedaban vacíos en los embarques nuevos.
      const quotServices = await fetchQuotationServices(quotation.id);
      if (quotServices.length > 0) {
        await supabase.from("shipment_services").insert(
          quotServices.map((qs: any, idx: number) => ({
            company_id:   companyId,
            shipment_id:  shipment.id,
            sort_order:   qs.sort_order ?? idx,
            service_type: qs.service_type,
            description:  qs.description,
            origin:       qs.origin       ?? null,
            destination:  qs.destination  ?? null,
            incoterm:     qs.incoterm     ?? null,
            transit_time: qs.transit_time ?? null,
            currency:     qs.currency     ?? quotation.currency ?? "USD",
            price:        qs.price        ?? 0,
            cost:         0,
            tax_rate:     qs.tax_rate     ?? 16,
            notes:        qs.notes        ?? null,
            product_id:   qs.product_id   ?? null,
          })),
        );
      }

      // 5. Vincular cotización ↔ embarque
      await supabase.from("quotations")
        .update({ shipment_id: shipment.id })
        .eq("id", quotation.id);

      // 6. Timeline
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

// ============================================================
// DUPLICAR COTIZACIÓN — NUEVO FOLIO + COPIA TOTAL
// ============================================================
// Patrón SAP/Oracle: clonado preservando el original.
// Crea una cotización NUEVA con el siguiente folio del consecutivo,
// copiando cliente, datos, items, billing_concepts y lines de la source.
// Ideal para: re-cotizar a un cliente recurrente, crear V2 de aceptada,
// usar template de una cotización compleja.
export async function duplicateQuotation(
  companyId: string,
  sourceId: string,
  userId: string,
): Promise<Quotation> {
  // 1. Fetch source completa con todas sus relaciones
  const source = await fetchQuotation(companyId, sourceId);
  if (!source) throw new Error("Cotización source no encontrada");

  // 2. Calcular nueva valid_until (recálculo desde hoy con vigencia configurada)
  const { data: settings } = await supabase
    .from("company_settings")
    .select("quote_validity_days")
    .eq("company_id", companyId)
    .maybeSingle();
  const validity = settings?.quote_validity_days ?? 15;
  const newValidUntil = new Date(Date.now() + validity * 86400000)
    .toISOString()
    .slice(0, 10);

  // 3. Crear cotización nueva (genera folio nuevo automáticamente vía generateQuoteNumber)
  const newQuot = await createQuotation(
    companyId,
    userId,
    {
      type: source.type,
      client_id: source.client_id ?? undefined,
      crm_account_id: source.crm_account_id ?? undefined,
      opportunity_id: source.opportunity_id ?? undefined,
      template: source.template,
      currency: source.currency,
      client_name: source.client_name ?? undefined,
      client_email: source.client_email ?? undefined,
      client_rfc: source.client_rfc ?? undefined,
      notes: source.notes ?? undefined,
      terms: source.terms ?? undefined,
      valid_until: newValidUntil,
      incoterm: source.incoterm ?? undefined,
      origin: source.origin ?? undefined,
      destination: source.destination ?? undefined,
      discount_amount: source.discount_amount,
      tax_rate: source.tax_rate,
      service_subtype: source.service_subtype ?? undefined,
      language: source.language,
      general_info: source.general_info as any,
      contact_name: source.contact_name ?? undefined,
      contact_email: source.contact_email ?? undefined,
      contact_title: source.contact_title ?? undefined,
    },
    source.client_name ?? undefined,
  );

  // 4. Copiar items (productos) — preservando sort_order
  if (source.type === "products" && source.items?.length) {
    for (let i = 0; i < source.items.length; i++) {
      const item = source.items[i];
      await addItem(companyId, {
        quotation_id: newQuot.id,
        product_id: item.product_id ?? undefined,
        sku: item.sku ?? undefined,
        description: item.description,
        details: item.details ?? undefined,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct,
      });
    }
  }

  // 5. Copiar billing_concepts + lines (servicios) — secuencial para preservar orden
  if (source.type === "services" && source.billing_concepts?.length) {
    for (let ci = 0; ci < source.billing_concepts.length; ci++) {
      const concept = source.billing_concepts[ci];
      const newConcept = await createBillingConcept(companyId, {
        quotation_id: newQuot.id,
        sort_order: ci,
        product_id: concept.product_id ?? undefined,
        description: concept.description,
        currency: concept.currency,
      });
      const lines = (concept as any).lines ?? [];
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        await addService(companyId, {
          quotation_id: newQuot.id,
          sort_order: li,
          billing_concept_id: newConcept.id,
          service_type: line.service_type,
          description: line.description,
          origin: line.origin ?? undefined,
          destination: line.destination ?? undefined,
          incoterm: line.incoterm ?? undefined,
          transit_time: line.transit_time ?? undefined,
          currency: line.currency,
          price: line.price,
          notes: line.notes ?? undefined,
          product_id: line.product_id ?? undefined,
          tax_rate: line.tax_rate ?? 16,
          unit_label: line.unit_label ?? undefined,
          quantity: line.quantity ?? undefined,
          unit_price: line.unit_price ?? undefined,
        });
      }
      await recalcBillingConceptTotal(companyId, newConcept.id, newQuot.id);
    }
  }

  return newQuot;
}

// ============================================================
// EDICIÓN COMPLETA (replace-all) — para borradores/enviadas/rechazadas
// ============================================================
// Patrón SAP: replace-all en lugar de diff. Más simple, robusto y
// alineado con el flujo de negocio: editas la cotización ANTES de
// que el cliente la acepte, así que no hay relaciones críticas que preservar.
//
// REGLA: Cotización aceptada NO es editable (audit trail SAP). Si necesitas
// modificar una aceptada, usa duplicateQuotation para crear una nueva versión.
export async function updateQuotationFull(
  companyId: string,
  userId: string,
  id: string,
  payload: CreateQuotationPayload,
  items?: Omit<CreateItemPayload, "quotation_id">[],
  billingConcepts?: {
    tempId?: string;
    product_id?: string;
    description: string;
    currency: string;
    lines: Omit<CreateServicePayload, "quotation_id">[];
  }[],
): Promise<void> {
  // 1. Verificar que NO esté aceptada (audit trail SAP)
  const { data: current } = await supabase
    .from("quotations")
    .select("status")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();
  if (current?.status === "accepted") {
    throw new Error(
      "No se puede editar una cotización aceptada. Para modificarla, usa Duplicar para crear una nueva versión.",
    );
  }

  // 2. UPDATE quotations — payload completo + audit fields
  await supabase
    .from("quotations")
    .update({
      type: payload.type,
      client_id: payload.client_id ?? null,
      crm_account_id: payload.crm_account_id ?? null,
      opportunity_id: payload.opportunity_id ?? null,
      template: payload.template ?? "elegante",
      currency: payload.currency ?? "MXN",
      client_name: payload.client_name ?? null,
      client_email: payload.client_email ?? null,
      client_rfc: payload.client_rfc ?? null,
      notes: payload.notes ?? null,
      terms: payload.terms ?? null,
      valid_until: payload.valid_until ?? null,
      incoterm: payload.incoterm ?? null,
      origin: payload.origin ?? null,
      destination: payload.destination ?? null,
      discount_amount: payload.discount_amount ?? 0,
      tax_rate: payload.tax_rate ?? 16,
      service_subtype: payload.service_subtype ?? null,
      language: payload.language ?? "es",
      general_info: payload.general_info ?? null,
      contact_name: payload.contact_name ?? null,
      contact_email: payload.contact_email ?? null,
      contact_title: payload.contact_title ?? null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId);

  // 3. DELETE all items
  await supabase
    .from("quotation_items")
    .delete()
    .eq("quotation_id", id)
    .eq("company_id", companyId);

  // 4. DELETE all billing_concepts (incluye lines vinculadas vía deleteBillingConcept)
  const { data: existingConcepts } = await supabase
    .from("quotation_billing_concepts")
    .select("id")
    .eq("quotation_id", id)
    .eq("company_id", companyId);
  if (existingConcepts?.length) {
    for (const c of existingConcepts) {
      await deleteBillingConcept(companyId, c.id, id);
    }
  }
  // Por seguridad, limpia services huérfanos (sin billing_concept_id)
  await supabase
    .from("quotation_services")
    .delete()
    .eq("quotation_id", id)
    .eq("company_id", companyId)
    .is("billing_concept_id", null);

  // 5. INSERT new items (si productos)
  if (payload.type === "products" && items?.length) {
    for (let i = 0; i < items.length; i++) {
      await addItem(companyId, { ...items[i], quotation_id: id });
    }
  }

  // 6. INSERT new billing_concepts + lines (si servicios) — secuencial
  if (payload.type === "services" && billingConcepts?.length) {
    for (let ci = 0; ci < billingConcepts.length; ci++) {
      const concept = billingConcepts[ci];
      const created = await createBillingConcept(companyId, {
        quotation_id: id,
        sort_order: ci,
        product_id: concept.product_id,
        description: concept.description,
        currency: concept.currency,
      });
      for (let li = 0; li < concept.lines.length; li++) {
        await addService(companyId, {
          ...concept.lines[li],
          quotation_id: id,
          sort_order: li,
          billing_concept_id: created.id,
        });
      }
      await recalcBillingConceptTotal(companyId, created.id, id);
    }
  }
}

// ============================================================
// AUDIT TRAIL — fetch user names (created_by + updated_by)
// ============================================================
export async function fetchQuotationAuditNames(
  quotation: Quotation,
): Promise<{ created_by_name: string | null; updated_by_name: string | null }> {
  const updatedBy = (quotation as any).updated_by as string | null | undefined;
  const ids = [quotation.created_by, updatedBy].filter(Boolean) as string[];
  if (ids.length === 0) return { created_by_name: null, updated_by_name: null };

  const uniqueIds = Array.from(new Set(ids));
  const { data } = await supabase
    .from("tenant_users")
    .select("user_id, full_name, email")
    .in("user_id", uniqueIds);

  // Tipado explícito Map<string, string>: sin esto TS infiere Map<unknown, unknown>
  // por el `any[]` del array origen y .get(...) retorna `unknown` en lugar de `string | undefined`.
  const nameMap = new Map<string, string>();
  for (const u of (data ?? []) as Array<{
    user_id: string;
    full_name: string | null;
    email: string | null;
  }>) {
    nameMap.set(u.user_id, u.full_name ?? u.email ?? "Usuario");
  }

  return {
    created_by_name: quotation.created_by ? nameMap.get(quotation.created_by) ?? null : null,
    updated_by_name: updatedBy ? nameMap.get(updatedBy) ?? null : null,
  };
}
