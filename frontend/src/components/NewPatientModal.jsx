import { useState } from 'react'
import { X, Search, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import DatePicker from './DatePicker'

const matCategories = [
  'Dolor torácico', 'Disnea', 'Dolor abdominal', 'Cefalea',
  'Traumatismo', 'Síncope', 'Fiebre', 'Otros',
]

const specialties = [
  'Medicina', 'Traumatología', 'Cirugía', 'Ginecología', 'Pediatría', 'Oftalmología',
]

const triageLevels = [
  { value: 1, label: 'Nivel 1 — Resucitación', color: 'bg-red-600' },
  { value: 2, label: 'Nivel 2 — Emergencia', color: 'bg-orange-600' },
  { value: 3, label: 'Nivel 3 — Urgente', color: 'bg-yellow-500' },
  { value: 4, label: 'Nivel 4 — Menos urgente', color: 'bg-green-500' },
  { value: 5, label: 'Nivel 5 — No urgente', color: 'bg-blue-500' },
]

export default function NewPatientModal({ open, onClose, onSubmit, isAdmin = false }) {
  const [form, setForm] = useState({
    nhc: '', firstName: '', lastName: '', birthDate: '',
    sex: 'undefined', triageLevel: 3, matCategory: '', location: '', specialty: '',
  })
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)

  if (!open) return null

  const resetForm = () => {
    setForm({
      nhc: '', firstName: '', lastName: '', birthDate: '',
      sex: 'undefined', triageLevel: 3, matCategory: '', location: '', specialty: '',
    })
    setSearchResult(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSearchNhc = async () => {
    if (!form.nhc.trim()) return
    setSearching(true)
    setSearchResult(null)
    try {
      const { data } = await patientApi.searchByNhc(form.nhc.trim())
      setSearchResult(data)
      if (data.status === 'inactive') {
        setForm(f => ({ ...f, firstName: data.firstName, lastName: data.lastName }))
      }
    } catch {
      setSearchResult({ status: 'error' })
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isAdmin && searchResult?.status === 'inactive') {
      try {
        await patientApi.reopen(searchResult.patientId, {})
        resetForm()
        onSubmit(null, true)
      } catch (err) {
        setSearchResult({ status: 'error', message: err.response?.data?.error || 'Error al reabrir' })
      }
    } else {
      if (!form.birthDate) return
      onSubmit({
        ...form,
        triageLevel: isAdmin ? null : parseInt(form.triageLevel),
        birthDate: form.birthDate,
      })
      resetForm()
    }
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const isReopen = isAdmin && searchResult?.status === 'inactive'
  const isActive = searchResult?.status === 'active'
  const isNotFound = searchResult?.status === 'not_found'

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold">Abrir nueva ficha</h3>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Datos del paciente</div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">NHC <span className="text-red-500">*</span></label>
            <div className="flex gap-1">
              <input
                required
                value={form.nhc}
                onChange={(e) => { setForm({ ...form, nhc: e.target.value }); setSearchResult(null) }}
                className="flex-1 px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none"
                placeholder="NHC-000000"
                onKeyDown={(e) => { if (isAdmin && e.key === 'Enter') { e.preventDefault(); handleSearchNhc() } }}
              />
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleSearchNhc}
                  disabled={!form.nhc.trim() || searching}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Buscar paciente por NHC"
                >
                  <Search size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Sexo <span className="text-red-500">*</span></label>
            <select value={form.sex} onChange={set('sex')} disabled={isReopen} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none disabled:bg-slate-50">
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="undefined">No especificado</option>
            </select>
          </div>
        </div>

        {isAdmin && searchResult && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-3 ${
            isActive ? 'bg-red-50 text-red-700' :
            isReopen ? 'bg-green-50 text-green-700' :
            isNotFound ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
          }`}>
            {isActive && <><AlertTriangle size={16} /> El paciente <strong>{searchResult.lastName}, {searchResult.firstName}</strong> ya tiene un ingreso activo</>}
            {isReopen && <><CheckCircle2 size={16} /> Paciente encontrado: <strong>{searchResult.lastName}, {searchResult.firstName}</strong> — se reabrirá ingreso</>}
            {isNotFound && <><Info size={16} /> No existe en la base de datos — se creará paciente nuevo</>}
            {searchResult.status === 'error' && <><AlertTriangle size={16} /> {searchResult.message || 'Error al buscar'}</>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Nombre <span className="text-red-500">*</span></label>
            <input required={!isReopen} value={form.firstName} onChange={set('firstName')} disabled={isReopen}
              className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Apellidos <span className="text-red-500">*</span></label>
            <input required={!isReopen} value={form.lastName} onChange={set('lastName')} disabled={isReopen}
              className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none disabled:bg-slate-50" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-slate-600">Fecha de nacimiento <span className="text-red-500">*</span></label>
          <div className="w-1/2">
            <DatePicker
              value={form.birthDate}
              onChange={(iso) => setForm(f => ({ ...f, birthDate: iso || '' }))}
              disabled={isReopen}
            />
          </div>
        </div>

        {!isAdmin && (
          <>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Triaje</div>
            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-medium text-slate-600">Nivel de triaje <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {triageLevels.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, triageLevel: t.value })}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all ${t.color} ${form.triageLevel === t.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-50'}`}
                  >
                    {t.value}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Motivo de consulta</label>
                <select value={form.matCategory} onChange={set('matCategory')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none">
                  <option value="">Seleccionar...</option>
                  {matCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Especialidad</label>
                <select value={form.specialty} onChange={set('specialty')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none">
                  <option value="">Seleccionar...</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs font-medium text-slate-600">Ubicación (cama)</label>
              <input value={form.location} onChange={set('location')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none w-1/2" placeholder="B1, B2..." />
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={handleClose} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button
            type="submit"
            disabled={isActive || searching || (!isReopen && !form.birthDate)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isReopen ? 'Reabrir ingreso' : 'Abrir ficha'}
          </button>
        </div>
      </form>
    </div>
  )
}
