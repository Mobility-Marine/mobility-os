// ════════════════════════════════════════════════════════════════════════
// API: POST /api/sat/validate-customer
// ════════════════════════════════════════════════════════════════════════
// Valida los datos fiscales de un partner contra el padrón SAT vía Facturapi.
//
// Cada empresa del SaaS tiene su propia organización en Facturapi con su
// API key (en company_settings.facturapi_api_key). Por eso el customer
// debe registrarse en la org de la empresa, no en una global.
//
// Flujo:
//   1. Recibe { companyId, rfc, taxRegime, zipCode, legalName, email, partnerId? }
//   2. Lee la facturapi_api_key de la empresa desde company_settings
//      Si no existe → error explícito (configurar Facturapi en Settings)
//   3. Si partnerId tiene facturapi_customer_id → PUT (actualiza)
//      Si no → POST (crear)
//   4. Facturapi valida RFC + régimen + CP contra el padrón SAT.
//   5. Si OK: persiste customer.id en business_partners.facturapi_customer_id
//      y retorna { ok: true, customerId, status: "valid" }
//   6. Si error: retorna el mensaje exacto de Facturapi
//
// Seguridad:
//   - Ninguna API key se expone al cliente
//   - Se usa SUPABASE_SERVICE_ROLE_KEY para bypass RLS (consistente con
//     el patrón del resto de endpoints en /app/api/*)
// ════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FACTURAPI_BASE = "https://www.facturapi.io/v2";

// ── Cliente Supabase admin (consistente con resto de endpoints) ──────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Tipos ────────────────────────────────────────────────────────────
type ValidateRequest = {
  companyId:   string;
  rfc:         string;
  taxRegime:   string;
  zipCode:     string;
  legalName:   string;
  email?:      string;
  partnerId?:  string;
};

// ── Helpers ──────────────────────────────────────────────────────────
function badRequest(message: string) {
  return NextResponse.json(
    { ok: false, error: message, status: "invalid" },
    { status: 400 },
  );
}

function serverError(message: string, status = 500) {
  return NextResponse.json(
    { ok: false, error: message, status: "error" },
    { status },
  );
}

// ════════════════════════════════════════════════════════════════════
// Obtener API key de Facturapi (modo BD ó modo sistema)
// ════════════════════════════════════════════════════════════════════
// Hay dos formas válidas de configurar Facturapi en Mobility OS:
//
//   1) Por empresa (BD): cada tenant define su propia API key en
//      company_settings.facturapi_api_key. Útil para multi-empresa
//      donde cada una tiene su propia cuenta Facturapi.
//
//   2) A nivel sistema (.env): credenciales globales en variables de
//      entorno del servidor. Útil cuando el SaaS opera con una sola
//      cuenta Facturapi para todos los tenants (caso Mobility Marine
//      hoy).
//
// Prioridad: BD primero. Si la empresa NO tiene credenciales propias,
// caemos a la configuración del sistema. Solo si ambas faltan, error.
// ════════════════════════════════════════════════════════════════════
async function getCompanyFacturapiKey(companyId: string): Promise<string | null> {
  // 1) Intentar credenciales específicas de la empresa
  const { data, error } = await supabaseAdmin
    .from("company_settings")
    .select("facturapi_api_key")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!error && data) {
    const dbKey = (data as { facturapi_api_key: string | null }).facturapi_api_key;
    if (dbKey && dbKey.trim()) return dbKey.trim();
  }

  // 2) Fallback: variables de entorno del sistema
  const envKey = process.env.FACTURAPI_API_KEY?.trim();
  if (envKey) return envKey;

  return null;
}

// ── Persistir resultado de validación en BD ───────────────────────────
async function persistValidResult(companyId: string, partnerId: string, customerId: string) {
  await supabaseAdmin
    .from("business_partners")
    .update({
      facturapi_customer_id: customerId,
      validation_sat_status: "valid",
      validation_sat_date:   new Date().toISOString(),
      validation_sat_error:  null,
    })
    .eq("id", partnerId)
    .eq("company_id", companyId);
}

async function persistInvalidResult(companyId: string, partnerId: string, error: string) {
  await supabaseAdmin
    .from("business_partners")
    .update({
      validation_sat_status: "invalid",
      validation_sat_date:   new Date().toISOString(),
      validation_sat_error:  error.slice(0, 500),
    })
    .eq("id", partnerId)
    .eq("company_id", companyId);
}

