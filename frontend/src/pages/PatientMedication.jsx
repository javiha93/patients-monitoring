import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Clock } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { prescriptionApi } from '../services/prescriptionApi'
import { vitalsApi } from '../services/vitalsApi'
import { useAuth } from '../context/AuthContext'
import ActionBar from '../components/ActionBar'
import InsightsPanel from '../components/InsightsPanel'
import MedicationGrid from '../components/MedicationGrid'
import { InsulinSignModal, EditAdminModal } from '../components/SignModal'
import { useToast, ToastContainer } from '../components/Toast'

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  const totalMonths = years * 12 + months

  if (years >= 2) return `${years} años`
  if (totalMonths >= 1) return `${totalMonths} meses`
  return `${Math.max(0, days)} días`
}

export default function PatientMedication() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const gridRef = useRef(null)
  const [patient, setPatient] = useState(null)
  const { toasts, removeToast, toast } = useToast()
  const [prescriptions, setPrescriptions] = useState([])
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)

  const currentUser = user?.displayName || 'Usuario'
  const [showNewRx, setShowNewRx] = useState(false)
  const [newRx, setNewRx] = useState({
    name: '', amount: '', unit: 'mg', route: 'VO', frequency: 'c/8h',
    category: 'fixed', scheduledHours: '8,16,0', conditionText: '', prescribedBy: '',
  })
  const [insulinModal, setInsulinModal] = useState({ open: false, prescription: null, slot: null })
  const [editModal, setEditModal] = useState({ open: false, admin: null, prescription: null })

  const fetchData = async () => {
    try {
      const { data: p } = await patientApi.getPatient(id)
      setPatient(p)
      if (p.activeAdmission) {
        const [rxRes, vitalsRes] = await Promise.all([
          prescriptionApi.getByAdmission(p.activeAdmission.id),
          vitalsApi.getByAdmission(p.activeAdmission.id),
        ])
        setPrescriptions(rxRes.data)
        setVitals(vitalsRes.data)
      }
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  // Direct sign (non-insulin): immediate, no modal
  const handleDirectSign = async (data) => {
    try {
      await prescriptionApi.sign(data)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al firmar')
    }
  }

  // Direct unsign: immediate
  const handleDirectUnsign = async (adminId) => {
    try {
      await prescriptionApi.unsign(adminId)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al desfirmar')
    }
  }

  // Insulin: open modal
  const handleOpenInsulinModal = (prescription, slot) => {
    setInsulinModal({ open: true, prescription, slot })
  }

  // Insulin confirm
  const handleInsulinConfirm = async (data) => {
    try {
      await prescriptionApi.sign(data)
      setInsulinModal({ open: false, prescription: null, slot: null })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al firmar insulina')
    }
  }

  // Edit modal (from pencil icon)
  const handleOpenEditModal = (admin, prescription) => {
    setEditModal({ open: true, admin, prescription })
  }

  const handleCreateRx = async (e) => {
    e.preventDefault()
    try {
      await prescriptionApi.create({ ...newRx, admissionId: patient.activeAdmission.id })
      setShowNewRx(false)
      setNewRx({ name: '', amount: '', unit: 'mg', route: 'VO', frequency: 'c/8h', category: 'fixed', scheduledHours: '8,16,0', conditionText: '', prescribedBy: '' })
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al crear prescripción')
    }
  }

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)
  const admission = patient.activeAdmission

  return (
    <div className="flex flex-col h-full bg-slate-50" style={{ minWidth: 0, maxWidth: '100vw' }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center gap-3 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-xs">
          <ChevronLeft size={16} /> Lista
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{patient.lastName}, {patient.firstName}</div>
          <div className="text-[11px] text-slate-500">
            {age ? `${age} · ` : ''}{patient.nhc}
            {admission?.location ? ` · ${admission.location}` : ''}
          </div>
        </div>
        <button
          onClick={() => gridRef.current?.scrollToNow()}
          className="text-slate-500 hover:text-blue-600 px-2.5 py-1.5 rounded text-xs flex items-center gap-1 border border-slate-200 hover:border-blue-300"
        >
          <Clock size={12} /> Ahora
        </button>
        {user?.role !== 'Enfermería' && (
          <button
            onClick={() => setShowNewRx(true)}
            className="bg-teal-500 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 hover:bg-teal-600"
          >
            <Plus size={14} /> Prescripción
          </button>
        )}
      </div>

      {/* Insights — allergy conflicts */}
      {admission && (
        <div className="px-5 pt-2">
          <InsightsPanel patientId={patient.id} admissionId={admission.id} includeTypes={['allergy_conflict', 'habitual_analgesic_not_prescribed', 'opioid_respiratory_depression']} />
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ minWidth: 0 }}>
        {admission ? (
          <MedicationGrid
            ref={gridRef}
            prescriptions={prescriptions}
            admissionDate={admission.admissionDate}
            onDirectSign={handleDirectSign}
            onDirectUnsign={handleDirectUnsign}
            onOpenInsulinModal={handleOpenInsulinModal}
            onOpenEditModal={handleOpenEditModal}
            currentUser={currentUser}
            canSign={user?.role !== 'Medicina'}
          />
        ) : (
          <p className="text-slate-400 text-center mt-12">Sin ingreso activo</p>
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      {/* Insulin Sign Modal */}
      <InsulinSignModal
        open={insulinModal.open}
        prescription={insulinModal.prescription}
        slot={insulinModal.slot}
        vitals={vitals}
        currentUser={currentUser}
        onConfirm={handleInsulinConfirm}
        onClose={() => setInsulinModal({ open: false, prescription: null, slot: null })}
      />

      {/* Edit Admin Modal */}
      <EditAdminModal
        open={editModal.open}
        admin={editModal.admin}
        prescription={editModal.prescription}
        onUpdate={async (adminId, data) => {
          try {
            await prescriptionApi.updateAdministration(adminId, data)
            setEditModal({ open: false, admin: null, prescription: null })
            fetchData()
          } catch (e) {
            toast.error(e.response?.data?.error || 'Error al actualizar')
          }
        }}
        onUnsign={async (adminId) => {
          await handleDirectUnsign(adminId)
          setEditModal({ open: false, admin: null, prescription: null })
        }}
        onClose={() => setEditModal({ open: false, admin: null, prescription: null })}
      />

      {/* New Prescription Modal */}
      {showNewRx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewRx(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-3">Nueva prescripción</h3>
            <form onSubmit={handleCreateRx} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-500 font-medium">Medicamento</label>
                  <input value={newRx.name} onChange={e => setNewRx({ ...newRx, name: e.target.value })} required
                    className="w-full border rounded px-2.5 py-1.5 text-sm" placeholder="Paracetamol" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Dosis</label>
                  <input value={newRx.amount} onChange={e => setNewRx({ ...newRx, amount: e.target.value })} required
                    className="w-full border rounded px-2.5 py-1.5 text-sm" placeholder="1000" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Unidad</label>
                  <select value={newRx.unit} onChange={e => setNewRx({ ...newRx, unit: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 text-sm">
                    <option>mg</option><option>g</option><option>ml</option><option>UI</option><option>mcg</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Vía</label>
                  <select value={newRx.route} onChange={e => setNewRx({ ...newRx, route: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 text-sm">
                    <option>VO</option><option>IV</option><option>SC</option><option>IM</option><option>Tópica</option><option>Inhalatoria</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Frecuencia</label>
                  <select value={newRx.frequency} onChange={e => setNewRx({ ...newRx, frequency: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 text-sm">
                    <option>c/4h</option><option>c/6h</option><option>c/8h</option><option>c/12h</option><option>c/24h</option><option>Si precisa</option><option>Continua</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Categoría</label>
                  <select value={newRx.category} onChange={e => setNewRx({ ...newRx, category: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 text-sm">
                    <option value="fixed">Fija</option><option value="conditional">Condicional</option>
                    <option value="fluids">Sueroterapia</option><option value="insulin">Insulina</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Horas pautadas</label>
                  <input value={newRx.scheduledHours} onChange={e => setNewRx({ ...newRx, scheduledHours: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 text-sm" placeholder="8,16,0" />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-500 font-medium">Prescrito por</label>
                  <input value={newRx.prescribedBy} onChange={e => setNewRx({ ...newRx, prescribedBy: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 text-sm" placeholder="Dr. García" />
                </div>
                {newRx.category === 'conditional' && (
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500 font-medium">Condición</label>
                    <input value={newRx.conditionText} onChange={e => setNewRx({ ...newRx, conditionText: e.target.value })}
                      className="w-full border rounded px-2.5 py-1.5 text-sm" placeholder="Si Tª > 38°C" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowNewRx(false)} className="px-3 py-1.5 text-xs text-slate-500">Cancelar</button>
                <button type="submit" className="bg-teal-500 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-teal-600">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
