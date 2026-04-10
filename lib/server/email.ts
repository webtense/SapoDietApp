import { createTransport } from "nodemailer"

const config = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

const from = process.env.SMTP_FROM || "SapoFit <noreply@example.com>"

const transporter = config.host
  ? createTransport(config)
  : null

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions) {
  if (!transporter) {
    console.log("[Email] Pretending to send email:", options)
    return { success: true, mock: true }
  }

  try {
    const result = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    return { success: false, error }
  }
}

export async function sendReminderEmail(
  email: string,
  userName: string,
  reminderTitle: string,
  time: string
) {
  return sendEmail({
    to: email,
    subject: `🔔 Recordatorio SapoFit: ${reminderTitle}`,
    text: `Hola ${userName}, es hora de: ${reminderTitle} (${time})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🔔 Recordatorio SapoFit</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Es hora de: <strong>${reminderTitle}</strong></p>
        <p style="color: #6b7280;">Scheduled for: ${time}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          SapoFit - Tu plan de nutrición y entrenamiento personalizado
        </p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "¡Bienvenido a SapoFit! 🎉",
    text: `Hola ${name}, bienvenido a SapoFit. Completa tu perfil para comenzar.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">¡Bienvenido a SapoFit! 🎉</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Gracias por unirte a SapoFit. Para comenzar tu plan:</p>
        <ol>
          <li>Completa tu perfil con tus datos</li>
          <li>Configura tu objetivo</li>
          <li>Genera tu plan personalizado</li>
        </ol>
        <a href="${process.env.APP_URL || "http://localhost:3000"}/perfil" 
           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Completar perfil
        </a>
      </div>
    `,
  })
}