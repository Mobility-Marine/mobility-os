// services/email/templates/invitation.ts
//
// Template para invitar nuevos usuarios a unirse a una empresa en Mobility OS.

import type { EmailTemplate } from "../types";

type InvitationVariables = {
  invited_email:    string;
  inviter_name:     string;          // nombre del que invita ("Alejandro Reyes")
  company_name:     string;          // ej: "Mobility Marine"
  role_label:       string;          // ej: "Comercial", "Administrador"
  invitation_url:   string;          // link completo con el token
  expires_in_days:  number;          // 7
};

export const invitationTemplate: EmailTemplate = {
  key:        "user_invitation",
  category:   "transactional",
  module_key: "settings",

  render: (vars: Record<string, any>) => {
    const v = vars as InvitationVariables;

    const subject = `${v.inviter_name} te invitó a unirte a ${v.company_name} en Mobility OS`;

    const html_body = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a1628;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f6fa;padding:40px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(10,22,40,0.06);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a5c 100%);padding:32px 40px;text-align:center;">
              <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Mobility OS</div>
              <div style="color:#a8c5e8;font-size:12px;margin-top:6px;letter-spacing:1px;text-transform:uppercase;">Sistema operativo empresarial</div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0a1628;line-height:1.3;">
                Has sido invitado a colaborar
              </h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#3a4a5c;">
                Hola,
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a4a5c;">
                <strong>${v.inviter_name}</strong> te invitó a unirte al espacio de trabajo de
                <strong>${v.company_name}</strong> en Mobility OS con el rol de
                <strong>${v.role_label}</strong>.
              </p>

              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background:#0a1628;">
                    <a href="${v.invitation_url}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 8px;font-size:13px;line-height:1.6;color:#6a7585;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#0a1628;word-break:break-all;background:#f4f6fa;padding:12px 16px;border-radius:6px;border:1px solid #e3e8ef;">
                ${v.invitation_url}
              </p>

              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e3e8ef;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6a7585;">
                  Esta invitación expira en <strong>${v.expires_in_days} días</strong>. Si no esperabas recibir este correo, puedes ignorarlo de forma segura.
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f4f6fa;padding:24px 40px;text-align:center;border-top:1px solid #e3e8ef;">
              <p style="margin:0;font-size:12px;color:#8a95a5;line-height:1.5;">
                Enviado por <strong>Mobility OS</strong> en nombre de ${v.company_name}<br/>
                Este es un mensaje automático. Para responder, hazlo a quien te invitó.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text_body = `
${v.inviter_name} te invitó a unirte a ${v.company_name} en Mobility OS con el rol de ${v.role_label}.

Acepta la invitación aquí:
${v.invitation_url}

Esta invitación expira en ${v.expires_in_days} días.

—
Mobility OS · Sistema operativo empresarial
    `.trim();

    return {
      subject,
      html_body,
      text_body,
      category:   "transactional",
      module_key: "settings",
    };
  },
};
