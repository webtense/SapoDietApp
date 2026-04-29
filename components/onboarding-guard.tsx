"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

const ALLOWED_WITHOUT_ONBOARDING = ["/onboarding", "/perfil", "/admin"]

export function OnboardingGuard({ onboardingCompleted }: { onboardingCompleted: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (onboardingCompleted) return
    const allowed = ALLOWED_WITHOUT_ONBOARDING.some(p => pathname === p || pathname.startsWith(p))
    if (!allowed) router.replace("/onboarding")
  }, [onboardingCompleted, pathname, router])

  return null
}
