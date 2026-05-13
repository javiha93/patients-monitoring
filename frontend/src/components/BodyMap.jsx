import { useState, useCallback } from 'react'

/**
 * Custom body map using polygon data extracted from react-body-highlighter.
 * Polygons are regrouped into radiology zones with left/right distinction.
 * Hands, wrists, ankles, feet added manually.
 * ViewBox: 0 0 100 225 (extended from original 200 to fit feet).
 */

// Anterior polygons grouped into radiology zones. Left/right split by x-center vs 50.
// Points from react-body-highlighter (viewBox 0 0 100 200), extended to 225 for feet.
const FRONT_ZONES = [
  { key: 'craneo', polys: [
    '42.4 2.9 40 11.8 42 19.6 46.1 23.3 49.8 25.3 54.7 22.4 57.6 19.2 59.2 10.2 57.1 2.4 49.8 0',
  ]},
  { key: 'cervical', polys: [
    '55.5 23.7 50.6 33.5 50.6 39.2 61.6 40 70.6 44.9 69.4 36.7 63.3 35.1 58.4 30.6',
    '29 44.9 30.2 37.1 36.3 35.1 41.2 30.2 44.5 24.5 49 33.9 48.6 39.2 38 39.6',
  ]},
  { key: 'hombro_der', polys: [
    '78.4 53.1 79.6 47.8 79.2 41.2 75.9 38 71 36.3 72.2 42.9 71.4 47.3',
  ]},
  { key: 'hombro_izq', polys: [
    '28.2 47.3 21.2 53.1 20 47.8 20.4 40.8 24.5 37.1 28.6 37.1 26.9 43.3',
  ]},
  { key: 'torax', polys: [
    '51.8 41.6 51 55.1 58 58 67.8 55.5 70.6 47.3 62 41.6',
    '29.8 46.5 31.4 55.5 40.8 58 48.2 55.1 47.8 42 37.6 42',
  ]},
  { key: 'costillas', polys: [
    '68.6 63.3 67.3 57.1 58.8 59.6 60 64.1 60.4 83.3 65.7 78.8 66.5 69.8',
    '33.9 78.4 33.1 71.8 31 63.3 32.2 57.1 40.8 59.2 39.2 63.3 39.2 83.7',
  ]},
  { key: 'abdomen', polys: [
    '56.3 59.2 58 64.1 58.4 78 58.4 92.7 56.3 98.4 55.1 104.1 51.4 107.8 51 84.5 50.6 67.3 51 57.1',
    '43.7 58.8 48.6 57.1 49 67.3 48.6 84.5 48.2 107.3 44.5 103.7 40.8 91.4 40.8 78.4 41.2 64.5',
  ]},
  { key: 'pelvis', polys: [
    '52.7 110.2 54.3 124.9 60 110.2 62 100 64.9 94.3 60 92.7 56.7 104.5',
    '47.8 110.6 44.9 125.3 42 115.9 40.4 113.1 39.6 107.3 38 102.4 34.7 93.9 39.6 92.2 41.6 99.2 43.7 105.3',
  ]},
  { key: 'humero_der', polys: [
    '71.4 49.4 70.2 54.7 76.3 66.1 81.6 71.8 82.9 69 78.8 55.5',
    '69.4 55.5 69.4 61.6 75.9 72.7 77.6 70.2 75.5 67.3',
  ]},
  { key: 'humero_izq', polys: [
    '16.7 68.2 18 71.4 22.9 66.1 29 53.9 27.8 49.4 20.4 55.9',
    '22.4 69.4 29.8 55.5 29.8 60.8 22.9 73.1',
  ]},
  { key: 'antebrazo_der', polys: [
    '84.5 69.8 83.3 73.5 80 73.1 95.1 98.4 100 100.4 93.5 89.4 89.8 76.3',
    '77.6 72.2 77.6 77.6 80.4 84.1 85.3 89.8 92.2 101.2 94.7 99.6',
  ]},
  { key: 'antebrazo_izq', polys: [
    '6.1 88.6 10.2 75.1 14.7 70.2 16.3 74.3 19.2 73.5 4.5 97.6 0 100',
    '6.9 101.2 13.5 90.6 18.8 84.1 21.6 77.1 21.2 71.8 4.9 98.8',
  ]},
  { key: 'muneca_der', polys: ['92 101 95 100 100 101 100 106 94 106']},
  { key: 'muneca_izq', polys: ['0 101 5 100 8 101 8 106 0 106']},
  { key: 'mano_der', polys: ['94 106 100 106 102 116 96 116']},
  { key: 'mano_izq', polys: ['0 106 6 106 4 116 -2 116']},
  { key: 'femur_der', polys: [
    '63.3 105.7 64.5 100 67 94.7 70.2 101.2 71 111.8 68.2 133.1 65.3 137.6 62.4 128.6 62 111.4',
    '59.6 145.7 55.5 129 60.8 113.9 61.2 130.2 64.1 139.6 62.9 146.5',
    '71.8 113.1 73.9 124.1 73.9 140.4 72.7 145.7 66.5 138.4 70.2 133.5',
  ]},
  { key: 'femur_izq', polys: [
    '34.7 98.8 37.1 108.2 37.1 127.8 34.3 137.1 31 132.7 29.4 120 28.2 111.4 29.4 100.8 32.2 94.7',
    '38.8 129.4 38.4 112.2 41.2 118.4 44.5 129.4 42.9 135.1 40 146.1 36.3 146.5 35.5 140',
    '32.7 138.4 26.5 145.7 25.7 136.7 25.7 127.3 27 114.3 29.4 133.5',
  ]},
  { key: 'rodilla_der', polys: [
    '65.7 140 72.2 147.8 72.2 152.2 69.8 157.1 64.9 156.7 62.9 151',
  ]},
  { key: 'rodilla_izq', polys: [
    '33.9 140 34.7 143.3 35.5 147.3 36.3 151 35.1 156.7 29.8 156.7 27.3 152.7 27.3 147.3 30.2 144.1',
  ]},
  { key: 'tibia_der', polys: [
    '71.4 160.4 73.5 153.5 76.7 161.2 79.6 167.8 78.4 187.8 79.6 195.5 74.7 195.5',
    '72.7 195.1 69.8 159.2 65.3 158.4 64.1 162.4 64.1 165.3 65.7 177.1',
  ]},
  { key: 'tibia_izq', polys: [
    '24.9 194.7 27.8 164.9 28.2 160.4 26.1 154.3 24.9 157.6 22.4 161.6 20.8 167.8 22 188.2 20.8 195.5',
    '35.5 158.4 35.9 162.4 35.9 166.9 35.1 172.2 35.1 176.7 32.2 182 30.6 187.3 27 194.7 27.3 187.8 28.2 180.4 28.6 175.5 29 169.8 29.8 164.1 30.2 158.8',
  ]},
  { key: 'tobillo_der', polys: ['65 195 79 195 80 204 64 204']},
  { key: 'tobillo_izq', polys: ['21 195 35 195 36 204 20 204']},
  { key: 'pie_der', polys: ['64 204 80 204 82 210 80 216 64 216 62 210']},
  { key: 'pie_izq', polys: ['20 204 36 204 38 210 36 216 20 216 18 210']},
]

