import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

// ── Time helpers ──

function generate72hSlots(admissionDate) {
  const start = new Date(admissionDate)
  start.setMinutes(0, 0, 0)
  const slots = []
  for (let i = 0; i < 72; i++) slots.push(new Date(start.getTime() + i * 3600000))
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
function fmtHourFull(d) { return `${String(d.getHours()).padStart(2, '0')}:00` }
function fmtDay(d) { return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

function parseScheduledHours(str) {
  if (!str) return []
  return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
}

/**
 * Find the index of the next scheduled slot that hasn't been signed yet.
 * "Next" = first scheduled+unsigned slot at or after the current hour.
 */
function findNextDoseIndex(slots, scheduled, administrations) {
  const now = new Date()
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    if (slot < now) continue
    const hour = slot.getHours()
    if (!scheduled.includes(hour)) continue
    const alreadySigned = administrations?.some(a => isSameHour(new Date(a.administeredAt), slot))
    if (!alreadySigned) return i
  }
  return -1
}

// ── Sections ──

const sections = [
  { key: 'fixed', label: 'MEDICACIÓN FIJA' },
  { key: 'conditional', label: 'MEDICACIÓN CONDICIONAL' },
  { key: 'fluids', label: 'SUEROTERAPIA' },
  { key: 'insulin', label: 'PAUTA DE INSULINA' },
]

const insulinScaleLabels = [
  { range: '<150: 0UI', color: '#16a34a' },
  { range: '150-250: 2UI', color: '#ca8a04' },
  { range: '250-350: 4UI', color: '#ea580c' },
  { range: '>350: 6UI', color: '#dc2626' },
]

// ── Tooltip component ──

function CellTooltip({ admin, unit, children }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef(null)

  if (!admin) return children

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({ top: rect.top - 4, left: rect.left + rect.width / 2 })
    setShow(true)
  }

  const handleMouseLeave = () => setShow(false)

  return (
    <div
      className="contents"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          ref={tooltipRef}
          className="fixed z-[100] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap" data-testid="cell-tooltip">
            <div className="font-medium">{admin.signedBy || 'Firmado'}</div>
            {admin.doseGiven && <div>{admin.doseGiven}{unit}</div>}
            {admin.note && <div className="text-blue-300 mt-0.5">Obs: {admin.note}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Component ──

const MedicationGrid = forwardRef(function MedicationGrid(
  { prescriptions, admissionDate, onDirectSign, onDirectUnsign, onOpenInsulinModal, onOpenEditModal },
  ref
) {
  const nowRef = useRef(null)
  const [hoveredCell, setHoveredCell] = useState(null)

  const slots = generate72hSlots(admissionDate)

  useImperativeHandle(ref, () => ({
    scrollToNow() {
      nowRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }))

  useEffect(() => {
    const t = setTimeout(() => {
      nowRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
    }, 100)
    return () => clearTimeout(t)
  }, [])

  if (!prescriptions || prescriptions.length === 0) {
    return <p className="text-slate-400 text-center py-8">No hay medicación pautada</p>
  }

  const grouped = {}
  for (const s of sections) grouped[s.key] = []
  for (const p of prescriptions) {
    const cat = p.category || 'fixed'
    if (grouped[cat]) grouped[cat].push(p)
    else grouped.fixed.push(p)
  }

  let firstMedRendered = false

  function handleCellClick(e, p, slot, admin, isScheduled) {
    if (admin) {
      // Signed cell → open edit modal (no confirm dialog)
      onOpenEditModal(admin, p)
    } else if (!isScheduled) {
      // Non-scheduled empty cell → do nothing
      return
    } else if (p.category === 'insulin') {
      onOpenInsulinModal(p, slot.toISOString())
    } else {
      // Normal medication: sign only this specific slot
      onDirectSign({
        prescriptionId: p.id,
        administeredAt: slot.toISOString(),
        doseGiven: p.amount,
        signedBy: '',
      })
    }
  }

  return (
    <div className="flex-1 overflow-auto pb-16" style={{ scrollbarGutter: 'stable' }}>
      <table className="border-collapse" style={{ minWidth: 'max-content' }}>
        <thead className="sticky top-0 z-30">
          <tr>
            <th
              className="sticky left-0 z-40 text-left pl-3 pr-2 py-2 text-xs font-medium text-slate-500"
              style={{ width: 240, minWidth: 240, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
            />
            {slots.map((s, i) => {
              const isNow = isCurrentHour(s)
              const midnight = isMidnight(s) && i > 0
              return (
                <th
                  key={i}
                  ref={isNow && !firstMedRendered ? nowRef : null}
                  className={`py-2 text-center text-xs font-medium ${isNow ? 'text-blue-700' : 'text-slate-500'}`}
                  style={{
                    width: 56, minWidth: 56,
                    background: isNow ? '#dbeafe' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    borderLeft: midnight ? '2px solid #3b82f6' : undefined,
                  }}
                >
                  {isMidnight(s) && <div className="text-[10px] font-semibold text-slate-600">{fmtDay(s)}</div>}
                  {fmtHourFull(s)}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sections.map(section => {
            const meds = grouped[section.key]
            if (!meds || meds.length === 0) return null
            return (
              <React.Fragment key={section.key}>
                <tr>
                  <th
                    className="sticky left-0 z-10 text-left pl-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    style={{ background: '#f8fafc', height: 30, borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}
                  >
                    {section.label}
                  </th>
                  {slots.map((_, i) => (
                    <td key={i} style={{ background: '#f8fafc', height: 30, borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }} />
                  ))}
                </tr>
                {meds.map(p => {
                  const scheduled = parseScheduledHours(p.scheduledHours)
                  const isInsulin = section.key === 'insulin'
                  if (!firstMedRendered) firstMedRendered = true

                  // Only the NEXT scheduled+unsigned slot gets ▶
                  const nextDoseIdx = findNextDoseIndex(slots, scheduled, p.administrations)

                  return (
                    <tr key={p.id}>
                      <th
                        className="sticky left-0 z-10 text-left align-top"
                        style={{
                          width: 240, minWidth: 240, background: '#fff',
                          padding: '10px 12px', borderBottom: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                        }}
                      >
                        <div className="text-[13px] font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{p.amount}{p.unit} {p.route} {p.frequency}</div>
                        {p.conditionText && (
                          <div className="text-[11px] text-amber-600 font-normal">{p.conditionText}</div>
                        )}
                        {isInsulin && (
                          <div className="mt-1">
                            {insulinScaleLabels.map((s, i) => (
                              <div key={i} className="flex items-center gap-1 py-px">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                <span className="text-[10px] text-slate-500">{s.range}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </th>

                      {slots.map((slot, si) => {
                        const isNow = isCurrentHour(slot)
                        const midnight = isMidnight(slot) && si > 0
                        const admin = p.administrations?.find(a => isSameHour(new Date(a.administeredAt), slot))
                        const hour = slot.getHours()
                        const isScheduled = scheduled.includes(hour)
                        const cellKey = `${p.id}-${si}`
                        const isHovered = hoveredCell === cellKey

                        // Only the single next dose gets ▶
                        const isNext = si === nextDoseIdx

                        let bg = '#fff'
                        if (admin) bg = '#dcfce7'
                        else if (isNow) bg = '#dbeafe'
                        else if (isScheduled) bg = '#f0f9ff'

                        const hoverBg = admin ? '#bbf7d0' : (isScheduled ? '#e0f2fe' : '#f8fafc')

                        const cellContent = (
                          <td
                            key={si}
                            data-scheduled={isScheduled ? 'true' : undefined}
                            data-signed={admin ? 'true' : undefined}
                            className={`text-center align-middle relative ${isScheduled || admin ? 'cursor-pointer' : 'cursor-default'}`}
                            style={{
                              width: 56, minWidth: 56, height: 44,
                              background: isHovered ? hoverBg : bg,
                              borderBottom: '1px solid #e2e8f0',
                              borderRight: '1px solid #e2e8f0',
                              borderLeft: midnight ? '2px solid #3b82f6' : undefined,
                            }}
                            onMouseEnter={() => setHoveredCell(cellKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={(e) => handleCellClick(e, p, slot, admin, isScheduled)}
                          >
                            {admin ? (
                              <>
                                {admin.note && (
                                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" data-testid="observation-dot" />
                                )}
                                <span className="text-green-800 font-semibold text-base">✓</span>
                                {admin.doseGiven && (
                                  <div className="text-[10px] text-green-700 leading-none">{admin.doseGiven}{p.unit}</div>
                                )}
                              </>
                            ) : isNext ? (
                              <span className="text-sky-500 font-bold text-sm">▶</span>
                            ) : isScheduled ? (
                              <span className="text-slate-300 text-xs">·</span>
                            ) : null}
                          </td>
                        )

                        if (admin) {
                          return (
                            <CellTooltip key={si} admin={admin} unit={p.unit}>
                              {cellContent}
                            </CellTooltip>
                          )
                        }

                        return cellContent
                      })}
                    </tr>
                  )
                })}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export default MedicationGrid
