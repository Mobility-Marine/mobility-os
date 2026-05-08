// app/api/email/send/route.ts
//
// Endpoint server-side para enviar emails vía Brevo.
// Renderiza la template, llama a la API de Brevo, y registra todo en email_logs
// para auditoría y tracking.

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { getTemplate }               from "@/services/email/templates/registry";
import type { SendEmailRequest, SendEmailResponse } from "@/services/email/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API_URL    = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY    = process.env.BREVO_API_KEY!;
const SENDER_EMAIL     = process.env.BREVO_SENDER_EMAIL ?? "noreply@mobility-os.lat";
const SENDER_NAME      = process.env.BREVO_SENDER_NAME  ?? "Mobility OS";

export async function POST(req: NextRequest) {
  try {
    if (!BREVO_API_KEY) {
      return NextResponse.json<SendEmailResponse>(
        { success: false, error: "BREVO_API_KEY no configurada en el servidor." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as SendEmailRequest;

    // ── Validaciones básicas ─────────────────────────────────────────
    if (!body.template_key)        return bad("template_key requerido");
    if (!body.company_id)          return bad("company_id requerido");
    if (!body.recipient?.email)    return bad("recipient.email requerido");
    if (!body.variables)           return bad("variables requerido");

    // ── Resolver template ─────────────────────────────────────────────
    const template = getTemplate(body.template_key);
    if (!template) {
      return bad(`Template "${body.template_key}" no registrada`);
    }

    let rendered;
    try {
      rendered = template.render(body.variables);
    } catch (err: any) {
      return bad(`Error renderizando template: ${err.message}`);
    }

    // ── 1) Crear registro en email_logs como "pending" ───────────────
    const { data: logRow, error: logError } = await supabaseAdmin
      .from("email_logs")
      .insert({
        company_id:           body.company_id,
        template_key:         body.template_key,
        category:             rendered.category,
        module_key:           rendered.module_key,
        related_entity_type:  body.related_entity?.type ?? null,
        related_entity_id:    body.related_entity?.id   ?? null,
        recipient_email:      body.recipient.email,
        recipient_name:       body.recipient.name        ?? null,
        cc_emails:            body.cc                    ?? null,
        bcc_emails:           body.bcc                   ?? null,
        reply_to_email:       body.reply_to?.email       ?? null,
        reply_to_name:        body.reply_to?.name        ?? null,
        sender_email:         SENDER_EMAIL,
        sender_name:          SENDER_NAME,
        subject:              rendered.subject,
        variables_json:       body.variables,
        status:               "pending",
        provider:             "brevo",
        triggered_by_user_id: body.triggered_by_user_id ?? null,
      })
      .select()
      .single();

    if (logError || !logRow) {
      return NextResponse.json<SendEmailResponse>(
        { success: false, error: `Error guardando log: ${logError?.message}` },
        { status: 500 }
      );
    }

    // ── 2) Enviar a Brevo ────────────────────────────────────────────
    const brevoPayload: any = {
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{
        email: body.recipient.email,
        ...(body.recipient.name ? { name: body.recipient.name } : {}),
      }],
      subject:     rendered.subject,
      htmlContent: rendered.html_body,
      ...(rendered.text_body ? { textContent: rendered.text_body } : {}),
      ...(body.cc?.length      ? { cc:  body.cc.map(e => ({ email: e })) } : {}),
      ...(body.bcc?.length     ? { bcc: body.bcc.map(e => ({ email: e })) } : {}),
      ...(body.reply_to        ? {
        replyTo: {
          email: body.reply_to.email,
          ...(body.reply_to.name ? { name: body.reply_to.name } : {}),
        }
      } : {}),
      // ──────────────────────────────────────────────────────────
      // Adjuntos: Brevo acepta { name, content } con content en
      // base64 puro (sin prefijo data:...). Si NO hay attachments
      // el campo se omite del payload.
      // ──────────────────────────────────────────────────────────
      ...(body.attachments?.length
        ? { attachment: body.attachments.map(a => ({ name: a.name, content: a.content })) }
        : {}),
      // Tags útiles para filtrar en Brevo dashboard
      tags: [body.template_key, rendered.category, rendered.module_key],
    };

    let brevoMessageId: string | null = null;
    let brevoError:     string | null = null;

    try {
      const res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "accept":         "application/json",
          "content-type":   "application/json",
          "api-key":        BREVO_API_KEY,
        },
        body: JSON.stringify(brevoPayload),
      });
      const data = await res.json();

      if (!res.ok) {
        brevoError = data.message ?? data.code ?? `HTTP ${res.status}`;
      } else {
        brevoMessageId = data.messageId ?? null;
      }
    } catch (err: any) {
      brevoError = err.message ?? "Error de red al contactar Brevo";
    }

    // ── 3) Actualizar log con resultado ──────────────────────────────
    if (brevoError) {
      await supabaseAdmin
        .from("email_logs")
        .update({
          status:        "failed",
          error_message: brevoError,
          updated_at:    new Date().toISOString(),
        })
        .eq("id", logRow.id);

      return NextResponse.json<SendEmailResponse>(
        { success: false, error: brevoError, email_log_id: logRow.id },
        { status: 502 }
      );
    }

    await supabaseAdmin
      .from("email_logs")
      .update({
        status:              "sent",
        provider_message_id: brevoMessageId,
        sent_at:             new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      })
      .eq("id", logRow.id);

    return NextResponse.json<SendEmailResponse>({
      success:             true,
      email_log_id:        logRow.id,
      provider_message_id: brevoMessageId ?? undefined,
    });

  } catch (err: any) {
    return NextResponse.json<SendEmailResponse>(
      { success: false, error: err.message ?? "Error desconocido" },
      { status: 500 }
    );
  }
}

function bad(error: string) {
  return NextResponse.json<SendEmailResponse>({ success: false, error }, { status: 400 });
}
