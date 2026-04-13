
import { getCustomer360 } from "./customer360.service";
import { analyzeCustomerBrain } from "./customerBrain.service";

export type GlobalCommandCenterItem = {
  clientId: string;
  clientName: string;

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

export type GlobalCommandCenterData = {
  criticalRiskClients: GlobalCommandCenterItem[];
  strategicClients: GlobalCommandCenterItem[];
  noPipelineClients: GlobalCommandCenterItem[];
  quotePendingClients: GlobalCommandCenterItem[];
  activeCustomers: GlobalCommandCenterItem[];
};

export async function buildGlobalCommandCenter(
  companyId: string,
  clientIds: string[]
): Promise<GlobalCommandCenterData> {
  const snapshots = await Promise.all(
    clientIds.map(async (clientId) => {
      const snapshot = await getCustomer360(companyId, clientId);
      const brain = analyzeCustomerBrain(snapshot);

      return {
        clientId,
        clientName: snapshot.client?.name || "Cliente sin nombre",
        healthScore: brain.healthScore,
        valueTier: brain.valueTier,
        relationshipStatus: brain.relationshipStatus,
        riskLevel: brain.riskLevel,
        commercialState: brain.commercialState,
        nextBestAction: brain.nextBestAction,
        executiveSummary: brain.executiveSummary,
      } satisfies GlobalCommandCenterItem;
    })
  );

  return {
    criticalRiskClients: snapshots
      .filter((x) => x.riskLevel === "CRITICAL" || x.riskLevel === "HIGH")
      .sort((a, b) => a.healthScore - b.healthScore),

    strategicClients: snapshots
      .filter((x) => x.valueTier === "STRATEGIC" || x.valueTier === "HIGH")
      .sort((a, b) => b.healthScore - a.healthScore),

    noPipelineClients: snapshots
      .filter((x) => x.commercialState === "NO_PIPELINE")
      .sort((a, b) => a.healthScore - b.healthScore),

    quotePendingClients: snapshots
      .filter((x) => x.commercialState === "QUOTE_SENT")
      .sort((a, b) => a.healthScore - b.healthScore),

    activeCustomers: snapshots
      .filter((x) => x.commercialState === "CUSTOMER_ACTIVE")
      .sort((a, b) => b.healthScore - a.healthScore),
  };
}
