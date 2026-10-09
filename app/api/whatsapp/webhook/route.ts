import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/server/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📱 WhatsApp webhook received:', body)

    // Body típico de Evolution:
    // {
    //   "event": "messages.upsert",
    //   "data": {
    //     "key": { "remoteJid": "34XXX@s.whatsapp.net", "id": "ABC123", "fromMe": false },
    //     "message": { "conversation": "Texto del mensaje" },
    //     "pushName": "Nombre contacto"
    //   }
    // }

    const { event, data } = body

    if (event === 'messages.upsert' && data?.data?.message) {
      const { key, message, pushName } = data.data
      const phoneNumber = key?.remoteJid?.split('@')?.[0]
      const text = message?.conversation || message?.text || ''
      const fromMe = key?.fromMe === true

      // Guardar en BD (opcional)
      if (!fromMe && phoneNumber && text) {
        console.log(`💬 Mensaje desde ${phoneNumber}: ${text}`)

        // Aquí puedes procesar el mensaje:
        // - Guardar en tabla de mensajes
        // - Enviar al chatbot
        // - Alertar al admin
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
