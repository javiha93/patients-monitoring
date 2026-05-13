import { useState } from 'react'
import { X, Zap, Radiation, Magnet } from 'lucide-react'
import XRayIcon from './XRayIcon'
import BodyMap, { getBodyMapLabel } from './BodyMap'
import { CT_REGIONS, MRI_REGIONS, TYPE_LABELS, XRAY_REGIONS } from '../constants/radiologyCatalog'

/**
 * Modal for requesting radiology studies.
 * - X-ray: interactive body map → projection selector
 * - CT/MRI: region list + contrast toggle
 */
export default function NewRadiologyModal({ open, onClose, onSubmit }) {
  const [type, setType] = useState(null)
  const [region, setRegion] = useState(null)
  const [projection, setProjection] = useState(null)
  const [contrast, setContrast] = useState(false)
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setType(null); setRegion(null); setProjection(null)
    setContrast(false); setPriority('normal'); setNotes('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = () => {
    onSubmit({
      type,
      bodyRegion: region,
      projection: type === 'xray' ? projection : null,
      contrast,
      priority,
      notes: notes.trim() || null,
    })
    reset()
  }

  const canSubmit = type && region && (type !== 'xray' || projection)

  if (!open) return null

  // Find xray projections for selected region
  const getXrayProjections = () => {
    if (!region) return []
    for (const area of Object.values(XRAY_REGIONS)) {
      const found = area.find(r => r.key === region)
      if (found) return found.projections
    }
    return ['AP', 'Lateral'] // fallback for body map regions not in catalog
  }

  const xrayProjections = type === 'xray' ? getXrayProjections() : []

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Solicitar prueba de imagen</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Step 1: Type selection */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipo de estudio</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setType('xray'); setRegion(null); setProjection(null) }}
                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2
                  ${type === 'xray' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <XRayIcon size={32} className={type === 'xray' ? 'text-blue-600' : 'text-slate-400'} />
                <div className="text-sm font-medium">Radiografía</div>
              </button>
              <button
                onClick={() => { setType('ct'); setRegion(null); setProjection(null) }}
                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2
                  ${type === 'ct' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-200' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <Radiation size={32} className={type === 'ct' ? 'text-purple-600' : 'text-slate-400'} />
                <div className="text-sm font-medium">TAC</div>
              </button>
              <button
                onClick={() => { setType('mri'); setRegion(null); setProjection(null) }}
                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2
                  ${type === 'mri' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <Magnet size={32} className={type === 'mri' ? 'text-indigo-600' : 'text-slate-400'} />
                <div className="text-sm font-medium">Resonancia</div>
              </button>
            </div>
          </div>

          {/* Step 2: X-ray body map */}
          {type === 'xray' && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Selecciona la zona — pasa el ratón por el cuerpo
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <BodyMap
                    selected={region}
                    onSelect={(key) => { setRegion(key); setProjection(null) }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  {region ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-sm font-bold text-blue-700">{getBodyMapLabel(region)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Proyección</div>
                        <div className="flex flex-wrap gap-2">
                          {xrayProjections.map(p => (
                            <button
                              key={p}
                              onClick={() => setProjection(p)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                                ${projection === p
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >{p}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 text-sm">
                      <p>Pasa el ratón por el cuerpo</p>
                      <p className="text-xs mt-1">y haz clic en la zona deseada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CT region selection */}
          {type === 'ct' && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Región</div>
              <div className="grid grid-cols-3 gap-2">
                {CT_REGIONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRegion(r.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 text-left transition-all
                      ${region === r.key
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:border-purple-300'}`}
                  >{r.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* MRI region selection */}
          {type === 'mri' && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Región</div>
              <div className="grid grid-cols-3 gap-2">
                {MRI_REGIONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRegion(r.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 text-left transition-all
                      ${region === r.key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                  >{r.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Contrast toggle (CT/MRI only) */}
          {(type === 'ct' || type === 'mri') && region && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contrast}
                onChange={e => setContrast(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
              />
              <span className="text-sm font-medium text-slate-700">Con contraste</span>
            </label>
          )}

          {/* Priority + Notes */}
          {region && (
            <>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Prioridad</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPriority('normal')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                      ${priority === 'normal'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 text-slate-600 hover:border-green-300'}`}
                  >Normal</button>
                  <button
                    onClick={() => setPriority('urgente')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1.5
                      ${priority === 'urgente'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:border-red-300'}`}
                  ><Zap size={14} /> Urgente</button>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notas clínicas</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Indicación clínica, antecedentes relevantes..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >Solicitar {type ? TYPE_LABELS[type] : ''}</button>
        </div>
      </div>
    </div>
  )
}
