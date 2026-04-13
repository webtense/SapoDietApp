"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, RotateCw, ShoppingCart, Store, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { defaultV3Preferences, parseV3Preferences, V3_PREFERENCES_KEY } from "@/lib/v3-preferences"

interface ShoppingItem {
  id?: string
  nombre: string
  cantidad: number
  unidad: string
  categoria: string
  pasillo?: string
  comprado: boolean
  precioEstimado?: number
}

function normalizeShoppingItem(item: any): ShoppingItem {
  return {
    id: item.id,
    nombre: item.nombre || item.name || "Producto",
    cantidad: Number(item.cantidad ?? item.amount ?? 0),
    unidad: item.unidad || item.unit || "ud",
    categoria: item.categoria || item.category || "General",
    pasillo: item.pasillo || item.aisle || item.categoria || item.category || "General",
    comprado: Boolean(item.comprado ?? item.purchased),
    precioEstimado: typeof item.precioEstimado === "number" ? item.precioEstimado : item.estimatedPrice,
  }
}

export default function CompraPage() {
  const [loading, setLoading] = useState(true)
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [supermercado, setSupermercado] = useState("")
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<"semanal" | "mensual">("semanal")
  const [householdSize, setHouseholdSize] = useState(1)

  useEffect(() => {
    const load = async () => {
      const stored = window.localStorage.getItem(V3_PREFERENCES_KEY)
      if (stored) {
        const prefs = parseV3Preferences(JSON.parse(stored))
        setHouseholdSize(prefs.householdSize)
      } else {
        setHouseholdSize(defaultV3Preferences.householdSize)
      }

      const res = await fetch("/api/shopping")
      if (res.ok) {
        const data = await res.json()
        if (data.shoppingList) {
          setShoppingList((data.shoppingList.items || []).map(normalizeShoppingItem))
          setSupermercado(data.shoppingList.supermarket || "")
          setTotal(data.shoppingList.totalEstimated || 0)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleItem = async (index: number) => {
    const item = shoppingList[index]
    const next = [...shoppingList]
    next[index] = { ...item, comprado: !item.comprado }
    setShoppingList(next)

    if (item.id) {
      await fetch("/api/shopping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, purchased: !item.comprado }),
      })
    }
  }

  const generarNuevaLista = async () => {
    const res = await fetch("/api/shopping", { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      if (data.shoppingList) {
        setShoppingList((data.shoppingList.items || []).map(normalizeShoppingItem))
        setSupermercado(data.shoppingList.supermarket || "")
        setTotal(data.shoppingList.totalEstimated || 0)
      }
    }
  }

  const multiplier = viewMode === "mensual" ? householdSize * 4 : householdSize
  const adjustedItems = useMemo(() => shoppingList.map((item) => ({ ...item, cantidadAjustada: Number((item.cantidad * multiplier).toFixed(1)) })), [shoppingList, multiplier])
  const groupedByAisle = useMemo(() => adjustedItems.reduce((acc, item) => {
    const key = item.pasillo || item.categoria || "General"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, Array<ShoppingItem & { cantidadAjustada: number }>>), [adjustedItems])
  const purchasedCount = shoppingList.filter((item) => item.comprado).length
  const progress = shoppingList.length ? Math.round((purchasedCount / shoppingList.length) * 100) : 0

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(80,200,120,0.16),_rgba(255,255,255,0.95))] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">Compra inteligente</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Lista de compra</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Agrupada por pasillos y ajustada para modo familia. También puedes alternar una vista mensual para anticipar batch cooking y reposiciones.</p>
          </div>
          <Button variant="outline" size="sm" onClick={generarNuevaLista}><RotateCw className="mr-1 h-4 w-4" /> Nueva lista</Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Supermercado</p><p className="mt-1 font-medium">{supermercado || "Pendiente"}</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Comensales</p><p className="mt-1 flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-emerald-600" /> {householdSize}</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Estado</p><p className="mt-1 font-medium">{purchasedCount}/{shoppingList.length} artículos</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Estimación</p><p className="mt-1 font-medium">{(total * multiplier).toFixed(2)}€</p></div>
        </div>
      </section>

      <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Vista escalable</p>
            <p className="text-sm text-muted-foreground">Semanal para compras rápidas o mensual para planificación avanzada.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "semanal" ? "default" : "outline"} size="sm" onClick={() => setViewMode("semanal")}>Semanal</Button>
            <Button variant={viewMode === "mensual" ? "default" : "outline"} size="sm" onClick={() => setViewMode("mensual")}>Mensual</Button>
          </div>
        </CardContent>
      </Card>

      {shoppingList.length > 0 && (
        <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between text-sm"><span>Progreso</span><span>{progress}%</span></div>
            <div className="h-2 w-full rounded-full bg-muted"><div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          </CardContent>
        </Card>
      )}

      {shoppingList.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><p className="mb-4 text-muted-foreground">No tienes lista de compra todavía.</p><Button onClick={generarNuevaLista}>Generar lista</Button></CardContent></Card>
      ) : (
        Object.entries(groupedByAisle).map(([aisle, items]) => (
          <Card key={aisle} className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{aisle}</span>
                <Badge variant="secondary">{items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const globalIndex = shoppingList.findIndex((current) => current.id === item.id || (current.nombre === item.nombre && current.categoria === item.categoria))
                return (
                  <div key={`${item.nombre}-${item.id || globalIndex}`} className={`flex items-center justify-between rounded-2xl p-3 ${item.comprado ? "bg-emerald-50 opacity-70" : "bg-muted/50"}`}>
                    <button onClick={() => toggleItem(globalIndex)} className="flex flex-1 items-center gap-3 text-left">
                      {item.comprado ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-sm text-muted-foreground">{item.cantidadAjustada} {item.unidad} · {item.categoria}</p>
                      </div>
                    </button>
                    <div className="text-right text-sm">
                      {item.precioEstimado ? <p>{((item.precioEstimado || 0) * multiplier).toFixed(2)}€</p> : <p className="text-muted-foreground">-</p>}
                      {item.pasillo && <p className="text-xs text-muted-foreground">{item.pasillo}</p>}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))
      )}

      <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <Store className="mt-0.5 h-4 w-4 text-emerald-600" />
          <p>La lógica del backend sigue generando una lista base. La capa v3 escala cantidades por comensales y cambia la visualización entre compra semanal y mensual sin tocar todavía el modelo de datos.</p>
        </CardContent>
      </Card>
    </div>
  )
}
