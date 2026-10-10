import { ReactNode } from "react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { getSessionUser } from "@/lib/server/security"
import { APP_VERSION } from "@/lib/version"
import { ADMIN_GROUP_ORDER, getScreensByGroup } from "@/lib/admin/registry"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role !== "ADMIN") {
    notFound()
  }

  const screensByGroup = getScreensByGroup()

  return (
    <div className="px-4 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href="/api/changelog" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline transition-colors">
              SapoFit v{APP_VERSION}
            </Link>
            <p className="text-xs text-muted-foreground">Admin · usuarios, IA y operación</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hoy" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Volver a la app
            </Link>
            <Link href="/perfil" className="rounded-full border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Perfil
            </Link>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {ADMIN_GROUP_ORDER.map((group) => {
            const screens = screensByGroup[group]
            if (!screens || screens.length === 0) return null
            return (
              <div key={group} className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {group}
                </span>
                <div className="flex items-center gap-1">
                  {screens.map((screen) => (
                    <Link
                      key={screen.id}
                      href={screen.path}
                      className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {screen.title}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
      {children}
    </div>
  )
}
