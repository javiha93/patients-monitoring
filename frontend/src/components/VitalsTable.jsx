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
  { key: 'systolicBp', label: 'TAS (mmHg)', group: 'Hemodinámica', groupFirst: true },
  { key: 'diastolicBp', label: 'TAD (mmHg)', group: 'Hemodinámica' },
  { key: 'heartRate', label: 'FC (bpm)', group: 'Hemodinámica' },
  { key: 'temperature', label: 'Tª (°C)', group: 'Temperatura', groupFirst: true },
  { key: 'spo2', label: 'SpO2 (%)', group: 'Respiratorio', groupFirst: true },
  { key: 'respiratorySupport', label: 'Soporte resp.', special: true, group: 'Respiratorio' },
  { key: 'respiratoryRate', label: 'FR (rpm)', group: 'Respiratorio' },
  { key: 'painLevel', label: 'Dolor (EVA)', group: 'Dolor', groupFirst: true },
  { key: 'bloodGlucose', label: 'Glucemia (mg/dL)', group: 'Metabólico', groupFirst: true },
  { key: 'diuresis', label: 'Diuresis', special_diuresis: true, group: 'Metabólico' },
]

const groupColors = {
  'Hemodinámica': 'border-l-red-300',
  'Temperatura': 'border-l-orange-300',
  'Respiratorio': 'border-l-sky-300',
  'Dolor': 'border-l-amber-300',
  'Metabólico': 'border-l-emerald-300',
  'Drenajes': 'border-l-violet-300',
}

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

const fluidTypeLabels = {
  seroso: 'Seroso',
  serohematico: 'Serohemático',
  hematico: 'Hemático',
  purulento: 'Purulento',
}

const drainTypeLabels = {
  redon: 'Redon',
  jackson_pratt: 'J-P',
}

export default function VitalsTable({ vitals, onEdit, onDelete, activeDrains, currentUser }) {
  const [hoveredCol, setHoveredCol] = useState(null)

  if (!vitals || vitals.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay registros de constantes</p>
  }

  // Most recent first
  const sorted = [...vitals].reverse()

  // Build drain rows dynamically from active drains
  const drainRows = (activeDrains || []).map((drain, i) => ({
    key: `drain_${drain.id}`,
    label: `${drainTypeLabels[drain.type] || drain.type} #${drain.drainNumber}`,
    deviceId: drain.id,
    drainNumber: drain.drainNumber,
    group: 'Drenajes',
    groupFirst: i === 0,
  }))

  const allRows = [...rows, ...drainRows]

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
                <div>{formatTime(v.recordedAt)}</div>
                {v.recordedBy && <div className="text-[10px] font-normal text-sky-600">{v.recordedBy}</div>}
                {onDelete && hoveredCol === v.id && (!currentUser || v.recordedBy === currentUser) && (
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
          {allRows.map(r => (
            <tr key={r.key} className={r.groupFirst ? 'border-t-2 border-t-slate-200' : 'border-t border-slate-100'}>
              <th className={`px-3 py-2.5 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-white z-10 border-l-3 ${groupColors[r.group] || ''}`}>{r.label}</th>
              {sorted.map(v => {
                if (r.special_diuresis) {
                  const src = v.urineSource
                  const srcLabels = { sonda_vesical: 'SV', colector: 'Col', urostomia: 'Uro', panal: 'Pañal' }
                  const diaperLabels = { seco: 'Seco', escaso: 'Escaso', moderado: 'Moderado', abundante: 'Abundante' }
                  let display = '—'
                  if (src === 'panal') {
                    display = v.diaperAmount ? `${diaperLabels[v.diaperAmount] || v.diaperAmount}` : 'Pañal'
                  } else if (src && v.diuresis != null) {
                    display = `${v.diuresis}mL`
                  } else if (v.diuresis != null) {
                    display = `${v.diuresis}mL`
                  }
                  const srcTag = src && src !== 'panal' ? srcLabels[src] : null
                  return (
                    <td key={v.id}
                      className={`px-3 py-2.5 text-center text-sm whitespace-nowrap text-slate-600 ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                      onClick={onEdit ? () => onEdit(v) : undefined}
                      onMouseEnter={() => setHoveredCol(v.id)}
                      onMouseLeave={() => setHoveredCol(null)}
                      title={src ? (srcLabels[src] || src) : undefined}
                    >
                      {display}
                      {srcTag && <span className="ml-1 text-[9px] text-slate-400">({srcTag})</span>}
                    </td>
                  )
                }
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
                // Drain output row
                if (r.deviceId) {
                  const drainOut = (v.drainOutputs || []).find(o => o.deviceId === r.deviceId)
                  if (!drainOut || drainOut.outputMl == null) {
                    return (
                      <td key={v.id} className={`px-3 py-2.5 text-center text-xs text-slate-300 ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                        onClick={onEdit ? () => onEdit(v) : undefined}
                        onMouseEnter={() => setHoveredCol(v.id)}
                        onMouseLeave={() => setHoveredCol(null)}
                      >—</td>
                    )
                  }
                  const fluidLabel = fluidTypeLabels[drainOut.fluidType] || drainOut.fluidType
                  const vacuumIcon = drainOut.vacuumActive === false ? ' ⚠' : ''
                  const isHematico = drainOut.fluidType === 'hematico'
                  const isPurulento = drainOut.fluidType === 'purulento'
                  return (
                    <td key={v.id}
                      className={`px-3 py-2.5 text-center text-sm whitespace-nowrap ${isPurulento ? 'bg-orange-50 text-orange-700 font-semibold' : isHematico ? 'bg-red-50 text-red-700 font-semibold' : 'text-slate-600'} ${onEdit ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                      onClick={onEdit ? () => onEdit(v) : undefined}
                      onMouseEnter={() => setHoveredCol(v.id)}
                      onMouseLeave={() => setHoveredCol(null)}
                      title={`${drainOut.outputMl}mL · ${fluidLabel}${drainOut.vacuumActive === false ? ' · Sin vacío' : ''}`}
                    >
                      {drainOut.outputMl}mL
                      <span className="ml-1 text-[9px] text-slate-400">({fluidLabel}{vacuumIcon})</span>
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
