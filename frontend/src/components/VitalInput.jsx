const ranges = {
  systolicBp:      { min: 40, max: 300 },
  diastolicBp:     { min: 20, max: 200 },
  heartRate:       { min: 20, max: 300 },
  spo2:            { min: 30, max: 100 },
  respiratoryRate: { min: 4,  max: 60 },
  temperature:     { min: 30, max: 43 },
  painLevel:       { min: 0,  max: 10 },
  bloodGlucose:    { min: 10, max: 700 },
  diuresis:        { min: 0,  max: 5000 },
}

export function validateVitals(form) {
  const errors = {}
  for (const [key, r] of Object.entries(ranges)) {
    const v = form[key]
    if (v === '' || v == null) continue
    const n = Number(v)
    if (isNaN(n)) continue
    if (n < r.min || n > r.max) {
      errors[key] = `${r.min}–${r.max}`
    }
  }
  return errors
}

function handleVitalKeyDown(e) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const container = e.target.closest('[data-vital-group]')
  if (!container) return
  const inputs = Array.from(container.querySelectorAll('input[type="number"]'))
  const idx = inputs.indexOf(e.target)
  if (idx < 0) return
  const next = e.key === 'ArrowRight' ? inputs[idx + 1] : inputs[idx - 1]
  if (next) { e.preventDefault(); next.focus() }
}

export default function VitalInput({ label, field, form, set, error, step }) {
  const hasError = !!error

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type="number"
        step={step}
        value={form[field]}
        onChange={set(field)}
        onKeyDown={handleVitalKeyDown}
        placeholder="—"
        className={`px-2.5 py-2 border rounded-md text-sm outline-none transition-colors
          ${hasError ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
      />
      {hasError && (
        <span className="text-[10px] text-red-500">Rango válido: {error}</span>
      )}
    </div>
  )
}

export { handleVitalKeyDown }
