import { z } from "zod"

const moduleKeyValues = [
  "NUTRITION",
  "TRAINING",
  "SHOPPING",
  "REMINDERS",
  "MEASUREMENTS",
  "CALENDAR",
  "REPORTS",
] as const

const userStatusValues = ["INVITED", "ACTIVE", "PAUSED", "ARCHIVED"] as const

export const moduleKeySchema = z.enum(moduleKeyValues)
export const userStatusSchema = z.enum(userStatusValues)

export const authSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80).optional(),
})

const invitationTokenSchema = z.string().min(20).max(255)

export const acceptInvitationSchema = z.object({
  token: invitationTokenSchema,
})

export const setPasswordSchema = z.object({
  token: invitationTokenSchema,
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(80).optional(),
})

export const adminCreateUserSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().min(2).max(80),
  priceLabel: z.string().max(60).optional(),
  monthlyPrice: z.number().min(0).max(10000).optional(),
  modules: z.array(moduleKeySchema).optional(),
  sendInvitation: z.boolean().optional(),
})

export const adminCreateInvitationSchema = z
  .object({
    userId: z.string().min(1).optional(),
    email: z.string().email().max(120).optional(),
    name: z.string().min(2).max(80).optional(),
  })
  .refine((data) => !!data.userId || (!!data.email && !!data.name), {
    message: "Debes indicar usuario o email+nombre",
    path: ["userId"],
  })

export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().max(120).optional(),
  name: z.string().min(2).max(80).optional(),
  status: userStatusSchema.optional(),
})

export const adminUpdateModulesSchema = z.object({
  userId: z.string().min(1),
  modules: z
    .array(
      z.object({
        moduleKey: moduleKeySchema,
        enabled: z.boolean(),
      }),
    )
    .min(1),
})

export const adminUpdatePricingSchema = z.object({
  userId: z.string().min(1),
  label: z.string().min(1).max(60),
  monthlyPrice: z.number().min(0).max(10000).optional(),
  currency: z.string().min(3).max(3).optional(),
  notes: z.string().max(250).optional(),
})

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(20).optional(),
  age: z.number().int().min(12).max(100),
  height: z.number().min(120).max(230),
  weight: z.number().min(35).max(250),
  sex: z.enum(["hombre", "mujer"]),
  complexion: z.string().min(2).max(40),
  pesoMeta: z.number().min(30).max(300).optional(),
  tiempoMeta: z.number().int().min(2).max(156).optional(),
  targetDate: z.string().optional(),
  tipoDieta: z.string().min(2).max(60),
  alimentosNoPermitidos: z.string().max(500),
  horaLevantarse: z.string().regex(/^\d{2}:\d{2}$/),
  horaAcostarse: z.string().regex(/^\d{2}:\d{2}$/),
  horaAlmorzar: z.string().regex(/^\d{2}:\d{2}$/),
  supermercado: z.string().min(2).max(80),
  frecuenciaEntrenamiento: z.string().min(1).max(20),
  lugarEntrenamiento: z.array(z.string()).max(5),
  equipamiento: z.array(z.string()).max(8),
})

export const mealLogSchema = z.object({
  dateIso: z.string().datetime(),
  mealType: z.enum(["desayuno", "mediaManana", "almuerzo", "merienda", "cena"]),
  completed: z.boolean(),
  caloriesActual: z.number().min(0).max(5000).optional(),
  notes: z.string().max(250).optional(),
  followsPlan: z.boolean().optional(),
})

export const exerciseLogSchema = z.object({
  dateIso: z.string().datetime(),
  exerciseId: z.string().min(1).max(120),
  completed: z.boolean(),
  durationSec: z.number().int().min(0).max(86_400),
  sets: z.array(z.record(z.string(), z.number())).max(20).optional(),
})

export const dailyLogSchema = z.object({
  dateIso: z.string().datetime(),
  caloriesConsumed: z.number().min(0).max(10000).optional(),
  caloriesTarget: z.number().min(0).max(10000).optional(),
  waterLiters: z.number().min(0).max(15).optional(),
  waterTarget: z.number().min(0).max(15).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(5).optional(),
})

export const shoppingListSchema = z.object({
  supermarket: z.string().min(2).max(80),
  totalEstimated: z.number().min(0).max(5000),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        amount: z.number().min(0).max(100000),
        unit: z.string().min(1).max(20),
        category: z.string().min(1).max(80),
        aisle: z.string().min(1).max(80),
        purchased: z.boolean(),
        estimatedPrice: z.number().min(0).max(1000).optional(),
      }),
    )
    .max(300),
})

export const evolutionSendSchema = z.object({
  message: z.string().min(1).max(2000),
  toPhone: z.string().max(30).optional(),
})

export const evolutionReceiveSchema = z.object({
  fromPhone: z.string().min(1).max(30),
  message: z.string().min(1).max(4000),
  raw: z.unknown().optional(),
})
