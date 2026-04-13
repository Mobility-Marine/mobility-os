// ============================================================
// CUSTOMER BRAIN v2 — GOD LEVEL
// 10 dimensiones · Todos los módulos de Mobility OS
// Sin "use client"
// ============================================================

type CreditStatus = {
  credit_limit?: number | null;
  payment_terms?: string | null;
  payment_form?: string | null;
} | null;

type BrainInput = {
  client:             any | null;
  accounts:           any[];
  contacts:           any[];
  activities:         any[];
  documents:          { crmDocs: any[]; clientDocs: any[] };
  opportunities:      any[];
  quotations:         any[];
  shipments:          any[];
  serviceOrders:      any[];
  invoices:           any[];
  accountsReceivable: any[];
  creditStatus:       CreditStatus;
  purchaseOrders:     any[];
  timeline:           any[];
};

export type CustomerBrainOutput = {
  healthScore:        number;
  valueTier:          "LOW" | "MEDIUM" | "HIGH" | "STRATEGIC";
  relationshipStatus: "COLD" | "WARM" | "STRONG";
  riskLevel:          "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  commercialState:    "NO_PIPELINE" | "PIPELINE_ACTIVE" | "QUOTE_SENT" | "CUSTOMER_ACTIVE";
  // Dimensiones financieras
  totalBilled:        number;
  totalPending:       number;   // CxC pendiente
  overdueAmount:      number;   // CxC vencida
  maxDaysOverdue:     number;
  creditUsage:        number;   // % del límite de crédito usado
  // Dimensiones operativas
  totalShipments:     number;
  activeOrders:       number;
  // Inteligencia
  nextBestAction:     string;
  executiveSummary:   string;
  dimensionScores: {
    identity:     number;  // Perfil completo
    relationship: number;  // Contactos y calidad de relación
    activity:     number;  // Actividades y seguimiento
    pipeline:     number;  // Oportunidades y cotizaciones
    operations:   number;  // Logística y servicios
    finance:      number;  // Facturación e ingresos
    collections:  number;  // CxC, pagos, morosidad
    compliance:   number;  // Documentos legales y contratos
    procurement:  number;  // Compras (si es proveedor)
    history:      number;  // Timeline y antigüedad
  };
};

// ── MAIN BRAIN ────────────────────────────────────────────────

