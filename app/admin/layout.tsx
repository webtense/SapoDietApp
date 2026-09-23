import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/server/security"
import { AdminLogoutButton } from "@/components/admin-logout-button"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="px-4 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">SapoFit v3.5</p>
          <p className="text-xs text-muted-foreground">Admin · usuarios, IA y operación</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Usuarios
          </Link>
          <Link href="/admin/dashboard" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Métricas
          </Link>
          <Link href="/admin/challenges" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Retos
          </Link>
          <Link href="/admin/backups" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Backups
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
