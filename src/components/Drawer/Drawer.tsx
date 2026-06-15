import { ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: 'sm' | 'md' | 'lg'
}

export function Drawer({ open, onClose, title, children, width = 'md' }: DrawerProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (open) {
      setIsVisible(true)
    } else {
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [open])
  
  if (!isVisible && !open) return null
  
  return (
    <>
      <div 
        className={clsx(
          'fixed inset-0 bg-black/50 transition-opacity z-40',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div 
        className={clsx(
          'fixed right-0 top-0 h-full bg-white shadow-xl z-50 transition-transform',
          width === 'sm' && 'w-80',
          width === 'md' && 'w-96',
          width === 'lg' && 'w-[480px]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          {children}
        </div>
      </div>
    </>
  )
}