// ════════════════════════════════════════════════════════════════════════
// PARTNER SUMMARY SERVICE — Customer 360 (consolidado de operaciones)
// ════════════════════════════════════════════════════════════════════════
// Agrega información operativa real del partner desde múltiples tablas:
//
//   - quotations          (FK client_id)         → cotizaciones recientes
//   - orders              (FK client_id)         → pedidos recientes
//   - shipments           (FK client_id)         → embarques/servicios
//   - cfdi_documents      (FK related_client_id) → facturación emitida
//   - accounts_receivable (FK client_id)         → saldos a cobrar
//   - purchase_orders     (FK supplier_id)       → órdenes de compra
//   - accounts_payable    (FK supplier_id)       → saldos a pagar
//
// ARQUITECTURA DEFENSIVA:
//   - Cada query es independiente y se ejecuta en paralelo
//   - Si una query falla (tabla movida, FK renombrada, RLS bloquea, etc.)
//     se devuelve null para esa sección, NO rompe el resto del summary
//   - El TabSummary muestra placeholders graciosos en secciones fallidas
//
// La función principal computePartnerSummary devuelve un objeto con KPIs
// agregados + listas de operaciones recientes.
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

// ── Tipos públicos ───────────────────────────────────────────────────
export type RecentOperation = {
  id:        string;
  type:      "quotation" | "order" | "shipment" | "cfdi" | "purchase_order";
  reference: string;
  date:      string | null;
  amount:    number | null;
  currency:  string | null;
  status:    string | null;
};

export type PartnerSummary = {
  // KPIs financieros (cliente)
  total_invoiced_ytd:    number | null;   // suma de cfdi_documents YTD
  total_invoiced_alltime: number | null;   // todo el tiempo
  invoiced_currency:     string;
  receivable_balance:    number | null;   // saldo pendiente a cobrar
  receivable_currency:   string;
  receivable_overdue:    number;          // # de docs vencidos sin pagar
  avg_ticket:            number | null;   // promedio facturación
  // KPIs (proveedor)
  total_purchases_ytd:   number | null;   // OC YTD
  payable_balance:       number | null;   // saldo a pagar
  payable_currency:      string;
  payable_overdue:       number;

  // Conteos generales
  count_quotations:      number;
  count_orders:          number;
  count_shipments:       number;
  count_cfdis:           number;
  count_purchase_orders: number;

  // Operaciones recientes (top 5 cada una)
  recent_quotations:     RecentOperation[];
  recent_orders:         RecentOperation[];
  recent_shipments:      RecentOperation[];
  recent_cfdis:          RecentOperation[];
  recent_purchase_orders: RecentOperation[];

  // Errores por sección (para mostrar al usuario qué falló)
  errors: Record<string, string>;
};

// ── Helpers ──────────────────────────────────────────────────────────
function emptySummary(): PartnerSummary {
  return {
    total_invoiced_ytd:     null,
    total_invoiced_alltime: null,
    invoiced_currency:      "MXN",
    receivable_balance:     null,
    receivable_currency:    "MXN",
    receivable_overdue:     0,
    avg_ticket:             null,
    total_purchases_ytd:    null,
    payable_balance:        null,
    payable_currency:       "MXN",
    payable_overdue:        0,
    count_quotations:       0,
    count_orders:           0,
    count_shipments:        0,
    count_cfdis:            0,
    count_purchase_orders:  0,
    recent_quotations:      [],
    recent_orders:          [],
    recent_shipments:       [],
    recent_cfdis:           [],
    recent_purchase_orders: [],
    errors:                 {},
  };
}

function startOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

// Wrapper defensivo: si la promesa falla, retorna { error: string }
async function safe<T>(
  promise: Promise<T>,
  errorBag: Record<string, string>,
  key: string,
): Promise<T | null> {
  try {
    return await promise;
  } catch (e) {
    errorBag[key] = e instanceof Error ? e.message : String(e);
    return null;
  }
}

// ── Queries individuales ─────────────────────────────────────────────

async function fetchQuotations(companyId: string, partnerId: string) {
  const { data, error, count } = await supabase
    .from("quotations")
    .select("id, quote_number, total, currency, status, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .eq("client_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);
  const recent: RecentOperation[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id        as string,
    type:      "quotation" as const,
    reference: (r.quote_number as string) ?? "",
    date:      (r.created_at as string)   ?? null,
    amount:    typeof r.total === "number" ? (r.total as number) : Number(r.total) || null,
    currency:  (r.currency as string)     ?? "MXN",
    status:    (r.status   as string)     ?? null,
  }));
  return { recent, count: count ?? 0 };
}

