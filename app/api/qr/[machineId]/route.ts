import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { prisma } from "@/lib/server/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params

  const machine = await prisma.gymMachine.findUnique({
    where: { id: machineId },
    select: { id: true, gymId: true },
  })

  if (!machine) {
    return NextResponse.json({ error: "Máquina no encontrada" }, { status: 404 })
  }

  const payload = JSON.stringify({
    gymId: machine.gymId,
    machineId: machine.id,
    url: `/machines/${machine.id}`,
  })

  try {
    const buffer = await QRCode.toBuffer(payload, { width: 400, margin: 1 })
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (err) {
    console.error("[qr]", err)
    return NextResponse.json({ error: "Error generando el QR" }, { status: 500 })
  }
}
