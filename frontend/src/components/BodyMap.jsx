import { useState } from 'react'

/**
 * Dual-view interactive body map (front + lateral).
 * Anatomically proportioned human silhouettes with visible zone boundaries.
 * Front view: head, torso, extremities. Lateral view: spine regions.
 */

// ─── FRONT VIEW ───
// ViewBox: 0 0 200 440. Anatomical male figure, standing, arms at sides.
// The outline is drawn once; regions are internal subdivisions with visible borders.

const FRONT_OUTLINE = `
  M100,2
  C110,2 114,6 114,14 L114,30 C114,38 110,42 106,44
  L108,56
  C118,56 134,60 142,66 C148,70 152,76 154,82
  L158,108 L160,132 L162,156 L164,180 L166,200
  L168,218 L170,240
  C172,246 168,248 166,244
  L162,224 L158,200 L156,180 L154,156 L152,132
  L148,108 L144,88
  C140,78 136,72 130,68
  L130,110 L132,160 L130,186
  L126,260 L124,300 L123,320 L121,370 L120,390
  L120,406 L126,418 C128,424 126,430 120,432
  L108,432 C104,432 102,428 104,424
  L108,414 L110,406 L110,390 L109,370 L107,320
  L106,300 L104,260 L102,186
  L98,186 L96,260 L94,300 L93,320 L91,370 L90,390
  L90,406 L96,418 C98,424 96,430 90,432
  L78,432 C74,432 72,428 74,424
  L78,414 L80,406 L80,390 L79,370 L77,320
  L76,300 L74,260 L70,186
  L68,160 L70,110 L70,68
  C64,72 60,78 56,88
  L52,108 L48,132 L46,156 L44,180 L42,200
  L38,224 L34,244
  C32,248 28,246 30,240
  L34,218 L36,200 L38,180 L40,156 L42,132
  L44,108 L46,82
  C48,76 52,70 58,66 C66,60 82,56 92,56
  L94,44 C90,42 86,38 86,30 L86,14 C86,6 90,2 100,2 Z
`

