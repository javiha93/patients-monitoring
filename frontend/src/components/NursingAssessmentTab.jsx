import { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, ChevronDown, ChevronUp, HelpCircle, Pencil } from 'lucide-react'
import { nursingApi } from '../services/nursingApi'
import GlasgowModal from './GlasgowModal'

/* ── Reusable sub-components ── */

function Section({ title, color, children }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className={`px-4 py-2 text-sm font-semibold text-white ${color}`}>{title}</div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Select({ label, value, onChange, options, placeholder = 'Seleccionar...' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value || null)}
        className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
        ${checked ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
    >{label}</button>
  )
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none" />
    </div>
  )
}

/* ── Option lists ── */
const OPTS = {
  type: [{ value: 'entrada', label: 'Entrada' }, { value: 'sucesiva', label: 'Sucesiva' }, { value: 'salida', label: 'Salida' }],
  arrivalMode: [{ value: 'por_su_cuenta', label: 'Por su cuenta' }, { value: 'ambulancia', label: 'Ambulancia' }, { value: 'traslado', label: 'Traslado hospitalario' }, { value: 'policia', label: 'Policía / Bomberos' }, { value: 'otros', label: 'Otros' }],
  languageBarrier: [{ value: 'ninguna', label: 'Ninguna' }, { value: 'idioma', label: 'Idioma' }, { value: 'sensorial', label: 'Sensorial' }, { value: 'cognitiva', label: 'Cognitiva' }],
  consciousness: [{ value: 'alerta', label: 'Alerta' }, { value: 'somnoliento', label: 'Somnoliento' }, { value: 'estuporoso', label: 'Estuporoso' }, { value: 'comatoso', label: 'Comatoso' }],
  painType: [{ value: 'agudo', label: 'Agudo' }, { value: 'cronico', label: 'Crónico' }, { value: 'neuropatico', label: 'Neuropático' }, { value: 'visceral', label: 'Visceral' }],
  nutrition: [{ value: 'sin_alteraciones', label: 'Sin alteraciones' }, { value: 'nauseas', label: 'Náuseas' }, { value: 'disfagia', label: 'Disfagia' }, { value: 'sng', label: 'SNG' }, { value: 'ostomia', label: 'Ostomía' }],
  vomitingType: [{ value: 'alimenticio', label: 'Alimenticio' }, { value: 'bilioso', label: 'Bilioso' }, { value: 'hematico', label: 'Hemático' }, { value: 'fecaloideo', label: 'Fecaloideo' }],
  vomitingAmount: [{ value: 'escaso', label: 'Escaso' }, { value: 'moderado', label: 'Moderado' }, { value: 'abundante', label: 'Abundante' }],
  mood: [{ value: 'tranquilo', label: 'Tranquilo' }, { value: 'ansioso', label: 'Ansioso' }, { value: 'agitado', label: 'Agitado' }, { value: 'deprimido', label: 'Deprimido' }, { value: 'agresivo', label: 'Agresivo' }],
  physicalCognitive: [{ value: 'orientado', label: 'Orientado' }, { value: 'desorientado', label: 'Desorientado' }, { value: 'confuso', label: 'Confuso' }, { value: 'demencia', label: 'Demencia' }],
  urinePattern: [{ value: 'sin_alteraciones', label: 'Sin alteraciones' }, { value: 'oliguria', label: 'Oliguria' }, { value: 'anuria', label: 'Anuria' }, { value: 'poliuria', label: 'Poliuria' }, { value: 'hematuria', label: 'Hematuria' }],
  stoolPattern: [{ value: 'sin_alteraciones', label: 'Sin alteraciones' }, { value: 'diarrea', label: 'Diarrea' }, { value: 'estrenimiento', label: 'Estreñimiento' }, { value: 'melenas', label: 'Melenas' }, { value: 'rectorragia', label: 'Rectorragia' }],
  breathingPattern: [{ value: 'normal', label: 'Normal' }, { value: 'taquipnea', label: 'Taquipnea' }, { value: 'bradipnea', label: 'Bradipnea' }, { value: 'apnea', label: 'Apnea' }],
  dyspnea: [{ value: 'ninguna', label: 'Ninguna' }, { value: 'reposo', label: 'En reposo' }, { value: 'esfuerzo', label: 'Al esfuerzo' }],
  cough: [{ value: 'ninguna', label: 'Ninguna' }, { value: 'seca', label: 'Seca' }, { value: 'productiva', label: 'Productiva' }],
  expectoration: [{ value: 'ninguna', label: 'Ninguna' }, { value: 'mucosa', label: 'Mucosa' }, { value: 'purulenta', label: 'Purulenta' }, { value: 'hemoptoica', label: 'Hemoptoica' }],
  mobility: [{ value: 'sin_alteraciones', label: 'Sin alteraciones' }, { value: 'alteracion_aguda', label: 'Alteración aguda' }, { value: 'alteracion_cronica', label: 'Alteración crónica' }],
}

