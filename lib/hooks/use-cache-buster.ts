"use client"

import { useMemo } from "react"

export function useCacheBuster() {
  const version = useMemo(() => {
    if (typeof document !== "undefined") {
      const meta = document.querySelector('meta[name="build-commit"]')
      return meta?.getAttribute("content") || "unknown"
    }
    return "unknown"
  }, [])

  const bustUrl = (url: string): string => {
    if (!url) return url
    if (url.includes("?v=") || url.includes("&v=")) return url
    
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}v=${version}`
  }

  return { version, bustUrl }
}

export function getAssetUrl(path: string, commit?: string): string {
  const v = commit || (typeof document !== "undefined" 
    ? document.querySelector('meta[name="build-commit"]')?.getAttribute("content")
    : "")
  
  if (!v) return path
  
  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}v=${v}`
}
