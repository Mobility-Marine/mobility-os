// services/email/types.ts
//
// Tipos compartidos para el sistema de email de Mobility OS.
// Centraliza contratos para que todos los módulos hablen el mismo lenguaje.

export type EmailCategory =
  | "transactional"   // Notificaciones del sistema (invitaciones, confirmaciones)
  | "document"        // Envío de documentos (cotizaciones, facturas, CFDI)
  | "notification"    // Avisos de estatus (tracking, recordatorios)
  | "reminder";       // Recordatorios automáticos (cobranza, vencimientos)

export type EmailStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed";

/**
 * Payload que el FRONTEND envía al endpoint /api/email/send.
 * El servidor se encarga de mergear con el template y mandar a Brevo.
 */
export type SendEmailRequest = {
  template_key:    string;                        // ej: "user_invitation"
  company_id:      string;                        // tenant
  recipient: {
    email:         string;
    name?:         string;
  };
  variables:       Record<string, any>;           // datos para rellenar la template
  cc?:             string[];
  bcc?:            string[];
  reply_to?: {
    email:         string;
    name?:         string;
  };
  // ────────────────────────────────────────────────────────────
  // Adjuntos opcionales (PDF de cotización, XML+PDF de CFDI, etc)
  // El servidor los pasa directo al payload de Brevo.
  // content debe ser base64 (sin prefijo data:...).
  // ────────────────────────────────────────────────────────────
  attachments?: Array<{
    name:    string;        // nombre del archivo (ej: "COT-2026-0008.pdf")
    content: string;        // contenido en base64
  }>;
  related_entity?: {
    type:          string;                        // "invitation" | "quotation" | "shipment"...
    id:            string;
  };
  triggered_by_user_id?: string;
};

/**
 * Resultado que devuelve /api/email/send al frontend.
 */
export type SendEmailResponse = {
  success:           boolean;
  email_log_id?:     string;
  provider_message_id?: string;
  error?:            string;
};

/**
 * Estructura interna de una template renderizada.
 * Cada template (registry.ts) devuelve este shape.
 */
export type RenderedEmail = {
  subject:    string;
  html_body:  string;
  text_body?: string;                             // fallback para clientes sin HTML
  category:   EmailCategory;
  module_key: string;                             // "settings" | "comercial" | "logistica"...
};

/**
 * Contrato que toda template debe cumplir.
 * Recibe variables y devuelve el email renderizado.
 */
export type EmailTemplate = {
  key:        string;
  category:   EmailCategory;
  module_key: string;
  render:     (variables: Record<string, any>) => RenderedEmail;
};