const EMPTY_FORM = {
  assessmentType: 'sucesiva',
  arrivalMode: null, accompanied: false, languageBarrier: 'ninguna',
  consciousness: null, glasgowScore: null,
  hasPain: false, painLocation: '', painIrradiation: '', painType: null,
  nutrition: 'sin_alteraciones', vomitingType: null, vomitingAmount: null, aspirationRisk: false,
  mood: 'tranquilo', physicalCognitive: 'orientado',
  sensoryBlindness: false, sensoryDeafness: false, sensoryAphasia: false, sensoryDysarthria: false,
  physicalDisability: false, cognitiveObservations: '',
  urinePattern: 'sin_alteraciones', stoolPattern: 'sin_alteraciones',
  urinaryIncontinence: false, fecalIncontinence: false,
  hasDiaper: false, hasOstomy: false, hasUrinaryCatheter: false, hasCollector: false,
  breathingPattern: 'normal', dyspneaLevel: 'ninguna', coughType: 'ninguna', expectoration: 'ninguna',
  homeOxygen: false, homeCpap: false,
  mobility: 'sin_alteraciones', mobilityDetails: '',
  bedRails: false, restraintAbdominal: false, restraintLegs: false, restraintArms: false,
  familyInformed: false, patientInformed: false, fallRisk: false, selfHarmRisk: false, elopementRisk: false,
  notes: '',
}

function toLocalISOString() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const typeLabels = { entrada: 'Entrada', sucesiva: 'Sucesiva', salida: 'Salida' }

