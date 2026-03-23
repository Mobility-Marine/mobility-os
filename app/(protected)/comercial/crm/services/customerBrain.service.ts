"use client";

// ============================================================
// 🧠 CUSTOMER BRAIN — IA EMPRESARIAL GLOBAL
// Analiza TODA la relación con el cliente
// ============================================================

type BrainInput = {
  client: any | null;

  accounts: any[];
  contacts: any[];
  activities: any[];
  opportunities: any[];
  quotations: any[];
  shipments: any[];
  invoices: any[];
  timeline: any[];
};

export type CustomerBrainOutput = {
  healthScore: number;

  valueTier: "LOW" | "MEDIUM" | "HIGH" | "STRATEGIC";

  relationshipStatus: "COLD" | "WARM" | "STRONG";

  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  commercialState:
    | "NO_PIPELINE"
    | "PIPELINE_ACTIVE"
    | "QUOTE_SENT"
    | "CUSTOMER_ACTIVE";

  nextBestAction: string;

  executiveSummary: string;
};

// ============================================================
// 🧮 MAIN BRAIN FUNCTION
// ============================================================

export function analyzeCustomerBrain(
  data: BrainInput
): CustomerBrainOutput {

  const {
    contacts,
    activities,
    opportunities,
    quotations,
    shipments,
    invoices,
    timeline,
  } = data;

  let score = 0;

  // ============================================================
  // 👥 RELACIÓN
  // ============================================================

  if (contacts.length >= 1) score += 10;
  if (contacts.length >= 3) score += 8;
  if (contacts.length >= 5) score += 6;

  // ============================================================
  // 📝 ACTIVIDAD
  // ============================================================

  if (activities.length >= 1) score += 8;
  if (activities.length >= 5) score += 8;
  if (activities.length >= 10) score += 6;

  const futureActivities =
    activities.filter(a => a.scheduled_at && !a.completed).length;

  if (futureActivities > 0) score += 8;

  // ============================================================
  // 💼 PIPELINE
  // ============================================================

  if (opportunities.length >= 1) score += 12;

  // ============================================================
  // 💰 COTIZACIONES
  // ============================================================

  if (quotations.length >= 1) score += 10;

  // ============================================================
  // 🚚 OPERACIONES
  // ============================================================

  if (shipments.length >= 1) score += 12;

  // ============================================================
  // 🧾 FACTURACIÓN
  // ============================================================

  const totalBilling =
    invoices.reduce((s, i) => s + (i.amount || 0), 0);

  if (totalBilling > 0) score += 10;
  if (totalBilling > 100_000) score += 10;
  if (totalBilling > 1_000_000) score += 12;

  // ============================================================
  // 🕓 HISTORIAL GLOBAL
  // ============================================================

  if (timeline.length >= 5) score += 6;
  if (timeline.length >= 15) score += 6;

  const healthScore = Math.min(score, 100);

  // ============================================================
  // 💎 VALUE TIER
  // ============================================================

  let valueTier: CustomerBrainOutput["valueTier"] = "LOW";

  if (totalBilling > 5_000_000) valueTier = "STRATEGIC";
  else if (totalBilling > 1_000_000) valueTier = "HIGH";
  else if (totalBilling > 100_000) valueTier = "MEDIUM";

  // ============================================================
  // 🔗 RELATIONSHIP STATUS
  // ============================================================

  let relationshipStatus: CustomerBrainOutput["relationshipStatus"] = "COLD";

  if (contacts.length >= 3 && activities.length >= 3)
    relationshipStatus = "STRONG";
  else if (contacts.length >= 1)
    relationshipStatus = "WARM";

  // ============================================================
  // ⚠️ RISK LEVEL
  // ============================================================

  let riskLevel: CustomerBrainOutput["riskLevel"] = "LOW";

  if (healthScore < 30) riskLevel = "CRITICAL";
  else if (healthScore < 50) riskLevel = "HIGH";
  else if (healthScore < 70) riskLevel = "MEDIUM";

  // ============================================================
  // 🧭 COMMERCIAL STATE
  // ============================================================

  let commercialState: CustomerBrainOutput["commercialState"] =
    "NO_PIPELINE";

  if (opportunities.length > 0)
    commercialState = "PIPELINE_ACTIVE";

  if (quotations.length > 0)
    commercialState = "QUOTE_SENT";

  if (shipments.length > 0)
    commercialState = "CUSTOMER_ACTIVE";

  // ============================================================
  // ⚡ NEXT BEST ACTION
  // ============================================================

  let nextBestAction = "Monitorear cliente";

  if (riskLevel === "CRITICAL")
    nextBestAction = "Contactar inmediatamente";

  else if (relationshipStatus === "COLD")
    nextBestAction = "Construir relación";

  else if (commercialState === "NO_PIPELINE")
    nextBestAction = "Detectar oportunidades";

  else if (commercialState === "QUOTE_SENT")
    nextBestAction = "Dar seguimiento a propuesta";

  else if (commercialState === "CUSTOMER_ACTIVE")
    nextBestAction = "Buscar upsell o recompra";

  // ============================================================
  // 📊 EXECUTIVE SUMMARY
  // ============================================================

  const executiveSummary =
    valueTier === "STRATEGIC"
      ? "Cliente estratégico de alto valor."
      : riskLevel === "CRITICAL"
      ? "Relación en riesgo crítico."
      : relationshipStatus === "STRONG"
      ? "Relación sólida con potencial."
      : "Cliente con desarrollo pendiente.";

  return {
    healthScore,
    valueTier,
    relationshipStatus,
    riskLevel,
    commercialState,
    nextBestAction,
    executiveSummary,
  };
}
