// services/email/templates/registry.ts
//
// Registro central de todas las templates disponibles.
// Cuando agreguemos más templates (cotizaciones, facturas, etc.),
// solo se importan aquí y se agregan al objeto TEMPLATES.

import type { EmailTemplate } from "../types";
import { invitationTemplate } from "./invitation";

/**
 * Mapa de templates registradas.
 * El key debe coincidir con EmailTemplate.key.
 */
export const TEMPLATES: Record<string, EmailTemplate> = {
  user_invitation: invitationTemplate,
  // Futuras:
  // quotation_send:       quotationTemplate,
  // invoice_send:         invoiceTemplate,
  // shipment_status:      shipmentStatusTemplate,
  // payment_reminder:     paymentReminderTemplate,
};

export function getTemplate(key: string): EmailTemplate | null {
  return TEMPLATES[key] ?? null;
}
