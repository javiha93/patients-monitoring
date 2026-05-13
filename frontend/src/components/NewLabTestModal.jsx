import { useState } from 'react'
import { X, Beaker, Check } from 'lucide-react'
import { SAMPLE_TYPES, PARAMETERS, PRESETS, buildLabel } from '../constants/labCatalog'

export default function NewLabTestModal({ onSubmit, onClose }) {
  const [sampleType, setSampleType] = useState('sangre')
  const [selected, setSelected] = useState(new Set())
  const [notes, setNotes] = useState('')
  const [activePreset, setActivePreset] = useState(null)

  const toggle = (code) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
    setActivePreset(null)
  }

  const toggleGroup = (group) => {
    const codes = group.params.map(p => p.code)
    const allSelected = codes.every(c => selected.has(c))
    setSelected(prev => {
      const next = new Set(prev)
      codes.forEach(c => allSelected ? next.delete(c) : next.add(c))
      return next
    })
    setActivePreset(null)
  }

  const applyPreset = (preset) => {
    setSampleType(preset.sampleType)
    setSelected(new Set(preset.params))
    setActivePreset(preset.code)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selected.size === 0) return
    const params = [...selected]
    const label = buildLabel(sampleType, params)
    onSubmit({
      category: 'analitica',
      sampleType,
      label,
      notes,
      requestedParameters: JSON.stringify(params),
    })
  }

  const groups = PARAMETERS[sampleType] || []
  const presetsForType = PRESETS.filter(p => p.sampleType === sampleType)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-slate-800">Solicitar prueba de laboratorio</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Sample type tabs */}
          <div className="px-5 pt-4 pb-2 flex-shrink-0">
            <div className="flex gap-2">
              {SAMPLE_TYPES.map(st => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => { setSampleType(st.value); setSelected(new Set()); setActivePreset(null) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    sampleType === st.value
                      ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span>{st.icon}</span> {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          {presetsForType.length > 0 && (
            <div className="px-5 py-2 flex-shrink-0">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perfiles predefinidos</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {presetsForType.map(p => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => applyPreset(p)}
                    title={p.description}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activePreset === p.code
                        ? 'bg-violet-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="flex-1 overflow-auto px-5 py-3">
            <div className="space-y-4">
              {groups.map(group => {
                const codes = group.params.map(p => p.code)
                const selectedCount = codes.filter(c => selected.has(c)).length
                const allSelected = selectedCount === codes.length

                return (
                  <div key={group.group}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="flex items-center gap-2 mb-1.5 group"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        allSelected ? 'bg-violet-500 border-violet-500' :
                        selectedCount > 0 ? 'bg-violet-200 border-violet-400' :
                        'border-slate-300 group-hover:border-violet-400'
                      }`}>
                        {(allSelected || selectedCount > 0) && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{group.group}</span>
                      {selectedCount > 0 && !allSelected && (
                        <span className="text-[10px] text-violet-500">{selectedCount}/{codes.length}</span>
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-6">
                      {group.params.map(p => (
                        <label
                          key={p.code}
                          className="flex items-center gap-2 py-0.5 cursor-pointer group"
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                            selected.has(p.code)
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-slate-300 group-hover:border-violet-400'
                          }`}>
                            {selected.has(p.code) && <Check size={10} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={selected.has(p.code)}
                            onChange={() => toggle(p.code)}
                            className="sr-only"
                          />
                          <span className={`text-sm ${selected.has(p.code) ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                            {p.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas adicionales (opcional)"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selected.size === 0}
                  className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Beaker size={16} />
                  Solicitar ({selected.size})
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