async function fetchOrders(companyId: string, partnerId: string) {
  const { data, error, count } = await supabase
    .from("orders")
    .select("id, order_number, total, currency, status, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .eq("client_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);
  const recent: RecentOperation[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id           as string,
    type:      "order"        as const,
    reference: (r.order_number as string) ?? "",
    date:      (r.created_at  as string) ?? null,
    amount:    typeof r.total === "number" ? (r.total as number) : Number(r.total) || null,
    currency:  (r.currency    as string) ?? "MXN",
    status:    (r.status      as string) ?? null,
  }));
  return { recent, count: count ?? 0 };
}

async function fetchShipments(companyId: string, partnerId: string) {
  const { data, error, count } = await supabase
    .from("shipments")
    .select("id, reference, total, currency, status, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .eq("client_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);
  const recent: RecentOperation[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id          as string,
    type:      "shipment"    as const,
    reference: (r.reference  as string) ?? "",
    date:      (r.created_at as string) ?? null,
    amount:    typeof r.total === "number" ? (r.total as number) : Number(r.total) || null,
    currency:  (r.currency   as string) ?? "MXN",
    status:    (r.status     as string) ?? null,
  }));
  return { recent, count: count ?? 0 };
}

async function fetchCFDIs(companyId: string, partnerId: string) {
  const startYear = startOfYearISO();

  // Recientes (últimos 5)
  const recentRes = await supabase
    .from("cfdi_documents")
    .select("id, folio, total, currency, status, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .eq("related_client_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (recentRes.error) throw new Error(recentRes.error.message);

  // Total YTD (todos los del año, solo monto)
  const ytdRes = await supabase
    .from("cfdi_documents")
    .select("total, currency")
    .eq("company_id", companyId)
    .eq("related_client_id", partnerId)
    .gte("created_at", startYear);
  if (ytdRes.error) throw new Error(ytdRes.error.message);

  // Total all-time
  const allRes = await supabase
    .from("cfdi_documents")
    .select("total, currency")
    .eq("company_id", companyId)
    .eq("related_client_id", partnerId);
  if (allRes.error) throw new Error(allRes.error.message);

  const recent: RecentOperation[] = (recentRes.data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id          as string,
    type:      "cfdi"        as const,
    reference: (r.folio      as string) ?? "",
    date:      (r.created_at as string) ?? null,
    amount:    typeof r.total === "number" ? (r.total as number) : Number(r.total) || null,
    currency:  (r.currency   as string) ?? "MXN",
    status:    (r.status     as string) ?? null,
  }));

  function sumTotal(rows: { total: unknown; currency: unknown }[] | null) {
    if (!rows || rows.length === 0) return { total: 0, currency: "MXN" };
    let sum = 0;
    let currency = "MXN";
    for (const r of rows) {
      const t = typeof r.total === "number" ? r.total : Number(r.total) || 0;
      sum += t;
      if (r.currency && typeof r.currency === "string") currency = r.currency;
    }
    return { total: sum, currency };
  }

  const ytdSum = sumTotal(ytdRes.data as { total: unknown; currency: unknown }[]);
  const allSum = sumTotal(allRes.data as { total: unknown; currency: unknown }[]);
  const count = recentRes.count ?? (allRes.data?.length ?? 0);
  const avgTicket = count > 0 ? Math.round((allSum.total / count) * 100) / 100 : null;

  return {
    recent,
    count,
    ytd_total:     ytdSum.total > 0 ? Math.round(ytdSum.total * 100) / 100 : 0,
    alltime_total: allSum.total > 0 ? Math.round(allSum.total * 100) / 100 : 0,
    currency:      ytdSum.currency,
    avg_ticket:    avgTicket,
  };
}

async function fetchReceivable(companyId: string, partnerId: string) {
  const { data, error } = await supabase
    .from("accounts_receivable")
    .select("id, balance, total, currency, status, due_date")
    .eq("company_id", companyId)
    .eq("client_id", partnerId);

  if (error) throw new Error(error.message);

  let balance = 0;
  let currency = "MXN";
  let overdue  = 0;

  for (const r of (data ?? []) as Record<string, unknown>[]) {
    if (r.status === "paid" || r.status === "cancelled") continue;
    const b = typeof r.balance === "number" ? r.balance : Number(r.balance) || 0;
    balance += b;
    if (r.currency && typeof r.currency === "string") currency = r.currency;
    if (b > 0 && isOverdue(r.due_date as string | null | undefined)) overdue++;
  }

  return {
    balance: Math.round(balance * 100) / 100,
    currency,
    overdue,
  };
}

