import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, HeartPulse, Bandage, Pill, Syringe, Activity, ChevronDown, Check, Filter, X, UserX, Radiation, Magnet, RefreshCw } from 'lucide-react'
import XRayIcon from '../components/XRayIcon'
import { patientApi } from '../services/patientApi'
import { labTestApi } from '../services/labTestApi'
import { ecgApi } from '../services/ecgApi'
import { radiologyApi } from '../services/radiologyApi'
import { vitalsApi } from '../services/vitalsApi'
import { getUsersByRole } from '../services/authApi'
import { useAuth } from '../context/AuthContext'
import { getSamplesNeeded, SAMPLE_ICONS, PRESETS } from '../constants/labCatalog'
import TriageBadge from '../components/TriageBadge'
import TriageModal from '../components/TriageModal'
import { notificationApi } from '../services/notificationApi'
import Select from '../components/Select'
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

/* ── Assignment cell component ── */
function AssignmentCell({ patient, user, onUpdate, toast }) {
  const p = patient
  const isNurse = user?.role === 'Enfermería'
  const isDoctor = user?.role === 'Medicina'
  const canAssign = isNurse || isDoctor

  const handleAssign = async () => {
    if (!canAssign) return
    const name = user.displayName
    try {
      if (isNurse) {
        if (p.assignedNurse === name) return // already assigned to me
        if (p.assignedNurse) {
          if (!window.confirm(`Este paciente ya tiene asignado/a a ${p.assignedNurse}. ¿Quieres reemplazarlo/a?`)) return
        }
        await patientApi.assignNurse(p.admissionId, name)
        onUpdate({ assignedNurse: name })
      } else {
        if (p.assignedDoctor === name) return // already assigned to me
        if (p.assignedDoctor) {
          if (!window.confirm(`Este paciente ya tiene asignado/a a ${p.assignedDoctor}. ¿Quieres reemplazarlo/a?`)) return
        }
        await patientApi.assignDoctor(p.admissionId, name)
        onUpdate({ assignedDoctor: name })
      }
    } catch { toast.error('Error al asignar') }
  }

  const handleUnassign = async (role) => {
    try {
      if (role === 'nurse') {
        await patientApi.unassignNurse(p.admissionId)
        onUpdate({ assignedNurse: null, previousNurse: p.assignedNurse })
      } else {
        await patientApi.unassignDoctor(p.admissionId)
        onUpdate({ assignedDoctor: null, previousDoctor: p.assignedDoctor })
      }
    } catch { toast.error('Error al desasignar') }
  }

  const nurseInitials = getInitials(p.assignedNurse)
  const doctorInitials = getInitials(p.assignedDoctor)
  const hasPrevNurse = !p.assignedNurse && p.previousNurse
  const hasPrevDoctor = !p.assignedDoctor && p.previousDoctor

  const hasAny = p.assignedNurse || p.assignedDoctor || hasPrevNurse || hasPrevDoctor

  if (!hasAny && !canAssign) return <span className="text-slate-300">—</span>

  const showAssignBtn = canAssign && !(isNurse && p.assignedNurse === user.displayName) && !(isDoctor && p.assignedDoctor === user.displayName)

  // Fixed 3-slot layout: [nurse] [doctor] [action] — each slot always 28px wide
  return (
    <div className="group/assign grid grid-cols-3 gap-0.5 justify-items-center" style={{ width: '90px' }}>
      {/* Slot 1: Nurse */}
      <div className="w-7 h-7 flex items-center justify-center">
        {p.assignedNurse ? (
          <div className="relative">
            <span title={`Enf: ${p.assignedNurse}`} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold cursor-default">{nurseInitials}</span>
            {isNurse && p.assignedNurse === user.displayName && (
              <button onClick={() => handleUnassign('nurse')} title="Desasignar" className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover/assign:opacity-100">
                <X size={10} />
              </button>
            )}
          </div>
        ) : hasPrevNurse ? (
          <span title={`Enf. anterior: ${p.previousNurse}`} className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-teal-300 text-teal-300 text-xs font-bold cursor-default">{getInitials(p.previousNurse)}</span>
        ) : null}
      </div>
      {/* Slot 2: Doctor */}
      <div className="w-7 h-7 flex items-center justify-center">
        {p.assignedDoctor ? (
          <div className="relative">
            <span title={`Med: ${p.assignedDoctor}`} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold cursor-default">{doctorInitials}</span>
            {isDoctor && p.assignedDoctor === user.displayName && (
              <button onClick={() => handleUnassign('doctor')} title="Desasignar" className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover/assign:opacity-100">
                <X size={10} />
              </button>
            )}
          </div>
        ) : hasPrevDoctor ? (
          <span title={`Med. anterior: ${p.previousDoctor}`} className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-blue-300 text-blue-300 text-xs font-bold cursor-default">{getInitials(p.previousDoctor)}</span>
        ) : null}
      </div>
      {/* Slot 3: Assign action */}
      <div className="w-7 h-7 flex items-center justify-center">
        {showAssignBtn && (
          <button
            onClick={handleAssign}
            title="Asignarme"
            className="w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300 opacity-0 group-hover/assign:opacity-100 hover:border-blue-400 hover:text-blue-500 transition-all"
          ><Plus size={14} /></button>
        )}
      </div>
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

/** Get initials from a full name, e.g. "Javier Herrada" → "JH" */
function getInitials(name) {
  if (!name) return ''
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
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
  const [triagePatient, setTriagePatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [sortKey, setSortKey] = useState(saved.current?.sortKey ?? null)
  const [sortDir, setSortDir] = useState(saved.current?.sortDir ?? 'asc')
  const [filtersOpen, setFiltersOpen] = useState(saved.current?.filtersOpen ?? false)
  const [filterSpecialties, setFilterSpecialties] = useState(saved.current?.filterSpecialties ?? [])
  const [filterLevels, setFilterLevels] = useState(saved.current?.filterLevels ?? [])
  const [filterZones, setFilterZones] = useState(saved.current?.filterZones ?? [])
  const [filterNurse, setFilterNurse] = useState(saved.current?.filterNurse ?? null)
  const [filterDoctor, setFilterDoctor] = useState(saved.current?.filterDoctor ?? null)
  const [filterDate, setFilterDate] = useState(saved.current?.filterDate ?? null)
  const navigate = useNavigate()

  // Persist filter state to sessionStorage
  useEffect(() => {
    saveFilters({ search, sortKey, sortDir, filtersOpen, filterSpecialties, filterLevels, filterZones, filterNurse, filterDoctor, filterDate })
  }, [search, sortKey, sortDir, filtersOpen, filterSpecialties, filterLevels, filterZones, filterNurse, filterDoctor, filterDate])

  const activeFilterCount = filterSpecialties.length + filterLevels.length + filterZones.length + (filterNurse ? 1 : 0) + (filterDoctor ? 1 : 0) + (filterDate ? 1 : 0)

  const clearFilters = () => {
    setFilterSpecialties([])
    setFilterLevels([])
    setFilterZones([])
    setFilterNurse(null)
    setFilterDoctor(null)
    setFilterDate(null)
  }

  const toggleFilter = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  const [allNurses, setAllNurses] = useState([])
  const [allDoctors, setAllDoctors] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const refreshInterval = useRef(null)
  const [labNotifications, setLabNotifications] = useState(new Set()) // admissionIds with unseen lab updates
  const [labNotifByTest, setLabNotifByTest] = useState(new Set()) // labTestIds with unseen updates
  const [medNotifications, setMedNotifications] = useState(new Set()) // admissionIds with unseen med updates

  // Only show lab notification badges for patients assigned to the current user
  const showLabBadge = (patient) =>
    labNotifications.has(patient.admissionId) &&
    (patient.assignedNurse === user?.displayName || patient.assignedDoctor === user?.displayName)

  const showMedBadge = (patient) =>
    medNotifications.has(patient.admissionId) &&
    (patient.assignedNurse === user?.displayName || patient.assignedDoctor === user?.displayName)

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

  const fetchNotifications = async () => {
    if (!user?.username) return
    try {
      const { data } = await notificationApi.getUnseenLab(user.username)
      setLabNotifications(new Set(data.map(n => n.admissionId)))
      setLabNotifByTest(new Set(data.map(n => n.labTestId)))
    } catch { /* ignore */ }
    try {
      const { data } = await notificationApi.getUnseenMed(user.username)
      setMedNotifications(new Set(data.map(n => n.admissionId)))
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchPatients()
    fetchNotifications()
    getUsersByRole('Enfermería').then(setAllNurses).catch(() => {})
    getUsersByRole('Medicina').then(setAllDoctors).catch(() => {})

    // Mark notifications as seen when leaving the patient list
    return () => {
      if (user?.username) {
        notificationApi.markAllSeen(user.username).catch(() => {})
      }
    }
  }, [])

  // Auto-refresh every 30s when toggled on — immediate fetch on activation
  useEffect(() => {
    if (autoRefresh) {
      fetchPatients()
      refreshInterval.current = setInterval(fetchPatients, 30000)
    } else {
      clearInterval(refreshInterval.current)
    }
    return () => clearInterval(refreshInterval.current)
  }, [autoRefresh])

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
    // Nurse filter: '__none__' = sin enfermero, name = specific nurse
    if (filterNurse) {
      if (filterNurse === '__none__' && p.assignedNurse) return false
      if (filterNurse !== '__none__' && p.assignedNurse !== filterNurse) return false
    }
    // Doctor filter
    if (filterDoctor) {
      if (filterDoctor === '__none__' && p.assignedDoctor) return false
      if (filterDoctor !== '__none__' && p.assignedDoctor !== filterDoctor) return false
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

  const handleTriageConfirm = async ({ triageLevel, matCategory, location, specialty, suggestions, vitals }) => {
    const p = triagePatient
    if (!p) return
    try {
      // 1. Update triage data
      await patientApi.updateTriage(p.admissionId, { triageLevel, matCategory, location, specialty })
      setPatients(prev => prev.map(pt =>
        pt.admissionId === p.admissionId
          ? { ...pt, triageLevel, matCategory, location: location || pt.location, specialty: specialty || pt.specialty }
          : pt
      ))

      // 2. Save vitals if provided
      if (vitals) {
        try {
          await vitalsApi.create({
            admissionId: p.admissionId,
            heartRate: vitals.fc || null,
            systolicBp: vitals.tas || null,
            diastolicBp: vitals.tad || null,
            respiratoryRate: vitals.fr || null,
            temperature: vitals.temp || null,
            spo2: vitals.spo2 || null,
            recordedAt: new Date().toISOString(),
            recordedBy: user?.displayName || '',
          })
        } catch { /* continue */ }
      }

      // 3. Create suggested tests
      for (const s of suggestions) {
        try {
          if (s.type === 'ecg') {
            await ecgApi.create({ admissionId: p.admissionId, requestedBy: user?.displayName || '' })
          } else if (s.type === 'lab' && s.preset) {
            const preset = PRESETS.find(pr => pr.code === s.preset)
            if (preset) {
              const allParams = []
              const sampleTypes = []
              for (const [sampleType, codes] of Object.entries(preset.params)) {
                sampleTypes.push(sampleType)
                allParams.push(...codes)
              }
              await labTestApi.create({
                admissionId: p.admissionId,
                requestedBy: user?.displayName || '',
                category: sampleTypes.includes('cultivo') && sampleTypes.length === 1 ? 'cultivo' : 'analitica',
                sampleType: sampleTypes.join(','),
                label: preset.label,
                requestedParameters: JSON.stringify(allParams),
              })
            }
          } else if (s.type === 'radiology' && s.radiology) {
            await radiologyApi.create({
              admissionId: p.admissionId,
              requestedBy: user?.displayName || '',
              type: s.radiology.type,
              bodyRegion: s.radiology.bodyRegion,
              projection: s.radiology.projection,
              priority: 'normal',
            })
          }
        } catch { /* continue with other suggestions */ }
      }

      if (suggestions.length > 0) {
        toast.success(`Triaje completado — ${suggestions.length} prueba${suggestions.length !== 1 ? 's' : ''} solicitada${suggestions.length !== 1 ? 's' : ''}`)
      } else {
        toast.success('Triaje completado')
      }
      // Refresh to get updated icons
      fetchPatients()
    } catch {
      toast.error('Error al actualizar triaje')
    }
    setTriagePatient(null)
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:border-blue-500 outline-none" />
          </div>
          <button
            onClick={() => setAutoRefresh(prev => !prev)}
            title={autoRefresh ? 'Desactivar auto-refresco (30s)' : 'Activar auto-refresco (30s)'}
            className={`p-2 rounded-lg border transition-colors ${autoRefresh ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}
          >
            <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} style={autoRefresh ? { animationDuration: '3s' } : undefined} />
          </button>
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
          <div className="px-6 pb-4 space-y-3">
            {/* Row 1: Especialidad | Nivel | Zona */}
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">Especialidad</div>
                <div className="flex flex-wrap gap-1">
                  {SPECIALTIES.map(s => {
                    const active = filterSpecialties.includes(s)
                    return (
                      <button
                        key={s}
                        onClick={() => toggleFilter(filterSpecialties, setFilterSpecialties, s)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                          ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >{s}</button>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">Nivel</div>
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4, 5].map(n => {
                    const active = filterLevels.includes(n)
                    const colors = ['bg-red-600', 'bg-orange-600', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500']
                    return (
                      <button
                        key={n}
                        onClick={() => toggleFilter(filterLevels, setFilterLevels, n)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all
                          ${colors[n - 1]} ${active ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-40 hover:opacity-70'}`}
                      >{n}</button>
                    )
                  })}
                  <button
                    onClick={() => toggleFilter(filterLevels, setFilterLevels, 0)}
                    className={`h-7 px-2 rounded-full flex items-center justify-center text-xs font-medium border transition-all
                      ${filterLevels.includes(0) ? 'bg-slate-600 text-white border-slate-600 ring-2 ring-offset-1 ring-slate-400 scale-110' : 'bg-white text-slate-500 border-slate-300 opacity-60 hover:opacity-90'}`}
                  >∅</button>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">Zona</div>
                <div className="flex gap-1">
                  {['A', 'B', 'C'].map(z => {
                    const active = filterZones.includes(z)
                    return (
                      <button
                        key={z}
                        onClick={() => toggleFilter(filterZones, setFilterZones, z)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors
                          ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >{z}</button>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* Row 2: Enfermero/a | Médico | Ingreso | Clear */}
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">Enfermero/a</div>
                <div className="flex gap-1.5 items-center">
                  {user?.role === 'Enfermería' && (
                    <button
                      onClick={() => setFilterNurse(prev => prev === user.displayName ? null : user.displayName)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                        ${filterNurse === user.displayName ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-teal-600 border-teal-200 hover:border-teal-400'}`}
                    >Yo</button>
                  )}
                  <Select
                    value={filterNurse && filterNurse !== '__none__' && filterNurse !== user?.displayName ? filterNurse : ''}
                    onChange={(e) => setFilterNurse(e.target.value || null)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:border-blue-400 outline-none"
                  >
                    <option value="">Todos</option>
                    {allNurses.filter(n => n.displayName !== user?.displayName || user?.role !== 'Enfermería').map(n => (
                      <option key={n.id} value={n.displayName}>{n.displayName}</option>
                    ))}
                  </Select>
                  <button
                    onClick={() => setFilterNurse(prev => prev === '__none__' ? null : '__none__')}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                      ${filterNurse === '__none__' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                  >Sin enf.</button>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">Médico</div>
                <div className="flex gap-1.5 items-center">
                  {user?.role === 'Medicina' && (
                    <button
                      onClick={() => setFilterDoctor(prev => prev === user.displayName ? null : user.displayName)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                        ${filterDoctor === user.displayName ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'}`}
                    >Yo</button>
                  )}
                  <Select
                    value={filterDoctor && filterDoctor !== '__none__' && filterDoctor !== user?.displayName ? filterDoctor : ''}
                    onChange={(e) => setFilterDoctor(e.target.value || null)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:border-blue-400 outline-none"
                  >
                    <option value="">Todos</option>
                    {allDoctors.filter(n => n.displayName !== user?.displayName || user?.role !== 'Medicina').map(n => (
                      <option key={n.id} value={n.displayName}>{n.displayName}</option>
                    ))}
                  </Select>
                  <button
                    onClick={() => setFilterDoctor(prev => prev === '__none__' ? null : '__none__')}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                      ${filterDoctor === '__none__' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                  >Sin méd.</button>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">Ingreso</div>
                <div className="flex flex-wrap gap-1">
                  {DATE_FILTERS.map(f => {
                    const active = filterDate === f.key
                    return (
                      <button
                        key={f.key}
                        onClick={() => setFilterDate(prev => prev === f.key ? null : f.key)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
                          ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >{f.label}</button>
                    )
                  })}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 pb-0.5">
                  <X size={12} /> Limpiar
                </button>
              )}
            </div>
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
                  <th className="px-2 py-3 w-20 text-center">Asignado</th>
                  <th className="px-2 py-3 w-8 text-right"></th>
                  <th className="px-4 py-3 text-right cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort('ingreso')}>Ingreso{sortIndicator('ingreso')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, idx) => {
                  const isSelected = selectedId === p.id
                  const stripe = idx % 2 === 1 ? 'pm-stripe' : ''
                  return (
                    <tr
                      key={p.admissionId}
                      onClick={() => handleSelect(p.id)}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : `${stripe} hover:bg-slate-100/80`}`}
                    >
                      <td className="px-4 py-3 group/triage" onClick={(e) => { e.stopPropagation(); setTriagePatient(p) }}>
                        <div className="flex items-center justify-center">
                          {p.triageLevel ? (
                            <span className="cursor-pointer" title="Editar triaje">
                              <TriageBadge level={p.triageLevel} />
                            </span>
                          ) : (
                            <>
                              <span className="text-slate-300 group-hover/triage:hidden">—</span>
                              <button
                                className="w-7 h-7 rounded-full border border-dashed border-slate-300 items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all hidden group-hover/triage:flex"
                                title="Triar paciente"
                              ><Plus size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
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
                      <td className="px-2 py-3 group/assign" onClick={(e) => e.stopPropagation()}>
                        <AssignmentCell
                          patient={p}
                          user={user}
                          onUpdate={(updates) => setPatients(prev => prev.map(pt =>
                            pt.admissionId === p.admissionId ? { ...pt, ...updates } : pt
                          ))}
                          toast={toast}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {p.pendingLabs && p.pendingLabs.length > 0 ? (
                            <span title={buildPendingLabTooltip(p.pendingLabs)} data-testid="pending-lab-icon" className="relative">
                              <Syringe size={16} className="text-orange-500" />
                              {showLabBadge(p) && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" data-testid="lab-notif-badge" />
                              )}
                            </span>
                          ) : p.hasCompletedLabs ? (
                            <span title="Analíticas realizadas" data-testid="completed-lab-icon" className="relative">
                              <Syringe size={16} className="text-slate-300" />
                              {showLabBadge(p) && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" data-testid="lab-notif-badge" />
                              )}
                            </span>
                          ) : showLabBadge(p) && (
                            <span className="relative" data-testid="completed-lab-icon">
                              <Syringe size={16} className="text-slate-300" />
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" data-testid="lab-notif-badge" />
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
                          {p.hasPendingXray ? (
                            <span title="Radiografía pendiente" data-testid="pending-xray-icon">
                              <XRayIcon size={16} className="text-blue-500" />
                            </span>
                          ) : p.hasInProgressXray ? (
                            <span title="Radiografía en curso" data-testid="in-progress-xray-icon" className="animate-pulse">
                              <XRayIcon size={16} className="text-blue-500" />
                            </span>
                          ) : p.hasCompletedXray && (
                            <span title="Radiografía realizada" data-testid="completed-xray-icon">
                              <XRayIcon size={16} className="text-slate-300" />
                            </span>
                          )}
                          {p.hasPendingCt ? (
                            <span title="TAC pendiente" data-testid="pending-ct-icon">
                              <Radiation size={16} className="text-amber-500" />
                            </span>
                          ) : p.hasInProgressCt ? (
                            <span title="TAC en curso" data-testid="in-progress-ct-icon" className="animate-pulse">
                              <Radiation size={16} className="text-amber-500" />
                            </span>
                          ) : p.hasCompletedCt && (
                            <span title="TAC realizado" data-testid="completed-ct-icon">
                              <Radiation size={16} className="text-slate-300" />
                            </span>
                          )}
                          {p.hasPendingMri ? (
                            <span title="Resonancia pendiente" data-testid="pending-mri-icon">
                              <Magnet size={16} className="text-red-500" />
                            </span>
                          ) : p.hasInProgressMri ? (
                            <span title="Resonancia en curso" data-testid="in-progress-mri-icon" className="animate-pulse">
                              <Magnet size={16} className="text-red-500" />
                            </span>
                          ) : p.hasCompletedMri && (
                            <span title="Resonancia realizada" data-testid="completed-mri-icon">
                              <Magnet size={16} className="text-slate-300" />
                            </span>
                          )}
                          {p.hasPrescriptions && (
                            <span title="Medicación pautada" data-testid={showMedBadge(p) ? 'med-notif-icon' : 'med-icon'} className="relative">
                              <Pill size={16} className={showMedBadge(p) ? 'text-blue-500' : 'text-slate-300'} />
                              {showMedBadge(p) && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" data-testid="med-notif-badge" />
                              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => {
              const isSelected = selectedId === p.id
              return (
                <div
                  key={p.admissionId}
                  onClick={() => handleSelect(p.id)}
                  className={`bg-white rounded-xl shadow-sm p-3 cursor-pointer transition-shadow ${isSelected ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-md'}`}
                >
                  {/* Row 1: triage + name + location/specialty left, icons right */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setTriagePatient(p) }} title={p.triageLevel ? 'Editar triaje' : 'Triar paciente'}>
                        {p.triageLevel ? <TriageBadge level={p.triageLevel} /> : <span className="w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-500"><Plus size={14} /></span>}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{p.lastName}, {p.firstName}</div>
                        <div className="text-xs text-slate-500">{p.nhc} · {calcAge(p.birthDate) ?? '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.pendingLabs && p.pendingLabs.length > 0 ? (
                        <span title={buildPendingLabTooltip(p.pendingLabs)} data-testid="pending-lab-icon" className="relative">
                          <Syringe size={18} className="text-orange-500" />
                          {showLabBadge(p) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                          )}
                        </span>
                      ) : p.hasCompletedLabs ? (
                        <span title="Analíticas realizadas" data-testid="completed-lab-icon" className="relative">
                          <Syringe size={18} className="text-slate-300" />
                          {showLabBadge(p) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                          )}
                        </span>
                      ) : showLabBadge(p) && (
                        <span className="relative" data-testid="completed-lab-icon">
                          <Syringe size={18} className="text-slate-300" />
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                        </span>
                      )}
                      {p.hasPendingEcg ? (
                        <span title="ECG pendiente" data-testid="pending-ecg-icon">
                          <Activity size={18} className="text-red-500" />
                        </span>
                      ) : p.hasCompletedEcg && (
                        <span title={buildRecentEcgTooltip(p.recentEcgs)} data-testid="completed-ecg-icon">
                          <Activity size={18} className="text-slate-300" />
                        </span>
                      )}
                      {p.hasPendingXray ? (
                        <span title="Radiografía pendiente"><XRayIcon size={18} className="text-blue-500" /></span>
                      ) : p.hasInProgressXray ? (
                        <span title="Radiografía en curso" className="animate-pulse"><XRayIcon size={18} className="text-blue-500" /></span>
                      ) : p.hasCompletedXray && (
                        <span title="Radiografía realizada"><XRayIcon size={18} className="text-slate-300" /></span>
                      )}
                      {p.hasPendingCt ? (
                        <span title="TAC pendiente"><Radiation size={18} className="text-amber-500" /></span>
                      ) : p.hasInProgressCt ? (
                        <span title="TAC en curso" className="animate-pulse"><Radiation size={18} className="text-amber-500" /></span>
                      ) : p.hasCompletedCt && (
                        <span title="TAC realizado"><Radiation size={18} className="text-slate-300" /></span>
                      )}
                      {p.hasPendingMri ? (
                        <span title="Resonancia pendiente"><Magnet size={18} className="text-red-500" /></span>
                      ) : p.hasInProgressMri ? (
                        <span title="Resonancia en curso" className="animate-pulse"><Magnet size={18} className="text-red-500" /></span>
                      ) : p.hasCompletedMri && (
                        <span title="Resonancia realizada"><Magnet size={18} className="text-slate-300" /></span>
                      )}
                      {p.hasPrescriptions && (
                        <span title="Medicación pautada" className="relative">
                          <Pill size={18} className={showMedBadge(p) ? 'text-blue-500' : 'text-slate-300'} />
                          {showMedBadge(p) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: motivo + location/specialty left, observations right */}
                  <div className="flex items-start gap-3 mt-2">
                    <div className="flex-shrink-0">
                      <div className="text-xs text-slate-500 mb-1">{p.matCategory || 'Sin motivo'}</div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <InlineDropdown
                          value={p.location || ''}
                          options={LOCATIONS}
                          placeholder="Ubic."
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
                        <InlineDropdown
                          value={p.specialty || ''}
                          options={SPECIALTIES}
                          placeholder="Esp."
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
                      </div>
                    </div>
                    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        defaultValue={p.observations || ''}
                        placeholder="Observaciones..."
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
                        className="w-full bg-transparent text-xs text-slate-600 border-0 border-b border-slate-200 hover:border-slate-300 focus:border-violet-400 focus:outline-none px-0 py-0.5 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Row 3: assigned left, date right */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {p.assignedNurse && (
                        <span title={`Enf: ${p.assignedNurse}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">{getInitials(p.assignedNurse)}</span>
                      )}
                      {p.assignedDoctor && (
                        <span title={`Med: ${p.assignedDoctor}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">{getInitials(p.assignedDoctor)}</span>
                      )}
                      {!p.assignedNurse && p.previousNurse && (
                        <span title={`Enf. anterior: ${p.previousNurse}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-teal-300 text-teal-300 text-[10px] font-bold">{getInitials(p.previousNurse)}</span>
                      )}
                      {!p.assignedDoctor && p.previousDoctor && (
                        <span title={`Med. anterior: ${p.previousDoctor}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-blue-300 text-blue-300 text-[10px] font-bold">{getInitials(p.previousDoctor)}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(p.admissionDate)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-5 flex items-center gap-6 z-50">
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
      <TriageModal
        open={!!triagePatient}
        patient={triagePatient}
        locations={LOCATIONS}
        onClose={() => setTriagePatient(null)}
        onConfirm={handleTriageConfirm}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
