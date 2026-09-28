"use client"

// Cola de series de entrenamiento pendientes de subir. Guardar un peso NUNCA debe
// perderse por falta de red: si el POST falla, la serie se guarda aquí y se
// reintenta sola en cuanto vuelva la conexión o se recargue la pantalla.

export interface PendingSet {
  id: string
  workoutSessionId: string
  workoutExerciseId: string
  setNumber: number
  weight: number
  reps: number
  createdAt: number
}

const STORAGE_KEY = "sapofit_pending_sets_v1"

function readQueue(): PendingSet[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PendingSet[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: PendingSet[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage lleno o bloqueado: no hay mucho más que hacer, pero no debe
    // romper el guardado en memoria que ya se hizo de forma optimista.
  }
}

export function enqueuePendingSet(entry: Omit<PendingSet, "id" | "createdAt">): PendingSet {
  const pending: PendingSet = {
    ...entry,
    id: `${entry.workoutExerciseId}-${entry.setNumber}-${Date.now()}`,
    createdAt: Date.now(),
  }
  const queue = readQueue()
  // Si ya había una entrada pendiente para el mismo ejercicio+serie, se reemplaza
  // (el usuario corrigió el peso antes de que se subiera la anterior).
  const filtered = queue.filter(
    (p) => !(p.workoutExerciseId === entry.workoutExerciseId && p.setNumber === entry.setNumber),
  )
  writeQueue([...filtered, pending])
  return pending
}

export function getPendingSets(): PendingSet[] {
  return readQueue()
}

export function removePendingSet(id: string) {
  writeQueue(readQueue().filter((p) => p.id !== id))
}

export function countPendingSets(): number {
  return readQueue().length
}

export async function flushPendingSets(
  onFlushed?: (entry: PendingSet, ok: boolean) => void,
): Promise<{ synced: number; remaining: number }> {
  const queue = readQueue()
  let synced = 0

  for (const entry of queue) {
    try {
      const res = await fetch(`/api/user/workout/exercise/${entry.workoutExerciseId}/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutSessionId: entry.workoutSessionId,
          setNumber: entry.setNumber,
          weight: entry.weight,
          reps: entry.reps,
        }),
      })
      if (res.ok) {
        removePendingSet(entry.id)
        synced++
        onFlushed?.(entry, true)
      } else {
        onFlushed?.(entry, false)
      }
    } catch {
      // sigue sin haber red: se queda en la cola para el siguiente intento
      onFlushed?.(entry, false)
    }
  }

  return { synced, remaining: countPendingSets() }
}
