import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

const USERS_DATA = [
  {
    email: 'zoraida.pozo@example.com',
    password: 'Zoraida2024!',
    name: 'Zoraida Pozo Barrio',
    profile: { age: 43, height: 174, weight: 97.1, target: 90.1, calories: 2400, protein: 235 },
  },
  {
    email: 'alex.fitness@example.com',
    password: 'Alex2024!',
    name: 'Alejandro García',
    profile: { age: 32, height: 182, weight: 92.0, target: 85.0, calories: 2800, protein: 280 },
  },
  {
    email: 'andres.entrenamientos@example.com',
    password: 'Andres2024!',
    name: 'Andrés Martínez',
    profile: { age: 28, height: 180, weight: 88.5, target: 82.0, calories: 2600, protein: 260 },
  },
]

async function seedUser(userData: typeof USERS_DATA[0]) {
  const hashedPassword = await bcrypt.hash(userData.password, 10)
  
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: {
      email: userData.email,
      passwordHash: hashedPassword,
      role: 'USER',
      name: userData.name,
    },
  })

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      age: userData.profile.age,
      heightCm: userData.profile.height,
      weightKg: userData.profile.weight,
      bodyType: 'RECTANGULAR',
      sex: userData.email.includes('zoraida') ? 'F' : 'M',
      wakeUpTime: '07:00',
      sleepTime: '22:00',
      lunchTime: '13:30',
      dietType: 'HIGH_PROTEIN',
      forbiddenFoods: 'Gluten',
      trainingFrequency: '2x/week',
      trainingPlaces: 'Gym',
      homeEquipment: 'Mancuernas',
      lastCalculatedCalories: userData.profile.calories,
      lastCalculatedProtein: userData.profile.protein,
      lastCalculatedCarbs: Math.floor(userData.profile.calories / 4),
      lastCalculatedFat: 80,
      onboardingCompleted: true,
    },
  })

  await prisma.goal.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      targetWeightKg: userData.profile.target,
      targetWeeks: 12,
      targetDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000),
      viabilityStatus: 'VIABLE',
    },
  })

  const weights = [
    { days: 29, delta: 0 },
    { days: 23, delta: -0.3 },
    { days: 16, delta: -0.6 },
    { days: 10, delta: -0.9 },
    { days: 5, delta: -1.1 },
    { days: 0, delta: -1.2 },
  ]

  for (const w of weights) {
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        weightKg: userData.profile.weight + w.delta,
        date: new Date(Date.now() - w.days * 24 * 60 * 60 * 1000),
        notes: w.days === 0 ? 'Hoy' : `Progreso día ${w.days}`,
      },
    }).catch(() => {})
  }

  await prisma.mealPlan.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      planJson: {
        meals: [
          { time: '07:00', name: 'Desayuno', foods: ['Huevos 3', 'Avena 50g', 'Plátano'] },
          { time: '09:30', name: 'Snack', foods: ['Proteína', 'Frutos secos'] },
          { time: '13:30', name: 'Comida', foods: ['Pechuga 200g', 'Arroz 100g', 'Verduras'] },
          { time: '17:00', name: 'Pre-entreno', foods: ['Plátano', 'Almendras'] },
          { time: '22:00', name: 'Cena', foods: ['Pez 180g', 'Verdura', 'Aceite oliva'] },
        ],
      },
      macroTargets: {
        calories: userData.profile.calories,
        protein: userData.profile.protein,
        carbs: Math.floor(userData.profile.calories / 4),
        fat: 80,
      },
      status: 'ACTIVE',
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: {},
    create: {
      userId: user.id,
      date: today,
      waterLiters: 2.5,
      energy: 8,
      mood: 8,
      mealLogged: true,
      notes: 'Día productivo',
    },
  })

  return user
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('x-seed-token')
    if (token !== process.env.SEED_TOKEN && process.env.SEED_TOKEN !== 'dev-disabled') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminPassword = await bcrypt.hash('3802Mario!', 10)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@sapofit.local' },
      update: {},
      create: {
        email: 'admin@sapofit.local',
        passwordHash: adminPassword,
        role: 'ADMIN',
        name: 'Mario Admin',
      },
    })

    const results = []
    for (const userData of USERS_DATA) {
      const user = await seedUser(userData)
      results.push({
        name: user.name,
        email: user.email,
        password: userData.password,
      })
    }

    return NextResponse.json({
      success: true,
      admin: { email: 'admin@sapofit.local', password: '3802Mario!', role: 'ADMIN' },
      users: results,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
