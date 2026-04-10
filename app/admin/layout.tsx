import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/server/security"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role !== "ADMIN") {
    redirect("/")
  }

  return <div className="px-4 md:px-8">{children}</div>
}
