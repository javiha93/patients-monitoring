import { useState, useRef } from 'react'

/**
 * Dual-view interactive body map: front (anterior) + side (lateral).
 * Front view for most regions; lateral view for spine and side-specific areas.
 * Tooltip rendered as HTML overlay to avoid SVG clipping.
 */

/* ─── FRONT VIEW ─── */
const FRONT_SILHOUETTE = `
  M150,18 C150,8 156,2 165,2 C174,2 180,8 180,18 L180,32
  C180,40 175,44 170,46 L170,52
  C180,52 198,54 210,58 C222,62 228,68 232,76
  L240,100 L246,118 L252,140 L258,158 L264,178
  C266,184 264,186 260,186
  L256,178 L250,160 L244,142 L238,124 L232,106
  C228,94 224,86 218,78
  L214,86 L210,100 L208,120 L208,148
  C208,156 210,162 212,168
  L214,180 L216,200 L218,230 L220,250
  C222,260 224,268 224,274
  L224,290 L226,300 L232,310
  C234,314 232,318 226,318
  L210,318 C206,318 204,314 206,310
  L210,300 L210,290 L208,274
  C208,268 206,260 204,250
  L202,230 L200,200 L198,180
  C196,170 194,162 192,156
  L190,148 L188,130 L186,120
  C184,114 182,112 180,112
  L165,112
  L150,112
  C148,112 146,114 144,120
  L142,130 L140,148
  L138,156 C136,162 134,170 132,180
  L130,200 L128,230 L126,250
  C124,260 122,268 122,274
  L120,290 L120,300 L124,310
  C126,314 124,318 118,318
  L104,318 C98,318 96,314 98,310
  L104,300 L106,290 L106,274
  C106,268 108,260 110,250
  L112,230 L114,200 L116,180
  C118,162 120,156 122,148
  L122,120 L120,100 L116,86
  L112,78 C106,86 102,94 98,106
  L92,124 L86,142 L80,160 L74,178
  L70,186 C66,186 64,184 66,178
  L72,158 L78,140 L84,118 L90,100
  L98,76 C102,68 108,62 120,58
  C132,54 150,52 160,52
  L160,46 C155,44 150,40 150,32 Z
`

