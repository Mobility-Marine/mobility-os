// ═════════════════════════════════════════════════════════════════════
// POST /api/facturacion/proformas
// Crea una proforma (CFDI editable sin timbrar)
//
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

type CreateProformaPayload = {
  company_id: string;
  receiver_rfc?: string | null;
  receiver_name?: string | null;
  receiver_email?: string | null;
  receiver_fiscal_regime?: string | null;
  receiver_cfdi_use?: string | null;
  receiver_zip?: string | null;
  type?: string;
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
  concepts: ConceptInput[];
};

export async function POST(req: Request) {
  try {
    // ─── 1. Autenticar usuario vía Supabase ───
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData.user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    const userId = userData.user.id;

    // ─── 2. Parsear payload ───
    const payload = (await req.json()) as CreateProformaPayload;

    if (!payload.company_id) {
      return NextResponse.json({ error: "company_id es obligatorio" }, { status: 400 });
    }

    if (!Array.isArray(payload.concepts) || payload.concepts.length === 0) {
      return NextResponse.json({ error: "Debe incluir al menos un concepto" }, { status: 400 });
    }

    // ─── 3. Validar permisos del usuario ───
    const { data: membership, error: memErr } = await supabase
      .from("company_users")
      .select("role, is_active")
      .eq("user_id", userId)
      .eq("company_id", payload.company_id)
      .eq("is_active", true)
      .maybeSingle();

    if (memErr || !membership) {
      return NextResponse.json({ error: "No perteneces a esta empresa" }, { status: 403 });
    }

    if (!ALLOWED_ROLES.includes(membership.role)) {
      return NextResponse.json({ error: "No tienes permiso para crear proformas" }, { status: 403 });
    }

    // ════════════════════════════════════════════════════════════════
    // Obtener datos fiscales del emisor desde company_settings
    // ════════════════════════════════════════════════════════════════
    // Los datos fiscales (RFC, régimen, razón social) son administrados
    // desde Settings → Empresa → Identidad fiscal y se guardan en
    // company_settings, NO en companies. Esta es la fuente de verdad.
    // La tabla companies solo guarda metadatos generales (name, owner).
    // ════════════════════════════════════════════════════════════════
    const [companyRes, settingsRes] = await Promise.all([
      supabase.from("companies").select("id, name").eq("id", payload.company_id).maybeSingle(),
      supabase.from("company_settings").select("fiscal_rfc, fiscal_name, fiscal_regime, fiscal_zip, invoice_series, egreso_series, pago_series, traslado_series, nomina_series").eq("company_id", payload.company_id).maybeSingle(),
    ]);

    if (companyRes.error || !companyRes.data) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }
    if (!settingsRes.data?.fiscal_rfc) {
      return NextResponse.json({
        error: "Datos fiscales del emisor incompletos. Configúralos en Settings → Empresa → Identidad fiscal."
      }, { status: 400 });
    }

    const company = {
      id:             companyRes.data.id,
      name:           settingsRes.data.fiscal_name ?? companyRes.data.name,
      rfc:            settingsRes.data.fiscal_rfc,
      fiscal_regime:  settingsRes.data.fiscal_regime,
    };

    // ════════════════════════════════════════════════════════════════
    // Resolver la SERIE CFDI según el tipo de comprobante
    // ════════════════════════════════════════════════════════════════
    // Cada tipo de CFDI tiene su propia serie configurable en
    // Settings → Fiscal y CFDI → Series CFDI:
    //   - I (Ingreso/Factura)   → invoice_series  (default "F")
    //   - E (Egreso/Nota crédito) → egreso_series   (default "E")
    //   - P (Pago/REP)          → pago_series     (default "P")
    //   - T (Traslado)          → traslado_series (default "T")
    //   - N (Nómina)            → nomina_series   (default "N")
    //
    // El folio NO se asigna aquí — se asigna al timbrar la proforma
    // (consume invoice_next_folio incrementando el contador).
    // ════════════════════════════════════════════════════════════════
    const cfdiType = payload.type ?? "I";
    const seriesByType: Record<string, string | null | undefined> = {
      I: settingsRes.data.invoice_series,
      E: settingsRes.data.egreso_series,
      P: settingsRes.data.pago_series,
      T: settingsRes.data.traslado_series,
      N: settingsRes.data.nomina_series,
    };
    const resolvedSerie = seriesByType[cfdiType] ?? "A";

    // Insertar la proforma en cfdi_documents
    const { data: cfdi, error: cfdiErr } = await supabase
      .from("cfdi_documents")
      .insert({
        company_id: payload.company_id,
        type: cfdiType,
        status: "proforma",
        serie: resolvedSerie,
        issuer_rfc: company.rfc ?? null,
        issuer_name: company.name ?? null,
        issuer_fiscal_regime: company.fiscal_regime ?? null,
        receiver_rfc: payload.receiver_rfc ?? null,
        receiver_name: payload.receiver_name ?? null,
        receiver_email: payload.receiver_email ?? null,
        receiver_fiscal_regime: payload.receiver_fiscal_regime ?? null,
        receiver_cfdi_use: payload.receiver_cfdi_use ?? "G03",
        receiver_zip: payload.receiver_zip ?? null,
        currency: payload.currency ?? "MXN",
        exchange_rate: payload.exchange_rate ?? 1,
        payment_method: payload.payment_method ?? "PUE",
        payment_form: payload.payment_form ?? "03",
        subtotal: payload.subtotal ?? 0,
        discount: payload.discount ?? 0,
        tax_amount: payload.tax_amount ?? 0,
        retention_amount: payload.retention_amount ?? 0,
        total: payload.total ?? 0,
        notes: payload.notes ?? null,
        related_client_id: payload.related_client_id ?? null,
        related_quotation_id: payload.related_quotation_id ?? null,
        related_po_id: payload.related_po_id ?? null,
        created_by: userId,
      })
      .select()
      .single();

    if (cfdiErr || !cfdi) {
      console.error("[proformas] insert cfdi error:", cfdiErr);
      return NextResponse.json({ error: cfdiErr?.message ?? "Error guardando proforma" }, { status: 500 });
    }

    // ─── 6. Insertar conceptos ───
    const conceptsRows = payload.concepts.map((c) => ({
      cfdi_id: cfdi.id,
      company_id: payload.company_id,
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

    const { error: conceptsErr } = await supabase
      .from("cfdi_concepts")
      .insert(conceptsRows);

    if (conceptsErr) {
      // Rollback: eliminar el cfdi que ya creamos
      await supabase.from("cfdi_documents").delete().eq("id", cfdi.id);
      console.error("[proformas] insert concepts error:", conceptsErr);
      return NextResponse.json({ error: conceptsErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, proforma: cfdi });
  } catch (err: any) {
    console.error("[proformas] catch:", err);
    return NextResponse.json({ error: err.message ?? "Error inesperado" }, { status: 500 });
  }
}
