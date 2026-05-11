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

// Parse frequency string like "c/8h" → 8, "c/12h" → 12, etc. Returns null if not parseable.
function parseFrequencyHours(freq) {
  if (!freq) return null
  const m = freq.match(/c\/(\d+)h/i)
  return m ? parseInt(m[1]) : null
}

/**
 * Compute which slot indices should show ▶ for a given prescription.
 * After each administration, the next ▶ shifts to adminTime + interval.
 * Returns a Set of slot indices.
 */
function computeScheduledSlotIndices(slots, scheduledHours, administrations, frequencyHours) {
  const indices = new Set()

  const now = new Date()

  if (!frequencyHours || frequencyHours <= 0) {
    // Non-interval meds (conditional, continuous): use static scheduled hours, skip past
    for (let i = 0; i < slots.length; i++) {
      const isPast = slots[i] < now && !isSameHour(slots[i], now)
      if (scheduledHours.includes(slots[i].getHours()) && !isPast) indices.add(i)
    }
    return indices
  }

  // Sort administrations by time
  const sortedAdmins = (administrations || [])
    .map(a => new Date(a.administeredAt))
    .sort((a, b) => a - b)

  // Start from the static scheduled hours, then chain from each administration
  // Find the first scheduled slot as the starting anchor
  let anchors = []
  for (let i = 0; i < slots.length; i++) {
    if (scheduledHours.includes(slots[i].getHours())) {
      anchors.push(slots[i])
      break // only need the first one as initial anchor
    }
  }

  // Build the chain: start from first scheduled hour, then every `frequencyHours`
  // But if an administration exists, the chain restarts from that admin time
  if (anchors.length === 0 && slots.length > 0) {
    anchors.push(slots[0])
  }

  let nextDueTime = anchors[0]

  // Walk through the timeline, placing ▶ and adjusting when admins are found
  const gridStart = slots[0]
  const gridEnd = slots[slots.length - 1]

  // Collect all admin times that fall within the grid
  const adminsInGrid = sortedAdmins.filter(a => a >= gridStart && a <= gridEnd)

  // Strategy: iterate forward from the first anchor, placing markers every `frequencyHours`.
  // When we encounter an administration, the next marker shifts to admin + interval.
  let currentTime = new Date(nextDueTime)
  let adminIdx = 0

  while (currentTime <= gridEnd) {
    // Check if there's an administration at or near this scheduled time
    // (or any admin between the last marker and this one that should reset the chain)
    let chainReset = false
    while (adminIdx < adminsInGrid.length && adminsInGrid[adminIdx] <= currentTime) {
      // This admin happened at or before the current scheduled time
      // The next dose should be relative to this admin
      currentTime = new Date(adminsInGrid[adminIdx].getTime() + frequencyHours * 3600000)
      adminIdx++
      chainReset = true
    }

    if (chainReset) continue // re-evaluate with the new currentTime

    // Check if any admin falls between now and the next interval
    // (admin given at a non-scheduled time)
    if (adminIdx < adminsInGrid.length) {
      const nextAdmin = adminsInGrid[adminIdx]
      const nextScheduled = new Date(currentTime.getTime() + frequencyHours * 3600000)
      if (nextAdmin < nextScheduled) {
        // Admin happened before next scheduled → find the slot for current time, then reset
        const slotIdx = slots.findIndex(s => isSameHour(s, currentTime))
        if (slotIdx >= 0) {
          const hasAdmin = sortedAdmins.some(a => isSameHour(a, currentTime))
          const isPast = currentTime < now && !isSameHour(currentTime, now)
          if (!hasAdmin && !isPast) indices.add(slotIdx)
        }
        // Reset chain from this admin
        currentTime = new Date(nextAdmin.getTime() + frequencyHours * 3600000)
        adminIdx++
        continue
      }
    }

    // Place ▶ at this time if it maps to a slot, isn't administered, and isn't in the past
    const slotIdx = slots.findIndex(s => isSameHour(s, currentTime))
    if (slotIdx >= 0) {
      const hasAdmin = sortedAdmins.some(a => isSameHour(a, currentTime))
      const isPast = currentTime < now && !isSameHour(currentTime, now)
      if (!hasAdmin && !isPast) indices.add(slotIdx)
    }

    // Move to next interval
    currentTime = new Date(currentTime.getTime() + frequencyHours * 3600000)
  }

  return indices
}

