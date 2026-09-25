import { describe, it, expect, beforeEach, vi } from "vitest"
import * as trainingService from "@/lib/training/service"

// Mock de Prisma
vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    workoutPlan: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    gymMachine: {
      findMany: vi.fn(),
    },
    exercise: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    workoutExercise: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workoutSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workoutSet: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

describe("Training Service", () => {
  const mockUserId = "user-123"
  const mockPlanId = "plan-456"
  const mockSessionId = "session-789"
  const mockExerciseId = "exercise-111"
  const mockMachineId = "machine-222"

  describe("getOrCreateTodayWorkout", () => {
    it("debe crear un plan si no existe", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.workoutPlan.upsert.mockResolvedValueOnce({
        id: mockPlanId,
        userId: mockUserId,
        planType: "UPPER",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      prisma.gymMachine.findMany.mockResolvedValueOnce([])
      prisma.workoutExercise.findMany.mockResolvedValueOnce([])
      prisma.workoutSession.findFirst.mockResolvedValueOnce(null)
      prisma.workoutSession.create.mockResolvedValueOnce({
        id: mockSessionId,
        userId: mockUserId,
        workoutPlanId: mockPlanId,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      prisma.workoutExercise.findMany.mockResolvedValueOnce([])

      const result = await trainingService.getOrCreateTodayWorkout(mockUserId, "UPPER")

      expect(result.session).toBeDefined()
      expect(result.plan).toBeDefined()
      expect(result.plan.planType).toBe("UPPER")
    })

    it("debe reutilizar plan si ya existe", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      const existingPlan = {
        id: mockPlanId,
        userId: mockUserId,
        planType: "LOWER",
      }

      prisma.workoutPlan.upsert.mockResolvedValueOnce(existingPlan)
      prisma.gymMachine.findMany.mockResolvedValueOnce([])
      prisma.workoutExercise.findMany.mockResolvedValueOnce([])
      prisma.workoutSession.findFirst.mockResolvedValueOnce({
        id: mockSessionId,
        userId: mockUserId,
        workoutPlanId: mockPlanId,
        completedAt: null,
      })
      prisma.workoutExercise.findMany.mockResolvedValueOnce([])

      const result = await trainingService.getOrCreateTodayWorkout(mockUserId, "LOWER")

      expect(result.plan.id).toBe(mockPlanId)
      expect(prisma.workoutPlan.upsert).toHaveBeenCalled()
    })
  })

  describe("upsertSet", () => {
    it("debe guardar una serie de ejercicio", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.workoutSession.findFirst.mockResolvedValueOnce({
        id: mockSessionId,
        userId: mockUserId,
      })

      prisma.workoutSet.upsert.mockResolvedValueOnce({
        id: "set-333",
        workoutSessionId: mockSessionId,
        workoutExerciseId: mockExerciseId,
        setNumber: 1,
        weight: 50,
        reps: 12,
        completed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await trainingService.upsertSet(mockUserId, {
        workoutSessionId: mockSessionId,
        workoutExerciseId: mockExerciseId,
        setNumber: 1,
        weight: 50,
        reps: 12,
      })

      expect(result.weight).toBe(50)
      expect(result.reps).toBe(12)
      expect(prisma.workoutSet.upsert).toHaveBeenCalled()
    })

    it("debe rechazar si la sesión no pertenece al usuario", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.workoutSession.findFirst.mockResolvedValueOnce(null)

      await expect(
        trainingService.upsertSet(mockUserId, {
          workoutSessionId: "otro-session",
          workoutExerciseId: mockExerciseId,
          setNumber: 1,
          weight: 50,
        })
      ).rejects.toThrow("Session not found")
    })
  })

  describe("endWorkoutSession", () => {
    it("debe marcar sesión como completada", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.workoutSession.findFirst.mockResolvedValueOnce({
        id: mockSessionId,
        userId: mockUserId,
      })

      prisma.workoutSession.update.mockResolvedValueOnce({
        id: mockSessionId,
        userId: mockUserId,
        completedAt: new Date(),
        notes: "Sesión completada",
      })

      const result = await trainingService.endWorkoutSession(
        mockUserId,
        mockSessionId,
        "Sesión completada"
      )

      expect(result.completedAt).toBeDefined()
      expect(prisma.workoutSession.update).toHaveBeenCalled()
    })

    it("debe rechazar si la sesión no pertenece al usuario", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.workoutSession.findFirst.mockResolvedValueOnce(null)

      await expect(
        trainingService.endWorkoutSession(mockUserId, "otra-sesion")
      ).rejects.toThrow("Session not found")
    })
  })
})
