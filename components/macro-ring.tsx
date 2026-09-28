"use client"

interface MacroRingProps {
  consumed: number
  target: number
  label: string
  shortLabel: string
  color: string
  unit: string
}

export function MacroRing({ consumed, target, label, shortLabel, color, unit }: MacroRingProps) {
  const r = 36
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, consumed / target)
  const offset = circ * (1 - pct)
  const over = consumed > target

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex-shrink-0">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="7" />
          <circle cx="45" cy="45" r={r} fill="none"
            stroke={over ? "#f87171" : color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 45 45)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
          <text x="45" y="48" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">{consumed}</text>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white/90">{shortLabel}</p>
        <p className="text-[10px] text-white/60">{target}{unit}</p>
      </div>
    </div>
  )
}
