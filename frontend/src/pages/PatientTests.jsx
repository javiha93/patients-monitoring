import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Syringe } from 'lucide-react'
import { patientApi } from '../services/patientApi'
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

export default function PatientTests() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientApi.getPatient(id)
      .then(({ data }) => setPatient(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)

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

      <div className="flex-1 overflow-auto p-6 pb-24">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Syringe size={48} className="mx-auto text-violet-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Pruebas diagnósticas</h2>
          <p className="text-sm text-slate-400">Próximamente — analíticas, cultivos, pruebas de imagen</p>
        </div>
      </div>

      <ActionBar patient={patient} admissionId={patient.activeAdmission?.id} />
    </div>
  )
}
