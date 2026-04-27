"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export function OnboardingGuard({ onboardingCompleted }: { onboardingCompleted: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (onboardingCompleted) return
    if (pathname === "/perfil" || pathname.startsWith("/admin")) return
    router.replace("/perfil")
  }, [onboardingCompleted, pathname, router])

  return null
}
