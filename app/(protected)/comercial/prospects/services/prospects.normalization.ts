"use client";

import type { Prospect, ProspectStage } from "../types/prospects.types";

export function getProspectStage(p: Prospect): ProspectStage {
  return (p.stage ||
    (p.status as ProspectStage) ||
    "new") as ProspectStage;
}

export function isProspectActive(p: Prospect) {
  const stage = getProspectStage(p);
  return p.is_active && stage !== "converted" && stage !== "lost";
}

export function isProspectConvertible(p: Prospect) {
  const stage = getProspectStage(p);
  return stage === "qualified" || stage === "proposal" || stage === "negotiation";
}

export function shouldMoveToOpportunity(p: Prospect) {
  const stage = (p.stage || p.status || "new").toLowerCase();

  return (
    p.is_active &&
    p.estimated_value &&
    p.estimated_value > 0 &&
    (stage === "qualified" ||
      stage === "proposal" ||
      stage === "negotiation")
  );
}
