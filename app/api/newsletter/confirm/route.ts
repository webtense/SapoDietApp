import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  const appUrl = process.env.APP_URL || req.nextUrl.origin

  if (!token) {
    return NextResponse.redirect(`${appUrl}/newsletter-error.html`)
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { token } })

  if (!subscriber || subscriber.status === "UNSUBSCRIBED") {
    return NextResponse.redirect(`${appUrl}/newsletter-error.html`)
  }

  if (subscriber.status !== "CONFIRMED") {
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    })

    await prisma.newsletterAuditLog.create({
      data: { subscriberId: subscriber.id, action: "CONFIRMED" },
    })
  }

  return NextResponse.redirect(`${appUrl}/newsletter-confirmed.html`)
}
