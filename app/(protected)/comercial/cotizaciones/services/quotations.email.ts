"use client";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "@/lib/supabaseClient";
import { sendEmail } from "@/services/email/send";
import type { Quotation } from "../types/quotations.types";
import type { CurrentUser } from "@/lib/auth/useCurrentUser";

// Templates PDF (la generación de PDF se hace aquí mismo a partir del componente)
// Nota: nombres asimétricos en el repo — TemplateEleganteProductos vs TemplateServicios
import TemplateEleganteProductos from "../components/templates/TemplateEleganteProductos";
import TemplateServicios from "../components/templates/TemplateServicios";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION EMAIL SERVICE
//
// Orquestador que:
//   1. Carga company_settings completo (branding + firma + disclaimer)
//   2. Genera el PDF de la cotización en memoria (blob → base64)
//   3. Construye todas las variables que el template necesita
//   4. Llama a /api/email/send con CC, BCC, reply_to y attachment
//   5. Si éxito: actualiza quotations (last_sent_at, sent_count, sent_at, status)
//
// Patrón ERP: una sola fuente de verdad para envío de cotizaciones.
// ═══════════════════════════════════════════════════════════════════

export interface SendQuotationEmailParams {
  quotation:    Quotation;
  companyId:    string;
  currentUser:  CurrentUser;
  to:           string;       // email destinatario
  cc?:          string[];     // copias
  bcc?:         string[];     // copias ocultas
  subject:      string;
  userMessage:  string;       // cuerpo del mensaje editable
}

export interface SendQuotationEmailResult {
  success:     boolean;
  error?:      string;
  emailLogId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convierte un Blob a base64 puro (sin prefijo data:...) */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Parsea "a@x.com, b@y.com" → ["a@x.com", "b@y.com"]. Tolera tabs/saltos. */
export function parseEmails(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,;\n\r\t]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && /\S+@\S+\.\S+/.test(s));
}

/** Formatea fecha YYYY-MM-DD o ISO en "20 de mayo de 2026" */
function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

/** Formatea total en "$14,993.00 MXN" */
function formatTotal(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `$${formatted} ${currency}`;
}

/**
 * Calcula totales por moneda desde billing_concepts.
 * Una cotización puede mezclar conceptos en MXN y USD — el correo debe
 * mostrarlos por separado, NUNCA sumar montos de monedas distintas.
 * Patrón consistente con QuotationCopilot / QuotationCommandCenter / QuotationFilters.
 * (TODO: centralizar en un solo helper compartido en futuro sprint.)
 */
function computeTotalsByCurrency(q: Quotation): Record<string, number> {
  const concepts = (q as any).billing_concepts ?? [];
  if (concepts.length > 0) {
    const totals: Record<string, number> = {};
    for (const c of concepts) {
      for (const line of c.lines ?? []) {
        const cur   = line.currency ?? c.currency ?? q.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const rate  = line.tax_rate;
        const tax   =
          rate === null || rate === undefined || rate === -1 || Number(rate) <= 0
            ? 0
            : price * (Number(rate) / 100);
        totals[cur] = (totals[cur] ?? 0) + price + tax;
      }
    }
    return totals;
  }
  // Fallback: cotizaciones legacy sin billing_concepts
  return { [q.currency ?? "MXN"]: Number(q.total ?? 0) };
}

/** Concatena dirección fiscal en una línea */
function buildAddressLine(s: any): string {
  const parts = [s?.fiscal_address, s?.fiscal_city, s?.fiscal_state, s?.fiscal_zip, s?.fiscal_country]
    .filter(p => !!p && String(p).trim());
  return parts.join(", ");
}

// ─── Generación de PDF blob ──────────────────────────────────────────

async function generateQuotationPDFBlob(
  quotation: Quotation,
  settings: any,
): Promise<Blob> {
  const Doc = quotation.type === "products"
    ? (TemplateEleganteProductos as any)({ quotation, settings })
    : (TemplateServicios as any)({ quotation, settings });

  return await pdf(Doc).toBlob();
}

// ─── Carga de company_settings completo ──────────────────────────────

async function loadCompanySettings(companyId: string) {
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(`Error cargando configuración de empresa: ${error.message}`);
  if (!data)  throw new Error("No se encontró configuración de la empresa");
  return data;
}

// ─── Función principal ──────────────────────────────────────────────

