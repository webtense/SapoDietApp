"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

// Gestionar gimnasios (crear/unirse/añadir máquinas) no depende de tener el
// perfil nutricional/físico completo — se libera para no bloquear esa gestión
// a usuarios que aún no han terminado el onboarding.
const ALLOWED_WITHOUT_ONBOARDING = ["/onboarding", "/perfil", "/admin", "/gimnasios"]

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