const FRONT_REGIONS = [
  // Head
  { key: 'craneo', label: 'Cráneo',
    d: 'M86,4 C86,4 90,2 100,2 C110,2 114,4 114,14 L114,30 C114,38 110,42 106,44 L94,44 C90,42 86,38 86,30 L86,14 Z' },

  // Neck
  { key: 'cervical', label: 'C. cervical',
    d: 'M94,44 L106,44 L108,56 L92,56 Z' },

  // Shoulders
  { key: 'hombro_izq', label: 'Hombro izq.',
    d: 'M70,68 L92,56 L92,68 L70,68 Z M58,66 C66,60 82,56 92,56 L92,68 L70,68 C64,72 60,78 56,82 L46,82 C48,76 52,70 58,66 Z' },
  { key: 'hombro_der', label: 'Hombro der.',
    d: 'M108,56 L130,68 L108,68 Z M108,56 C118,56 134,60 142,66 C148,70 152,76 154,82 L144,82 C140,78 136,72 130,68 L108,68 Z' },

  // Chest
  { key: 'torax', label: 'Tórax',
    d: 'M70,68 L130,68 L130,110 L70,110 Z' },
  { key: 'esternon', label: 'Esternón',
    d: 'M96,68 L104,68 L104,106 L96,106 Z' },

  // Upper arms
  { key: 'humero_izq', label: 'Húmero izq.',
    d: 'M46,82 L56,82 C56,88 54,96 52,108 L44,108 C46,96 46,88 46,82 Z' },
  { key: 'humero_der', label: 'Húmero der.',
    d: 'M144,82 L154,82 C154,88 154,96 156,108 L148,108 C146,96 144,88 144,82 Z' },

  // Elbows
  { key: 'codo_izq', label: 'Codo izq.',
    d: 'M44,108 L52,108 L50,132 L42,132 Z' },
  { key: 'codo_der', label: 'Codo der.',
    d: 'M148,108 L156,108 L158,132 L150,132 Z' },

  // Forearms
  { key: 'antebrazo_izq', label: 'Antebrazo izq.',
    d: 'M42,132 L50,132 L46,180 L38,180 Z' },
  { key: 'antebrazo_der', label: 'Antebrazo der.',
    d: 'M150,132 L158,132 L162,180 L154,180 Z' },

  // Wrists
  { key: 'muneca_izq', label: 'Muñeca izq.',
    d: 'M38,180 L46,180 L44,200 L36,200 Z' },
  { key: 'muneca_der', label: 'Muñeca der.',
    d: 'M154,180 L162,180 L164,200 L156,200 Z' },

  // Hands
  { key: 'mano_izq', label: 'Mano izq.',
    d: 'M36,200 L44,200 L40,240 L30,240 Z' },
  { key: 'mano_der', label: 'Mano der.',
    d: 'M156,200 L164,200 L170,240 L160,240 Z' },

  // Abdomen
  { key: 'abdomen', label: 'Abdomen',
    d: 'M70,110 L130,110 L132,160 L68,160 Z' },

  // Pelvis / hips
  { key: 'pelvis', label: 'Pelvis',
    d: 'M68,160 L132,160 L130,186 L70,186 Z' },
  { key: 'cadera_izq', label: 'Cadera izq.',
    d: 'M68,160 L90,160 L88,186 L70,186 Z' },
  { key: 'cadera_der', label: 'Cadera der.',
    d: 'M110,160 L132,160 L130,186 L112,186 Z' },

  // Thighs
  { key: 'femur_izq', label: 'Fémur izq.',
    d: 'M70,186 L102,186 L96,260 L74,260 Z' },
  { key: 'femur_der', label: 'Fémur der.',
    d: 'M98,186 L130,186 L126,260 L104,260 Z' },

  // Knees
  { key: 'rodilla_izq', label: 'Rodilla izq.',
    d: 'M74,260 L96,260 L94,300 L76,300 Z' },
  { key: 'rodilla_der', label: 'Rodilla der.',
    d: 'M104,260 L126,260 L124,300 L106,300 Z' },

  // Shins
  { key: 'tibia_izq', label: 'Tibia izq.',
    d: 'M76,300 L94,300 L91,370 L79,370 Z' },
  { key: 'tibia_der', label: 'Tibia der.',
    d: 'M106,300 L124,300 L121,370 L109,370 Z' },

  // Ankles
  { key: 'tobillo_izq', label: 'Tobillo izq.',
    d: 'M79,370 L91,370 L90,390 L80,390 Z' },
  { key: 'tobillo_der', label: 'Tobillo der.',
    d: 'M109,370 L121,370 L120,390 L110,390 Z' },

  // Feet
  { key: 'pie_izq', label: 'Pie izq.',
    d: 'M80,390 L90,390 L90,406 L96,418 C98,424 96,430 90,432 L78,432 C74,432 72,428 74,424 L78,414 L80,406 Z' },
  { key: 'pie_der', label: 'Pie der.',
    d: 'M110,390 L120,390 L120,406 L126,418 C128,424 126,430 120,432 L108,432 C104,432 102,428 104,424 L108,414 L110,406 Z' },
]


// ─── LATERAL VIEW ───
// ViewBox: 0 0 100 440. Side profile facing left.

const LATERAL_OUTLINE = `
  M50,2
  C60,2 66,6 66,14 L66,28 C66,36 62,42 58,44
  L60,56
  C66,58 72,62 76,68 C80,74 82,80 82,88
  L84,110 L84,130 L82,160 L78,186
  L76,210 L74,260 L73,300 L72,320 L71,370 L70,390
  L70,406 L76,418 C78,424 76,430 70,432
  L58,432 C54,432 52,428 54,424
  L58,414 L60,406 L60,390 L59,370 L58,320
  L57,300 L56,260 L54,210 L52,186
  L48,160 L46,130 L44,110
  L42,88 C40,80 38,74 34,68
  C30,62 24,58 20,56
  L22,44 C18,42 14,36 14,28 L14,14 C14,6 20,2 30,2 Z
`

