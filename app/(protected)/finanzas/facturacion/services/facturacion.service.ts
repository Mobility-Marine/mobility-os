import { supabase } from "@/lib/supabaseClient";
import type { CFDIDocument, FacturacionStats, NewCFDIForm } from "../types/facturacion.types";

const API = "/api/facturacion";

async function callApi(action: string, companyId: string, payload: object) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, companyId, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error en servidor");
  return data;
}

// ── LISTA DE CFDIs ────────────────────────────────────────────

export async function fetchCFDIs(companyId: string, filters: {
  type?: string; status?: string; search?: string;
  from?: string; to?: string; limit?: number;
}): Promise<CFDIDocument[]> {
  let query = supabase
    .from("cfdi_documents")
    .select("*")
    .eq("company_id", companyId)
    .order("cfdi_date", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.type)   query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from)   query = query.gte("cfdi_date", filters.from);
  if (filters.to)     query = query.lte("cfdi_date", filters.to);
  if (filters.search) {
    const s = `%${filters.search}%`;
    query = query.or(`receiver_rfc.ilike.${s},receiver_name.ilike.${s},uuid.ilike.${s},folio.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CFDIDocument[];
}

export async function fetchCFDIStats(companyId: string): Promise<FacturacionStats> {
  const { data, error } = await supabase.rpc("get_facturacion_stats", { p_company_id: companyId });
  if (error || !data) return { total_month: 0, count_month: 0, count_pending_pay: 0, total_pending_pay: 0, count_cancelled: 0, count_total: 0, por_moneda: {} };
  return data as FacturacionStats;
}

export async function fetchCFDIById(id: string): Promise<{ cfdi: CFDIDocument; concepts: any[] } | null> {
  const [{ data: cfdi }, { data: concepts }] = await Promise.all([
    supabase.from("cfdi_documents").select("*").eq("id", id).single(),
    supabase.from("cfdi_concepts").select("*").eq("cfdi_id", id),
  ]);
  if (!cfdi) return null;
  return { cfdi: cfdi as CFDIDocument, concepts: concepts ?? [] };
}

// ── EMITIR ────────────────────────────────────────────────────

export async function emitirCFDI(companyId: string, userId: string, form: NewCFDIForm) {
  const concepts = form.concepts.map((c) => {
    const base        = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
    const taxes       = c.taxes ?? [{ type: "IVA", rate: 0.16, factor: "Tasa", withholding: false }];
    const trasladados = taxes.filter((t: any) => !t.withholding).reduce((s: number, t: any) => s + (t.factor === "Exento" ? 0 : base * t.rate), 0);
    const retenidos   = taxes.filter((t: any) =>  t.withholding).reduce((s: number, t: any) => s + base * t.rate, 0);
    const total       = base + trasladados - retenidos;

    return {
      product_key:  c.product_key,
      unit_key:     c.unit_key,
      description:  c.description,
      unit:         c.unit,
      quantity:     c.quantity,
      unit_price:   c.unit_price,
      discount_pct: c.discount_pct,
      taxes,
      subtotal:     base,
      tax_amount:   trasladados,
      retention_amount: retenidos,
      total,
      product_id:   c.product_id,
      product: {
        description:  c.description,
        product_key:  c.product_key,
        unit_key:     c.unit_key,
        unit_name:    c.unit,
        price:        c.unit_price,
        tax_included: false,
        taxes: taxes.map((t: any) => ({
          type:        t.type,
          rate:        t.factor === "Exento" ? undefined : t.rate,
          factor:      t.factor,
          withholding: t.withholding,
        })),
      },
    };
  });

  const invoice = {
    type:           "I",
    use:            form.receiver_cfdi_use,
    series:         form.serie,
    payment_method: form.payment_method,
    payment_form:   form.payment_form,
    currency:       form.currency,
    exchange:       form.exchange_rate,
    date:           new Date(form.cfdi_date).toISOString(),
    customer: {
      legal_name:  form.receiver_name,
      tax_id:      form.receiver_rfc,
      tax_system:  form.receiver_regime,
      email:       form.receiver_email || undefined,
      address:     { zip: form.receiver_zip },
    },
    items: concepts.map((c) => ({
      product:  c.product,
      quantity: c.quantity,
      discount: c.discount_pct > 0 ? (c.unit_price * c.quantity * c.discount_pct / 100) : undefined,
    })),
    pdf_custom_section: form.notes || undefined,
  };

  return callApi("emitir", companyId, {
    invoice,
    concepts,
    client_id:      form.client_id || undefined,
    receiver_email: form.receiver_email || undefined,
    user_id:        userId,
  });
}

// ── CANCELAR ──────────────────────────────────────────────────

export async function cancelarCFDI(
  companyId: string, cfdiId: string, facturApiId: string,
  motive: string, substitution?: string
) {
  return callApi("cancelar", companyId, { cfdi_id: cfdiId, facturapi_id: facturApiId, motive, substitution });
}

// ── DESCARGAR ─────────────────────────────────────────────────

export async function downloadXML(companyId: string, facturApiId: string, folio: string) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "xml", companyId, payload: { facturapi_id: facturApiId } }),
  });
  if (!res.ok) throw new Error("Error descargando XML");
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `CFDI-${folio}.xml`; link.click();
  URL.revokeObjectURL(url);
}

export async function downloadPDF(companyId: string, facturApiId: string, folio: string) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "pdf", companyId, payload: { facturapi_id: facturApiId } }),
  });
  if (!res.ok) throw new Error("Error descargando PDF");
  const blob = await res.blob();
  const url  = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url; link.download = `CFDI-${folio}.pdf`; link.click();
  URL.revokeObjectURL(url);
}

export async function sendEmail(companyId: string, facturApiId: string, email: string) {
  return callApi("send_email", companyId, { facturapi_id: facturApiId, email });
}

// ── COMPLEMENTO DE PAGO (REP) ──────────────────────────────
export async function emitirComplementoPago(
  companyId: string, userId: string,
  payload: {
    client_id?:    string;
    receiver_rfc:  string;
    receiver_name: string;
    receiver_email?:string;
    receiver_zip:  string;
    receiver_regime:string;
    payment_date:  string;
    payment_form:  string;
    currency:      string;
    amount:        number;
    related_uuid:  string;
    related_folio: string;
    related_currency: string;
    related_balance:  number;
    installment:   number;
  }
) {
  const invoice = {
    type:     "P",
    customer: {
      legal_name: payload.receiver_name,
      tax_id:     payload.receiver_rfc,
      tax_system: payload.receiver_regime,
      email:      payload.receiver_email || undefined,
      address:    { zip: payload.receiver_zip },
    },
    complements: [{
      type: "pago",
      data: [{
        related_documents: [{
          uuid:           payload.related_uuid,
          folio:          payload.related_folio,
          currency:       payload.related_currency,
          payment_method: "PPD",
          partial_amount: payload.amount,
          installment:    payload.installment,
          last_balance:   payload.related_balance,
          amount:         payload.amount,
        }],
        currency:     payload.currency,
        exchange:     1,
        amount:       payload.amount,
        date:         new Date(payload.payment_date).toISOString(),
        payment_form: payload.payment_form,
      }],
    }],
  };

  const res = await fetch("/api/facturacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "emitir", companyId,
      payload: { invoice, client_id: payload.client_id, receiver_email: payload.receiver_email, user_id: userId, concepts: [] },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error emitiendo complemento de pago");
  return data;
}

// ── NOTA DE CRÉDITO ────────────────────────────────────────
export async function emitirNotaCredito(
  companyId: string, userId: string,
  payload: {
    client_id?:       string;
    receiver_rfc:     string;
    receiver_name:    string;
    receiver_email?:  string;
    receiver_zip:     string;
    receiver_regime:  string;
    receiver_cfdi_use:string;
    related_uuid?:    string;
    currency:         string;
    payment_form:     string;
    concepts:         any[];
  }
) {
  const items = payload.concepts.map((c) => ({
    product: {
      description:  c.description,
      product_key:  c.product_key,
      unit_key:     c.unit_key,
      unit_name:    c.unit,
      price:        c.unit_price,
      tax_included: false,
      taxes: [{ type: "IVA", rate: c.tax_rate, factor: "Tasa", withholding: false }],
    },
    quantity: c.quantity,
  }));

  const invoice: any = {
    type:           "E",
    use:            payload.receiver_cfdi_use,
    payment_form:   payload.payment_form,
    currency:       payload.currency,
    customer: {
      legal_name: payload.receiver_name,
      tax_id:     payload.receiver_rfc,
      tax_system: payload.receiver_regime,
      email:      payload.receiver_email || undefined,
      address:    { zip: payload.receiver_zip },
    },
    items,
  };

  if (payload.related_uuid) {
    invoice.related_documents = [{ relationship: "01", uuid: payload.related_uuid }];
  }

  const res = await fetch("/api/facturacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "emitir", companyId,
      payload: { invoice, client_id: payload.client_id, receiver_email: payload.receiver_email, user_id: userId, concepts: payload.concepts },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error emitiendo nota de crédito");
  return data;
}

// ── NOTAS SIN VALOR FISCAL ─────────────────────────────────
export async function fetchBusinessNotes(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("business_notes")
    .select("*")
    .eq("company_id", companyId)
    .order("date", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBusinessNote(companyId: string, userId: string, payload: {
  type: string; date: string; receiver_name: string; receiver_rfc?: string;
  receiver_email?: string; client_id?: string; currency: string;
  concepts: any[]; notes?: string;
}): Promise<void> {
  const subtotal = payload.concepts.reduce((s, c) => s + c.quantity * c.unit_price, 0);
  const { data: settings } = await supabase
    .from("company_settings").select("quote_number_counter").eq("company_id", companyId).maybeSingle();
  const folio = (settings?.quote_number_counter ?? 0) + 1;

  const { error } = await supabase.from("business_notes").insert({
    company_id:    companyId,
    note_number:   `N-${String(folio).padStart(4, "0")}`,
    type:          payload.type,
    date:          payload.date,
    client_id:     payload.client_id ?? null,
    receiver_name: payload.receiver_name,
    receiver_rfc:  payload.receiver_rfc ?? null,
    receiver_email:payload.receiver_email ?? null,
    currency:      payload.currency,
    subtotal,
    tax_amount:    0,
    total:         subtotal,
    concepts:      payload.concepts,
    notes:         payload.notes ?? null,
    created_by:    userId,
  });
  if (error) throw new Error(error.message);
}
