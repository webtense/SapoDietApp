"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ShoppingCart, MapPin, Euro, CheckCircle2, TrendingDown, Package } from "lucide-react"
import {
  type ShoppingList,
  type ShoppingItem,
  agruparPorPasillo,
  obtenerOrdenPasillos,
  calcularEstadisticas,
} from "@/lib/shopping-list-generator"

interface ShoppingListDisplayProps {
  shoppingList: ShoppingList
  onItemToggle: (index: number) => void
  onGenerateNew: () => void
}

export function ShoppingListDisplay({ shoppingList, onItemToggle, onGenerateNew }: ShoppingListDisplayProps) {
  const [vistaActual, setVistaActual] = useState<"pasillos" | "categorias">("pasillos")

  const estadisticas = calcularEstadisticas(shoppingList)
  const itemsPorPasillo = agruparPorPasillo(shoppingList.items)
  const ordenPasillos = obtenerOrdenPasillos(shoppingList.supermercado)

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(precio)
  }

  const formatearFecha = (fecha: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(fecha)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Lista de Compra Semanal</h2>
        <p className="text-muted-foreground">
          {shoppingList.supermercado} • {formatearFecha(shoppingList.fechaCreacion)}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{estadisticas.totalItems}</div>
                <div className="text-sm text-muted-foreground">Productos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{estadisticas.itemsComprados}</div>
                <div className="text-sm text-muted-foreground">Comprados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{formatearPrecio(shoppingList.totalEstimado)}</div>
                <div className="text-sm text-muted-foreground">Estimado</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{Math.round(estadisticas.porcentajeCompletado)}%</div>
                <div className="text-sm text-muted-foreground">Completado</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de compra</span>
              <span>
                {estadisticas.itemsComprados} de {estadisticas.totalItems}
              </span>
            </div>
            <Progress value={estadisticas.porcentajeCompletado} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Controles de vista */}
      <div className="flex gap-2">
        <Button
          variant={vistaActual === "pasillos" ? "default" : "outline"}
          onClick={() => setVistaActual("pasillos")}
          size="sm"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Por Pasillos
        </Button>
        <Button
          variant={vistaActual === "categorias" ? "default" : "outline"}
          onClick={() => setVistaActual("categorias")}
          size="sm"
        >
          <Package className="h-4 w-4 mr-2" />
          Por Categorías
        </Button>
      </div>

      {/* Lista de compra organizada por pasillos */}
      {vistaActual === "pasillos" && (
        <div className="space-y-4">
          {ordenPasillos.map((pasillo) => {
            const itemsPasillo = itemsPorPasillo[pasillo] || []
            if (itemsPasillo.length === 0) return null

            const itemsCompradosPasillo = itemsPasillo.filter((item) => item.comprado).length
            const totalPasillo = itemsPasillo.reduce((sum, item) => sum + (item.precioEstimado || 0), 0)

            return (
              <Card key={pasillo}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{pasillo}</span>
                      <Badge variant="secondary">
                        {itemsCompradosPasillo}/{itemsPasillo.length}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatearPrecio(totalPasillo)}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {itemsPasillo.map((item) => {
                    const globalIndex = shoppingList.items.findIndex((i) =>
                      item.id ? i.id === item.id : i.nombre === item.nombre && i.unidad === item.unidad && i.cantidad === item.cantidad,
                    )

                    return (
                      <ShoppingItemCard
                        key={item.id || `${item.nombre}-${item.unidad}`}
                        item={item}
                        onToggle={() => onItemToggle(globalIndex)}
                      />
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Vista por categorías */}
      {vistaActual === "categorias" && (
        <div className="space-y-4">
          {Object.entries(
            shoppingList.items.reduce(
              (grupos, item) => {
                if (!grupos[item.categoria]) grupos[item.categoria] = []
                grupos[item.categoria].push(item)
                return grupos
              },
              {} as Record<string, ShoppingItem[]>,
            ),
          ).map(([categoria, items]) => (
            <Card key={categoria}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{categoria}</span>
                  <Badge variant="secondary">{items.length} productos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => {
                  const globalIndex = shoppingList.items.findIndex((i) =>
                    item.id ? i.id === item.id : i.nombre === item.nombre && i.unidad === item.unidad && i.cantidad === item.cantidad,
                  )

                  return (
                    <ShoppingItemCard
                      key={item.id || `${item.nombre}-${item.unidad}`}
                      item={item}
                      onToggle={() => onItemToggle(globalIndex)}
                    />
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-4 pt-6">
        <Button onClick={onGenerateNew} variant="outline" className="flex-1 bg-transparent">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Generar Nueva Lista
        </Button>
        <Button onClick={() => window.print()} variant="secondary" className="flex-1">
          Imprimir Lista
        </Button>
      </div>
    </div>
  )
}

function ShoppingItemCard({
  item,
  onToggle,
}: {
  item: ShoppingItem
  onToggle: () => void
}) {
  const formatearCantidad = (cantidad: number, unidad: string) => {
    if (unidad === "g" && cantidad >= 1000) {
      return `${(cantidad / 1000).toFixed(1)} kg`
    }
    if (unidad === "ml" && cantidad >= 1000) {
      return `${(cantidad / 1000).toFixed(1)} L`
    }
    return `${cantidad} ${unidad === "unidad" ? (cantidad === 1 ? "ud" : "uds") : unidad}`
  }

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(precio)
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        item.comprado ? "bg-green-50 border-green-200 opacity-75" : "bg-card border-border hover:bg-accent/50"
      }`}
    >
      <Checkbox checked={item.comprado} onCheckedChange={onToggle} className="flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className={`font-medium ${item.comprado ? "line-through text-muted-foreground" : ""}`}>{item.nombre}</div>
        <div className="text-sm text-muted-foreground">{formatearCantidad(item.cantidad, item.unidad)}</div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-medium">{item.precioEstimado ? formatearPrecio(item.precioEstimado) : "—"}</div>
        <div className="text-xs text-muted-foreground">{item.pasillo}</div>
      </div>
    </div>
  )
}
