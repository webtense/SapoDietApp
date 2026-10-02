import { readFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const videoPath = join(process.cwd(), "public/videos/sapofit-marketing.mp4")
    const fileBuffer = await readFile(videoPath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 })
  }
}
