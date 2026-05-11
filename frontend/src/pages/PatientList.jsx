import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, HeartPulse, Bandage, Pill, ChevronDown, Check } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import TriageBadge from '../components/TriageBadge'
import { useToast, ToastContainer } from '../components/Toast'
import NewPatientModal from '../components/NewPatientModal'

const SPECIALTIES = [
  'Medicina', 'Traumatología', 'Cirugía', 'Ginecología', 'Pediatría', 'Oftalmología',
]

const LOCATIONS = Array.from({ length: 25 }, (_, i) => `B${i + 1}`)

/**
 * Natural sort: extracts leading letters and trailing number
 * so "B2" sorts before "B10".
 */
export function naturalCompare(a, b) {
  const re = /^([A-Za-z]*)(\d+)?$/
  const ma = (a || '').match(re) || ['', a || '', '']
  const mb = (b || '').match(re) || ['', b || '', '']
  const cmp = (ma[1] || '').localeCompare(mb[1] || '')
  if (cmp !== 0) return cmp
  return (parseInt(ma[2]) || 0) - (parseInt(mb[2]) || 0)
}

/* ── Custom dropdown component ── */
function InlineDropdown({ value, options, placeholder, onChange, width = 'w-28' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1 rounded-md text-sm border transition-colors
          ${value
            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
            : 'bg-white border-dashed border-slate-300 text-slate-400 hover:border-slate-400'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto">
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50"
          >—</button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between hover:bg-blue-50
                ${value === opt ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-slate-700'}`}
            >{opt}{value === opt && <Check size={14} className="text-blue-500" />}</button>
          ))}
        </div>
      )}
    </div>
  )
}

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

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [view, setView] = useState('table')
  const { toasts, removeToast, toast } = useToast()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [sortKey, setSortKey] = useState(null) // 'nivel' | 'ubicacion' | 'ingreso'
  const [sortDir, setSortDir] = useState('asc')
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

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'nivel') {
      return ((a.triageLevel || 0) - (b.triageLevel || 0)) * dir
    }
    if (sortKey === 'ubicacion') {
      return naturalCompare(a.location, b.location) * dir
    }
    if (sortKey === 'especialidad') {
      return (a.specialty || '').localeCompare(b.specialty || '') * dir
    }
    if (sortKey === 'ingreso') {
      return ((a.admissionDate || '').localeCompare(b.admissionDate || '')) * dir
    }
    return 0
  })

  const sortIndicator = (key) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const selectedPatient = patients.find(p => p.id === selectedId)

  const handleSelect = (id) => {
    setSelectedId(prev => prev === id ? null : id)
  }

  const handleCreate = async (data) => {
    try {
      const { data: patient } = await patientApi.create(data)
      setModalOpen(false)
      fetchPatients()
      setSelectedId(patient.id)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error creating patient')
    }
  }

  const actions = [
    { key: 'registros', icon: HeartPulse, color: 'text-red-600', label: 'Registros', route: (id) => `/patient/${id}` },
    { key: 'antecedentes', icon: Bandage, color: 'text-amber-600', label: 'Antecedentes', route: (id) => `/patient/${id}/history` },
    { key: 'medicacion', icon: Pill, color: 'text-teal-600', label: 'Medicación', route: (id) => `/patient/${id}/medication` },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 pb-24">
        {loading ? (
          <p className="text-slate-400 text-center mt-12">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-center mt-12">No hay pacientes activos</p>
        ) : view === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-20 cursor-pointer select-none hover:text-slate-700 whitespace-nowrap" onClick={() => handleSort('nivel')}>Nivel{sortIndicator('nivel')}</th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('ubicacion')}>Ubicación{sortIndicator('ubicacion')}</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">NHC</th>
                  <th className="px-4 py-3">Edad</th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('especialidad')}>Especialidad{sortIndicator('especialidad')}</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('ingreso')}>Ingreso{sortIndicator('ingreso')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => {
                  const isSelected = selectedId === p.id
                  return (
                    <tr
                      key={p.admissionId}
                      onClick={() => handleSelect(p.id)}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3"><TriageBadge level={p.triageLevel} /></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineDropdown
                          value={p.location || ''}
                          options={LOCATIONS}
                          placeholder="Cama"
                          onChange={async (v) => {
                            try {
                              await patientApi.updateLocation(p.admissionId, v)
                              setPatients(prev => prev.map(pt =>
                                pt.admissionId === p.admissionId ? { ...pt, location: v } : pt
                              ))
                            } catch { toast.error('Error al cambiar ubicación') }
                          }}
                          width="w-24"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{p.lastName}, {p.firstName}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{p.nhc}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{calcAge(p.birthDate) ?? '—'}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineDropdown
                          value={p.specialty || ''}
                          options={SPECIALTIES}
                          placeholder="Espec."
                          onChange={async (v) => {
                            try {
                              await patientApi.updateSpecialty(p.admissionId, v)
                              setPatients(prev => prev.map(pt =>
                                pt.admissionId === p.admissionId ? { ...pt, specialty: v } : pt
                              ))
                            } catch { toast.error('Error al cambiar especialidad') }
                          }}
                          width="w-36"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">{p.matCategory || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(p.admissionDate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const isSelected = selectedId === p.id
              return (
                <div
                  key={p.admissionId}
                  onClick={() => handleSelect(p.id)}
                  className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-shadow ${isSelected ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <TriageBadge level={p.triageLevel} />
                    <div>
                      <div className="font-semibold">{p.lastName}, {p.firstName}</div>
                      <div className="text-xs text-slate-500">{p.nhc} · {calcAge(p.birthDate) ?? '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm text-slate-600">{p.matCategory || 'Sin motivo'}</div>
                    {p.location && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{p.location}</span>}
                    {p.specialty && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{p.specialty}</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{formatDate(p.admissionDate)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-5 z-50">
        {actions.map(a => {
          const Icon = a.icon
          const disabled = !selectedId
          return (
            <button
              key={a.key}
              disabled={disabled}
              onClick={() => selectedId && navigate(a.route(selectedId))}
              className={`${a.color} ${disabled ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'} transition-opacity`}
              title={a.label}
            >
              <Icon size={22} />
            </button>
          )
        })}
        <div className="text-sm text-slate-500">
          {selectedPatient ? (
            <><strong className="text-slate-900">{selectedPatient.lastName}, {selectedPatient.firstName}</strong> · {selectedPatient.nhc}</>
          ) : (
            <span className="text-slate-400">Selecciona un paciente</span>
          )}
        </div>
      </div>

      <NewPatientModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
