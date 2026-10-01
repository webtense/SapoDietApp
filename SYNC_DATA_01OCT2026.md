# 📋 Datos offline — 01/10/2026
## (Para sincronizar cuando vuelva servidor)

**Usuario:** Andrés (admin@sapofit.local)  
**Fecha:** 01/10/2026  
**Estado:** ⏸️ VPS caída — datos en cola para sincronizar

---

## 💪 ENTRENAMIENTOS

### EJERCICIO 1: Remo Sentado (Seated Row)

#### Set 1
- **Peso:** 27 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x27`

#### Set 2
- **Peso:** 32 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x32`

#### Set 3
- **Peso:** 37 kg (32kg + 5kg)
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x32+5`

---

### EJERCICIO 2: Tríceps (Triceps Machine)

#### Set 1
- **Peso:** 45 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x45`

#### Set 2
- **Peso:** 50 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x50`

#### Set 3
- **Peso:** 59 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x59`

---

### EJERCICIO 3: Hombro (Shoulder Machine)

#### Set 1
- **Peso:** 27 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x27`

#### Set 2
- **Peso:** 32 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x32`

#### Set 3
- **Peso:** 32 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x32`

---

### EJERCICIO 4: Bíceps (Biceps Machine)

#### Set 1
- **Peso:** 23 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `23x12`

#### Set 2
- **Peso:** 32 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `32x12`

#### Set 3
- **Peso:** 36 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `36x12`

---

### EJERCICIO 5: Polea Alta (High Cable/Lat Pulldown)

#### Set 1
- **Peso:** 27 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x27`

#### Set 2
- **Peso:** 36 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x36`

#### Set 3
- **Peso:** 41 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x41`

---

### EJERCICIO 6: Pecho (Chest Press)

#### Set 1
- **Peso:** 23 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x23`

#### Set 2
- **Peso:** 32 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x32`

#### Set 3
- **Peso:** 41 kg
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x41`

---

### EJERCICIO 7: Press Banca (Barbell Bench Press)

#### Set 1
- **Peso:** 35 kg (barra 20kg + 7,5kg por lado)
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x35`

#### Set 2
- **Peso:** 35 kg (barra 20kg + 7,5kg por lado)
- **Reps programadas:** 12
- **Reps realizadas:** 12 ✅
- **Notas:** `12x35`

---

## 📊 RESUMEN SESSION

| Métrica | Valor |
|---------|-------|
| Duración | ~? min |
| Ejercicios | 7 (Remo + Tríceps + Hombro + Bíceps + Polea Alta + Pecho + Press Banca) |
| Total sets | 20 |
| Total reps | 240 (12×20) |
| Peso máximo | 59 kg (Tríceps en máquina) |
| Intensidad | OLÍMPICA 🏆🔥💪⭐ |
| Completadas | 20/20 sets ✅ 100% |

---

## 🔄 INSTRUCCIONES DE SINCRONIZACIÓN

Cuando vuelva el servidor:

### Opción A: Entrada manual (fácil)
1. Abrir SapoFit → "Entrenamientos"
2. Crear nueva sesión (01/10/2026)
3. Agregar sets:
   - Set 1: 27kg x10 reps
   - Set 2: 32kg x1 rep
4. Guardar

### Opción B: Insertar directo en BD (rápido)
```sql
-- Crear sesión
INSERT INTO "WorkoutSession" (id, "userId", date, "durationMinutes", notes)
VALUES (gen_random_uuid(), 'USER_ID', '2026-10-01', NULL, 'Sesión offline 01/10');

-- Agregar ejercicios (necesitas machine IDs)
INSERT INTO "WorkoutExercise" (id, "sessionId", "machineId", notes)
VALUES 
  (gen_random_uuid(), 'SESSION_ID', 'MACHINE_ID_27KG', 'Set 1: 27kg'),
  (gen_random_uuid(), 'SESSION_ID', 'MACHINE_ID_32KG', 'Set 2: 32kg+5kg');

-- Agregar sets
INSERT INTO "WorkoutSet" (id, "exerciseId", "repsTarget", "repsActual", weight, notes)
VALUES 
  (gen_random_uuid(), 'EXERCISE_ID_1', 12, 10, 27.0, 'Perdió 2 reps'),
  (gen_random_uuid(), 'EXERCISE_ID_2', 12, 1, 32.0, 'Nueva máquina +5kg');
```

---

## ✅ ESTADO

- [x] Datos capturados
- [x] Guardados offline
- [ ] Esperando reconexión servidor
- [ ] Sincronización pendiente
- [ ] Confirmación en BD

---

**Creado:** 01/10/2026 21:XX UTC  
**VPS Status:** 🔴 CAÍDA (217.154.188.166)  
**Sincronización:** ⏳ Pendiente de reconexión
