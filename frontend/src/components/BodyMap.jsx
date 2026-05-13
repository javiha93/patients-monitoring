import { useState } from 'react'

/**
 * Interactive SVG body map for selecting X-ray regions.
 * Anatomically proportioned human silhouette with hover tooltips
 * connected by leader lines (like the screenshot reference).
 */

const REGIONS = [
  // Head
  { key: 'craneo', label: 'Cráneo', d: 'M91,12 Q91,2 100,2 Q109,2 109,12 L109,22 Q109,28 100,28 Q91,28 91,22 Z' },
  { key: 'senos', label: 'Senos paranasales', d: 'M95,16 L105,16 L105,24 L95,24 Z' },
  { key: 'mandibula', label: 'Mandíbula', d: 'M94,24 L106,24 L104,30 L96,30 Z' },
  // Neck
  { key: 'cervical', label: 'C. cervical', d: 'M96,30 L104,30 L105,40 L95,40 Z' },
  // Shoulders
  { key: 'hombro_izq', label: 'Hombro izq.', d: 'M70,46 Q78,40 92,42 L88,54 Q78,50 70,54 Z' },
  { key: 'hombro_der', label: 'Hombro der.', d: 'M108,42 Q122,40 130,46 L130,54 Q122,50 112,54 Z' },
  // Chest
  { key: 'torax', label: 'Tórax', d: 'M86,42 L114,42 L114,76 L86,76 Z' },
  { key: 'costillas', label: 'Costillas', d: 'M80,52 L86,46 L86,76 L82,76 Z M114,46 L120,52 L118,76 L114,76 Z' },
  { key: 'esternon', label: 'Esternón', d: 'M97,44 L103,44 L103,72 L97,72 Z' },
  { key: 'dorsal', label: 'C. dorsal', d: 'M97,44 L103,44 L103,76 L97,76 Z' },
  // Abdomen
  { key: 'abdomen', label: 'Abdomen', d: 'M84,76 L116,76 L116,102 L84,102 Z' },
  { key: 'lumbar', label: 'C. lumbar', d: 'M97,76 L103,76 L103,102 L97,102 Z' },
  // Pelvis
  { key: 'pelvis', label: 'Pelvis', d: 'M82,102 L118,102 Q118,118 100,122 Q82,118 82,102 Z' },
  { key: 'sacro', label: 'Sacro-coxis', d: 'M97,102 L103,102 L103,116 L97,116 Z' },
  // Hips
  { key: 'cadera_izq', label: 'Cadera izq.', d: 'M82,104 L96,104 Q92,120 86,122 Q82,118 82,104 Z' },
  { key: 'cadera_der', label: 'Cadera der.', d: 'M104,104 L118,104 Q118,118 114,122 Q108,120 104,104 Z' },
  // Upper arms
  { key: 'humero_izq', label: 'Húmero izq.', d: 'M64,54 L72,52 L68,86 L60,88 Z' },
  { key: 'humero_der', label: 'Húmero der.', d: 'M128,52 L136,54 L140,88 L132,86 Z' },
  // Elbows
  { key: 'codo_izq', label: 'Codo izq.', d: 'M58,88 L68,86 L66,98 L56,100 Z' },
  { key: 'codo_der', label: 'Codo der.', d: 'M132,86 L142,88 L144,100 L134,98 Z' },
  // Forearms
  { key: 'antebrazo_izq', label: 'Antebrazo izq.', d: 'M54,100 L64,98 L60,130 L50,132 Z' },
  { key: 'antebrazo_der', label: 'Antebrazo der.', d: 'M136,98 L146,100 L150,132 L140,130 Z' },
  // Wrists
  { key: 'muneca_izq', label: 'Muñeca izq.', d: 'M48,132 L60,130 L58,140 L46,142 Z' },
  { key: 'muneca_der', label: 'Muñeca der.', d: 'M140,130 L152,132 L154,142 L142,140 Z' },
  // Hands
  { key: 'mano_izq', label: 'Mano izq.', d: 'M42,142 L58,140 L56,164 L38,164 Z' },
  { key: 'mano_der', label: 'Mano der.', d: 'M142,140 L158,142 L162,164 L144,164 Z' },
  // Thighs
  { key: 'femur_izq', label: 'Fémur izq.', d: 'M84,122 L98,122 L96,178 L86,178 Z' },
  { key: 'femur_der', label: 'Fémur der.', d: 'M102,122 L116,122 L114,178 L104,178 Z' },
  // Knees
  { key: 'rodilla_izq', label: 'Rodilla izq.', d: 'M84,178 L98,178 L97,196 L85,196 Z' },
  { key: 'rodilla_der', label: 'Rodilla der.', d: 'M102,178 L116,178 L115,196 L103,196 Z' },
  // Lower legs
  { key: 'tibia_izq', label: 'Tibia-peroné izq.', d: 'M86,196 L96,196 L94,244 L88,244 Z' },
  { key: 'tibia_der', label: 'Tibia-peroné der.', d: 'M104,196 L114,196 L112,244 L106,244 Z' },
  // Ankles
  { key: 'tobillo_izq', label: 'Tobillo izq.', d: 'M86,244 L96,244 L96,254 L86,254 Z' },
  { key: 'tobillo_der', label: 'Tobillo der.', d: 'M104,244 L114,244 L114,254 L104,254 Z' },
  // Feet
  { key: 'pie_izq', label: 'Pie izq.', d: 'M80,254 L96,254 L96,266 Q88,268 78,266 Z' },
  { key: 'pie_der', label: 'Pie der.', d: 'M104,254 L120,254 Q122,266 112,268 L104,266 Z' },
]

