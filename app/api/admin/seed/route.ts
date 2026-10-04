import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('x-seed-token')
    if (token !== process.env.SEED_TOKEN && process.env.SEED_TOKEN !== 'dev-disabled') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash('Zoraida2024!', 10)
    
    const user = await prisma.user.upsert({
      where: { email: 'zoraida.pozo@example.com' },
      update: {},
      create: {
        email: 'zoraida.pozo@example.com',
        passwordHash: hashedPassword,
        role: 'USER',
        name: 'Zoraida Pozo Barrio',
      },
    })

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        age: 43,
        heightCm: 174,
        weightKg: 97.1,
        bodyType: 'RECTANGULAR',
        sex: 'F',
        wakeUpTime: '07:05',
        sleepTime: '22:00',
        lunchTime: '13:30',
        dietType: 'HIGH_PROTEIN',
        forbiddenFoods: 'Gluten,Lácteos',
        supermarket: 'Carrefour',
        trainingFrequency: '2x/week',
        trainingPlaces: 'Gym general',
        homeEquipment: 'Mancuernas',
        lastCalculatedCalories: 2400,
        lastCalculatedProtein: 235,
        lastCalculatedCarbs: 235,
        lastCalculatedFat: 80,
        onboardingCompleted: true,
      },
    })

    await prisma.goal.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        targetWeightKg: 90.1,
        targetWeeks: 14,
        targetDate: new Date(Date.now() + 14 * 7 * 24 * 60 * 60 * 1000),
        viabilityStatus: 'VIABLE',
      },
    })

    const weights = [
      { days: 29, weight: 97.1 },
      { days: 23, weight: 96.8 },
      { days: 16, weight: 96.5 },
      { days: 10, weight: 96.2 },
      { days: 5, weight: 95.9 },
      { days: 0, weight: 95.8 },
    ]

    for (const { days, weight } of weights) {
      await prisma.weightEntry.create({
        data: {
          userId: user.id,
          weightKg: weight,
          date: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          notes: days === 0 ? 'Hoy' : `Día ${days} atrás`,
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
            { time: '07:05', name: 'Desayuno', foods: ['Pan integral 40g', 'Jamón serrano 80g', 'Tomate', 'Aceite oliva 10ml'] },
            { time: '09:00', name: 'Media mañana', foods: ['Manzana 200g', 'Frutos secos 30g'] },
            { time: '13:30', name: 'Comida', foods: ['Pechuga pollo 200g', 'Arroz integral 100g', 'Brócoli 150g', 'Aceite oliva 15ml'] },
            { time: '18:00', name: 'Merienda', foods: ['Yogur griego 125g', 'Frutos secos 25g'] },
            { time: '22:00', name: 'Cena', foods: ['Pez espada 180g', 'Verdura mixta 200g', 'Aceite oliva 10ml'] },
          ],
        },
        macroTargets: {
          calories: 2400,
          protein: 235,
          carbs: 235,
          fat: 80,
        },
        status: 'ACTIVE',
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.dailyLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { waterLiters: 1.5, energy: 7, mood: 8, mealLogged: true },
      create: {
        userId: user.id,
        date: today,
        waterLiters: 1.5,
        energy: 7,
        mood: 8,
        mealLogged: true,
        notes: 'Bien el desayuno y media mañana',
      },
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      credentials: { email: 'zoraida.pozo@example.com', password: 'Zoraida2024!' },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
