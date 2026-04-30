// ═════════════════════════════════════════════════════════════════════
// POST /api/facturacion/proformas/:id/timbrar
//
// Toma una proforma existente y la timbra en Facturapi.
// El MISMO registro de cfdi_documents pasa de status='proforma' a 'valid'.
// Reutiliza la lógica de Facturapi del endpoint principal (route.ts).
//
// Roles permitidos: owner, admin, manager, finanzas
// ═════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "admin", "manager", "finanzas"];
const FACTURAPI_BASE = "https://www.facturapi.io/v2";

// ─── supabaseAdmin: bypassea RLS para operaciones de servidor ───
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ═══════════ Helpers de Facturapi (idénticos a route.ts principal) ═══════════
function getLiveKey(): string {
  const key = process.env.FACTURAPI_LIVE_KEY ?? process.env.FACTURAPI_SECRET_KEY;
  if (!key) throw new Error("FACTURAPI_LIVE_KEY no configurada en el servidor.");
  return key;
}

function getUserKey(): string | null {
  return process.env.FACTURAPI_USER_KEY ?? null;
}

// ─── Tipo explícito para evitar ambigüedad TypeScript con Supabase types ───
type CompanySettings = {
  facturapi_org_id:     string | null;
  facturapi_api_key:    string | null;
  fiscal_name:          string | null;
  fiscal_rfc:           string | null;
  fiscal_regime:        string | null;
  invoice_series:       string | null;
  invoice_next_folio:   number | null;
  egreso_series:        string | null;
  egreso_next_folio:    number | null;
  pago_series:          string | null;
  pago_next_folio:      number | null;
  traslado_series:      string | null;
  traslado_next_folio:  number | null;
  nomina_series:        string | null;
  nomina_next_folio:    number | null;
};

async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  const { data } = await supabaseAdmin
    .from("company_settings")
    .select(
      "facturapi_org_id, facturapi_api_key, " +
      "fiscal_name, fiscal_rfc, fiscal_regime, " +
      "invoice_series, invoice_next_folio, " +
      "egreso_series, egreso_next_folio, " +
      "pago_series, pago_next_folio, " +
      "traslado_series, traslado_next_folio, " +
      "nomina_series, nomina_next_folio"
    )
    .eq("company_id", companyId)
    .maybeSingle();
  return data as unknown as CompanySettings | null;
}

async function getApiKeyForCompany(companyId: string): Promise<string> {
  const settings = await getCompanySettings(companyId);
  if (settings?.facturapi_api_key) return settings.facturapi_api_key;
  if (settings?.facturapi_org_id && getUserKey()) return getUserKey()!;
  return getLiveKey();
}