const BACK_ZONES = [
  { key: 'craneo', polys: [
    '50.6 0 46 0.9 40.9 5.5 40.4 12.8 45.1 20 55.7 20 59.1 13.6 59.6 4.7 55.7 1.3',
  ]},
  { key: 'cervical', polys: [
    '44.7 21.7 47.7 21.7 47.2 38.3 47.7 50 43.8 27.2',
    '52.3 21.7 55.7 21.7 56.6 27.2 52.3 50 53.2 38.3',
  ]},
  { key: 'dorsal', polys: [
    '44.7 21.7 43.8 27.2 39.1 33.2 31.1 36.6 35.3 40.9 36.6 54 47.2 66.4 47.7 50',
    '52.3 21.7 56.6 27.2 60.9 32.8 68.9 36.6 64.7 40.4 63.4 54 52.3 66.4 52.3 50',
    '31.1 38.7 28.1 49 28.5 55.3 34 75.3 47.2 71.1 47.2 66.4 36.6 54 33.6 41.3',
    '68.9 38.7 71.9 49.4 71.5 56.2 66 75.3 52.8 71.1 52.8 66.4 63.4 54.5 66.4 41.7',
  ]},
  { key: 'hombro_der', polys: [
    '71.1 37 78.3 39.6 82.6 44.7 81.7 53.6 74.9 49 72.3 45.1',
  ]},
  { key: 'hombro_izq', polys: [
    '29.4 37 23 39.1 17.4 44.3 18.3 53.6 24.3 49.4 27.2 46.4',
  ]},
  { key: 'lumbar', polys: [
    '47.7 72.8 34.5 77 35.3 83.4 49.4 102.1 46.8 83',
    '52.3 72.8 65.5 77 64.7 83.4 50.6 102.1 53.2 83.8',
  ]},
  { key: 'humero_der', polys: [
    '73.6 50.2 82.1 55.7 86 73.2 83.4 82.1 77.9 63 73.2 55.7',
    '72.8 58.3 77 64.7 80.4 77.4 76.6 75.3 72.8 69',
  ]},
  { key: 'humero_izq', polys: [
    '26.8 49.8 17.9 55.7 14.5 72.3 16.6 81.7 21.7 63.8 26.8 55.7',
    '26.8 58.3 26.8 68.5 23 75.3 19.1 77.4 22.6 65.5',
  ]},
  { key: 'antebrazo_der', polys: [
    '86.4 75.7 91.1 83.4 93.2 94 100 106.4 96.2 104.3 88.1 89.4 84.3 83.8',
    '81.3 79.6 77.4 77.9 79.1 84.7 91.1 103.8 93.2 108.9 94.5 104.7',
  ]},
  { key: 'antebrazo_izq', polys: [
    '13.6 75.7 8.9 83.8 6.8 93.6 0 106.4 3.8 104.3 12.3 88.5 15.7 83',
    '18.7 79.6 22.1 77.9 20.9 84.2 9.4 103 6.8 108.5 5.1 104.7',
  ]},
  { key: 'muneca_der', polys: ['92 107 96 105 100 107 100 112 94 112']},
  { key: 'muneca_izq', polys: ['0 107 4 105 8 107 8 112 0 112']},
  { key: 'mano_der', polys: ['94 112 100 112 102 122 96 122']},
  { key: 'mano_izq', polys: ['0 112 6 112 4 122 -2 122']},
  { key: 'sacro', polys: [
    '44.7 99.6 30.2 108.5 29.8 118.7 31.5 126 47.2 121.3 49.4 114.9',
    '55.3 99.1 51.1 114.5 52.3 120.9 68.1 126 69.8 119.1 69.4 108.5',
  ]},
  { key: 'cadera_der', polys: [
    '48.1 123 46.1 123 41.3 125.5 45.1 144.3 48.5 135.7 48.9 129.4',
    '51.9 122.6 55.7 123.4 59.1 126 54.9 144.3 51.9 136.2 51.1 129.4',
  ]},
  { key: 'femur_der', polys: [
    '71.5 121.7 69.4 129 63.8 126 65.5 136.6 66.4 150.2 71.1 158.3 71.5 147.7 72.8 142.1 73.6 131.9',
    '61.7 125.5 63.4 136.2 64.3 153.2 60 166.8 56.2 146.4',
  ]},
  { key: 'femur_izq', polys: [
    '28.9 122.1 31.1 129.4 36.6 126 35.3 135.3 34.5 150.2 29.4 158.3 28.9 146.8 27.7 141.3 27.2 131.5',
    '38.8 125.5 44.3 146 40.4 166.8 36.2 152.8 37 135.3',
  ]},
  { key: 'rodilla_der', polys: [
    '66.4 153.6 63 163 66.8 166.4 69.4 159.1',
  ]},
  { key: 'rodilla_izq', polys: [
    '34.5 153.2 31.1 159.1 33.6 166.4 37.4 162.6',
  ]},
  { key: 'tibia_der', polys: [
    '65.5 165.1 61.3 168.5 61.7 190.6 66.4 199.6 70.6 191.9 68.9 179.6 66.8 170.2',
    '70.6 160.4 72.3 168.5 75.7 179.1 76.6 192.8 74.5 196.6 72.3 193.6 70.6 179.6 68.1 168.1',
  ]},
  { key: 'tibia_izq', polys: [
    '29.4 160.4 28.5 167.2 24.7 179.6 23.8 192.8 25.5 197 28.5 193.2 29.8 180 31.9 171.1 31.9 166.8',
    '37.4 165.1 35.3 167.7 33.2 171.9 31.1 180.4 30.2 191.9 34 200 38.8 190.6 39.1 169',
  ]},
  { key: 'tobillo_der', polys: [
    '70.8 195.7 73.6 198.3 71.9 213.2 70.2 219.6 67.2 202.1',
  ]},
  { key: 'tobillo_izq', polys: [
    '28.5 195.7 30.2 195.7 33.6 201.7 30.6 220 28.5 213.6 26.8 198.3',
  ]},
  { key: 'pie_der', polys: ['67 219 72 220 74 225 67 225']},
  { key: 'pie_izq', polys: ['28 219 33 220 33 225 26 225']},
]
const REGION_LABELS = {
  craneo: 'Cráneo', senos: 'Senos paranasales', mandibula: 'Mandíbula',
  cervical: 'C. cervical',
  hombro_izq: 'Hombro izq.', hombro_der: 'Hombro der.',
  torax: 'Tórax', esternon: 'Esternón', costillas: 'Costillas',
  humero_izq: 'Húmero izq.', humero_der: 'Húmero der.',
  codo_izq: 'Codo izq.', codo_der: 'Codo der.',
  antebrazo_izq: 'Antebrazo izq.', antebrazo_der: 'Antebrazo der.',
  muneca_izq: 'Muñeca izq.', muneca_der: 'Muñeca der.',
  mano_izq: 'Mano izq.', mano_der: 'Mano der.',
  abdomen: 'Abdomen', pelvis: 'Pelvis',
  cadera_izq: 'Cadera izq.', cadera_der: 'Cadera der.',
  femur_izq: 'Fémur izq.', femur_der: 'Fémur der.',
  rodilla_izq: 'Rodilla izq.', rodilla_der: 'Rodilla der.',
  tibia_izq: 'Tibia izq.', tibia_der: 'Tibia der.',
  tobillo_izq: 'Tobillo izq.', tobillo_der: 'Tobillo der.',
  pie_izq: 'Pie izq.', pie_der: 'Pie der.',
  dorsal: 'C. dorsal', lumbar: 'C. lumbar', sacro: 'Sacro-coxis',
}