const LATERAL_REGIONS = [
  // Head
  { key: 'craneo', label: 'Cráneo',
    d: 'M14,4 C14,4 20,2 30,2 L50,2 C60,2 66,6 66,14 L66,28 C66,36 62,42 58,44 L22,44 C18,42 14,36 14,28 L14,14 Z' },

  // Spine regions (lateral-exclusive)
  { key: 'cervical', label: 'C. cervical',
    d: 'M46,44 L58,44 L60,56 L48,56 Z' },
  { key: 'dorsal', label: 'C. dorsal',
    d: 'M60,56 L76,68 C80,74 82,80 82,88 L84,110 L62,110 L58,88 L54,68 Z' },
  { key: 'lumbar', label: 'C. lumbar',
    d: 'M62,110 L84,110 L84,130 L82,160 L60,160 L58,130 Z' },
  { key: 'sacro', label: 'Sacro-coxis',
    d: 'M60,160 L82,160 L78,186 L56,186 Z' },

  // Torso side
  { key: 'torax', label: 'Tórax (lateral)',
    d: 'M20,56 L48,56 L54,68 L58,88 L62,110 L34,110 L30,88 L26,68 C24,62 22,58 20,56 Z' },
  { key: 'abdomen', label: 'Abdomen (lateral)',
    d: 'M34,110 L62,110 L60,160 L36,160 Z' },
  { key: 'pelvis', label: 'Pelvis (lateral)',
    d: 'M36,160 L60,160 L56,186 L38,186 Z' },
]


function BodySvg({ outline, regions, selected, hovered, setHovered, onSelect, viewBox }) {
  return (
    <svg viewBox={viewBox} className="w-full h-full" style={{ maxHeight: '420px' }}>
      {/* Silhouette background */}
      <path d={outline} fill="#f1f5f9" stroke="none" />

      {/* Clickable regions — always show borders so zones are visible */}
      {regions.map(r => {
        const isSel = selected === r.key
        const isHov = hovered === r.key && !isSel
        return (
          <path
            key={r.key}
            d={r.d}
            fill={isSel ? 'rgba(59,130,246,0.35)' : isHov ? 'rgba(59,130,246,0.12)' : 'transparent'}
            stroke={isSel ? '#3b82f6' : '#b0bec5'}
            strokeWidth={isSel ? 1.5 : 0.4}
            strokeDasharray={isSel ? 'none' : 'none'}
            className="cursor-pointer"
            style={{ transition: 'fill 0.1s ease' }}
            onMouseEnter={() => setHovered(r.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(r.key)}
          />
        )
      })}

      {/* Outline on top */}
      <path d={outline} fill="none" stroke="#78909c" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}


export default function BodyMap({ selected, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [view, setView] = useState('front')

  const currentRegions = view === 'front' ? FRONT_REGIONS : LATERAL_REGIONS
  const allRegions = [...FRONT_REGIONS, ...LATERAL_REGIONS]
  const hovLabel = hovered ? currentRegions.find(r => r.key === hovered)?.label : null
  const selLabel = selected ? allRegions.find(r => r.key === selected)?.label : null
  const activeLabel = hovLabel || selLabel || null

  return (
    <div className="flex flex-col items-center gap-2">
      {/* View toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        <button
          onClick={() => setView('front')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            view === 'front' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >Frontal</button>
        <button
          onClick={() => setView('lateral')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            view === 'lateral' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >Lateral</button>
      </div>

      {/* Tooltip */}
      <div className={`h-7 flex items-center justify-center px-3 rounded-lg text-xs font-medium transition-all ${
        activeLabel
          ? (hovered && hovered !== selected ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700')
          : 'text-slate-400'
      }`}>
        {activeLabel || 'Selecciona una zona del cuerpo'}
      </div>

      {/* Body */}
      <div className="w-full" style={{ maxWidth: view === 'front' ? '180px' : '100px' }}>
        {view === 'front' ? (
          <BodySvg
            outline={FRONT_OUTLINE}
            regions={FRONT_REGIONS}
            selected={selected}
            hovered={hovered}
            setHovered={setHovered}
            onSelect={onSelect}
            viewBox="10 -2 180 440"
          />
        ) : (
          <BodySvg
            outline={LATERAL_OUTLINE}
            regions={LATERAL_REGIONS}
            selected={selected}
            hovered={hovered}
            setHovered={setHovered}
            onSelect={onSelect}
            viewBox="8 -2 84 440"
          />
        )}
      </div>

      {view === 'lateral' && (
        <p className="text-xs text-slate-400 text-center">Vista lateral — ideal para columna</p>
      )}
    </div>
  )
}

export function getBodyMapLabel(key) {
  const all = [...FRONT_REGIONS, ...LATERAL_REGIONS]
  return all.find(r => r.key === key)?.label || key
}

export const BODY_MAP_REGIONS = [...new Set([...FRONT_REGIONS, ...LATERAL_REGIONS].map(r => r.key))]
