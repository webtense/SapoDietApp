"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Calendar, Home, ListTodo, MessageSquare, ShoppingCart, Utensils, User, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/inicio", icon: Home, label: "Inicio" },
  { href: "/Hoy", icon: Utensils, label: "Hoy" },
  { href: "/nutricion", icon: Activity, label: "Nutrición" },
  { href: "/entrenamiento", icon: ListTodo, label: "Entreno" },
  { href: "/compra", icon: ShoppingCart, label: "Compra" },
  { href: "/calendario", icon: Calendar, label: "Calendario" },
  { href: "/informes", icon: BarChart3, label: "Informes" },
  { href: "/recordatorios", icon: MessageSquare, label: "Avisos" },
  { href: "/perfil", icon: User, label: "Perfil" },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-2">
        <div className="flex items-center justify-between h-12">
          <Link href="/inicio" className="font-bold text-lg text-emerald-600 shrink-0">
            SapoFit
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-1 rounded-md text-xs transition-colors min-w-fit",
                    isActive
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4 mb-0.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur-sm z-50 md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md text-xs transition-colors",
                isActive ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}