import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'

// Generate 72h of hourly slots from admission date
function generate72hSlots(admissionDate) {
  const start = new Date(admissionDate)
  start.setMinutes(0, 0, 0)
  const slots = []
  for (let i = 0; i < 72; i++) {
    const d = new Date(start.getTime() + i * 3600000)
    slots.push(d)
  }
  return slots
}

function formatSlotHeader(d) {
  return `${String(d.getHours()).padStart(2, '0')}`
}

function formatDayHeader(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isSameHour(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate() &&
    d1.getHours() === d2.getHours()
}

function isCurrentHour(slot) {
  return isSameHour(slot, new Date())
}

function parseScheduledHours(str) {
  if (!str) return []
  return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
}

const categoryColors = {
  fixed: 'bg-blue-50 border-blue-200',
  conditional: 'bg-amber-50 border-amber-200',
  fluids: 'bg-green-50 border-green-200',
  insulin: 'bg-purple-50 border-purple-200',
}

const categoryLabels = {
  fixed: 'Fija',
  conditional: 'Condicional',
  fluids: 'Fluidos',
  insulin: 'Insulina',
}

export default function MedicationGrid({ prescriptions, admissionDate, onSign, onUnsign }) {
  const [hoveredCell, setHoveredCell] = useState(null)
  const slots = generate72hSlots(admissionDate)

  // Group slots by day
  const days = []
  let currentDay = null
  slots.forEach((s, i) => {
    const dayKey = formatDayHeader(s)
    if (dayKey !== currentDay) {
      days.push({ label: dayKey, startIdx: i, count: 0 })
      currentDay = dayKey
    }
    days[days.length - 1].count++
  })

  if (!prescriptions || prescriptions.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay medicación pautada</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-xs">
        <thead>
          {/* Day headers */}
          <tr className="bg-slate-50">
            <th className="sticky left-0 bg-slate-50 z-20 min-w-[200px] px-3 py-1 border-b border-slate-200"></th>
            {days.map((d, i) => (
              <th key={i} colSpan={d.count} className="px-1 py-1 text-center font-semibold text-slate-600 border-b border-slate-200 border-l border-slate-100">
                {d.label}
              </th>
            ))}
          </tr>
          {/* Hour headers */}
          <tr className="bg-slate-50">
            <th className="sticky left-0 bg-slate-50 z-20 px-3 py-1.5 text-left font-semibold text-slate-500 border-b border-slate-200">Medicación</th>
            {slots.map((s, i) => (
              <th key={i} className={`px-0 py-1.5 text-center font-medium w-8 min-w-[32px] border-b border-slate-200 ${isCurrentHour(s) ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
                {formatSlotHeader(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {prescriptions.map(p => {
            const scheduled = parseScheduledHours(p.scheduledHours)
            return (
              <tr key={p.id} className={`border-t ${categoryColors[p.category] || ''}`}>
                <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left border-r border-slate-100">
                  <div className="font-semibold text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {p.amount} {p.unit} · {p.route} · {p.frequency}
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${p.category === 'fixed' ? 'bg-blue-100 text-blue-700' : p.category === 'conditional' ? 'bg-amber-100 text-amber-700' : p.category === 'insulin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {categoryLabels[p.category]}
                    </span>
                  </div>
                  {p.conditionText && <div className="text-[10px] text-amber-600 mt-0.5">{p.conditionText}</div>}
                </th>
                {slots.map((slot, si) => {
                  const hour = slot.getHours()
                  const isScheduled = scheduled.includes(hour)
                  const admin = p.administrations?.find(a => isSameHour(new Date(a.administeredAt), slot))
                  const isCurrent = isCurrentHour(slot)
                  const cellKey = `${p.id}-${si}`

                  return (
                    <td
                      key={si}
                      className={`px-0 py-0 text-center border-l border-slate-50 cursor-pointer transition-colors relative
                        ${isCurrent ? 'bg-blue-50' : ''}
                        ${admin ? 'bg-green-50' : ''}
                        ${isScheduled && !admin ? 'bg-slate-50' : ''}
                      `}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        if (admin) {
                          if (confirm('¿Desfirmar esta administración?')) onUnsign(admin.id)
                        } else if (isScheduled || p.category === 'conditional') {
                          onSign({
                            prescriptionId: p.id,
                            administeredAt: slot.toISOString(),
                            doseGiven: p.amount,
                          })
                        }
                      }}
                      title={admin ? `${admin.signedBy} · ${admin.doseGiven || p.amount}${admin.note ? ' · ' + admin.note : ''}` : isScheduled ? 'Click para firmar' : ''}
                    >
                      {admin ? (
                        <Check size={14} className="mx-auto text-green-600" />
                      ) : isScheduled ? (
                        <ChevronRight size={10} className="mx-auto text-slate-300" />
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
