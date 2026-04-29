// services/email/email.service.ts
//
// Cliente del frontend para enviar emails.
// Llama al endpoint /api/email/send que es el que realmente habla con Brevo.
// Cualquier módulo (invitaciones, cotizaciones, facturas...) usa esta función.

import type { SendEmailRequest, SendEmailResponse } from "./types";

const ENDPOINT = "/api/email/send";

/**
 * Envía un email usando una template registrada.
 *
 * @example
 * await sendEmail({
 *   template_key: "user_invitation",
 *   company_id:   currentCompanyId,
 *   recipient:    { email: "nuevo@empresa.com", name: "Juan Pérez" },
 *   variables:    {
 *     invited_email:   "nuevo@empresa.com",
 *     inviter_name:    "Alejandro Reyes",
 *     company_name:    "Mobility Marine",
 *     role_label:      "Comercial",
 *     invitation_url:  "https://app.mobility-os.lat/accept-invitation?token=abc",
 *     expires_in_days: 7,
 *   },
 *   reply_to:     { email: "a.reyes@mobility-marine.com", name: "Alejandro Reyes" },
 *   related_entity: { type: "invitation", id: invitationId },
 *   triggered_by_user_id: currentUserId,
 * });
 */
export async function sendEmail(payload: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    const res = await fetch(ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error:   data.error ?? `Error HTTP ${res.status}`,
      };
    }
    return data as SendEmailResponse;
  } catch (err: any) {
    return {
      success: false,
      error:   err.message ?? "Error de red",
    };
  }
}
