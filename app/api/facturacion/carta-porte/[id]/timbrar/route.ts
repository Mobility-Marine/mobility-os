// ═══════════════════════════════════════════════════════════════════════
// POST /api/facturacion/carta-porte/:id/timbrar
// 
// Toma un borrador y lo timbra al SAT vía Facturapi.
// El MISMO registro de cfdi_documents pasa de status='draft' a 'valid'.
// 
// Roles permitidos: owner, admin, manager, finanzas
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  authenticateRequest,
  checkCompanyAccess,
  supabaseAdmin,
  getCompanySettings,
  getApiKeyForCompany,
  getUserKey,
  facturapi,
  FOLIO_MAP,
} from "../../_lib/shared";
import { loadCartaPorteForStamping } from "../../_lib/db_helpers";
import { buildFacturapiPayload } from "../../_lib/facturapi_mapper";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1) Auth
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // 2) Cargar el CFDI
    const { data: cfdiBase } = await supabaseAdmin
      .from("cfdi_documents")
      .select("id, company_id, status, type")
      .eq("id", params.id)
      .maybeSingle();
    if (!cfdiBase) return NextResponse.json({ error: "CFDI no encontrado" }, { status: 404 });
    if (cfdiBase.status !== "draft") {
      return NextResponse.json({ error: "Solo se pueden timbrar borradores" }, { status: 400 });
    }

    // 3) Permisos
    const access = await checkCompanyAccess(userId, cfdiBase.company_id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    // 4) Cargar todo de BD
    const loaded = await loadCartaPorteForStamping(params.id);

    // 5) Validaciones mínimas pre-timbrado
    if (!loaded.cfdi.receiver_rfc || !loaded.cfdi.receiver_name) {
      return NextResponse.json(
        { error: "El CFDI debe tener cliente con RFC y nombre" },
        { status: 400 }
      );
    }
    if (!loaded.cfdi.receiver_cfdi_use) {
      return NextResponse.json({ error: "Falta el uso de CFDI" }, { status: 400 });
    }
    if (cfdiBase.type === "I" && (!loaded.concepts || loaded.concepts.length === 0)) {
      return NextResponse.json({ error: "Factura sin conceptos" }, { status: 400 });
    }
    if (loaded.ubicaciones.length === 0 || loaded.mercancias.length === 0 || loaded.figuras.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos de Carta Porte (ubicaciones, mercancías o figuras)" },
        { status: 400 }
      );
    }

    // 6) Settings y folio
    const cfdiType    = cfdiBase.type as "I" | "T";
    const folioConfig = FOLIO_MAP[cfdiType];
    const settings    = await getCompanySettings(cfdiBase.company_id);
    if (!settings) {
      return NextResponse.json(
        { error: "Configura primero los datos fiscales de la empresa" },
        { status: 400 }
      );
    }
    const serie = (settings as any)[folioConfig.s] ?? folioConfig.def_s;
    const folio = (settings as any)[folioConfig.f] ?? 1;

    // 7) Payload Facturapi
    const payload = buildFacturapiPayload({
      parentType:  cfdiType,
      cfdi:        loaded.cfdi,
      concepts:    loaded.concepts,
      cartaPorte:  loaded.cartaPorte,
      ubicaciones: loaded.ubicaciones,
      mercancias:  loaded.mercancias,
      figuras:     loaded.figuras,
      serie,
      folio,
    });

    // 8) Llamar a Facturapi
    const apiKey = await getApiKeyForCompany(cfdiBase.company_id);
    const orgIdSettings = settings.facturapi_org_id;
    const effectiveOrgId = (getUserKey() && orgIdSettings) ? orgIdSettings : null;

    const invoice = await facturapi(apiKey, "/invoices", "POST", payload, effectiveOrgId);

    // 9) Actualizar CFDI con datos del SAT
    const { error: upErr } = await supabaseAdmin
      .from("cfdi_documents")
      .update({
        facturapi_id:         invoice.id,
        uuid:                 invoice.uuid,
        serie:                invoice.series ?? serie,
        folio:                String(invoice.folio_number ?? folio),
        status:               invoice.status === "valid" ? "valid" : "draft",
        cfdi_date:            invoice.date,
        issuer_rfc:           invoice.issuer?.tax_id     ?? settings.fiscal_rfc,
        issuer_name:          invoice.issuer?.legal_name ?? settings.fiscal_name,
        issuer_fiscal_regime: invoice.issuer?.tax_system ?? settings.fiscal_regime,
        stamp_data:           invoice.stamp ?? null,
        updated_at:           new Date().toISOString(),
      })
      .eq("id", params.id);

    if (upErr) {
      console.error("[timbrar carta-porte] update cfdi error:", upErr);
      return NextResponse.json(
        { error: `El CFDI se timbró en Facturapi (${invoice.id}) pero hubo error al actualizar BD: ${upErr.message}` },
        { status: 500 }
      );
    }

    // 10) Guardar IdCCP que asignó el SAT
    if (invoice.complements?.length) {
      const ccpComplement = invoice.complements.find((c: any) => c.type === "carta_porte");
      if (ccpComplement?.data?.id_ccp) {
        await supabaseAdmin
          .from("cfdi_carta_porte")
          .update({ id_ccp: ccpComplement.data.id_ccp })
          .eq("cfdi_id", params.id);
      }
    }

    // 11) Incrementar folio
    await supabaseAdmin
      .from("company_settings")
      .update({ [folioConfig.f]: folio + 1 })
      .eq("company_id", cfdiBase.company_id);

    return NextResponse.json({
      success: true,
      cfdi:    { ...loaded.cfdi, ...invoice },
      invoice,
    });
  } catch (err: any) {
    console.error("[timbrar carta-porte] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}
