/* eslint-disable no-restricted-globals */

// Debe cambiar en cada release (ver lib/version.ts) para invalidar caches antiguas
const CACHE_NAME = "sapofit-v3.7.5-20260924"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
]

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpiar caches antiguos (todos excepto el actual)
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith("sapofit-"))
          .map((name) => {
            console.log(`🗑️ Deleting old cache: ${name}`)
            return caches.delete(name)
          })
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome extensions and external origins
  if (url.protocol === "chrome-extension:" || url.origin !== location.origin) return

  // API calls: network-first with fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request))
    return
  }

  // HTML/JS/CSS: network-first para siempre obtener lo más nuevo
  if (
    url.pathname === "/" ||
    url.pathname.endsWith(".html") ||
    url.pathname.includes("_next") ||
    url.pathname.includes(".js") ||
    url.pathname.includes(".css")
  ) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request))
})

// Network-first strategy: intenta red primero, cache como fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request.clone())
    if (!response || response.status !== 200 || response.type === "error") {
      return response
    }

    // Cache la respuesta exitosa
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone()).catch(() => null)

    return response
  } catch (error) {
    // Red falló, intenta cache
    const cached = await caches.match(request)
    if (cached) return cached

    // Si es HTML y no hay cache, devolver página offline
    if (request.headers.get("Accept")?.includes("text/html")) {
      const offline = await caches.match("/")
      if (offline) return offline
    }

    return new Response("Offline", { status: 503 })
  }
}

// Cache-first strategy: cache primero, red como fallback
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request.clone())
    if (!response || response.status !== 200) return response

    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone()).catch(() => null)

    return response
  } catch {
    return new Response("Resource not found offline", { status: 404 })
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  let data = null
  try {
    data = event.data ? event.data.json() : null
  } catch {
    try {
      data = event.data ? { body: event.data.text() } : null
    } catch {
      data = null
    }
  }

  const title = (data && data.title) || "SapoFit"
  const body = (data && data.body) || "Tienes una nueva notificación"
  const url = (data && data.url) || "/inicio"

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || "/inicio"
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) return client.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow(url)
        return undefined
      }),
  )
})
