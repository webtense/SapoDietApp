-- AddColumn maxWeight a WorkoutSet para tracking de máximos históricos por usuario/ejercicio
ALTER TABLE "WorkoutSet" ADD COLUMN "maxWeight" DOUBLE PRECISION;

-- Index para búsquedas rápidas de máximo por usuario y ejercicio
CREATE INDEX "WorkoutSet_workoutExerciseId_maxWeight_idx" ON "WorkoutSet"("workoutExerciseId", "maxWeight" DESC);
