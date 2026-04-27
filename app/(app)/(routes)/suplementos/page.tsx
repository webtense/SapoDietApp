"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ChevronDown, ChevronUp, Pill } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MOMENT_LABELS,
  SUPPLEMENT_BRANDS,
  SUPPLEMENTS_KEY,
  getBrand,
  getTodayProtocol,
  type SupplementBrand,
} from "@/lib/supplements"

const BRAND_COLORS: Record<string, string> = {
  orange: "bg-orange-50 border-orange-200 text-orange-800",
  blue: "bg-blue-50 border-blue-200 text-blue-800",
  green: "bg-green-50 border-green-200 text-green-800",
  purple: "bg-purple-50 border-purple-200 text-purple-800",
  teal: "bg-teal-50 border-teal-200 text-teal-800",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
}

const BADGE_COLORS: Record<string, string> = {
  orange: "bg-orange-100 text-orange-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  purple: "bg-purple-100 text-purple-800",
  teal: "bg-teal-100 text-teal-800",
  emerald: "bg-emerald-100 text-emerald-800",
}

export default function SuplementosPage() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = window.localStorage.getItem(SUPPLEMENTS_KEY)
    if (stored) setSelectedBrandId(stored)
  }, [])

  const selectBrand = (id: string) => {
    const next = selectedBrandId === id ? null : id
    if (next) {
      window.localStorage.setItem(SUPPLEMENTS_KEY, next)
    } else {
      window.localStorage.removeItem(SUPPLEMENTS_KEY)
    }
    setSelectedBrandId(next)
    setExpandedProducts(new Set())
  }

  const toggleProduct = (id: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeBrand: SupplementBrand | undefined = selectedBrandId ? getBrand(selectedBrandId) : undefined
  const protocol = activeBrand ? getTodayProtocol(activeBrand) : []

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(139,92,246,0.15),_rgba(255,255,255,0.95))] p-5 shadow-sm">
        <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-purple-700">Suplementación</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Suplementos</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Selecciona tu marca de suplementos y cada día verás exactamente qué tomar, cuándo y cómo prepararlo, adaptado a tu plan.
        </p>
      </section>

      {/* Selector de marca */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPLEMENT_BRANDS.map((brand) => {
          const active = selectedBrandId === brand.id
          return (
            <button
              key={brand.id}
              onClick={() => selectBrand(brand.id)}
              className={`relative rounded-[1.5rem] border-2 p-4 text-left transition-all ${
                active
                  ? `${BRAND_COLORS[brand.color]} border-current shadow-md`
                  : "border-transparent bg-white/80 shadow-sm hover:shadow-md"
              }`}
            >
              {active && (
                <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-current" />
              )}
              <p className="font-semibold">{brand.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{brand.tagline}</p>
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${active ? BADGE_COLORS[brand.color] : "bg-muted text-muted-foreground"}`}>
                {brand.focus}
              </span>
            </button>
          )
        })}
      </div>

      {activeBrand && (
        <>
          {/* Protocolo diario */}
          <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pill className="h-4 w-4 text-purple-600" />
                Protocolo diario — {activeBrand.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {protocol.map((slot) => (
                <div key={slot.moment} className="rounded-2xl border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{slot.label}</p>
                  <div className="space-y-2">
                    {slot.items.map((item, i) => (
                      <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <Badge variant="secondary" className="flex-shrink-0 text-[10px]">{item.amount}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detalle de productos */}
          <div className="space-y-3">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Todos los productos</h2>
            {activeBrand.products.map((product) => {
              const open = expandedProducts.has(product.id)
              return (
                <Card key={product.id} className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
                  <button
                    className="flex w-full items-center justify-between p-5 text-left"
                    onClick={() => toggleProduct(product.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{product.benefit}</p>
                    </div>
                    {open ? <ChevronUp className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="ml-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                  </button>

                  {open && (
                    <CardContent className="space-y-3 px-5 pb-5 pt-0">
                      {product.doses.map((dose, i) => (
                        <div key={i} className="rounded-2xl bg-muted/50 p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{dose.amount}</Badge>
                            <span className="text-xs font-medium text-purple-700">{MOMENT_LABELS[dose.moment]}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{dose.instruction}</p>
                        </div>
                      ))}
                      {product.tip && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                          <span className="font-semibold">Consejo: </span>{product.tip}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!activeBrand && (
        <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
          <CardContent className="p-8 text-center">
            <Pill className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Selecciona una marca para ver tu protocolo diario personalizado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
