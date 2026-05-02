// ═══════════════════════════════════════════════════════════════════════
// PATCH /api/facturacion/carta-porte/:id  → actualizar borrador
// DELETE /api/facturacion/carta-porte/:id → eliminar borrador
// 
// Solo aplica a CFDIs en status='draft'. Los timbrados deben cancelarse.
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { authenticateRequest, checkCompanyAccess, supabaseAdmin } from "../_lib/shared";
import { updateCartaPorteDraft, deleteCartaPorteDraft } from "../_lib/db_helpers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { data: cfdi } = await supabaseAdmin
      .from("cfdi_documents")
      .select("id, company_id, status")
      .eq("id", params.id)
      .maybeSingle();
    if (!cfdi) return NextResponse.json({ error: "CFDI no encontrado" }, { status: 404 });
    if (cfdi.status !== "draft") {
      return NextResponse.json(
        { error: "Solo se pueden editar borradores. Este CFDI ya fue timbrado." },
        { status: 400 }
      );
    }

    const access = await checkCompanyAccess(userId, cfdi.company_id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json();
    const { data } = body;
    if (!data) return NextResponse.json({ error: "Falta el campo 'data'" }, { status: 400 });

    await updateCartaPorteDraft(params.id, data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PATCH /api/facturacion/carta-porte/:id] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { data: cfdi } = await supabaseAdmin
      .from("cfdi_documents")
      .select("id, company_id, status")
      .eq("id", params.id)
      .maybeSingle();
    if (!cfdi) return NextResponse.json({ error: "CFDI no encontrado" }, { status: 404 });
    if (cfdi.status !== "draft") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar borradores. Los CFDIs timbrados deben cancelarse." },
        { status: 400 }
      );
    }

    const access = await checkCompanyAccess(userId, cfdi.company_id);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    await deleteCartaPorteDraft(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/facturacion/carta-porte/:id] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}
