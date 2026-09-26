/* eslint-disable no-restricted-globals */

// Debe cambiar en cada release (ver lib/version.ts) para invalidar caches antiguas
const CACHE_NAME = "sapofit-v3.8.0-20260926"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith("sapofit-"))
          .map((name) => caches.delete(name)),
      )
      await self.clients.claim()
      // Las pestañas abiertas pueden tener HTML de un build anterior: recargarlas
      const clients = await self.clients.matchAll({ type: "window" })
      await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => null)))
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // Navegaciones (HTML): SIEMPRE red, nunca caché. Un HTML antiguo referencia
  // chunks que dejan de existir tras cada deploy y rompe la app entera.
  if (request.mode === "navigate" || (request.headers.get("Accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            "<!doctype html><meta charset=utf-8><title>SapoFit</title><p style='font-family:sans-serif;padding:2rem'>Sin conexión. Vuelve a intentarlo cuando tengas red.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          ),
      ),
    )
    return
  }

  // API y datos dinámicos: solo red
  if (url.pathname.startsWith("/api/")) return

  // Chunks con hash de Next: inmutables, cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Resto (iconos, manifest, imágenes): red primero, caché como respaldo
  event.respondWith(networkFirst(request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone()).catch(() => null)
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone()).catch(() => null)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response("Offline", { status: 503 })
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