export default function NursingAssessmentTab({ admissionId, toast }) {
  const [assessments, setAssessments] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    try {
      const { data } = await nursingApi.getByAdmission(admissionId)
      setAssessments(data)
    } catch { /* ignore */ }
  }

  useEffect(() => { if (admissionId) fetch() }, [admissionId])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editingId) {
        await nursingApi.update(editingId, { ...form, admissionId })
        toast.success('Valoración actualizada')
      } else {
        await nursingApi.create({ ...form, admissionId, recordedAt: toLocalISOString() })
        toast.success('Valoración guardada')
      }
      setFormOpen(false)
      setEditingId(null)
      setForm({ ...EMPTY_FORM })
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error guardando valoración')
    } finally { setSaving(false) }
  }

  const handleEdit = (assessment) => {
    setForm({
      assessmentType: assessment.assessmentType || 'sucesiva',
      arrivalMode: assessment.arrivalMode || null,
      accompanied: assessment.accompanied || false,
      languageBarrier: assessment.languageBarrier || 'ninguna',
      consciousness: assessment.consciousness || null,
      glasgowScore: assessment.glasgowScore ?? null,
      hasPain: assessment.hasPain || false,
      painLocation: assessment.painLocation || '',
      painIrradiation: assessment.painIrradiation || '',
      painType: assessment.painType || null,
      nutrition: assessment.nutrition || 'sin_alteraciones',
      vomitingType: assessment.vomitingType || null,
      vomitingAmount: assessment.vomitingAmount || null,
      aspirationRisk: assessment.aspirationRisk || false,
      mood: assessment.mood || 'tranquilo',
      physicalCognitive: assessment.physicalCognitive || 'orientado',
      sensoryBlindness: assessment.sensoryBlindness || false,
      sensoryDeafness: assessment.sensoryDeafness || false,
      sensoryAphasia: assessment.sensoryAphasia || false,
      sensoryDysarthria: assessment.sensoryDysarthria || false,
      physicalDisability: assessment.physicalDisability || false,
      cognitiveObservations: assessment.cognitiveObservations || '',
      urinePattern: assessment.urinePattern || 'sin_alteraciones',
      stoolPattern: assessment.stoolPattern || 'sin_alteraciones',
      urinaryIncontinence: assessment.urinaryIncontinence || false,
      fecalIncontinence: assessment.fecalIncontinence || false,
      hasDiaper: assessment.hasDiaper || false,
      hasOstomy: assessment.hasOstomy || false,
      hasUrinaryCatheter: assessment.hasUrinaryCatheter || false,
      hasCollector: assessment.hasCollector || false,
      breathingPattern: assessment.breathingPattern || 'normal',
      dyspneaLevel: assessment.dyspneaLevel || 'ninguna',
      coughType: assessment.coughType || 'ninguna',
      expectoration: assessment.expectoration || 'ninguna',
      homeOxygen: assessment.homeOxygen || false,
      homeCpap: assessment.homeCpap || false,
      mobility: assessment.mobility || 'sin_alteraciones',
      mobilityDetails: assessment.mobilityDetails || '',
      bedRails: assessment.bedRails || false,
      restraintAbdominal: assessment.restraintAbdominal || false,
      restraintLegs: assessment.restraintLegs || false,
      restraintArms: assessment.restraintArms || false,
      familyInformed: assessment.familyInformed || false,
      patientInformed: assessment.patientInformed || false,
      fallRisk: assessment.fallRisk || false,
      selfHarmRisk: assessment.selfHarmRisk || false,
      elopementRisk: assessment.elopementRisk || false,
      notes: assessment.notes || '',
    })
    setEditingId(assessment.id)
    setFormOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta valoración?')) return
    try {
      await nursingApi.delete(id)
      fetch()
    } catch { toast.error('Error eliminando valoración') }
  }

  return (
    <div className="space-y-4">
      {/* New assessment button */}
      {!formOpen && (
        <button onClick={() => {
          if (assessments.length === 0) {
            setForm({ ...EMPTY_FORM, assessmentType: 'entrada' })
          } else {
            // Pre-fill from last assessment, but reset arrival fields and type
            const last = assessments[0]
            setForm({
              assessmentType: 'sucesiva',
              arrivalMode: null, accompanied: false,
              languageBarrier: last.languageBarrier || 'ninguna',
              consciousness: last.consciousness || null,
              glasgowScore: last.glasgowScore ?? null,
              hasPain: last.hasPain || false,
              painLocation: last.painLocation || '',
              painIrradiation: last.painIrradiation || '',
              painType: last.painType || null,
              nutrition: last.nutrition || 'sin_alteraciones',
              vomitingType: last.vomitingType || null,
              vomitingAmount: last.vomitingAmount || null,
              aspirationRisk: last.aspirationRisk || false,
              mood: last.mood || 'tranquilo',
              physicalCognitive: last.physicalCognitive || 'orientado',
              sensoryBlindness: last.sensoryBlindness || false,
              sensoryDeafness: last.sensoryDeafness || false,
              sensoryAphasia: last.sensoryAphasia || false,
              sensoryDysarthria: last.sensoryDysarthria || false,
              physicalDisability: last.physicalDisability || false,
              cognitiveObservations: last.cognitiveObservations || '',
              urinePattern: last.urinePattern || 'sin_alteraciones',
              stoolPattern: last.stoolPattern || 'sin_alteraciones',
              urinaryIncontinence: last.urinaryIncontinence || false,
              fecalIncontinence: last.fecalIncontinence || false,
              hasDiaper: last.hasDiaper || false,
              hasOstomy: last.hasOstomy || false,
              hasUrinaryCatheter: last.hasUrinaryCatheter || false,
              hasCollector: last.hasCollector || false,
              breathingPattern: last.breathingPattern || 'normal',
              dyspneaLevel: last.dyspneaLevel || 'ninguna',
              coughType: last.coughType || 'ninguna',
              expectoration: last.expectoration || 'ninguna',
              homeOxygen: last.homeOxygen || false,
              homeCpap: last.homeCpap || false,
              mobility: last.mobility || 'sin_alteraciones',
              mobilityDetails: last.mobilityDetails || '',
              bedRails: last.bedRails || false,
              restraintAbdominal: last.restraintAbdominal || false,
              restraintLegs: last.restraintLegs || false,
              restraintArms: last.restraintArms || false,
              familyInformed: last.familyInformed || false,
              patientInformed: last.patientInformed || false,
              fallRisk: last.fallRisk || false,
              selfHarmRisk: last.selfHarmRisk || false,
              elopementRisk: last.elopementRisk || false,
              notes: '',
            })
          }
          setFormOpen(true)
        }}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600">
          <Plus size={16} /> Nueva valoración
        </button>
      )}

      {/* Form */}
      {formOpen && <AssessmentForm form={form} set={set} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditingId(null) }} saving={saving} editing={!!editingId} />}

      {/* History */}
      {assessments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Valoraciones anteriores</h3>
          {assessments.map(a => <AssessmentCard key={a.id} assessment={a} onDelete={handleDelete} onEdit={handleEdit} />)}
        </div>
      )}

      {!formOpen && assessments.length === 0 && (
        <p className="text-slate-400 text-center py-8">No hay valoraciones registradas</p>
      )}
    </div>
  )
}

