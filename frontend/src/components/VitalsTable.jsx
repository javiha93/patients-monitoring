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
  { key: 'respiratorySupport', label: 'Soporte resp.', special: true },
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

/**
 * Parameters shown inline per device type:
 * - nasal_cannula, reservoir_mask: flow only
 * - ventimax, high_flow_cannula: flow + FiO2
 * - mechanical_ventilation: FiO2 + PEEP
 * - cpap, bipap: nothing inline
 */
export function formatDeviceDetail(rs) {
  if (!rs) return ''
  const t = rs.deviceType
  const parts = []
  // Flow: gafas nasales, reservorio, ventimax, OAF
  if (['nasal_cannula', 'reservoir_mask', 'ventimax', 'high_flow_cannula'].includes(t) && rs.flowRate) {
    parts.push(`${rs.flowRate}L`)
  }
  // FiO2: ventimax, OAF, VM
  if (['ventimax', 'high_flow_cannula', 'mechanical_ventilation'].includes(t) && rs.fio2) {
    parts.push(`FiO₂${rs.fio2}%`)
  }
  // PEEP: VM
  if (t === 'mechanical_ventilation' && rs.peep) {
    parts.push(`PEEP ${rs.peep}`)
  }
  return parts.length ? ' ' + parts.join(' ') : ''
}

/** Tooltip for devices with extra parameters not shown inline. */
export function formatDeviceTooltip(rs) {
  if (!rs) return undefined
  if (rs.deviceType === 'bipap') {
    return `IPAP: ${rs.ipap ?? '—'} / EPAP: ${rs.epap ?? '—'} cmH₂O`
  }
  if (rs.deviceType === 'mechanical_ventilation') {
    const parts = []
    if (rs.tidalVolume) parts.push(`Vt: ${rs.tidalVolume} mL`)
    if (rs.respiratoryRateSet) parts.push(`FR prog: ${rs.respiratoryRateSet} rpm`)
    return parts.length ? parts.join(' · ') : undefined
  }
  return undefined
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
                if (r.special) {
                  // No SpO2 → show dash
                  if (v.spo2 == null) {
                    return (
                      <td key={v.id} className={`px-3 py-2.5 text-center text-xs whitespace-nowrap text-slate-300 ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                        onClick={onEdit ? () => onEdit(v) : undefined}
                        onMouseEnter={() => setHoveredCol(v.id)}
                        onMouseLeave={() => setHoveredCol(null)}
                      >—</td>
                    )
                  }
                  const rs = v.respiratorySupport
                  const label = rs ? deviceLabels[rs.deviceType] || rs.deviceType : 'Aire ambiente'
                  const detail = rs ? formatDeviceDetail(rs) : ''
                  const tooltip = rs ? formatDeviceTooltip(rs) : undefined
                  return (
                    <td
                      key={v.id}
                      className={`px-3 py-2.5 text-center text-xs whitespace-nowrap text-slate-500 ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                      onClick={onEdit ? () => onEdit(v) : undefined}
                      onMouseEnter={() => setHoveredCol(v.id)}
                      onMouseLeave={() => setHoveredCol(null)}
                      title={tooltip}
                    >
                      {label}{detail}
                      {tooltip && <span className="ml-0.5 text-blue-400 text-[9px]">ⓘ</span>}
                    </td>
                  )
                }
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
        </tbody>
      </table>
    </div>
  )
}
