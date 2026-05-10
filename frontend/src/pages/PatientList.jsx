import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import TriageBadge from '../components/TriageBadge'
import NewPatientModal from '../components/NewPatientModal'

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [view, setView] = useState('table')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchPatients = async () => {
    try {
      const { data } = await patientApi.listActive()
      setPatients(data)
    } catch (e) {
      console.error('Error fetching patients:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPatients() }, [])

  const filtered = patients.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.firstName?.toLowerCase().includes(q)
      || p.lastName?.toLowerCase().includes(q)
      || p.nhc?.toLowerCase().includes(q)
      || p.matCategory?.toLowerCase().includes(q)
  })

  const handleCreate = async (data) => {
    try {
      const { data: patient } = await patientApi.create(data)
      setModalOpen(false)
      fetchPatients()
      navigate(`/patient/${patient.id}`)
    } catch (e) {
      alert(e.response?.data?.error || 'Error creating patient')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <h2 className="text-lg font-bold flex-1">Pacientes activos</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:border-blue-500 outline-none" />
        </div>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          <button onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'bg-slate-100' : ''}`}><List size={16} /></button>
          <button onClick={() => setView('cards')} className={`p-2 ${view === 'cards' ? 'bg-slate-100' : ''}`}><LayoutGrid size={16} /></button>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600">
          <Plus size={16} /> Abrir ficha
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-slate-400 text-center mt-12">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-center mt-12">No hay pacientes activos</p>
        ) : view === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-12">Nivel</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">NHC</th>
                  <th className="px-4 py-3">Edad</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.admissionId} onClick={() => navigate(`/patient/${p.id}`)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3"><TriageBadge level={p.triageLevel} /></td>
                    <td className="px-4 py-3 font-medium">{p.lastName}, {p.firstName}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.nhc}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{calcAge(p.birthDate) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">{p.matCategory || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.admissionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.admissionId} onClick={() => navigate(`/patient/${p.id}`)} className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <TriageBadge level={p.triageLevel} />
                  <div>
                    <div className="font-semibold">{p.lastName}, {p.firstName}</div>
                    <div className="text-xs text-slate-500">{p.nhc} · {calcAge(p.birthDate) ?? '—'} años</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600">{p.matCategory || 'Sin motivo'}</div>
                <div className="text-xs text-slate-400 mt-1">{formatDate(p.admissionDate)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewPatientModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  )
}
