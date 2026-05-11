import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, History } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { vitalsApi } from '../services/vitalsApi'
import ActionBar from '../components/ActionBar'
import VitalsSummaryCards from '../components/VitalsSummaryCards'
import VitalsTable from '../components/VitalsTable'
import NewVitalSignModal from '../components/NewVitalSignModal'
import EditVitalSignModal from '../components/EditVitalSignModal'
import { useToast, ToastContainer } from '../components/Toast'
import InsightsPanel from '../components/InsightsPanel'
import NursingAssessmentTab from '../components/NursingAssessmentTab'
import ConfirmModal from '../components/ConfirmModal'

function calcAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate() }
  if (months < 0) { years--; months += 12 }
  const totalMonths = years * 12 + months
  if (years >= 2) return `${years} años`
  if (totalMonths >= 1) return `${totalMonths} meses`
  return `${Math.max(0, days)} días`
}

export default function PatientRecord() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const { toasts, removeToast, toast } = useToast()
  const [editVital, setEditVital] = useState(null)
  const [activeTab, setActiveTab] = useState('vitals')
  const [confirmAction, setConfirmAction] = useState(null) // { message, action }
  const [historicalVitals, setHistoricalVitals] = useState([])
  const [historicalVitalsPage, setHistoricalVitalsPage] = useState(0)
  const [historicalVitalsHasMore, setHistoricalVitalsHasMore] = useState(true)
  const [loadingHistorical, setLoadingHistorical] = useState(false)

  const fetchData = async () => {
    try {
      const { data: p } = await patientApi.getPatient(id)
      setPatient(p)
      if (p.activeAdmission) {
        const { data: v } = await vitalsApi.getByAdmission(p.activeAdmission.id)
        setVitals(v)
      }
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreVitals = useCallback(async () => {
    if (!patient?.activeAdmission || loadingHistorical) return
    setLoadingHistorical(true)
    try {
      const { data } = await vitalsApi.getHistorical(patient.id, patient.activeAdmission.id, historicalVitalsPage, 10)
      setHistoricalVitals(prev => [...prev, ...data.content])
      setHistoricalVitalsHasMore(data.hasMore)
      setHistoricalVitalsPage(prev => prev + 1)
    } catch (e) {
      toast.error('Error cargando registros anteriores')
    } finally {
      setLoadingHistorical(false)
    }
  }, [patient, historicalVitalsPage, loadingHistorical])

  useEffect(() => { fetchData() }, [id])

  if (loading) return <p className="p-6 text-slate-400">Cargando...</p>
  if (!patient) return null

  const age = calcAge(patient.birthDate)
  const admission = patient.activeAdmission

  const handleDischarge = async () => {
    try {
      await patientApi.discharge(patient.id, { dischargeDate: new Date().toISOString() })
      navigate('/')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error')
    }
  }

  const handleNewVital = async (data) => {
    try {
      await vitalsApi.create({ ...data, admissionId: admission.id })
      setModalOpen(false)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error guardando registro')
    }
  }

  const handleEditVital = async (id, data) => {
    try {
      await vitalsApi.update(id, data)
      setEditVital(null)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error actualizando registro')
    }
  }

  const handleDeleteVital = async (id) => {
    try {
      await vitalsApi.delete(id)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error eliminando registro')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Lista
        </Link>
        <div className="flex-1">
          <div className="text-lg font-bold">{patient.lastName}, {patient.firstName}</div>
          <div className="text-sm text-slate-500">
            {age ? `${age} · ` : ''}{patient.nhc}
            {admission ? ` · ${admission.matCategory || ''}` : ''}
          </div>
        </div>
        {activeTab === 'vitals' && (
          <button onClick={() => setModalOpen(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-600">
            <Plus size={16} /> Nuevo registro
          </button>
        )}
        {admission && (
          <button onClick={() => setConfirmAction({ message: `¿Confirmas el alta hospitalaria de ${patient.lastName}, ${patient.firstName}?`, action: handleDischarge })} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            Alta hospitalaria
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-0 flex-shrink-0">
        {[
          { key: 'vitals', label: 'Constantes vitales' },
          { key: 'nursing', label: 'Valoración enfermería' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === tab.key
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >{tab.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6 pb-24 space-y-4">
        {activeTab === 'vitals' && <>
          {admission && <InsightsPanel patientId={patient.id} admissionId={admission.id} excludeTypes={['allergy_conflict', 'new_cognitive_decline', 'progressive_cognitive_decline', 'glasgow_drop', 'fall_risk_mobility', 'agitation_no_restraint', 'respiratory_pattern_deterioration']} />}
          <VitalsSummaryCards vitals={vitals} />
          <VitalsTable vitals={vitals} onEdit={setEditVital} onDelete={(id) => setConfirmAction({ message: '¿Eliminar este registro de constantes?', action: () => handleDeleteVital(id) })} />

          {historicalVitals.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider pt-4">Registros de ingresos anteriores</h3>
              <VitalsTable vitals={historicalVitals} />
            </>
          )}

          {admission && historicalVitalsHasMore && (
            <div className="flex justify-center pt-2">
              <button onClick={loadMoreVitals} disabled={loadingHistorical}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">
                <History size={15} />
                {loadingHistorical ? 'Cargando...' : 'Ver anteriores'}
              </button>
            </div>
          )}
        </>}
        {activeTab === 'nursing' && admission && (
          <NursingAssessmentTab admissionId={admission.id} patientId={patient.id} toast={toast} />
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      <NewVitalSignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewVital}
        patientName={`${patient.lastName}, ${patient.firstName} · ${age || ''}`}
      />

      <EditVitalSignModal
        open={!!editVital}
        onClose={() => setEditVital(null)}
        onSubmit={handleEditVital}
        vitalSign={editVital}
        patientName={`${patient.lastName}, ${patient.firstName} · ${age || ''}`}
      />

      <ConfirmModal
        open={confirmAction != null}
        message={confirmAction?.message}
        onConfirm={() => { confirmAction?.action(); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
