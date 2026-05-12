import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Plus, History } from 'lucide-react'
import { patientApi } from '../services/patientApi'
import { vitalsApi } from '../services/vitalsApi'
import { deviceApi } from '../services/deviceApi'
import { useAuth } from '../context/AuthContext'
import ActionBar from '../components/ActionBar'
import VitalsSummaryCards from '../components/VitalsSummaryCards'
import VitalsTable from '../components/VitalsTable'
import NewVitalSignModal from '../components/NewVitalSignModal'
import EditVitalSignModal from '../components/EditVitalSignModal'
import { useToast, ToastContainer } from '../components/Toast'
import InsightsPanel from '../components/InsightsPanel'
import NursingAssessmentTab from '../components/NursingAssessmentTab'
import ConfirmModal from '../components/ConfirmModal'
import DevicesTab from '../components/DevicesTab'

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
  const { user } = useAuth()
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
  const [activeDrains, setActiveDrains] = useState([])

  const fetchData = async () => {
    try {
      const { data: p } = await patientApi.getPatient(id)
      setPatient(p)
      if (p.activeAdmission) {
        const { data: v } = await vitalsApi.getByAdmission(p.activeAdmission.id)
        setVitals(v)
        // Check if historical vitals exist
        const { data: hist } = await vitalsApi.getHistorical(p.id, p.activeAdmission.id, 0, 1)
        setHistoricalVitalsHasMore(hist.content.length > 0)
        // Fetch active drains for vitals table
        try {
          const { data: drains } = await deviceApi.getActiveDrains(p.activeAdmission.id)
          setActiveDrains(drains)
        } catch { setActiveDrains([]) }
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
      await vitalsApi.create({ ...data, admissionId: admission.id, recordedBy: user?.displayName || '' })
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
          { key: 'devices', label: 'Dispositivos' },
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
          {admission && <InsightsPanel patientId={patient.id} admissionId={admission.id} excludeTypes={[
            'allergy_conflict', 'habitual_analgesic_not_prescribed', 'opioid_respiratory_depression',
            'new_cognitive_decline', 'progressive_cognitive_decline', 'glasgow_drop',
            'fall_risk_mobility', 'agitation_no_restraint', 'respiratory_pattern_deterioration',
            'prior_agitation_history',
            'sedative_somnolence', 'dysphagia_oral_meds', 'aspiration_risk_oral_meds',
            'agitation_no_sedative', 'desaturation_respiratory_pattern', 'tachycardia_agitation',
            'anticoagulant_fall_risk',
            'vvp_prolonged', 'vvp_emergency_change', 'sng_pvc_change_due', 'sng_silicone_change_due',
            'sv_latex_change_due', 'sv_silicone_change_due', 'sv_itu_risk',
            'vvc_review_dressing', 'vvc_review_lines', 'picc_review_dressing', 'sng_aspiration_risk',
            'drain_prolonged', 'drain_high_output', 'drain_hemorrhagic', 'drain_vacuum_lost', 'drain_purulent',
            'lab_creatinine_nephrotoxic', 'lab_hyperkaliemia_raas', 'lab_creatinine_rising',
            'lab_sepsis_triad', 'lab_procalcitonin', 'lab_neutropenia_fever',
            'lab_inr_anticoagulant', 'lab_thrombocytopenia', 'lab_anemia_tachycardia',
            'lab_transaminases_hepatotoxic',
          ]} />}
          <VitalsSummaryCards vitals={vitals} />
          <div className="flex justify-end">
            <button onClick={() => setModalOpen(true)} className="bg-sky-500 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-sky-600" title="Nuevo registro">
              <Plus size={18} />
            </button>
          </div>
          <VitalsTable vitals={vitals} onEdit={setEditVital} onDelete={(id) => setConfirmAction({ message: '¿Eliminar este registro de constantes?', action: () => handleDeleteVital(id) })} activeDrains={activeDrains} />

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

        {activeTab === 'devices' && admission && (
          <DevicesTab admissionId={admission.id} patientId={patient.id} toast={toast} />
        )}
      </div>

      <ActionBar patient={patient} admissionId={admission?.id} />

      <NewVitalSignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewVital}
        patientName={`${patient.lastName}, ${patient.firstName} · ${age || ''}`}
        admissionId={admission?.id}
      />

      <EditVitalSignModal
        open={!!editVital}
        onClose={() => setEditVital(null)}
        onSubmit={handleEditVital}
        vitalSign={editVital}
        patientName={`${patient.lastName}, ${patient.firstName} · ${age || ''}`}
        admissionId={admission?.id}
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
