"use client"

import { use, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, FileText, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ShareItem = {
  id: string
  name: string
  amount: number
  unit: string
  category: string
  aisle: string
  purchased: boolean
  estimatedPrice?: number | null
  actualPrice?: number | null
}

export default function SharedShoppingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [status, setStatus] = useState("")

  useEffect(() => {
    if (!token) return
    const load = async () => {
      const res = await fetch(`/api/shopping/share/${token}`)
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setList(data.shoppingList)
        setPriceDrafts(
          Object.fromEntries((data.shoppingList.items || []).map((item: ShareItem) => [item.id, item.actualPrice ?? item.estimatedPrice ?? ""]))
        )
      } else {
        setStatus(data?.error || "Enlace no disponible")
      }
      setLoading(false)
    }
    load()
  }, [token])

  const grouped = useMemo(() => {
    if (!list?.items) return {} as Record<string, ShareItem[]>
    return list.items.reduce((acc: Record<string, ShareItem[]>, item: ShareItem) => {
      const key = item.aisle || item.category || "General"
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [list])

  const savePrice = async (itemId: string) => {
    const actualPrice = Number(priceDrafts[itemId])
    if (!Number.isFinite(actualPrice)) return

    const res = await fetch(`/api/shopping/share/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, actualPrice }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setStatus(data?.error || "No se pudo guardar el precio")
      return
    }

    setList((current: any) => ({
      ...current,
      items: current.items.map((item: ShareItem) => item.id === itemId ? { ...item, actualPrice } : item),
    }))
    setStatus("Precio real guardado")
  }

  if (loading) return <div className="p-6 text-center">Cargando lista...</div>
  if (!list) return <div className="p-6 text-center text-muted-foreground">{status || "Enlace no disponible"}</div>

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(80,200,120,0.16),_rgba(255,255,255,0.95))] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">Compra compartida</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Lista de compra SapoFit</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Supermercado {list.supermarket}. Puedes consultar la lista y actualizar precios reales para mejorar las siguientes estimaciones.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/shopping/share/${token}?format=pdf`} target="_blank" rel="noreferrer">
              <FileText className="mr-1 h-4 w-4" /> PDF
            </a>
          </Button>
        </div>
      </section>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      {Object.entries(grouped).map(([aisle, items]) => {
        const typedItems = items as ShareItem[]
        return (
        <Card key={aisle} className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{aisle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typedItems.map((item) => (
              <div key={item.id} className="rounded-2xl bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.purchased ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.amount} {item.unit} · {item.category}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{typeof item.actualPrice === "number" ? `${item.actualPrice.toFixed(2)}€` : item.estimatedPrice ? `${item.estimatedPrice.toFixed(2)}€` : "-"}</p>
                    <p className="text-xs text-muted-foreground">{typeof item.actualPrice === "number" ? "precio real" : "estimado"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={priceDrafts[item.id] ?? ""}
                    onChange={(e) => setPriceDrafts((current) => ({ ...current, [item.id]: e.target.value }))}
                    placeholder="Precio real"
                    className="sm:max-w-[180px]"
                  />
                  <Button variant="outline" onClick={() => savePrice(item.id)}>
                    <Save className="h-4 w-4" /> Guardar precio
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
