// services/email/templates/quotation_sent.ts
//
// Template profesional para envío de cotizaciones.
// Toda la firma (logo, datos del usuario, redes sociales, disclaimer, banner promo)
// se renderiza dinámicamente a partir de las variables. Si un campo está vacío
// o nulo, simplemente no se muestra — cada empresa decide qué configurar.
//
// Variables esperadas:
//   user_message            — Mensaje principal escrito por el usuario (HTML safe)
//   client_contact_name     — Nombre del contacto (para saludo)
//   quote_number            — COT-2026-0008
//   quote_date              — Fecha legible
//   valid_until             — Fecha de vigencia legible
//   total_formatted         — "$14,993.00 MXN" (preformateado)
//   user_full_name          — Manuel Alejandro Reyes Turcio
//   user_job_title          — Traffic and Logistics Manager
//   user_email              — a.reyes@mobility-marine.com
//   user_phone              — +52 (449) 602 8498
//   user_phone_mobile       — +52 (449) 109 6057
//   company_name            — Mobility Marine
//   company_logo_url        — https://...
//   company_phone           — +52 (449) 602 8498
//   company_email           — info@mobility-marine.com
//   company_website         — http://www.mobility-marine.com/
//   company_address         — Av. Circuito Japón... (concatenado)
//   social_facebook_url     — opcional
//   social_linkedin_url     — opcional
//   social_instagram_url    — opcional
//   social_twitter_url      — opcional
//   email_promo_banner_text — opcional
//   email_disclaimer_es     — opcional (default genérico si NULL)
//   email_disclaimer_en     — opcional (default genérico si NULL)
//   brand_color             — #1d4ed8
//   brand_color_dark        — #0a1628
//   brand_accent            — #c9a227

