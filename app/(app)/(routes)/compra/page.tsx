"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, FileText, RotateCw, Send, ShoppingCart, Store, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  precioReal?: number | null
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
    precioReal: typeof item.precioReal === "number" ? item.precioReal : item.actualPrice,
  }
}

export default function CompraPage() {
  const [loading, setLoading] = useState(true)
  const [shoppingListId, setShoppingListId] = useState("")
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [supermercado, setSupermercado] = useState("")
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<"semanal" | "mensual">("semanal")
  const [householdSize, setHouseholdSize] = useState(1)
  const [sharePhone, setSharePhone] = useState("")
  const [shareLoading, setShareLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

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
          setShoppingListId(data.shoppingList.id || "")
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
        setShoppingListId(data.shoppingList.id || "")
        setShoppingList((data.shoppingList.items || []).map(normalizeShoppingItem))
        setSupermercado(data.shoppingList.supermarket || "")
        setTotal(data.shoppingList.totalEstimated || 0)
        setStatusMessage("Nueva lista generada")
      }
    }
  }

  const exportPdf = () => {
    if (!shoppingListId) return
    window.open(`/api/shopping/export?listId=${shoppingListId}`, "_blank", "noopener,noreferrer")
  }

  const shareViaWhatsApp = async () => {
    if (!sharePhone.trim()) {
      setStatusMessage("Indica un teléfono para compartir la lista")
      return
    }

    setShareLoading(true)
    setStatusMessage("")
    const res = await fetch("/api/shopping/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shoppingListId, toPhone: sharePhone }),
    })
    const data = await res.json().catch(() => null)
    setShareLoading(false)

    if (!res.ok) {
      setStatusMessage(data?.error || "No se pudo compartir la lista")
      return
    }

    setStatusMessage("Lista enviada por WhatsApp con enlace temporal de 24h")
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
  const displayTotal = useMemo(() => shoppingList.reduce((sum, item) => sum + ((item.precioReal ?? item.precioEstimado ?? 0) * multiplier), 0), [shoppingList, multiplier])

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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={!shoppingListId}><FileText className="mr-1 h-4 w-4" /> PDF</Button>
            <Button variant="outline" size="sm" onClick={generarNuevaLista}><RotateCw className="mr-1 h-4 w-4" /> Nueva lista</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Supermercado</p><p className="mt-1 font-medium">{supermercado || "Pendiente"}</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Comensales</p><p className="mt-1 flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-emerald-600" /> {householdSize}</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Estado</p><p className="mt-1 font-medium">{purchasedCount}/{shoppingList.length} artículos</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Estimación</p><p className="mt-1 font-medium">{(displayTotal || total * multiplier).toFixed(2)}€</p></div>
        </div>
      </section>

      <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-medium">Compartir compra por WhatsApp</p>
            <p className="text-sm text-muted-foreground">Enviamos un enlace temporal de 24h y un PDF directo para que otra persona pueda comprar y actualizar precios reales.</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input value={sharePhone} onChange={(e) => setSharePhone(e.target.value)} placeholder="Teléfono destino (+34...)" className="md:max-w-xs" />
            <Button onClick={shareViaWhatsApp} disabled={shareLoading || !shoppingListId}><Send className="h-4 w-4" /> {shareLoading ? "Enviando..." : "Enviar por WhatsApp"}</Button>
          </div>
          {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
        </CardContent>
      </Card>

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
              {[...items].sort((a, b) => Number(a.comprado) - Number(b.comprado)).map((item) => {
                const globalIndex = shoppingList.findIndex((current) => current.id === item.id || (current.nombre === item.nombre && current.categoria === item.categoria))
                return (
                  <div key={`${item.nombre}-${item.id || globalIndex}`} className={`flex items-center justify-between rounded-2xl p-3 ${item.comprado ? "bg-emerald-50 opacity-70" : "bg-muted/50"}`}>
                    <button onClick={() => { if (globalIndex !== -1) toggleItem(globalIndex) }} className="flex flex-1 items-center gap-3 text-left">
                      {item.comprado ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-sm text-muted-foreground">{item.cantidadAjustada} {item.unidad} · {item.categoria}</p>
                      </div>
                    </button>
                    <div className="text-right text-sm">
                      {typeof item.precioReal === "number" ? (
                        <>
                          <p>{(item.precioReal * multiplier).toFixed(2)}€</p>
                          <p className="text-xs text-emerald-700">real</p>
                        </>
                      ) : item.precioEstimado ? <p>{((item.precioEstimado || 0) * multiplier).toFixed(2)}€</p> : <p className="text-muted-foreground">-</p>}
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
          <p>La lista ya se genera agregada por supermercado y pasillos. Desde aquí puedes exportarla en PDF y compartirla por WhatsApp con enlace temporal para recoger precios reales.</p>
        </CardContent>
      </Card>

      {/* Barra sticky resumen — patrón AnyList/Yazio */}
      {shoppingList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4">
          <div className="flex items-center justify-between rounded-[1.5rem] bg-gray-900/95 px-5 py-3 text-white shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">{purchasedCount} / {shoppingList.length} artículos</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-sm font-semibold">{(displayTotal || total * multiplier).toFixed(2)} €</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
