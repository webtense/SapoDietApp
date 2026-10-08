/**
 * Extrae el ID de vídeo de una URL de YouTube.
 * Soporta: https://youtu.be/ID, https://www.youtube.com/watch?v=ID,
 * https://www.youtube.com/embed/ID y https://www.youtube.com/shorts/ID.
 * Devuelve null si la URL no es válida o no es de YouTube.
 */
export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0]
      return id || null
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v")
      }
      const match = parsed.pathname.match(/^\/(embed|shorts)\/([^/]+)/)
      if (match) return match[2]
    }

    return null
  } catch {
    return null
  }
}

export function getYoutubeThumbnail(url: string | null | undefined): string | null {
  const id = extractYoutubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYoutubeId(url)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}`
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null
}
