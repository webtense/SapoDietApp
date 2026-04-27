import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/security';
import { prisma } from '@/lib/server/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function computeImageHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
}

async function checkAndUpdateQuota(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiTokensUsed: true, aiTokenLimit: true, lastAiTokenReset: true }
  });

  if (!user) return false;

  const now = new Date();
  const lastReset = user.lastAiTokenReset;

  let currentUsage = user.aiTokensUsed;
  if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
    currentUsage = 0;
    await prisma.user.update({
      where: { id: userId },
      data: { aiTokensUsed: 0, lastAiTokenReset: now }
    });
  }

  if (currentUsage >= user.aiTokenLimit) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { aiTokensUsed: { increment: 1 } }
  });

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 });
    }

    const hasQuota = await checkAndUpdateQuota(user.id);
    if (!hasQuota) {
      return NextResponse.json({ error: { code: 'AI_QUOTA_EXCEEDED', message: 'Daily AI limit reached' } }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mealType = formData.get('mealType') as string || 'desayuno';

    if (!file) {
      return NextResponse.json({ error: { code: 'NO_FILE', message: 'No image provided' } }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageHash = computeImageHash(buffer);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: file.type || 'image/jpeg'
      }
    };

    const prompt = `Eres un nutritionist experto. Analiza esta imagen de comida y estima:
1. Calorías totales (kcal)
2. Proteína (g)
3. Carbohidratos (g)
4. Grasa (g)
5. Lista de ingredientes principales que ves

Responde SOLO en JSON con este formato exacto:
{"calories": número, "protein": número, "carbs": número, "fat": número, "ingredients": ["ingrediente1", "ingrediente2"]}`;

    const result = await model.generateContent([imagePart, prompt]);
    const responseText = result.response.text();

    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      analysis = {
        calories: 400,
        protein: 20,
        carbs: 40,
        fat: 15,
        ingredients: ['comida', 'ingredientes varios']
      };
    }

    const foodAnalysis = await prisma.foodAnalysis.create({
      data: {
        userId: user.id,
        imageHash,
        calories: analysis.calories || 0,
        protein: analysis.protein || 0,
        carbs: analysis.carbs || 0,
        fat: analysis.fat || 0,
        ingredients: JSON.stringify(analysis.ingredients || []),
        mealType
      }
    });

    return NextResponse.json({
      id: foodAnalysis.id,
      calories: foodAnalysis.calories,
      protein: foodAnalysis.protein,
      carbs: foodAnalysis.carbs,
      fat: foodAnalysis.fat,
      ingredients: analysis.ingredients || []
    });

  } catch (error) {
    console.error('Meal photo analysis error:', error);
    return NextResponse.json({ error: { code: 'ANALYSIS_ERROR', message: 'Failed to analyze image' } }, { status: 500 });
  }
}