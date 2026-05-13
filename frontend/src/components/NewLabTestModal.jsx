import { useState } from 'react'
import { X, Beaker, Check } from 'lucide-react'
import { SAMPLE_TYPES, PARAMETERS, PRESETS, buildLabel, countSelected, countForType } from '../constants/labCatalog'

function initSelected() {
  const m = new Map()
  SAMPLE_TYPES.forEach(st => m.set(st.value, new Set()))
  return m
}

/** Build a code→sampleType lookup from the PARAMETERS catalog */
function buildCodeToType() {
  const map = {}
  for (const [sampleType, groups] of Object.entries(PARAMETERS)) {
    for (const g of groups) {
      for (const p of g.params) {
        map[p.code] = sampleType
      }
    }
  }
  return map
}
const CODE_TO_TYPE = buildCodeToType()

function initFromData(data) {
  const m = initSelected()
  if (!data?.requestedParameters) return m
  try {
    const codes = JSON.parse(data.requestedParameters)
    for (const code of codes) {
      const type = CODE_TO_TYPE[code]
      if (type && m.has(type)) m.get(type).add(code)
    }
  } catch { /* ignore */ }
  return m
}

export default function NewLabTestModal({ onSubmit, onClose, initialData }) {
  const editing = !!initialData
  const [activeTab, setActiveTab] = useState(() => {
    if (initialData?.sampleType) return initialData.sampleType.split(',')[0]
    return 'sangre'
  })
  const [selected, setSelected] = useState(() => initialData ? initFromData(initialData) : initSelected())
  const [notes, setNotes] = useState(initialData?.notes || '')

  const toggle = (sampleType, code) => {
    setSelected(prev => {
      const next = new Map(prev)
      const codes = new Set(next.get(sampleType))
      codes.has(code) ? codes.delete(code) : codes.add(code)
      next.set(sampleType, codes)
      return next
    })
  }

  const toggleGroup = (sampleType, group) => {
    const codes = group.params.map(p => p.code)
    const current = selected.get(sampleType) || new Set()
    const allSelected = codes.every(c => current.has(c))
    setSelected(prev => {
      const next = new Map(prev)
      const set = new Set(next.get(sampleType))
      codes.forEach(c => allSelected ? set.delete(c) : set.add(c))
      next.set(sampleType, set)
      return next
    })
  }

  const applyPreset = (preset) => {
    // If all params of this preset are already selected, remove them (toggle off)
    const allApplied = Object.entries(preset.params).every(([st, codes]) => {
      const current = selected.get(st) || new Set()
      return codes.every(c => current.has(c))
    })

    setSelected(prev => {
      const next = new Map(prev)
      for (const [sampleType, codes] of Object.entries(preset.params)) {
        const set = new Set(next.get(sampleType))
        codes.forEach(c => allApplied ? set.delete(c) : set.add(c))
        next.set(sampleType, set)
      }
      return next
    })

    if (!allApplied) {
      const firstType = Object.keys(preset.params)[0]
      if (firstType) setActiveTab(firstType)
    }
  }

  const clearAll = () => setSelected(initSelected())

  const handleSubmit = (e) => {
    e.preventDefault()
    const total = countSelected(selected)
    if (total === 0) return

    // Collect all params with their sample type prefix for uniqueness
    const allParams = []
    const sampleTypes = []
    for (const [sampleType, codes] of selected.entries()) {
      if (codes.size > 0) {
        sampleTypes.push(sampleType)
        codes.forEach(c => allParams.push(c))
      }
    }

    const label = buildLabel(selected)
    const category = sampleTypes.includes('cultivo') && sampleTypes.length === 1 ? 'cultivo' : 'analitica'
    const sampleType = sampleTypes.join(',')

    onSubmit({
      category,
      sampleType,
      label,
      notes,
      requestedParameters: JSON.stringify(allParams),
    })
  }

  const groups = PARAMETERS[activeTab] || []
  const total = countSelected(selected)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-slate-800">{editing ? 'Editar prueba de laboratorio' : 'Solicitar prueba de laboratorio'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Sample type tabs */}
          <div className="px-5 pt-4 pb-2 flex-shrink-0">
            <div className="flex gap-2 flex-wrap">
              {SAMPLE_TYPES.map(st => {
                const count = countForType(selected, st.value)
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setActiveTab(st.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === st.value
                        ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <span>{st.icon}</span> {st.label}
                    {count > 0 && (
                      <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ml-0.5">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Presets — filtered by active tab */}
          {(() => {
            const visiblePresets = PRESETS.filter(p => activeTab in p.params)
            if (visiblePresets.length === 0) return null
            return (
          <div className="px-5 py-2 flex-shrink-0">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perfiles predefinidos</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {visiblePresets.map(p => {
                const allApplied = Object.entries(p.params).every(([st, codes]) => {
                  const current = selected.get(st) || new Set()
                  return codes.every(c => current.has(c))
                })
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => applyPreset(p)}
                    title={p.description}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      allApplied
                        ? 'bg-violet-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
            )
          })()}

          {/* Parameters */}
          <div className="flex-1 overflow-auto px-5 py-3">
            <div className="space-y-4">
              {groups.map(group => {
                const codes = group.params.map(p => p.code)
                const currentSet = selected.get(activeTab) || new Set()
                const selectedCount = codes.filter(c => currentSet.has(c)).length
                const allSelected = selectedCount === codes.length

                return (
                  <div key={group.group}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(activeTab, group)}
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
                            currentSet.has(p.code)
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-slate-300 group-hover:border-violet-400'
                          }`}>
                            {currentSet.has(p.code) && <Check size={10} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={currentSet.has(p.code)}
                            onChange={() => toggle(activeTab, p.code)}
                            className="sr-only"
                          />
                          <span className={`text-sm ${currentSet.has(p.code) ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
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

          {/* Summary bar + footer */}
          <div className="px-5 py-3 border-t border-slate-200 flex-shrink-0">
            {total > 0 && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {SAMPLE_TYPES.map(st => {
                  const count = countForType(selected, st.value)
                  if (count === 0) return null
                  return (
                    <span key={st.value} className="text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                      {st.icon} {st.label}: {count}
                    </span>
                  )
                })}
                <button type="button" onClick={clearAll} className="text-[11px] text-slate-400 hover:text-red-500 ml-auto">
                  Limpiar todo
                </button>
              </div>
            )}
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
                  disabled={total === 0}
                  className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Beaker size={16} />
                  {editing ? `Guardar (${total})` : `Solicitar (${total})`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