const FRONT_REGIONS = [
  { key: 'craneo', label: 'Cráneo', d: 'M150,6 C150,2 156,0 165,0 C174,0 180,2 180,6 L180,26 C180,32 176,36 165,36 C154,36 150,32 150,26 Z' },
  { key: 'senos', label: 'Senos paranasales', d: 'M157,18 L173,18 L173,30 L157,30 Z' },
  { key: 'cervical', label: 'C. cervical', d: 'M158,36 L172,36 L172,52 L158,52 Z' },
  { key: 'hombro_izq', label: 'Hombro izq.', d: 'M120,56 Q140,52 158,54 L154,70 Q138,64 120,68 Z' },
  { key: 'hombro_der', label: 'Hombro der.', d: 'M172,54 Q190,52 210,56 L210,68 Q192,64 176,70 Z' },
  { key: 'torax', label: 'Tórax', d: 'M140,54 L190,54 L190,100 L140,100 Z' },
  { key: 'costillas', label: 'Costillas', d: 'M130,68 L140,58 L140,100 L134,100 Z M190,58 L200,68 L196,100 L190,100 Z' },
  { key: 'esternon', label: 'Esternón', d: 'M160,56 L170,56 L170,94 L160,94 Z' },
  { key: 'abdomen', label: 'Abdomen', d: 'M136,100 L194,100 L194,140 L136,140 Z' },
  { key: 'pelvis', label: 'Pelvis', d: 'M132,140 L198,140 Q198,164 165,168 Q132,164 132,140 Z' },
  { key: 'cadera_izq', label: 'Cadera izq.', d: 'M132,142 L158,142 Q150,164 140,168 Q132,162 132,142 Z' },
  { key: 'cadera_der', label: 'Cadera der.', d: 'M172,142 L198,142 Q198,162 190,168 Q180,164 172,142 Z' },
  { key: 'humero_izq', label: 'Húmero izq.', d: 'M108,68 L122,66 L116,100 L104,102 Z' },
  { key: 'humero_der', label: 'Húmero der.', d: 'M208,66 L222,68 L226,102 L214,100 Z' },
  { key: 'codo_izq', label: 'Codo izq.', d: 'M100,102 L116,100 L112,118 L96,120 Z' },
  { key: 'codo_der', label: 'Codo der.', d: 'M214,100 L230,102 L234,120 L218,118 Z' },
  { key: 'antebrazo_izq', label: 'Antebrazo izq.', d: 'M90,120 L112,118 L106,152 L84,154 Z' },
  { key: 'antebrazo_der', label: 'Antebrazo der.', d: 'M218,118 L240,120 L246,154 L224,152 Z' },
  { key: 'muneca_izq', label: 'Muñeca izq.', d: 'M80,154 L106,152 L104,166 L78,168 Z' },
  { key: 'muneca_der', label: 'Muñeca der.', d: 'M224,152 L250,154 L252,168 L226,166 Z' },
  { key: 'mano_izq', label: 'Mano izq.', d: 'M70,168 L104,166 L100,194 L64,194 Z' },
  { key: 'mano_der', label: 'Mano der.', d: 'M226,166 L260,168 L266,194 L230,194 Z' },
  { key: 'femur_izq', label: 'Fémur izq.', d: 'M134,168 L162,168 L158,240 L138,240 Z' },
  { key: 'femur_der', label: 'Fémur der.', d: 'M168,168 L196,168 L192,240 L172,240 Z' },
  { key: 'rodilla_izq', label: 'Rodilla izq.', d: 'M136,240 L160,240 L160,260 L136,260 Z' },
  { key: 'rodilla_der', label: 'Rodilla der.', d: 'M170,240 L194,240 L194,260 L170,260 Z' },
  { key: 'tibia_izq', label: 'Tibia izq.', d: 'M138,260 L158,260 L154,306 L142,306 Z' },
  { key: 'tibia_der', label: 'Tibia der.', d: 'M172,260 L192,260 L188,306 L176,306 Z' },
  { key: 'tobillo_izq', label: 'Tobillo izq.', d: 'M140,306 L156,306 L156,316 L140,316 Z' },
  { key: 'tobillo_der', label: 'Tobillo der.', d: 'M174,306 L190,306 L190,316 L174,316 Z' },
  { key: 'pie_izq', label: 'Pie izq.', d: 'M130,316 L156,316 Q156,326 140,328 L128,326 Z' },
  { key: 'pie_der', label: 'Pie der.', d: 'M174,316 L200,316 L202,326 Q190,328 174,326 Z' },
]

/* ─── LATERAL VIEW ─── */
const LATERAL_SILHOUETTE = `
  M60,18 C60,8 66,2 74,2 C82,2 88,8 88,18 L88,28
  C88,36 84,40 80,42
  L82,48 C90,50 96,54 100,60
  L104,76 L106,100 L106,140
  Q106,160 104,168
  L104,200 L106,240 L108,260
  L110,290 L112,300 L118,310
  C120,314 118,318 112,318
  L96,318 C92,318 90,314 92,310
  L96,300 L96,290 L94,274
  L92,260 L90,240 L88,200
  L86,180 L84,168
  Q82,160 80,148
  L78,120 L74,100 L70,80
  C66,68 62,60 56,54
  L52,50 L50,42
  C46,40 42,36 42,28
  L42,18 C42,8 48,2 56,2
  Z
`