import type { EmailTemplate, RenderedEmail } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────
function escape(s: string | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nl2br(s: string | null | undefined): string {
  if (!s) return "";
  return escape(s).replace(/\r?\n/g, "<br/>");
}

function present(s: string | null | undefined): boolean {
  return !!(s && String(s).trim());
}

// ─── Iconos SVG inline para redes sociales (line-style, color brand) ─
const ICON_FACEBOOK = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`;
const ICON_LINKEDIN = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`;
const ICON_INSTAGRAM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
const ICON_TWITTER = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`;

// ─── Render de la firma corporativa ───────────────────────────────────
function renderSignature(v: Record<string, any>): string {
  const brand     = v.brand_color      ?? "#1d4ed8";
  const brandDark = v.brand_color_dark ?? "#0a1628";
  const accent    = v.brand_accent     ?? "#c9a227";

  // Logo (centrado en su row)
  const logoBlock = present(v.company_logo_url)
    ? `<tr><td style="padding:0 0 12px 0;"><img src="${escape(v.company_logo_url)}" alt="${escape(v.company_name)}" style="max-height:60px; max-width:240px; display:block;"/></td></tr>`
    : "";

  // Nombre + cargo + empresa (estilo de la firma original)
  const nameBlock = `
    <tr>
      <td style="padding:8px 0 4px 0; border-top:2px solid ${brand};">
        <div style="font-size:15px; font-weight:700; color:${brandDark}; letter-spacing:0.3px;">
          LCNI. ${escape(v.user_full_name)}
        </div>
        ${present(v.user_job_title) ? `
          <div style="font-size:12px; color:#555; margin-top:2px;">
            ${escape(v.user_job_title)}${present(v.company_name) ? ` at <span style="color:${brand}; font-weight:600;">${escape(v.company_name)}</span>` : ""}
          </div>
        ` : ""}
      </td>
    </tr>`;

  // Filas de contacto (solo las presentes)
  const contactRows: string[] = [];
  if (present(v.user_phone)) {
    contactRows.push(`<div style="font-size:12px; color:#333; line-height:1.6;"><span style="color:${brand}; font-weight:700;">Phone</span> ${escape(v.user_phone)}</div>`);
  }
  if (present(v.user_phone_mobile)) {
    contactRows.push(`<div style="font-size:12px; color:#333; line-height:1.6;"><span style="color:${brand}; font-weight:700;">Mobile</span> ${escape(v.user_phone_mobile)}</div>`);
  }
  if (present(v.user_email)) {
    contactRows.push(`<div style="font-size:12px; color:#333; line-height:1.6;"><span style="color:${brand}; font-weight:700;">Email</span> <a href="mailto:${escape(v.user_email)}" style="color:#333; text-decoration:none;">${escape(v.user_email)}</a></div>`);
  }
  if (present(v.company_website)) {
    contactRows.push(`<div style="font-size:12px; color:#333; line-height:1.6;"><span style="color:${brand}; font-weight:700;">Website</span> <a href="${escape(v.company_website)}" style="color:#333; text-decoration:none;">${escape(v.company_website)}</a></div>`);
  }
  if (present(v.company_address)) {
    contactRows.push(`<div style="font-size:12px; color:#333; line-height:1.6; margin-top:4px;"><span style="color:${brand}; font-weight:700;">Address</span> ${escape(v.company_address)}</div>`);
  }
  const contactBlock = contactRows.length > 0
    ? `<tr><td style="padding:6px 0 10px 0;">${contactRows.join("")}</td></tr>`
    : "";

  // Redes sociales (iconos solo de los configurados)
  const socialItems: string[] = [];
  if (present(v.social_facebook_url)) {
    socialItems.push(`<a href="${escape(v.social_facebook_url)}" style="display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; background:${brand}; color:#fff; border-radius:50%; margin-right:6px;" title="Facebook">${ICON_FACEBOOK}</a>`);
  }
  if (present(v.social_linkedin_url)) {
    socialItems.push(`<a href="${escape(v.social_linkedin_url)}" style="display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; background:${brand}; color:#fff; border-radius:50%; margin-right:6px;" title="LinkedIn">${ICON_LINKEDIN}</a>`);
  }
  if (present(v.social_instagram_url)) {
    socialItems.push(`<a href="${escape(v.social_instagram_url)}" style="display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; background:${brand}; color:#fff; border-radius:50%; margin-right:6px;" title="Instagram">${ICON_INSTAGRAM}</a>`);
  }
  if (present(v.social_twitter_url)) {
    socialItems.push(`<a href="${escape(v.social_twitter_url)}" style="display:inline-block; width:30px; height:30px; line-height:30px; text-align:center; background:${brand}; color:#fff; border-radius:50%;" title="Twitter">${ICON_TWITTER}</a>`);
  }
  const socialBlock = socialItems.length > 0
    ? `<tr><td style="padding:6px 0;">${socialItems.join("")}</td></tr>`
    : "";

  // Banner promocional (solo si está configurado)
  const promoBlock = present(v.email_promo_banner_text)
    ? `<tr><td style="padding:14px 0;">
         <div style="display:inline-block; background:${brand}; color:#fff; padding:8px 16px; border-radius:4px; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">
           ${escape(v.email_promo_banner_text)}
         </div>
       </td></tr>`
    : "";

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:560px; margin-top:24px; font-family:Arial, sans-serif;">
      ${logoBlock}
      ${nameBlock}
      ${contactBlock}
      ${socialBlock}
      ${promoBlock}
    </table>
  `;
}

// ─── Render del disclaimer + nota "no imprimir" ───────────────────────
function renderDisclaimer(v: Record<string, any>): string {
  const noPrint = `
    <div style="font-size:10px; color:#888; font-style:italic; margin:24px 0 14px 0; padding-top:12px; border-top:1px solid #e5e5e5;">
      Please do not print this email unless it is necessary. Every unprinted email helps the environment.
    </div>
  `;

  const blocks: string[] = [];
  if (present(v.email_disclaimer_es)) {
    blocks.push(`<div style="font-size:9px; color:#888; line-height:1.5; margin-bottom:8px; text-align:justify;">${escape(v.email_disclaimer_es)}</div>`);
  }
  if (present(v.email_disclaimer_en)) {
    blocks.push(`<div style="font-size:9px; color:#888; line-height:1.5; text-align:justify;">${escape(v.email_disclaimer_en)}</div>`);
  }

  return blocks.length > 0
    ? noPrint + blocks.join("")
    : noPrint;
}

