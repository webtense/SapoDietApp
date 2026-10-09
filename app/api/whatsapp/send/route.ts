import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/server/security'

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'sapofit-evolution-2026'
const EVOLUTION_BASE_URL = process.env.EVOLUTION_BASE_URL || 'https://evolution.webtenseenergy.com'
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'sapofit'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { number, message, delay = 3000 } = await req.json()

    if (!number || !message) {
      return NextResponse.json({ error: 'Missing number or message' }, { status: 400 })
    }

    // Normalizar número (agregar +34 si es necesario)
    let phoneNumber = number
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+34${phoneNumber}`
    }

    // Enviar por Evolution API
    const response = await fetch(`${EVOLUTION_BASE_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
        delay,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send message', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent',
      messageId: data.key?.id,
    })
  } catch (err: any) {
    console.error('WhatsApp send error:', err)
    return NextResponse.json(
      { error: 'Send failed: ' + err.message },
      { status: 500 }
    )
  }
}