// ── POST handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parsear body
  let body: ValidateRequest;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido. Se esperaba JSON.");
  }

  const companyId = (body.companyId ?? "").trim();
  const rfc       = (body.rfc       ?? "").trim().toUpperCase();
  const taxRegime = (body.taxRegime ?? "").trim();
  const zipCode   = (body.zipCode   ?? "").trim();
  const legalName = (body.legalName ?? "").trim();
  const email     = (body.email     ?? "").trim();
  const partnerId = body.partnerId;

  // 2. Validaciones básicas
  if (!companyId)                                 return badRequest("companyId requerido.");
  if (rfc.length < 12 || rfc.length > 13)         return badRequest("RFC inválido. Debe tener 12 o 13 caracteres.");
  if (!taxRegime)                                 return badRequest("Régimen fiscal requerido.");
  if (!/^\d{5}$/.test(zipCode))                   return badRequest("Código postal inválido. Debe ser de 5 dígitos.");
  if (!legalName)                                 return badRequest("Razón social requerida.");

  // 3. Obtener API key Facturapi de la empresa
  const apiKey = await getCompanyFacturapiKey(companyId);
  if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          status: "error",
          error: "La cuenta de Facturapi de tu empresa (emisor) no está configurada. Ve a Settings → Fiscal y CFDI → Configuración PAC para activarla. Esto NO afecta al partner que estás validando.",
        },
        { status: 400 },
      );
    }

  // 4. Si partnerId presente, obtener facturapi_customer_id existente
  let existingFacturapiId: string | null = null;
  if (partnerId) {
    const { data: partner } = await supabaseAdmin
      .from("business_partners")
      .select("facturapi_customer_id, company_id")
      .eq("id", partnerId)
      .maybeSingle();

    if (!partner) return badRequest("Partner no encontrado.");
    const partnerCompanyId = (partner as { company_id: string }).company_id;
    if (partnerCompanyId !== companyId) {
      return badRequest("Partner no pertenece a la empresa indicada.");
    }
    existingFacturapiId = (partner as { facturapi_customer_id: string | null }).facturapi_customer_id ?? null;
  }

  // 5. Construir payload Facturapi
  const facturapiPayload: Record<string, unknown> = {
    legal_name: legalName,
    tax_id:     rfc,
    tax_system: taxRegime,
    address:    { zip: zipCode },
  };
  if (email) facturapiPayload.email = email;

  // 6. Llamar Facturapi (POST nuevo o PUT existente)
  const endpoint = existingFacturapiId
    ? `${FACTURAPI_BASE}/customers/${existingFacturapiId}`
    : `${FACTURAPI_BASE}/customers`;
  const method = existingFacturapiId ? "PUT" : "POST";

  let facturapiRes: Response;
  try {
    facturapiRes = await fetch(endpoint, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(facturapiPayload),
    });
  } catch (e) {
    return serverError(
      `Error de red al contactar Facturapi: ${e instanceof Error ? e.message : String(e)}`,
      502,
    );
  }

  const facturapiData = (await facturapiRes.json().catch(() => ({}))) as Record<string, unknown>;

  // 7. Si Facturapi rechaza → datos no coinciden con padrón SAT
  if (!facturapiRes.ok) {
    const errorMsg =
      (facturapiData?.message as string | undefined) ??
      (facturapiData?.error   as string | undefined) ??
      `Error ${facturapiRes.status} de Facturapi.`;

    if (partnerId) {
      await persistInvalidResult(companyId, partnerId, errorMsg);
    }

    return NextResponse.json(
      { ok: false, error: errorMsg, status: "invalid" },
      { status: 200 },
    );
  }

  // 8. Éxito: extraer customer.id
  const customerId = facturapiData?.id as string | undefined;
  if (!customerId) {
    return serverError("Facturapi no retornó un customer ID válido.", 502);
  }

  // 9. Si es un partner existente, persistir
  if (partnerId) {
    await persistValidResult(companyId, partnerId, customerId);
  }

  // 10. Devolver éxito
  return NextResponse.json({
    ok:         true,
    status:     "valid",
    customerId,
  });
}