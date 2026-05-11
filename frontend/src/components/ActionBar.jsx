import { HeartPulse, Bandage, Pill } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function ActionBar({ patient, admissionId }) {
  const location = useLocation()
  const base = `/patient/${patient?.id}`

  const tabs = [
    { path: base, icon: HeartPulse, color: 'text-red-600', label: 'Registros' },
    { path: `${base}/history`, icon: Bandage, color: 'text-amber-600', label: 'Antecedentes' },
    { path: `${base}/medication`, icon: Pill, color: 'text-teal-600', label: 'Medicación' },
  ]

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-5 z-50">
      {tabs.map(t => {
        const Icon = t.icon
        const active = location.pathname === t.path
        return (
          <Link
            key={t.path}
            to={t.path}
            className={`${t.color} ${active ? 'opacity-100' : 'opacity-50'} hover:opacity-80 transition-opacity`}
            title={t.label}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
          </Link>
        )
      })}
      <div className="text-sm text-slate-500">
        <strong className="text-slate-900">{patient?.lastName}, {patient?.firstName}</strong> · {patient?.nhc}
      </div>
    </div>
  )
}
