"use client";

import type { Prospect } from "../types/prospects.types";

export type ProspectAutomationAlert = {
  id: string;
  type:
    | "missing_contact"
    | "overdue_followup"
    | "high_value_stalled"
    | "ready_to_convert";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  prospectId: string;
};

export function buildProspectAutomationAlerts(
  prospects: Prospect[]
): ProspectAutomationAlert[] {
  const now = new Date();
  const alerts: ProspectAutomationAlert[] = [];

  for (const p of prospects) {
    const stage = (p.stage || p.status || "new").toLowerCase();

    if (p.is_active && !p.email && !p.phone) {
      alerts.push({
        id: `${p.id}-missing-contact`,
        type: "missing_contact",
        severity: "HIGH",
        title: "Faltan datos de contacto",
        description: `${p.company_name || p.name || "Prospecto"} no tiene email ni teléfono.`,
        prospectId: p.id,
      });
    }

    if (p.is_active && p.next_follow_up && new Date(p.next_follow_up) < now) {
      alerts.push({
        id: `${p.id}-overdue`,
        type: "overdue_followup",
        severity: "CRITICAL",
        title: "Seguimiento vencido",
        description: `${p.company_name || p.name || "Prospecto"} tiene seguimiento atrasado.`,
        prospectId: p.id,
      });
    }

    if (
      p.is_active &&
      (p.estimated_value || 0) >= 100000 &&
      (stage === "new" || stage === "contacted")
    ) {
      alerts.push({
        id: `${p.id}-high-value`,
        type: "high_value_stalled",
        severity: "HIGH",
        title: "Alto valor sin avance",
        description: `${p.company_name || p.name || "Prospecto"} tiene alto valor pero sigue en etapa temprana.`,
        prospectId: p.id,
      });
    }

    if (p.is_active && (stage === "proposal" || stage === "negotiation")) {
      alerts.push({
        id: `${p.id}-convert`,
        type: "ready_to_convert",
        severity: "MEDIUM",
        title: "Listo para avanzar",
        description: `${p.company_name || p.name || "Prospecto"} ya está en etapa final del funnel.`,
        prospectId: p.id,
      });
    }
  }

  const severityOrder = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return alerts.sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
  );
}
