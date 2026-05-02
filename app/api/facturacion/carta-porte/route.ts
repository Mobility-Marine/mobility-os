// ═══════════════════════════════════════════════════════════════════════
// POST /api/facturacion/carta-porte
// 
// Crea un borrador de Factura/Traslado con Carta Porte.
// El CFDI se guarda con status='draft' y NO se timbra al SAT todavía.
// 
// Body:
//   { company_id, parent_type, data }
// 
// parent_type: "factura_carta_porte" | "traslado_carta_porte"
// data: CFDIConCartaPorteData
// 
// Respuesta: { success, cfdi_id, carta_porte_id }
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { authenticateRequest, checkCompanyAccess } from "./_lib/shared";
import { createCartaPorteDraft } from "./_lib/db_helpers";

export async function POST(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await req.json();
    const { company_id, parent_type, data } = body;

    if (!company_id || !parent_type || !data) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: company_id, parent_type, data" },
        { status: 400 }
      );
    }

    if (!["factura_carta_porte", "traslado_carta_porte"].includes(parent_type)) {
      return NextResponse.json(
        { error: "parent_type debe ser 'factura_carta_porte' o 'traslado_carta_porte'" },
        { status: 400 }
      );
    }

    const access = await checkCompanyAccess(userId, company_id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const cfdiType: "I" | "T" = parent_type === "factura_carta_porte" ? "I" : "T";
    const result = await createCartaPorteDraft(company_id, userId, cfdiType, data);

    return NextResponse.json({
      success:        true,
      cfdi_id:        result.cfdiId,
      carta_porte_id: result.cartaPorteId,
    });
  } catch (err: any) {
    console.error("[POST /api/facturacion/carta-porte] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}
