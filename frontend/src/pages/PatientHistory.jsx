import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, AlertTriangle, PauseCircle, PlayCircle, MessageSquare, X, Scissors, ShieldAlert } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { historyApi } from '../services/historyApi'
import ActionBar from '../components/ActionBar'

function calcAge(bd) {
  if (!bd) return null
  const today = new Date(), birth = new Date(bd)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate() }
  if (months < 0) { years--; months += 12 }
  const totalMonths = years * 12 + months
  if (years >= 2) return `${years} años`
  if (totalMonths >= 1) return `${totalMonths} meses`
  return `${Math.max(0, days)} días`
}

function formatMonthYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + (dateStr.length === 7 ? '-01' : ''))
  return d.toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' })
}

const severityColors = { mild: 'bg-yellow-100 text-yellow-800', moderate: 'bg-orange-100 text-orange-800', severe: 'bg-red-100 text-red-800', unknown: 'bg-slate-100 text-slate-600' }
const allergyTypeLabels = { drug: 'Medicamentosa', food: 'Alimentaria', environmental: 'Ambiental', other: 'Otra' }
const CONDITION_SUGGESTIONS = [
  { label: 'HTA', priority: 1 },
  { label: 'DM2', priority: 2 },
  { label: 'DM1', priority: 3 },
  { label: 'IRC', priority: 4 },
  { label: 'Cardiopatía isquémica', priority: 5 },
  { label: 'EPOC', priority: 6 },
  { label: 'Asma', priority: 7 },
  { label: 'Fibrilación auricular', priority: 8 },
  { label: 'Insuficiencia cardíaca', priority: 9 },
  { label: 'Dislipemia', priority: 10 },
  { label: 'Obesidad', priority: 11 },
  { label: 'Hipotiroidismo', priority: 12 },
  { label: 'Hipertiroidismo', priority: 13 },
  { label: 'ACV previo', priority: 14 },
  { label: 'Hepatopatía crónica', priority: 15 },
  { label: 'Enfermedad renal crónica', priority: 16 },
  { label: 'Neoplasia activa', priority: 17 },
  { label: 'Demencia', priority: 18 },
  { label: 'Depresión', priority: 19 },
  { label: 'Epilepsia', priority: 20 },
]
export default function PatientHistory() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState({ medicalHistory: [], allergies: [], medications: [], immunosuppressions: [], surgicalInterventions: [] })
  const [tab, setTab] = useState('antecedentes')
  const [loading, setLoading] = useState(true)

  // Add-condition chip input
  const [showAddCondition, setShowAddCondition] = useState(false)
  const [conditionInput, setConditionInput] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  // Allergy form
  const [showAddAllergy, setShowAddAllergy] = useState(false)
  const [newAllergy, setNewAllergy] = useState({ substance: '', type: 'drug', severity: 'unknown', reaction: '' })

  // Medication form
  const [showAddMed, setShowAddMed] = useState(false)
  const [newMed, setNewMed] = useState({ name: '', dose: '', frequency: '' })

  // Immunosuppression form
  const [showAddImmuno, setShowAddImmuno] = useState(false)
  const [newImmuno, setNewImmuno] = useState({ description: '', eventDate: '', endDate: '', notes: '' })

  // Surgery form
  const [showAddSurgery, setShowAddSurgery] = useState(false)
  const [newSurgery, setNewSurgery] = useState({ description: '', interventionDate: '', notes: '' })

  const fetchData = async () => {
    try {
      const [{ data: p }, { data: h }] = await Promise.all([
        patientApi.getPatient(id),
        historyApi.getFullHistory(id),
      ])
      setPatient(p)
      setHistory(h)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)
  const existingLabels = history.medicalHistory.map(m => m.label.toLowerCase())
  const filteredSuggestions = CONDITION_SUGGESTIONS.filter(s =>
    !existingLabels.includes(s.label.toLowerCase()) &&
    s.label.toLowerCase().includes(conditionInput.toLowerCase())
  )

  // --- Handlers ---
  const handleAddCondition = async (label, priority) => {
    await historyApi.addCondition(id, { label, priorityOrder: priority, registeredDate: new Date().toISOString().slice(0, 10), notes: conditionNotes || null })
    setConditionInput('')
    setConditionNotes('')
    setShowAddCondition(false)
    fetchData()
  }

  const handleAddCustomCondition = async (e) => {
    e.preventDefault()
    if (!conditionInput.trim()) return
    const match = CONDITION_SUGGESTIONS.find(s => s.label.toLowerCase() === conditionInput.trim().toLowerCase())
    await handleAddCondition(conditionInput.trim(), match?.priority ?? 99)
  }

  const handleAddAllergy = async (e) => {
    e.preventDefault()
    await historyApi.addAllergy(id, newAllergy)
    setNewAllergy({ substance: '', type: 'drug', severity: 'unknown', reaction: '' })
    setShowAddAllergy(false)
    fetchData()
  }

  const handleAddMed = async (e) => {
    e.preventDefault()
    await historyApi.addMedication(id, { ...newMed, prescribedSince: new Date().toISOString().slice(0, 10) })
    setNewMed({ name: '', dose: '', frequency: '' })
    setShowAddMed(false)
    fetchData()
  }

  const handleAddImmuno = async (e) => {
    e.preventDefault()
    await historyApi.addImmunosuppression(id, newImmuno)
    setNewImmuno({ description: '', eventDate: '', endDate: '', notes: '' })
    setShowAddImmuno(false)
    fetchData()
  }

  const handleAddSurgery = async (e) => {
    e.preventDefault()
    await historyApi.addSurgery(id, newSurgery)
    setNewSurgery({ description: '', interventionDate: '', notes: '' })
    setShowAddSurgery(false)
    fetchData()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Lista
        </Link>
        <div className="flex-1">
          <div className="text-lg font-bold">{patient.lastName}, {patient.firstName}</div>
          <div className="text-sm text-slate-500">{age ? `${age} · ` : ''}{patient.nhc}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-0 flex-shrink-0">
        {[{ key: 'antecedentes', label: 'Antecedentes' }, { key: 'medicacion', label: 'Medicación habitual' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 pb-24 space-y-4">
        {tab === 'antecedentes' ? (
          <>
            {/* Allergies */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" /> Alergias
                  <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{history.allergies.length}</span>
                </h3>
                <button onClick={() => setShowAddAllergy(!showAddAllergy)} className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Añadir</button>
              </div>
              {showAddAllergy && (
                <form onSubmit={handleAddAllergy} className="grid grid-cols-4 gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
                  <input required value={newAllergy.substance} onChange={e => setNewAllergy({ ...newAllergy, substance: e.target.value })} placeholder="Sustancia" className="px-2 py-1.5 border border-slate-200 rounded text-sm" />
                  <select value={newAllergy.type} onChange={e => setNewAllergy({ ...newAllergy, type: e.target.value })} className="px-2 py-1.5 border border-slate-200 rounded text-sm">
                    <option value="drug">Medicamentosa</option><option value="food">Alimentaria</option><option value="environmental">Ambiental</option><option value="other">Otra</option>
                  </select>
                  <select value={newAllergy.severity} onChange={e => setNewAllergy({ ...newAllergy, severity: e.target.value })} className="px-2 py-1.5 border border-slate-200 rounded text-sm">
                    <option value="unknown">Desconocida</option><option value="mild">Leve</option><option value="moderate">Moderada</option><option value="severe">Grave</option>
                  </select>
                  <button type="submit" className="bg-sky-500 text-white rounded text-sm font-medium hover:bg-sky-600">Guardar</button>
                </form>
              )}
              {history.allergies.length === 0 ? (
                <p className="text-sm text-slate-400">No hay alergias registradas</p>
              ) : (
                <div className="space-y-2">
                  {history.allergies.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[a.severity] || severityColors.unknown}`}>{a.severity}</span>
                      <span className="font-medium text-sm">{a.substance}</span>
                      <span className="text-xs text-slate-400">{allergyTypeLabels[a.type]}</span>
                      {a.reaction && <span className="text-xs text-slate-500">— {a.reaction}</span>}
                      <button onClick={() => { historyApi.deleteAllergy(id, a.id); fetchData() }} className="ml-auto text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Medical conditions — chips */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Antecedentes médicos
                  <span className="ml-2 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{history.medicalHistory.length}</span>
                </h3>
                <button onClick={() => { setShowAddCondition(!showAddCondition); setTimeout(() => inputRef.current?.focus(), 50) }} className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Añadir</button>
              </div>
              {showAddCondition && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                  <form onSubmit={handleAddCustomCondition} className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        value={conditionInput}
                        onChange={e => { setConditionInput(e.target.value); setShowSuggestions(true) }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Escribir o seleccionar patología..."
                        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm"
                      />
                      {showSuggestions && conditionInput && filteredSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
                          {filteredSuggestions.map(s => (
                            <button key={s.label} type="button"
                              onClick={() => { handleAddCondition(s.label, s.priority); setShowSuggestions(false) }}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 text-slate-700"
                            >{s.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input value={conditionNotes} onChange={e => setConditionNotes(e.target.value)} placeholder="Notas (opcional)" className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm" />
                    <button type="submit" className="bg-sky-500 text-white px-4 rounded text-sm font-medium hover:bg-sky-600">Guardar</button>
                  </form>
                  {/* Quick-add chips for common conditions not yet added */}
                  <div className="flex flex-wrap gap-1.5">
                    {CONDITION_SUGGESTIONS.filter(s => !existingLabels.includes(s.label.toLowerCase())).slice(0, 10).map(s => (
                      <button key={s.label} type="button"
                        onClick={() => handleAddCondition(s.label, s.priority)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {history.medicalHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No hay antecedentes registrados</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.medicalHistory.map(mh => (
                    <span key={mh.id}
                      className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200 cursor-default"
                      title={`Registro: ${formatMonthYear(mh.registeredDate)}${mh.notes ? ' — ' + mh.notes : ''}`}
                    >
                      {mh.label}
                      {mh.notes && <MessageSquare size={12} className="text-slate-400" />}
                      <button onClick={() => { historyApi.deleteCondition(id, mh.id); fetchData() }}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Immunosuppression */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-500" /> Antecedentes inmunodepresivos
                  <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{history.immunosuppressions.length}</span>
                </h3>
                <button onClick={() => setShowAddImmuno(!showAddImmuno)} className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Añadir</button>
              </div>
              {showAddImmuno && (
                <form onSubmit={handleAddImmuno} className="grid grid-cols-5 gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
                  <input required value={newImmuno.description} onChange={e => setNewImmuno({ ...newImmuno, description: e.target.value })} placeholder="Descripción (ej: Metotrexato 15mg/sem)" className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                  <input required type="date" value={newImmuno.eventDate} onChange={e => setNewImmuno({ ...newImmuno, eventDate: e.target.value })} className="px-2 py-1.5 border border-slate-200 rounded text-sm" title="Fecha inicio" />
                  <input type="date" value={newImmuno.endDate} onChange={e => setNewImmuno({ ...newImmuno, endDate: e.target.value })} className="px-2 py-1.5 border border-slate-200 rounded text-sm" title="Fecha fin (vacío = activo)" />
                  <button type="submit" className="bg-sky-500 text-white rounded text-sm font-medium hover:bg-sky-600">Guardar</button>
                </form>
              )}
              {history.immunosuppressions.length === 0 ? (
                <p className="text-sm text-slate-400">No hay antecedentes inmunodepresivos</p>
              ) : (
                <div className="space-y-2">
                  {history.immunosuppressions.map(im => (
                    <div key={im.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200">
                      <span className="text-xs text-slate-400 min-w-[60px]">{formatMonthYear(im.eventDate)}</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200">{im.description}</span>
                      {!im.endDate ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">Activo</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500">Fin: {formatMonthYear(im.endDate)}</span>
                      )}
                      {im.notes && <MessageSquare size={12} className="text-slate-400 cursor-help" title={im.notes} />}
                      <button onClick={() => { historyApi.deleteImmunosuppression(id, im.id); fetchData() }} className="ml-auto text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Surgical interventions */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Scissors size={16} className="text-blue-500" /> Intervenciones quirúrgicas
                  <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{history.surgicalInterventions.length}</span>
                </h3>
                <button onClick={() => setShowAddSurgery(!showAddSurgery)} className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Añadir</button>
              </div>
              {showAddSurgery && (
                <form onSubmit={handleAddSurgery} className="grid grid-cols-4 gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
                  <input required value={newSurgery.description} onChange={e => setNewSurgery({ ...newSurgery, description: e.target.value })} placeholder="Intervención (ej: Colecistectomía)" className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                  <input required type="date" value={newSurgery.interventionDate} onChange={e => setNewSurgery({ ...newSurgery, interventionDate: e.target.value })} className="px-2 py-1.5 border border-slate-200 rounded text-sm" />
                  <button type="submit" className="bg-sky-500 text-white rounded text-sm font-medium hover:bg-sky-600">Guardar</button>
                </form>
              )}
              {history.surgicalInterventions.length === 0 ? (
                <p className="text-sm text-slate-400">No hay intervenciones registradas</p>
              ) : (
                <div className="space-y-2">
                  {history.surgicalInterventions.map(si => (
                    <div key={si.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200">
                      <span className="text-xs text-slate-400 min-w-[60px]">{formatMonthYear(si.interventionDate)}</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200">{si.description}</span>
                      {si.notes && <MessageSquare size={12} className="text-slate-400 cursor-help" title={si.notes} />}
                      <button onClick={() => { historyApi.deleteSurgery(id, si.id); fetchData() }} className="ml-auto text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                Medicación crónica del paciente
                <span className="ml-2 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{history.medications.length}</span>
              </h3>
              <button onClick={() => setShowAddMed(!showAddMed)} className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Añadir</button>
            </div>
            {showAddMed && (
              <form onSubmit={handleAddMed} className="grid grid-cols-4 gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
                <input required value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} placeholder="Nombre" className="px-2 py-1.5 border border-slate-200 rounded text-sm" />
                <input value={newMed.dose} onChange={e => setNewMed({ ...newMed, dose: e.target.value })} placeholder="Dosis" className="px-2 py-1.5 border border-slate-200 rounded text-sm" />
                <input value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} placeholder="Frecuencia" className="px-2 py-1.5 border border-slate-200 rounded text-sm" />
                <button type="submit" className="bg-sky-500 text-white rounded text-sm font-medium hover:bg-sky-600">Guardar</button>
              </form>
            )}
            {history.medications.length === 0 ? (
              <p className="text-sm text-slate-400">No hay medicación habitual registrada</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-2">Medicamento</th><th className="pb-2">Dosis</th><th className="pb-2">Frecuencia</th><th className="pb-2">Estado</th><th className="pb-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {history.medications.map(m => (
                    <tr key={m.id} className="border-t border-slate-100" title={m.prescribedSince ? `Pautado desde: ${formatMonthYear(m.prescribedSince)}` : ''}>
                      <td className={`py-2.5 text-sm font-medium ${m.suspendedDuringAdmission ? 'line-through text-slate-400' : ''}`}>{m.name}</td>
                      <td className="py-2.5 text-sm text-slate-600">{m.dose}</td>
                      <td className="py-2.5 text-sm text-slate-600">{m.frequency}</td>
                      <td className="py-2.5">
                        <button onClick={() => { historyApi.toggleSuspended(id, m.id); fetchData() }}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${m.suspendedDuringAdmission ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {m.suspendedDuringAdmission ? <><PauseCircle size={12} /> Suspendida</> : <><PlayCircle size={12} /> Activa</>}
                        </button>
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => { historyApi.deleteMedication(id, m.id); fetchData() }} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <ActionBar patient={patient} admissionId={patient.activeAdmission?.id} />
    </div>
  )
}
