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
