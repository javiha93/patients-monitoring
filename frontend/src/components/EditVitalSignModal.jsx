import { useState, useEffect } from 'react'
import { X, AlertTriangle, Plus } from 'lucide-react'
import VitalInput, { validateVitals } from './VitalInput'
import { deviceApi } from '../services/deviceApi'
import { DeviceFormModal } from './DevicesTab'
import DrainOutputsSection from './DrainOutputsSection'

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

function toLocalISOString() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
}

export default function EditVitalSignModal({ open, onClose, onSubmit, vitalSign, patientName, admissionId }) {
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [drainOutputs, setDrainOutputs] = useState([])
  const [hasSondaVesical, setHasSondaVesical] = useState(null)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [deviceForm, setDeviceForm] = useState({})
  const [deviceSaving, setDeviceSaving] = useState(false)

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
        urineSource: vitalSign.urineSource || '',
        diaperAmount: vitalSign.diaperAmount || '',
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
      setErrors({})
      // Initialize drain outputs from existing vital sign data
      setDrainOutputs(vitalSign.drainOutputs || [])
    }
  }, [open, vitalSign])

  // Check sonda vesical status when urineSource changes to sonda_vesical
  useEffect(() => {
    if (form.urineSource === 'sonda_vesical' && admissionId) {
      deviceApi.hasActiveByType(admissionId, 'sonda_vesical')
        .then(({ data }) => setHasSondaVesical(data))
        .catch(() => setHasSondaVesical(false))
    } else {
      setHasSondaVesical(null)
    }
  }, [form.urineSource, admissionId])

  if (!open || !vitalSign) return null

  const set = (f) => (e) => {
    setForm({ ...form, [f]: e.target.value })
    if (errors[f]) setErrors({ ...errors, [f]: undefined })
  }

  const needsSondaVesical = form.urineSource === 'sonda_vesical' && hasSondaVesical === false

  const handleOpenDeviceModal = () => {
    setDeviceForm({ category: 'elimination', type: 'sonda_vesical' })
    setShowDeviceModal(true)
  }

  const handleDeviceSubmit = async (e) => {
    e.preventDefault()
    setDeviceSaving(true)
    try {
      await deviceApi.create({ ...deviceForm, admissionId, insertedAt: deviceForm.insertedAt || toLocalISOString() })
      setShowDeviceModal(false)
      setDeviceForm({})
      setHasSondaVesical(true)
    } catch {
      // keep modal open on error
    } finally {
      setDeviceSaving(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (needsSondaVesical) return
    const errs = validateVitals(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const data = {
      admissionId: vitalSign.admissionId,
      recordedAt: form.recordedAt + ':00',
      systolicBp: form.systolicBp ? parseInt(form.systolicBp) : null,
      diastolicBp: form.diastolicBp ? parseInt(form.diastolicBp) : null,
      heartRate: form.heartRate ? parseInt(form.heartRate) : null,
      spo2: form.spo2 ? parseInt(form.spo2) : null,
      respiratoryRate: form.respiratoryRate ? parseInt(form.respiratoryRate) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      painLevel: form.painLevel ? parseInt(form.painLevel) : null,
      bloodGlucose: form.bloodGlucose ? parseInt(form.bloodGlucose) : null,
      diuresis: form.urineSource !== 'panal' && form.diuresis ? parseInt(form.diuresis) : null,
      urineSource: form.urineSource || null,
      diaperAmount: form.urineSource === 'panal' ? (form.diaperAmount || null) : null,
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
      drainOutputs: drainOutputs.filter(d => d.outputMl).map(d => ({
        deviceId: d.deviceId,
        drainNumber: d.drainNumber,
        outputMl: parseInt(d.outputMl),
        fluidType: d.fluidType || 'seroso',
        vacuumActive: d.vacuumActive ?? true,
      })),
    }
    onSubmit(vitalSign.id, data)
  }

  const device = form.deviceType

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Editar registro de constantes</h3>
            <p className="text-sm text-slate-500">{patientName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Fecha y hora</label>
            <input type="datetime-local" value={form.recordedAt} onChange={set('recordedAt')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Constantes vitales</div>
        <div data-vital-group>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <VitalInput label="TAS (mmHg)" field="systolicBp" form={form} set={set} error={errors.systolicBp} />
            <VitalInput label="TAD (mmHg)" field="diastolicBp" form={form} set={set} error={errors.diastolicBp} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <VitalInput label="FC (bpm)" field="heartRate" form={form} set={set} error={errors.heartRate} />
            <VitalInput label="SpO2 (%)" field="spo2" form={form} set={set} error={errors.spo2} />
            <VitalInput label="FR (rpm)" field="respiratoryRate" form={form} set={set} error={errors.respiratoryRate} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <VitalInput label="Tª (°C)" field="temperature" form={form} set={set} error={errors.temperature} step="0.1" />
            <VitalInput label="Dolor (0-10)" field="painLevel" form={form} set={set} error={errors.painLevel} />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Otros registros</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <VitalInput label="Glucemia capilar (mg/dL)" field="bloodGlucose" form={form} set={set} error={errors.bloodGlucose} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Origen orina</label>
            <select value={form.urineSource} onChange={set('urineSource')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500">
              <option value="">— Sin registro —</option>
              <option value="sonda_vesical">Sonda vesical</option>
              <option value="colector">Colector</option>
              <option value="urostomia">Urostomía</option>
              <option value="panal">Pañal</option>
            </select>
          </div>
          {form.urineSource && form.urineSource !== 'panal' && (
            <VitalInput label="Diuresis (mL)" field="diuresis" form={form} set={set} error={errors.diuresis} />
          )}
          {form.urineSource === 'panal' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Cantidad pañal</label>
              <select value={form.diaperAmount} onChange={set('diaperAmount')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500">
                <option value="">— Seleccionar —</option>
                <option value="seco">Seco</option>
                <option value="escaso">Escaso</option>
                <option value="moderado">Moderado</option>
                <option value="abundante">Abundante</option>
              </select>
            </div>
          )}
        </div>

        {needsSondaVesical && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-1 flex items-start gap-2" data-testid="sonda-vesical-alert">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-amber-700">No hay sonda vesical registrada</div>
              <div className="text-[11px] text-amber-600 mt-0.5">
                Para registrar diuresis por sonda vesical, primero debe registrar el dispositivo en la pestaña de Dispositivos.
              </div>
              <button type="button" onClick={handleOpenDeviceModal}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700">
                <Plus size={13} /> Añadir sonda vesical ahora
              </button>
            </div>
          </div>
        )}

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">Soporte respiratorio</div>
        {!form.spo2 ? (
          <p className="text-xs text-slate-400 mb-3">Registre SpO2 para poder añadir soporte respiratorio</p>
        ) : (
        <div className="flex flex-col gap-1 mb-3">
          <label className="text-xs font-medium text-slate-600">Dispositivo</label>
          <select value={form.deviceType} onChange={set('deviceType')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500">
            {devices.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        )}

        {form.spo2 && (device === 'nasal_cannula' || device === 'reservoir_mask') && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Flujo (L/min)</label>
              <input type="number" value={form.flowRate} onChange={set('flowRate')} className="px-2.5 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
        )}
        {form.spo2 && device === 'ventimax' && (
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
        {form.spo2 && device === 'bipap' && (
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
        {form.spo2 && device === 'mechanical_ventilation' && (
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

        <DrainOutputsSection
          admissionId={admissionId}
          drainOutputs={drainOutputs}
          onChange={setDrainOutputs}
          existingOutputs={vitalSign?.drainOutputs}
        />

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button type="submit" disabled={needsSondaVesical}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium ${needsSondaVesical ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-sky-500 text-white hover:bg-sky-600'}`}>
            Guardar cambios
          </button>
        </div>
      </form>

      <DeviceFormModal
        open={showDeviceModal}
        form={deviceForm}
        set={(field, val) => setDeviceForm(prev => ({ ...prev, [field]: val }))}
        category="elimination"
        onSubmit={handleDeviceSubmit}
        onCancel={() => { setShowDeviceModal(false); setDeviceForm({}) }}
        saving={deviceSaving}
        editing={false}
      />
    </div>
  )
}
