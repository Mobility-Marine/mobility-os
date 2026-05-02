// ═══════════════════════════════════════════════════════════════════════
// Helpers compartidos para los endpoints de Carta Porte
// 
// Reutiliza el mismo patrón de auth + Facturapi + folios usado en el
// endpoint principal de facturación y proformas.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

export const ALLOWED_ROLES = ["owner", "admin", "manager", "finanzas"];
export const FACTURAPI_BASE = "https://www.facturapi.io/v2";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Facturapi keys ───
export function getLiveKey(): string {
  const key = process.env.FACTURAPI_LIVE_KEY ?? process.env.FACTURAPI_SECRET_KEY;
  if (!key) throw new Error("FACTURAPI_LIVE_KEY no configurada en el servidor.");
  return key;
}

export function getUserKey(): string | null {
  return process.env.FACTURAPI_USER_KEY ?? null;
}

// ─── Company settings ───
export type CompanySettings = {
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

export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
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

export async function getApiKeyForCompany(companyId: string): Promise<string> {
  const settings = await getCompanySettings(companyId);
  if (settings?.facturapi_api_key) return settings.facturapi_api_key;
  if (settings?.facturapi_org_id && getUserKey()) return getUserKey()!;
  return getLiveKey();
}

// ─── Llamada genérica a Facturapi ───
export async function facturapi(
  apiKey: string,
  path: string,
  method = "GET",
  body?: any,
  orgId?: string | null
) {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type":  "application/json",
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

// ─── Folios SAT por tipo de CFDI ───
export const FOLIO_MAP: Record<string, { s: string; f: string; def_s: string }> = {
  I: { s: "invoice_series",  f: "invoice_next_folio",  def_s: "A" },
  E: { s: "egreso_series",   f: "egreso_next_folio",   def_s: "E" },
  P: { s: "pago_series",     f: "pago_next_folio",     def_s: "P" },
  T: { s: "traslado_series", f: "traslado_next_folio", def_s: "T" },
  N: { s: "nomina_series",   f: "nomina_next_folio",   def_s: "N" },
};

// ─── Auth: valida token y retorna userId ───
export async function authenticateRequest(
  req: Request
): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "No autorizado", status: 401 };

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: userData, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !userData.user) return { error: "Sesión inválida", status: 401 };

  return { userId: userData.user.id };
}

// ─── Permission check: valida membership y rol ───
export async function checkCompanyAccess(
  userId: string,
  companyId: string
): Promise<{ ok: true; role: string } | { ok: false; error: string; status: number }> {
  const { data: membership } = await supabaseAdmin
    .from("company_users")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership) return { ok: false, error: "No perteneces a esta empresa", status: 403 };
  if (!ALLOWED_ROLES.includes(membership.role)) {
    return { ok: false, error: "No tienes permiso para esta operación", status: 403 };
  }
  return { ok: true, role: membership.role };
}

// ─── Helper: pre-calcula los id_ubicacion (OR000001, DE000001...) ───
export function buildIdUbicacionMap(ubicaciones: any[]): Record<number, string> {
  const idsByIndex: Record<number, string> = {};
  let orCount = 0;
  let deCount = 0;
  ubicaciones.forEach((u, idx) => {
    if (u.tipo_ubicacion === "Origen") {
      orCount++;
      idsByIndex[idx] = `OR${String(orCount).padStart(6, "0")}`;
    } else {
      deCount++;
      idsByIndex[idx] = `DE${String(deCount).padStart(6, "0")}`;
    }
  });
  return idsByIndex;
}
