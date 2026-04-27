"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Calendar, Flame, Home, ListTodo, MessageSquare, Pill, ShoppingCart, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/inicio", icon: Home, label: "Inicio" },
  { href: "/Hoy", icon: ShoppingCart, label: "Hoy" },
  { href: "/nutricion", icon: Activity, label: "Nutrición" },
  { href: "/entrenamiento", icon: ListTodo, label: "Entreno" },
  { href: "/compra", icon: ShoppingCart, label: "Compra" },
  { href: "/calendario", icon: Calendar, label: "Calendario" },
  { href: "/informes", icon: BarChart3, label: "Informes" },
  { href: "/recordatorios", icon: MessageSquare, label: "Avisos" },
  { href: "/suplementos", icon: Pill, label: "Suplementos" },
  { href: "/perfil", icon: User, label: "Perfil" },
  { href: "/admin", icon: Settings, label: "Admin", adminOnly: true },
]

const mobileNavItems = [
  { href: "/inicio", icon: Home, label: "Inicio" },
  { href: "/Hoy", icon: ShoppingCart, label: "Hoy" },
  { href: "/nutricion", icon: Activity, label: "Nutrición" },
  { href: "/entrenamiento", icon: ListTodo, label: "Entreno" },
  { href: "/compra", icon: ShoppingCart, label: "Compra" },
]

interface MainNavProps {
  userRole?: string | null
}

export function MainNav({ userRole }: MainNavProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'ADMIN'

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/60 bg-white/75 p-4 backdrop-blur md:flex md:flex-col">
        <Link href="/inicio" className="rounded-3xl border border-emerald-100 bg-[linear-gradient(135deg,_rgba(80,200,120,0.16),_rgba(10,20,14,0.02))] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">SapoFit</p>
              <p className="text-sm text-muted-foreground">Nutrición, entreno y hábitos</p>
            </div>
          </div>
        </Link>

        <div className="mt-6 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="mt-auto rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">SapoFit v3.3</p>
          <p className="mt-1 text-sm text-muted-foreground">Análisis de comida con IA, control de tokens y más.</p>
        </div>
      </aside>
    </>
  )
}

export function MobileNav({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname()
  const isAdmin = userRole === 'ADMIN'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (e) {
      console.error('Logout failed', e)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/60 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="safe-bottom flex h-16 items-center justify-around px-2 overflow-x-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs transition-colors",
                isActive ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex min-w-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs transition-colors",
              pathname === "/admin" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground",
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Admin</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex min-w-14 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs text-muted-foreground transition-colors hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Salir</span>
        </button>
      </div>
    </nav>
  )
}
