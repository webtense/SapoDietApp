import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

async function handleUnsubscribe(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  const appUrl = process.env.APP_URL || req.nextUrl.origin

  if (!token) {
    return NextResponse.redirect(`${appUrl}/newsletter-error.html`)
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { token } })

  if (!subscriber) {
    return NextResponse.redirect(`${appUrl}/newsletter-error.html`)
  }

  if (subscriber.status !== "UNSUBSCRIBED") {
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    })

    await prisma.newsletterAuditLog.create({
      data: { subscriberId: subscriber.id, action: "UNSUBSCRIBED" },
    })
  }

  return NextResponse.redirect(`${appUrl}/newsletter-unsubscribed.html`)
}

export async function GET(req: NextRequest) {
  return handleUnsubscribe(req)
}

export async function POST(req: NextRequest) {
  return handleUnsubscribe(req)
}
