import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

const EVOLUTION_URL = process.env.evolution_URL || "http://172.16.1.52:8080"
const EVOLUTION_API_KEY = process.env.evolution_api

async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const response = await fetch(`${EVOLUTION_URL}/message/sendText/${process.env.evolution_movil}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY || "",
      },
      body: JSON.stringify({
        number: to,
        text: message,
      }),
    })
    return await response.json()
  } catch (error) {
    console.error("WhatsApp send error:", error)
    return { success: false, error }
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const currentDay = now.getDay().toString()
  const currentTime = now.toTimeString().slice(0, 5)

  const reminders = await prisma.reminder.findMany({
    where: { enabled: true },
    include: {
      user: {
        select: { id: true, name: true, phone: true, phoneVerified: true }
      }
    },
  })

  const remindersToSend = reminders.filter((r) => {
    const days = JSON.parse(r.days) as string[]
    return days.includes(currentDay) && r.time === currentTime && r.user.phone
  })

  const results = await Promise.all(
    remindersToSend.map(async (reminder) => {
      if (!reminder.user.phone) return { id: reminder.id, success: false, reason: "no phone" }

      const message = `💧 *SapoFit Recordatorio*\n\n${reminder.user.name || 'Hola'}! Es hora de: *${reminder.title}*\n\n¡Mantén tu rutina de hidratación! 💧`
      
      const result = await sendWhatsAppMessage(reminder.user.phone, message)
      
      return {
        id: reminder.id,
        title: reminder.title,
        userId: reminder.user.id,
        phone: reminder.user.phone,
        success: !!result.key,
        ...(result.key ? {} : { error: result }),
      }
    })
  )

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    executedAt: now.toISOString(),
    total: results.length,
    sent: successful,
    failed,
    results,
  })
}