import { useState } from 'react'
import { X } from 'lucide-react'

const triageLevels = [
  { value: 1, label: 'Nivel 1 — Resucitación', color: 'bg-red-600' },
  { value: 2, label: 'Nivel 2 — Emergencia', color: 'bg-orange-600' },
  { value: 3, label: 'Nivel 3 — Urgente', color: 'bg-yellow-500' },
  { value: 4, label: 'Nivel 4 — Menos urgente', color: 'bg-green-500' },
  { value: 5, label: 'Nivel 5 — No urgente', color: 'bg-blue-500' },
]

const matCategories = [
  'Dolor torácico', 'Disnea', 'Dolor abdominal', 'Cefalea',
  'Traumatismo', 'Síncope', 'Fiebre', 'Otros',
]

export default function NewPatientModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    nhc: '', firstName: '', lastName: '', birthDate: '',
    sex: 'undefined', triageLevel: 3, matCategory: '',
  })

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      triageLevel: parseInt(form.triageLevel),
      birthDate: form.birthDate || null,
    })
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold">Abrir nueva ficha</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Datos del paciente</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">NHC <span className="text-red-500">*</span></label>
            <input required value={form.nhc} onChange={set('nhc')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none" placeholder="NHC-000000" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Sexo <span className="text-red-500">*</span></label>
            <select value={form.sex} onChange={set('sex')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none">
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="undefined">No especificado</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Nombre <span className="text-red-500">*</span></label>
            <input required value={form.firstName} onChange={set('firstName')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Apellidos <span className="text-red-500">*</span></label>
            <input required value={form.lastName} onChange={set('lastName')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-slate-600">Fecha de nacimiento</label>
          <input type="date" value={form.birthDate} onChange={set('birthDate')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none w-1/2" />
        </div>

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
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-slate-600">Motivo de consulta</label>
          <select value={form.matCategory} onChange={set('matCategory')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            {matCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600">Abrir ficha</button>
        </div>
      </form>
    </div>
  )
}
