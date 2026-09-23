import { describe, it, expect, beforeEach, vi } from "vitest"
import * as nutritionService from "@/lib/nutrition/service"

// Mock de Prisma
vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    nutritionistPlan: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    householdMember: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    recipe: {
      create: vi.fn(),
    },
    substitutionGroup: {
      upsert: vi.fn(),
    },
    substitutionItem: {
      upsert: vi.fn(),
    },
    pantryItem: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    eatingOutLog: {
      create: vi.fn(),
    },
  },
}))

describe("Nutrition Service", () => {
  const mockUserId = "user-123"
  const mockPlanId = "plan-456"

  describe("getActivePlan", () => {
    it("debe obtener el plan activo del usuario", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      const mockPlan = {
        id: mockPlanId,
        userId: mockUserId,
        status: "ACTIVE",
        version: 1,
        households: [],
      }

      prisma.nutritionistPlan.findFirst.mockResolvedValueOnce(mockPlan)

      const result = await nutritionService.getActivePlan(mockUserId)

      expect(result).toEqual(mockPlan)
      expect(result.status).toBe("ACTIVE")
    })

    it("debe retornar null si no hay plan activo", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.nutritionistPlan.findFirst.mockResolvedValueOnce(null)

      const result = await nutritionService.getActivePlan(mockUserId)

      expect(result).toBeNull()
    })
  })

  describe("saveNutritionistPlan", () => {
    it("debe crear un nuevo plan si no existe", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.nutritionistPlan.findFirst.mockResolvedValueOnce(null)
      prisma.nutritionistPlan.create.mockResolvedValueOnce({
        id: mockPlanId,
        userId: mockUserId,
        status: "ACTIVE",
        version: 1,
        households: [],
      })

      const result = await nutritionService.saveNutritionistPlan(mockUserId, {
        extractedText: "Plan de nutricionista",
        mealsJson: '{"desayuno": {...}}',
      })

      expect(result.status).toBe("ACTIVE")
      expect(result.version).toBe(1)
      expect(prisma.nutritionistPlan.create).toHaveBeenCalled()
    })

    it("debe archivar plan anterior e incrementar versión", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      const oldPlan = {
        id: "old-plan",
        userId: mockUserId,
        version: 1,
      }

      prisma.nutritionistPlan.findFirst.mockResolvedValueOnce(oldPlan)
      prisma.nutritionistPlan.update.mockResolvedValueOnce({
        ...oldPlan,
        status: "ARCHIVED",
      })
      prisma.nutritionistPlan.create.mockResolvedValueOnce({
        id: mockPlanId,
        userId: mockUserId,
        status: "ACTIVE",
        version: 2,
        households: [],
      })

      const result = await nutritionService.saveNutritionistPlan(mockUserId, {
        extractedText: "Plan v2",
      })

      expect(result.version).toBe(2)
      expect(prisma.nutritionistPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "old-plan" },
          data: { status: "ARCHIVED" },
        })
      )
    })
  })

  describe("addHouseholdMember", () => {
    it("debe añadir un miembro del hogar", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.householdMember.create.mockResolvedValueOnce({
        id: "member-789",
        nutritionistPlanId: mockPlanId,
        name: "Andrés",
        age: 45,
        portionFactor: 1.2,
      })

      const result = await nutritionService.addHouseholdMember(
        mockPlanId,
        "Andrés",
        45,
        1.2
      )

      expect(result.name).toBe("Andrés")
      expect(result.portionFactor).toBe(1.2)
    })
  })

  describe("createRecipe", () => {
    it("debe crear una receta con ingredientes", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.recipe.create.mockResolvedValueOnce({
        id: "recipe-111",
        name: "Pechuga de pollo al horno",
        mealType: "COMIDA",
        ingredients: [
          {
            ingredient: "Pechuga de pollo",
            rawWeight: 150,
          },
        ],
      })

      const result = await nutritionService.createRecipe({
        name: "Pechuga de pollo al horno",
        mealType: "COMIDA",
        ingredients: [
          {
            ingredient: "Pechuga de pollo",
            rawWeight: 150,
          },
        ],
      })

      expect(result.name).toBe("Pechuga de pollo al horno")
      expect(result.ingredients.length).toBe(1)
    })
  })

  describe("addPantryItem", () => {
    it("debe registrar un artículo en la despensa", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.pantryItem.create.mockResolvedValueOnce({
        id: "pantry-222",
        userId: mockUserId,
        name: "Pollo fresco",
        quantity: 500,
        unit: "g",
        expiresAt: new Date("2026-09-25"),
      })

      const result = await nutritionService.addPantryItem(
        mockUserId,
        "Pollo fresco",
        500,
        "g",
        new Date("2026-09-25")
      )

      expect(result.name).toBe("Pollo fresco")
      expect(result.quantity).toBe(500)
      expect(result.unit).toBe("g")
    })
  })

  describe("logEatingOut", () => {
    it("debe registrar comida fuera de casa", async () => {
      const { prisma } = await import("@/lib/server/prisma")

      prisma.eatingOutLog.create.mockResolvedValueOnce({
        id: "eating-out-333",
        userId: mockUserId,
        restaurant: "Pizzería Local",
        mealType: "COMIDA",
        selectedOption: "Ensalada mixta + pechuga a la plancha",
        estimatedCalories: 450,
        estimatedProtein: 45,
      })

      const result = await nutritionService.logEatingOut(mockUserId, {
        restaurant: "Pizzería Local",
        mealType: "COMIDA",
        selectedOption: "Ensalada mixta + pechuga a la plancha",
        estimatedCalories: 450,
        estimatedProtein: 45,
      })

      expect(result.restaurant).toBe("Pizzería Local")
      expect(result.estimatedProtein).toBe(45)
    })
  })
})
