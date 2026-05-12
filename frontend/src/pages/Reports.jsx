import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ChevronLeft, Loader2, AlertTriangle, Clock, User } from 'lucide-react'
import { insightsApi } from '../services/insightsApi'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Reports() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAdmission, setSelectedAdmission] = useState(null)
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    insightsApi.getDismissalSummaries()
      .then(({ data }) => setSummaries(data))
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false))
  }, [])

  const handleGenerateReport = async (summary) => {
    setSelectedAdmission(summary)
    setReportLoading(true)
    setReport(null)
    try {
      const { data } = await insightsApi.getReport(summary.admissionId)
      setReport(data)
    } catch {
      setReport({ report: 'Error al generar el informe.', source: 'error', count: 0 })
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> Pacientes
        </Link>
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-violet-600" />
          <h1 className="text-lg font-bold">Reportes de Alertas Descartadas</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-20">
            <AlertTriangle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No hay alertas descartadas registradas</p>
            <p className="text-slate-400 text-xs mt-1">Cuando se descarten alertas clínicas, aparecerán aquí para generar reportes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 max-w-6xl">
            {/* Admission list */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-600 mb-2">Ingresos con alertas descartadas</h2>
              {summaries.map(s => (
                <button
                  key={s.admissionId}
                  onClick={() => handleGenerateReport(s)}
                  className={`w-full text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                    selectedAdmission?.admissionId === s.admissionId
                      ? 'border-violet-400 ring-2 ring-violet-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{s.patientName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {s.status === 'active' ? 'Ingresado' : 'Alta'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">NHC: {s.nhc}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Ingreso: {fmtDate(s.admissionDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} /> {s.dismissalCount} descarte{s.dismissalCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {s.lastDismissedAt && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Último descarte: {fmtDateTime(s.lastDismissedAt)}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Report panel */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {!selectedAdmission ? (
                <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                  Selecciona un ingreso para generar el reporte
                </div>
              ) : reportLoading ? (
                <div className="flex items-center justify-center h-64 gap-2">
                  <Loader2 size={20} className="animate-spin text-violet-500" />
                  <span className="text-sm text-slate-500">Generando informe...</span>
                </div>
              ) : report ? (
                <div className="flex flex-col h-full">
                  <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Informe — {selectedAdmission.patientName}
                      </h3>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>{report.count} alerta{report.count !== 1 ? 's' : ''} descartada{report.count !== 1 ? 's' : ''}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          report.source === 'openai' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {report.source === 'openai' ? 'Generado con IA' : 'Informe estructurado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-5">
                    <div className="prose prose-sm prose-slate max-w-none">
                      <ReportMarkdown text={report.report} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Simple markdown-to-JSX renderer for the report content */
function ReportMarkdown({ text }) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-slate-700 mt-4 mb-2">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-slate-700 mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-slate-700 ml-2 my-0.5">
          <span className="text-slate-400">•</span>
          <span><InlineMarkdown text={line.slice(2)} /></span>
        </div>
      )
    } else if (line.startsWith('  - ')) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-slate-600 ml-6 my-0.5">
          <span className="text-slate-300">◦</span>
          <span><InlineMarkdown text={line.slice(4)} /></span>
        </div>
      )
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="my-4 border-slate-200" />)
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      elements.push(<p key={i} className="text-xs text-slate-400 italic mt-2">{line.replace(/^\*|\*$/g, '')}</p>)
    } else if (line.trim()) {
      elements.push(<p key={i} className="text-sm text-slate-700 my-1"><InlineMarkdown text={line} /></p>)
    } else {
      elements.push(<div key={i} className="h-2" />)
    }
    i++
  }

  return <>{elements}</>
}

function InlineMarkdown({ text }) {
  // Handle **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
