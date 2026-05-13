import { useState, useCallback } from 'react'
import Model from 'react-body-highlighter'

/**
 * Interactive body map using react-body-highlighter for anatomically correct SVGs.
 * Front (anterior) view for most regions; back (posterior) view for spine.
 * Muscle groups are mapped to radiology region keys.
 */

// Map: muscle name → radiology region key
const MUSCLE_TO_REGION_FRONT = {
  head: 'craneo',
  neck: 'cervical',
  chest: 'torax',
  abs: 'abdomen',
  obliques: 'costillas',
  'front-deltoids': 'hombro',
  biceps: 'humero',
  triceps: 'humero',
  forearm: 'antebrazo',
  quadriceps: 'femur',
  adductor: 'cadera',
  abductors: 'pelvis',
  knees: 'rodilla',
  calves: 'tibia',
}

const MUSCLE_TO_REGION_BACK = {
  head: 'craneo',
  neck: 'cervical',
  trapezius: 'dorsal',
  'upper-back': 'dorsal',
  'lower-back': 'lumbar',
  'back-deltoids': 'hombro',
  triceps: 'humero',
  forearm: 'antebrazo',
  gluteal: 'sacro',
  hamstring: 'femur',
  knees: 'rodilla',
  calves: 'tibia',
  'left-soleus': 'tobillo',
  'right-soleus': 'tobillo',
}

// Reverse map: region key → muscle names (for highlighting)
function buildRegionToMuscles(map) {
  const result = {}
  for (const [muscle, region] of Object.entries(map)) {
    if (!result[region]) result[region] = []
    result[region].push(muscle)
  }
  return result
}

const REGION_TO_MUSCLES_FRONT = buildRegionToMuscles(MUSCLE_TO_REGION_FRONT)
const REGION_TO_MUSCLES_BACK = buildRegionToMuscles(MUSCLE_TO_REGION_BACK)

// All region labels
const REGION_LABELS = {
  craneo: 'Cráneo',
  senos: 'Senos paranasales',
  cervical: 'C. cervical',
  hombro: 'Hombro',
  hombro_izq: 'Hombro izq.',
  hombro_der: 'Hombro der.',
  torax: 'Tórax',
  esternon: 'Esternón',
  costillas: 'Costillas',
  humero: 'Húmero',
  humero_izq: 'Húmero izq.',
  humero_der: 'Húmero der.',
  codo: 'Codo',
  codo_izq: 'Codo izq.',
  codo_der: 'Codo der.',
  antebrazo: 'Antebrazo',
  antebrazo_izq: 'Antebrazo izq.',
  antebrazo_der: 'Antebrazo der.',
  muneca: 'Muñeca',
  muneca_izq: 'Muñeca izq.',
  muneca_der: 'Muñeca der.',
  mano: 'Mano',
  mano_izq: 'Mano izq.',
  mano_der: 'Mano der.',
  abdomen: 'Abdomen',
  pelvis: 'Pelvis',
  cadera: 'Cadera',
  cadera_izq: 'Cadera izq.',
  cadera_der: 'Cadera der.',
  dorsal: 'C. dorsal',
  lumbar: 'C. lumbar',
  sacro: 'Sacro-coxis',
  femur: 'Fémur',
  femur_izq: 'Fémur izq.',
  femur_der: 'Fémur der.',
  rodilla: 'Rodilla',
  rodilla_izq: 'Rodilla izq.',
  rodilla_der: 'Rodilla der.',
  tibia: 'Tibia',
  tibia_izq: 'Tibia izq.',
  tibia_der: 'Tibia der.',
  tobillo: 'Tobillo',
  tobillo_izq: 'Tobillo izq.',
  tobillo_der: 'Tobillo der.',
  pie: 'Pie',
  pie_izq: 'Pie izq.',
  pie_der: 'Pie der.',
  mandibula: 'Mandíbula',
}

export default function BodyMap({ selected, onSelect }) {
  const [view, setView] = useState('front') // 'front' | 'back'
  const [hoveredRegion, setHoveredRegion] = useState(null)

  const muscleMap = view === 'front' ? MUSCLE_TO_REGION_FRONT : MUSCLE_TO_REGION_BACK
  const regionToMuscles = view === 'front' ? REGION_TO_MUSCLES_FRONT : REGION_TO_MUSCLES_BACK

  // Build highlight data for the selected region
  const highlightData = []
  if (selected && regionToMuscles[selected]) {
    highlightData.push({
      name: selected,
      muscles: regionToMuscles[selected],
      frequency: 1,
    })
  }

  const handleClick = useCallback(({ muscle }) => {
    const region = muscleMap[muscle]
    if (region) {
      onSelect(region)
    }
  }, [muscleMap, onSelect])

  const activeLabel = hoveredRegion
    ? REGION_LABELS[hoveredRegion] || hoveredRegion
    : selected
      ? REGION_LABELS[selected] || selected
      : null

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
          onClick={() => setView('back')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            view === 'back' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >Posterior</button>
      </div>

      {/* Tooltip */}
      <div className={`h-7 flex items-center justify-center px-3 rounded-lg text-xs font-medium transition-all ${
        activeLabel
          ? (hoveredRegion && hoveredRegion !== selected ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700')
          : 'text-slate-400'
      }`}>
        {activeLabel || 'Selecciona una zona del cuerpo'}
      </div>

      {/* Body model */}
      <div
        className="w-full relative"
        style={{ maxWidth: '200px' }}
        onMouseMove={(e) => {
          // Find hovered polygon via DOM
          const el = document.elementFromPoint(e.clientX, e.clientY)
          if (el?.tagName === 'polygon') {
            const id = el.getAttribute('id')
            if (id && muscleMap[id]) {
              setHoveredRegion(muscleMap[id])
              return
            }
          }
          setHoveredRegion(null)
        }}
        onMouseLeave={() => setHoveredRegion(null)}
      >
        <Model
          data={highlightData}
          type={view === 'front' ? 'anterior' : 'posterior'}
          onClick={handleClick}
          bodyColor="#dce3eb"
          highlightedColors={['#93bbfd']}
          style={{ width: '100%' }}
        />
      </div>

      {view === 'back' && (
        <p className="text-xs text-slate-400 text-center">Vista posterior — ideal para columna</p>
      )}
    </div>
  )
}

export function getBodyMapLabel(key) {
  return REGION_LABELS[key] || key
}

export const BODY_MAP_REGIONS = Object.keys(REGION_LABELS)