// Smooth anatomical human silhouette
const BODY_SILHOUETTE = `
  M100,2
  C108,2 112,6 112,14 L112,22
  C112,30 106,32 104,32
  L105,40
  C114,40 124,42 130,46
  C136,50 138,54 140,60
  L144,88
  L148,100
  L154,132
  L158,142
  L164,166
  L158,168
  L152,144
  L148,134
  L144,120
  L140,100
  L136,88
  L132,72
  C128,56 126,52 124,50
  L120,52
  L118,76
  L118,102
  Q118,120 116,122
  L114,178
  L115,196
  L112,244
  L114,254
  Q122,266 114,270
  L104,270
  L104,254
  L106,244
  L104,196
  L104,178
  L102,122
  L100,122
  L98,122
  L96,178
  L96,196
  L94,244
  L96,254
  L96,270
  L86,270
  Q78,266 86,254
  L88,244
  L85,196
  L86,178
  L84,122
  Q82,120 82,102
  L82,76
  L80,52
  L76,50
  C74,52 72,56 68,72
  L64,88
  L60,100
  L56,120
  L52,134
  L48,144
  L42,168
  L36,166
  L42,142
  L46,132
  L52,100
  L56,88
  L60,60
  C62,54 64,50 70,46
  C76,42 86,40 95,40
  L96,32
  C94,32 88,30 88,22
  L88,14
  C88,6 92,2 100,2
  Z
`

function getCenter(d) {
  const nums = d.match(/[\d.]+/g)?.map(Number) || []
  const xs = [], ys = []
  for (let i = 0; i < nums.length; i += 2) {
    if (i + 1 < nums.length) { xs.push(nums[i]); ys.push(nums[i + 1]) }
  }
  return {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  }
}

function LeaderLabel({ region, color = '#3b82f6', bgFill = '#eff6ff', strokeColor = '#3b82f6', fontWeight = '600', textColor = '#1d4ed8' }) {
  const { x: cx, y: cy } = getCenter(region.d)
  const isRight = cx >= 100
  const labelX = isRight ? 148 : 52
  const textAnchor = isRight ? 'start' : 'end'
  const textX = isRight ? labelX + 4 : labelX - 4
  const w = region.label.length * 5.2 + 12
  const rectX = isRight ? labelX : labelX - w

  return (
    <g>
      <line x1={cx} y1={cy} x2={labelX} y2={cy} stroke={strokeColor} strokeWidth="0.6" opacity="0.6" />
      <circle cx={cx} cy={cy} r="2" fill={color} />
      <rect x={rectX} y={cy - 9} width={w} height={17} rx="4" fill={bgFill} stroke={strokeColor} strokeWidth="0.5" />
      <text x={textX} y={cy + 1} fontSize="7.5" fill={textColor} textAnchor={textAnchor} dominantBaseline="middle" fontWeight={fontWeight} fontFamily="system-ui, sans-serif">{region.label}</text>
    </g>
  )
}

export default function BodyMap({ selected, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const hoveredRegion = REGIONS.find(r => r.key === hovered)
  const selectedRegion = REGIONS.find(r => r.key === selected)

  return (
    <div className="relative flex justify-center">
      <svg viewBox="20 -6 160 284" className="w-full max-w-[280px] h-auto select-none">
        {/* Body silhouette */}
        <path
          d={BODY_SILHOUETTE}
          fill="#e8ecf1"
          stroke="#b0bac9"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Clickable regions */}
        {REGIONS.map(r => {
          const isSel = selected === r.key
          const isHov = hovered === r.key
          return (
            <path
              key={r.key}
              d={r.d}
              fill={isSel ? 'rgba(59,130,246,0.4)' : isHov ? 'rgba(59,130,246,0.18)' : 'transparent'}
              stroke={isSel ? '#3b82f6' : isHov ? '#93c5fd' : 'transparent'}
              strokeWidth={isSel ? 1.5 : 1}
              className="cursor-pointer"
              style={{ transition: 'fill 0.15s, stroke 0.15s' }}
              onMouseEnter={() => setHovered(r.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(r.key)}
            />
          )
        })}

        {/* Leader line labels */}
        {hoveredRegion && hovered !== selected && (
          <LeaderLabel region={hoveredRegion} color="#64748b" bgFill="white" strokeColor="#cbd5e1" fontWeight="400" textColor="#334155" />
        )}
        {selectedRegion && (
          <LeaderLabel region={selectedRegion} />
        )}
      </svg>
    </div>
  )
}

/** Get the label for a body map region key */
export function getBodyMapLabel(key) {
  return REGIONS.find(r => r.key === key)?.label || key
}

export const BODY_MAP_REGIONS = REGIONS.map(r => r.key)
