import { readFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const videoPath = join(process.cwd(), "public/videos/sapofit-marketing.mp4")
  
  try {
    const buffer = await readFile(videoPath)
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch {
    return new NextResponse("Not Found", { status: 404 })
  }
}
