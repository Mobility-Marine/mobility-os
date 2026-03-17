export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase env variables missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [prospectsRes, quotationsRes, shipmentsRes, invoicesRes] =
    await Promise.all([
      supabase
        .from("prospects")
        .select("id, is_active, estimated_value")
        .limit(500),

      supabase
        .from("quotations")
        .select("id, status, total")
        .limit(500),

      supabase
        .from("shipments")
        .select("id, status")
        .limit(500),

      supabase
        .from("invoices")
        .select("id, status, total")
        .limit(500),
    ]);

  const errors = [
    prospectsRes.error,
    quotationsRes.error,
    shipmentsRes.error,
    invoicesRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "Error loading command hub data",
        details: errors.map((e) => e?.message),
      },
      { status: 500 }
    );
  }

  const prospects = prospectsRes.data ?? [];
  const quotations = quotationsRes.data ?? [];
  const shipments = shipmentsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];

  const totalProspects = prospects.length;
  const activeProspects = prospects.filter((p) => p.is_active).length;
  const pipelineValue = prospects.reduce(
    (sum, p) => sum + Number(p.estimated_value || 0),
    0
  );

  const openQuotations = quotations.filter(
    (q) => q.status !== "closed" && q.status !== "cancelled"
  ).length;

  const activeShipments = shipments.filter(
    (s) => s.status !== "delivered" && s.status !== "cancelled"
  ).length;

  const pendingInvoices = invoices.filter(
    (i) => i.status !== "paid" && i.status !== "cancelled"
  ).length;

  return NextResponse.json({
    commercial: {
      total_prospects: totalProspects,
      active_prospects: activeProspects,
      pipeline_value: pipelineValue,
      open_quotations: openQuotations,
    },
    logistics: {
      active_shipments: activeShipments,
    },
    finance: {
      pending_invoices: pendingInvoices,
    },
    meta: {
      generated_at: new Date().toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase env variables missing" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    received: body,
    message: "Command Hub POST endpoint ready",
  });
}
