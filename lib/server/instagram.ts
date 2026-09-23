import { prisma } from "@/lib/server/prisma"

// Fuente de datos de Instagram para el dashboard de métricas.
// Si hay token de la Graph API configurado, sincroniza los posts recientes
// contra la tabla InstagramPost (upsert por externalId). Si no, se limita a
// leer lo que se haya dado de alta manualmente desde el propio dashboard.
//
// Variables de entorno necesarias para la sincronización automática:
//   INSTAGRAM_ACCESS_TOKEN         -> token de larga duración de la Graph API
//   INSTAGRAM_BUSINESS_ACCOUNT_ID  -> ID de la cuenta de Instagram Business/Creator

export interface InstagramSummary {
  configured: boolean
  totalPosts: number
  totalLikes: number
  totalComments: number
  avgEngagement: number
  posts: {
    id: string
    caption: string | null
    imageUrl: string | null
    permalink: string | null
    likes: number
    comments: number
    postedAt: string
    source: string
  }[]
  error?: string
}

async function syncFromGraphApi() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (!token || !accountId) return { configured: false as const }

  const fields = "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count"
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media?fields=${fields}&limit=25&access_token=${token}`,
    { cache: "no-store" },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Instagram Graph API ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    data: {
      id: string
      caption?: string
      media_url?: string
      permalink?: string
      timestamp: string
      like_count?: number
      comments_count?: number
    }[]
  }

  await Promise.all(
    json.data.map((post) =>
      prisma.instagramPost.upsert({
        where: { externalId: post.id },
        update: {
          caption: post.caption ?? null,
          imageUrl: post.media_url ?? null,
          permalink: post.permalink ?? null,
          likes: post.like_count ?? 0,
          comments: post.comments_count ?? 0,
          postedAt: new Date(post.timestamp),
        },
        create: {
          externalId: post.id,
          caption: post.caption ?? null,
          imageUrl: post.media_url ?? null,
          permalink: post.permalink ?? null,
          likes: post.like_count ?? 0,
          comments: post.comments_count ?? 0,
          postedAt: new Date(post.timestamp),
          source: "API",
        },
      }),
    ),
  )

  return { configured: true as const }
}

export async function getInstagramSummary(limit = 12): Promise<InstagramSummary> {
  let syncError: string | undefined
  let configured = false

  try {
    const result = await syncFromGraphApi()
    configured = result.configured
  } catch (err) {
    configured = true
    syncError = err instanceof Error ? err.message : "Error desconocido"
  }

  const posts = await prisma.instagramPost.findMany({
    orderBy: { postedAt: "desc" },
    take: limit,
  })

  const totals = posts.reduce(
    (acc, post) => ({
      totalLikes: acc.totalLikes + post.likes,
      totalComments: acc.totalComments + post.comments,
    }),
    { totalLikes: 0, totalComments: 0 },
  )

  return {
    configured,
    totalPosts: posts.length,
    totalLikes: totals.totalLikes,
    totalComments: totals.totalComments,
    avgEngagement: posts.length > 0 ? (totals.totalLikes + totals.totalComments) / posts.length : 0,
    posts: posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      imageUrl: post.imageUrl,
      permalink: post.permalink,
      likes: post.likes,
      comments: post.comments,
      postedAt: post.postedAt.toISOString(),
      source: post.source,
    })),
    error: syncError,
  }
}
