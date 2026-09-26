import { prisma } from "@/lib/server/prisma";

export async function getOrCreateTodayWorkout(
  userId: string,
  group: "UPPER" | "LOWER"
) {
  const profile = await prisma.profile.findUnique({ where: { userId } });

  if (!profile?.gymId) {
    return { needsGym: true as const, session: null, plan: null, exercises: [] };
  }

  // 1. Get or create WorkoutPlan
  const plan = await prisma.workoutPlan.upsert({
    where: {
      userId_planType: { userId, planType: group },
    },
    create: {
      userId,
      planType: group,
    },
    update: {},
  });

  // 2. Get active GymMachines of the user's active gym for this group (FULL cuenta en ambos)
  const machines = await prisma.gymMachine.findMany({
    where: {
      gymId: profile.gymId,
      active: true,
      machineModel: {
        group: { in: [group, "FULL"] },
      },
    },
    include: {
      machineModel: {
        select: {
          id: true,
          name: true,
          group: true,
          description: true,
          instructions: true,
          tips: true,
          recommendedWeight: true,
        },
      },
    },
  });

  // 3. Sync WorkoutExercises for this plan
  const existingExercises = await prisma.workoutExercise.findMany({
    where: { workoutPlanId: plan.id },
  });

  const exerciseMap = new Map(
    existingExercises.map((ex) => [ex.gymMachineId, ex])
  );

  for (let i = 0; i < machines.length; i++) {
    const machine = machines[i];

    if (exerciseMap.has(machine.id)) {
      continue;
    }

    let exercise = await prisma.exercise.findFirst({
      where: {
        machineModelId: machine.machineModelId,
        name: machine.machineModel.name,
      },
    });

    if (!exercise) {
      exercise = await prisma.exercise.create({
        data: {
          name: machine.machineModel.name,
          machineModelId: machine.machineModelId,
        },
      });
    }

    await prisma.workoutExercise.create({
      data: {
        workoutPlanId: plan.id,
        exerciseId: exercise.id,
        gymMachineId: machine.id,
        order: i + 1,
        plannedSets: 3,
        plannedReps: 12,
      },
    });
  }

  // 4. Get or create today's session
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let session = await prisma.workoutSession.findFirst({
    where: {
      userId,
      workoutPlanId: plan.id,
      completedAt: null,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (!session) {
    session = await prisma.workoutSession.create({
      data: {
        userId,
        workoutPlanId: plan.id,
      },
    });
  }

  const currentMachineIds = new Set(machines.map((m) => m.id));

  const exercises = (
    await prisma.workoutExercise.findMany({
      where: { workoutPlanId: plan.id },
      include: {
        exercise: true,
        gymMachine: {
          include: {
            machineModel: true,
          },
        },
      },
      orderBy: { order: "asc" },
    })
  ).filter((ex) => ex.gymMachineId && currentMachineIds.has(ex.gymMachineId));

  // Enrich exercises with their sets for today's session
  const exercisesWithSets = await Promise.all(
    exercises.map(async (ex) => {
      const sets = await prisma.workoutSet.findMany({
        where: {
          workoutSessionId: session.id,
          workoutExerciseId: ex.id,
        },
        orderBy: { setNumber: "asc" },
      });
      return { ...ex, workoutSets: sets };
    })
  );

  return { needsGym: false as const, session, plan, exercises: exercisesWithSets };
}

export async function upsertSet(
  userId: string,
  {
    workoutSessionId,
    workoutExerciseId,
    setNumber,
    weight,
    reps = 12,
  }: {
    workoutSessionId: string;
    workoutExerciseId: string;
    setNumber: number;
    weight: number;
    reps?: number;
  }
) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: workoutSessionId, userId },
  });

  if (!session) {
    throw new Error("Session not found or not owned by user");
  }

  return prisma.workoutSet.upsert({
    where: {
      workoutSessionId_workoutExerciseId_setNumber: {
        workoutSessionId,
        workoutExerciseId,
        setNumber,
      },
    },
    create: {
      workoutSessionId,
      workoutExerciseId,
      setNumber,
      weight,
      reps,
      completed: true,
    },
    update: {
      weight,
      reps,
    },
  });
}

export async function endWorkoutSession(
  userId: string,
  sessionId: string,
  notes?: string
) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new Error("Session not found or not owned by user");
  }

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
      notes,
    },
  });
}