// ─── Template principal ──────────────────────────────────────────────
function render(variables: Record<string, any>): RenderedEmail {
  const v          = variables;
  const brand      = v.brand_color      ?? "#1d4ed8";
  const brandDark  = v.brand_color_dark ?? "#0a1628";
  const accent     = v.brand_accent     ?? "#c9a227";

  const greeting = present(v.client_contact_name)
    ? `Estimado/a ${escape(v.client_contact_name)},`
    : "Estimado/a cliente,";

  const subject = present(v.company_name)
    ? `Cotización ${escape(v.quote_number)} — ${escape(v.company_name)}`
    : `Cotización ${escape(v.quote_number)}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#f4f5f7; font-family:Arial, sans-serif; color:#222;">
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%; background:#f4f5f7; padding:24px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:640px; background:#ffffff; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header con color de marca -->
          <tr>
            <td style="background:${brandDark}; height:6px; border-radius:8px 8px 0 0;"></td>
          </tr>

          <!-- Body principal -->
          <tr>
            <td style="padding:32px 36px 24px 36px;">
              <div style="font-size:14px; color:#222; line-height:1.6;">
                <p style="margin:0 0 14px 0; font-weight:600;">${greeting}</p>
                <div style="margin:0 0 18px 0;">${nl2br(v.user_message)}</div>

                <!-- Card resumen de la cotización -->
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%; background:#f9fafb; border:1px solid #e5e7eb; border-left:4px solid ${brand}; border-radius:6px; margin:18px 0;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:11px; color:#666; text-transform:uppercase; letter-spacing:1px; font-weight:700; margin-bottom:6px;">Cotización</div>
                      <div style="font-size:16px; color:${brandDark}; font-weight:800; margin-bottom:10px;">${escape(v.quote_number)}</div>
                      ${present(v.quote_date)      ? `<div style="font-size:12px; color:#444; margin-bottom:3px;"><strong style="color:#666;">Fecha:</strong> ${escape(v.quote_date)}</div>` : ""}
                      ${present(v.valid_until)     ? `<div style="font-size:12px; color:#444; margin-bottom:3px;"><strong style="color:#666;">Vigencia:</strong> ${escape(v.valid_until)}</div>` : ""}
                      ${present(v.total_formatted) ? `<div style="font-size:14px; color:${brand}; font-weight:800; margin-top:8px;">Total: ${escape(v.total_formatted)}</div>` : ""}
                    </td>
                  </tr>
                </table>

                <p style="margin:14px 0 0 0; font-size:12px; color:#666;">El documento PDF se encuentra adjunto a este correo.</p>
              </div>

              <!-- Saludos en 3 idiomas -->
              <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e5e7eb;">
                <span style="font-size:13px; color:${brand}; font-weight:700;">Saludos Cordiales</span>
                <span style="font-size:13px; color:#999; margin:0 8px;">/</span>
                <span style="font-size:13px; color:${brand}; font-weight:700;">Best Regards</span>
                <span style="font-size:13px; color:#999; margin:0 8px;">/</span>
                <span style="font-size:13px; color:${accent}; font-weight:700;">Mit Schönen Grüßen</span>
              </div>

              <!-- Firma corporativa dinámica -->
              ${renderSignature(v)}

              <!-- Disclaimer + no print -->
              ${renderDisclaimer(v)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    html_body:  html,
    category:   "document",
    module_key: "comercial",
  };
}

export const quotationSentTemplate: EmailTemplate = {
  key:        "quotation_sent",
  category:   "document",
  module_key: "comercial",
  render,
};