import { useState } from 'react'
import { X } from 'lucide-react'

const TRANSPORT_TYPES = [
  { key: 'silla', label: 'Silla' },
  { key: 'camilla', label: 'Camilla' },
  { key: 'cama', label: 'Cama' },
]

export default function TransferModal({ open, patient, onClose, onConfirm }) {
  const [transportType, setTransportType] = useState('')
  const [respiratorySupport, setRespiratorySupport] = useState(false)
  const [monitoringRequired, setMonitoringRequired] = useState(false)
  const [ivPoleRequired, setIvPoleRequired] = useState(false)

  if (!open || !patient) return null

  const canConfirm = !!transportType

  const handleConfirm = () => {
    onConfirm({
      admissionId: patient.admissionId,
      transportType,
      respiratorySupport,
      monitoringRequired,
      ivPoleRequired,
    })
    // Reset form
    setTransportType('')
    setRespiratorySupport(false)
    setMonitoringRequired(false)
    setIvPoleRequired(false)
  }

  const handleClose = () => {
    setTransportType('')
    setRespiratorySupport(false)
    setMonitoringRequired(false)
    setIvPoleRequired(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Solicitar traslado</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Patient info */}
          <div className="text-sm text-slate-500">
            {patient.lastName}, {patient.firstName} · Cama <span className="font-semibold text-blue-600">{patient.bedNumber}</span>
          </div>

          {/* Transport type */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipo de traslado *</div>
            <div className="flex gap-2">
              {TRANSPORT_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTransportType(t.key)}
                  data-testid={`transport-${t.key}`}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    transportType === t.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >{t.label}</button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={respiratorySupport}
                onChange={e => setRespiratorySupport(e.target.checked)}
                className="rounded border-slate-300 text-blue-500 focus:ring-blue-400 w-4 h-4"
                data-testid="respiratory-support"
              />
              <span className="text-sm text-slate-700">Soporte respiratorio</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={monitoringRequired}
                onChange={e => setMonitoringRequired(e.target.checked)}
                className="rounded border-slate-300 text-blue-500 focus:ring-blue-400 w-4 h-4"
                data-testid="monitoring-required"
              />
              <span className="text-sm text-slate-700">Monitorización para subir</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ivPoleRequired}
                onChange={e => setIvPoleRequired(e.target.checked)}
                className="rounded border-slate-300 text-blue-500 focus:ring-blue-400 w-4 h-4"
                data-testid="iv-pole-required"
              />
              <span className="text-sm text-slate-700">Palo para bomba</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            data-testid="confirm-transfer"
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              canConfirm
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >Solicitar traslado</button>
        </div>
      </div>
    </div>
  )
}
