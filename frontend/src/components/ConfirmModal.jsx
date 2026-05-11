import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
        <div className="flex items-start gap-3 mb-5">
          <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <p className="text-sm text-slate-700 pt-1.5">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600">Confirmar</button>
        </div>
      </div>
    </div>
  )
}
