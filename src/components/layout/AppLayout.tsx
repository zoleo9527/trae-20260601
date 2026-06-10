import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import Sidebar from './Sidebar'
import DetailPanel from './DetailPanel'
import BatchDetail from '@/components/batch/BatchDetail'
import SampleDetail from '@/components/sample/SampleDetail'

export default function AppLayout() {
  const { sidebarCollapsed, detailPanel } = useUIStore()

  const detailContent = (() => {
    if (!detailPanel.isOpen || !detailPanel.entityId) return null
    if (detailPanel.entityType === 'batch') return <BatchDetail batchId={detailPanel.entityId} />
    if (detailPanel.entityType === 'sample') return <SampleDetail sampleId={detailPanel.entityId} />
    return null
  })()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <DetailPanel>
        {detailContent}
      </DetailPanel>
    </div>
  )
}
