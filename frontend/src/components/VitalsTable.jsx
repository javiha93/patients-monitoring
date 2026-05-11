import { useState } from 'react'
import { Trash2 } from 'lucide-react'

const ranges = {
  systolicBp: { low: 90, high: 140 },
  diastolicBp: { low: 60, high: 90 },
  heartRate: { low: 60, high: 100 },
  temperature: { low: 36.0, high: 37.5 },
  spo2: { low: 94, high: 100 },
  respiratoryRate: { low: 12, high: 20 },
  painLevel: { low: 0, high: 3 },
}

function cellClass(key, val) {
  if (val == null) return ''
  const r = ranges[key]
  if (!r) return ''
  if (val > r.high) return 'bg-red-50 text-red-600 font-semibold'
  if (val < r.low) return 'bg-amber-50 text-amber-600 font-semibold'
  return ''
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const rows = [
  { key: 'systolicBp', label: 'TAS (mmHg)' },
  { key: 'diastolicBp', label: 'TAD (mmHg)' },
  { key: 'heartRate', label: 'FC (bpm)' },
  { key: 'temperature', label: 'Tª (°C)' },
  { key: 'spo2', label: 'SpO2 (%)' },
  { key: 'respiratoryRate', label: 'FR (rpm)' },
  { key: 'painLevel', label: 'Dolor (EVA)' },
  { key: 'bloodGlucose', label: 'Glucemia (mg/dL)' },
  { key: 'diuresis', label: 'Diuresis (mL)' },
]

const deviceLabels = {
  none: 'Aire ambiente',
  nasal_cannula: 'Gafas nasales',
  ventimax: 'Ventimax',
  reservoir_mask: 'Reservorio',
  cpap: 'CPAP',
  bipap: 'BiPAP',
  high_flow_cannula: 'OAF',
  mechanical_ventilation: 'VM',
}

export default function VitalsTable({ vitals, onEdit, onDelete }) {
  const [hoveredCol, setHoveredCol] = useState(null)

  if (!vitals || vitals.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay registros de constantes</p>
  }

  // Most recent first
  const sorted = [...vitals].reverse()

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 sticky left-0 bg-slate-50 z-10 min-w-[140px]">Constante</th>
            {sorted.map(v => (
              <th
                key={v.id}
                className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 whitespace-nowrap relative"
                onMouseEnter={() => setHoveredCol(v.id)}
                onMouseLeave={() => setHoveredCol(null)}
              >
                <span>{formatTime(v.recordedAt)}</span>
                {onDelete && hoveredCol === v.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(v.id) }}
                    className="absolute -top-1 -right-1 bg-white border border-red-200 rounded-full p-0.5 shadow-sm text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Borrar registro"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key} className="border-t border-slate-100">
              <th className="px-3 py-2.5 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-white z-10">{r.label}</th>
              {sorted.map(v => {
                const val = v[r.key]
                return (
                  <td
                    key={v.id}
                    className={`px-3 py-2.5 text-center text-sm whitespace-nowrap ${cellClass(r.key, val)} ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                    onClick={onEdit ? () => onEdit(v) : undefined}
                    onMouseEnter={() => setHoveredCol(v.id)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    {val != null ? val : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
          {/* Respiratory support row */}
          <tr className="border-t border-slate-100">
            <th className="px-3 py-2.5 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-white z-10">Soporte resp.</th>
            {sorted.map(v => {
              const rs = v.respiratorySupport
              const label = rs ? deviceLabels[rs.deviceType] || rs.deviceType : 'Aire ambiente'
              const detail = rs && rs.flowRate ? ` ${rs.flowRate}L` : ''
              return (
                <td
                  key={v.id}
                  className={`px-3 py-2.5 text-center text-xs whitespace-nowrap text-slate-500 ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                  onClick={onEdit ? () => onEdit(v) : undefined}
                  onMouseEnter={() => setHoveredCol(v.id)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  {label}{detail}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
