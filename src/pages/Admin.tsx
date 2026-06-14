import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { resetData, fetchRecords, createNormalDemo, createExceptionDemo, getDemoStatus } from '@/utils/api'
import { Car, RotateCcw, AlertTriangle, CheckCircle2, Play, ArrowRight, RefreshCw, XCircle, ClipboardCheck, ShieldCheck, Eye } from 'lucide-react'
import type { AppointmentRecord } from '@/types'
import { statusLabel, statusColor, statusDotColor } from '@/utils/format'

export default function Admin() {
  const { currentRole, setRecords, setLoading } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [demoRecords, setDemoRecords] = useState<AppointmentRecord[]>([])
  const [demoMessage, setDemoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadDemoStatus = async () => {
    const data = await getDemoStatus()
    setDemoRecords(data)
  }

  useEffect(() => {
    loadDemoStatus()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setDemoMessage({ type, text })
    setTimeout(() => setDemoMessage(null), 4000)
  }

  const handleReset = async () => {
    await resetData()
    setConfirmReset(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 3000)
    loadDemoStatus()
    if (currentRole) {
      setLoading(true)
      const data = await fetchRecords(currentRole)
      setRecords(data)
      setLoading(false)
    }
  }

  const handleCreateNormalDemo = async () => {
    const result = await createNormalDemo()
    showMessage('success', result.message)
    loadDemoStatus()
  }

  const handleCreateExceptionDemo = async () => {
    const result = await createExceptionDemo()
    showMessage('success', result.message)
    loadDemoStatus()
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">年检站</div>
              <div className="text-xs text-slate-500">管理后台</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="px-3 py-2 bg-slate-800 rounded-lg flex items-center gap-3">
            <Play className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-white">演示路径</span>
          </div>
          <div className="px-3 py-2 text-slate-400 rounded-lg flex items-center gap-3 hover:bg-slate-800/50 transition-colors cursor-pointer">
            <RotateCcw className="w-5 h-5" />
            <span className="text-sm">数据管理</span>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <h2 className="text-xl font-bold text-white">演示路径与数据管理</h2>

          {demoMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              demoMessage.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-800/50'
                : 'bg-red-950/50 border border-red-800/50'
            }`}>
              <CheckCircle2 className={`w-4 h-4 ${demoMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-sm ${demoMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{demoMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">正常推进路径</h3>
                  <p className="text-xs text-slate-500">预约 → 接车 → 检测 → 审核通过</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <span className="text-emerald-400 font-medium">流程步骤</span>
                </div>
                <div className="space-y-2">
                  <FlowStep icon={<Car className="w-3.5 h-3.5" />} color="text-sky-400" label="接车员" action="接车并填写备注" active />
                  <FlowStep icon={<ClipboardCheck className="w-3.5 h-3.5" />} color="text-violet-400" label="检测员" action="检测并填写结果" />
                  <FlowStep icon={<ShieldCheck className="w-3.5 h-3.5" />} color="text-amber-400" label="审核员" action="审核通过" />
                  <FlowStep icon={<CheckCircle2 className="w-3.5 h-3.5" />} color="text-emerald-400" label="完成" action="年检完成" />
                </div>
              </div>

              <button
                onClick={handleCreateNormalDemo}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                创建正常流程演示数据
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">异常处理路径</h3>
                  <p className="text-xs text-slate-500">预约 → 接车 → 检测 → 审核退回 → 补充 → 复检 → 复核不通过</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <span className="text-orange-400 font-medium">流程步骤</span>
                </div>
                <div className="space-y-2">
                  <FlowStep icon={<Car className="w-3.5 h-3.5" />} color="text-sky-400" label="接车员" action="接车" active />
                  <FlowStep icon={<ClipboardCheck className="w-3.5 h-3.5" />} color="text-violet-400" label="检测员" action="检测" />
                  <FlowStep icon={<XCircle className="w-3.5 h-3.5" />} color="text-orange-400" label="审核员" action="审核退回+原因" />
                  <FlowStep icon={<RefreshCw className="w-3.5 h-3.5" />} color="text-sky-400" label="接车员" action="补充备注重提" />
                  <FlowStep icon={<ClipboardCheck className="w-3.5 h-3.5" />} color="text-violet-400" label="检测员" action="复检" />
                  <FlowStep icon={<XCircle className="w-3.5 h-3.5" />} color="text-red-400" label="审核员" action="复核不通过/终止" />
                </div>
              </div>

              <button
                onClick={handleCreateExceptionDemo}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                创建异常流程演示数据
              </button>
            </div>
          </div>

          {demoRecords.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">演示数据状态</h3>
                <button
                  onClick={loadDemoStatus}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  刷新
                </button>
              </div>
              <div className="space-y-3">
                {demoRecords.map((r) => (
                  <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">{r.plateNumber}</span>
                        <span className="text-xs text-slate-500">{r.ownerName}</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor(r.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(r.status)}`} />
                          {statusLabel(r.status)}
                        </span>
                        {r.retryCount > 0 && (
                          <span className="text-xs text-orange-400">退回×{r.retryCount}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Eye className="w-3.5 h-3.5" />
                        {r.id.includes('NORMAL') ? '正常路径' : '异常路径'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">接车备注：</span>
                        <span className="text-sky-300">{r.receptionNotes || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">检测结果：</span>
                        <span className="text-violet-300">{r.inspectionResult || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">退回原因：</span>
                        <span className="text-orange-300">{r.returnReason || '-'}</span>
                      </div>
                    </div>
                    {r.supplementaryNotes && (
                      <div className="mt-2 text-xs">
                        <span className="text-slate-500">补充备注：</span>
                        <span className="text-sky-300">{r.supplementaryNotes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-2">重置所有数据</h3>
            <p className="text-sm text-slate-400 mb-6">将所有预约记录恢复到初始示例数据状态，所有操作记录将被清除。此操作不可撤销。</p>

            {resetDone && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">数据已重置成功</span>
              </div>
            )}

            {confirmReset ? (
              <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  确认重置
                </div>
                <p className="text-sm text-slate-400 mb-4">此操作将删除所有当前数据并恢复初始状态，确定要继续吗？</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    确认重置
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重置数据
              </button>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">设计要点说明</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">连续工作面</span>
                    <p className="text-slate-500 text-xs mt-0.5">同一条记录贯穿预约、接车、检测、审核全流程</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">备注可追溯</span>
                    <p className="text-slate-500 text-xs mt-0.5">接车备注、退回原因、补充备注在同一记录中各环节可见</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">角色待办分离</span>
                    <p className="text-slate-500 text-xs mt-0.5">接车员、检测员、审核员各自只看到自己的待办列表</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">操作日志</span>
                    <p className="text-slate-500 text-xs mt-0.5">每一步操作都记录操作人、时间、备注，形成完整时间线</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">批量处理</span>
                    <p className="text-slate-500 text-xs mt-0.5">审核员可多选记录批量通过、退回或终止</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">数据持久化</span>
                    <p className="text-slate-500 text-xs mt-0.5">数据存储在 SQLite 数据库中，不依赖页面状态</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function FlowStep({ icon, color, label, action, active }: { icon: React.ReactNode; color: string; label: string; action: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className={`text-xs ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
      <ArrowRight className="w-3 h-3 text-slate-700" />
      <span className={`text-xs ${active ? 'text-slate-300' : 'text-slate-600'}`}>{action}</span>
    </div>
  )
}
