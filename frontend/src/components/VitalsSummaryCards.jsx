const ranges = {
  systolicBp: { low: 90, high: 140, unit: 'mmHg' },
  heartRate: { low: 60, high: 100, unit: 'bpm' },
  temperature: { low: 36.0, high: 37.5, unit: '°C' },
  spo2: { low: 94, high: 100, unit: '%' },
  respiratoryRate: { low: 12, high: 20, unit: 'rpm' },
  painLevel: { low: 0, high: 3, unit: '/10' },
}

function cardStyle(key, val) {
  if (val == null) return ''
  const r = ranges[key]
  if (!r) return ''
  if (val > r.high) return 'border-l-[3px] border-red-600'
  if (val < r.low) return 'border-l-[3px] border-amber-500'
  return ''
}

function valColor(key, val) {
  if (val == null) return 'text-slate-900'
  const r = ranges[key]
  if (!r) return 'text-slate-900'
  if (val > r.high) return 'text-red-600'
  if (val < r.low) return 'text-amber-600'
  return 'text-slate-900'
}

export default function VitalsSummaryCards({ vitals }) {
  if (!vitals || vitals.length === 0) return null

  const last = vitals[vitals.length - 1]

  const cards = [
    { key: 'systolicBp', label: 'TA', value: `${last.systolicBp || '—'}/${last.diastolicBp || '—'}`, checkKey: 'systolicBp' },
    { key: 'heartRate', label: 'FC', value: last.heartRate, checkKey: 'heartRate' },
    { key: 'temperature', label: 'Tª', value: last.temperature, checkKey: 'temperature' },
    { key: 'spo2', label: 'SpO2', value: last.spo2, checkKey: 'spo2' },
    { key: 'respiratoryRate', label: 'FR', value: last.respiratoryRate, checkKey: 'respiratoryRate' },
    { key: 'painLevel', label: 'Dolor', value: last.painLevel, checkKey: 'painLevel' },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {cards.map(c => {
        const val = last[c.checkKey]
        return (
          <div key={c.key} className={`bg-white rounded-lg p-3 min-w-[110px] shadow-sm ${cardStyle(c.checkKey, val)}`}>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{c.label}</div>
            <div className={`text-xl font-bold ${valColor(c.checkKey, val)}`}>
              {c.value ?? '—'}
              <span className="text-xs text-slate-400 font-normal ml-1">{ranges[c.checkKey]?.unit || ''}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
