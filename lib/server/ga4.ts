import crypto from "crypto"

// Cliente mínimo de la Google Analytics Data API (GA4) usando REST + JWT
// firmado a mano (sin añadir dependencias nuevas al proyecto).
//
// Variables de entorno necesarias:
//   GA4_PROPERTY_ID              -> ID numérico de la propiedad GA4 (sin "properties/")
//   GA4_CLIENT_EMAIL             -> email de la cuenta de servicio
//   GA4_PRIVATE_KEY              -> clave privada de la cuenta de servicio (con \n escapados)
//
// La cuenta de servicio debe tener acceso de "Viewer" en la propiedad GA4
// (Admin > Property Access Management en Google Analytics).

interface GA4DayRow {
  date: string
  sessions: number
  activeUsers: number
  pageViews: number
}

export interface GA4Summary {
  configured: boolean
  totalSessions: number
  totalActiveUsers: number
  totalPageViews: number
  daily: GA4DayRow[]
  error?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token
  }

  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY
  if (!clientEmail || !privateKeyRaw) {
    throw new Error("GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY no configurados")
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n")

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(unsigned)
  signer.end()
  const signature = base64url(signer.sign(privateKey))
  const jwt = `${unsigned}.${signature}`

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Error obteniendo token GA4: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

export async function getGA4Summary(days: number): Promise<GA4Summary> {
  const propertyId = process.env.GA4_PROPERTY_ID
  const empty: GA4Summary = {
    configured: false,
    totalSessions: 0,
    totalActiveUsers: 0,
    totalPageViews: 0,
    daily: [],
  }

  if (!propertyId || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
    return empty
  }

  try {
    const token = await getAccessToken()
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
        cache: "no-store",
      },
    )

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { ...empty, configured: true, error: `GA4 API ${res.status}: ${text.slice(0, 200)}` }
    }

    const json = (await res.json()) as {
      rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
    }

    const daily: GA4DayRow[] = (json.rows || []).map((row) => {
      const [y, m, d] = [row.dimensionValues[0].value.slice(0, 4), row.dimensionValues[0].value.slice(4, 6), row.dimensionValues[0].value.slice(6, 8)]
      return {
        date: `${y}-${m}-${d}`,
        sessions: Number(row.metricValues[0]?.value || 0),
        activeUsers: Number(row.metricValues[1]?.value || 0),
        pageViews: Number(row.metricValues[2]?.value || 0),
      }
    })

    const totals = daily.reduce(
      (acc, row) => ({
        totalSessions: acc.totalSessions + row.sessions,
        totalActiveUsers: acc.totalActiveUsers + row.activeUsers,
        totalPageViews: acc.totalPageViews + row.pageViews,
      }),
      { totalSessions: 0, totalActiveUsers: 0, totalPageViews: 0 },
    )

    return { configured: true, daily, ...totals }
  } catch (err) {
    return { ...empty, configured: true, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}
