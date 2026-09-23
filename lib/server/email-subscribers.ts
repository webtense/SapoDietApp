// Recuento de suscriptores de email vía Mailjet (ya usado en el proyecto
// para el envío de correos transaccionales). Usa las credenciales ya
// existentes en el entorno: mailjet_apikey / mailjet_clave_secreta.
//
// Si el proyecto migra a Brevo en el futuro, basta con rellenar
// BREVO_API_KEY y esta función preferirá Brevo automáticamente.

export interface EmailSubscribersSummary {
  configured: boolean
  provider: "mailjet" | "brevo" | null
  totalSubscribers: number
  error?: string
}

async function countFromBrevo(apiKey: string): Promise<number> {
  const res = await fetch("https://api.brevo.com/v3/contacts?limit=1", {
    headers: { "api-key": apiKey, Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Brevo API ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = (await res.json()) as { count?: number }
  return json.count ?? 0
}

async function countFromMailjet(apiKey: string, apiSecret: string): Promise<number> {
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
  const res = await fetch("https://api.mailjet.com/v3/REST/contact?countOnly=1", {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Mailjet API ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = (await res.json()) as { Total?: number }
  return json.Total ?? 0
}

export async function getEmailSubscribersSummary(): Promise<EmailSubscribersSummary> {
  const brevoKey = process.env.BREVO_API_KEY
  const mailjetKey = process.env.mailjet_apikey || process.env.MAILJET_API_KEY
  const mailjetSecret = process.env.mailjet_clave_secreta || process.env.MAILJET_API_SECRET

  try {
    if (brevoKey) {
      const total = await countFromBrevo(brevoKey)
      return { configured: true, provider: "brevo", totalSubscribers: total }
    }
    if (mailjetKey && mailjetSecret) {
      const total = await countFromMailjet(mailjetKey, mailjetSecret)
      return { configured: true, provider: "mailjet", totalSubscribers: total }
    }
    return { configured: false, provider: null, totalSubscribers: 0 }
  } catch (err) {
    return {
      configured: true,
      provider: brevoKey ? "brevo" : "mailjet",
      totalSubscribers: 0,
      error: err instanceof Error ? err.message : "Error desconocido",
    }
  }
}
