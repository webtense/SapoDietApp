import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/server/email"

const APP_URL = process.env.APP_URL || "https://sapofit.semillasdeti.com"

const COMPANY_NAME = process.env.NEWSLETTER_COMPANY_NAME || "SapoFit (Semillas de Ti)"
const COMPANY_CIF = process.env.NEWSLETTER_COMPANY_CIF || "CIF no configurado"
const COMPANY_ADDRESS = process.env.NEWSLETTER_COMPANY_ADDRESS || "Dirección no configurada"
const COMPANY_PHONE = process.env.NEWSLETTER_COMPANY_PHONE || "Teléfono no configurado"
const PRIVACY_URL = process.env.NEWSLETTER_PRIVACY_URL || `${APP_URL}/landing#privacy`

/** Token único, 32 caracteres, seguro para URL. */
export function generateNewsletterToken(): string {
  return randomBytes(24).toString("base64url").slice(0, 32)
}

export function unsubscribeUrl(token: string): string {
  return `${APP_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

export function confirmUrl(token: string): string {
  return `${APP_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
}

/** Footer LSSI-CE obligatorio para todo correo de newsletter. */
export function newsletterFooterHtml(token: string): string {
  return `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <div style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
      <p>${COMPANY_NAME} · ${COMPANY_CIF}<br/>${COMPANY_ADDRESS} · ${COMPANY_PHONE}</p>
      <p>
        <a href="${PRIVACY_URL}" style="color: #6b7280;">Política de privacidad</a>
        &nbsp;·&nbsp;
        <a href="${unsubscribeUrl(token)}" style="color: #6b7280;">Darme de baja</a>
      </p>
    </div>
  `
}

function newsletterFooterText(token: string): string {
  return `\n\n--\n${COMPANY_NAME} · ${COMPANY_CIF}\n${COMPANY_ADDRESS} · ${COMPANY_PHONE}\nPolítica de privacidad: ${PRIVACY_URL}\nDarme de baja: ${unsubscribeUrl(token)}`
}

export async function sendNewsletterConfirmationEmail(email: string, token: string) {
  const link = confirmUrl(token)
  return sendEmail({
    to: email,
    subject: "Confirma tu suscripción a la newsletter de SapoFit",
    text: `Gracias por suscribirte. Confirma tu email visitando: ${link}${newsletterFooterText(token)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Confirma tu suscripción</h2>
        <p>Gracias por querer recibir la newsletter de SapoFit.</p>
        <p>Para confirmar tu dirección de email, haz clic en el siguiente enlace:</p>
        <a href="${link}"
           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Confirmar suscripción
        </a>
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          Si no solicitaste esto, puedes ignorar este correo.
        </p>
        ${newsletterFooterHtml(token)}
      </div>
    `,
  })
}

export async function sendNewsletterCampaignEmail(email: string, token: string, subject: string, htmlBody: string) {
  return sendEmail({
    to: email,
    subject,
    text: `${subject}${newsletterFooterText(token)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        ${htmlBody}
        ${newsletterFooterHtml(token)}
      </div>
    `,
  })
}
