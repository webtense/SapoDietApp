import { redirect } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { getSessionUser } from "@/lib/server/security"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#daf8e8,_#f7fffb_35%,_#f4f7f6)]">
      <MainNav />
      <main className="pb-20 md:pb-8">{children}</main>
    </div>
  )
}
