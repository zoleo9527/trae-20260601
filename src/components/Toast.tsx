import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useRoleStore } from '@/store/useRoleStore'
import type { ToastMessage } from '@/types'

const toastConfig: Record<
  ToastMessage['type'],
  { icon: React.ElementType; bg: string; border: string; text: string }
> = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useRoleStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => removeToast(toast.id), 200)
  }

  const config = toastConfig[toast.type]
  const Icon = config.icon

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 shadow-md transition-all duration-200 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      } ${config.bg} ${config.border}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${config.text}`} />
      <span className={`text-sm ${config.text}`}>{toast.message}</span>
      <button
        onClick={handleClose}
        className="ml-auto shrink-0 rounded p-0.5 hover:bg-black/5"
      >
        <X className="h-3.5 w-3.5 text-slate-400" />
      </button>
    </div>
  )
}

export default function Toast() {
  const { toasts } = useRoleStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
