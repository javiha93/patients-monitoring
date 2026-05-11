import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, Pencil, X } from 'lucide-react'
import { deviceApi } from '../services/deviceApi'
import ConfirmModal from './ConfirmModal'

/* ── Constants ── */

export const CATEGORIES = {
  vascular: {
    label: 'Dispositivos de Acceso Vascular',
    color: 'red',
    types: [
      { value: 'via_periferica', label: 'Vía Periférica' },
      { value: 'via_central', label: 'Vía Venosa Central' },
      { value: 'picc', label: 'PICC' },
      { value: 'linea_arterial', label: 'Línea Arterial' },
    ],
  },
  gastrointestinal: {
    label: 'Dispositivos Gastrointestinales',
    color: 'amber',
    types: [
      { value: 'sng', label: 'Sonda Nasogástrica' },
    ],
  },
  elimination: {
    label: 'Dispositivos de Eliminación',
    color: 'sky',
    types: [
      { value: 'sonda_vesical', label: 'Sonda Vesical' },
    ],
  },
}

export const VVP_LOCATIONS = [
  { value: 'plexo_derecho', label: 'Plexo derecho' },
  { value: 'plexo_izquierdo', label: 'Plexo izquierdo' },
  { value: 'mano_derecha', label: 'Mano derecha' },
  { value: 'mano_izquierda', label: 'Mano izquierda' },
  { value: 'brazo_derecho', label: 'Brazo derecho' },
  { value: 'brazo_izquierdo', label: 'Brazo izquierdo' },
]

export const VVP_GAUGES = ['14G', '16G', '18G', '20G', '22G', '24G']
export const SNG_GAUGES = ['8Fr', '10Fr', '12Fr', '14Fr', '16Fr', '18Fr']
export const SV_GAUGES = ['10Fr', '12Fr', '14Fr', '16Fr', '18Fr', '20Fr', '22Fr', '24Fr']
export const SV_LUMENS = [1, 2, 3]

function toLocalISOString() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

/* ── Device Form Modal ── */

