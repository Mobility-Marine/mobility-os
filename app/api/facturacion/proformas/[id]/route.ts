// ═════════════════════════════════════════════════════════════════════
// PATCH  /api/facturacion/proformas/:id  → actualizar proforma
// DELETE /api/facturacion/proformas/:id  → eliminar proforma
//
// Solo aplica a CFDIs con status='proforma'.
// Roles permitidos: owner, admin, manager, finanzas
// ═════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "admin", "manager", "finanzas"];

type ConceptInput = {
  product_key: string;
  unit_key: string;
  description: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  retention_rate?: number;
  retention_amount?: number;
  total: number;
  product_id?: string | null;
};

type UpdateProformaPayload = {
  receiver_rfc?: string | null;
  receiver_name?: string | null;
  receiver_email?: string | null;
  receiver_fiscal_regime?: string | null;
  receiver_cfdi_use?: string | null;
  receiver_zip?: string | null;
  currency?: string;
  exchange_rate?: number;
  payment_method?: string;
  payment_form?: string;
  subtotal?: number;
  discount?: number;
  tax_amount?: number;
  retention_amount?: number;
  total?: number;
  notes?: string | null;
  related_client_id?: string | null;
  related_quotation_id?: string | null;
  related_po_id?: string | null;
  concepts?: ConceptInput[];
};

// ─── helper compartido para autenticar y validar permisos ───
async function authenticate(req: Request, proformaId: string) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "No autorizado", status: 401 } as const;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData.user) return { error: "Sesión inválida", status: 401 } as const;

  // Cargar la proforma
  const { data: proforma, error: pErr } = await supabase
    .from("cfdi_documents")
    .select("id, company_id, status")
    .eq("id", proformaId)
    .maybeSingle();

  if (pErr || !proforma) return { error: "Proforma no encontrada", status: 404 } as const;
  if (proforma.status !== "proforma") {
    return { error: "Solo se pueden modificar proformas no timbradas", status: 400 } as const;
  }

  // Validar permisos
  const { data: membership } = await supabase
    .from("company_users")
    .select("role, is_active")
    .eq("user_id", userData.user.id)
    .eq("company_id", proforma.company_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership) return { error: "No perteneces a esta empresa", status: 403 } as const;
  if (!ALLOWED_ROLES.includes(membership.role)) {
    return { error: "No tienes permiso para modificar proformas", status: 403 } as const;
  }

  return { supabase, proforma, userId: userData.user.id } as const;
}

// ═══════════ PATCH: actualizar proforma ═══════════
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req, params.id);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, proforma } = auth;

    const payload = (await req.json()) as UpdateProformaPayload;

    // Construir el objeto de actualización (solo campos enviados)
    const updateData: any = { updated_at: new Date().toISOString() };
    const fieldsAllowed: (keyof UpdateProformaPayload)[] = [
      "receiver_rfc", "receiver_name", "receiver_email",
      "receiver_fiscal_regime", "receiver_cfdi_use", "receiver_zip",
      "currency", "exchange_rate", "payment_method", "payment_form",
      "subtotal", "discount", "tax_amount", "retention_amount", "total",
      "notes", "related_client_id", "related_quotation_id", "related_po_id",
    ];
    for (const f of fieldsAllowed) {
      if (payload[f] !== undefined) updateData[f] = payload[f];
    }

    // Actualizar el documento
    const { error: updErr } = await supabase
      .from("cfdi_documents")
      .update(updateData)
      .eq("id", proforma.id);

    if (updErr) {
      console.error("[proformas PATCH] update cfdi error:", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Si vienen conceptos, reemplazarlos completos (más simple que diff)
    if (Array.isArray(payload.concepts)) {
      const { error: delErr } = await supabase
        .from("cfdi_concepts")
        .delete()
        .eq("cfdi_id", proforma.id);
      if (delErr) {
        console.error("[proformas PATCH] delete concepts error:", delErr);
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      if (payload.concepts.length > 0) {
        const rows = payload.concepts.map((c) => ({
          cfdi_id: proforma.id,
          company_id: proforma.company_id,
          product_key: c.product_key,
          unit_key: c.unit_key,
          description: c.description,
          unit: c.unit ?? null,
          quantity: c.quantity,
          unit_price: c.unit_price,
          discount: c.discount ?? 0,
          subtotal: c.subtotal,
          tax_rate: c.tax_rate ?? 0,
          tax_amount: c.tax_amount ?? 0,
          retention_rate: c.retention_rate ?? 0,
          retention_amount: c.retention_amount ?? 0,
          total: c.total,
          product_id: c.product_id ?? null,
        }));

        const { error: insErr } = await supabase.from("cfdi_concepts").insert(rows);
        if (insErr) {
          console.error("[proformas PATCH] insert concepts error:", insErr);
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[proformas PATCH] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}

// ═══════════ DELETE: eliminar proforma ═══════════
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req, params.id);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, proforma } = auth;

    // Borrar conceptos primero (FK)
    const { error: cErr } = await supabase
      .from("cfdi_concepts")
      .delete()
      .eq("cfdi_id", proforma.id);

    if (cErr) {
      console.error("[proformas DELETE] delete concepts error:", cErr);
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }

    // Borrar el documento
    const { error: dErr } = await supabase
      .from("cfdi_documents")
      .delete()
      .eq("id", proforma.id);

    if (dErr) {
      console.error("[proformas DELETE] delete cfdi error:", dErr);
      return NextResponse.json({ error: dErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[proformas DELETE] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}
