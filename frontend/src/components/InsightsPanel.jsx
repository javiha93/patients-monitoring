import { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import { insightsApi } from '../services/insightsApi'

const levelConfig = {
  critical: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800', label: 'Crítico' },
  warning:  { icon: AlertCircle,   bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', label: 'Atención' },
  info:     { icon: Info,          bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', label: 'Info' },
}

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(insight.level === 'critical')
  const config = levelConfig[insight.level] || levelConfig.info
  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-3 transition-all`}>
      <div className="flex items-start gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <Icon size={18} className={`${config.text} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${config.text}`}>{insight.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.badge}`}>{config.label}</span>
          </div>
          {expanded && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-700">{insight.detail}</p>
              <p className="text-xs text-slate-500 italic">{insight.reasoning}</p>
              <span className="inline-block text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1">
                {insight.analysisType.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
        <button className={`${config.text} flex-shrink-0`}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function InsightsPanel({ patientId, admissionId, includeTypes, excludeTypes }) {
  const [rawInsights, setRawInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!patientId || !admissionId) return
    setLoading(true)
    insightsApi.getByPatientAdmission(patientId, admissionId)
      .then(({ data }) => setRawInsights(data))
      .catch(() => setRawInsights([]))
      .finally(() => setLoading(false))
  }, [patientId, admissionId])

  const insights = rawInsights.filter(i => {
    if (includeTypes) return includeTypes.includes(i.analysisType)
    if (excludeTypes) return !excludeTypes.includes(i.analysisType)
    return true
  })

  const criticalCount = insights.filter(i => i.level === 'critical').length
  const warningCount = insights.filter(i => i.level === 'warning').length

  if (loading) return <div className="text-xs text-slate-400 py-2">Analizando...</div>
  if (insights.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Brain size={20} className="text-violet-600" />
        <h3 className="text-sm font-bold text-slate-800 flex-1">Inteligencia Clínica</h3>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {warningCount} alerta{warningCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-slate-400">{insights.length} insight{insights.length > 1 ? 's' : ''}</span>
          {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
        </div>
      </div>
      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}
    </div>
  )
}
