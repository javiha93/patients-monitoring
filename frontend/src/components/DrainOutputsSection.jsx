import { useState, useEffect } from 'react'
import { deviceApi } from '../services/deviceApi'
import Select from './Select'

const TYPE_LABELS = {
  redon: 'Redon',
  jackson_pratt: 'Jackson-Pratt',
}

const FLUID_TYPES = [
  { value: 'seroso', label: 'Seroso' },
  { value: 'serohematico', label: 'Serohemático' },
  { value: 'hematico', label: 'Hemático' },
  { value: 'purulento', label: 'Purulento' },
]

/**
 * Renders drain output fields for each active drain device.
 * Props:
 *   admissionId — to fetch active drains
 *   drainOutputs — array of { deviceId, drainNumber, outputMl, fluidType, vacuumActive }
 *   onChange — called with updated array
 *   existingOutputs — for edit mode, pre-populated from vitalSign.drainOutputs
 */
export default function DrainOutputsSection({ admissionId, drainOutputs, onChange, existingOutputs }) {
  const [drains, setDrains] = useState([])

  useEffect(() => {
    if (!admissionId) return
    deviceApi.getActiveDrains(admissionId)
      .then(({ data }) => {
        setDrains(data)
        // Initialize drain outputs if not already set
        if (data.length > 0 && (!drainOutputs || drainOutputs.length === 0)) {
          const initial = data.map(d => {
            // Check if there's an existing output for this device (edit mode)
            const existing = existingOutputs?.find(o => o.deviceId === d.id)
            return {
              deviceId: d.id,
              drainNumber: d.drainNumber,
              outputMl: existing?.outputMl ?? '',
              fluidType: existing?.fluidType ?? 'seroso',
              vacuumActive: existing?.vacuumActive ?? true,
            }
          })
          onChange(initial)
        }
      })
      .catch(() => {})
  }, [admissionId])

  if (drains.length === 0) return null

  const updateDrain = (index, field, value) => {
    const updated = [...drainOutputs]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">
        Drenajes ({drains.length})
      </div>
      <div className="space-y-3 mb-4">
        {drains.map((drain, i) => {
          const output = drainOutputs?.[i] || {}
          const regionInfo = [
            drain.region,
            drain.subRegion,
            drain.laterality,
          ].filter(Boolean).join(' · ')

          return (
            <div key={drain.id} className="p-3 bg-sky-50 rounded-lg border border-sky-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-sky-700">
                  {TYPE_LABELS[drain.type] || drain.type} #{drain.drainNumber}
                </span>
                {regionInfo && (
                  <span className="text-[11px] text-sky-500">{regionInfo}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] font-medium text-slate-600">Débito (mL)</label>
                  <input
                    type="number"
                    min="0"
                    value={output.outputMl ?? ''}
                    onChange={e => updateDrain(i, 'outputMl', e.target.value)}
                    placeholder="0"
                    className="px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-sky-400"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] font-medium text-slate-600">Tipo</label>
                  <Select
                    value={output.fluidType || 'seroso'}
                    onChange={e => updateDrain(i, 'fluidType', e.target.value)}
                    className="px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-sky-400"
                  >
                    {FLUID_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </Select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] font-medium text-slate-600">Vacío</label>
                  <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={output.vacuumActive ?? true}
                      onChange={e => updateDrain(i, 'vacuumActive', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                    />
                    <span className="text-xs text-slate-600">Mantiene</span>
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
