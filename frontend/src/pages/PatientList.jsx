import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, HeartPulse, Bandage, Pill, Syringe, Activity, ChevronDown, Check, Filter, X } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { useAuth } from '../context/AuthContext'
import { getSamplesNeeded, SAMPLE_ICONS } from '../constants/labCatalog'
import TriageBadge from '../components/TriageBadge'
import { useToast, ToastContainer } from '../components/Toast'
import NewPatientModal from '../components/NewPatientModal'

const SPECIALTIES = [
  'Medicina', 'Traumatología', 'Cirugía', 'Ginecología', 'Pediatría', 'Oftalmología',
]

const LOCATIONS = [
  ...Array.from({ length: 25 }, (_, i) => `A${i + 1}`),
  ...Array.from({ length: 25 }, (_, i) => `B${i + 1}`),
  ...Array.from({ length: 25 }, (_, i) => `C${i + 1}`),
]

const DATE_FILTERS = [
  { key: 'hoy', label: 'Hoy', days: 0 },
  { key: 'ayer', label: 'Ayer', days: 1 },
  { key: 'hoy_ayer', label: 'Hoy + Ayer', days: 1, includeToday: true },
  { key: '3d', label: '3 días', days: 3 },
  { key: '5d', label: '5 días', days: 5 },
  { key: '1w', label: '1 semana', days: 7 },
  { key: '1m', label: '1 mes', days: 30 },
]