async function facturapi(
  apiKey: string,
  path: string,
  method = "GET",
  body?: any,
  orgId?: string | null
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

const FOLIO_MAP: Record<string, { s: string; f: string; def_s: string }> = {
  I: { s: "invoice_series",  f: "invoice_next_folio",  def_s: "A" },
  E: { s: "egreso_series",   f: "egreso_next_folio",   def_s: "E" },
  P: { s: "pago_series",     f: "pago_next_folio",     def_s: "P" },
  T: { s: "traslado_series", f: "traslado_next_folio", def_s: "T" },
  N: { s: "nomina_series",   f: "nomina_next_folio",   def_s: "N" },
};

// ─── Convierte filas de cfdi_concepts al formato items[] de Facturapi ───
function buildItemsFromConcepts(concepts: any[]): any[] {
  return concepts.map((c) => {
    const taxes: any[] = [];
    // IVA traslado (incluye 0% explícito; null/undefined = exento, no se incluye)
    if (c.tax_rate !== null && c.tax_rate !== undefined) {
      taxes.push({
        type: "IVA",
        rate: Number(c.tax_rate),
        withholding: false,
      });
    }
    // IVA retención
    if (c.retention_rate !== null && c.retention_rate !== undefined && Number(c.retention_rate) > 0) {
      taxes.push({
        type: "IVA",
        rate: Number(c.retention_rate),
        withholding: true,
      });
    }

    return {
      product: {
        description: c.description,
        product_key: c.product_key,
        unit_key:    c.unit_key,
        unit_name:   c.unit ?? undefined,
        price:       Number(c.unit_price),
        taxes,
      },
      quantity: Number(c.quantity),
      discount: Number(c.discount ?? 0),
    };
  });
}

// ════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ════════════════════════════════════════════════════════════════════════
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ─── 1. Autenticar usuario ───
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userData, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !userData.user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    const userId = userData.user.id;

    // ─── 2. Cargar proforma ───
    const { data: proforma, error: pErr } = await supabaseAdmin
      .from("cfdi_documents")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (pErr || !proforma) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 });
    }
    if (proforma.status !== "proforma") {
      return NextResponse.json(
        { error: "Solo se pueden timbrar proformas (estado 'proforma')" },
        { status: 400 }
      );
    }

    // ─── 3. Validar permisos ───
    const { data: membership } = await supabaseAdmin
      .from("company_users")
      .select("role")
      .eq("user_id", userId)
      .eq("company_id", proforma.company_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "No perteneces a esta empresa" }, { status: 403 });
    }
    if (!ALLOWED_ROLES.includes(membership.role)) {
      return NextResponse.json({ error: "No tienes permiso para timbrar" }, { status: 403 });
    }

    // ─── 4. Validaciones obligatorias antes de timbrar ───
    if (!proforma.receiver_rfc || !proforma.receiver_name) {
      return NextResponse.json(
        { error: "La proforma debe tener cliente con RFC y razón social para poder timbrarse" },
        { status: 400 }
      );
    }
    if (!proforma.receiver_cfdi_use) {
      return NextResponse.json(
        { error: "La proforma debe tener uso de CFDI" },
        { status: 400 }
      );
    }

    // ─── 5. Cargar conceptos ───
    const { data: concepts, error: cErr } = await supabaseAdmin
      .from("cfdi_concepts")
      .select("*")
      .eq("cfdi_id", proforma.id)
      .order("created_at", { ascending: true });

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ error: "La proforma no tiene conceptos" }, { status: 400 });
    }

    // ─── 6. Cargar settings y obtener serie/folio según tipo ───
    const cfdiType = proforma.type ?? "I";
    const folioConfig = FOLIO_MAP[cfdiType] ?? FOLIO_MAP["I"];

    const settings = await getCompanySettings(proforma.company_id);
    if (!settings) {
      return NextResponse.json(
        { error: "Configura primero los datos fiscales de la empresa" },
        { status: 400 }
      );
    }
    const serie = (settings as any)[folioConfig.s] ?? folioConfig.def_s;
    const folio = (settings as any)[folioConfig.f] ?? 1;

    // ─── 7. Blindaje SAT (PPD/PUE vs payment_form) ───
    let paymentMethod = proforma.payment_method ?? "PUE";
    let paymentForm   = proforma.payment_form   ?? "03";

    if (paymentMethod === "PPD") {
      paymentForm = "99";
    } else if (paymentMethod === "PUE" && paymentForm === "99") {
      paymentForm = "03";
    }

    // ─── 8. Construir invoicePayload para Facturapi ───
    const items = buildItemsFromConcepts(concepts);

    const invoicePayload: any = {
      type: cfdiType,
      customer: {
        tax_id:     proforma.receiver_rfc,
        legal_name: proforma.receiver_name,
        tax_system: proforma.receiver_fiscal_regime ?? undefined,
        address:    proforma.receiver_zip ? { zip: proforma.receiver_zip } : undefined,
        email:      proforma.receiver_email ?? undefined,
      },
      items,
      use:            proforma.receiver_cfdi_use,
      payment_method: paymentMethod,
      payment_form:   paymentForm,
      currency:       proforma.currency ?? "MXN",
      exchange:       Number(proforma.exchange_rate ?? 1),
      series:         serie,
      folio_number:   folio,
    };

    // ─── 9. Llamar a Facturapi ───
    const apiKey = await getApiKeyForCompany(proforma.company_id);
    const orgIdSettings = settings.facturapi_org_id;
    const effectiveOrgId = (getUserKey() && orgIdSettings) ? orgIdSettings : null;

    const invoice = await facturapi(apiKey, "/invoices", "POST", invoicePayload, effectiveOrgId);

    // ─── 10. Actualizar el MISMO registro: proforma → CFDI timbrado ───
    const { error: upErr } = await supabaseAdmin
      .from("cfdi_documents")
      .update({
        facturapi_id:         invoice.id,
        uuid:                 invoice.uuid,
        serie:                invoice.series ?? serie,
        folio:                String(invoice.folio_number ?? folio),
        status:               invoice.status === "valid" ? "valid" : "draft",
        cfdi_date:            invoice.date,
        issuer_rfc:           invoice.issuer?.tax_id     ?? proforma.issuer_rfc,
        issuer_name:          invoice.issuer?.legal_name ?? proforma.issuer_name,
        issuer_fiscal_regime: invoice.issuer?.tax_system ?? proforma.issuer_fiscal_regime,
        stamp_data:           invoice.stamp ?? null,
        updated_at:           new Date().toISOString(),
      })
      .eq("id", proforma.id);

    if (upErr) {
      console.error("[timbrar proforma] update cfdi error:", upErr);
      return NextResponse.json(
        { error: `El CFDI fue timbrado en Facturapi (${invoice.id}) pero hubo error al actualizar el registro: ${upErr.message}` },
        { status: 500 }
      );
    }

    // ─── 11. Incrementar el folio para el siguiente CFDI ───
    await supabaseAdmin
      .from("company_settings")
      .update({ [folioConfig.f]: folio + 1 })
      .eq("company_id", proforma.company_id);

    return NextResponse.json({
      success: true,
      cfdi:    { ...proforma, ...invoice },
      invoice,
    });
  } catch (err: any) {
    console.error("[timbrar proforma] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}
