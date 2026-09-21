export type PlanType = "A" | "B" | "C"

export const PLAN_ORDER: readonly PlanType[] = ["A", "B", "C"]

export function nextPlanType(completedCount: number): PlanType {
  const index = ((completedCount % PLAN_ORDER.length) + PLAN_ORDER.length) % PLAN_ORDER.length
  return PLAN_ORDER[index] as PlanType
}
