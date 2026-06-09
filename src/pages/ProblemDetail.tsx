import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProblemsStore } from '@/stores/problems'
import { type CauseChainItem } from '@/lib/api'
import { ArrowLeft, Calendar, FileEdit, XCircle, CheckCircle, ShieldCheck, Circle, ArrowRight } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  misplaced: '错放箱',
  overdue: '超期堆存',
  missed_notify: '查验漏通知',
  detained: '海关扣留',
  stuck_inspecting: '查验停滞',
  stuck_move: '移箱超时',
  expiring_soon: '免堆期预警',
  no_inspection: '无查验计划',
  yard_stagnation: '查验后滞留',
}

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  rescheduled: '已改期',
  supplemented: '已补录',
  rejected: '已驳回',
  resolved: '已解决',
}

const CHAIN_EVENT_LABELS: Record<string, { label: string; color: string }> = {
  container_entered: { label: '进场', color: 'bg-portBlue' },
  free_storage_set: { label: '免堆期', color: 'bg-blue-400' },
  free_storage_expired: { label: '已超期', color: 'bg-red-500' },
  no_inspection: { label: '无查验', color: 'bg-red-400' },
  no_inspection_plan: { label: '无查验计划', color: 'bg-red-400' },
  inspection_planned: { label: '查验计划', color: 'bg-green-500' },
  inspection_executed: { label: '执行查验', color: 'bg-green-400' },
  inspection_result: { label: '查验结果', color: 'bg-green-600' },
  inspection_stalled: { label: '查验停滞', color: 'bg-amber-500' },
  inspection_released: { label: '查验放行', color: 'bg-green-500' },
  no_notify: { label: '未通知', color: 'bg-red-400' },
  risk: { label: '风险', color: 'bg-red-500' },
  no_supplement: { label: '未补证', color: 'bg-red-400' },
  no_exit_plan: { label: '无出场计划', color: 'bg-amber-500' },
  inspection_blocking: { label: '查验阻塞', color: 'bg-amber-500' },
  storage_pressure: { label: '堆存压力', color: 'bg-amber-500' },
  gate_register: { label: '闸口登记', color: 'bg-portBlue' },
  no_move_task: { label: '无移箱记录', color: 'bg-red-400' },
  position_mismatch: { label: '堆位不一致', color: 'bg-red-500' },
  move_task_created: { label: '移箱创建', color: 'bg-purple-500' },
  move_pending: { label: '待移箱', color: 'bg-purple-400' },
  move_pending_timeout: { label: '移箱超时', color: 'bg-red-400' },
  move_completed: { label: '移箱完成', color: 'bg-green-500' },
  inspection_completed: { label: '查验完成', color: 'bg-green-500' },
  stuck: { label: '停滞', color: 'bg-red-500' },
  timeout: { label: '超时', color: 'bg-red-400' },
}

