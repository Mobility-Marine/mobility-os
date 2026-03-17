export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function toNumber(value: unknown) {
  return Number(value || 0);
}

function safeArray<T>(value: T[] | null) {
  return value ?? [];
}

export async function GET(req: Request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Supabase env variables missing" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
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
          .select(
            "id, name, status, is_active, estimated_value, next_follow_up, assigned_to, created_at"
          )
          .eq("company_id", companyId),

        supabase
          .from("quotations")
          .select("id, status, total, created_at")
          .eq("company_id", companyId),

        supabase
          .from("shipments")
          .select("id, status, created_at")
          .eq("company_id", companyId),

        supabase
          .from("invoices")
          .select("id, status, total, created_at")
          .eq("company_id", companyId),
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
          error: "Error loading company state",
          details: errors.map((e) => e?.message),
        },
        { status: 500 }
      );
    }

    const prospects = safeArray(prospectsRes.data);
    const quotations = safeArray(quotationsRes.data);
    const shipments = safeArray(shipmentsRes.data);
    const invoices = safeArray(invoicesRes.data);

    const activeProspects = prospects.filter((p) => p.is_active);
    const pipelineValue = activeProspects.reduce(
      (sum, p) => sum + toNumber(p.estimated_value),
      0
    );

    const openQuotations = quotations.filter(
      (q) => !["closed", "cancelled"].includes(String(q.status || "").toLowerCase())
    );

    const activeShipments = shipments.filter(
      (s) =>
        !["delivered", "cancelled"].includes(String(s.status || "").toLowerCase())
    );

    const pendingInvoices = invoices.filter(
      (i) => !["paid", "cancelled"].includes(String(i.status || "").toLowerCase())
    );

    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const followUpsThisWeek = activeProspects.filter((p) => {
      if (!p.next_follow_up) return false;
      const date = new Date(p.next_follow_up);
      return date >= today && date <= next7Days;
    });

    const overdueFollowUps = activeProspects.filter((p) => {
      if (!p.next_follow_up) return false;
      const date = new Date(p.next_follow_up);
      return date < today;
    });

    const risks: string[] = [];

    if (pipelineValue <= 0) {
      risks.push("No hay valor activo en el pipeline comercial.");
    }

    if (overdueFollowUps.length > 0) {
      risks.push(
        `Hay ${overdueFollowUps.length} prospecto(s) con seguimiento vencido.`
      );
    }

    if (pendingInvoices.length > 0) {
      risks.push(
        `Existen ${pendingInvoices.length} factura(s) pendientes de cobro.`
      );
    }

    if (activeShipments.length > 10) {
      risks.push(
        `La operación tiene ${activeShipments.length} embarques activos; revisar capacidad operativa.`
      );
    }

    const insights: string[] = [];

    if (activeProspects.length > 0) {
      insights.push(
        `Hay ${activeProspects.length} prospectos activos con un pipeline estimado de $${pipelineValue.toLocaleString(
          "es-MX"
        )}.`
      );
    }

    if (followUpsThisWeek.length > 0) {
      insights.push(
        `Hay ${followUpsThisWeek.length} seguimiento(s) programados en los próximos 7 días.`
      );
    }

    if (openQuotations.length > 0) {
      insights.push(
        `Existen ${openQuotations.length} cotización(es) abiertas en proceso comercial.`
      );
    }

    if (activeShipments.length > 0) {
      insights.push(
        `La empresa tiene ${activeShipments.length} embarque(s) activos actualmente.`
      );
    }

    const executiveSummary =
      risks.length > 0
        ? `La empresa presenta ${risks.length} señal(es) de atención prioritaria.`
        : "La operación general luce estable y sin alertas críticas inmediatas.";

    return NextResponse.json({
      company_id: companyId,
      generated_at: new Date().toISOString(),

      executive_summary: executiveSummary,

      metrics: {
        total_prospects: prospects.length,
        active_prospects: activeProspects.length,
        pipeline_value: pipelineValue,
        open_quotations: openQuotations.length,
        active_shipments: activeShipments.length,
        pending_invoices: pendingInvoices.length,
        follow_ups_next_7_days: followUpsThisWeek.length,
        overdue_follow_ups: overdueFollowUps.length,
      },

      risks,
      insights,

      modules: {
        commercial: {
          total_prospects: prospects.length,
          active_prospects: activeProspects.length,
          pipeline_value: pipelineValue,
          open_quotations: openQuotations.length,
          follow_ups_next_7_days: followUpsThisWeek.length,
          overdue_follow_ups: overdueFollowUps.length,
        },
        logistics: {
          active_shipments: activeShipments.length,
        },
        finance: {
          pending_invoices: pendingInvoices.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Unexpected error loading company state",
      },
      { status: 500 }
    );
  }
}