export async function sendQuotationEmail(
  params: SendQuotationEmailParams,
): Promise<SendQuotationEmailResult> {
  const { quotation, companyId, currentUser, to, cc, bcc, subject, userMessage } = params;

  try {
    // 1) Cargar company_settings (logo, branding, firma, disclaimer)
    const settings = await loadCompanySettings(companyId);

    // 2) Generar PDF en memoria
    const pdfBlob   = await generateQuotationPDFBlob(quotation, settings);
    const pdfBase64 = await blobToBase64(pdfBlob);

    // 3) Construir variables del template
    // Cálculo multi-moneda: NUNCA sumar montos de monedas distintas
    const totalsByCurrency = computeTotalsByCurrency(quotation);
    const totalsLines = Object.entries(totalsByCurrency)
      .filter(([, v]) => v > 0)
      .map(([cur, v]) => formatTotal(v, cur));
    const variables = {
      // Mensaje
      user_message:         userMessage,
      // Destinatario
      client_contact_name:  quotation.contact_name ?? quotation.client_name ?? "",
      // Cotización
      quote_number:         quotation.quote_number ?? "",
      quote_date:           formatDateLong((quotation as any).created_at),
      valid_until:          formatDateLong(quotation.valid_until),
      // Multi-moneda: array de líneas formateadas (una por moneda)
      totals_lines:         totalsLines,
      // Legacy: total_formatted = primera moneda (compat con templates antiguos)
      total_formatted:      totalsLines[0] ?? "",
      // Usuario emisor (firma)
      user_full_name:       currentUser.full_name ?? "",
      user_job_title:       currentUser.job_title ?? "",
      user_email:           currentUser.email ?? "",
      user_phone:           currentUser.phone ?? "",
      user_phone_mobile:    currentUser.phone_mobile ?? "",
      // Empresa (firma)
      company_name:         settings.fiscal_name     ?? "",
      company_logo_url:     settings.logo_url        ?? "",
      company_phone:        settings.fiscal_phone    ?? "",
      company_email:        settings.fiscal_email    ?? "",
      company_website:      settings.fiscal_website  ?? "",
      company_address:      buildAddressLine(settings),
      // Redes sociales
      social_facebook_url:  settings.social_facebook_url  ?? "",
      social_linkedin_url:  settings.social_linkedin_url  ?? "",
      social_instagram_url: settings.social_instagram_url ?? "",
      social_twitter_url:   settings.social_twitter_url   ?? "",
      // Branding email
      email_promo_banner_text: settings.email_promo_banner_text ?? "",
      email_disclaimer_es:     settings.email_disclaimer_es     ?? "",
      email_disclaimer_en:     settings.email_disclaimer_en     ?? "",
      // Colores de marca
      brand_color:          settings.brand_color      ?? "#1d4ed8",
      brand_color_dark:     settings.brand_color_dark ?? "#0a1628",
      brand_accent:         settings.brand_accent     ?? "#c9a227",
    };

    // 4) Llamar al endpoint /api/email/send
    const filename = `${quotation.quote_number ?? "cotizacion"}.pdf`;
    const result = await sendEmail({
      template_key: "quotation_sent",
      company_id:   companyId,
      recipient: {
        email: to,
        name:  variables.client_contact_name || quotation.client_name || undefined,
      },
      variables,
      cc:  cc?.length  ? cc  : undefined,
      bcc: bcc?.length ? bcc : undefined,
      // Reply-to: cuando el cliente responda, le llega al usuario emisor
      reply_to: currentUser.email
        ? { email: currentUser.email, name: currentUser.full_name ?? undefined }
        : undefined,
      attachments: [{ name: filename, content: pdfBase64 }],
      related_entity:        { type: "quotation", id: quotation.id },
      triggered_by_user_id:  currentUser.id,
    });

    if (!result.success) {
      return { success: false, error: result.error ?? "Error enviando correo" };
    }

    // 5) Actualizar quotations en BD (tracking ERP-grade)
    const now = new Date().toISOString();
    const isFirstSend = !quotation.sent_at;

    const updatePayload: any = {
      last_sent_at:        now,
      last_sent_to_email:  to,
      sent_count:          (quotation.sent_count ?? 0) + 1,
      updated_at:          now,
    };
    if (isFirstSend) {
      updatePayload.sent_at = now;
      // Solo cambiar status si está en "draft" (no sobrescribir aceptada/rechazada)
      if (quotation.status === "draft") {
        updatePayload.status = "sent";
      }
    }

    const { error: updErr } = await supabase
      .from("quotations")
      .update(updatePayload)
      .eq("id", quotation.id);

    if (updErr) {
      // El email se envió correctamente, solo falló el tracking. Lo logueamos pero
      // NO devolvemos error al usuario porque el envío sí fue exitoso.
      console.warn("[sendQuotationEmail] tracking update failed:", updErr.message);
    }

    return { success: true, emailLogId: result.email_log_id };
  } catch (err: any) {
    console.error("[sendQuotationEmail] error:", err);
    return { success: false, error: err.message ?? "Error desconocido al enviar" };
  }
}

// ─── Carga del historial de envíos para indicador en UI ───────────────

export interface QuotationSendHistory {
  count:  number;
  lastAt: string | null;
  lastTo: string | null;
}

export async function loadQuotationSendHistory(
  quotationId: string,
): Promise<QuotationSendHistory> {
  const { data } = await supabase
    .from("quotations")
    .select("sent_count, last_sent_at, last_sent_to_email")
    .eq("id", quotationId)
    .maybeSingle();

  return {
    count:  data?.sent_count         ?? 0,
    lastAt: data?.last_sent_at       ?? null,
    lastTo: data?.last_sent_to_email ?? null,
  };
}