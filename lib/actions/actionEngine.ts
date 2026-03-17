// /lib/actions/actionEngine.ts

import { supabase } from "@/lib/supabaseClient";

export type ActionResult = {
  success: boolean;
  message?: string;
  data?: any;
};

type CommandContext = {
  userId: string;
  companyId: string;
};

export async function executeCommand(
  rawCommand: string,
  context: CommandContext
): Promise<ActionResult> {
  const command = rawCommand.trim().toLowerCase();

  // =============================
  // CREAR PROSPECTO
  // =============================
  if (command.startsWith("crear prospecto")) {
    const name = rawCommand.replace(/crear prospecto/i, "").trim();

    if (!name) {
      return { success: false, message: "Falta el nombre del prospecto" };
    }

    const { error } = await supabase.from("prospects").insert({
      name,
      company_id: context.companyId,
      created_by: context.userId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Prospecto "${name}" creado`,
    };
  }

  // =============================
  // CONSULTAR PROSPECTOS
  // =============================
  if (command.includes("ver prospectos")) {
    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .eq("company_id", context.companyId)
      .limit(10);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      data,
      message: "Lista de prospectos",
    };
  }

  // =============================
  // COMANDO DESCONOCIDO
  // =============================
  return {
    success: false,
    message: "Comando no reconocido",
  };
}
