// ============================================================
// PROSPECTS AUTOMATION ENGINE v2 — GOD LEVEL
// Alertas automáticas basadas en reglas de negocio
// Strings como i18n keys — sin texto hardcodeado
// ============================================================

import type { Prospect } from "../types/prospects.types";
import { getProspectStage, hasContact, isOverdue } from "./prospects.normalization";

export type AutomationAlertType =
  | "missing_contact"
  | "overdue_followup"
  | "high_value_stalled"
  | "ready_to_convert"
  | "no_activity"
  | "new_prospect_idle";

export type ProspectAutomationAlert = {
  id:          string;
  type:        AutomationAlertType;
  severity:    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  titleKey:    string;   // i18n key
  descKey:     string;   // i18n key
  prospectId:  string;
  prospectName: string;
  metadata?:   Record<string, any>;
};

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1,
};

export function buildProspectAutomationAlerts(
  prospects: Prospect[]
): ProspectAutomationAlert[] {
  const now    = new Date();
  const alerts: ProspectAutomationAlert[] = [];

  for (const p of prospects) {
    const stage = getProspectStage(p);
    const displayName = p.company_name || p.name || "—";

    // 1. Sin datos de contacto
    if (p.is_active && !hasContact(p)) {
      alerts.push({
        id:          `${p.id}-missing-contact`,
        type:        "missing_contact",
        severity:    "HIGH",
        titleKey:    "prospects.alertMissingContact",
        descKey:     "prospects.alertMissingContactDesc",
        prospectId:  p.id,
        prospectName: displayName,
      });
    }

    // 2. Seguimiento vencido
    if (p.is_active && isOverdue(p)) {
      alerts.push({
        id:          `${p.id}-overdue`,
        type:        "overdue_followup",
        severity:    "CRITICAL",
        titleKey:    "prospects.alertOverdue",
        descKey:     "prospects.alertOverdueDesc",
        prospectId:  p.id,
        prospectName: displayName,
        metadata:    { next_follow_up: p.next_follow_up },
      });
    }

    // 3. Alto valor sin avance
    if (
      p.is_active &&
      (p.estimated_value ?? 0) >= 100_000 &&
      (stage === "new" || stage === "contacted")
    ) {
      alerts.push({
        id:          `${p.id}-high-value`,
        type:        "high_value_stalled",
        severity:    "HIGH",
        titleKey:    "prospects.alertHighValueStalled",
        descKey:     "prospects.alertHighValueStalledDesc",
        prospectId:  p.id,
        prospectName: displayName,
        metadata:    { value: p.estimated_value, stage },
      });
    }

    // 4. Listo para avanzar (proposal / negotiation)
    if (p.is_active && (stage === "proposal" || stage === "negotiation")) {
      alerts.push({
        id:          `${p.id}-convert`,
        type:        "ready_to_convert",
        severity:    "MEDIUM",
        titleKey:    "prospects.alertReadyToConvert",
        descKey:     "prospects.alertReadyToConvertDesc",
        prospectId:  p.id,
        prospectName: displayName,
        metadata:    { stage },
      });
    }

    // 5. Prospecto nuevo sin actividad por más de 3 días
    if (p.is_active && stage === "new" && p.created_at) {
      const days = Math.floor(
        (now.getTime() - new Date(p.created_at).getTime()) / 86_400_000
      );
      if (days >= 3) {
        alerts.push({
          id:          `${p.id}-idle`,
          type:        "new_prospect_idle",
          severity:    "MEDIUM",
          titleKey:    "prospects.alertIdle",
          descKey:     "prospects.alertIdleDesc",
          prospectId:  p.id,
          prospectName: displayName,
          metadata:    { days },
        });
      }
    }
  }

  return alerts.sort(
    (a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0)
  );
}
