"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Utensils, Dumbbell, Scale, Droplets } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailyLog {
  date: string
  weightKg: number | null
  waterLiters: number | null
  energy: number | null
  mood: number | null
}

interface MealLog {
  date: string
  mealType: string
  completed: boolean
}

interface ExerciseLog {
  date: string
  exerciseId: string
  completed: boolean
}

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/tracking")
      if (res.ok) {
        const data = await res.json()
        if (data.dailyLog) setDailyLogs([data.dailyLog])
        if (data.mealLogs) setMealLogs(data.mealLogs)
        if (data.exerciseLogs) setExerciseLogs(data.exerciseLogs)
      }
      setLoading(false)
    }
    load()
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: { day: number; date: string; inMonth: boolean }[] = []
    
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1)
      days.push({
        day: prevDate.getDate(),
        date: prevDate.toISOString().split("T")[0],
        inMonth: false,
      })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        day: i,
        date: d.toISOString().split("T")[0],
        inMonth: true,
      })
    }
    
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({
        day: i,
        date: nextDate.toISOString().split("T")[0],
        inMonth: false,
      })
    }
    
    return days
  }

  const getLogForDate = (dateStr: string) => {
    const daily = dailyLogs.find(d => d.date?.startsWith(dateStr))
    const meals = mealLogs.filter(m => m.date?.startsWith(dateStr))
    const exercises = exerciseLogs.filter(e => e.date?.startsWith(dateStr))
    
    const mealProgress = meals.length > 0 ? meals.filter(m => m.completed).length / meals.length : 0
    const exerciseProgress = exercises.length > 0 ? exercises.filter(e => e.completed).length : 0
    
    return { daily, mealProgress, exerciseProgress }
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Calendario</h1>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <CardTitle className="text-base capitalize">{monthName}</CardTitle>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
              <div key={d} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((day, idx) => {
              const log = getLogForDate(day.date)
              const isToday = day.date === today
              
              return (
                <div
                  key={idx}
                  className={`p-2 text-sm min-h-[60px] rounded-lg ${
                    !day.inMonth ? "text-muted-foreground/50" : ""
                  } ${isToday ? "bg-emerald-50 ring-2 ring-emerald-500" : "hover:bg-muted/50"}`}
                >
                  <div className="font-medium">{day.day}</div>
                  {day.inMonth && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {log.daily?.weightKg && (
                        <div className="flex items-center justify-center gap-0.5">
                          <Scale className="h-3 w-3 text-blue-500" />
                          <span className="text-[10px]">{log.daily.weightKg}</span>
                        </div>
                      )}
                      {log.mealProgress > 0 && (
                        <div className="w-full bg-muted rounded-full h-1">
                          <div className="bg-green-500 h-1 rounded-full" style={{ width: `${log.mealProgress * 100}%` }} />
                        </div>
                      )}
                      {log.exerciseProgress > 0 && (
                        <div className="flex justify-center">
                          <Dumbbell className="h-3 w-3 text-purple-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Leyenda</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Peso registrado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-green-500 rounded-full" />
            <span className="text-sm">Comidas</span>
          </div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-purple-500" />
            <span className="text-sm">Entreno</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}