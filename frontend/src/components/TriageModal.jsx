import { useState, useRef, useEffect } from 'react'
import { X, AlertTriangle, Check, Syringe, Activity, ChevronRight, Search, ClipboardList } from 'lucide-react'
import XRayIcon from './XRayIcon'
import NursingAssessmentModal from './NursingAssessmentModal'
import { TRIAGE_MOTIVOS, findTriageRules } from '../constants/triageRules'

const LEVELS = [1, 2, 3, 4, 5]
const LEVEL_COLORS = {
  1: 'bg-red-500 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-400 text-slate-900',
  4: 'bg-green-500 text-white',
  5: 'bg-blue-500 text-white',
}

const SPECIALTIES = [
  'Medicina', 'Traumatología', 'Cirugía', 'Ginecología', 'Pediatría', 'Oftalmología',
]

function MotivoDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = TRIAGE_MOTIVOS.filter(m =>
    m.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={containerRef} className="relative">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Motivo de consulta *</div>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
          value ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-400'
        }`}
      >
        <span>{value || 'Seleccionar motivo...'}</span>
        <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar motivo..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-400 outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">Sin resultados</div>
            ) : filtered.map(m => (
              <button
                key={m}
                onClick={() => { onChange(m); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                  value === m ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                }`}
              >{m}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Triage modal: set level + motivo (required), location + specialty (optional).
 * After confirm, checks triage rules and shows suggested actions.
 */
