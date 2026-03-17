export type CommandIntent =
  | "create_prospect"
  | "list_prospects"
  | "hub_summary"
  | "unknown";

export type InterpretedCommand = {
  intent: CommandIntent;
  raw: string;
  entity?: string;
  payload?: Record<string, any>;
};

export function interpretCommand(rawInput: string): InterpretedCommand {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  if (
    lower.startsWith("crear prospecto ") ||
    lower.startsWith("nuevo prospecto ")
  ) {
    const name = input
      .replace(/^crear prospecto\s+/i, "")
      .replace(/^nuevo prospecto\s+/i, "")
      .trim();

    return {
      intent: "create_prospect",
      raw: input,
      entity: "prospect",
      payload: { name },
    };
  }

  if (
    lower === "ver prospectos" ||
    lower === "listar prospectos" ||
    lower === "prospectos"
  ) {
    return {
      intent: "list_prospects",
      raw: input,
      entity: "prospect",
    };
  }

  if (
    lower === "resumen" ||
    lower === "command hub" ||
    lower === "hub" ||
    lower === "dashboard" ||
    lower === "estado general"
  ) {
    return {
      intent: "hub_summary",
      raw: input,
    };
  }

  return {
    intent: "unknown",
    raw: input,
  };
}
