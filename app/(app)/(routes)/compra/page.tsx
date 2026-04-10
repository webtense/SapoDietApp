"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, CheckCircle2, Circle, Store, RotateCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

export default function CompraPage() {
  const [loading, setLoading] = useState(true)
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [supermercado, setSupermercado] = useState("")
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/shopping")
      if (res.ok) {
        const data = await res.json()
        if (data.shoppingList) {
          setShoppingList(data.shoppingList.items || [])
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
    const newList = [...shoppingList]
    newList[index] = { ...item, comprado: !item.comprado }
    setShoppingList(newList)

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
        setShoppingList(data.shoppingList.items || [])
        setSupermercado(data.shoppingList.supermarket || "")
        setTotal(data.shoppingList.totalEstimated || 0)
      }
    }
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const purchasedCount = shoppingList.filter(i => i.comprado).length
  const progress = shoppingList.length > 0 ? Math.round((purchasedCount / shoppingList.length) * 100) : 0

  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lista de compra</h1>
        <Button variant="outline" size="sm" onClick={generarNuevaLista}>
          <RotateCw className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

      {supermercado && (
        <Card className="bg-blue-50">
          <CardContent className="p-3 flex items-center gap-2">
            <Store className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{supermercado}</span>
            {total > 0 && (
              <span className="ml-auto font-medium">{total.toFixed(2)}€</span>
            )}
          </CardContent>
        </Card>
      )}

      {shoppingList.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progreso</span>
              <span className="text-sm font-medium">{purchasedCount}/{shoppingList.length}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {shoppingList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tienes lista de compra</p>
            <Button onClick={generarNuevaLista}>Generar lista</Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([categoria, items]) => (
          <Card key={categoria}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{categoria}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, idx) => {
                const globalIdx = shoppingList.indexOf(item)
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      item.comprado ? "bg-green-50 line-through opacity-60" : "bg-muted/50"
                    }`}
                  >
                    <button 
                      onClick={() => toggleItem(globalIdx)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {item.comprado ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.cantidad} {item.unidad}
                          {item.pasillo && ` • Pasillo ${item.pasillo}`}
                        </p>
                      </div>
                    </button>
                    {item.precioEstimado && (
                      <span className="text-sm text-muted-foreground">{item.precioEstimado.toFixed(2)}€</span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}