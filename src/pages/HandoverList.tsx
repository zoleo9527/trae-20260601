import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRightLeft, ClipboardCheck, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import { useHandoverStore } from '@/stores/handoverStore'
import { useAuthStore } from '@/stores/authStore'

interface HandoverItem {
  id: number
  status: string
  from_user_id: number
  to_user_id: number
  from_user_name?: string
  to_user_name?: string
  handover_date?: string
  summary?: string
  key_notes?: string
  pending_visits_count?: number
  active_recalls_count?: number
  confirmed_at?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', className: 'bg-green-100 text-green-700' },
}

export default function HandoverList() {
  const navigate = useNavigate()
  const handovers = useHandoverStore((s) => s.handovers)
  const loading = useHandoverStore((s) => s.loading)
  const fetchHandovers = useHandoverStore((s) => s.fetchHandovers)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    fetchHandovers()
  }, [fetchHandovers])

  const items = handovers as unknown as HandoverItem[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ArrowRightLeft size={24} className="text-orange-600" />
          <h1 className="text-xl font-bold text-gray-800">交班中心</h1>
        </div>
        <button
          onClick={() => navigate('/handovers/new')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          创建交班
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <ArrowRightLeft size={40} className="mb-3 opacity-30" />
          <p>暂无交班记录</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((h) => {
            const statusCfg = STATUS_CONFIG[h.status] ?? {
              label: h.status,
              className: 'bg-gray-100 text-gray-700',
            }
            return (
              <div
                key={h.id}
                onClick={() => navigate(`/handovers/${h.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {h.from_user_name ?? `用户${h.from_user_id}`}
                    </span>
                    <ArrowRightLeft size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">
                      {h.to_user_name ?? `用户${h.to_user_id}`}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusCfg.className}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                {h.handover_date && (
                  <p className="text-xs text-gray-400 mb-3">
                    {dayjs(h.handover_date).format('YYYY-MM-DD')}
                  </p>
                )}

                {h.summary && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {h.summary}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {h.pending_visits_count != null && (
                    <span className="flex items-center gap-1">
                      <ClipboardCheck size={14} className="text-amber-500" />
                      待处理回访: {h.pending_visits_count} 条
                    </span>
                  )}
                  {h.active_recalls_count != null && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={14} className="text-red-500" />
                      进行中异常收回: {h.active_recalls_count} 条
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