async function fetchPurchaseOrders(companyId: string, partnerId: string) {
  const startYear = startOfYearISO();

  const recentRes = await supabase
    .from("purchase_orders")
    .select("id, po_number, total, currency, status, created_at", { count: "exact" })
    .eq("company_id", companyId)
    .eq("supplier_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const ytdRes = await supabase
    .from("purchase_orders")
    .select("total, currency")
    .eq("company_id", companyId)
    .eq("supplier_id", partnerId)
    .gte("created_at", startYear);
  if (ytdRes.error) throw new Error(ytdRes.error.message);

  const recent: RecentOperation[] = (recentRes.data ?? []).map((r: Record<string, unknown>) => ({
    id:        r.id           as string,
    type:      "purchase_order" as const,
    reference: (r.po_number  as string) ?? "",
    date:      (r.created_at as string) ?? null,
    amount:    typeof r.total === "number" ? (r.total as number) : Number(r.total) || null,
    currency:  (r.currency   as string) ?? "MXN",
    status:    (r.status     as string) ?? null,
  }));

  let ytdTotal = 0;
  let currency = "MXN";
  for (const r of ((ytdRes.data ?? []) as Record<string, unknown>[])) {
    const t = typeof r.total === "number" ? r.total : Number(r.total) || 0;
    ytdTotal += t;
    if (r.currency && typeof r.currency === "string") currency = r.currency;
  }

  return {
    recent,
    count:     recentRes.count ?? 0,
    ytd_total: Math.round(ytdTotal * 100) / 100,
    currency,
  };
}

async function fetchPayable(companyId: string, partnerId: string) {
  const { data, error } = await supabase
    .from("accounts_payable")
    .select("id, balance, total, currency, status, due_date")
    .eq("company_id", companyId)
    .eq("supplier_id", partnerId);

  if (error) throw new Error(error.message);

  let balance = 0;
  let currency = "MXN";
  let overdue  = 0;

  for (const r of (data ?? []) as Record<string, unknown>[]) {
    if (r.status === "paid" || r.status === "cancelled") continue;
    const b = typeof r.balance === "number" ? r.balance : Number(r.balance) || 0;
    balance += b;
    if (r.currency && typeof r.currency === "string") currency = r.currency;
    if (b > 0 && isOverdue(r.due_date as string | null | undefined)) overdue++;
  }

  return {
    balance: Math.round(balance * 100) / 100,
    currency,
    overdue,
  };
}

// ── Función principal: queries paralelas defensivas ──────────────────
export async function computePartnerSummary(
  companyId: string,
  partnerId: string,
  flags: { isCustomer: boolean; isSupplier: boolean },
): Promise<PartnerSummary> {
  const summary = emptySummary();
  const errors  = summary.errors;

  // Determinar qué queries lanzar según roles
  const promises: Array<Promise<unknown>> = [];

  // Queries de cliente
  if (flags.isCustomer) {
    promises.push(
      safe(fetchQuotations(companyId, partnerId), errors, "quotations").then((r) => {
        if (r) {
          summary.recent_quotations = r.recent;
          summary.count_quotations  = r.count;
        }
      }),
      safe(fetchOrders(companyId, partnerId), errors, "orders").then((r) => {
        if (r) {
          summary.recent_orders = r.recent;
          summary.count_orders  = r.count;
        }
      }),
      safe(fetchShipments(companyId, partnerId), errors, "shipments").then((r) => {
        if (r) {
          summary.recent_shipments = r.recent;
          summary.count_shipments  = r.count;
        }
      }),
      safe(fetchCFDIs(companyId, partnerId), errors, "cfdi_documents").then((r) => {
        if (r) {
          summary.recent_cfdis         = r.recent;
          summary.count_cfdis          = r.count;
          summary.total_invoiced_ytd     = r.ytd_total;
          summary.total_invoiced_alltime = r.alltime_total;
          summary.invoiced_currency    = r.currency;
          summary.avg_ticket           = r.avg_ticket;
        }
      }),
      safe(fetchReceivable(companyId, partnerId), errors, "accounts_receivable").then((r) => {
        if (r) {
          summary.receivable_balance  = r.balance;
          summary.receivable_currency = r.currency;
          summary.receivable_overdue  = r.overdue;
        }
      }),
    );
  }

  // Queries de proveedor
  if (flags.isSupplier) {
    promises.push(
      safe(fetchPurchaseOrders(companyId, partnerId), errors, "purchase_orders").then((r) => {
        if (r) {
          summary.recent_purchase_orders = r.recent;
          summary.count_purchase_orders  = r.count;
          summary.total_purchases_ytd    = r.ytd_total;
        }
      }),
      safe(fetchPayable(companyId, partnerId), errors, "accounts_payable").then((r) => {
        if (r) {
          summary.payable_balance  = r.balance;
          summary.payable_currency = r.currency;
          summary.payable_overdue  = r.overdue;
        }
      }),
    );
  }

  await Promise.all(promises);
  return summary;
}