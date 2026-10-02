import { readFile } from "fs/promises"
import { join } from "path"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const videoPath = join(process.cwd(), "public/videos/sapofit-marketing.mp4")
    const fileBuffer = await readFile(videoPath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    })
  } catch (error) {
    console.error("Error serving video:", error)
    return NextResponse.json({ error: "Video not found" }, { status: 404 })
  }
}
