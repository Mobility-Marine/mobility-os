// ═══════════════════════════════════════════════════════════════════════
// GET /api/facturacion/cfdi/[id]/pdf
//
// Descarga on-demand del PDF de un CFDI emitido (desde Facturapi).
// Reutiliza el patrón auth + Facturapi de carta-porte/_lib/shared.
//
// Usado por el módulo de Documentación (Document Manager 360°)
// para mostrar PDFs de CFDI sin necesidad de persistirlos en Storage.
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

    // 1) Auth
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // 2) Buscar CFDI en BD
    const { data: cfdi, error: cfdiErr } = await supabaseAdmin
      .from("cfdi_documents")
      .select("id, company_id, facturapi_id, serie, folio")
      .eq("id", cfdiId)
      .maybeSingle();

    if (cfdiErr || !cfdi) {
      return NextResponse.json({ error: "CFDI no encontrado" }, { status: 404 });
    }

    // 3) Validar acceso a la empresa
    const access = await checkCompanyAccess(userId, cfdi.company_id);
    if (!access.ok) {
      const fail = access as Extract<typeof access, { ok: false }>;
      return NextResponse.json({ error: fail.error }, { status: fail.status });
    }

    if (!cfdi.facturapi_id) {
      return NextResponse.json({ error: "CFDI sin facturapi_id" }, { status: 400 });
    }

    // 4) API key + org de la empresa
    const apiKey = await getApiKeyForCompany(cfdi.company_id);
    const settings = await getCompanySettings(cfdi.company_id);
    const orgId = settings?.facturapi_org_id ?? null;

    // 5) Descargar PDF binario desde Facturapi
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
    };
    if (orgId) headers["X-Facturapi-Organization"] = orgId;

    const fapiResp = await fetch(
      `${FACTURAPI_BASE}/invoices/${cfdi.facturapi_id}/pdf`,
      { method: "GET", headers }
    );

    if (!fapiResp.ok) {
      const errText = await fapiResp.text();
      console.error("Facturapi PDF error:", fapiResp.status, errText);
      return NextResponse.json(
        { error: "Error descargando PDF de Facturapi" },
        { status: fapiResp.status }
      );
    }

    const pdfBuffer = await fapiResp.arrayBuffer();
    const filename = `CFDI_${cfdi.serie ?? ""}${cfdi.folio ?? ""}.pdf`
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control":       "private, max-age=600",
      },
    });
  } catch (err: any) {
    console.error("Error en GET /api/facturacion/cfdi/[id]/pdf:", err);
    return NextResponse.json(
      { error: err.message ?? "Error interno del servidor" },
      { status: 500 }
    );
  }
}