import React, { useState } from 'react'

interface Measurements {
  neck: number
  chest: number
  abdomen: number
  hip: number
  thigh: number
  bicep: number
  forearm: number
  wrist: number
  age: number
  gender: 'M' | 'F'
}

interface BodyFatResult {
  percentage: number
  category: string
  color: string
}

export function BodyMeasurementDiagram() {
  const [measurements, setMeasurements] = useState<Partial<Measurements>>({
    gender: 'M',
  })
  const [result, setResult] = useState<BodyFatResult | null>(null)

  const calculateBodyFat = () => {
    const m = measurements as Measurements
    if (!m.neck || !m.abdomen || !m.age || !m.gender) {
      alert('Completa todos los campos requeridos')
      return
    }

    let bodyFatPercent = 0

    if (m.gender === 'M') {
      // Jackson-Pollock 3-point (Abdomen, Chest, Thigh para hombres)
      const abdominal = m.abdomen
      const chest = m.chest || 0
      const thigh = m.thigh || 0

      // Fórmula simplificada Jackson-Pollock
      bodyFatPercent =
        1.0808 * Math.log10((abdominal + chest + thigh - m.neck) / 2.0) - 19.15
    } else {
      // Jackson-Pollock para mujeres (Triceps, Abdomen, Suprailíaca)
      const abdominal = m.abdomen
      const hip = m.hip || 0
      const thigh = m.thigh || 0

      bodyFatPercent =
        1.0994921 *
          Math.log10((abdominal + hip + thigh - m.neck) / 2.0) -
        19.15
    }

    // Categoría según edad y género
    let category = ''
    let color = ''

    if (m.gender === 'M') {
      if (bodyFatPercent < 10) category = 'Muy bajo'
      else if (bodyFatPercent < 14) category = 'Bajo'
      else if (bodyFatPercent < 18) category = 'Normal'
      else if (bodyFatPercent < 25) category = 'Elevado'
      else category = 'Muy elevado'
    } else {
      if (bodyFatPercent < 14) category = 'Muy bajo'
      else if (bodyFatPercent < 18) category = 'Bajo'
      else if (bodyFatPercent < 25) category = 'Normal'
      else if (bodyFatPercent < 32) category = 'Elevado'
      else category = 'Muy elevado'
    }

    color = bodyFatPercent < 20 ? '#22c55e' : bodyFatPercent < 30 ? '#eab308' : '#ef4444'

    setResult({
      percentage: Math.round(bodyFatPercent * 10) / 10,
      category,
      color,
    })
  }

  return (
    <div className="space-y-6 p-4">
      {/* SVG Diagrama */}
      <div className="flex justify-center">
        <svg width="250" height="400" viewBox="0 0 250 400" className="border-2 border-gray-300 rounded">
          {/* Head */}
          <circle cx="125" cy="40" r="20" fill="#f5a962" stroke="#333" strokeWidth="2" />

          {/* Neck marker */}
          <line x1="125" y1="60" x2="125" y2="80" stroke="#ff6b6b" strokeWidth="3" />
          <text x="140" y="75" fontSize="12" fontWeight="bold" fill="#ff6b6b">
            Cuello
          </text>

          {/* Chest */}
          <ellipse cx="125" cy="120" rx="40" ry="35" fill="#f5a962" stroke="#333" strokeWidth="2" />
          <line x1="165" y1="120" x2="190" y2="120" stroke="#3b82f6" strokeWidth="3" />
          <text x="195" y="125" fontSize="12" fontWeight="bold" fill="#3b82f6">
            Pecho
          </text>

          {/* Abdomen marker */}
          <line x1="125" y1="155" x2="125" y2="185" stroke="#ec4899" strokeWidth="3" />
          <text x="140" y="180" fontSize="12" fontWeight="bold" fill="#ec4899">
            Abdomen
          </text>

          {/* Waist/Hip area */}
          <ellipse cx="125" cy="200" rx="45" ry="40" fill="#f5a962" stroke="#333" strokeWidth="2" />

          {/* Bicep */}
          <line x1="80" y1="130" x2="50" y2="130" stroke="#8b5cf6" strokeWidth="3" />
          <text x="20" y="135" fontSize="12" fontWeight="bold" fill="#8b5cf6">
            Bícep
          </text>

          {/* Thigh marker */}
          <line x1="125" y1="240" x2="125" y2="280" stroke="#06b6d4" strokeWidth="3" />
          <text x="140" y="275" fontSize="12" fontWeight="bold" fill="#06b6d4">
            Muslo
          </text>

          {/* Legs */}
          <rect x="105" y="280" width="20" height="100" fill="#f5a962" stroke="#333" strokeWidth="2" />
          <rect x="125" y="280" width="20" height="100" fill="#f5a962" stroke="#333" strokeWidth="2" />

          {/* Legend */}
          <text x="10" y="390" fontSize="10" fill="#666">
            Medidas en cm
          </text>
        </svg>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="M"
              checked={measurements.gender === 'M'}
              onChange={(e) => setMeasurements({ ...measurements, gender: 'M' })}
            />
            Hombre
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="F"
              checked={measurements.gender === 'F'}
              onChange={(e) => setMeasurements({ ...measurements, gender: 'F' })}
            />
            Mujer
          </label>
        </div>

        {/* Required fields */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-semibold text-red-600">Cuello (cm) *</label>
            <input
              type="number"
              step="0.1"
              value={measurements.neck || ''}
              onChange={(e) => setMeasurements({ ...measurements, neck: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 38"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-red-600">Abdomen (cm) *</label>
            <input
              type="number"
              step="0.1"
              value={measurements.abdomen || ''}
              onChange={(e) => setMeasurements({ ...measurements, abdomen: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 85"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-red-600">Edad (años) *</label>
            <input
              type="number"
              value={measurements.age || ''}
              onChange={(e) => setMeasurements({ ...measurements, age: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 30"
            />
          </div>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-2 text-gray-600">
          <div>
            <label className="text-sm">Pecho (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurements.chest || ''}
              onChange={(e) => setMeasurements({ ...measurements, chest: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 100"
            />
          </div>
          <div>
            <label className="text-sm">Cadera (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurements.hip || ''}
              onChange={(e) => setMeasurements({ ...measurements, hip: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 95"
            />
          </div>
          <div>
            <label className="text-sm">Muslo (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurements.thigh || ''}
              onChange={(e) => setMeasurements({ ...measurements, thigh: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 58"
            />
          </div>
          <div>
            <label className="text-sm">Bícep (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurements.bicep || ''}
              onChange={(e) => setMeasurements({ ...measurements, bicep: parseFloat(e.target.value) })}
              className="w-full border rounded px-2 py-1"
              placeholder="ej: 32"
            />
          </div>
        </div>

        {/* Calculate button */}
        <button
          onClick={calculateBodyFat}
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
        >
          Calcular % Grasa Corporal
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="p-4 rounded-lg text-center text-white"
          style={{ backgroundColor: result.color }}
        >
          <div className="text-3xl font-bold">{result.percentage}%</div>
          <div className="text-lg">{result.category}</div>
          <div className="text-sm mt-2 opacity-90">
            {result.percentage < 10 && '🏆 Muy bajo - Atlético'}
            {result.percentage >= 10 &&
              result.percentage < 20 &&
              '✅ Bajo - Muy bueno'}
            {result.percentage >= 20 &&
              result.percentage < 30 &&
              '⚡ Normal - Saludable'}
            {result.percentage >= 30 && '⚠️ Elevado - Considerar cambios'}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
        <p className="font-semibold mb-2">📏 Cómo medir:</p>
        <ul className="space-y-1 text-xs">
          <li>
            <strong>Cuello:</strong> bajo la laringe, relajado
          </li>
          <li>
            <strong>Abdomen:</strong> a la altura del ombligo, de pie
          </li>
          <li>
            <strong>Pecho:</strong> a media altura, brazos relajados
          </li>
          <li>
            <strong>Muslo:</strong> mitad del muslo, de pie
          </li>
        </ul>
      </div>
    </div>
  )
}
