import { useState } from 'react'
import { X, Zap } from 'lucide-react'
import { BODY_AREAS, XRAY_REGIONS, CT_REGIONS, MRI_REGIONS, TYPE_LABELS } from '../constants/radiologyCatalog'

/**
 * Modal for requesting radiology studies.
 * - X-ray: visual body area → region → projection selector
 * - CT/MRI: region list + contrast toggle
 */
export default function NewRadiologyModal({ open, onClose, onSubmit }) {
  const [type, setType] = useState(null) // 'xray' | 'ct' | 'mri'
  const [bodyArea, setBodyArea] = useState(null) // for xray
  const [region, setRegion] = useState(null)
  const [projection, setProjection] = useState(null)
  const [contrast, setContrast] = useState(false)
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [laterality, setLaterality] = useState(null) // for CT/MRI regions that need it

  const reset = () => {
    setType(null); setBodyArea(null); setRegion(null); setProjection(null)
    setContrast(false); setPriority('normal'); setNotes(''); setLaterality(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = () => {
    let bodyRegion = region
    if ((type === 'ct' || type === 'mri') && laterality) {
      bodyRegion = `${region}_${laterality}`
    }
    onSubmit({
      type,
      bodyRegion,
      projection: type === 'xray' ? projection : null,
      contrast,
      priority,
      notes: notes.trim() || null,
    })
    reset()
  }

  const canSubmit = type && region && (type !== 'xray' || projection)

  if (!open) return null

  // Find selected xray region info
  const selectedXrayRegion = bodyArea && XRAY_REGIONS[bodyArea]?.find(r => r.key === region)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
              {[
                { key: 'xray', label: 'Radiografía', icon: '📷', color: 'blue' },
                { key: 'ct', label: 'TAC', icon: '🔄', color: 'purple' },
                { key: 'mri', label: 'Resonancia', icon: '🧲', color: 'indigo' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setType(t.key); setBodyArea(null); setRegion(null); setProjection(null); setLaterality(null) }}
                  className={`p-3 rounded-xl border-2 text-center transition-all
                    ${type === t.key
                      ? `border-${t.color}-500 bg-${t.color}-50 ring-1 ring-${t.color}-200`
                      : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-sm font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Region selection */}
          {type === 'xray' && (
            <>
              {/* Body area tabs */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Zona corporal</div>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_AREAS.map(a => (
                    <button
                      key={a.key}
                      onClick={() => { setBodyArea(a.key); setRegion(null); setProjection(null) }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${bodyArea === a.key ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >{a.label}</button>
                  ))}
                </div>
              </div>

              {/* Region cards within selected body area */}
              {bodyArea && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Región</div>
                  <div className="grid grid-cols-2 gap-2">
                    {XRAY_REGIONS[bodyArea].map(r => (
                      <button
                        key={r.key}
                        onClick={() => { setRegion(r.key); setProjection(null) }}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3
                          ${region === r.key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'}`}
                      >
                        <span className="text-xl">{r.icon}</span>
                        <span className="text-sm font-medium">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projection selection */}
              {selectedXrayRegion && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Proyección</div>
                  <div className="flex gap-2">
                    {selectedXrayRegion.projections.map(p => (
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
              )}
            </>
          )}

          {/* CT region selection */}
          {type === 'ct' && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Región</div>
              <div className="grid grid-cols-2 gap-2">
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
              <div className="grid grid-cols-2 gap-2">
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
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contrast}
                  onChange={e => setContrast(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm font-medium text-slate-700">Con contraste</span>
              </label>
            </div>
          )}

          {/* Priority + Notes (shown when region is selected) */}
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
