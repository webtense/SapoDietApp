import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/server/security"
import { prisma } from "@/lib/server/prisma"
import { OnboardingFlowV4 } from "@/components/onboarding-flow-v4"

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
    <div>
      <OnboardingFlowV4 userName={user.name ?? "Usuario"} />
    </div>
  )
}
