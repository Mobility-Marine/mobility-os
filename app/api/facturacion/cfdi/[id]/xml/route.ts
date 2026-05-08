// ═══════════════════════════════════════════════════════════════════════
// GET /api/facturacion/cfdi/[id]/xml
//
// Descarga on-demand del XML SAT de un CFDI emitido (desde Facturapi).
// Mismo patrón que /pdf pero retorna application/xml.
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  authenticateRequest, checkCompanyAccess,
  getApiKeyForCompany, getCompanySettings,
  supabaseAdmin, FACTURAPI_BASE,
} from "../../../carta-porte/_lib/shared";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cfdiId = params.id;
    if (!cfdiId) {
      return NextResponse.json({ error: "ID de CFDI requerido" }, { status: 400 });
    }

    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { data: cfdi, error: cfdiErr } = await supabaseAdmin
      .from("cfdi_documents")
      .select("id, company_id, facturapi_id, serie, folio")
      .eq("id", cfdiId)
      .maybeSingle();

    if (cfdiErr || !cfdi) {
      return NextResponse.json({ error: "CFDI no encontrado" }, { status: 404 });
    }

    const access = await checkCompanyAccess(userId, cfdi.company_id);
    if (!access.ok) {
      const fail = access as Extract<typeof access, { ok: false }>;
      return NextResponse.json({ error: fail.error }, { status: fail.status });
    }

    if (!cfdi.facturapi_id) {
      return NextResponse.json({ error: "CFDI sin facturapi_id" }, { status: 400 });
    }

    const apiKey = await getApiKeyForCompany(cfdi.company_id);
    const settings = await getCompanySettings(cfdi.company_id);
    const orgId = settings?.facturapi_org_id ?? null;

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
    };
    if (orgId) headers["X-Facturapi-Organization"] = orgId;

    const fapiResp = await fetch(
      `${FACTURAPI_BASE}/invoices/${cfdi.facturapi_id}/xml`,
      { method: "GET", headers }
    );

    if (!fapiResp.ok) {
      const errText = await fapiResp.text();
      console.error("Facturapi XML error:", fapiResp.status, errText);
      return NextResponse.json(
        { error: "Error descargando XML de Facturapi" },
        { status: fapiResp.status }
      );
    }

    const xmlText = await fapiResp.text();
    const filename = `CFDI_${cfdi.serie ?? ""}${cfdi.folio ?? ""}.xml`
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(xmlText, {
      status: 200,
      headers: {
        "Content-Type":        "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "private, max-age=600",
      },
    });
  } catch (err: any) {
    console.error("Error en GET /api/facturacion/cfdi/[id]/xml:", err);
    return NextResponse.json(
      { error: err.message ?? "Error interno del servidor" },
      { status: 500 }
    );
  }
}