import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Check, Pencil } from 'lucide-react'

// ── Time helpers ──

function generate72hSlots(admissionDate) {
  const start = new Date(admissionDate)
  start.setMinutes(0, 0, 0)
  const slots = []
  for (let i = 0; i < 72; i++) {
    slots.push(new Date(start.getTime() + i * 3600000))
  }
  return slots
}

function isSameHour(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate() &&
    d1.getHours() === d2.getHours()
}

function isCurrentHour(slot) { return isSameHour(slot, new Date()) }
function isMidnight(slot) { return slot.getHours() === 0 }
function fmtHour(d) { return String(d.getHours()).padStart(2, '0') }
function fmtDay(d) { return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

function parseScheduledHours(str) {
  if (!str) return []
  return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
}

// ── Category config ──

const sections = [
  { key: 'fixed', label: 'Medicación fija', color: 'bg-blue-600', textColor: 'text-white' },
  { key: 'conditional', label: 'Medicación condicional', color: 'bg-amber-500', textColor: 'text-white' },
  { key: 'fluids', label: 'Sueroterapia', color: 'bg-green-600', textColor: 'text-white' },
  { key: 'insulin', label: 'Insulina', color: 'bg-purple-600', textColor: 'text-white' },
]

const categoryBadge = {
  fixed: 'bg-blue-100 text-blue-700',
  conditional: 'bg-amber-100 text-amber-700',
  fluids: 'bg-green-100 text-green-700',
  insulin: 'bg-purple-100 text-purple-700',
}

// ── Component ──

const MedicationGrid = forwardRef(function MedicationGrid(
  { prescriptions, admissionDate, onSign, onEditAdmin, insulinScales },
  ref
) {
  const scrollRef = useRef(null)
  const nowRef = useRef(null)
  const [hoveredCell, setHoveredCell] = useState(null)

  const slots = generate72hSlots(admissionDate)

  // Group slots by day for header
  const days = []
  let curDay = null
  slots.forEach((s, i) => {
    const dk = fmtDay(s)
    if (dk !== curDay) { days.push({ label: dk, start: i, count: 0 }); curDay = dk }
    days[days.length - 1].count++
  })

  // Expose scrollToNow
  useImperativeHandle(ref, () => ({
    scrollToNow() {
      nowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }))

  // Auto-scroll to now on mount
  useEffect(() => {
    const t = setTimeout(() => {
      nowRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
    }, 100)
    return () => clearTimeout(t)
  }, [])

  if (!prescriptions || prescriptions.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay medicación pautada</p>
  }

  // Group prescriptions by category
  const grouped = {}
  for (const s of sections) grouped[s.key] = []
  for (const p of prescriptions) {
    const cat = p.category || 'fixed'
    if (grouped[cat]) grouped[cat].push(p)
    else grouped.fixed.push(p)
  }

  // Find current hour index for nowRef
  const nowIdx = slots.findIndex(s => isCurrentHour(s))

  function renderMedRow(p) {
    const scheduled = parseScheduledHours(p.scheduledHours)

    return (
      <tr key={p.id} className="border-t border-slate-100">
        {/* Sticky left label */}
        <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left border-r border-slate-200 min-w-[240px] max-w-[240px]">
          <div className="font-semibold text-slate-800 text-xs truncate">{p.name}</div>
          <div className="text-[10px] text-slate-500 leading-tight">
            {p.amount} {p.unit} · {p.route} · {p.frequency}
            {p.suspended && <span className="ml-1 text-red-500 font-medium">SUSPENDIDO</span>}
          </div>
          {p.conditionText && (
            <div className="text-[10px] text-amber-600 mt-0.5 truncate">⚡ {p.conditionText}</div>
          )}
          {p.prescribedBy && (
            <div className="text-[10px] text-slate-400 truncate">Dr. {p.prescribedBy}</div>
          )}
        </th>

        {/* Hour cells */}
        {slots.map((slot, si) => {
          const hour = slot.getHours()
          const isScheduled = scheduled.includes(hour)
          const admin = p.administrations?.find(a => isSameHour(new Date(a.administeredAt), slot))
          const isCur = isCurrentHour(slot)
          const midnight = isMidnight(slot)
          const cellKey = `${p.id}-${si}`
          const isHovered = hoveredCell === cellKey

          // Determine cell background
          let bg = ''
          if (admin) bg = 'bg-green-100'
          else if (isCur) bg = 'bg-blue-50'
          else if (isScheduled) bg = 'bg-slate-50'

          return (
            <td
              key={si}
              ref={si === nowIdx && p === prescriptions[0] ? nowRef : null}
              className={`px-0 py-0 text-center w-8 min-w-[32px] h-8 cursor-pointer transition-colors relative
                ${bg}
                ${midnight ? 'border-l-2 border-l-blue-300' : 'border-l border-l-slate-100'}
                ${isHovered ? 'ring-1 ring-inset ring-blue-400' : ''}
              `}
              onMouseEnter={() => setHoveredCell(cellKey)}
              onMouseLeave={() => setHoveredCell(null)}
              onClick={() => {
                if (admin) {
                  onEditAdmin(admin, p)
                } else if (isScheduled || p.category === 'conditional') {
                  onSign({
                    prescriptionId: p.id,
                    administeredAt: slot.toISOString(),
                    doseGiven: p.amount,
                  }, p)
                }
              }}
              title={
                admin
                  ? `${admin.signedBy || 'Firmado'} · ${admin.doseGiven || p.amount}${p.unit}${admin.note ? ' · ' + admin.note : ''}`
                  : isScheduled ? 'Click para firmar' : ''
              }
            >
              {admin ? (
                <div className="relative flex items-center justify-center h-full">
                  <Check size={14} className="text-green-600" />
                  {admin.note && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                  {isHovered && (
                    <span className="absolute -top-0.5 -right-0.5">
                      <Pencil size={8} className="text-slate-400" />
                    </span>
                  )}
                </div>
              ) : isScheduled ? (
                <span className="text-slate-300 text-[10px]">▸</span>
              ) : null}
            </td>
          )
        })}
      </tr>
    )
  }

  function renderInsulinScaleRow(p) {
    const scale = insulinScales?.find(s => s.prescriptionId === p.id)
    if (!scale || !scale.ranges) return null

    return (
      <tr key={`scale-${p.id}`} className="border-t border-purple-100">
        <th className="sticky left-0 z-10 bg-purple-50 px-3 py-1 text-left border-r border-slate-200 min-w-[240px]">
          <div className="text-[10px] text-purple-700 font-medium">Escala glucemia</div>
          <div className="text-[9px] text-purple-500 leading-tight">
            {scale.ranges.map((r, i) => (
              <span key={i} className="mr-2">{r.minGlycemia}-{r.maxGlycemia}: {r.dose}UI</span>
            ))}
          </div>
        </th>
        <td colSpan={slots.length} className="bg-purple-50/50 px-2 py-1">
          <div className="text-[9px] text-purple-400 text-center">
            Escala aplicada en cada firma de insulina
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm border border-slate-200" ref={scrollRef}>
      <table className="border-collapse bg-white text-xs w-max">
        <thead className="sticky top-0 z-30">
          {/* Day headers */}
          <tr className="bg-slate-100">
            <th className="sticky left-0 z-40 bg-slate-100 min-w-[240px] px-3 py-1 border-b border-slate-200 border-r border-slate-200" />
            {days.map((d, i) => (
              <th
                key={i}
                colSpan={d.count}
                className="px-1 py-1 text-center font-semibold text-slate-600 border-b border-slate-200 border-l border-slate-200"
              >
                {d.label}
              </th>
            ))}
          </tr>
          {/* Hour headers */}
          <tr className="bg-slate-50">
            <th className="sticky left-0 z-40 bg-slate-50 px-3 py-1.5 text-left font-semibold text-slate-500 border-b border-slate-200 border-r border-slate-200">
              Medicación
            </th>
            {slots.map((s, i) => (
              <th
                key={i}
                className={`px-0 py-1.5 text-center font-medium w-8 min-w-[32px] border-b border-slate-200
                  ${isCurrentHour(s) ? 'bg-blue-200 text-blue-800 font-bold' : 'text-slate-400'}
                  ${isMidnight(s) ? 'border-l-2 border-l-blue-300' : 'border-l border-l-slate-100'}
                `}
              >
                {fmtHour(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map(section => {
            const meds = grouped[section.key]
            if (!meds || meds.length === 0) return null
            return (
              <React.Fragment key={section.key}>
                {/* Section header row */}
                <tr>
                  <th
                    colSpan={slots.length + 1}
                    className={`${section.color} ${section.textColor} px-3 py-1.5 text-left text-xs font-semibold sticky left-0 z-10`}
                  >
                    {section.label} ({meds.length})
                  </th>
                </tr>
                {/* Medication rows */}
                {meds.map(p => (
                  <React.Fragment key={p.id}>
                    {renderMedRow(p)}
                    {section.key === 'insulin' && renderInsulinScaleRow(p)}
                  </React.Fragment>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export default MedicationGrid
