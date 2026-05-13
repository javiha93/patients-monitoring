import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Syringe, Trash2, FlaskConical, Bug, X, AlertTriangle, Clock, CheckCircle2, Loader2, FileText, Pencil } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { labTestApi } from '../services/labTestApi'
import { deviceApi } from '../services/deviceApi'
import { useAuth } from '../context/AuthContext'
import ActionBar from '../components/ActionBar'
import ConfirmModal from '../components/ConfirmModal'
import InsightsPanel from '../components/InsightsPanel'
import { DeviceFormModal } from '../components/DevicesTab'
import NewLabTestModal from '../components/NewLabTestModal'
import SampleIconsRow, { SampleCheckbox } from '../components/SampleIcons'
import { getSamplesNeeded } from '../constants/labCatalog'

const labInsightTypes = [
  'lab_creatinine_nephrotoxic', 'lab_hyperkaliemia_raas', 'lab_creatinine_rising',
  'lab_sepsis_triad', 'lab_procalcitonin', 'lab_neutropenia_fever',
  'lab_inr_anticoagulant', 'lab_thrombocytopenia', 'lab_anemia_tachycardia',
  'lab_transaminases_hepatotoxic',
]

function calcAge(bd) {
  if (!bd) return null
  const today = new Date(), birth = new Date(bd)
  let y = today.getFullYear() - birth.getFullYear()
  let m = today.getMonth() - birth.getMonth()
  let d = today.getDate() - birth.getDate()
  if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate() }
  if (m < 0) { y--; m += 12 }
  const tm = y * 12 + m
  if (y >= 2) return `${y} años`
  if (tm >= 1) return `${tm} meses`
  return `${Math.max(0, d)} días`
}

