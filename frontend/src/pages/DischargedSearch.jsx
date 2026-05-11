import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RotateCcw } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { useToast, ToastContainer } from '../components/Toast'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function DischargedSearch() {
  const { toasts, removeToast, toast } = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async () => {
    try {
      const { data } = await patientApi.listDischarged(query)
      setResults(data)
      setSearched(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReopen = async (patientId) => {
    if (!confirm('¿Reabrir ficha de este paciente?')) return
    try {
      await patientApi.reopen(patientId, 3, null)
      navigate(`/patient/${patientId}`)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <h2 className="text-lg font-bold mb-3">Pacientes dados de alta</h2>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nombre o NHC..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <button onClick={handleSearch} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600">
            Buscar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!searched ? (
          <p className="text-slate-400 text-center mt-12">Introduce un término de búsqueda</p>
        ) : results.length === 0 ? (
          <p className="text-slate-400 text-center mt-12">No se encontraron resultados</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">NHC</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Ingreso</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {results.map(p => (
                  <tr key={p.admissionId} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{p.lastName}, {p.firstName}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.nhc}</td>
                    <td className="px-4 py-3 text-sm">{p.matCategory || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.admissionDate)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleReopen(p.id)} className="text-sky-500 hover:text-sky-700 flex items-center gap-1 text-sm font-medium">
                        <RotateCcw size={14} /> Reabrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
