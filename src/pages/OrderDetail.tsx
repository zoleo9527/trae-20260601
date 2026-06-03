import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import Timeline from '@/components/Timeline'
import type { AnomalyType } from '@/types'

const anomalyTypeLabels: Record<AnomalyType, string> = {
  missing_material: '缺材料',
  timeout: '超时',
  qc_failed: '复核不通过',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentOrder = useAppStore((s) => s.currentOrder)
  const loading = useAppStore((s) => s.loading)
  const fetchOrderDetailAction = useAppStore((s) => s.fetchOrderDetailAction)

  useEffect(() => {
    if (id) {
      fetchOrderDetailAction(id)
    }
  }, [id])

  const handleAnomalyClick = (anomalyId: string) => {
    const el = document.getElementById(`anomaly-${anomalyId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (loading || !currentOrder) {
    return (
      <div className="flex items-center justify-center h-screen bg-factory-bg">
        <div className="text-factory-muted text-sm">加载中...</div>
      </div>
    )
  }

  const activeAnomalies = currentOrder.anomalies.filter((a) => !a.resolvedAt)

  return (
    <div className="min-h-screen bg-factory-bg">
      <div className="border-b border-factory-border bg-factory-surface px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 text-factory-muted hover:text-gray-200 hover:bg-factory-bg rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-mono text-lg text-factory-amber font-medium">{currentOrder.orderNo}</h1>
          <span className="text-sm text-factory-muted">{currentOrder.customerName} · {currentOrder.patientName}</span>
        </div>

        {activeAnomalies.length > 0 && (
          <div className="flex items-center gap-2 mt-3 ml-12">
            {activeAnomalies.map((anomaly) => (
              <button
                key={anomaly.id}
                onClick={() => handleAnomalyClick(anomaly.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-factory-red/15 text-factory-red border border-factory-red/30 rounded-full hover:bg-factory-red/25 transition animate-pulse"
              >
                <AlertTriangle className="w-3 h-3" />
                {anomalyTypeLabels[anomaly.type]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">交接记录</h2>
        <Timeline
          records={currentOrder.handoffs ?? []}
          anomalies={currentOrder.anomalies}
        />
      </div>
    </div>
  )
}
