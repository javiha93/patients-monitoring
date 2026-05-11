import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Pill, Clock } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { prescriptionApi } from '../services/prescriptionApi'
import ActionBar from '../components/ActionBar'
import MedicationGrid from '../components/MedicationGrid'
import { SignModal, EditAdminModal } from '../components/SignModal'

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
  const gridRef = useRef(null)
  const [patient, setPatient] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  // New prescription modal
  const [showNewRx, setShowNewRx] = useState(false)
  const [newRx, setNewRx] = useState({
    name: '', amount: '', unit: 'mg', route: 'VO', frequency: 'c/8h',
    category: 'fixed', scheduledHours: '8,16,0', conditionText: '', prescribedBy: '',
  })

  // Sign modal
  const [signModal, setSignModal] = useState({ open: false, prescription: null, slot: null })

  // Edit admin modal
  const [editModal, setEditModal] = useState({ open: false, admin: null, prescription: null })

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

  const handleSign = (data, prescription) => {
    if (prescription.category === 'insulin') {
      setSignModal({ open: true, prescription, slot: data.administeredAt })
    } else {
      setSignModal({ open: true, prescription, slot: data.administeredAt })
    }
  }

  const handleConfirmSign = async (data) => {
    try {
      await prescriptionApi.sign(data)
      setSignModal({ open: false, prescription: null, slot: null })
      fetchData()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al firmar')
    }
  }

  const handleEditAdmin = (admin, prescription) => {
    setEditModal({ open: true, admin, prescription })
  }

  const handleUnsign = async (adminId) => {
    try {
      await prescriptionApi.unsign(adminId)
      setEditModal({ open: false, admin: null, prescription: null })
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
      setNewRx({ name: '', amount: '', unit: 'mg', route: 'VO', frequency: 'c/8h', category: 'fixed', scheduledHours: '8,16,0', conditionText: '', prescribedBy: '' })
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
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Lista
        </Link>
        <div className="flex-1">
          <div className="text-base font-bold">{patient.lastName}, {patient.firstName}</div>
          <div className="text-xs text-slate-500">
            {age ? `${age} años · ` : ''}{patient.nhc}
            {admission?.location ? ` · ${admission.location}` : ''}
          </div>
        </div>
        <button
          onClick={() => gridRef.current?.scrollToNow()}
          className="text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 border border-slate-200 hover:border-blue-300"
          title="Ir a la hora actual"
        >
          <Clock size={14} /> Ahora
        </button>
        <button
          onClick={() => setShowNewRx(true)}
          className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={16} /> Nueva prescripción
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        {admission ? (
          <MedicationGrid
            ref={gridRef}
            prescriptions={prescriptions}
            admissionDate={admission.admissionDate}
            onSign={handleSign}
            onEditAdmin={handleEditAdmin}
            insulinScales={[]}
          />
        ) : (
          <p className="text-slate-400 text-center mt-12">Sin ingreso activo</p>
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      {/* Sign Modal */}
      <SignModal
        open={signModal.open}
        prescription={signModal.prescription}
        slot={signModal.slot}
        insulinScale={null}
        onConfirm={handleConfirmSign}
        onClose={() => setSignModal({ open: false, prescription: null, slot: null })}
      />

      {/* Edit Admin Modal */}
      <EditAdminModal
        open={editModal.open}
        admin={editModal.admin}
        prescription={editModal.prescription}
        onUpdate={async (adminId, data) => {
          // For now just close — update endpoint can be added later
          setEditModal({ open: false, admin: null, prescription: null })
        }}
        onUnsign={handleUnsign}
        onClose={() => setEditModal({ open: false, admin: null, prescription: null })}
      />

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
                    <option value="fluids">Sueroterapia</option><option value="insulin">Insulina</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Horas pautadas</label>
                  <input value={newRx.scheduledHours} onChange={e => setNewRx({ ...newRx, scheduledHours: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="8,16,0" />
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
