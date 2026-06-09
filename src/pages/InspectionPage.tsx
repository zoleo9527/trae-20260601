import { moveTaskApi, problemApi, type MoveTask, type ProblemOrder } from '@/lib/api'
import { useContainersStore } from '@/stores/containers'
import { useInspectionsStore } from '@/stores/inspections'
import { useMoveTasksStore } from '@/stores/move-tasks'
import { AlertTriangle, ArrowRight, CheckCircle, ChevronRight, Clock, MessageSquare, Plus, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEP_LABELS: Record<string, string> = {
  open_box: '开箱',
  unpack: '掏箱',
  repack: '复箱',
  result: '录入结果',
}

const STEP_ORDER = ['open_box', 'unpack', 'repack', 'result']

const STATUS_LABELS: Record<string, string> = {
  planned: '已计划',
  notified: '已通知',
  executing: '执行中',
  completed: '已完成',
}

const TYPE_LABELS: Record<string, string> = {
  open: '开箱查验',
  full: '全查验',
  random: '抽查',
}

const RESULT_LABELS: Record<string, string> = {
  released: '放行',
  abnormal: '查验异常',
  detained: '扣留',
}

const RESULT_COLORS: Record<string, string> = {
  released: 'text-green-600',
  abnormal: 'text-orange-600',
  detained: 'text-red-600',
}

const PROBLEM_TYPE_LABELS: Record<string, string> = {
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

const MOVE_STATUS_LABELS: Record<string, string> = {
  pending: '待执行',
  in_progress: '执行中',
  completed: '已完成',
}

export default function InspectionPage() {
  const { inspections, loading, fetchInspections, executeInspection, notifyInspection, createInspection } = useInspectionsStore()
  const { containers, fetchContainers } = useContainersStore()
  const { executeTask } = useMoveTasksStore()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ container_id: 0, type: 'open' as 'open' | 'full' | 'random', planned_at: '' })
  const [releasedInspectionId, setReleasedInspectionId] = useState<number | null>(null)
  const [inspectionProblems, setInspectionProblems] = useState<Record<number, ProblemOrder[]>>({})
  const [inspectionMoveTasks, setInspectionMoveTasks] = useState<Record<number, MoveTask[]>>({})
  const [allOpenProblems, setAllOpenProblems] = useState<ProblemOrder[]>([])

  const loadInspectionContext = async () => {
    fetchInspections(statusFilter ? { status: statusFilter } : undefined)
    fetchContainers({ size: 200 })
    try {
      const problems = await problemApi.list({ status: 'open' })
      setAllOpenProblems(problems)
      const byInsp: Record<number, ProblemOrder[]> = {}
      for (const p of problems) {
        if (p.inspection_id) {
          if (!byInsp[p.inspection_id]) byInsp[p.inspection_id] = []
          byInsp[p.inspection_id].push(p)
        }
      }
      setInspectionProblems(byInsp)
    } catch {}
    try {
      const moveTasks = await moveTaskApi.list()
      const byInsp: Record<number, MoveTask[]> = {}
      for (const mt of moveTasks) {
        if (mt.source_inspection_id) {
          if (!byInsp[mt.source_inspection_id]) byInsp[mt.source_inspection_id] = []
          byInsp[mt.source_inspection_id].push(mt)
        }
      }
      setInspectionMoveTasks(byInsp)
    } catch {}
  }

  useEffect(() => {
    loadInspectionContext()
  }, [fetchInspections, fetchContainers, statusFilter])

  const selected = inspections.find((i) => i.id === selectedId)
  const selectedProblems = selectedId ? (inspectionProblems[selectedId] || []) : []
  const selectedMoveTasks = selectedId ? (inspectionMoveTasks[selectedId] || []) : []

  const handleStep = async (inspectionId: number, step: string, result?: 'released' | 'abnormal' | 'detained') => {
    await executeInspection(inspectionId, { step: step as 'open_box' | 'unpack' | 'repack' | 'result', result })
    if (step === 'result' && result === 'released') {
      setReleasedInspectionId(inspectionId)
    }
    loadInspectionContext()
  }

  const handleNotify = async (inspectionId: number, method: 'sms' | 'email' | 'phone') => {
    await notifyInspection(inspectionId, { method })
    loadInspectionContext()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.container_id || !createForm.planned_at) return
    await createInspection({
      containerId: createForm.container_id,
      type: createForm.type,
      plannedAt: createForm.planned_at,
    })
    setShowCreate(false)
    setCreateForm({ container_id: 0, type: 'full', planned_at: '' })
    loadInspectionContext()
  }

  const handleMoveAction = async (taskId: number, action: 'start' | 'complete') => {
    await executeTask(taskId, { action })
    loadInspectionContext()
  }

  const getStepIndex = (step: string) => STEP_ORDER.indexOf(step)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-portNavy">海关查验</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 bg-portOrange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-portOrange/90 transition-colors"
        >
          <Plus size={16} />
          新建查验
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-slate-100 p-5 mb-6">
          <h2 className="font-bold text-portNavy mb-4">新建查验计划</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">集装箱</label>
              <select
                value={createForm.container_id}
                onChange={(e) => setCreateForm({ ...createForm, container_id: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
                required
              >
                <option value={0}>选择集装箱</option>
                {containers.filter((c) => !inspections.some((i) => i.container_id === c.id && i.status !== 'completed')).map((c) => (
                  <option key={c.id} value={c.id}>{c.container_no} ({c.yard_slot || '未分配'}) [{c.status}]</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">查验类型</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as 'open' | 'full' | 'random' })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
              >
                <option value="open">开箱查验</option>
                <option value="full">全查验</option>
                <option value="random">抽查</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">计划时间</label>
              <input
                type="datetime-local"
                value={createForm.planned_at}
                onChange={(e) => setCreateForm({ ...createForm, planned_at: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-portOrange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-portOrange/90">
              创建
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm">
              取消
            </button>
          </div>
        </form>
      )}

      {allOpenProblems.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-red-700 text-sm font-medium">
              当前有 {allOpenProblems.length} 条卡住单据
            </span>
            <div className="flex gap-2 ml-2">
              {Object.entries(
                allOpenProblems.reduce<Record<string, number>>((acc, p) => {
                  acc[p.type] = (acc[p.type] || 0) + 1
                  return acc
                }, {})
              ).map(([type, count]) => (
                <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  {PROBLEM_TYPE_LABELS[type] || type} {count}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('/service/problems')}
              className="ml-auto text-red-600 text-sm font-medium hover:text-red-700"
            >
              查看问题单 →
            </button>
          </div>
        </div>
      )}

      {releasedInspectionId && (
        <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Truck size={18} className="text-blue-500" />
          <span className="text-blue-700 text-sm font-medium">查验放行，已自动创建移箱任务</span>
          <button
            onClick={() => { setReleasedInspectionId(null); navigate('/dispatch/move-tasks') }}
            className="text-blue-600 text-sm font-medium hover:text-blue-700 underline"
          >
            查看移箱任务 →
          </button>
          <button
            onClick={() => setReleasedInspectionId(null)}
            className="ml-auto text-blue-400 hover:text-blue-600 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['', 'planned', 'notified', 'executing', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === s ? 'bg-portNavy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === '' ? '全部' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-50">
            {loading ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">加载中...</div>
            ) : inspections.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无查验记录</div>
            ) : (
              inspections.map((insp) => {
                const problems = inspectionProblems[insp.id] || []
                const hasProblems = problems.length > 0
                return (
                  <button
                    key={insp.id}
                    onClick={() => setSelectedId(insp.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors relative ${
                      selectedId === insp.id ? 'bg-portBlue/5 border-l-2 border-l-portBlue' :
                      hasProblems ? 'border-l-2 border-l-red-400 bg-red-50/30' :
                      insp.status === 'planned' && !insp.notified_at ? 'border-l-2 border-l-yellow-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-portNavy">{insp.container_no || `箱#${insp.container_id}`}</span>
                        {hasProblems && (
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            <AlertTriangle size={10} />
                            {problems.length}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        insp.status === 'completed' ? 'bg-green-100 text-green-700' :
                        insp.status === 'executing' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {STATUS_LABELS[insp.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{TYPE_LABELS[insp.type]}</span>
                      <span>·</span>
                      <span>{insp.planned_at?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    {insp.result && (
                      <div className={`text-xs mt-1 font-medium ${RESULT_COLORS[insp.result]}`}>
                        {RESULT_LABELS[insp.result]}
                      </div>
                    )}
                    {hasProblems && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {problems.map((p) => (
                          <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                            {PROBLEM_TYPE_LABELS[p.type] || p.type}
                          </span>
                        ))}
                      </div>
                    )}
                    {insp.status === 'planned' && !insp.notified_at && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                        <MessageSquare size={10} />
                        <span>未通知客户</span>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-portNavy">{selected.container_no || `箱#${selected.container_id}`}</h2>
                    <div className="text-sm text-slate-500 mt-1">
                      {TYPE_LABELS[selected.type]} · 计划时间: {selected.planned_at?.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selected.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selected.status === 'executing' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>

                {selected.status !== 'completed' && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-portNavy mb-3">查验步骤</h3>
                    <div className="flex items-center gap-1">
                      {STEP_ORDER.map((step, idx) => {
                        const currentIdx = getStepIndex(selected.step)
                        const isDone = idx < currentIdx || (selected.status === 'completed')
                        const isCurrent = idx === currentIdx && selected.status === 'executing'
                        const isNext = idx === currentIdx && selected.status !== 'completed'

                        return (
                          <div key={step} className="flex items-center">
                            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${
                              isDone ? 'bg-green-50 text-green-700' :
                              isCurrent ? 'bg-portBlue/10 text-portBlue font-medium ring-2 ring-portBlue/30' :
                              isNext ? 'bg-slate-50 text-slate-500' :
                              'bg-slate-50 text-slate-300'
                            }`}>
                              {isDone ? <CheckCircle size={14} /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                              {STEP_LABELS[step]}
                            </div>
                            {idx < STEP_ORDER.length - 1 && <ChevronRight size={14} className="text-slate-300 mx-1" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selected.status === 'completed' && selected.result && (
                  <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <h3 className="text-sm font-bold text-portNavy mb-2">查验结果</h3>
                    <div className={`text-lg font-bold ${RESULT_COLORS[selected.result]}`}>
                      {RESULT_LABELS[selected.result]}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      完成时间: {selected.completed_at?.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selected.status === 'planned' && !selected.notified_at && (
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-700 font-medium text-sm mb-3">
                        <MessageSquare size={16} />
                        未通知客户，请选择通知方式
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleNotify(selected.id, 'sms')} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">短信通知</button>
                        <button onClick={() => handleNotify(selected.id, 'email')} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">邮件通知</button>
                        <button onClick={() => handleNotify(selected.id, 'phone')} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">电话通知</button>
                      </div>
                    </div>
                  )}

                  {selected.status === 'executing' && (
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-sm text-blue-700 font-medium mb-3">
                        当前步骤: {STEP_LABELS[selected.step]}
                      </div>
                      {selected.step !== 'result' ? (
                        <button
                          onClick={() => handleStep(selected.id, STEP_ORDER[getStepIndex(selected.step)])}
                          className="px-4 py-2 bg-portOrange text-white rounded-lg text-sm font-medium hover:bg-portOrange/90"
                        >
                          完成{STEP_LABELS[selected.step]}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-blue-600 mb-2">录入查验结果:</div>
                          <div className="flex gap-2">
                            <button onClick={() => handleStep(selected.id, 'result', 'released')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                              放行
                            </button>
                            <button onClick={() => handleStep(selected.id, 'result', 'abnormal')} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                              查验异常
                            </button>
                            <button onClick={() => handleStep(selected.id, 'result', 'detained')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                              扣留
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selected.notified_at && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={14} />
                        已于 {selected.notified_at?.slice(0, 16).replace('T', ' ')} 通过{selected.notify_method === 'sms' ? '短信' : selected.notify_method === 'email' ? '邮件' : '电话'}通知客户
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedMoveTasks.length > 0 && (
                <div className="bg-white rounded-lg border border-blue-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck size={18} className="text-portBlue" />
                    <h3 className="font-bold text-portNavy">关联移箱任务</h3>
                    <span className="text-xs text-slate-400">查验放行后自动创建</span>
                  </div>
                  {selectedMoveTasks.map((mt) => (
                    <div key={mt.id} className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 mb-2 last:mb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-portNavy">{mt.from_slot}</span>
                          <ArrowRight size={14} className="text-slate-400" />
                          <span className="text-sm font-mono text-portNavy">{mt.to_slot}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            mt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            mt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {MOVE_STATUS_LABELS[mt.status] || mt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {mt.status === 'pending' && (
                            <button
                              onClick={() => handleMoveAction(mt.id, 'start')}
                              className="px-3 py-1.5 bg-portOrange text-white rounded-lg text-xs font-medium hover:bg-portOrange/90"
                            >
                              开始移箱
                            </button>
                          )}
                          {mt.status === 'in_progress' && (
                            <button
                              onClick={() => handleMoveAction(mt.id, 'complete')}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                            >
                              完成移箱
                            </button>
                          )}
                          <span className="text-xs text-slate-400">{mt.created_at?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                      </div>
                      {mt.reason && <div className="text-xs text-slate-500 mt-1">{mt.reason}</div>}
                    </div>
                  ))}
                </div>
              )}

              {selectedProblems.length > 0 && (
                <div className="bg-white rounded-lg border border-red-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h3 className="font-bold text-portNavy">关联问题单</h3>
                    <span className="text-xs text-red-500">卡住原因</span>
                  </div>
                  {selectedProblems.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/service/problems/${p.id}`)}
                      className="w-full text-left p-3 rounded-lg bg-red-50 border border-red-100 mb-2 last:mb-0 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            {PROBLEM_TYPE_LABELS[p.type] || p.type}
                          </span>
                          {p.severity === 'critical' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white">严重</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{p.detected_at?.slice(0, 10)}</span>
                      </div>
                      <div className="text-sm text-portNavy mt-1">{p.description}</div>
                      {p.cause && <div className="text-xs text-red-600 mt-1">原因: {p.cause}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-100 p-12 text-center text-slate-400">
              <Clock size={32} className="mx-auto mb-3 text-slate-300" />
              <p>选择左侧查验记录查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
