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
  if (error || !data) return { total_month: 0, count_month: 0, count_pending_pay: 0, total_pending_pay: 0, count_cancelled: 0, count_total: 0 };
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
  // Construir payload para Facturapi
  const concepts = form.concepts.map((c) => {
    const subtotal = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
    return {
      product_key:  c.product_key,
      unit_key:     c.unit_key,
      description:  c.description,
      unit:         c.unit,
      quantity:     c.quantity,
      unit_price:   c.unit_price,
      discount_pct: c.discount_pct,
      tax_rate:     c.tax_rate,
      tax_amount:   subtotal * c.tax_rate,
      subtotal,
      total:        subtotal + subtotal * c.tax_rate,
      product_id:   c.product_id,
      // Facturapi format
      product: {
        description:  c.description,
        product_key:  c.product_key,
        unit_key:     c.unit_key,
        unit_name:    c.unit,
        price:        c.unit_price,
        tax_included: false,
        taxes: [{ type: "IVA", rate: c.tax_rate, factor: "Tasa", withholding: false }],
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
    notes_ref: form.notes || undefined,
  };

  return callApi("emitir", companyId, {
    invoice,
    concepts,
    client_id:     form.client_id || undefined,
    receiver_email:form.receiver_email || undefined,
    user_id:       userId,
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