const LATERAL_REGIONS = [
  { key: 'craneo', label: 'Cráneo', d: 'M42,6 C42,0 50,0 60,0 L74,0 C84,0 88,4 88,10 L88,28 C88,34 84,38 78,38 L52,38 C46,38 42,34 42,28 Z' },
  { key: 'cervical', label: 'C. cervical', d: 'M56,38 L78,38 L80,52 L54,52 Z' },
  { key: 'dorsal', label: 'C. dorsal', d: 'M72,52 L84,52 L86,100 L74,100 Z' },
  { key: 'lumbar', label: 'C. lumbar', d: 'M74,100 L86,100 L86,140 L74,140 Z' },
  { key: 'sacro', label: 'Sacro-coxis', d: 'M74,140 L86,140 L86,160 L76,160 Z' },
  { key: 'torax', label: 'Tórax', d: 'M54,52 L72,52 L74,100 L56,100 Z' },
  { key: 'abdomen', label: 'Abdomen', d: 'M56,100 L74,100 L74,140 L58,140 Z' },
  { key: 'pelvis', label: 'Pelvis', d: 'M58,140 L86,140 Q88,164 72,168 Q56,164 58,140 Z' },
]

function getCenter(d) {
  const nums = d.match(/[\d.]+/g)?.map(Number) || []
  const xs = [], ys = []
  for (let i = 0; i < nums.length; i += 2) {
    if (i + 1 < nums.length) { xs.push(nums[i]); ys.push(nums[i + 1]) }
  }
  return {
    x: xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0,
    y: ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0,
  }
}

function BodySvg({ silhouette, regions, selected, hovered, setHovered, onSelect, viewBox }) {
  return (
    <svg viewBox={viewBox} className="w-full h-full select-none" style={{ maxHeight: '420px' }}>
      <path d={silhouette} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" strokeLinejoin="round" />
      {regions.map(r => {
        const isSel = selected === r.key
        const isHov = hovered === r.key
        return (
          <path
            key={r.key}
            d={r.d}
            fill={isSel ? 'rgba(59,130,246,0.4)' : isHov ? 'rgba(59,130,246,0.2)' : 'transparent'}
            stroke={isSel ? '#3b82f6' : isHov ? '#93c5fd' : 'transparent'}
            strokeWidth={isSel ? 2 : 1}
            className="cursor-pointer"
            style={{ transition: 'fill 0.12s, stroke 0.12s' }}
            onMouseEnter={() => setHovered(r.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(r.key)}
          />
        )
      })}
    </svg>
  )
}

export default function BodyMap({ selected, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [view, setView] = useState('front') // 'front' | 'lateral'
  const containerRef = useRef(null)

  const allRegions = [...FRONT_REGIONS, ...LATERAL_REGIONS]
  const activeLabel = (hovered || selected)
    ? allRegions.find(r => r.key === (hovered || selected))?.label
    : null

  return (
    <div className="flex flex-col items-center gap-2" ref={containerRef}>
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

      {/* Tooltip bar */}
      <div className={`h-7 flex items-center justify-center px-3 rounded-lg text-xs font-medium transition-all ${
        activeLabel
          ? (hovered && hovered !== selected ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700')
          : 'text-slate-400'
      }`}>
        {activeLabel || 'Selecciona una zona del cuerpo'}
      </div>

      {/* Body SVGs */}
      <div className="w-full" style={{ maxWidth: view === 'front' ? '240px' : '140px' }}>
        {view === 'front' ? (
          <BodySvg
            silhouette={FRONT_SILHOUETTE}
            regions={FRONT_REGIONS}
            selected={selected}
            hovered={hovered}
            setHovered={setHovered}
            onSelect={onSelect}
            viewBox="50 -4 240 336"
          />
        ) : (
          <BodySvg
            silhouette={LATERAL_SILHOUETTE}
            regions={LATERAL_REGIONS}
            selected={selected}
            hovered={hovered}
            setHovered={setHovered}
            onSelect={onSelect}
            viewBox="30 -4 100 336"
          />
        )}
      </div>

      {/* Hint */}
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
