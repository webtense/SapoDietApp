export const MACHINE_TRANSLATIONS: Record<string, string> = {
  'Chest Press': 'Prensa de Pecho',
  'Leg Press': 'Prensa de Piernas',
  'Lat Pulldown': 'Jalón Lateral',
  'Shoulder Press': 'Prensa de Hombros',
  'Leg Curl': 'Curl de Piernas',
  'Leg Extension': 'Extensión de Piernas',
  'Bicep Curl': 'Curl de Bíceps',
  'Tricep Dips': 'Fondos de Tríceps',
  'Cable Fly': 'Aperturas en Cable',
  'Smith Machine': 'Máquina Smith',
  'Treadmill': 'Cinta de Correr',
  'Rowing Machine': 'Máquina de Remo',
  'Elliptical': 'Elíptica',
  'Ab Crunch': 'Abdominales',
  'Back Hyperextension': 'Hiperextensión Lumbar',
  'Squat Rack': 'Jaula de Sentadillas',
  'Barbell Bench': 'Banco con Barra',
  'Dumbbell Rack': 'Soporte de Mancuernas',
  'Prensa de Piernas (Leg Press)': 'Prensa de Piernas',
  'Curl de Piernas Sentado (Seated Leg Curl)': 'Curl de Piernas Sentado',
  'Seated Leg Curl': 'Curl de Piernas Sentado',
}

const SPANISH_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(MACHINE_TRANSLATIONS).map(([en, es]) => [es, en])
)

export function getSpanishName(englishName: string): string {
  return MACHINE_TRANSLATIONS[englishName] || englishName
}

export function getEnglishName(spanishName: string): string {
  return SPANISH_TO_ENGLISH[spanishName] || spanishName
}
