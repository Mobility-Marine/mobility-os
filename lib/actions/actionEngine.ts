import { supabase } from "@/lib/supabaseClient";
import {
  interpretCommand,
  type InterpretedCommand,
} from "@/lib/ai/commandInterpreter";

export type ActionResult = {
  success: boolean;
  message?: string;
  data?: any;
  intent?: string;
};

type CommandContext = {
  userId: string;
  companyId: string;
};

async function executeCreateProspect(
  command: InterpretedCommand,
  context: CommandContext
): Promise<ActionResult> {
  const name = command.payload?.name?.trim();

  if (!name) {
    return {
      success: false,
      message: "Falta el nombre del prospecto",
      intent: command.intent,
    };
  }

  const { data, error } = await supabase
    .from("prospects")
    .insert({
      name,
      company_id: context.companyId,
      created_by: context.userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
      intent: command.intent,
    };
  }

  return {
    success: true,
    message: `Prospecto "${name}" creado correctamente`,
    data,
    intent: command.intent,
  };
}

async function executeListProspects(
  context: CommandContext
): Promise<ActionResult> {
  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, company_name, status, estimated_value, is_active")
    .eq("company_id", context.companyId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return {
      success: false,
      message: error.message,
      intent: "list_prospects",
    };
  }

  return {
    success: true,
    message: "Prospectos cargados",
    data,
    intent: "list_prospects",
  };
}

async function executeHubSummary(
  context: CommandContext
): Promise<ActionResult> {
  const [prospectsRes, quotationsRes, shipmentsRes, invoicesRes] =
    await Promise.all([
      supabase
        .from("prospects")
        .select("id, is_active, estimated_value")
        .eq("company_id", context.companyId),

      supabase
        .from("quotations")
        .select("id, status, total")
        .eq("company_id", context.companyId),

      supabase
        .from("shipments")
        .select("id, status")
        .eq("company_id", context.companyId),

      supabase
        .from("invoices")
        .select("id, status, total")
        .eq("company_id", context.companyId),
    ]);

  const errors = [
    prospectsRes.error,
    quotationsRes.error,
    shipmentsRes.error,
    invoicesRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    return {
      success: false,
      message: errors.map((e) => e?.message).join(" | "),
      intent: "hub_summary",
    };
  }

  const prospects = prospectsRes.data ?? [];
  const quotations = quotationsRes.data ?? [];
  const shipments = shipmentsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];

  return {
    success: true,
    intent: "hub_summary",
    message: "Resumen operativo listo",
    data: {
      total_prospects: prospects.length,
      active_prospects: prospects.filter((p) => p.is_active).length,
      pipeline_value: prospects.reduce(
        (sum, p) => sum + Number(p.estimated_value || 0),
        0
      ),
      open_quotations: quotations.filter(
        (q) => q.status !== "closed" && q.status !== "cancelled"
      ).length,
      active_shipments: shipments.filter(
        (s) => s.status !== "delivered" && s.status !== "cancelled"
      ).length,
      pending_invoices: invoices.filter(
        (i) => i.status !== "paid" && i.status !== "cancelled"
      ).length,
    },
  };
}

export async function executeCommand(
  rawCommand: string,
  context: CommandContext
): Promise<ActionResult> {
  const command = interpretCommand(rawCommand);

  switch (command.intent) {
    case "create_prospect":
      return executeCreateProspect(command, context);

    case "list_prospects":
      return executeListProspects(context);

    case "hub_summary":
      return executeHubSummary(context);

    default:
      return {
        success: false,
        message: "Comando no reconocido",
        intent: "unknown",
      };
  }
}
