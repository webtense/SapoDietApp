import { redirect } from "next/navigation"
import { MainNav, MobileNav } from "@/components/main-nav"
import { getSessionUser } from "@/lib/server/security"
import { prisma } from "@/lib/server/prisma"
import { OnboardingGuard } from "@/components/onboarding-guard"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = user.role
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { onboardingCompleted: true },
  })

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(80,200,120,0.18),_#f7fffb_35%,_#f1f6f3)]">
      <OnboardingGuard onboardingCompleted={!!profile?.onboardingCompleted} />
      <div className="mx-auto flex min-h-screen max-w-7xl md:px-4 md:py-4">
        <MainNav userRole={userRole} />
        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1 pb-24 md:pb-8">{children}</main>
        </div>
      </div>
      <MobileNav userRole={userRole} />
    </div>
  )
}