// Format a Date as local ISO string (yyyy-MM-ddTHH:mm:ss) without UTC conversion.
// Backend uses LocalDateTime, so we must send local time, not UTC.
function toLocalISOString(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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

// ── Component ──

const MedicationGrid = forwardRef(function MedicationGrid(
  { prescriptions, admissionDate, onDirectSign, onDirectUnsign, onOpenInsulinModal, onOpenEditModal },
  ref
) {
  const scrollRef = useRef(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const [tooltip, setTooltip] = useState(null) // { x, y, admin, unit }

  const CELL_W = 56
  const LABEL_W = 240
  const VISIBLE_HOURS = 16

  const slots = generate72hSlots(admissionDate)

  function scrollToNowPosition(smooth = false) {
    const container = scrollRef.current
    if (!container) return
    const nowIdx = slots.findIndex(s => isCurrentHour(s))
    if (nowIdx < 0) return
    // The now column's left edge in the table = LABEL_W + nowIdx * CELL_W
    // We want it centered in the visible area.
    // Visible width of the scroll container = container.clientWidth
    // Target scrollLeft = position of now column - half the visible area + half a cell
    const nowLeft = LABEL_W + (nowIdx * CELL_W)
    const visibleWidth = container.clientWidth
    const targetScroll = nowLeft - (visibleWidth / 2) + (CELL_W / 2)
    container.scrollTo({ left: Math.max(0, targetScroll), behavior: smooth ? 'smooth' : 'auto' })
  }

  useImperativeHandle(ref, () => ({
    scrollToNow() { scrollToNowPosition(true) }
  }))

  useEffect(() => {
    const t = setTimeout(() => scrollToNowPosition(false), 100)
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



  function handleCellClick(e, p, slot, admin) {
    if (admin) {
      // Signed cell: unsign directly
      onDirectUnsign(admin.id)
    } else if (p.category === 'insulin') {
      onOpenInsulinModal(p, toLocalISOString(slot))
    } else {
      // Any cell: sign directly
      onDirectSign({
        prescriptionId: p.id,
        administeredAt: toLocalISOString(slot),
        doseGiven: p.amount,
        signedBy: '',
      })
    }
  }

  function handleEditClick(e, admin, p) {
    e.stopPropagation()
    onOpenEditModal(admin, p)
  }

  function handleCellMouseEnter(e, admin, unit) {
    if (!admin) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      admin,
      unit,
    })
  }

  function handleCellMouseLeave() {
    setTooltip(null)
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-x-auto overflow-y-auto pb-16"
    >
      <table className="border-collapse" style={{ width: LABEL_W + (slots.length * CELL_W), tableLayout: 'fixed' }}>
        <thead className="sticky top-0 z-30">
          <tr>
            <th
              className="sticky left-0 z-40 text-left pl-3 pr-2 py-2 text-xs font-medium text-slate-500"
              style={{ width: LABEL_W, minWidth: LABEL_W, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
            />
            {slots.map((s, i) => {
              const isNow = isCurrentHour(s)
              const midnight = isMidnight(s) && i > 0
              return (
                <th
                  key={i}
                  className={`py-2 text-center text-xs font-medium ${isNow ? 'text-blue-700' : 'text-slate-500'}`}
                  style={{
                    width: CELL_W, minWidth: CELL_W,
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
                  const scheduledHours = parseScheduledHours(p.scheduledHours)
                  const frequencyHours = parseFrequencyHours(p.frequency)
                  const isInsulin = section.key === 'insulin'


                  // Compute dynamic scheduled slot indices based on administrations
                  const scheduledSlotIndices = computeScheduledSlotIndices(
                    slots, scheduledHours, p.administrations, frequencyHours
                  )

                  return (
                    <tr key={p.id}>
                      <th
                        className="sticky left-0 z-10 text-left align-top"
                        style={{
                          width: LABEL_W, minWidth: LABEL_W, background: '#fff',
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
                        const isScheduled = scheduledSlotIndices.has(si)
                        const cellKey = `${p.id}-${si}`
                        const isHovered = hoveredCell === cellKey

                        // ▶ on scheduled+unsigned slots
                        const isNext = isScheduled && !admin

                        let bg = '#fff'
                        if (admin) bg = '#dcfce7'
                        else if (isNow) bg = '#dbeafe'

                        const hoverBg = admin ? '#bbf7d0' : '#f0f9ff'

                        return (
                          <td
                            key={si}
                            data-scheduled={isScheduled ? 'true' : undefined}
                            data-signed={admin ? 'true' : undefined}
                            className="text-center align-middle relative cursor-pointer"
                            style={{
                              width: CELL_W, minWidth: CELL_W, height: 44,
                              background: isHovered ? hoverBg : bg,
                              borderBottom: '1px solid #e2e8f0',
                              borderRight: '1px solid #e2e8f0',
                              borderLeft: midnight ? '2px solid #3b82f6' : undefined,
                            }}
                            onMouseEnter={(e) => {
                              setHoveredCell(cellKey)
                              handleCellMouseEnter(e, admin, p.unit)
                            }}
                            onMouseLeave={() => {
                              setHoveredCell(null)
                              handleCellMouseLeave()
                            }}
                            onClick={(e) => handleCellClick(e, p, slot, admin)}
                          >
                            {admin ? (
                              <>
                                {/* Edit icon on hover */}
                                {!isInsulin && isHovered && (
                                  <svg
                                    className="absolute top-0.5 right-0.5 text-slate-500 cursor-pointer"
                                    style={{ width: 14, height: 14 }}
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    onClick={(e) => handleEditClick(e, admin, p)}
                                    data-testid="edit-icon"
                                  >
                                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                )}
                                {/* Observation dot */}
                                {admin.note && (
                                  <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" data-testid="observation-dot" />
                                )}
                                {/* Tick + dose with unit */}
                                <span className="text-green-800 font-semibold text-base">✓</span>
                                {admin.doseGiven && (
                                  <div className="text-[10px] text-green-700 leading-none">{admin.doseGiven}{p.unit}</div>
                                )}
                              </>
                            ) : isNext ? (
                              <span className="text-sky-500 font-bold text-sm">▶</span>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

      {/* Tooltip rendered as portal outside the table to avoid layout shifts */}
      {tooltip && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            top: tooltip.y - 4,
            left: tooltip.x,
            transform: 'translate(-50%, -100%)',
          }}
          data-testid="cell-tooltip"
        >
          <div className="bg-slate-800 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <div className="font-medium">{tooltip.admin.signedBy || 'Firmado'}</div>
            {tooltip.admin.doseGiven && <div>{tooltip.admin.doseGiven}{tooltip.unit}</div>}
            {tooltip.admin.note && <div className="text-blue-300 mt-0.5">Obs: {tooltip.admin.note}</div>}
          </div>
        </div>
      )}
    </div>
  )
})

export default MedicationGrid
