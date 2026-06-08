import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { formatTime } from '@/components/Timeline'
import { RefreshCw, Filter, Plus, X, AlertTriangle } from 'lucide-react'

interface Recovery {
  id: number
  room_id: number
  room_number: string
  status: string
  cleaner_id: number | null
  cleaner_name: string | null
  supervisor_id: number | null
  supervisor_name: string | null
  created_at: string
  clean_completed_at: string | null
  inspected_at: string | null
  completed_at: string | null
  last_reject_note: string | null
  last_reject_at: string | null
  last_reject_by: string | null
}

interface Room {
  id: number
  room_number: string
  floor: number
  status: string
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending_clean', label: '待保洁' },
  { value: 'pending_inspect', label: '待检查' },
  { value: 'recovered', label: '已恢复' },
]

export default function Recovery() {
  const [flows, setFlows] = useState<Recovery[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  const [showDialog, setShowDialog] = useState(false)
  const [dialogRooms, setDialogRooms] = useState<Room[]>([])
  const [dialogActiveRoomIds, setDialogActiveRoomIds] = useState<Set<number>>(new Set())
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogSubmitting, setDialogSubmitting] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  const fetchFlows = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    api.get<Recovery[]>(`/recovery?${params.toString()}`)
      .then(setFlows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    fetchFlows()
  }, [fetchFlows])

  const openDialog = async () => {
    setShowDialog(true)
    setDialogLoading(true)
    setDialogError('')
    setSelectedRoomId(null)
    try {
      const [rooms, activeFlows] = await Promise.all([
        api.get<Room[]>('/rooms'),
        api.get<Recovery[]>('/recovery'),
      ])
      const eligible = rooms.filter((r) => r.status === 'cleaning' || r.status === 'repair')
      const activeRoomIds = new Set(
        activeFlows
          .filter((f) => f.status === 'pending_clean' || f.status === 'pending_inspect')
          .map((f) => f.room_id)
      )
      setDialogRooms(eligible)
      setDialogActiveRoomIds(activeRoomIds)
    } catch {
      setDialogError('加载房间列表失败')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleDialogSubmit = async () => {
    if (!selectedRoomId) return
    setDialogSubmitting(true)
    setDialogError('')
    try {
      await api.post('/recovery', { room_id: selectedRoomId })
      setShowDialog(false)
      fetchFlows()
    } catch (err: any) {
      setDialogError(err.message || '创建失败')
    } finally {
      setDialogSubmitting(false)
    }
  }

  const pendingClean = flows.filter((f) => f.status === 'pending_clean').length
  const pendingInspect = flows.filter((f) => f.status === 'pending_inspect').length
  const canCreate = user?.role === 'cleaner'

  const availableRooms = dialogRooms.filter((r) => !dialogActiveRoomIds.has(r.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#e4e6eb]">房态恢复</h1>
          <p className="text-[12px] text-[#6b7084] mt-0.5">
            {user?.role === 'cleaner' ? '你负责的恢复流程' : user?.role === 'supervisor' ? '待你检查的恢复流程' : '全部恢复流程'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={openDialog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e8723a] text-white text-[12px] font-medium hover:bg-[#d4662f] transition-colors"
            >
              <Plus size={13} />
              新建恢复
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-[#6b7084]" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#151822] border border-[#2a2f42] rounded-md text-[12px] text-[#e4e6eb] px-2 py-1.5 focus:outline-none focus:border-[#e8723a]/50"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchFlows}
            className="p-1.5 rounded-md bg-[#151822] border border-[#2a2f42] text-[#6b7084] hover:text-[#e4e6eb] transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-yellow-400">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          待保洁 {pendingClean}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-orange-400">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          待检查 {pendingInspect}
        </div>
      </div>

      {loading ? (
        <div className="text-[#6b7084] text-sm py-10 text-center">加载中...</div>
      ) : flows.length === 0 ? (
        <div className="text-[#4a4e5e] text-sm py-10 text-center">暂无恢复流程</div>
      ) : (
        <div className="space-y-2.5">
          {flows.map((f) => (
            <Link
              key={f.id}
              to={`/recovery/${f.id}`}
              className={`flex items-center justify-between bg-[#151822] rounded-lg border p-4 hover:bg-[#1a1d28] transition-colors group ${
                f.last_reject_note ? 'border-red-500/30 hover:border-red-500/50' : 'border-[#1e2230] hover:border-[#2a2f42]'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-mono font-semibold text-[#e4e6eb]">{f.room_number}</span>
                    <StatusBadge status={f.status} type="recovery" />
                    {f.last_reject_note && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/25">
                        <AlertTriangle size={10} />
                        驳回
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6b7084]">
                    {f.cleaner_name && <span>保洁: {f.cleaner_name}</span>}
                    {f.supervisor_name && (
                      <>
                        <span>·</span>
                        <span>主管: {f.supervisor_name}</span>
                      </>
                    )}
                  </div>
                  {f.last_reject_note && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                      <AlertTriangle size={10} className="text-red-400 flex-shrink-0" />
                      <span className="text-red-400/80 truncate">
                        {f.last_reject_by}驳回：{f.last_reject_note}
                      </span>
                      {f.last_reject_at && (
                        <span className="text-red-400/50 flex-shrink-0">{formatTime(f.last_reject_at)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <div className="text-[11px] text-[#4a4e5e]">{formatTime(f.created_at)}</div>
                <div className="text-[#4a4e5e] group-hover:text-[#e8723a] transition-colors">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDialog(false)}>
          <div
            className="bg-[#151822] rounded-lg border border-[#2a2f42] w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2230]">
              <h3 className="text-[14px] font-semibold text-[#e4e6eb]">新建恢复流程</h3>
              <button onClick={() => setShowDialog(false)} className="text-[#6b7084] hover:text-[#e4e6eb] transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              {dialogError && (
                <div className="mb-3 p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
                  {dialogError}
                </div>
              )}

              {dialogLoading ? (
                <div className="text-[#6b7084] text-sm py-6 text-center">加载房间列表...</div>
              ) : availableRooms.length === 0 ? (
                <div className="text-[#6b7084] text-sm py-6 text-center">
                  当前没有可创建恢复流程的房间
                  <div className="text-[11px] text-[#4a4e5e] mt-1">仅清洁中或维修中的房间可创建恢复流程</div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  <div className="text-[11px] text-[#6b7084] mb-2">
                    选择需要恢复房态的房间（{availableRooms.length} 间可选）
                  </div>
                  {availableRooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoomId(r.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] border transition-colors ${
                        selectedRoomId === r.id
                          ? 'bg-[#e8723a]/15 border-[#e8723a]/40 text-[#e8723a]'
                          : 'bg-[#0d0f14] border-[#2a2f42] text-[#e4e6eb] hover:border-[#3a3f52]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-medium">{r.room_number}</span>
                        <span className="text-[11px] text-[#6b7084]">{r.floor}F</span>
                      </div>
                      <StatusBadge status={r.status} type="room" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#1e2230]">
              <button
                onClick={() => setShowDialog(false)}
                className="px-3.5 py-1.5 rounded-md text-[12px] text-[#8b8fa3] bg-[#0d0f14] border border-[#2a2f42] hover:text-[#e4e6eb] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDialogSubmit}
                disabled={!selectedRoomId || dialogSubmitting}
                className="px-3.5 py-1.5 rounded-md text-[12px] font-medium bg-[#e8723a] text-white hover:bg-[#d4662f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {dialogSubmitting ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
