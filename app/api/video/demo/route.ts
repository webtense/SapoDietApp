import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(req: NextRequest) {
  try {
    const videoPath = join(process.cwd(), "public/videos/sapofit-demo.mp4")
    const fileBuffer = await readFile(videoPath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Video no encontrado" },
      { status: 404 }
    )
  }
}
