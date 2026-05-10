import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { vitalsApi } from '../services/vitalsApi'
import ActionBar from '../components/ActionBar'
import VitalsSummaryCards from '../components/VitalsSummaryCards'
import VitalsTable from '../components/VitalsTable'
import NewVitalSignModal from '../components/NewVitalSignModal'
import InsightsPanel from '../components/InsightsPanel'

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function PatientRecord() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const { data: p } = await patientApi.getPatient(id)
      setPatient(p)
      if (p.activeAdmission) {
        const { data: v } = await vitalsApi.getByAdmission(p.activeAdmission.id)
        setVitals(v)
      }
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)
  const admission = patient.activeAdmission

  const handleDischarge = async () => {
    if (!confirm(`¿Confirmas el alta hospitalaria de ${patient.lastName}, ${patient.firstName}?`)) return
    try {
      await patientApi.discharge(patient.id, { dischargeDate: new Date().toISOString() })
      navigate('/')
    } catch (e) {
      alert(e.response?.data?.error || 'Error')
    }
  }

  const handleNewVital = async (data) => {
    try {
      await vitalsApi.create({ ...data, admissionId: admission.id })
      setModalOpen(false)
      fetchData()
    } catch (e) {
      alert(e.response?.data?.error || 'Error guardando registro')
    }
  }

  return (
    <div className="flex flex-col h-full">
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
        <button onClick={() => setModalOpen(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600">
          <Plus size={16} /> Nuevo registro
        </button>
        {admission && (
          <button onClick={handleDischarge} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            Alta hospitalaria
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 pb-24 space-y-4">
        {admission && <InsightsPanel patientId={patient.id} admissionId={admission.id} />}
        <VitalsSummaryCards vitals={vitals} />
        <VitalsTable vitals={vitals} />
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      <NewVitalSignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewVital}
        patientName={`${patient.lastName}, ${patient.firstName} · ${age ? age + ' años' : ''}`}
      />
    </div>
  )
}
