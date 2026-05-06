import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

// ── KEYS ─────────────────────────────────────────────────────────────────────
// FACTURAPI_LIVE_KEY   → timbre directo como Mobility Marine (su cuenta propia)
// FACTURAPI_USER_KEY   → crear/administrar orgs de clientes (modo SaaS Platform)
// FACTURAPI_SECRET_KEY → test key (fallback para desarrollo)
function getLiveKey(): string {
  const key = process.env.FACTURAPI_LIVE_KEY ?? process.env.FACTURAPI_SECRET_KEY;
  if (!key) throw new Error("FACTURAPI_LIVE_KEY no configurada en el servidor.");
  return key;
}

function getUserKey(): string | null {
  return process.env.FACTURAPI_USER_KEY ?? null;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
async function getCompanySettingsFull(companyId: string) {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select(
      "facturapi_org_id, facturapi_api_key, pac_provider, " +
      "fiscal_name, fiscal_rfc, fiscal_regime, fiscal_zip, " +
      "logo_url, brand_color_dark, brand_color, brand_accent"
    )
    .eq("company_id", companyId)
    .returns<{
      facturapi_org_id:  string | null;
      facturapi_api_key: string | null;
      pac_provider:      string | null;
      fiscal_name:       string | null;
      fiscal_rfc:        string | null;
      fiscal_regime:     string | null;
      fiscal_zip:        string | null;
      logo_url:          string | null;
      brand_color_dark:  string | null;
      brand_color:       string | null;
      brand_accent:      string | null;
    }[]>()
    .single();
  return data;
}

// getCompanySettings usa el helper completo para no duplicar queries
async function getCompanySettings(companyId: string) {
  return getCompanySettingsFull(companyId);
}

// Devuelve la API key correcta para esta empresa:
//   1. La empresa tiene su propia key (cliente SaaS avanzado) → la suya
//   2. Empresa SaaS con org creada via User Key → User Key
//   3. Mobility Marine directo → Live Key
async function getApiKeyForCompany(companyId: string): Promise<string> {
  const settings = await getCompanySettings(companyId);
  if (settings?.facturapi_api_key) return settings.facturapi_api_key;
  if (settings?.facturapi_org_id && getUserKey()) return getUserKey()!;
  return getLiveKey();
}

async function getOrgId(companyId: string): Promise<string | null> {
  const settings = await getCompanySettings(companyId);
  return settings?.facturapi_org_id ?? null;
}

// Helper para llamadas JSON a Facturapi
async function facturapi(
  apiKey: string,
  path:   string,
  method  = "GET",
  body?:  object,
  orgId?: string | null
) {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type":  "application/json",
  };
  if (orgId) headers["X-Facturapi-Organization"] = orgId;

  const res  = await fetch(`${FACTURAPI_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Error en Facturapi");
  return data;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { action, companyId, payload } = await req.json();
    if (!companyId) return NextResponse.json({ error: "companyId requerido" }, { status: 400 });

    // ── SETUP ORG ─────────────────────────────────────────────────────────────
    if (action === "setup_org") {
      const settings = await getCompanySettingsFull(companyId);

      if (!settings?.fiscal_rfc) {
        return NextResponse.json(
          { error: "Configura primero los datos fiscales en Settings → Empresa (RFC, razón social y código postal)." },
          { status: 400 }
        );
      }

      let orgId:   string;
      let orgName: string;
      const userKey = getUserKey();

      if (userKey) {
        // ── MODO SAAS: crear/sincronizar org para esta empresa ────────────────
        if (settings.facturapi_org_id) {
          // Ya tiene org — solo re-sincronizar
          const org = await facturapi(userKey, `/organizations/${settings.facturapi_org_id}`);
          orgId   = org.id;
          orgName = org.legal?.name ?? settings.fiscal_name ?? "";
        } else {
          // Nueva empresa — Paso 1: crear org
          const org = await facturapi(userKey, "/organizations", "POST", {
            name: settings.fiscal_name ?? settings.fiscal_rfc,
          });
          orgId   = org.id;
          orgName = settings.fiscal_name ?? "";

          // Paso 2: datos fiscales (legal)
          await facturapi(userKey, `/organizations/${orgId}/legal`, "PUT", {
            name:       settings.fiscal_name,
            tax_id:     settings.fiscal_rfc,
            tax_system: settings.fiscal_regime ?? "601",
            address:    { zip: settings.fiscal_zip ?? "00000" },
          });

          // Paso 3: subir logo desde Supabase Storage
          if (settings.logo_url) {
            try {
              const logoRes  = await fetch(settings.logo_url);
              const logoBlob = await logoRes.blob();
              const logoForm = new FormData();
              logoForm.append("file", logoBlob, "logo.png");
              await fetch(`${FACTURAPI_BASE}/organizations/${orgId}/logo`, {
                method:  "PUT",
                headers: { "Authorization": `Bearer ${userKey}` },
                body:    logoForm,
              });
            } catch (_) {
              // Logo opcional — no bloquear el flujo si falla
            }
          }

          // Paso 4: color de marca principal → personalización de PDF y email
          const brandColor = settings.brand_color_dark ?? "#0a1628";
          try {
            await facturapi(userKey, `/organizations/${orgId}/customization`, "PUT", {
              color:      brandColor,
              pdf_extra: {
                codes:          true,
                ieps_breakdown: false,
              },
            });
          } catch (_) {
            // Personalización opcional — no bloquear si falla
          }
        }
      } else {
        // ── MODO DIRECTO: Mobility Marine con su propia Live Key ──────────────
        const org = await facturapi(getLiveKey(), "/organization");
        if (!org?.id) throw new Error(
          "No se pudo obtener la organización de Facturapi. Verifica tu FACTURAPI_LIVE_KEY."
        );
        orgId   = org.id;
        orgName = org.legal?.name ?? settings.fiscal_name ?? "";
      }

      // Guardar org_id en BD
      await supabaseAdmin
        .from("company_settings")
        .update({ facturapi_org_id: orgId, pac_provider: "facturapi" })
        .eq("company_id", companyId);

      return NextResponse.json({ org_id: orgId, legal_name: orgName });
    }

    // Para todos los demás actions: obtener key y org_id de esta empresa
    const apiKey = await getApiKeyForCompany(companyId);
    const orgId  = await getOrgId(companyId);

    // effectiveOrgId solo aplica en modo SaaS (User Key + org_id guardado)
    // Con Live Key directa (Mobility Marine) no se necesita el header
    const effectiveOrgId = (getUserKey() && orgId) ? orgId : null;

    // ── EMITIR CFDI ───────────────────────────────────────────────────────────
    if (action === "emitir") {
      const FOLIO_MAP: Record<string, { s: string; f: string; def_s: string }> = {
        I: { s: "invoice_series",  f: "invoice_next_folio",  def_s: "A" },
        E: { s: "egreso_series",   f: "egreso_next_folio",   def_s: "E" },
        P: { s: "pago_series",     f: "pago_next_folio",     def_s: "P" },
        T: { s: "traslado_series", f: "traslado_next_folio", def_s: "T" },
        N: { s: "nomina_series",   f: "nomina_next_folio",   def_s: "N" },
      };

      const cfdiType    = payload.invoice?.type ?? "I";
      const folioConfig = FOLIO_MAP[cfdiType] ?? FOLIO_MAP["I"];

      const { data: folioSettings } = await supabaseAdmin
        .from("company_settings")
        .select(`${folioConfig.s}, ${folioConfig.f}, fiscal_rfc, fiscal_name, fiscal_regime`)
        .eq("company_id", companyId)
        .single();

      const serie = (folioSettings as any)?.[folioConfig.s] ?? folioConfig.def_s;
      const folio = (folioSettings as any)?.[folioConfig.f] ?? 1;

      const invoicePayload: any = {
        ...payload.invoice,
        series:       serie,
        folio_number: folio,
      };

      // ── BLINDAJE SAT/CFDI 4.0 ─────────────────────────────────────────
      // Regla fiscal obligatoria — vive en el backend para no depender de la UI:
      //   • payment_method = PPD  ⇒  payment_form DEBE ser "99"
      //   • payment_method = PUE  ⇒  payment_form NUNCA puede ser "99"
      // Aplica solo a CFDI tipo "I" (ingreso) que es donde existe payment_method.
      if (invoicePayload.payment_method === "PPD") {
        invoicePayload.payment_form = "99";
      } else if (
        invoicePayload.payment_method === "PUE" &&
        invoicePayload.payment_form === "99"
      ) {
        invoicePayload.payment_form = "03"; // fallback seguro: transferencia
      }

      const invoice = await facturapi(apiKey, "/invoices", "POST", invoicePayload, effectiveOrgId);

      const { data: saved, error: saveError } = await supabaseAdmin
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
          issuer_rfc:           invoice.issuer?.tax_id          ?? (folioSettings as any)?.fiscal_rfc    ?? null,
          issuer_name:          invoice.issuer?.legal_name       ?? (folioSettings as any)?.fiscal_name   ?? null,
          issuer_fiscal_regime: invoice.issuer?.tax_system       ?? (folioSettings as any)?.fiscal_regime ?? null,
          receiver_rfc:         invoice.customer?.tax_id,
          receiver_name:        invoice.customer?.legal_name,
          receiver_email:       payload.receiver_email    ?? null,
          receiver_cfdi_use:    invoice.use,
          subtotal:             invoice.subtotal,
          discount:             invoice.discount           ?? 0,
          tax_amount:           invoice.total_taxes        ?? 0,
          total:                invoice.total,
          currency:             invoice.currency,
          exchange_rate:        invoice.exchange           ?? 1,
          payment_method:       invoice.payment_method,
          payment_form:         invoice.payment_form,
          stamp_data:           invoice.stamp              ?? null,
          related_client_id:    payload.client_id          ?? null,
          related_quotation_id: payload.quotation_id       ?? null,
          created_by:           payload.user_id,
        })
        .select()
        .single();

      if (saveError) throw new Error(`Error guardando CFDI en BD: ${saveError.message}`);

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
            discount:    c.discount    ?? 0,
            subtotal:    c.subtotal,
            tax_rate:    c.tax_rate    ?? 0.16,
            tax_amount:  c.tax_amount  ?? 0,
            total:       c.total,
            product_id:  c.product_id  ?? null,
          }))
        );
      }

      await supabaseAdmin
        .from("company_settings")
        .update({ [folioConfig.f]: folio + 1 })
        .eq("company_id", companyId);

      return NextResponse.json({ success: true, cfdi: saved, invoice });
    }

    // ── CANCELAR CFDI ─────────────────────────────────────────────────────────
    if (action === "cancelar") {
      const { cfdi_id, facturapi_id, motive, substitution } = payload;

      // ════════════════════════════════════════════════════════════════
      // Cancelación CFDI vía Facturapi v2
      // ════════════════════════════════════════════════════════════════
      // Formato oficial (https://docs.facturapi.io/api):
      //   DELETE /v2/invoices/{id}?motive={motivo}&substitution={uuid}
      //
      // - motive y substitution van como QUERY STRING, no como body JSON
      // - NO hay subpath /cancel — el DELETE va al recurso raíz
      // - substitution solo aplica para motivo "01" (con relación)
      // ════════════════════════════════════════════════════════════════
      const queryParts: string[] = [`motive=${encodeURIComponent(motive)}`];
      if (substitution) queryParts.push(`substitution=${encodeURIComponent(substitution)}`);

      await facturapi(apiKey, `/invoices/${facturapi_id}?${queryParts.join("&")}`, "DELETE", undefined, effectiveOrgId);

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

    // ── DESCARGAR XML ─────────────────────────────────────────────────────────
    if (action === "xml") {
      const { facturapi_id } = payload;
      const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
      if (effectiveOrgId) headers["X-Facturapi-Organization"] = effectiveOrgId;

      const xml  = await fetch(`${FACTURAPI_BASE}/invoices/${facturapi_id}/xml`, { headers });
      const text = await xml.text();
      return new NextResponse(text, { headers: { "Content-Type": "application/xml" } });
    }

    // ── DESCARGAR PDF ─────────────────────────────────────────────────────────
    if (action === "pdf") {
      const { facturapi_id } = payload;
      const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
      if (effectiveOrgId) headers["X-Facturapi-Organization"] = effectiveOrgId;

      const pdf    = await fetch(`${FACTURAPI_BASE}/invoices/${facturapi_id}/pdf`, { headers });
      const buffer = await pdf.arrayBuffer();
      return new NextResponse(buffer, { headers: { "Content-Type": "application/pdf" } });
    }

    // ── ENVIAR EMAIL ──────────────────────────────────────────────────────────
    if (action === "send_email") {
      const { facturapi_id, email } = payload;
      await facturapi(apiKey, `/invoices/${facturapi_id}/email`, "POST", { email }, effectiveOrgId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
