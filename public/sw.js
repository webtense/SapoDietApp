/* eslint-disable no-restricted-globals */

self.addEventListener("install", () => {
  // Activate updated SW ASAP to avoid stale PWA state.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // If an older SW version used caches, drop them.
      const keys = await caches.keys().catch(() => [])
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

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
  const body = (data && data.body) || "Tienes una nueva notificacion"
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
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    }),
  )
})
