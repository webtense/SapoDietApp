export const V3_PREFERENCES_KEY = "sapofit-v3-preferences"

export interface V3Preferences {
  primaryGoal: string
  dietStyle: string
  allergies: string
  excludedIngredients: string
  householdSize: number
  hasAirfryer: boolean
  needsTupperMeals: boolean
  experienceLevel: string
  daysPerWeek: string
  sessionDuration: string
  equipmentProfile: string[]
  activityLevel: string
  coupleMode: boolean
}

export const defaultV3Preferences: V3Preferences = {
  primaryGoal: "Perder grasa",
  dietStyle: "Estándar",
  allergies: "",
  excludedIngredients: "",
  householdSize: 1,
  hasAirfryer: false,
  needsTupperMeals: false,
  experienceLevel: "Principiante",
  daysPerWeek: "3",
  sessionDuration: "30",
  equipmentProfile: ["Sin material"],
  activityLevel: "Moderada",
  coupleMode: false,
}

export function parseV3Preferences(input: unknown): V3Preferences {
  if (!input || typeof input !== "object") {
    return defaultV3Preferences
  }

  const data = input as Partial<V3Preferences>

  return {
    primaryGoal: data.primaryGoal || defaultV3Preferences.primaryGoal,
    dietStyle: data.dietStyle || defaultV3Preferences.dietStyle,
    allergies: data.allergies || "",
    excludedIngredients: data.excludedIngredients || "",
    householdSize: Number.isFinite(data.householdSize) ? Math.max(1, Number(data.householdSize)) : 1,
    hasAirfryer: !!data.hasAirfryer,
    needsTupperMeals: !!data.needsTupperMeals,
    experienceLevel: data.experienceLevel || defaultV3Preferences.experienceLevel,
    daysPerWeek: data.daysPerWeek || defaultV3Preferences.daysPerWeek,
    sessionDuration: data.sessionDuration || defaultV3Preferences.sessionDuration,
    equipmentProfile: Array.isArray(data.equipmentProfile) && data.equipmentProfile.length > 0
      ? data.equipmentProfile.map(String)
      : defaultV3Preferences.equipmentProfile,
    activityLevel: data.activityLevel || defaultV3Preferences.activityLevel,
    coupleMode: !!data.coupleMode,
  }
}
