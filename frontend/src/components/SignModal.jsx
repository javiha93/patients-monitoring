import { useState } from 'react'
import { X } from 'lucide-react'

/**
 * InsulinSignModal — Only used for insulin prescriptions.
 * Regular medication is signed with a direct click (no modal).
 */
export function InsulinSignModal({ open, prescription, slot, onConfirm, onClose }) {
  const [glycemia, setGlycemia] = useState('')
  const [doseUI, setDoseUI] = useState('')
  const [signedBy, setSignedBy] = useState('')
  const [note, setNote] = useState('')

  if (!open || !prescription) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      prescriptionId: prescription.id,
      administeredAt: slot,
      doseGiven: doseUI,
      signedBy,
      note: `Glucemia: ${glycemia} mg/dL. ${note}`.trim(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Firmar insulina</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="bg-purple-50 rounded-lg p-2.5 mb-3">
          <div className="font-semibold text-xs text-purple-800">{prescription.name}</div>
          <div className="text-[11px] text-purple-600">{prescription.route} · {prescription.frequency}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-slate-600">Glucemia capilar (mg/dL)</label>
            <input type="number" value={glycemia} onChange={e => setGlycemia(e.target.value)}
              required autoFocus className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" placeholder="250" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Dosis (UI)</label>
            <input type="number" value={doseUI} onChange={e => setDoseUI(e.target.value)}
              required className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" placeholder="4" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Firmado por</label>
            <input value={signedBy} onChange={e => setSignedBy(e.target.value)}
              required className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" placeholder="Nombre" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Observaciones</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" placeholder="Opcional" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-slate-500">Cancelar</button>
            <button type="submit" className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700">Firmar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * EditAdminModal — Opened only from the pencil icon on hover.
 * Shows administration details, allows editing dose/note, and unsigning.
 */
export function EditAdminModal({ open, admin, prescription, onUpdate, onUnsign, onClose }) {
  const [doseGiven, setDoseGiven] = useState(admin?.doseGiven || '')
  const [note, setNote] = useState(admin?.note || '')

  if (!open || !admin) return null

  const fmtTime = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) +
      ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Editar administración</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="bg-green-50 rounded-lg p-2.5 mb-3">
          <div className="font-semibold text-xs text-green-800">{prescription?.name}</div>
          <div className="text-[11px] text-green-600">
            {admin.signedBy || '—'} · {fmtTime(admin.administeredAt)}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onUpdate(admin.id, { doseGiven, note }) }} className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-slate-600">Dosis</label>
            <div className="flex gap-1.5 mt-0.5">
              <input value={doseGiven} onChange={e => setDoseGiven(e.target.value)}
                className="flex-1 border rounded-lg px-2.5 py-1.5 text-sm" />
              <span className="flex items-center text-xs text-slate-400 px-1">{prescription?.unit}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Observaciones</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" />
          </div>
          <div className="flex justify-between pt-1">
            <button type="button"
              onClick={() => { if (confirm('¿Desfirmar esta administración?')) onUnsign(admin.id) }}
              className="text-red-500 text-xs font-medium hover:text-red-700">
              Desfirmar
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-slate-500">Cancelar</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
