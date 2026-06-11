import { useEffect, useState } from 'react'
import { X, Building2, MapPin, Tag, Clock, MessageSquare } from 'lucide-react'
import type { Complaint, ComplaintLog } from '../types'
import { COMPLAINT_STATUS_MAP, ACTION_LABEL_MAP } from '../types'

interface ComplaintDrawerProps {
  open: boolean
  complaintId: number | null
  onClose: () => void
}

const LOG_ACTION_COLORS: Record<string, string> = {
  created: 'bg-amber-400',
  processed: 'bg-blue-400',
  resolved: 'bg-emerald-400',
}

export default function ComplaintDrawer({ open, complaintId, onClose }: ComplaintDrawerProps) {
  const [complaint, setComplaint] = useState<(Complaint & { logs?: ComplaintLog[] }) | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && complaintId) {
      setLoading(true)
      fetch(`/api/complaints/${complaintId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setComplaint(json.data)
        })
        .finally(() => setLoading(false))
    } else {
      setComplaint(null)
    }
  }, [open, complaintId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">投诉详情</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        )}

        {!loading && complaint && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-800">{complaint.title}</h3>
                {(() => {
                  const cs = COMPLAINT_STATUS_MAP[complaint.status]
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cs.bg} ${cs.color}`}>
                      {cs.label}
                    </span>
                  )
                })()}
              </div>
              {complaint.category && (
                <div className="flex items-center gap-1 mb-3">
                  <Tag size={12} className="text-slate-400" />
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{complaint.category}</span>
                </div>
              )}
              {complaint.content && (
                <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{complaint.content}</p>
                </div>
              )}
            </div>

            {complaint.result && (
              <div className="px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-0.5">处理结果</p>
                <p className="text-sm text-emerald-800">{complaint.result}</p>
              </div>
            )}

            <div className="px-3 py-3 bg-slate-50/60 rounded-lg border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 mb-2.5">租户信息</h4>
              <div className="space-y-2">
                {complaint.tenantName && (
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-700">{complaint.tenantName}</span>
                  </div>
                )}
                {complaint.tenantShopNo && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">铺位 {complaint.tenantShopNo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>创建：{complaint.createdAt}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>更新：{complaint.updatedAt}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">完整处理时间线</h4>
              {(!complaint.logs || complaint.logs.length === 0) ? (
                <p className="text-sm text-zinc-400 py-4">暂无流转记录</p>
              ) : (
                <div className="relative">
                  {complaint.logs.map((log, index) => (
                    <div key={log.id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${LOG_ACTION_COLORS[log.action] || 'bg-zinc-300'}`}
                        />
                        {index < complaint.logs!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-zinc-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800">
                            {ACTION_LABEL_MAP[log.action] || log.action}
                          </span>
                          <span className="text-xs text-slate-500">{log.operator}</span>
                          <span className="text-xs text-slate-400">{log.createdAt}</span>
                        </div>
                        {log.remark && (
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <MessageSquare size={12} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-600">{log.remark}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
