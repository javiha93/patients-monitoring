import { useState, useEffect, useMemo } from 'react'
import { X, AlertTriangle } from 'lucide-react'

/**
 * Calculate dose from insulin scale based on glycemia value.
 * Returns the matching doseUi or null if no match.
 */
function calcDoseFromScale(insulinScales, glycemia) {
  if (!insulinScales || !glycemia) return null
  const g = parseInt(glycemia)
  if (isNaN(g)) return null
  const sorted = [...insulinScales].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  for (const s of sorted) {
    const min = s.glycemiaMin ?? -Infinity
    const max = s.glycemiaMax ?? Infinity
    if (g >= min && g <= max) return String(s.doseUi)
  }
  return null
}

/**
 * Find the most recent glucose reading from vitals.
 * Returns { value, recordedAt, isStale } or null.
 */
function getLatestGlucose(vitals) {
  if (!vitals || vitals.length === 0) return null
  const withGlucose = vitals
    .filter(v => v.bloodGlucose != null)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
  if (withGlucose.length === 0) return null
  const latest = withGlucose[0]
  const ageMs = Date.now() - new Date(latest.recordedAt).getTime()
  const isStale = ageMs > 2 * 60 * 60 * 1000 // > 2 hours
  return { value: latest.bloodGlucose, recordedAt: latest.recordedAt, isStale }
}

/**
 * InsulinSignModal — Only used for insulin prescriptions.
 * Auto-reads glucose from vitals, auto-calculates dose from scale,
 * auto-fills current user. All fields remain editable.
 */
export function InsulinSignModal({ open, prescription, slot, vitals, currentUser, onConfirm, onClose }) {
  const latestGlucose = useMemo(() => getLatestGlucose(vitals), [vitals])

  const [doseUI, setDoseUI] = useState('')
  const [signedBy, setSignedBy] = useState('')
  const [note, setNote] = useState('')

  const hasGlucose = latestGlucose != null
  const glycemia = latestGlucose?.value ?? null

  // Auto-calculate dose from insulin scale whenever glycemia or scales change
  const suggestedDose = useMemo(() => {
    if (!glycemia || !prescription?.insulinScales?.length) return null
    return calcDoseFromScale(prescription.insulinScales, glycemia)
  }, [glycemia, prescription])

  // Reset fields when modal opens with new data
  useEffect(() => {
    if (open) {
      setSignedBy(currentUser || '')
      setNote('')
      setDoseUI(suggestedDose != null ? suggestedDose : '')
    }
  }, [open, suggestedDose, currentUser])

  if (!open || !prescription) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!hasGlucose) return
    onConfirm({
      prescriptionId: prescription.id,
      administeredAt: slot,
      doseGiven: doseUI,
      signedBy,
      note: `Glucemia: ${glycemia} mg/dL. ${note}`.trim(),
    })
  }

  const fmtTime = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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

        {!hasGlucose && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-1 flex items-start gap-2" data-testid="glucose-alert">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-red-700">No hay registro de glucemia</div>
              <div className="text-[11px] text-red-600 mt-0.5">
                Debe registrar la glucemia capilar en la sección de <span className="font-semibold">Registros</span> antes de administrar insulina.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-slate-600">Glucemia capilar (mg/dL)</label>
            {hasGlucose ? (
              <>
                <div className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5 bg-slate-50 text-slate-700" data-testid="glucose-value">
                  {glycemia}
                </div>
                {!latestGlucose.isStale && (
                  <div className="text-[10px] text-green-600 mt-0.5" data-testid="glucose-fresh">
                    Lectura de las {fmtTime(latestGlucose.recordedAt)}
                  </div>
                )}
                {latestGlucose.isStale && (
                  <div className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1" data-testid="glucose-stale">
                    <AlertTriangle size={10} />
                    Lectura de hace más de 2h ({fmtTime(latestGlucose.recordedAt)}) — considere tomar nueva glucemia
                  </div>
                )}
              </>
            ) : (
              <div className="w-full border border-red-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 bg-red-50 text-red-400" data-testid="glucose-missing">
                — Sin registro —
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Dosis (UI)</label>
            <input type="number" value={doseUI} onChange={e => setDoseUI(e.target.value)}
              required className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" placeholder="4" />
            {suggestedDose != null && (
              <div className="text-[10px] text-slate-500 mt-0.5" data-testid="dose-suggestion">
                Según pauta: {suggestedDose} UI
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Firmado por</label>
            <input value={signedBy} onChange={e => setSignedBy(e.target.value)}
              required className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5 bg-slate-50" readOnly />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600">Observaciones</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-lg px-2.5 py-1.5 text-sm mt-0.5" placeholder="Opcional" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-slate-500">Cancelar</button>
            <button type="submit" disabled={!hasGlucose}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium ${hasGlucose ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Firmar
            </button>
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
