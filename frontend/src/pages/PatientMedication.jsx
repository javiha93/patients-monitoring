import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Pill } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { prescriptionApi } from '../services/prescriptionApi'
import ActionBar from '../components/ActionBar'
import MedicationGrid from '../components/MedicationGrid'

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function PatientMedication() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewRx, setShowNewRx] = useState(false)
  const [newRx, setNewRx] = useState({
    name: '', amount: '', unit: 'mg', route: 'VO', frequency: 'c/8h',
    category: 'fixed', scheduledHours: '8,16,24', conditionText: '', prescribedBy: '',
  })

  const fetchData = async () => {
    try {
      const { data: p } = await patientApi.getPatient(id)
      setPatient(p)
      if (p.activeAdmission) {
        const { data: rx } = await prescriptionApi.getByAdmission(p.activeAdmission.id)
        setPrescriptions(rx)
      }
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleSign = async (data) => {
    try {
      await prescriptionApi.sign(data)
      fetchData()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al firmar')
    }
  }

  const handleUnsign = async (adminId) => {
    try {
      await prescriptionApi.unsign(adminId)
      fetchData()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al desfirmar')
    }
  }

  const handleCreateRx = async (e) => {
    e.preventDefault()
    try {
      await prescriptionApi.create({
        ...newRx,
        admissionId: patient.activeAdmission.id,
      })
      setShowNewRx(false)
      setNewRx({ name: '', amount: '', unit: 'mg', route: 'VO', frequency: 'c/8h', category: 'fixed', scheduledHours: '8,16,24', conditionText: '', prescribedBy: '' })
      fetchData()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al crear prescripción')
    }
  }

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)
  const admission = patient.activeAdmission

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Lista
        </Link>
        <div className="flex-1">
          <div className="text-lg font-bold">{patient.lastName}, {patient.firstName}</div>
          <div className="text-sm text-slate-500">
            {age ? `${age} años · ` : ''}{patient.nhc}
            {admission ? ` · ${admission.matCategory || ''}` : ''}
          </div>
        </div>
        <button
          onClick={() => setShowNewRx(true)}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={16} /> Nueva prescripción
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6 pb-24">
        <div className="flex items-center gap-2 mb-4">
          <Pill size={20} className="text-teal-600" />
          <h2 className="text-lg font-bold text-slate-800">Medicación activa — Grid 72h</h2>
          <span className="text-sm text-slate-400 ml-2">{prescriptions.length} prescripciones</span>
        </div>

        {admission ? (
          <MedicationGrid
            prescriptions={prescriptions}
            admissionDate={admission.admissionDate}
            onSign={handleSign}
            onUnsign={handleUnsign}
          />
        ) : (
          <p className="text-slate-400">Sin ingreso activo</p>
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      {/* New Prescription Modal */}
      {showNewRx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewRx(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nueva prescripción</h3>
            <form onSubmit={handleCreateRx} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 font-medium">Medicamento</label>
                  <input value={newRx.name} onChange={e => setNewRx({ ...newRx, name: e.target.value })} required
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Paracetamol" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Dosis</label>
                  <input value={newRx.amount} onChange={e => setNewRx({ ...newRx, amount: e.target.value })} required
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1000" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Unidad</label>
                  <select value={newRx.unit} onChange={e => setNewRx({ ...newRx, unit: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>mg</option><option>g</option><option>ml</option><option>UI</option><option>mcg</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Vía</label>
                  <select value={newRx.route} onChange={e => setNewRx({ ...newRx, route: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>VO</option><option>IV</option><option>SC</option><option>IM</option><option>Tópica</option><option>Inhalatoria</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Frecuencia</label>
                  <select value={newRx.frequency} onChange={e => setNewRx({ ...newRx, frequency: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option>c/4h</option><option>c/6h</option><option>c/8h</option><option>c/12h</option><option>c/24h</option><option>Si precisa</option><option>Continua</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Categoría</label>
                  <select value={newRx.category} onChange={e => setNewRx({ ...newRx, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="fixed">Fija</option><option value="conditional">Condicional</option>
                    <option value="fluids">Fluidos</option><option value="insulin">Insulina</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Horas pautadas</label>
                  <input value={newRx.scheduledHours} onChange={e => setNewRx({ ...newRx, scheduledHours: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="8,16,24" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 font-medium">Prescrito por</label>
                  <input value={newRx.prescribedBy} onChange={e => setNewRx({ ...newRx, prescribedBy: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Dr. García" />
                </div>
                {newRx.category === 'conditional' && (
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 font-medium">Condición</label>
                    <input value={newRx.conditionText} onChange={e => setNewRx({ ...newRx, conditionText: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Si Tª > 38°C" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewRx(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
                <button type="submit" className="bg-teal-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-600">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