function BodySvg({ zones, selected, hovered, setHovered, onSelect, viewBox }) {
  return (
    <svg viewBox={viewBox} className="w-full h-full" style={{ maxHeight: '440px' }}>
      {zones.map(zone => {
        const isSel = selected === zone.key
        const isHov = hovered === zone.key && !isSel
        return zone.polys.map((pts, i) => (
          <polygon
            key={zone.key + '_' + i}
            points={pts}
            fill={isSel ? 'rgba(59,130,246,0.35)' : isHov ? 'rgba(59,130,246,0.15)' : '#dce3eb'}
            stroke={isSel ? '#3b82f6' : '#b0bec5'}
            strokeWidth={isSel ? 0.8 : 0.3}
            className="cursor-pointer"
            style={{ transition: 'fill 0.1s ease' }}
            onMouseEnter={() => setHovered(zone.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(zone.key)}
          />
        ))
      })}
    </svg>
  )
}

export default function BodyMap({ selected, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [view, setView] = useState('front')

  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES
  const activeLabel = (hovered || selected) ? REGION_LABELS[hovered || selected] : null

  return (
    <div className="flex flex-col items-center gap-2">
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

      <div className={`h-7 flex items-center justify-center px-3 rounded-lg text-xs font-medium transition-all ${
        activeLabel
          ? (hovered && hovered !== selected ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700')
          : 'text-slate-400'
      }`}>
        {activeLabel || 'Selecciona una zona del cuerpo'}
      </div>

      <div className="w-full" style={{ maxWidth: '200px' }}>
        <BodySvg
          zones={zones}
          selected={selected}
          hovered={hovered}
          setHovered={setHovered}
          onSelect={onSelect}
          viewBox={view === 'front' ? '-5 -2 110 222' : '-5 -2 110 232'}
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
