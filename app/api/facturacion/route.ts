import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente con service role — lee datos sensibles sin RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

// Obtener la API Key de la empresa de forma segura
async function getApiKey(companyId: string): Promise<{ key: string; env: string } | null> {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select("facturapi_api_key, facturapi_env")
    .eq("company_id", companyId)
    .single();
  if (!data?.facturapi_api_key) return null;
  return { key: data.facturapi_api_key, env: data.facturapi_env ?? "test" };
}

async function facturapi(
  apiKey: string,
  path: string,
  method = "GET",
  body?: object
) {
  const res = await fetch(`${FACTURAPI_BASE}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Error en Facturapi");
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { action, companyId, payload } = await req.json();

    if (!companyId) return NextResponse.json({ error: "companyId requerido" }, { status: 400 });

    // ── SETUP ORG ──────────────────────────────────────────────
    if (action === "setup_org") {
      const { apiKey, env } = payload;
      // Verificar que la key es válida obteniendo el perfil de la organización
      const org = await facturapi(apiKey, "/organization");
      // Guardar org_id en la empresa
      await supabaseAdmin
        .from("company_settings")
        .update({ facturapi_api_key: apiKey, facturapi_org_id: org.id, facturapi_env: env, pac_provider: "facturapi" })
        .eq("company_id", companyId);
      return NextResponse.json({ org_id: org.id, legal_name: org.legal?.name });
    }

    const creds = await getApiKey(companyId);
    if (!creds) return NextResponse.json({ error: "API Key de Facturapi no configurada. Ve a Configuración → Sellos SAT." }, { status: 400 });

    // ── EMITIR CFDI ────────────────────────────────────────────
    if (action === "emitir") {
      const invoice = await facturapi(creds.key, "/invoices", "POST", payload.invoice);

      // Guardar en nuestra base de datos
      const { data: saved } = await supabaseAdmin
        .from("cfdi_documents")
        .insert({
          company_id:           companyId,
          facturapi_id:         invoice.id,
          uuid:                 invoice.uuid,
          serie:                invoice.series,
          folio:                String(invoice.folio_number),
          type:                 invoice.type,
          status:               invoice.status === "valid" ? "valid" : "draft",
          cfdi_date:            invoice.date,
          issuer_rfc:           invoice.issuer?.tax_id,
          issuer_name:          invoice.issuer?.legal_name,
          issuer_fiscal_regime: invoice.issuer?.tax_system,
          receiver_rfc:         invoice.customer?.tax_id,
          receiver_name:        invoice.customer?.legal_name,
          receiver_email:       payload.receiver_email ?? null,
          receiver_cfdi_use:    invoice.use,
          subtotal:             invoice.subtotal,
          discount:             invoice.discount ?? 0,
          tax_amount:           invoice.total_taxes ?? 0,
          total:                invoice.total,
          currency:             invoice.currency,
          exchange_rate:        invoice.exchange ?? 1,
          payment_method:       invoice.payment_method,
          payment_form:         invoice.payment_form,
          stamp_data:           invoice.stamp ?? null,
          related_client_id:    payload.client_id ?? null,
          related_quotation_id: payload.quotation_id ?? null,
          created_by:           payload.user_id,
        })
        .select()
        .single();

      // Guardar conceptos
      if (saved && payload.concepts?.length) {
        await supabaseAdmin.from("cfdi_concepts").insert(
          payload.concepts.map((c: any) => ({
            cfdi_id:     saved.id,
            company_id:  companyId,
            product_key: c.product_key,
            unit_key:    c.unit_key,
            description: c.description,
            unit:        c.unit,
            quantity:    c.quantity,
            unit_price:  c.unit_price,
            discount:    c.discount ?? 0,
            subtotal:    c.subtotal,
            tax_rate:    c.tax_rate ?? 0.16,
            tax_amount:  c.tax_amount ?? 0,
            total:       c.total,
            product_id:  c.product_id ?? null,
          }))
        );
      }

      return NextResponse.json({ success: true, cfdi: saved, invoice });
    }

    // ── CANCELAR CFDI ──────────────────────────────────────────
    if (action === "cancelar") {
      const { cfdi_id, facturapi_id, motive, substitution } = payload;
      const cancelPayload: any = { motive };
      if (substitution) cancelPayload.substitution_id = substitution;

      await facturapi(creds.key, `/invoices/${facturapi_id}/cancel`, "DELETE", cancelPayload);

      await supabaseAdmin
        .from("cfdi_documents")
        .update({ status: "cancelled", cancellation_motive: motive, cancellation_substitution_uuid: substitution ?? null, updated_at: new Date().toISOString() })
        .eq("id", cfdi_id).eq("company_id", companyId);

      return NextResponse.json({ success: true });
    }

    // ── DESCARGAR XML ──────────────────────────────────────────
    if (action === "xml") {
      const { facturapi_id } = payload;
      const xml = await fetch(`${FACTURAPI_BASE}/invoices/${facturapi_id}/xml`, {
        headers: { Authorization: `Bearer ${creds.key}` },
      });
      const text = await xml.text();
      return new NextResponse(text, { headers: { "Content-Type": "application/xml" } });
    }

    // ── DESCARGAR PDF ──────────────────────────────────────────
    if (action === "pdf") {
      const { facturapi_id } = payload;
      const pdf = await fetch(`${FACTURAPI_BASE}/invoices/${facturapi_id}/pdf`, {
        headers: { Authorization: `Bearer ${creds.key}` },
      });
      const buffer = await pdf.arrayBuffer();
      return new NextResponse(buffer, { headers: { "Content-Type": "application/pdf" } });
    }

    // ── ENVIAR EMAIL ───────────────────────────────────────────
    if (action === "send_email") {
      const { facturapi_id, email } = payload;
      await facturapi(creds.key, `/invoices/${facturapi_id}/email`, "POST", { email });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
