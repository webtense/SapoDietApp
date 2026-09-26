import { prisma } from "@/lib/server/prisma"

const DEFAULT_MACHINES: { name: string; group: "UPPER" | "LOWER" | "FULL" }[] = [
  { name: "Chest Press", group: "UPPER" },
  { name: "Seated Row", group: "UPPER" },
  { name: "Shoulder Press", group: "UPPER" },
  { name: "Prensa de Piernas (Leg Press)", group: "LOWER" },
  { name: "Curl de Piernas Sentado (Seated Leg Curl)", group: "LOWER" },
  { name: "Extensión de Piernas (Leg Extension)", group: "LOWER" },
  { name: "Smith Machine", group: "LOWER" },
]

export async function seedDefaultMachines(gymId: string): Promise<void> {
  for (const machine of DEFAULT_MACHINES) {
    let model = await prisma.machineModel.findFirst({ where: { name: machine.name } })
    if (!model) {
      model = await prisma.machineModel.create({
        data: { name: machine.name, group: machine.group },
      })
    }

    const existing = await prisma.gymMachine.findFirst({
      where: { gymId, machineModelId: model.id },
    })
    if (!existing) {
      await prisma.gymMachine.create({
        data: { gymId, machineModelId: model.id, active: true },
      })
    }
  }
}