/* ── The form itself, split out for readability ── */
function AssessmentForm({ form, set, onSubmit, onCancel, saving, editing }) {
  const [glasgowOpen, setGlasgowOpen] = useState(false)

  const missingRequired = !form.consciousness || form.glasgowScore == null || form.glasgowScore === ''
    || (form.assessmentType === 'entrada' && !form.arrivalMode)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">{editing ? 'Editar valoración' : 'Nueva valoración de enfermería'}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          form.assessmentType === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}>{form.assessmentType === 'entrada' ? 'Entrada' : 'Sucesiva'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Col 1 */}
        <div className="space-y-4">
          {form.assessmentType === 'entrada' && (
            <Section title="Llegada *" color="bg-slate-500">
              <Select label="Modo de llegada *" value={form.arrivalMode} onChange={v => set('arrivalMode', v)} options={OPTS.arrivalMode} />
              {!form.arrivalMode && <p className="text-xs text-red-500">Obligatorio</p>}
              <Toggle label="Viene acompañado" checked={form.accompanied} onChange={v => set('accompanied', v)} />
            </Section>
          )}

          <Section title="Consciencia *" color="bg-indigo-500">
            <Select label="Nivel *" value={form.consciousness} onChange={v => set('consciousness', v)} options={OPTS.consciousness} />
            {!form.consciousness && <p className="text-xs text-red-500">Obligatorio</p>}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Glasgow (3-15) *</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number" min={3} max={15}
                  value={form.glasgowScore ?? ''}
                  onChange={e => set('glasgowScore', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Ej: 15"
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none"
                />
                <button type="button" onClick={() => setGlasgowOpen(true)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-md text-slate-500 hover:text-blue-500 hover:border-blue-300 transition-colors"
                  title="Calculadora Glasgow"
                ><HelpCircle size={16} /></button>
              </div>
              {(form.glasgowScore == null || form.glasgowScore === '') && <p className="text-xs text-red-500">Obligatorio</p>}
            </div>
          </Section>

          <Section title="Dolor" color="bg-red-500">
            <Toggle label="Presenta dolor" checked={form.hasPain} onChange={v => set('hasPain', v)} />
            {form.hasPain && <>
              <TextInput label="Localización" value={form.painLocation} onChange={v => set('painLocation', v)} />
              <TextInput label="Irradiación" value={form.painIrradiation} onChange={v => set('painIrradiation', v)} />
              <Select label="Tipo" value={form.painType} onChange={v => set('painType', v)} options={OPTS.painType} />
            </>}
          </Section>

          <Section title="Alimentación" color="bg-amber-500">
            <Select label="Estado" value={form.nutrition} onChange={v => set('nutrition', v)} options={OPTS.nutrition} />
            <Select label="Vómitos (tipo)" value={form.vomitingType} onChange={v => set('vomitingType', v)} options={OPTS.vomitingType} />
            {form.vomitingType && <Select label="Cantidad" value={form.vomitingAmount} onChange={v => set('vomitingAmount', v)} options={OPTS.vomitingAmount} />}
            <Toggle label="Riesgo aspiración" checked={form.aspirationRisk} onChange={v => set('aspirationRisk', v)} />
          </Section>
        </div>

        {/* Col 2 */}
        <div className="space-y-4">
          <Section title="Estado anímico" color="bg-purple-500">
            <Select label="Estado" value={form.mood} onChange={v => set('mood', v)} options={OPTS.mood} />
          </Section>

          <Section title="Estado físico y cognitivo" color="bg-teal-500">
            <Select label="Orientación" value={form.physicalCognitive} onChange={v => set('physicalCognitive', v)} options={OPTS.physicalCognitive} />
            <div className="text-xs font-medium text-slate-600 mt-1">Déficit sensorial</div>
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Ceguera" checked={form.sensoryBlindness} onChange={v => set('sensoryBlindness', v)} />
              <Toggle label="Hipoacusia" checked={form.sensoryDeafness} onChange={v => set('sensoryDeafness', v)} />
              <Toggle label="Afasia" checked={form.sensoryAphasia} onChange={v => set('sensoryAphasia', v)} />
              <Toggle label="Disartria" checked={form.sensoryDysarthria} onChange={v => set('sensoryDysarthria', v)} />
            </div>
            <Toggle label="Discapacidad física" checked={form.physicalDisability} onChange={v => set('physicalDisability', v)} />
            <Select label="Barrera comunicación" value={form.languageBarrier} onChange={v => set('languageBarrier', v)} options={OPTS.languageBarrier} />
            <TextInput label="Observaciones" value={form.cognitiveObservations} onChange={v => set('cognitiveObservations', v)} />
          </Section>

          <Section title="Eliminación" color="bg-emerald-500">
            <Select label="Orina" value={form.urinePattern} onChange={v => set('urinePattern', v)} options={OPTS.urinePattern} />
            <Select label="Deposición" value={form.stoolPattern} onChange={v => set('stoolPattern', v)} options={OPTS.stoolPattern} />
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Incont. urinaria" checked={form.urinaryIncontinence} onChange={v => set('urinaryIncontinence', v)} />
              <Toggle label="Incont. fecal" checked={form.fecalIncontinence} onChange={v => set('fecalIncontinence', v)} />
            </div>
            <div className="text-xs font-medium text-slate-600 mt-1">Dispositivos</div>
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Pañal" checked={form.hasDiaper} onChange={v => set('hasDiaper', v)} />
              <Toggle label="Ostomía" checked={form.hasOstomy} onChange={v => set('hasOstomy', v)} />
              <Toggle label="Sonda vesical" checked={form.hasUrinaryCatheter} onChange={v => set('hasUrinaryCatheter', v)} />
              <Toggle label="Colector" checked={form.hasCollector} onChange={v => set('hasCollector', v)} />
            </div>
          </Section>
        </div>

        {/* Col 3 */}
        <div className="space-y-4">
          <Section title="Respiración" color="bg-sky-500">
            <Select label="Patrón" value={form.breathingPattern} onChange={v => set('breathingPattern', v)} options={OPTS.breathingPattern} />
            <Select label="Disnea" value={form.dyspneaLevel} onChange={v => set('dyspneaLevel', v)} options={OPTS.dyspnea} />
            <Select label="Tos" value={form.coughType} onChange={v => set('coughType', v)} options={OPTS.cough} />
            <Select label="Expectoración" value={form.expectoration} onChange={v => set('expectoration', v)} options={OPTS.expectoration} />
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="O₂ domiciliario" checked={form.homeOxygen} onChange={v => set('homeOxygen', v)} />
              <Toggle label="CPAP domiciliaria" checked={form.homeCpap} onChange={v => set('homeCpap', v)} />
            </div>
          </Section>

          <Section title="Movilidad" color="bg-orange-500">
            <Select label="Estado" value={form.mobility} onChange={v => set('mobility', v)} options={OPTS.mobility} />
            {form.mobility !== 'sin_alteraciones' && <TextInput label="Detalles" value={form.mobilityDetails} onChange={v => set('mobilityDetails', v)} />}
          </Section>

          <Section title="Seguridad" color="bg-rose-500">
            <div className="text-xs font-medium text-slate-600">Contención</div>
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Barandillas" checked={form.bedRails} onChange={v => set('bedRails', v)} />
              <Toggle label="Abdominal" checked={form.restraintAbdominal} onChange={v => set('restraintAbdominal', v)} />
              <Toggle label="EEII" checked={form.restraintLegs} onChange={v => set('restraintLegs', v)} />
              <Toggle label="EESS" checked={form.restraintArms} onChange={v => set('restraintArms', v)} />
            </div>
            <div className="text-xs font-medium text-slate-600 mt-1">Información y riesgos</div>
            <div className="flex flex-wrap gap-1.5">
              <Toggle label="Familia informada" checked={form.familyInformed} onChange={v => set('familyInformed', v)} />
              <Toggle label="Paciente informado" checked={form.patientInformed} onChange={v => set('patientInformed', v)} />
              <Toggle label="Riesgo caída" checked={form.fallRisk} onChange={v => set('fallRisk', v)} />
              <Toggle label="Riesgo autolesión" checked={form.selfHarmRisk} onChange={v => set('selfHarmRisk', v)} />
              <Toggle label="Riesgo fuga" checked={form.elopementRisk} onChange={v => set('elopementRisk', v)} />
            </div>
          </Section>
        </div>
      </div>

      {/* Notes + actions */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Notas adicionales</label>
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md text-sm focus:border-blue-500 outline-none resize-none" />
      </div>
      <div className="flex items-center gap-3 justify-end pt-2 border-t border-slate-100">
        {missingRequired && <span className="text-xs text-red-500 mr-auto">* Campos obligatorios sin rellenar</span>}
        <button onClick={onCancel} className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
        <button onClick={onSubmit} disabled={saving || missingRequired} className="px-5 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Guardando...' : editing ? 'Actualizar valoración' : 'Guardar valoración'}
        </button>
      </div>

      <GlasgowModal
        open={glasgowOpen}
        onClose={() => setGlasgowOpen(false)}
        onConfirm={(total) => set('glasgowScore', total)}
      />
    </div>
  )
}

/* ── Collapsed card showing a saved assessment ── */
function AssessmentCard({ assessment, onDelete, onEdit }) {
  const [open, setOpen] = useState(false)
  const a = assessment

  const arrivalLabels = { por_su_cuenta: 'Propio', ambulancia: 'Ambulancia', traslado: 'Traslado', policia: 'Policía', otros: 'Otros' }
  const summaryItems = [
    a.arrivalMode && `Llegada: ${arrivalLabels[a.arrivalMode] || a.arrivalMode}`,
    a.consciousness && `Consc: ${a.consciousness}`,
    a.mood && `Ánimo: ${a.mood}`,
    a.hasPain && `Dolor: ${a.painLocation || 'sí'}`,
    a.breathingPattern && a.breathingPattern !== 'normal' && `Resp: ${a.breathingPattern}`,
    a.mobility && a.mobility !== 'sin_alteraciones' && `Mov: ${a.mobility}`,
  ].filter(Boolean)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => setOpen(!open)}>
        <Clock size={14} className="text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{formatTime(a.recordedAt)}</span>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{typeLabels[a.assessmentType] || a.assessmentType}</span>
        <span className="text-xs text-slate-400 flex-1 truncate">{summaryItems.join(' · ')}</span>
        {onEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit(a) }} className="text-slate-300 hover:text-blue-500"><Pencil size={14} /></button>
        )}
        {onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete(a.id) }} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
        )}
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </div>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs border-t border-slate-100 pt-3">
          {a.arrivalMode && <Detail label="Llegada" value={arrivalLabels[a.arrivalMode] || a.arrivalMode} />}
          {a.accompanied && <Detail label="Acompañado" value="Sí" />}
          <Detail label="Consciencia" value={a.consciousness} />
          <Detail label="Glasgow" value={a.glasgowScore} />
          <Detail label="Dolor" value={a.hasPain ? `${a.painLocation || 'Sí'} (${a.painType || '—'})` : 'No'} />
          <Detail label="Alimentación" value={a.nutrition} />
          <Detail label="Ánimo" value={a.mood} />
          <Detail label="Cognitivo" value={a.physicalCognitive} />
          {a.languageBarrier && a.languageBarrier !== 'ninguna' && <Detail label="Barrera comunicación" value={a.languageBarrier} />}
          <Detail label="Orina" value={a.urinePattern} />
          <Detail label="Deposición" value={a.stoolPattern} />
          <Detail label="Respiración" value={a.breathingPattern} />
          <Detail label="Disnea" value={a.dyspneaLevel} />
          <Detail label="Movilidad" value={a.mobility} />
          <Detail label="Barandillas" value={a.bedRails ? 'Sí' : 'No'} />
          {a.notes && <div className="col-span-full"><Detail label="Notas" value={a.notes} /></div>}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  if (value == null) return null
  return (
    <div className="py-0.5">
      <span className="text-slate-400">{label}: </span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}
