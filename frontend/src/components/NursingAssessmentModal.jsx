import { useState } from 'react'
import { AssessmentForm, NURSING_EMPTY_FORM } from './NursingAssessmentTab'
import { nursingApi } from '../services/nursingApi'
import { useAuth } from '../context/AuthContext'

function toLocalISOString() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function NursingAssessmentModal({ isOpen, onClose, admissionId }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ ...NURSING_EMPTY_FORM, assessmentType: 'entrada' })
  const [saving, setSaving] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await nursingApi.create({
        ...form,
        admissionId,
        recordedAt: toLocalISOString(),
        recordedBy: user?.displayName || '',
      })
      setForm({ ...NURSING_EMPTY_FORM, assessmentType: 'entrada' })
      onClose(true) // true = saved successfully
    } catch {
      // stay open on error
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({ ...NURSING_EMPTY_FORM, assessmentType: 'entrada' })
    onClose(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-start justify-center overflow-y-auto py-8"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-[95vw] max-w-[1100px] p-6" onClick={e => e.stopPropagation()}>
        <AssessmentForm
          form={form}
          set={set}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          saving={saving}
          editing={false}
        />
      </div>
    </div>
  )
}
