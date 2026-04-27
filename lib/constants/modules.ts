export const DEFAULT_MODULE_KEYS = [
  "NUTRITION",
  "TRAINING",
  "SHOPPING",
  "REMINDERS",
  "MEASUREMENTS",
  "CALENDAR",
  "REPORTS",
] as const

export type ModuleKey = (typeof DEFAULT_MODULE_KEYS)[number]
