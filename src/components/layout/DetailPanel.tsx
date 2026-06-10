import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'

interface DetailPanelProps {
  children?: ReactNode
}

export default function DetailPanel({ children }: DetailPanelProps) {
  const { detailPanel, closeDetailPanel } = useUIStore()

  return (
    <>
      {detailPanel.isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={closeDetailPanel}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 h-screen w-[420px] bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out',
          detailPanel.isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            {detailPanel.entityType === 'batch' ? '批次详情' : detailPanel.entityType === 'sample' ? '留样详情' : ''}
          </h3>
          <button
            onClick={closeDetailPanel}
            className="p-1 rounded hover:bg-slate-100 transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}
