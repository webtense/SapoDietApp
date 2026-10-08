/**
 * Busca sugerencias de vídeos de YouTube para las máquinas que aún no tienen videoUrl.
 *
 * - Si existe la variable de entorno YOUTUBE_API_KEY, usa la YouTube Data API v3
 *   para buscar y propone el top 3 de resultados por máquina.
 * - Si NO existe la API key, genera igualmente el log con el enlace de búsqueda
 *   manual de YouTube para que el admin revise y pegue la URL en /admin/machines.
 *
 * Esto NUNCA guarda automáticamente un videoUrl: solo propone. El admin decide
 * y guarda manualmente desde la UI de administración.
 *
 * Uso:
 *   npx tsx scripts/seed-machine-videos.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { writeFile } from "fs/promises"
import path from "path"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

interface Suggestion {
  title: string
  url: string
  channel: string
  thumbnail: string
}

interface MachineSuggestion {
  machineId: string
  machineName: string
  searchQuery: string
  manualSearchUrl: string
  suggestions: Suggestion[]
}

function buildSearchQuery(machineName: string) {
  return `"${machineName} form" OR "${machineName} technique" OR "${machineName} demo"`
}

function manualSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

async function searchYoutube(query: string): Promise<Suggestion[]> {
  if (!YOUTUBE_API_KEY) return []

  const url = new URL("https://www.googleapis.com/youtube/v3/search")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("q", query)
  url.searchParams.set("type", "video")
  url.searchParams.set("maxResults", "3")
  url.searchParams.set("key", YOUTUBE_API_KEY)
  url.searchParams.set("safeSearch", "strict")
  url.searchParams.set("relevanceLanguage", "es")

  const res = await fetch(url.toString())
  if (!res.ok) {
    console.error(`  ⚠️  Error de la API de YouTube (${res.status}): ${await res.text()}`)
    return []
  }

  const data = await res.json()
  return (data.items ?? []).map((item: any) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? "",
  }))
}

async function main() {
  const machines = await prisma.machineModel.findMany({
    where: { videoUrl: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  if (machines.length === 0) {
    console.log("✅ Todas las máquinas ya tienen un vídeo asignado.")
    return
  }

  console.log(`🔍 ${machines.length} máquinas sin vídeo de demostración.`)
  console.log(
    YOUTUBE_API_KEY
      ? "   Usando YouTube Data API v3 para proponer resultados.\n"
      : "   ⚠️  No hay YOUTUBE_API_KEY configurada: se generarán enlaces de búsqueda manual.\n"
  )

  const results: MachineSuggestion[] = []

  for (const machine of machines) {
    const query = buildSearchQuery(machine.name)
    console.log(`→ ${machine.name}`)
    console.log(`  Query: ${query}`)

    let suggestions: Suggestion[] = []
    try {
      suggestions = await searchYoutube(query)
    } catch (err) {
      console.error(`  ⚠️  Error buscando "${machine.name}":`, err)
    }

    if (suggestions.length > 0) {
      suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s.title} — ${s.url}`))
    } else {
      console.log(`  Sin API key / sin resultados. Buscar manualmente: ${manualSearchUrl(query)}`)
    }

    results.push({
      machineId: machine.id,
      machineName: machine.name,
      searchQuery: query,
      manualSearchUrl: manualSearchUrl(query),
      suggestions,
    })

    // Evitar rate-limit de la API si está activa
    if (YOUTUBE_API_KEY) await new Promise((r) => setTimeout(r, 300))
  }

  const outPath = path.join(process.cwd(), "scripts", "machine-video-suggestions.json")
  await writeFile(outPath, JSON.stringify(results, null, 2), "utf-8")
  console.log(`\n📝 Sugerencias guardadas en ${outPath}`)
  console.log("   Ningún videoUrl se ha guardado automáticamente.")
  console.log("   Revisa el log/JSON y pega la URL elegida en /admin/machines.")
}

main()
  .catch((e) => console.error("❌ Error:", e))
  .finally(() => prisma.$disconnect())
