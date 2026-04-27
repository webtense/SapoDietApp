"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Dumbbell, Scale } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailyLog {
  date: string
  weightKg: number | null
}

interface MealLog {
  date: string
  completed: boolean
}

interface ExerciseLog {
  date: string
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
      const res = await fetch("/api/tracking?type=all")
      if (res.ok) {
        const data = await res.json()
        setDailyLogs(data.dailyLogs || [])
        setMealLogs(data.mealLogs || [])
        setExerciseLogs(data.exerciseLogs || [])
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
      days.push({ day: prevDate.getDate(), date: prevDate.toISOString().split("T")[0], inMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const next = new Date(year, month, i)
      days.push({ day: i, date: next.toISOString().split("T")[0], inMonth: true })
    }

    while (days.length < 42) {
      const next = new Date(year, month + 1, days.length - daysInMonth - startingDay + 1)
      days.push({ day: next.getDate(), date: next.toISOString().split("T")[0], inMonth: false })
    }

    return days
  }

  const getLogForDate = (dateStr: string) => {
    const daily = dailyLogs.find((entry) => entry.date?.startsWith(dateStr))
    const meals = mealLogs.filter((entry) => entry.date?.startsWith(dateStr))
    const exercises = exerciseLogs.filter((entry) => entry.date?.startsWith(dateStr))
    return {
      daily,
      mealDone: meals.some((entry) => entry.completed),
      exerciseDone: exercises.some((entry) => entry.completed),
      fullyDone: meals.some((entry) => entry.completed) || exercises.some((entry) => entry.completed),
    }
  }

  const last30Days = useMemo(() => {
    const days: string[] = []
    for (let index = 29; index >= 0; index -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - index)
      days.push(date.toISOString().split("T")[0])
    }
    return days
  }, [])

  const streakCount = useMemo(() => last30Days.filter((day) => getLogForDate(day).fullyDone).length, [last30Days, mealLogs, exerciseLogs])

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(80,200,120,0.16),_rgba(255,255,255,0.95))] p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Calendario y reto 30 días</h1>
        <p className="mt-2 text-sm text-muted-foreground">La vista v3 convierte el calendario en una superficie de hábito: peso, entreno y checks visuales de adherencia.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Checks últimos 30 días</p><p className="mt-1 text-2xl font-semibold">{streakCount}/30</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Entreno registrado</p><p className="mt-1 text-2xl font-semibold">{exerciseLogs.filter((item) => item.completed).length}</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Comidas marcadas</p><p className="mt-1 text-2xl font-semibold">{mealLogs.filter((item) => item.completed).length}</p></div>
          <div className="rounded-2xl bg-white/85 p-4"><p className="text-xs text-muted-foreground">Pesos guardados</p><p className="mt-1 text-2xl font-semibold">{dailyLogs.filter((item) => item.weightKg).length}</p></div>
        </div>
      </section>

      <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="rounded-2xl p-2 hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
            <CardTitle className="text-base capitalize">{monthName}</CardTitle>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="rounded-2xl p-2 hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((label) => <div key={label} className="py-2 text-xs font-medium text-muted-foreground">{label}</div>)}
            {days.map((day) => {
              const log = getLogForDate(day.date)
              const isToday = day.date === today
              return (
                <div key={day.date} className={`min-h-[76px] rounded-2xl p-2 text-sm ${day.inMonth ? "bg-white" : "bg-muted/35 text-muted-foreground"} ${isToday ? "ring-2 ring-emerald-500" : ""}`}>
                  <div className="font-medium">{day.day}</div>
                  {day.inMonth && (
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${log.fullyDone ? "bg-emerald-500" : "bg-muted"}`} />
                      {log.daily?.weightKg ? <div className="flex items-center gap-1 text-[10px] text-blue-600"><Scale className="h-3 w-3" />{log.daily.weightKg}</div> : <div className="h-3" />}
                      {log.exerciseDone && <Dumbbell className="h-3 w-3 text-purple-500" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-white/70 bg-white/90 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Reto visual 30 días</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2 md:grid-cols-15">
            {last30Days.map((day) => {
              const status = getLogForDate(day)
              return <div key={day} className={`aspect-square rounded-xl ${status.fullyDone ? "bg-emerald-500" : "bg-muted"}`} title={day} />
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
