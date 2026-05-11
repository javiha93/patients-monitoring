import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, AlertTriangle, PauseCircle, PlayCircle } from 'lucide-react'
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

const severityColors = { mild: 'bg-yellow-100 text-yellow-800', moderate: 'bg-orange-100 text-orange-800', severe: 'bg-red-100 text-red-800', unknown: 'bg-slate-100 text-slate-600' }
const allergyTypeLabels = { drug: 'Medicamentosa', food: 'Alimentaria', environmental: 'Ambiental', other: 'Otra' }

export default function PatientHistory() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState({ medicalHistory: [], allergies: [], medications: [] })
  const [tab, setTab] = useState('antecedentes')
  const [loading, setLoading] = useState(true)

  // Add forms
  const [showAddCondition, setShowAddCondition] = useState(false)
  const [newCondition, setNewCondition] = useState({ label: '', notes: '' })
  const [showAddAllergy, setShowAddAllergy] = useState(false)
  const [newAllergy, setNewAllergy] = useState({ substance: '', type: 'drug', severity: 'unknown', reaction: '' })
  const [showAddMed, setShowAddMed] = useState(false)
  const [newMed, setNewMed] = useState({ name: '', dose: '', frequency: '' })

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

  const handleAddCondition = async (e) => {
    e.preventDefault()
    await historyApi.addCondition(id, { ...newCondition, registeredDate: new Date().toISOString().slice(0, 10) })
    setNewCondition({ label: '', notes: '' })
    setShowAddCondition(false)
    fetchData()
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

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to={`/patient/${id}`} className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Ficha
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

      <div className="flex-1 overflow-auto p-6 pb-24 space-y-4">
        {tab === 'antecedentes' ? (
          <>
            {/* Allergies section */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Alergias</h3>
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

            {/* Medical conditions */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Antecedentes médicos</h3>
                <button onClick={() => setShowAddCondition(!showAddCondition)} className="text-sky-500 hover:text-sky-700 text-sm font-medium flex items-center gap-1"><Plus size={14} /> Añadir</button>
              </div>
              {showAddCondition && (
                <form onSubmit={handleAddCondition} className="flex gap-2 mb-3 p-3 bg-slate-50 rounded-lg">
                  <input required value={newCondition.label} onChange={e => setNewCondition({ ...newCondition, label: e.target.value })} placeholder="Patología (ej: HTA, DM2, EPOC)" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                  <input value={newCondition.notes} onChange={e => setNewCondition({ ...newCondition, notes: e.target.value })} placeholder="Notas (opcional)" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                  <button type="submit" className="bg-sky-500 text-white px-4 rounded text-sm font-medium hover:bg-sky-600">Guardar</button>
                </form>
              )}
              {history.medicalHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No hay antecedentes registrados</p>
              ) : (
                <div className="space-y-2">
                  {history.medicalHistory.map(mh => (
                    <div key={mh.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <span className="font-medium text-sm">{mh.label}</span>
                      {mh.notes && <span className="text-xs text-slate-500">— {mh.notes}</span>}
                      <button onClick={() => { historyApi.deleteCondition(id, mh.id); fetchData() }} className="ml-auto text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Medicación habitual tab */
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Medicación habitual / crónica</h3>
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
                    <tr key={m.id} className="border-t border-slate-100">
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
