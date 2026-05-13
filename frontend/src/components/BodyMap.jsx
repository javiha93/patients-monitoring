import { useState } from 'react'

/**
 * Interactive SVG body map for selecting X-ray regions.
 * Hover highlights regions; click selects. Selected region shown in blue.
 * Each region maps to a key in the radiology catalog.
 */

const REGIONS = [
  // Head & neck
  { key: 'craneo', label: 'Cráneo', d: 'M85,18 C85,8 95,2 100,2 C105,2 115,8 115,18 L115,30 C115,35 110,38 100,38 C90,38 85,35 85,30 Z' },
  { key: 'senos', label: 'Senos paranasales', d: 'M92,22 L108,22 L108,30 L92,30 Z' },
  { key: 'cervical', label: 'C. cervical', d: 'M94,38 L106,38 L108,50 L92,50 Z' },
  // Torso
  { key: 'hombro_izq', label: 'Hombro izq.', d: 'M68,52 L92,50 L88,65 L65,60 Z' },
  { key: 'hombro_der', label: 'Hombro der.', d: 'M108,50 L132,52 L135,60 L112,65 Z' },
  { key: 'torax', label: 'Tórax', d: 'M88,50 L112,50 L112,85 L88,85 Z' },
  { key: 'costillas', label: 'Costillas', d: 'M82,60 L88,55 L88,85 L82,80 Z M112,55 L118,60 L118,80 L112,85 Z' },
  { key: 'dorsal', label: 'C. dorsal', d: 'M96,50 L104,50 L104,85 L96,85 Z' },
  { key: 'abdomen', label: 'Abdomen', d: 'M85,85 L115,85 L115,110 L85,110 Z' },
  { key: 'lumbar', label: 'C. lumbar', d: 'M96,85 L104,85 L104,110 L96,110 Z' },
  { key: 'pelvis', label: 'Pelvis', d: 'M80,110 L120,110 L125,130 L75,130 Z' },
  { key: 'sacro', label: 'Sacro-coxis', d: 'M96,110 L104,110 L104,130 L96,130 Z' },
  // Left arm (viewer's right = anatomical left)
  { key: 'codo_izq', label: 'Codo izq.', d: 'M55,80 L65,78 L68,92 L58,94 Z' },
  { key: 'muneca_izq', label: 'Muñeca izq.', d: 'M45,108 L55,105 L57,118 L47,120 Z' },
  { key: 'mano_izq', label: 'Mano izq.', d: 'M38,120 L52,118 L55,140 L35,140 Z' },
  // Right arm
  { key: 'codo_der', label: 'Codo der.', d: 'M135,78 L145,80 L142,94 L132,92 Z' },
  { key: 'muneca_der', label: 'Muñeca der.', d: 'M145,105 L155,108 L153,120 L143,118 Z' },
  { key: 'mano_der', label: 'Mano der.', d: 'M148,118 L162,120 L165,140 L145,140 Z' },
  // Left leg
  { key: 'cadera_izq', label: 'Cadera izq.', d: 'M75,125 L92,125 L88,145 L78,145 Z' },
  { key: 'femur_izq', label: 'Fémur izq.', d: 'M78,145 L92,145 L90,185 L80,185 Z' },
  { key: 'rodilla_izq', label: 'Rodilla izq.', d: 'M78,185 L92,185 L92,200 L78,200 Z' },
  { key: 'tibia_izq', label: 'Tibia izq.', d: 'M80,200 L92,200 L90,240 L82,240 Z' },
  { key: 'tobillo_izq', label: 'Tobillo izq.', d: 'M80,240 L92,240 L92,252 L80,252 Z' },
  { key: 'pie_izq', label: 'Pie izq.', d: 'M75,252 L92,252 L92,265 L72,265 Z' },
  // Right leg
  { key: 'cadera_der', label: 'Cadera der.', d: 'M108,125 L125,125 L122,145 L112,145 Z' },
  { key: 'femur_der', label: 'Fémur der.', d: 'M108,145 L122,145 L120,185 L110,185 Z' },
  { key: 'rodilla_der', label: 'Rodilla der.', d: 'M108,185 L122,185 L122,200 L108,200 Z' },
  { key: 'tibia_der', label: 'Tibia der.', d: 'M108,200 L120,200 L118,240 L110,240 Z' },
  { key: 'tobillo_der', label: 'Tobillo der.', d: 'M108,240 L120,240 L120,252 L108,252 Z' },
  { key: 'pie_der', label: 'Pie der.', d: 'M108,252 L128,252 L128,265 L108,265 Z' },
  // Upper arms (between shoulder and elbow)
  { key: 'humero_izq', label: 'Húmero izq.', d: 'M60,60 L70,58 L65,80 L55,82 Z' },
  { key: 'humero_der', label: 'Húmero der.', d: 'M130,58 L140,60 L145,82 L135,80 Z' },
  // Forearms
  { key: 'antebrazo_izq', label: 'Antebrazo izq.', d: 'M50,94 L62,90 L55,108 L45,110 Z' },
  { key: 'antebrazo_der', label: 'Antebrazo der.', d: 'M138,90 L150,94 L155,110 L145,108 Z' },
]

// Silhouette outline for the body background
const BODY_OUTLINE = `
  M100,2 C112,2 118,12 118,22 L118,32 C118,38 112,42 108,44
  L108,50 L132,52 L140,58 L150,82 L158,108 L165,140 L155,140
  L148,118 L140,95 L135,80 L132,92 L128,110 L125,125 L125,130
  L122,145 L120,185 L122,200 L120,240 L120,252 L128,252 L128,268
  L108,268 L108,252 L108,200 L110,185 L112,145 L108,125 L100,120
  L92,125 L88,145 L90,185 L92,200 L92,252 L72,252 L72,268
  L80,268 L80,252 L80,240 L78,200 L80,185 L78,145 L75,130
  L75,125 L72,110 L68,92 L65,80 L60,95 L52,118 L45,140
  L35,140 L42,108 L50,82 L60,58 L68,52 L92,50 L92,44
  C88,42 82,38 82,32 L82,22 C82,12 88,2 100,2 Z
`

export default function BodyMap({ selected, onSelect }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="relative flex justify-center">
      <svg viewBox="25 -5 150 280" className="w-full max-w-[280px] h-auto">
        {/* Body silhouette background */}
        <path
          d={BODY_OUTLINE}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Clickable regions */}
        {REGIONS.map(r => {
          const isSelected = selected === r.key
          const isHovered = hovered === r.key
          return (
            <path
              key={r.key}
              d={r.d}
              fill={isSelected ? 'rgba(59,130,246,0.35)' : isHovered ? 'rgba(59,130,246,0.15)' : 'transparent'}
              stroke={isSelected ? '#3b82f6' : isHovered ? '#93c5fd' : 'transparent'}
              strokeWidth={isSelected ? 1.5 : 1}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHovered(r.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(r.key)}
            />
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10">
          {REGIONS.find(r => r.key === hovered)?.label}
        </div>
      )}

      {/* Selected label */}
      {selected && !hovered && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10">
          {REGIONS.find(r => r.key === selected)?.label}
        </div>
      )}
    </div>
  )
}

/** Get the label for a body map region key */
export function getBodyMapLabel(key) {
  return REGIONS.find(r => r.key === key)?.label || key
}

/** All region keys available in the body map */
export const BODY_MAP_REGIONS = REGIONS.map(r => r.key)
