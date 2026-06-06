import { useEffect } from 'react'
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { cn } from '../utils'

export function AppNotification() {
  const { notification, setNotification } = useStore()

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification, setNotification])

  if (!notification) return null

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    error: <AlertTriangle className="w-5 h-5 text-red-600" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg',
        bgColors[notification.type]
      )}>
        {icons[notification.type]}
        <span className="text-sm font-medium">{notification.message}</span>
        <button
          onClick={() => setNotification(null)}
          className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