export function analyzeCustomerBrain(data: BrainInput): CustomerBrainOutput {
  const {
    client, contacts, activities, documents,
    opportunities, quotations, shipments, serviceOrders,
    invoices, accountsReceivable, creditStatus,
    purchaseOrders, timeline,
  } = data;

  const dim = {
    identity:     0,
    relationship: 0,
    activity:     0,
    pipeline:     0,
    operations:   0,
    finance:      0,
    collections:  0,
    compliance:   0,
    procurement:  0,
    history:      0,
  };

  // ── DIMENSIÓN 1: IDENTIDAD (max 10) ──────────────────────────
  if (client?.name)         dim.identity += 2;
  if (client?.legal_name)   dim.identity += 2;
  if (client?.rfc)          dim.identity += 2;
  if (client?.email)        dim.identity += 1;
  if (client?.phone)        dim.identity += 1;
  if (client?.city)         dim.identity += 1;
  if (client?.tax_regime)   dim.identity += 1;

  // ── DIMENSIÓN 2: RELACIÓN / CONTACTOS (max 10) ────────────────
  if (contacts.length >= 1) dim.relationship += 4;
  if (contacts.length >= 3) dim.relationship += 3;
  if (contacts.length >= 5) dim.relationship += 2;
  const decisionMakers = contacts.filter((c: any) =>
    c.role_in_decision === "decision_maker" || c.role_in_decision === "champion"
  ).length;
  if (decisionMakers >= 1) dim.relationship += 4;
  const withEmail  = contacts.filter((c: any) => c.email).length;
  const withPhone  = contacts.filter((c: any) => c.phone || c.mobile_phone).length;
  if (withEmail >= 1)  dim.relationship += 2;
  if (withPhone >= 1)  dim.relationship += 2;
  dim.relationship = Math.min(dim.relationship, 10);

  // ── DIMENSIÓN 3: ACTIVIDAD / SEGUIMIENTO (max 10) ────────────
  const now = Date.now();
  const lastAct = activities[0] ? new Date(activities[0].created_at).getTime() : 0;
  const daysSince = lastAct ? (now - lastAct) / 86400000 : 999;
  if (activities.length >= 1)  dim.activity += 3;
  if (activities.length >= 5)  dim.activity += 2;
  if (activities.length >= 10) dim.activity += 2;
  if (daysSince < 7)           dim.activity += 3;
  else if (daysSince < 30)     dim.activity += 2;
  else if (daysSince < 90)     dim.activity += 1;
  const pending = activities.filter((a: any) => a.scheduled_at && !a.completed).length;
  if (pending > 0) dim.activity += 2;
  dim.activity = Math.min(dim.activity, 10);

  // ── DIMENSIÓN 4: PIPELINE COMERCIAL (max 10) ─────────────────
  const pipelineValue = opportunities.reduce((s: number, o: any) => s + (o.value ?? o.estimated_value ?? 0), 0);
  if (opportunities.length >= 1) dim.pipeline += 3;
  if (opportunities.length >= 3) dim.pipeline += 2;
  if (pipelineValue > 100000)    dim.pipeline += 2;
  if (pipelineValue > 1000000)   dim.pipeline += 1;
  if (quotations.length >= 1)    dim.pipeline += 3;
  const acceptedQuotes = quotations.filter((q: any) => q.status === "accepted" || q.status === "approved").length;
  if (acceptedQuotes > 0)        dim.pipeline += 2;
  dim.pipeline = Math.min(dim.pipeline, 10);

  // ── DIMENSIÓN 5: OPERACIONES / LOGÍSTICA (max 10) ────────────
  if (shipments.length >= 1)     dim.operations += 4;
  if (shipments.length >= 5)     dim.operations += 2;
  if (shipments.length >= 20)    dim.operations += 2;
  if (serviceOrders.length >= 1) dim.operations += 2;
  const delivered = shipments.filter((s: any) => s.status === "delivered" || s.status === "completed").length;
  const onTime    = shipments.filter((s: any) => s.delivered_at && s.scheduled_date && new Date(s.delivered_at) <= new Date(s.scheduled_date)).length;
  if (delivered > 0 && onTime / Math.max(delivered, 1) >= 0.9) dim.operations += 2;
  dim.operations = Math.min(dim.operations, 10);

  // ── DIMENSIÓN 6: FACTURACIÓN / INGRESOS (max 10) ─────────────
  const totalBilled = invoices.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
  const paidInvoices = invoices.filter((i: any) => i.status === "paid" || i.status === "pagada").length;
  if (totalBilled > 0)          dim.finance += 3;
  if (totalBilled > 100000)     dim.finance += 2;
  if (totalBilled > 1000000)    dim.finance += 2;
  if (totalBilled > 5000000)    dim.finance += 2;
  if (paidInvoices > 0)         dim.finance += 1;
  dim.finance = Math.min(dim.finance, 10);

  // ── DIMENSIÓN 7: CxC / COBRANZA (max 10) ─────────────────────
  const totalPending   = accountsReceivable.reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
  const overdueItems   = accountsReceivable.filter((r: any) => r.days_overdue > 0);
  const overdueAmount  = overdueItems.reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
  const maxDaysOverdue = overdueItems.reduce((m: number, r: any) => Math.max(m, r.days_overdue ?? 0), 0);
  const creditLimit    = creditStatus?.credit_limit ?? 0;
  const creditUsage    = creditLimit > 0 ? (totalPending / creditLimit) * 100 : 0;

  // Score: buen pagador = alto puntaje
  if (overdueAmount === 0 && totalPending === 0) dim.collections = 10;
  else if (maxDaysOverdue === 0)                 dim.collections = 8;
  else if (maxDaysOverdue <= 15)                 dim.collections = 6;
  else if (maxDaysOverdue <= 30)                 dim.collections = 4;
  else if (maxDaysOverdue <= 60)                 dim.collections = 2;
  else                                           dim.collections = 0;
  // Penalizar si usa >80% del crédito
  if (creditUsage > 80) dim.collections = Math.max(0, dim.collections - 2);

  // ── DIMENSIÓN 8: COMPLIANCE / DOCUMENTOS (max 10) ────────────
  const allDocs       = [...(documents.crmDocs ?? []), ...(documents.clientDocs ?? [])];
  const hasContract   = allDocs.some((d: any) => d.type === "contract" || d.file_type?.includes("contract"));
  const hasNDA        = allDocs.some((d: any) => d.type === "nda");
  const hasTaxId      = allDocs.some((d: any) => d.type === "tax_id");
  const expiredDocs   = allDocs.filter((d: any) => d.expires_at && new Date(d.expires_at) < new Date()).length;
  if (hasContract)     dim.compliance += 4;
  if (hasNDA)          dim.compliance += 2;
  if (hasTaxId)        dim.compliance += 2;
  if (allDocs.length >= 3) dim.compliance += 1;
  if (expiredDocs > 0) dim.compliance = Math.max(0, dim.compliance - 3);
  dim.compliance = Math.min(dim.compliance, 10);

  // ── DIMENSIÓN 9: COMPRAS / PROVEEDOR (max 10) ────────────────
  if (purchaseOrders.length >= 1) dim.procurement += 4;
  if (purchaseOrders.length >= 5) dim.procurement += 3;
  const totalPurchased = purchaseOrders.reduce((s: number, p: any) => s + (p.total ?? 0), 0);
  if (totalPurchased > 100000)    dim.procurement += 3;
  dim.procurement = Math.min(dim.procurement, 10);

  // ── DIMENSIÓN 10: HISTORIAL GLOBAL (max 10) ──────────────────
  if (timeline.length >= 5)  dim.history += 3;
  if (timeline.length >= 15) dim.history += 3;
  if (timeline.length >= 50) dim.history += 2;
  // Antigüedad como cliente
  const clientSince = client?.created_at ? new Date(client.created_at).getTime() : now;
  const ageMonths   = (now - clientSince) / (30 * 86400000);
  if (ageMonths >= 3)  dim.history += 1;
  if (ageMonths >= 12) dim.history += 1;
  if (ageMonths >= 36) dim.history += 2;
  dim.history = Math.min(dim.history, 10);

  // ── HEALTH SCORE PONDERADO ────────────────────────────────────
  const weights = {
    identity:     0.06,
    relationship: 0.12,
    activity:     0.12,
    pipeline:     0.12,
    operations:   0.12,
    finance:      0.14,
    collections:  0.14,
    compliance:   0.06,
    procurement:  0.06,
    history:      0.06,
  };

  const healthScore = Math.round(
    Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (dim[key as keyof typeof dim] * 10 * weight);
    }, 0)
  );

  // ── VALUE TIER ────────────────────────────────────────────────
  const valueTier: CustomerBrainOutput["valueTier"] =
    totalBilled > 5_000_000 ? "STRATEGIC"
    : totalBilled > 1_000_000 ? "HIGH"
    : totalBilled > 100_000 ? "MEDIUM"
    : pipelineValue > 500_000 ? "MEDIUM"
    : "LOW";

  // ── RELATIONSHIP STATUS ───────────────────────────────────────
  const relationshipStatus: CustomerBrainOutput["relationshipStatus"] =
    contacts.length >= 3 && activities.length >= 3 && daysSince < 30 ? "STRONG"
    : contacts.length >= 1 && activities.length >= 1 ? "WARM"
    : "COLD";

  // ── RISK LEVEL ────────────────────────────────────────────────
  let riskLevel: CustomerBrainOutput["riskLevel"] = "LOW";
  if (maxDaysOverdue > 60)     riskLevel = "CRITICAL";
  else if (maxDaysOverdue > 30)riskLevel = "HIGH";
  else if (healthScore < 30)   riskLevel = "CRITICAL";
  else if (healthScore < 50)   riskLevel = "HIGH";
  else if (healthScore < 70)   riskLevel = "MEDIUM";

  // ── COMMERCIAL STATE ─────────────────────────────────────────
  let commercialState: CustomerBrainOutput["commercialState"] = "NO_PIPELINE";
  if (opportunities.length > 0) commercialState = "PIPELINE_ACTIVE";
  if (quotations.length > 0)    commercialState = "QUOTE_SENT";
  if (shipments.length > 0 || invoices.length > 0) commercialState = "CUSTOMER_ACTIVE";

  // ── NEXT BEST ACTION ─────────────────────────────────────────
  let nextBestAction = "Monitorear cliente.";
  if (maxDaysOverdue > 60)
    nextBestAction = "URGENTE: Gestionar cobranza — saldo vencido >60 días.";
  else if (riskLevel === "CRITICAL")
    nextBestAction = "Contactar inmediatamente — relación en riesgo crítico.";
  else if (contacts.length === 0)
    nextBestAction = "Registrar contacto clave para poder operar.";
  else if (expiredDocs > 0)
    nextBestAction = "Renovar documentos vencidos antes de operar.";
  else if (commercialState === "QUOTE_SENT")
    nextBestAction = "Dar seguimiento a cotización enviada — cerrar deal.";
  else if (commercialState === "PIPELINE_ACTIVE")
    nextBestAction = "Preparar propuesta formal para oportunidad activa.";
  else if (commercialState === "CUSTOMER_ACTIVE")
    nextBestAction = "Detectar oportunidad de upsell o renovación.";
  else if (relationshipStatus === "COLD")
    nextBestAction = "Reactivar relación — agendar reunión ejecutiva.";
  else if (creditUsage > 80)
    nextBestAction = "Revisar límite de crédito — uso superior al 80%.";

  // ── EXECUTIVE SUMMARY ─────────────────────────────────────────
  const executiveSummary =
    valueTier === "STRATEGIC" && riskLevel === "LOW"
      ? "Cliente estratégico de alto valor con relación sólida."
    : valueTier === "STRATEGIC"
      ? "Cliente estratégico — requiere atención inmediata en áreas críticas."
    : maxDaysOverdue > 30
      ? "Cliente con saldo vencido significativo — prioridad de cobranza."
    : riskLevel === "CRITICAL"
      ? "Relación en riesgo crítico — acción urgente requerida."
    : relationshipStatus === "STRONG" && commercialState === "CUSTOMER_ACTIVE"
      ? "Cliente activo con relación sólida y operaciones en curso."
    : relationshipStatus === "WARM"
      ? "Cliente con base comercial — potencial de crecimiento."
    : "Cliente en desarrollo — construir relación y pipeline.";

  return {
    healthScore,
    valueTier,
    relationshipStatus,
    riskLevel,
    commercialState,
    totalBilled,
    totalPending,
    overdueAmount,
    maxDaysOverdue,
    creditUsage,
    totalShipments: shipments.length,
    activeOrders:   serviceOrders.filter((s: any) => s.status !== "completed" && s.status !== "cancelled").length,
    nextBestAction,
    executiveSummary,
    dimensionScores: dim,
  };
}
