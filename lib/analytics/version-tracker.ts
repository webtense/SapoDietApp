export type VersionEvent =
  | "VERSION_DETECTED"
  | "UPDATE_AVAILABLE"
  | "UPDATE_CLICKED"
  | "FORCE_UPDATE_APPLIED"
  | "CHANGELOG_VIEWED"
  | "PWA_PROMPT_SHOWN"
  | "PWA_INSTALLED"

export const VERSION_EVENTS: VersionEvent[] = [
  "VERSION_DETECTED",
  "UPDATE_AVAILABLE",
  "UPDATE_CLICKED",
  "FORCE_UPDATE_APPLIED",
  "CHANGELOG_VIEWED",
  "PWA_PROMPT_SHOWN",
  "PWA_INSTALLED",
]

export function trackVersionEvent(
  event: VersionEvent,
  data: { version?: string; oldVersion?: string; metadata?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return
  try {
    fetch("/api/analytics/version", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...data }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // analytics nunca debe romper la app
  }
}