function parseCauseChain(raw: string | undefined | null): CauseChainItem[] {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { current, fetchProblem, takeAction, resolve } = useProblemsStore()
  const [actionType, setActionType] = useState<'reschedule' | 'supplement' | 'reject' | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [supplementData, setSupplementData] = useState('')
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (id) fetchProblem(Number(id))
  }, [id, fetchProblem])

  if (!current) {
    return (
      <div className="p-6 text-center text-slate-400 py-20">
        加载中...
      </div>
    )
  }

  const { problem, container, inspection, moveTask, relatedLogs } = current
  const isOpen = problem.status === 'open'
  const canResolve = problem.status !== 'rejected' && problem.status !== 'resolved'
  const chain = parseCauseChain(problem.cause_chain)

  const handleSubmit = async () => {
    if (!actionType) return
    setSubmitting(true)
    try {
      let data: Record<string, unknown> = {}
      if (actionType === 'reschedule') {
        data = { planned_at: rescheduleDate }
      } else if (actionType === 'supplement') {
        try {
          data = JSON.parse(supplementData)
        } catch {
          data = { note: supplementData }
        }
      }
      await takeAction(problem.id, { action: actionType, data, remark })
      await fetchProblem(problem.id)
      setActionType(null)
      setRescheduleDate('')
      setSupplementData('')
      setRemark('')
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      await resolve(problem.id)
      await fetchProblem(problem.id)
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/service/problems')}
        className="flex items-center gap-1 text-slate-500 hover:text-portNavy mb-4 text-sm"
      >
        <ArrowLeft size={16} />
        返回问题单列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-portNavy">{problem.container_no}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  problem.type === 'overdue' ? 'bg-red-100 text-red-700' :
                  problem.type === 'misplaced' ? 'bg-orange-100 text-orange-700' :
                  problem.type === 'detained' ? 'bg-red-100 text-red-700' :
                  problem.type === 'stuck_inspecting' ? 'bg-amber-100 text-amber-700' :
                  problem.type === 'stuck_move' ? 'bg-purple-100 text-purple-700' :
                  problem.type === 'expiring_soon' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {TYPE_LABELS[problem.type]}
                </span>
                {problem.severity === 'critical' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">严重</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">预警</span>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                problem.status === 'open' ? 'bg-red-100 text-red-700' :
                problem.status === 'resolved' ? 'bg-green-100 text-green-700' :
                problem.status === 'rejected' ? 'bg-slate-100 text-slate-500' :
                problem.status === 'rescheduled' ? 'bg-blue-100 text-blue-700' :
                problem.status === 'supplemented' ? 'bg-purple-100 text-purple-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {STATUS_LABELS[problem.status]}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-slate-400 w-24 shrink-0">问题描述</span>
                <span className="text-portNavy">{problem.description}</span>
              </div>
              {problem.cause && (
                <div className="flex gap-3">
                  <span className="text-slate-400 w-24 shrink-0">原因</span>
                  <span className="text-red-600">{problem.cause}</span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="text-slate-400 w-24 shrink-0">发现时间</span>
                <span className="text-portNavy">{problem.detected_at?.slice(0, 16).replace('T', ' ')}</span>
              </div>
              {problem.resolved_at && (
                <div className="flex gap-3">
                  <span className="text-slate-400 w-24 shrink-0">处理时间</span>
                  <span className="text-green-600">{problem.resolved_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
              )}
              {problem.action_data && problem.action_data !== '{}' && (
                <div className="flex gap-3">
                  <span className="text-slate-400 w-24 shrink-0">操作数据</span>
                  <span className="text-portNavy font-mono text-xs">{problem.action_data}</span>
                </div>
              )}
            </div>
          </div>

          {chain.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-100 p-5">
              <h3 className="font-bold text-portNavy mb-4">因果链追溯</h3>
              <p className="text-xs text-slate-400 mb-4">从进场到卡住的完整事件链，解释为什么该单子变成了问题单</p>
              <div className="relative">
                {chain.map((item, idx) => {
                  const eventMeta = CHAIN_EVENT_LABELS[item.event] || { label: item.event, color: 'bg-slate-400' }
                  const isLast = idx === chain.length - 1
                  const isRisk = item.event === 'risk' || item.event === 'free_storage_expired' || item.event === 'position_mismatch' || item.event === 'stuck' || item.event === 'timeout' || item.event === 'no_supplement'
                  return (
                    <div key={idx} className="flex gap-4 pb-4 relative">
                      {idx < chain.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
                      )}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${eventMeta.color} text-white z-10`}>
                        {isRisk ? (
                          <span className="text-[10px] font-bold">!</span>
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${eventMeta.color} text-white`}>
                            {eventMeta.label}
                          </span>
                          <span className="text-xs text-slate-400">{item.time?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p className={`text-sm mt-1 ${isRisk ? 'text-red-600 font-medium' : 'text-slate-600'}`}>{item.detail}</p>
                      </div>
                      {idx < chain.length - 1 && (
                        <div className="absolute left-[11px] bottom-0 translate-y-1/2 z-10">
                          <ArrowRight size={10} className="text-slate-300 -rotate-90" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {problem.status === 'rescheduled' && problem.action_data && problem.action_data !== '{}' && (
            <div className="bg-white rounded-lg border border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-blue-500" />
                <h3 className="font-bold text-portNavy">改期结果</h3>
              </div>
              {(() => {
                try {
                  const ad = JSON.parse(problem.action_data)
                  return (
                    <div className="space-y-2 text-sm">
                      {ad.rescheduled_at && (
                        <div className="flex gap-3">
                          <span className="text-slate-400 w-24 shrink-0">新计划时间</span>
                          <span className="text-blue-700 font-medium">{String(ad.rescheduled_at).slice(0, 16).replace('T', ' ')}</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <span className="text-slate-400 w-24 shrink-0">改期时间</span>
                        <span className="text-portNavy">{problem.updated_at?.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                    </div>
                  )
                } catch {
                  return <div className="text-sm text-slate-500">{problem.action_data}</div>
                }
              })()}
            </div>
          )}

          {problem.status === 'supplemented' && problem.action_data && problem.action_data !== '{}' && (
            <div className="bg-white rounded-lg border border-purple-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileEdit size={18} className="text-purple-500" />
                <h3 className="font-bold text-portNavy">补录数据</h3>
              </div>
              {(() => {
                try {
                  const ad = JSON.parse(problem.action_data)
                  return (
                    <div className="space-y-2 text-sm">
                      {Object.entries(ad).map(([key, value]) => (
                        <div key={key} className="flex gap-3">
                          <span className="text-slate-400 w-24 shrink-0">{key}</span>
                          <span className="text-purple-700">{String(value)}</span>
                        </div>
                      ))}
                      <div className="flex gap-3">
                        <span className="text-slate-400 w-24 shrink-0">补录时间</span>
                        <span className="text-portNavy">{problem.updated_at?.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                    </div>
                  )
                } catch {
                  return <div className="text-sm text-slate-500">{problem.action_data}</div>
                }
              })()}
            </div>
          )}

          {problem.status === 'rejected' && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-500">已驳回</h3>
              </div>
              <div className="text-sm text-slate-500">
                该问题单已于 {problem.resolved_at?.slice(0, 16).replace('T', ' ')} 被驳回
              </div>
            </div>
          )}

          {isOpen && (
            <div className="bg-white rounded-lg border border-slate-100 p-5">
              <h3 className="font-bold text-portNavy mb-4">处理操作</h3>

              {!actionType ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionType('reschedule')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-portBlue text-white rounded-lg text-sm font-medium hover:bg-portBlue/90"
                  >
                    <Calendar size={16} />
                    改期
                  </button>
                  <button
                    onClick={() => setActionType('supplement')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-portOrange text-white rounded-lg text-sm font-medium hover:bg-portOrange/90"
                  >
                    <FileEdit size={16} />
                    补录
                  </button>
                  <button
                    onClick={() => setActionType('reject')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    <XCircle size={16} />
                    驳回
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-portNavy">
                    {actionType === 'reschedule' ? '改期操作' : actionType === 'supplement' ? '补录操作' : '驳回操作'}
                  </div>

                  {actionType === 'reschedule' && (
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">新计划时间</label>
                      <input
                        type="datetime-local"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
                      />
                    </div>
                  )}

                  {actionType === 'supplement' && (
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">补录数据 (JSON 或文本)</label>
                      <textarea
                        value={supplementData}
                        onChange={(e) => setSupplementData(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 h-24"
                        placeholder='如: {"note": "补充说明"}'
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">备注</label>
                    <input
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
                      placeholder="操作备注..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || (actionType === 'reschedule' && !rescheduleDate)}
                      className="px-4 py-2 bg-portOrange text-white rounded-lg text-sm font-medium hover:bg-portOrange/90 disabled:opacity-50"
                    >
                      {submitting ? '处理中...' : '确认'}
                    </button>
                    <button
                      onClick={() => { setActionType(null); setRemark('') }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {canResolve && !isOpen && (
            <div className="bg-white rounded-lg border border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-portNavy">标记解决</h3>
                  <p className="text-sm text-slate-500 mt-1">确认该问题已处理完成</p>
                </div>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  {resolving ? '处理中...' : '标记解决'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-100 p-5">
            <h3 className="font-bold text-portNavy mb-3">关联集装箱</h3>
            {container ? (
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">箱号</span>
                  <span className="text-portNavy font-medium">{(container as any).container_no}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">船名</span>
                  <span className="text-portNavy">{(container as any).vessel}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">堆位</span>
                  <span className="text-portNavy font-mono">{(container as any).yard_slot}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">状态</span>
                  <span className="text-portNavy">{(container as any).status}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">进场</span>
                  <span className="text-portNavy">{(container as any).entered_at?.slice(0, 10)}</span>
                </div>
                {(container as any).free_storage_until && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-16 shrink-0">免堆期</span>
                    <span className={`${new Date((container as any).free_storage_until) < new Date() ? 'text-red-600' : 'text-portNavy'}`}>
                      {(container as any).free_storage_until?.slice(0, 10)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400">无关联集装箱信息</div>
            )}
          </div>

          {inspection && (
            <div className="bg-white rounded-lg border border-slate-100 p-5">
              <h3 className="font-bold text-portNavy mb-3">关联查验</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">类型</span>
                  <span className="text-portNavy">{(inspection as any).type}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">状态</span>
                  <span className="text-portNavy">{(inspection as any).status}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">计划</span>
                  <span className="text-portNavy">{(inspection as any).planned_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                {(inspection as any).result && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-16 shrink-0">结果</span>
                    <span className="text-portNavy">{(inspection as any).result}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {moveTask && (
            <div className="bg-white rounded-lg border border-slate-100 p-5">
              <h3 className="font-bold text-portNavy mb-3">关联移箱</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">路线</span>
                  <span className="text-portNavy font-mono">{(moveTask as any).from_slot} → {(moveTask as any).to_slot}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">状态</span>
                  <span className="text-portNavy">{(moveTask as any).status}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-16 shrink-0">原因</span>
                  <span className="text-portNavy">{(moveTask as any).reason}</span>
                </div>
              </div>
            </div>
          )}

          {relatedLogs && (relatedLogs as any[]).length > 0 && (
            <div className="bg-white rounded-lg border border-slate-100 p-5">
              <h3 className="font-bold text-portNavy mb-3">近期操作记录</h3>
              <div className="space-y-2">
                {(relatedLogs as any[]).slice(0, 5).map((log, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{log.created_at?.slice(0, 16).replace('T', ' ')}</span>
                      <span className="text-portNavy font-medium">{log.action}</span>
                    </div>
                    {log.detail && <p className="text-slate-500 mt-0.5">{log.detail}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
