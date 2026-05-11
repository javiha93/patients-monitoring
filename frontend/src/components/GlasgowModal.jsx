import { useState } from 'react'
import { X } from 'lucide-react'

const OCULAR = [
  { score: 4, label: 'Espontánea' },
  { score: 3, label: 'Al llamado' },
  { score: 2, label: 'Al dolor' },
  { score: 1, label: 'Ausente' },
]

const VERBAL = [
  { score: 5, label: 'Orientado' },
  { score: 4, label: 'Confuso' },
  { score: 3, label: 'Palabras' },
  { score: 2, label: 'Sonidos' },
  { score: 1, label: 'Ausente' },
]

const MOTOR = [
  { score: 6, label: 'Obedece' },
  { score: 5, label: 'Localiza' },
  { score: 4, label: 'Flexión normal' },
  { score: 3, label: 'Flexión anormal' },
  { score: 2, label: 'Extensión' },
  { score: 1, label: 'Ausente' },
]

export const GLASGOW_AXES = { OCULAR, VERBAL, MOTOR }

function ScoreColumn({ title, color, items, selected, onSelect }) {
  return (
    <div className="flex-1 min-w-[140px]">
      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>{title}</div>
      <div className="space-y-1">
        {items.map(item => (
          <button
            key={item.score}
            type="button"
            onClick={() => onSelect(item.score)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors
              ${selected === item.score
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
          >
            <span>{item.label}</span>
            <span className="font-bold">{item.score}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GlasgowModal({ open, onClose, onConfirm, initialScore }) {
  const [ocular, setOcular] = useState(null)
  const [verbal, setVerbal] = useState(null)
  const [motor, setMotor] = useState(null)

  if (!open) return null

  const total = (ocular || 0) + (verbal || 0) + (motor || 0)
  const allSelected = ocular != null && verbal != null && motor != null

  const severityLabel = () => {
    if (!allSelected) return null
    if (total <= 8) return { text: 'Grave (≤8)', color: 'text-red-600 bg-red-50' }
    if (total <= 12) return { text: 'Moderado (9-12)', color: 'text-amber-600 bg-amber-50' }
    return { text: 'Leve (13-15)', color: 'text-green-600 bg-green-50' }
  }

  const severity = severityLabel()

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Escala de Coma de Glasgow</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="flex gap-4 mb-5">
          <ScoreColumn title="Apertura ocular" color="text-rose-600" items={OCULAR} selected={ocular} onSelect={setOcular} />
          <ScoreColumn title="Respuesta verbal" color="text-amber-600" items={VERBAL} selected={verbal} onSelect={setVerbal} />
          <ScoreColumn title="Respuesta motora" color="text-sky-600" items={MOTOR} selected={motor} onSelect={setMotor} />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-slate-800">{allSelected ? total : '—'}</div>
            <div className="text-sm text-slate-500">
              <div>O:{ocular ?? '—'} + V:{verbal ?? '—'} + M:{motor ?? '—'}</div>
              {severity && <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${severity.color}`}>{severity.text}</div>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
            <button
              onClick={() => { onConfirm(total); onClose() }}
              disabled={!allSelected}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
