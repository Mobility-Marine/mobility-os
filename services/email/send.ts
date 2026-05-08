// services/email/send.ts
//
// Cliente de email para uso desde el frontend.
// Llama al endpoint /api/email/send que es el que realmente habla con Brevo.
// Cualquier módulo (invitaciones, cotizaciones, facturas...) usa esta función.

import type { SendEmailRequest, SendEmailResponse } from "./types";

const ENDPOINT = "/api/email/send";

/**
 * Envía un email usando una template registrada.
 *
 * @example
 * await sendEmail({
 *   template_key: "quotation_sent",
 *   company_id:   currentCompanyId,
 *   recipient:    { email: "cliente@empresa.com", name: "Juan Pérez" },
 *   variables:    { ... },
 *   cc:           ["copia@empresa.com"],
 *   reply_to:     { email: "vendedor@miempresa.com", name: "Mi Vendedor" },
 *   attachments:  [{ name: "COT-2026-0008.pdf", content: "<base64>" }],
 *   related_entity:        { type: "quotation", id: quotationId },
 *   triggered_by_user_id:  currentUserId,
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