/** Check if admissionDate passes the selected date filter */
export function matchesDateFilter(admissionDate, filterKey) {
  if (!filterKey || !admissionDate) return true
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const admission = new Date(admissionDate)
  const filter = DATE_FILTERS.find(f => f.key === filterKey)
  if (!filter) return true

  if (filter.key === 'hoy') {
    return admission >= startOfToday
  }
  if (filter.key === 'ayer') {
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    return admission >= startOfYesterday && admission < startOfToday
  }
  if (filter.key === 'hoy_ayer') {
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    return admission >= startOfYesterday
  }
  // "last N days" = from (today - N days) to now
  const cutoff = new Date(startOfToday)
  cutoff.setDate(cutoff.getDate() - filter.days)
  return admission >= cutoff
}

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
function InlineDropdown({ value, options, placeholder, onChange, width = 'w-28', displayValue, tooltip }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const shown = displayValue !== undefined ? displayValue : value

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={tooltip || value || ''}
        className={`w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-md text-sm transition-colors
          ${value
            ? 'text-slate-700 hover:bg-slate-100'
            : 'text-slate-400 hover:bg-slate-50'}`}
      >
        <span className="truncate">{shown || placeholder}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 min-w-[8rem] bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto">
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

const SPECIALTY_INITIALS = {
  'Medicina': 'Med',
  'Traumatología': 'Trau',
  'Cirugía': 'Cir',
  'Ginecología': 'Gin',
  'Pediatría': 'Ped',
  'Oftalmología': 'Oft',
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

/** Build tooltip text for pending lab tests */
function buildPendingLabTooltip(pendingLabs) {
  if (!pendingLabs || pendingLabs.length === 0) return ''
  return pendingLabs.map(lab => {
    const time = lab.requestedAt
      ? new Date(lab.requestedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : ''
    const params = lab.requestedParameters ? JSON.parse(lab.requestedParameters) : []
    const allSamples = getSamplesNeeded(params)
    const validatedSet = lab.validatedSamples ? new Set(JSON.parse(lab.validatedSamples)) : new Set()
    const pending = allSamples.filter(s => !validatedSet.has(s.key))
    const sampleNames = (pending.length > 0 ? pending : allSamples).map(s => s.label).join(', ')
    return `${time} — ${sampleNames}`
  }).join('\n')
}

function buildRecentEcgTooltip(recentEcgs) {
  if (!recentEcgs || recentEcgs.length === 0) return 'ECG realizado'
  return recentEcgs.map(ecg => {
    const time = ecg.completedAt
      ? new Date(ecg.completedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : ''
    return `ECG ${time}${ecg.completedBy ? ' — ' + ecg.completedBy : ''}`
  }).join('\n')
}

const STORAGE_KEY = 'patientListFilters'

function loadFilters() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveFilters(filters) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

export default function PatientList() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Administrativo'
  const saved = useRef(loadFilters())
  const [patients, setPatients] = useState([])
  const [view, setView] = useState('table')
  const { toasts, removeToast, toast } = useToast()
  const [search, setSearch] = useState(saved.current?.search ?? '')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [sortKey, setSortKey] = useState(saved.current?.sortKey ?? null)
  const [sortDir, setSortDir] = useState(saved.current?.sortDir ?? 'asc')
  const [filtersOpen, setFiltersOpen] = useState(saved.current?.filtersOpen ?? false)
  const [filterSpecialties, setFilterSpecialties] = useState(saved.current?.filterSpecialties ?? [])
  const [filterLevels, setFilterLevels] = useState(saved.current?.filterLevels ?? [])
  const [filterZones, setFilterZones] = useState(saved.current?.filterZones ?? [])
  const [filterDate, setFilterDate] = useState(saved.current?.filterDate ?? null)
  const navigate = useNavigate()

  // Persist filter state to sessionStorage
  useEffect(() => {
    saveFilters({ search, sortKey, sortDir, filtersOpen, filterSpecialties, filterLevels, filterZones, filterDate })
  }, [search, sortKey, sortDir, filtersOpen, filterSpecialties, filterLevels, filterZones, filterDate])

  const activeFilterCount = filterSpecialties.length + filterLevels.length + filterZones.length + (filterDate ? 1 : 0)

  const clearFilters = () => {
    setFilterSpecialties([])
    setFilterLevels([])
    setFilterZones([])
    setFilterDate(null)
  }

  const toggleFilter = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

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
    // Text search
    if (search) {
      const q = search.toLowerCase()
      const matchesSearch = p.firstName?.toLowerCase().includes(q)
        || p.lastName?.toLowerCase().includes(q)
        || p.nhc?.toLowerCase().includes(q)
        || p.matCategory?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }
    // Specialty filter
    if (filterSpecialties.length > 0 && !filterSpecialties.includes(p.specialty)) return false
    // Level filter (0 = "Sin nivel" for patients with no triageLevel)
    if (filterLevels.length > 0) {
      const hasNoLevel = filterLevels.includes(0)
      const numericLevels = filterLevels.filter(l => l !== 0)
      const matchesLevel = (hasNoLevel && !p.triageLevel) || numericLevels.includes(p.triageLevel)
      if (!matchesLevel) return false
    }
    // Zone filter
    if (filterZones.length > 0) {
      const zone = p.location ? p.location.charAt(0).toUpperCase() : ''
      if (!filterZones.includes(zone)) return false
    }
    // Date filter
    if (filterDate && !matchesDateFilter(p.admissionDate, filterDate)) return false
    return true
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

  const handleCreate = async (data, isReopen) => {
    if (isReopen) {
      // Reopen was handled inside the modal
      setModalOpen(false)
      fetchPatients()
      return
    }
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
    { key: 'pruebas', icon: Syringe, color: 'text-violet-600', label: 'Pruebas', route: (id) => `/patient/${id}/tests` },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <h2 className="text-lg font-bold flex-1">
          Pacientes activos
          <span className="ml-2 text-sm font-normal text-slate-400">
            {filtered.length !== patients.length
              ? `${filtered.length} de ${patients.length}`
              : patients.length}
          </span>
        </h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:border-blue-500 outline-none" />
        </div>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          <button onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'bg-slate-100' : ''}`}><List size={16} /></button>
          <button onClick={() => setView('cards')} className={`p-2 ${view === 'cards' ? 'bg-slate-100' : ''}`}><LayoutGrid size={16} /></button>
        </div>
        {isAdmin && (
          <button onClick={() => setModalOpen(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600">
            <Plus size={16} /> Abrir ficha
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <button
          onClick={() => setFiltersOpen(prev => !prev)}
          className="flex items-center gap-2 px-6 py-2 text-sm text-slate-600 hover:text-slate-900 w-full"
        >
          <Filter size={14} />
          <span className="font-medium">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>
          )}
          <ChevronDown size={14} className={`ml-auto transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
        {filtersOpen && (
          <div className="px-6 pb-4 flex flex-wrap items-start gap-6">
            {/* Specialty multi-select */}
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Especialidad</div>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTIES.map(s => {
                  const active = filterSpecialties.includes(s)
                  return (
                    <button
                      key={s}
                      onClick={() => toggleFilter(filterSpecialties, setFilterSpecialties, s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                        ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                    >{s}</button>
                  )
                })}
              </div>
            </div>
            {/* Level multi-select */}
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Nivel</div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => {
                  const active = filterLevels.includes(n)
                  const colors = ['bg-red-600', 'bg-orange-600', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500']
                  return (
                    <button
                      key={n}
                      onClick={() => toggleFilter(filterLevels, setFilterLevels, n)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all
                        ${colors[n - 1]} ${active ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-40 hover:opacity-70'}`}
                    >{n}</button>
                  )
                })}
                <button
                  onClick={() => toggleFilter(filterLevels, setFilterLevels, 0)}
                  className={`h-8 px-2.5 rounded-full flex items-center justify-center text-xs font-medium border transition-all
                    ${filterLevels.includes(0) ? 'bg-slate-600 text-white border-slate-600 ring-2 ring-offset-1 ring-slate-400 scale-110' : 'bg-white text-slate-500 border-slate-300 opacity-60 hover:opacity-90'}`}
                >Sin nivel</button>
              </div>
            </div>
            {/* Zone multi-select */}
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Zona</div>
              <div className="flex gap-1.5">
                {['A', 'B', 'C'].map(z => {
                  const active = filterZones.includes(z)
                  return (
                    <button
                      key={z}
                      onClick={() => toggleFilter(filterZones, setFilterZones, z)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                    >Zona {z}</button>
                  )
                })}
              </div>
            </div>
            {/* Date filter */}
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Ingreso</div>
              <div className="flex flex-wrap gap-1.5">
                {DATE_FILTERS.map(f => {
                  const active = filterDate === f.key
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilterDate(prev => prev === f.key ? null : f.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                        ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                    >{f.label}</button>
                  )
                })}
              </div>
            </div>
            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="self-end text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 pb-0.5">
                <X size={12} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
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
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  <th className="px-4 py-3 w-20 cursor-pointer select-none hover:text-slate-700 whitespace-nowrap" onClick={() => handleSort('nivel')}>Nivel{sortIndicator('nivel')}</th>
                  <th className="px-2 py-3 w-16 cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('ubicacion')}>Ubic.{sortIndicator('ubicacion')}</th>
                  <th className="px-2 py-3 w-14 cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('especialidad')}>Esp.{sortIndicator('especialidad')}</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-3 py-3">Motivo</th>
                  <th className="px-3 py-3">Observaciones</th>
                  <th className="px-2 py-3 w-8 text-right"></th>
                  <th className="px-4 py-3 text-right cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('ingreso')}>Ingreso{sortIndicator('ingreso')}</th>
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
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineDropdown
                          value={p.location || ''}
                          options={LOCATIONS}
                          placeholder="—"
                          onChange={async (v) => {
                            try {
                              await patientApi.updateLocation(p.admissionId, v)
                              setPatients(prev => prev.map(pt =>
                                pt.admissionId === p.admissionId ? { ...pt, location: v } : pt
                              ))
                            } catch { toast.error('Error al cambiar ubicación') }
                          }}
                          width="w-14"
                        />
                      </td>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <InlineDropdown
                          value={p.specialty || ''}
                          options={SPECIALTIES}
                          placeholder="—"
                          displayValue={SPECIALTY_INITIALS[p.specialty] || (p.specialty ? p.specialty.slice(0, 3) : '')}
                          tooltip={p.specialty || ''}
                          onChange={async (v) => {
                            try {
                              await patientApi.updateSpecialty(p.admissionId, v)
                              setPatients(prev => prev.map(pt =>
                                pt.admissionId === p.admissionId ? { ...pt, specialty: v } : pt
                              ))
                            } catch { toast.error('Error al cambiar especialidad') }
                          }}
                          width="w-12"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {p.lastName}, {p.firstName}
                        <span className="text-slate-400 font-normal text-sm ml-1.5">{calcAge(p.birthDate) ?? ''}</span>
                      </td>
                      <td className="px-3 py-3 text-sm">{p.matCategory || '—'}</td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          defaultValue={p.observations || ''}
                          placeholder="—"
                          onBlur={async (e) => {
                            const val = e.target.value.trim()
                            if (val !== (p.observations || '')) {
                              try {
                                await patientApi.updateObservations(p.admissionId, val)
                                setPatients(prev => prev.map(pt =>
                                  pt.admissionId === p.admissionId ? { ...pt, observations: val } : pt
                                ))
                              } catch { /* ignore */ }
                            }
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                          className="w-full bg-transparent text-sm text-slate-600 border-0 border-b border-transparent hover:border-slate-300 focus:border-violet-400 focus:outline-none px-0 py-0.5 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.pendingLabs && p.pendingLabs.length > 0 ? (
                            <span title={buildPendingLabTooltip(p.pendingLabs)} data-testid="pending-lab-icon">
                              <Syringe size={16} className="text-red-500" />
                            </span>
                          ) : p.hasCompletedLabs && (
                            <span title="Analíticas realizadas" data-testid="completed-lab-icon">
                              <Syringe size={16} className="text-slate-300" />
                            </span>
                          )}
                          {p.hasPendingEcg ? (
                            <span title="ECG pendiente" data-testid="pending-ecg-icon">
                              <Activity size={16} className="text-red-500" />
                            </span>
                          ) : p.hasCompletedEcg && (
                            <span title={buildRecentEcgTooltip(p.recentEcgs)} data-testid="completed-ecg-icon">
                              <Activity size={16} className="text-slate-300" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 text-right">{formatDate(p.admissionDate)}</td>
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
                    {p.pendingLabs && p.pendingLabs.length > 0 ? (
                      <span title={buildPendingLabTooltip(p.pendingLabs)} data-testid="pending-lab-icon">
                        <Syringe size={14} className="text-red-500" />
                      </span>
                    ) : p.hasCompletedLabs && (
                      <span title="Analíticas realizadas" data-testid="completed-lab-icon">
                        <Syringe size={14} className="text-slate-300" />
                      </span>
                    )}
                    {p.hasPendingEcg ? (
                      <span title="ECG pendiente" data-testid="pending-ecg-icon">
                        <Activity size={14} className="text-red-500" />
                      </span>
                    ) : p.hasCompletedEcg && (
                      <span title={buildRecentEcgTooltip(p.recentEcgs)} data-testid="completed-ecg-icon">
                        <Activity size={14} className="text-slate-300" />
                      </span>
                    )}
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
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-6 py-5 flex items-center gap-6 z-50">
        {actions.map(a => {
          const Icon = a.icon
          const disabled = !selectedId || isAdmin
          return (
            <button
              key={a.key}
              disabled={disabled}
              onClick={() => selectedId && !isAdmin && navigate(a.route(selectedId))}
              className={`${a.color} ${disabled ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'} transition-opacity`}
              title={isAdmin ? 'No disponible para Administrativo' : a.label}
            >
              <Icon size={30} strokeWidth={1.8} />
            </button>
          )
        })}
        <div className="text-base text-slate-500">
          {selectedPatient ? (
            <><strong className="text-slate-900">{selectedPatient.lastName}, {selectedPatient.firstName}</strong> <span className="text-slate-400">{calcAge(selectedPatient.birthDate) ?? ''}</span> · <span className="font-mono text-sm">{selectedPatient.nhc}</span></>
          ) : (
            <span className="text-slate-400">Selecciona un paciente</span>
          )}
        </div>
      </div>

      <NewPatientModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} isAdmin={isAdmin} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