export default function TriageModal({ open: isOpen, patient, locations, onClose, onConfirm }) {
  const [step, setStep] = useState('form') // 'form' | 'side' | 'suggestions'
  const [level, setLevel] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [location, setLocation] = useState(patient?.location || '')
  const [specialty, setSpecialty] = useState(patient?.specialty || '')
  const [matchedRules, setMatchedRules] = useState([])
  const [selectedSuggestions, setSelectedSuggestions] = useState([])
  const [side, setSide] = useState(null) // 'izq' | 'der'
  const [bodyLocation, setBodyLocation] = useState(null)
  const [currentRule, setCurrentRule] = useState(null)
  const [vitals, setVitals] = useState({ fc: '', tas: '', tad: '', fr: '', temp: '', spo2: '', eva: '' })
  const [nursingModalOpen, setNursingModalOpen] = useState(false)
  const [nursingDone, setNursingDone] = useState(false)
  const [originalMotivo, setOriginalMotivo] = useState('')

  const reset = () => {
    setStep('form'); setLevel(patient?.triageLevel || null); setMotivo(patient?.matCategory || '')
    setLocation(patient?.location || ''); setSpecialty(patient?.specialty || '')
    setMatchedRules([]); setSelectedSuggestions([])
    setSide(null); setBodyLocation(null); setCurrentRule(null)
    setVitals({ fc: '', tas: '', tad: '', fr: '', temp: '', spo2: '', eva: '' })
    setNursingModalOpen(false)
    setNursingDone(false)
  }

  // Re-initialize when patient changes
  useEffect(() => {
    if (isOpen && patient) {
      setLevel(patient.triageLevel || null)
      setMotivo(patient.matCategory || '')
      setLocation(patient.location || '')
      setSpecialty(patient.specialty || '')
      setOriginalMotivo(patient.matCategory || '')
    }
  }, [isOpen, patient])

  const handleClose = () => { reset(); onClose() }

  const isRetriage = patient?.triageLevel != null
  const motivoChanged = motivo !== originalMotivo

  const handleConfirmForm = () => {
    // On re-triage with same motivo, skip suggestions (tests already ordered)
    if (isRetriage && !motivoChanged) {
      handleFinalConfirm([])
      return
    }
    const rules = findTriageRules(motivo)
    if (rules.length > 0) {
      // Check if any rule needs side/location input
      const ruleNeedingSide = rules.find(r => r.askSide)
      if (ruleNeedingSide) {
        setCurrentRule(ruleNeedingSide)
        setStep('side')
        return
      }
      setMatchedRules(rules)
      // Pre-select all suggestions
      const allSuggestions = rules.flatMap(r => r.suggestions)
      setSelectedSuggestions(allSuggestions.map((_, i) => i))
      setStep('suggestions')
    } else {
      // No rules match — just save triage
      handleFinalConfirm([])
    }
  }

  const handleSideConfirm = () => {
    if (!currentRule) return
    // Build rules with resolved body region
    const resolvedRules = matchedRules.length > 0 ? matchedRules : [currentRule]
    const allRules = findTriageRules(motivo).map(r => {
      if (!r.askSide) return r
      // Resolve body region with side suffix
      const suffix = side === 'izq' ? '_izq' : '_der'
      const regionKey = bodyLocation || ''
      return {
        ...r,
        suggestions: r.suggestions.map(s => {
          if (s.type !== 'radiology' || !s.radiology) return s
          return {
            ...s,
            label: s.label.replace('de la zona', `de ${currentRule.locationOptions?.find(o => o.key === bodyLocation)?.label || bodyLocation} ${side === 'izq' ? 'izquierdo/a' : 'derecho/a'}`),
            radiology: { ...s.radiology, bodyRegion: regionKey + suffix },
          }
        }),
      }
    })
    setMatchedRules(allRules)
    const allSuggestions = allRules.flatMap(r => r.suggestions)
    setSelectedSuggestions(allSuggestions.map((_, i) => i))
    setStep('suggestions')
  }

  const handleFinalConfirm = (suggestions) => {
    // Build vitals object only with filled values
    const filledVitals = {}
    if (vitals.fc) filledVitals.fc = parseFloat(vitals.fc)
    if (vitals.tas) filledVitals.tas = parseFloat(vitals.tas)
    if (vitals.tad) filledVitals.tad = parseFloat(vitals.tad)
    if (vitals.fr) filledVitals.fr = parseFloat(vitals.fr)
    if (vitals.temp) filledVitals.temp = parseFloat(vitals.temp)
    if (vitals.spo2) filledVitals.spo2 = parseFloat(vitals.spo2)
    if (vitals.eva) filledVitals.eva = parseFloat(vitals.eva)

    onConfirm({
      triageLevel: level,
      matCategory: motivo,
      location: location || null,
      specialty: specialty || null,
      suggestions: suggestions || [],
      vitals: Object.keys(filledVitals).length > 0 ? filledVitals : null,
    })
    reset()
  }

  const handleConfirmSuggestions = () => {
    const allSuggestions = matchedRules.flatMap(r => r.suggestions)
    const selected = selectedSuggestions.map(i => allSuggestions[i])
    handleFinalConfirm(selected)
  }

  const handleSkipSuggestions = () => {
    handleFinalConfirm([])
  }

  const toggleSuggestion = (idx) => {
    setSelectedSuggestions(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  if (!isOpen) return null

  const canConfirmForm = level && motivo

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {step === 'form' ? 'Triaje' : step === 'side' ? 'Localización' : 'Pruebas recomendadas'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {step === 'form' && (
            <>
              {/* Patient info */}
              <div className="text-sm text-slate-500">
                {patient?.lastName}, {patient?.firstName} · {patient?.nhc}
              </div>

              {/* Level selection */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nivel de triaje *</div>
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`w-10 h-10 rounded-full font-bold text-lg transition-all ${
                        level === l
                          ? `${LEVEL_COLORS[l]} ring-2 ring-offset-2 ring-slate-400 scale-110`
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {/* Motivo — searchable dropdown */}
              <MotivoDropdown value={motivo} onChange={setMotivo} />

              {/* Optional: location + specialty */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ubicación</div>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
                  >
                    <option value="">—</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Especialidad</div>
                  <select
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
                  >
                    <option value="">—</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Constantes</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">TAS (mmHg)</label>
                    <input type="number" value={vitals.tas} onChange={e => setVitals(v => ({ ...v, tas: e.target.value }))}
                      placeholder="—" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">TAD (mmHg)</label>
                    <input type="number" value={vitals.tad} onChange={e => setVitals(v => ({ ...v, tad: e.target.value }))}
                      placeholder="—" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">FC (lpm)</label>
                    <input type="number" value={vitals.fc} onChange={e => setVitals(v => ({ ...v, fc: e.target.value }))}
                      placeholder="—" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">Tª (°C)</label>
                    <input type="number" step="0.1" value={vitals.temp} onChange={e => setVitals(v => ({ ...v, temp: e.target.value }))}
                      placeholder="—" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">SpO₂ (%)</label>
                    <input type="number" value={vitals.spo2} onChange={e => setVitals(v => ({ ...v, spo2: e.target.value }))}
                      placeholder="—" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400">FR (rpm)</label>
                    <input type="number" value={vitals.fr} onChange={e => setVitals(v => ({ ...v, fr: e.target.value }))}
                      placeholder="—" className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-[11px] text-slate-400">EVA — Dolor (0-10)</label>
                  <input type="number" min="0" max="10" value={vitals.eva} onChange={e => setVitals(v => ({ ...v, eva: e.target.value }))}
                    placeholder="—" className="w-20 ml-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:border-blue-400 outline-none" />
                </div>
              </div>

              {/* Nursing assessment */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valoración de enfermería</div>
                <button
                  type="button"
                  onClick={() => setNursingModalOpen(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    nursingDone
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <ClipboardList size={16} />
                  {nursingDone ? 'Valoración registrada' : 'Registrar valoración de enfermería'}
                  {nursingDone && <Check size={14} />}
                </button>
              </div>

              <NursingAssessmentModal
                isOpen={nursingModalOpen}
                onClose={(saved) => {
                  setNursingModalOpen(false)
                  if (saved) setNursingDone(true)
                }}
                admissionId={patient?.admissionId}
              />
            </>
          )}

          {step === 'side' && currentRule && (
            <>
              <div className="text-sm text-slate-600">{currentRule.label}</div>

              {/* Side selection */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lateralidad</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSide('izq')}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      side === 'izq' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >Izquierda</button>
                  <button
                    onClick={() => setSide('der')}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      side === 'der' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >Derecha</button>
                </div>
              </div>

              {/* Body location */}
              {currentRule.locationOptions && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Localización</div>
                  <div className="grid grid-cols-3 gap-2">
                    {currentRule.locationOptions.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setBodyLocation(opt.key)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          bodyLocation === opt.key
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'suggestions' && (
            <>
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl p-3">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">
                  {matchedRules.map(r => r.label).join(' + ')}
                </span>
              </div>
              <div className="text-xs text-slate-500">Selecciona las pruebas que quieres solicitar automáticamente:</div>
              <div className="space-y-2">
                {matchedRules.flatMap((r, ri) => r.suggestions.map((s, si) => {
                  const globalIdx = matchedRules.slice(0, ri).reduce((acc, r2) => acc + r2.suggestions.length, 0) + si
                  const isSelected = selectedSuggestions.includes(globalIdx)
                  const Icon = s.type === 'ecg' ? Activity : s.type === 'lab' ? Syringe : XRayIcon
                  const iconColor = s.type === 'ecg' ? 'text-red-500' : s.type === 'lab' ? 'text-orange-500' : 'text-blue-500'
                  return (
                    <button
                      key={globalIdx}
                      onClick={() => toggleSuggestion(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <Icon size={18} className={iconColor} />
                      <span className="text-sm font-medium text-slate-700">{s.label}</span>
                    </button>
                  )
                }))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          {step === 'form' && (
            <button
              onClick={handleConfirmForm}
              disabled={!canConfirmForm}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >Confirmar triaje <ChevronRight size={16} /></button>
          )}
          {step === 'side' && (
            <button
              onClick={handleSideConfirm}
              disabled={!side || (currentRule?.locationOptions && !bodyLocation)}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >Continuar <ChevronRight size={16} /></button>
          )}
          {step === 'suggestions' && (
            <>
              <button onClick={handleSkipSuggestions} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                Omitir pruebas
              </button>
              <button
                onClick={handleConfirmSuggestions}
                disabled={selectedSuggestions.length === 0}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >Solicitar {selectedSuggestions.length} prueba{selectedSuggestions.length !== 1 ? 's' : ''}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
