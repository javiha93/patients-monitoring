import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import ActionBar from '../components/ActionBar'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientApi.getPatient(id)
      .then(({ data }) => setPatient(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

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
        {admission && (
          <button onClick={handleDischarge} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            Alta hospitalaria
          </button>
        )}
      </div>

      {/* Content — will be expanded with vitals, history, medication */}
      <div className="flex-1 overflow-auto p-6 pb-24">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-slate-400">
          Registros de constantes vitales — pendiente de implementar
        </div>
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />
    </div>
  )
}