function fmtDateTime(s) {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG = {
  pending_validation: { label: 'Pendiente de validar', color: 'bg-amber-100 text-amber-800', icon: Clock },
  pending_receipt: { label: 'Pendiente de recibir', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  in_progress: { label: 'En curso', color: 'bg-indigo-100 text-indigo-800', icon: Loader2 },
  partial_results: { label: 'Resultados parciales', color: 'bg-orange-100 text-orange-800', icon: FileText },
  results: { label: 'Resultados', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
}

const CATEGORY_ICON = { analitica: FlaskConical, cultivo: Bug }
export default function PatientTests() {
  const { id } = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  // New/edit test modal
  const [showNew, setShowNew] = useState(false)
  const [editingTest, setEditingTest] = useState(null)

  // Validate modal
  const [validateModal, setValidateModal] = useState({ open: false, test: null })
  const [externalId, setExternalId] = useState('')
  const [validateError, setValidateError] = useState('')
  const [selectedSamples, setSelectedSamples] = useState(new Set())
  const [siblingCodes, setSiblingCodes] = useState([]) // existing codes from sibling validations
  const [useExistingCode, setUseExistingCode] = useState(false)

  // Results viewer
  const [viewResults, setViewResults] = useState(null) // LabTestDTO with results

  // VVP prompt on first validation
  const [needsVvp, setNeedsVvp] = useState(false)
  const [showVvpModal, setShowVvpModal] = useState(false)
  const [vvpForm, setVvpForm] = useState({})
  const [vvpSaving, setVvpSaving] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null })

  const fetchData = async () => {
    try {
      const { data: p } = await patientApi.getPatient(id)
      setPatient(p)
      if (p.activeAdmission) {
        const { data: t } = await labTestApi.getByAdmission(p.activeAdmission.id)
        setTests(t)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)
  const admission = patient.activeAdmission

  const handleCreate = async (testData) => {
    if (editingTest) {
      await labTestApi.update(editingTest.id, testData)
      setEditingTest(null)
    } else {
      await labTestApi.create({ ...testData, admissionId: admission.id, requestedBy: user?.displayName || '' })
    }
    setShowNew(false)
    fetchData()
  }

  const handleValidate = async () => {
    setValidateError('')
    try {
      const test = validateModal.test
      const params = test.requestedParameters ? JSON.parse(test.requestedParameters) : []
      const allSamples = getSamplesNeeded(params)
      const alreadyValidated = test.validatedSamples ? JSON.parse(test.validatedSamples) : []
      const merged = new Set([...alreadyValidated, ...selectedSamples])
      const isPartial = merged.size < allSamples.length

      await labTestApi.validate(test.id, {
        externalId,
        validatedBy: user?.displayName || '',
        validatedSamples: JSON.stringify([...merged]),
        partial: isPartial,
      })
      setValidateModal({ open: false, test: null })
      setExternalId('')
      setSelectedSamples(new Set())
      setSiblingCodes([])
      setUseExistingCode(false)
      fetchData()
    } catch (e) {
      setValidateError(e.response?.data?.error || 'Error al validar')
    }
  }

  const handleVvpSubmit = async (e) => {
    e.preventDefault()
    setVvpSaving(true)
    try {
      await deviceApi.create({ ...vvpForm, admissionId: admission.id, insertedAt: new Date().toISOString(), registeredBy: user?.displayName || '' })
      setShowVvpModal(false)
      setNeedsVvp(false)
      setVvpForm({})
    } catch { /* ignore */ }
    finally { setVvpSaving(false) }
  }

  const handleDelete = async () => {
    await labTestApi.delete(deleteConfirm.id)
    setDeleteConfirm({ open: false, id: null })
    fetchData()
  }

  const handleTestClick = async (test) => {
    if (test.status === 'pending_validation') {
      setValidateModal({ open: true, test })
      setExternalId(test.externalId || '')
      setValidateError('')
      setUseExistingCode(false)
      // Collect existing codes from sibling validations
      const codes = (test.validations || [])
        .map(v => v.externalId)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
      setSiblingCodes(codes)
      // Pre-select all non-validated samples
      const params = test.requestedParameters ? JSON.parse(test.requestedParameters) : []
      const allSamples = getSamplesNeeded(params)
      const alreadyValidated = test.validatedSamples ? new Set(JSON.parse(test.validatedSamples)) : new Set()
      setSelectedSamples(new Set(allSamples.filter(s => !alreadyValidated.has(s.key)).map(s => s.key)))
      // Check if VVP is needed: first blood test validation and no active VVP
      const hasSangre = test.requestedParameters && JSON.parse(test.requestedParameters).some(c =>
        !c.startsWith('orina_') && !c.startsWith('heces_') && !c.startsWith('esputo_') &&
        !c.startsWith('cultivo_') && !c.startsWith('hemocultivo_') && !c.startsWith('pcr_') &&
        !c.startsWith('ag_rapido_') && c !== 'urocultivo' && c !== 'urocultivo_hongos' &&
        c !== 'coprocultivo' && c !== 'cultivo_cdiff' && c !== 'pcr_panel_respiratorio'
      )
      const isFirstBloodValidation = hasSangre && !tests.some(t => {
        if (t.id === test.id || t.status === 'pending_validation') return false
        if (!t.requestedParameters) return false
        const params = JSON.parse(t.requestedParameters)
        return params.some(c =>
          !c.startsWith('orina_') && !c.startsWith('heces_') && !c.startsWith('esputo_') &&
          !c.startsWith('cultivo_') && !c.startsWith('hemocultivo_') && !c.startsWith('pcr_') &&
          !c.startsWith('ag_rapido_') && c !== 'urocultivo' && c !== 'urocultivo_hongos' &&
          c !== 'coprocultivo' && c !== 'cultivo_cdiff' && c !== 'pcr_panel_respiratorio'
        )
      })
      if (isFirstBloodValidation && admission) {
        try {
          const { data: hasVvp } = await deviceApi.hasActiveByType(admission.id, 'via_periferica')
          setNeedsVvp(!hasVvp)
        } catch { setNeedsVvp(false) }
      } else {
        setNeedsVvp(false)
      }
    } else if (test.status === 'partial_results' || test.status === 'results') {
      const { data } = await labTestApi.getById(test.id)
      setViewResults(data)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Lista
        </Link>
        <div className="flex-1">
          <div className="text-lg font-bold">{patient.lastName}, {patient.firstName}</div>
          <div className="text-sm text-slate-500">{age ? `${age} · ` : ''}{patient.nhc}</div>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-violet-600">
          <Plus size={16} /> Solicitar prueba
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 pb-24 space-y-3">
        {admission && <InsightsPanel patientId={patient.id} admissionId={admission.id} includeTypes={labInsightTypes} />}
        {!admission ? (
          <p className="text-slate-400 text-center mt-12">Sin ingreso activo</p>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Syringe size={48} className="mx-auto text-violet-300 mb-4" />
            <p className="text-sm text-slate-400">No hay pruebas de laboratorio solicitadas</p>
          </div>
        ) : (
          tests.map(t => {
            const hasSplit = t.children && t.children.length > 0
            const CatIcon = CATEGORY_ICON[t.category] || FlaskConical

            if (!hasSplit) {
              // Simple test — no splits, render as single row
              const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending_validation
              const StatusIcon = cfg.icon
              const clickable = t.status === 'pending_validation' || t.status === 'partial_results' || t.status === 'results'
              return (
                <div key={t.id}
                  onClick={() => clickable && handleTestClick(t)}
                  className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-violet-300' : ''} transition-all`}
                >
                  <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <CatIcon size={20} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{fmtDateTime(t.requestedAt)}</span>
                      {t.requestedBy && <span title={`Solicitado por: ${t.requestedBy}`}>· {t.requestedBy}</span>}
                      {t.validatedBy && <span className="text-sky-500" title={`Validado por: ${t.validatedBy}`}>· Val: {t.validatedBy}</span>}
                      {t.externalId && <span className="font-mono text-slate-500">ID: {t.externalId}</span>}
                    </div>
                  </div>
                  <SampleIconsRow requestedParameters={t.requestedParameters} validatedSamples={t.validatedSamples} />
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>
                  {t.status === 'pending_validation' && (
                    <button onClick={(e) => { e.stopPropagation(); setEditingTest(t); setShowNew(true) }}
                      className="text-slate-300 hover:text-violet-500 flex-shrink-0" title="Editar prueba"><Pencil size={16} /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, id: t.id }) }}
                    className="text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 size={16} /></button>
                </div>
              )
            }

            // Split test — render grouped card with sub-rows
            const parentClickable = t.status === 'pending_validation' || t.status === 'partial_results' || t.status === 'results'
            return (
              <div key={t.id} className="bg-white rounded-xl shadow-sm overflow-hidden" data-testid="split-test-card">
                {/* Header row */}
                <div className="px-4 py-3 flex items-center gap-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <CatIcon size={20} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{fmtDateTime(t.requestedAt)}</span>
                      {t.requestedBy && <span>· {t.requestedBy}</span>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, id: t.id }) }}
                    className="text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 size={16} /></button>
                </div>

                {/* Validated child rows */}
                {t.children.map(child => {
                  const childCfg = STATUS_CONFIG[child.status] || STATUS_CONFIG.pending_receipt
                  const ChildStatusIcon = childCfg.icon
                  const childClickable = child.status === 'partial_results' || child.status === 'results'
                  return (
                    <div key={child.id}
                      onClick={() => childClickable && (async () => { const { data } = await labTestApi.getById(child.id); setViewResults(data) })()}
                      className={`px-4 py-2.5 flex items-center gap-3 border-b border-slate-50 bg-slate-50/50 ${childClickable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                    >
                      <div className="w-6 flex-shrink-0" />
                      <SampleIconsRow requestedParameters={child.requestedParameters} validatedSamples={child.validatedSamples} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          {child.externalId && <span className="font-mono font-medium text-slate-600">ID: {child.externalId}</span>}
                          {child.validatedBy && <span className="text-sky-500">Val: {child.validatedBy}</span>}
                          {child.validatedAt && <span>{fmtDateTime(child.validatedAt)}</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${childCfg.color}`}>
                        <ChildStatusIcon size={10} />
                        {childCfg.label}
                      </span>
                    </div>
                  )
                })}

                {/* Remaining samples row (if parent still pending_validation) */}
                {t.status === 'pending_validation' && (
                  <div
                    onClick={() => handleTestClick(t)}
                    className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-amber-50 transition-colors"
                  >
                    <div className="w-6 flex-shrink-0" />
                    <SampleIconsRow requestedParameters={t.requestedParameters} validatedSamples={t.validatedSamples} onlyPending />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-amber-700 font-medium">Muestras pendientes de validar</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      <Clock size={10} />
                      Pendiente
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      {/* New test modal */}
      {showNew && (
        <NewLabTestModal
          onSubmit={handleCreate}
          onClose={() => { setShowNew(false); setEditingTest(null) }}
          initialData={editingTest}
        />
      )}

      {/* Validate modal */}
      {validateModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setValidateModal({ open: false, test: null })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-1">Validar prueba</h3>
            <p className="text-sm text-slate-500 mb-4">{validateModal.test?.label}</p>
            <div>
              <label className="text-xs text-slate-500 font-medium">Identificador único (código de barras / ID laboratorio)</label>
              {siblingCodes.length > 0 && (
                <div className="mt-1.5 mb-2 space-y-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="radio" name="codeMode" checked={!useExistingCode}
                      onChange={() => { setUseExistingCode(false); setExternalId('') }}
                      className="accent-violet-500" />
                    Nuevo código
                  </label>
                  {siblingCodes.map(code => (
                    <label key={code} className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="radio" name="codeMode" checked={useExistingCode && externalId === code}
                        onChange={() => { setUseExistingCode(true); setExternalId(code); setValidateError('') }}
                        className="accent-violet-500" />
                      Usar código existente: <span className="font-mono font-medium">{code}</span>
                    </label>
                  ))}
                </div>
              )}
              <input autoFocus value={externalId}
                onChange={e => { setExternalId(e.target.value); setValidateError(''); if (useExistingCode) setUseExistingCode(false) }}
                placeholder="Ej: LAB-2024-00123"
                disabled={useExistingCode}
                className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 ${validateError ? 'border-red-400' : ''} ${useExistingCode ? 'bg-slate-50 text-slate-400' : ''}`} />
            </div>
            {validateModal.test?.requestedParameters && (
              <div className="mt-3">
                <label className="text-xs text-slate-500 font-medium block mb-1.5">Muestras a validar</label>
                <SampleCheckbox
                  requestedParameters={validateModal.test.requestedParameters}
                  validatedSamples={validateModal.test.validatedSamples}
                  selected={selectedSamples}
                  onToggle={(key) => setSelectedSamples(prev => {
                    const next = new Set(prev)
                    next.has(key) ? next.delete(key) : next.add(key)
                    return next
                  })}
                />
              </div>
            )}
            {validateError && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{validateError}</span>
              </div>
            )}
            {needsVvp && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2" data-testid="vvp-alert">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">No hay vía periférica registrada</p>
                  <p className="text-xs text-amber-600 mt-0.5">Se necesita una vía para la extracción analítica.</p>
                  <button type="button" onClick={() => { setShowVvpModal(true); setVvpForm({ category: 'vascular', type: 'via_periferica' }) }}
                    className="mt-1.5 text-xs font-medium text-amber-700 underline hover:text-amber-900">
                    Registrar vía periférica
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setValidateModal({ open: false, test: null })} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
              <button onClick={handleValidate} disabled={!externalId.trim() || selectedSamples.size === 0}
                className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed">
                Validar{selectedSamples.size > 0 ? ` (${selectedSamples.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results viewer */}
      {viewResults && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewResults(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold">{viewResults.label}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  {fmtDateTime(viewResults.requestedAt)}
                  {viewResults.externalId && <span className="ml-2 font-mono">ID: {viewResults.externalId}</span>}
                </div>
              </div>
              <button onClick={() => setViewResults(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {viewResults.results.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin resultados disponibles</p>
              ) : (
                (() => {
                  const grouped = {}
                  viewResults.results.forEach(r => {
                    if (!grouped[r.category]) grouped[r.category] = []
                    grouped[r.category].push(r)
                  })
                  return Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat} className="mb-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat}</h4>
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase">
                            <th className="pb-1.5">Parámetro</th>
                            <th className="pb-1.5">Resultado</th>
                            <th className="pb-1.5">Unidad</th>
                            <th className="pb-1.5">Ref.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(r => {
                            const flagColor = r.flag === 'high' ? 'text-red-600 font-semibold'
                              : r.flag === 'low' ? 'text-blue-600 font-semibold'
                              : r.flag === 'critical' ? 'text-red-700 font-bold bg-red-50'
                              : 'text-slate-700'
                            return (
                              <tr key={r.id} className="border-t border-slate-100">
                                <td className="py-1.5 text-sm">{r.name}</td>
                                <td className={`py-1.5 text-sm ${flagColor}`}>
                                  {r.value}
                                  {r.flag && r.flag !== 'normal' && <span className="ml-1 text-[10px]">{r.flag === 'high' ? '↑' : r.flag === 'low' ? '↓' : '⚠'}</span>}
                                </td>
                                <td className="py-1.5 text-xs text-slate-500">{r.unit}</td>
                                <td className="py-1.5 text-xs text-slate-400">{r.refRange}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteConfirm.open}
        title="Eliminar prueba"
        message="¿Seguro que quieres eliminar esta prueba de laboratorio?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

      {/* VVP registration modal */}
      <DeviceFormModal
        open={showVvpModal}
        form={vvpForm}
        set={(field, val) => setVvpForm(prev => ({ ...prev, [field]: val }))}
        category="vascular"
        saving={vvpSaving}
        onSubmit={handleVvpSubmit}
        onCancel={() => { setShowVvpModal(false); setVvpForm({}) }}
      />
    </div>
  )
}
