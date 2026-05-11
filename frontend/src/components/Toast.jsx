import { useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconStyles = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback({
    error: (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  }, [addToast])

  // Workaround: useCallback doesn't work with objects, use useMemo-like pattern
  return { toasts, removeToast, toast: { 
    error: (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  }}
}

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[999] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)
  const Icon = icons[toast.type] || icons.info

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${styles[toast.type]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
      <p className="text-sm flex-1 break-words">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="shrink-0 opacity-50 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}
