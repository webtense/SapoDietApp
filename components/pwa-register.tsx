"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.update().catch(() => null))
      .catch(() => {
        // Optional feature: ignore registration errors in unsupported contexts.
      })
  }, [])

  return null
}
