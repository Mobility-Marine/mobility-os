import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

function getMasterApiKey(): string {
  const key = process.env.FACTURAPI_SECRET_KEY;
  if (!key) throw new Error("FACTURAPI_SECRET_KEY no configurada en el servidor. Agrégala en Vercel → Environment Variables.");
  return key;
}

async function getOrgId(companyId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select("facturapi_org_id")
    .eq("company_id", companyId)
    .single();
  return data?.facturapi_org_id ?? null;
}

async function facturapi(
  apiKey: string,
  path: string,
  method = "GET",
  body?: object,
  orgId?: string
) {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (orgId) headers["X-Facturapi-Organization"] = orgId;

  const res = await fetch(`${FACTURAPI_BASE}${path}`, {
    method,
    headers,
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

    const apiKey = getMasterApiKey();

    // ── SETUP ORG ──────────────────────────────────────────────────────────────
    if (action === "setup_org") {
      const { data: settings } = await supabaseAdmin
        .from("company_settings")
        .select("fiscal_name, fiscal_rfc, fiscal_regime, fiscal_zip, cer_file_url, key_file_url")
        .eq("company_id", companyId)
        .single();

      if (!settings?.fiscal_rfc) {
        return NextResponse.json(
          { error: "Configura primero los datos fiscales en Settings → Empresa (RFC, razón social y código postal)." },
          { status: 400 }
        );
      }

      const org = await facturapi(apiKey, "/organizations", "POST", {
        name: settings.fiscal_name ?? settings.fiscal_rfc,
        legal: {
          name:       settings.fiscal_name,
          tax_id:     settings.fiscal_rfc,
          tax_system: settings.fiscal_regime ?? "601",
          address:    { zip: settings.fiscal_zip ?? "00000", country: "MEX" },
        },
      });

      await supabaseAdmin
        .from("company_settings")
        .update({ facturapi_org_id: org.id, pac_provider: "facturapi" })
        .eq("company_id", companyId);

      return NextResponse.json({ org_id: org.id, legal_name: org.legal?.name });
    }

    // Para todos los demás actions necesitamos el org_id
    const orgId = await getOrgId(companyId);
    if (!orgId) {
      return NextResponse.json(
        { error: "Empresa no registrada en el sistema de timbrado. Ve a Configuración → Sellos SAT y guarda tus certificados." },
        { status: 400 }
      );
    }

    // ── EMITIR CFDI ────────────────────────────────────────────────────────────
    if (action === "emitir") {
      const FOLIO_MAP: Record<string, { s: string; f: string; def_s: string }> = {
        I: { s: "invoice_series",  f: "invoice_next_folio",  def_s: "A" },
        E: { s: "egreso_series",   f: "egreso_next_folio",   def_s: "E" },
        P: { s: "pago_series",     f: "pago_next_folio",     def_s: "P" },
        T: { s: "traslado_series", f: "traslado_next_folio", def_s: "T" },
        N: { s: "nomina_series",   f: "nomina_next_folio",   def_s: "N" },
      };

      const cfdiType: string = payload.invoice?.type ?? "I";
      const folioConfig = FOLIO_MAP[cfdiType] ?? FOLIO_MAP["I"];

      const { data: settings } = await supabaseAdmin
        .from("company_settings")
        .select(`${folioConfig.s}, ${folioConfig.f}`)
        .eq("company_id", companyId)
        .single();

      const serie = (settings as any)?.[folioConfig.s] ?? folioConfig.def_s;
      const folio = (settings as any)?.[folioConfig.f] ?? 1;

      const invoicePayload = {
        ...payload.invoice,
        series:       serie,
        folio_number: folio,
      };

      const invoice = await facturapi(apiKey, "/invoices", "POST", invoicePayload, orgId);

      const { data: saved } = await supabaseAdmin
        .from("cfdi_documents")
        .insert({
          company_id:           companyId,
          facturapi_id:         invoice.id,
          uuid:                 invoice.uuid,
          serie:                invoice.series ?? serie,
          folio:                String(invoice.folio_number ?? folio),
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

      // Incrementar folio según tipo de CFDI
      await supabaseAdmin
        .from("company_settings")
        .update({ [folioConfig.f]: folio + 1 })
        .eq("company_id", companyId);

      return NextResponse.json({ success: true, cfdi: saved, invoice });
    }

    // ── CANCELAR CFDI ──────────────────────────────────────────────────────────
    if (action === "cancelar") {
      const { cfdi_id, facturapi_id, motive, substitution } = payload;
      const cancelPayload: any = { motive };
      if (substitution) cancelPayload.substitution_id = substitution;

      await facturapi(apiKey, `/invoices/${facturapi_id}/cancel`, "DELETE", cancelPayload, orgId);

      await supabaseAdmin
        .from("cfdi_documents")
        .update({
          status:                         "cancelled",
          cancellation_motive:            motive,
          cancellation_substitution_uuid: substitution ?? null,
          updated_at:                     new Date().toISOString(),
        })
        .eq("id", cfdi_id)
        .eq("company_id", companyId);

      return NextResponse.json({ success: true });
    }

    // ── DESCARGAR XML ──────────────────────────────────────────────────────────
    if (action === "xml") {
      const { facturapi_id } = payload;
      const xml = await fetch(`${FACTURAPI_BASE}/invoices/${facturapi_id}/xml`, {
        headers: {
          Authorization:              `Bearer ${apiKey}`,
          "X-Facturapi-Organization": orgId,
        },
      });
      const text = await xml.text();
      return new NextResponse(text, { headers: { "Content-Type": "application/xml" } });
    }

    // ── DESCARGAR PDF ──────────────────────────────────────────────────────────
    if (action === "pdf") {
      const { facturapi_id } = payload;
      const pdf = await fetch(`${FACTURAPI_BASE}/invoices/${facturapi_id}/pdf`, {
        headers: {
          Authorization:              `Bearer ${apiKey}`,
          "X-Facturapi-Organization": orgId,
        },
      });
      const buffer = await pdf.arrayBuffer();
      return new NextResponse(buffer, { headers: { "Content-Type": "application/pdf" } });
    }

    // ── ENVIAR EMAIL ───────────────────────────────────────────────────────────
    if (action === "send_email") {
      const { facturapi_id, email } = payload;
      await facturapi(apiKey, `/invoices/${facturapi_id}/email`, "POST", { email }, orgId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