export function DeviceFormModal({ open, form, set, category, onSubmit, onCancel, saving, editing }) {
  if (!open || !category) return null

  const cat = CATEGORIES[category]
  const showTypeSelect = cat.types.length > 1

  const showGauge = ['via_periferica', 'sng', 'sonda_vesical'].includes(form.type)
  const showLocation = form.type === 'via_periferica'
  const showLumens = form.type === 'sonda_vesical'

  const gaugeOptions = form.type === 'via_periferica' ? VVP_GAUGES
    : form.type === 'sng' ? SNG_GAUGES
    : form.type === 'sonda_vesical' ? SV_GAUGES : []

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onCancel()}>
      <form onSubmit={onSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">{editing ? 'Editar dispositivo' : 'Nuevo dispositivo'}</h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {showTypeSelect && (
              <div>
                <label className="text-[11px] font-medium text-slate-600">Tipo</label>
                <select value={form.type || ''} onChange={e => set('type', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mt-0.5">
                  {cat.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}

            {showGauge && (
              <div>
                <label className="text-[11px] font-medium text-slate-600">Calibre</label>
                <select value={form.gauge || ''} onChange={e => set('gauge', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mt-0.5">
                  <option value="">Seleccionar...</option>
                  {gaugeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}

            {showLocation && (
              <div>
                <label className="text-[11px] font-medium text-slate-600">Localización</label>
                <select value={form.location || ''} onChange={e => set('location', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mt-0.5">
                  <option value="">Seleccionar...</option>
                  {VVP_LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            )}

            {showLumens && (
              <div>
                <label className="text-[11px] font-medium text-slate-600">Luces</label>
                <select value={form.lumens || ''} onChange={e => set('lumens', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mt-0.5">
                  <option value="">Seleccionar...</option>
                  {SV_LUMENS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600">Observaciones</label>
            <input type="text" value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              placeholder="Opcional" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm mt-0.5" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
          <button type="submit" disabled={saving}
            className="bg-sky-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50">
            {saving ? 'Guardando...' : editing ? 'Guardar' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Main Component ── */

const DevicesTab = forwardRef(function DevicesTab({ admissionId, toast }, ref) {
  const [devices, setDevices] = useState([])
  const [modalCategory, setModalCategory] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchDevices = async () => {
    try {
      const { data } = await deviceApi.getByAdmission(admissionId)
      setDevices(data)
    } catch { /* ignore */ }
  }

  useEffect(() => { if (admissionId) fetchDevices() }, [admissionId])

  // Expose methods for external callers (e.g. vitals modal prompting to add sonda vesical)
  useImperativeHandle(ref, () => ({
    openNewSondaVesical: () => {
      setForm({ category: 'elimination', type: 'sonda_vesical' })
      setModalCategory('elimination')
      setEditingId(null)
    },
    hasActiveSondaVesical: () => devices.some(d => d.type === 'sonda_vesical' && !d.removedAt),
    refresh: fetchDevices,
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await deviceApi.update(editingId, form)
      } else {
        await deviceApi.create({ ...form, admissionId, insertedAt: form.insertedAt || toLocalISOString() })
      }
      toast.success(editingId ? 'Dispositivo actualizado' : 'Dispositivo registrado')
      closeModal()
      fetchDevices()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error guardando dispositivo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deviceApi.delete(id)
      toast.success('Dispositivo eliminado')
      fetchDevices()
    } catch {
      toast.error('Error eliminando dispositivo')
    }
  }

  const handleRemove = async (id) => {
    try {
      const device = devices.find(d => d.id === id)
      await deviceApi.update(id, { ...device, removedAt: toLocalISOString() })
      toast.success('Dispositivo retirado')
      fetchDevices()
    } catch {
      toast.error('Error retirando dispositivo')
    }
  }

  const openNewForm = (category) => {
    const cat = CATEGORIES[category]
    setForm({ category, type: cat.types[0].value })
    setModalCategory(category)
    setEditingId(null)
  }

  const openEditForm = (device) => {
    setForm({ ...device })
    setModalCategory(device.category)
    setEditingId(device.id)
  }

  const closeModal = () => {
    setModalCategory(null)
    setEditingId(null)
    setForm({})
  }

  const devicesByCategory = (cat) => devices.filter(d => d.category === cat)

  return (
    <div className="space-y-6">
      {Object.entries(CATEGORIES).map(([catKey, cat]) => {
        const catDevices = devicesByCategory(catKey)
        const active = catDevices.filter(d => !d.removedAt)
        const removed = catDevices.filter(d => d.removedAt)

        return (
          <CategorySection key={catKey} label={cat.label} color={cat.color} count={active.length}>
            <button onClick={() => openNewForm(catKey)}
              className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 mb-3">
              <Plus size={15} /> Añadir {cat.types.length === 1 ? cat.types[0].label.toLowerCase() : 'dispositivo'}
            </button>

            {active.map(d => (
              <DeviceCard key={d.id} device={d}
                onEdit={() => openEditForm(d)}
                onRemove={() => handleRemove(d.id)}
                onDelete={() => setConfirmDelete(d.id)}
              />
            ))}

            {removed.length > 0 && (
              <RemovedSection devices={removed} />
            )}

            {active.length === 0 && removed.length === 0 && (
              <p className="text-slate-400 text-sm">Sin dispositivos registrados</p>
            )}
          </CategorySection>
        )
      })}

      <DeviceFormModal
        open={modalCategory != null}
        form={form}
        set={(field, val) => setForm(prev => ({ ...prev, [field]: val }))}
        category={modalCategory}
        onSubmit={handleSubmit}
        onCancel={closeModal}
        saving={saving}
        editing={!!editingId}
      />

      <ConfirmModal
        open={confirmDelete != null}
        message="¿Eliminar este dispositivo del registro?"
        onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null) }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
})

export default DevicesTab

/* ── Category Section ── */

function CategorySection({ label, color, count, children }) {
  const colors = {
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    sky: 'border-sky-200 bg-sky-50',
  }
  const headerColors = {
    red: 'text-red-800',
    amber: 'text-amber-800',
    sky: 'text-sky-800',
  }

  return (
    <div className={`rounded-xl border ${colors[color] || 'border-slate-200 bg-slate-50'} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${headerColors[color] || 'text-slate-800'}`}>{label}</h3>
        {count > 0 && (
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full">{count} activo{count !== 1 ? 's' : ''}</span>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Device Card ── */

const TYPE_LABELS = {
  via_periferica: 'Vía Periférica',
  via_central: 'Vía Venosa Central',
  picc: 'PICC',
  linea_arterial: 'Línea Arterial',
  sng: 'Sonda Nasogástrica',
  sonda_vesical: 'Sonda Vesical',
}

const LOCATION_LABELS = {
  plexo_derecho: 'Plexo dcho.',
  plexo_izquierdo: 'Plexo izq.',
  mano_derecha: 'Mano dcha.',
  mano_izquierda: 'Mano izq.',
  brazo_derecho: 'Brazo dcho.',
  brazo_izquierdo: 'Brazo izq.',
}

function DeviceCard({ device, onEdit, onRemove, onDelete }) {
  const d = device
  const isActive = !d.removedAt

  return (
    <div className={`bg-white rounded-lg border ${isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'} p-3 mb-2 group`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
          <span className="text-sm font-semibold text-slate-800">{TYPE_LABELS[d.type] || d.type}</span>
          {d.gauge && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{d.gauge}</span>}
          {d.location && <span className="text-xs text-slate-500">{LOCATION_LABELS[d.location] || d.location}</span>}
          {d.lumens && <span className="text-xs text-slate-500">{d.lumens} {d.lumens === 1 ? 'luz' : 'luces'}</span>}
        </div>
        {isActive && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1 text-slate-400 hover:text-sky-600" title="Editar">
              <Pencil size={14} />
            </button>
            <button onClick={onRemove} className="text-xs text-amber-600 hover:text-amber-700 font-medium px-2">Retirar</button>
            <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-600" title="Eliminar">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock size={11} /> {formatDateTime(d.insertedAt)}</span>
        {d.removedAt && <span>→ Retirado: {formatDateTime(d.removedAt)}</span>}
        {d.notes && <span className="text-slate-400">· {d.notes}</span>}
      </div>
    </div>
  )
}

/* ── Removed Section (collapsible) ── */

function RemovedSection({ devices }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium">
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {devices.length} retirado{devices.length !== 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-1">
          {devices.map(d => <DeviceCard key={d.id} device={d} />)}
        </div>
      )}
    </div>
  )
}
