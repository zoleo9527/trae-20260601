import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReturnStore } from '@/store/returnStore'
import Sidebar from '@/components/Sidebar'
import StatusBadge from '@/components/StatusBadge'
import ActionPanel from '@/components/ActionPanel'
import { ArrowLeft, Clock, User, RotateCcw } from 'lucide-react'

const actionColors: Record<string, string> = {
  '创建退回单': 'border-blue-400 bg-blue-50',
  '派件员确认': 'border-green-400 bg-green-50',
  '补充说明': 'border-amber-400 bg-amber-50',
  '驿站认定通过': 'border-emerald-400 bg-emerald-50',
  '驿站驳回': 'border-red-400 bg-red-50',
  '派件员驳回至客服': 'border-amber-400 bg-amber-50',
  '客服补录': 'border-orange-400 bg-orange-50',
  '开始复盘': 'border-purple-400 bg-purple-50',
  '追加复盘': 'border-purple-400 bg-purple-50',
}

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentReturn, loading, fetchReturnDetail } = useReturnStore()

  useEffect(() => {
    if (id) fetchReturnDetail(Number(id))
  }, [id])

  if (loading && !currentReturn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="lg:ml-60 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  if (!currentReturn) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="lg:ml-60 min-h-screen flex items-center justify-center">
          <p className="text-slate-500">未找到退回件信息</p>
        </main>
      </div>
    )
  }

  const showReviewSection = ['退回处理完成', '复盘进行中', '复盘完成'].includes(currentReturn.status) || currentReturn.reviews.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </button>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentReturn.trackingNo}</h2>
                  <StatusBadge status={currentReturn.status} />
                </div>
                <p className="text-sm text-slate-600 mb-1">{currentReturn.reason}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                创建人: {currentReturn.createdByName || currentReturn.createdBy}
              </span>
              {currentReturn.assignedToName && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  当前处理人: {currentReturn.assignedToName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                创建时间: {currentReturn.createdAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                更新时间: {currentReturn.updatedAt}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-5">处理记录</h3>
                {currentReturn.logs.length === 0 ? (
                  <p className="text-sm text-slate-400">暂无处理记录</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
                    <div className="space-y-0">
                      {currentReturn.logs.map((log, idx) => (
                        <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                          <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              log.action.includes('驳回') ? 'bg-red-500' :
                              log.action.includes('确认') || log.action.includes('通过') ? 'bg-green-500' :
                              log.action.includes('复盘') ? 'bg-purple-500' :
                              'bg-blue-500'
                            }`} />
                          </div>
                          <div className={`flex-1 rounded-lg border-l-4 p-4 ${actionColors[log.action] || 'border-slate-300 bg-slate-50'}`}>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-sm font-semibold text-slate-800">{log.action}</span>
                              {log.fromStatus && (
                                <span className="text-xs text-slate-500">
                                  {log.fromStatus} → {log.toStatus}
                                </span>
                              )}
                              {!log.fromStatus && (
                                <span className="text-xs text-slate-500">→ {log.toStatus}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.operatorName}（{log.operatorRole}）
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.createdAt}
                              </span>
                            </div>
                            {log.remark && (
                              <p className="mt-2 text-sm text-slate-600 bg-white/60 rounded px-3 py-1.5">
                                {log.remark}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {showReviewSection && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <RotateCcw className="w-5 h-5 text-purple-500" />
                    责任复盘
                    {currentReturn.reviews.length > 0 && (
                      <span className="text-xs font-normal text-slate-400">({currentReturn.reviews.length} 条)</span>
                    )}
                  </h3>
                  {currentReturn.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {currentReturn.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {review.operatorName}（{review.operatorRole}）
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {review.createdAt}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-sm text-slate-800">
                              <span className="font-medium">结论：</span>{review.conclusion}
                            </p>
                            {review.improvement && (
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">改进：</span>{review.improvement}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      {currentReturn.status === '退回处理完成'
                        ? '退回处理已完成，驿站负责人可在操作面板中发起复盘'
                        : '暂无复盘记录'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <ActionPanel returnItem={currentReturn} onAction={() => {
                if (id) fetchReturnDetail(Number(id))
              }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
