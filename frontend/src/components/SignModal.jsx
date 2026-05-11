import { useState } from 'react'
import { X, Syringe, AlertTriangle } from 'lucide-react'

/**
 * Modal for signing an administration.
 * For insulin prescriptions, shows glycemia input and scale lookup.
 */
export function SignModal({ open, prescription, slot, insulinScale, onConfirm, onClose }) {
  const [doseGiven, setDoseGiven] = useState(prescription?.amount || '')
  const [glycemia, setGlycemia] = useState('')
  const [signedBy, setSignedBy] = useState('')
  const [note, setNote] = useState('')

  if (!open || !prescription) return null

  const isInsulin = prescription.category === 'insulin'

  // Lookup dose from insulin scale based on glycemia value
  const scaleDose = (() => {
    if (!isInsulin || !insulinScale?.ranges || !glycemia) return null
    const g = parseInt(glycemia)
    if (isNaN(g)) return null
    const match = insulinScale.ranges.find(r => g >= r.minGlycemia && g <= r.maxGlycemia)
    return match ? match.dose : null
  })()

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      prescriptionId: prescription.id,
      administeredAt: slot,
      doseGiven: isInsulin && scaleDose != null ? String(scaleDose) : doseGiven,
      signedBy,
      note: isInsulin ? `Glucemia: ${glycemia} mg/dL. ${note}`.trim() : note,
      glycemiaValue: isInsulin ? parseInt(glycemia) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">
            {isInsulin ? 'Firmar insulina' : 'Firmar administración'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="font-semibold text-sm">{prescription.name}</div>
          <div className="text-xs text-slate-500">
            {prescription.amount} {prescription.unit} · {prescription.route} · {prescription.frequency}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isInsulin ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600">Glucemia capilar (mg/dL)</label>
                <input
                  type="number" value={glycemia} onChange={e => setGlycemia(e.target.value)}
                  required autoFocus
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Ej: 250"
                />
              </div>
              {scaleDose != null && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
                  <Syringe size={16} className="text-purple-600" />
                  <div>
                    <div className="text-sm font-semibold text-purple-800">Dosis según escala: {scaleDose} UI</div>
                    <div className="text-xs text-purple-600">Glucemia {glycemia} mg/dL</div>
                  </div>
                </div>
              )}
              {glycemia && scaleDose == null && parseInt(glycemia) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <div className="text-xs text-amber-700">
                    Glucemia fuera de rango de la escala. Consultar con médico.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-600">Dosis administrada</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={doseGiven} onChange={e => setDoseGiven(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <span className="flex items-center text-sm text-slate-500 px-2">{prescription.unit}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600">Firmado por</label>
            <input
              value={signedBy} onChange={e => setSignedBy(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="Nombre del profesional"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Observaciones</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none"
              rows={2} placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancelar</button>
            <button
              type="submit"
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Firmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Modal for editing/viewing an existing administration.
 * Allows editing dose, note, and unsigning.
 */
export function EditAdminModal({ open, admin, prescription, onUpdate, onUnsign, onClose }) {
  const [doseGiven, setDoseGiven] = useState(admin?.doseGiven || '')
  const [note, setNote] = useState(admin?.note || '')

  if (!open || !admin) return null

  const handleUpdate = (e) => {
    e.preventDefault()
    onUpdate(admin.id, { doseGiven, note })
  }

  const fmtTime = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) +
      ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">Administración registrada</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="font-semibold text-sm text-green-800">{prescription?.name}</div>
          <div className="text-xs text-green-600">
            Firmado por {admin.signedBy || '—'} · {fmtTime(admin.administeredAt)}
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Dosis administrada</label>
            <div className="flex gap-2 mt-1">
              <input
                value={doseGiven} onChange={e => setDoseGiven(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <span className="flex items-center text-sm text-slate-500 px-2">{prescription?.unit}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Observaciones</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => { if (confirm('¿Desfirmar esta administración?')) onUnsign(admin.id) }}
              className="text-red-600 text-sm font-medium hover:text-red-800"
            >
              Desfirmar
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cerrar</button>
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
