import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Syringe, Trash2, FlaskConical, Bug, X, AlertTriangle, Clock, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { labTestApi } from '../services/labTestApi'
import { useAuth } from '../context/AuthContext'
import ActionBar from '../components/ActionBar'
import ConfirmModal from '../components/ConfirmModal'
import InsightsPanel from '../components/InsightsPanel'

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

  // New test form
  const [showNew, setShowNew] = useState(false)
  const [newTest, setNewTest] = useState({ category: 'analitica', label: '', requestedBy: '', notes: '' })

  // Validate modal
  const [validateModal, setValidateModal] = useState({ open: false, test: null })
  const [externalId, setExternalId] = useState('')
  const [validateError, setValidateError] = useState('')

  // Results viewer
  const [viewResults, setViewResults] = useState(null) // LabTestDTO with results

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

  const handleCreate = async (e) => {
    e.preventDefault()
    await labTestApi.create({ ...newTest, admissionId: admission.id, requestedBy: newTest.requestedBy || user?.displayName || '' })
    setNewTest({ category: 'analitica', label: '', requestedBy: '', notes: '' })
    setShowNew(false)
    fetchData()
  }

  const handleValidate = async () => {
    setValidateError('')
    try {
      await labTestApi.validate(validateModal.test.id, externalId, user?.displayName || '')
      setValidateModal({ open: false, test: null })
      setExternalId('')
      fetchData()
    } catch (e) {
      setValidateError(e.response?.data?.error || 'Error al validar')
    }
  }

  const handleDelete = async () => {
    await labTestApi.delete(deleteConfirm.id)
    setDeleteConfirm({ open: false, id: null })
    fetchData()
  }

  const handleTestClick = async (test) => {
    if (test.status === 'pending_validation') {
      setValidateModal({ open: true, test })
      setExternalId('')
      setValidateError('')
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
            const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending_validation
            const CatIcon = CATEGORY_ICON[t.category] || FlaskConical
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
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                  <StatusIcon size={12} />
                  {cfg.label}
                </span>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, id: t.id }) }}
                  className="text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 size={16} /></button>
              </div>
            )
          })
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      {/* New test modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-3">Solicitar prueba de laboratorio</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Tipo</label>
                <select value={newTest.category} onChange={e => setNewTest({ ...newTest, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="analitica">Analítica</option>
                  <option value="cultivo">Cultivo</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Descripción</label>
                <input required value={newTest.label} onChange={e => setNewTest({ ...newTest, label: e.target.value })}
                  placeholder="Ej: Hemograma + Bioquímica, Hemocultivo x2"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Solicitado por</label>
                <input value={newTest.requestedBy} onChange={e => setNewTest({ ...newTest, requestedBy: e.target.value })}
                  placeholder="Dr. García" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
                <button type="submit" className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-600">Solicitar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validate modal */}
      {validateModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setValidateModal({ open: false, test: null })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-1">Validar prueba</h3>
            <p className="text-sm text-slate-500 mb-4">{validateModal.test?.label}</p>
            <div>
              <label className="text-xs text-slate-500 font-medium">Identificador único (código de barras / ID laboratorio)</label>
              <input autoFocus value={externalId} onChange={e => { setExternalId(e.target.value); setValidateError('') }}
                placeholder="Ej: LAB-2024-00123"
                className={`w-full border rounded-lg px-3 py-2 text-sm mt-1 ${validateError ? 'border-red-400' : ''}`} />
            </div>
            {validateError && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{validateError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setValidateModal({ open: false, test: null })} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
              <button onClick={handleValidate} disabled={!externalId.trim()}
                className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed">Validar</button>
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
    </div>
  )
}
