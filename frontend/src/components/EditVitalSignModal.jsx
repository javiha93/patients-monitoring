import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const devices = [
  { value: '', label: 'Sin soporte' },
  { value: 'nasal_cannula', label: 'Gafas nasales' },
  { value: 'ventimax', label: 'Ventimax' },
  { value: 'reservoir_mask', label: 'Mascarilla con reservorio' },
  { value: 'cpap', label: 'CPAP' },
  { value: 'bipap', label: 'BiPAP' },
  { value: 'high_flow_cannula', label: 'Cánula de alto flujo (OAF)' },
  { value: 'mechanical_ventilation', label: 'Ventilación mecánica' },
]

function toLocalInput(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function EditVitalSignModal({ open, onClose, onSubmit, vitalSign, patientName }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (open && vitalSign) {
      const rs = vitalSign.respiratorySupport
      setForm({
        recordedAt: toLocalInput(vitalSign.recordedAt),
        systolicBp: vitalSign.systolicBp ?? '',
        diastolicBp: vitalSign.diastolicBp ?? '',
        heartRate: vitalSign.heartRate ?? '',
        spo2: vitalSign.spo2 ?? '',
        respiratoryRate: vitalSign.respiratoryRate ?? '',
        temperature: vitalSign.temperature ?? '',
        painLevel: vitalSign.painLevel ?? '',
        bloodGlucose: vitalSign.bloodGlucose ?? '',
        diuresis: vitalSign.diuresis ?? '',
        consciousnessLevel: vitalSign.consciousnessLevel || 'alerta',
        notes: vitalSign.notes || '',
        deviceType: rs?.deviceType || '',
        flowRate: rs?.flowRate ?? '',
        fio2: rs?.fio2 ?? '',
        peep: rs?.peep ?? '',
        ipap: rs?.ipap ?? '',
        epap: rs?.epap ?? '',
        tidalVolume: rs?.tidalVolume ?? '',
        respiratoryRateSet: rs?.respiratoryRateSet ?? '',
      })
    }
  }, [open, vitalSign])

  if (!open || !vitalSign) return null

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      admissionId: vitalSign.admissionId,
      recordedAt: form.recordedAt + ':00',
      systolicBp: parseInt(form.systolicBp),
      diastolicBp: parseInt(form.diastolicBp),
      heartRate: parseInt(form.heartRate),
      spo2: parseInt(form.spo2),
      respiratoryRate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      painLevel: form.painLevel ? parseInt(form.painLevel) : null,
      bloodGlucose: form.bloodGlucose ? parseInt(form.bloodGlucose) : null,
      diuresis: form.diuresis ? parseInt(form.diuresis) : null,
      consciousnessLevel: form.consciousnessLevel || null,
      notes: form.notes || null,
      deviceType: form.deviceType || null,
      flowRate: form.flowRate ? parseFloat(form.flowRate) : null,
      fio2: form.fio2 ? parseFloat(form.fio2) : null,
      peep: form.peep ? parseFloat(form.peep) : null,
      ipap: form.ipap ? parseFloat(form.ipap) : null,
      epap: form.epap ? parseFloat(form.epap) : null,
      tidalVolume: form.tidalVolume ? parseFloat(form.tidalVolume) : null,
      respiratoryRateSet: form.respiratoryRateSet ? parseInt(form.respiratoryRateSet) : null,
    }
    onSubmit(vitalSign.id, data)
  }

  const device = form.deviceType

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Editar registro de constantes</h3>
            <p className="text-sm text-slate-500">{patientName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha y hora</label>
            <input type="datetime-local" value={form.recordedAt} onChange={set('recordedAt')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Constantes vitales</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">TAS (mmHg)</label>
            <input type="number" value={form.systolicBp} onChange={set('systolicBp')} placeholder="120" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">TAD (mmHg)</label>
            <input type="number" value={form.diastolicBp} onChange={set('diastolicBp')} placeholder="80" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">FC (bpm)</label>
            <input type="number" value={form.heartRate} onChange={set('heartRate')} placeholder="80" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">SpO2 (%)</label>
            <input type="number" value={form.spo2} onChange={set('spo2')} placeholder="98" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">FR (rpm)</label>
            <input type="number" value={form.respiratoryRate} onChange={set('respiratoryRate')} placeholder="16" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Tª (°C)</label>
            <input type="number" step="0.1" value={form.temperature} onChange={set('temperature')} placeholder="36.5" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Dolor (0-10)</label>
            <input type="number" min="0" max="10" value={form.painLevel} onChange={set('painLevel')} placeholder="0" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Otros registros</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Glucemia capilar (mg/dL)</label>
            <input type="number" value={form.bloodGlucose} onChange={set('bloodGlucose')} placeholder="120" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Diuresis (mL)</label>
            <input type="number" value={form.diuresis} onChange={set('diuresis')} placeholder="200" className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Soporte respiratorio</div>
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-xs font-medium text-slate-600">Dispositivo</label>
          <select value={form.deviceType} onChange={set('deviceType')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500">
            {devices.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {(device === 'nasal_cannula' || device === 'reservoir_mask') && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Flujo (L/min)</label>
              <input type="number" value={form.flowRate} onChange={set('flowRate')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
        )}
        {device === 'ventimax' && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Flujo (L/min)</label>
              <input type="number" value={form.flowRate} onChange={set('flowRate')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">FiO2 (%)</label>
              <input type="number" value={form.fio2} onChange={set('fio2')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
        )}
        {device === 'bipap' && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">IPAP (cmH₂O)</label>
              <input type="number" value={form.ipap} onChange={set('ipap')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">EPAP (cmH₂O)</label>
              <input type="number" value={form.epap} onChange={set('epap')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
        )}
        {device === 'mechanical_ventilation' && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">FiO2 (%)</label>
              <input type="number" value={form.fio2} onChange={set('fio2')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">PEEP (cmH₂O)</label>
              <input type="number" value={form.peep} onChange={set('peep')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Vt (mL)</label>
              <input type="number" value={form.tidalVolume} onChange={set('tidalVolume')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">FR prog. (rpm)</label>
              <input type="number" value={form.respiratoryRateSet} onChange={set('respiratoryRateSet')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600">Guardar cambios</button>
        </div>
      </form>
    </div>
  )
}
