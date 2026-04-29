import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/server/security"
import { prisma } from "@/lib/server/prisma"
import { OnboardingFlow } from "@/components/onboarding-flow"

export default async function OnboardingPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { onboardingCompleted: true },
  })

  // Si ya completó el onboarding, redirigir
  if (profile?.onboardingCompleted) redirect("/Hoy")

  return (
    <div className="min-h-screen">
      <OnboardingFlow userName={user.name ?? ""} />
    </div>
  )
}
