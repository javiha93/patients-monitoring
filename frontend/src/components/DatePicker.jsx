import { useState, useRef, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate()
}

function parseInput(raw) {
  const clean = raw.replace(/[^0-9]/g, '')
  let display = ''
  if (clean.length > 0) display += clean.slice(0, 2)
  if (clean.length > 2) display += '/' + clean.slice(2, 4)
  if (clean.length > 4) display += '/' + clean.slice(4, 8)
  return display
}

function inputToDate(text) {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = parseInt(dd), mo = parseInt(mm), y = parseInt(yyyy)
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(mo - 1, y) || y < 1900 || y > new Date().getFullYear()) return null
  return new Date(y, mo - 1, d)
}

function dateToInput(date) {
  if (!date) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/** ISO string YYYY-MM-DD from Date */
function toISO(date) {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isoToDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function DatePicker({ value, onChange, disabled = false, placeholder = 'DD/MM/AAAA' }) {
  const [text, setText] = useState(() => dateToInput(isoToDate(value)))
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    const d = isoToDate(value)
    return d ? d.getFullYear() : new Date().getFullYear() - 30
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = isoToDate(value)
    return d ? d.getMonth() : 0
  })
  const [yearSelectOpen, setYearSelectOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Sync text when value prop changes externally
  useEffect(() => {
    const d = isoToDate(value)
    setText(dateToInput(d))
    if (d) {
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setYearSelectOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleTextChange = (e) => {
    const formatted = parseInput(e.target.value)
    setText(formatted)
    const parsed = inputToDate(formatted)
    if (parsed) {
      onChange(toISO(parsed))
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    } else if (formatted === '') {
      onChange(null)
    }
  }

  const handleSelectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    onChange(toISO(d))
    setText(dateToInput(d))
    setOpen(false)
    setYearSelectOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectedDate = isoToDate(value)
  const today = new Date()
  const totalDays = daysInMonth(viewMonth, viewYear)
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7 // Monday = 0
  const currentYear = new Date().getFullYear()

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className="flex-1 px-2.5 py-2 border border-slate-200 rounded-l-md text-sm focus:border-blue-500 outline-none disabled:bg-slate-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!open && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect()
              setDropUp(window.innerHeight - rect.bottom < 320)
            }
            setOpen(o => !o)
            setYearSelectOpen(false)
          }}
          className="px-2.5 py-2 border border-l-0 border-slate-200 rounded-r-md bg-slate-50 hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Calendar size={16} />
        </button>
      </div>

      {open && (
        <div className={`absolute z-50 bg-white rounded-xl shadow-lg border border-slate-200 p-3 w-72 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {/* Header: month/year navigation */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setYearSelectOpen(o => !o)}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-2 py-0.5 rounded hover:bg-slate-50"
            >
              {MONTHS[viewMonth]} {viewYear}
            </button>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Year/month quick selector */}
          {yearSelectOpen ? (
            <div className="mb-2">
              <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto mb-2">
                {Array.from({ length: 120 }, (_, i) => currentYear - i).map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setYearSelectOpen(false) }}
                    className={`text-xs py-1 rounded ${y === viewYear ? 'bg-blue-500 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {['L','M','X','J','V','S','D'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-0.5">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                  const isSelected = selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === viewMonth &&
                    selectedDate.getFullYear() === viewYear
                  const isToday = today.getDate() === day &&
                    today.getMonth() === viewMonth &&
                    today.getFullYear() === viewYear
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-blue-500 text-white font-bold' :
                          isToday ? 'bg-blue-50 text-blue-600 font-medium' :
                          'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
