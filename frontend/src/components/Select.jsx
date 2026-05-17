import { useState, useRef, useEffect, Children } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Custom select that replaces native <select> with a styled dropdown.
 * API-compatible: accepts value, onChange (synthetic-like event), disabled, className, children (<option>).
 */
export default function Select({ value, onChange, disabled = false, className = '', children, id }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const btnRef = useRef(null)

  // Parse <option> children into { value, label, disabled } list
  const options = []
  Children.forEach(children, (child) => {
    if (!child || child.type !== 'option') return
    const label = child.props.children ?? ''
    options.push({
      value: child.props.value !== undefined ? child.props.value : label,
      label,
      disabled: !!child.props.disabled,
    })
  })

  const selected = options.find(o => String(o.value) === String(value))
  const displayLabel = selected?.label || ''
  const isPlaceholder = value === '' || value === undefined || value === null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (e.target.closest?.('[data-select-dropdown]')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on scroll
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.target.closest?.('[data-select-dropdown]')) return
      setOpen(false)
    }
    document.addEventListener('scroll', handler, true)
    return () => document.removeEventListener('scroll', handler, true)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleToggle = () => {
    if (disabled) return
    if (!open && btnRef.current) {
      setRect(btnRef.current.getBoundingClientRect())
    }
    setOpen(o => !o)
  }

  const handleSelect = (optValue) => {
    // Mimic native onChange event shape
    onChange({ target: { value: optValue } })
    setOpen(false)
    btnRef.current?.focus()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        id={id}
        disabled={disabled}
        onClick={handleToggle}
        className={`flex items-center justify-between text-left ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${isPlaceholder ? 'text-slate-400' : ''}`}>
          {displayLabel || '\u00A0'}
        </span>
        <ChevronDown size={14} className={`ml-1 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && createPortal(
        <Dropdown rect={rect} options={options} value={value} onSelect={handleSelect} />,
        document.body
      )}
    </>
  )
}

function Dropdown({ rect, options, value, onSelect }) {
  const dropRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, openUp: false })

  useEffect(() => {
    const dropH = dropRef.current?.offsetHeight || 200
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const openUp = spaceBelow < dropH && rect.top > spaceBelow
    setPosition({
      left: rect.left,
      width: Math.max(rect.width, 160),
      openUp,
      top: openUp ? undefined : rect.bottom + 2,
      bottom: openUp ? window.innerHeight - rect.top + 2 : undefined,
    })
  }, [rect])

  // Scroll selected into view
  useEffect(() => {
    const el = dropRef.current?.querySelector('[data-selected="true"]')
    if (el?.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }, [])

  const style = {
    position: 'fixed',
    left: position.left,
    width: position.width,
    zIndex: 9999,
    ...(position.openUp ? { bottom: position.bottom } : { top: position.top }),
  }

  return (
    <div
      ref={dropRef}
      style={style}
      data-select-dropdown
      className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1"
    >
      {options.map((opt, i) => {
        const isSelected = String(opt.value) === String(value)
        return (
          <button
            key={`${opt.value}-${i}`}
            type="button"
            disabled={opt.disabled}
            data-selected={isSelected}
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors
              ${opt.disabled ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 text-slate-700'}
              ${isSelected ? 'bg-blue-50 font-medium text-blue-700' : ''}`}
          >
            <span className="flex-1 truncate">{opt.label || '\u00A0'}</span>
            {isSelected && <Check size={14} className="text-blue-500 flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
