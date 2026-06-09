import { useEffect, useState } from 'react'
import { useMoveTasksStore } from '@/stores/move-tasks'
import { ArrowRight, Clock, Eye, Play, CheckCircle, XCircle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending: '待执行',
  in_progress: '执行中',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
}

export default function MoveTasks() {
  const { tasks, history, loading, fetchTasks, executeTask, fetchTaskHistory } = useMoveTasksStore()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState<number | null>(null)

  useEffect(() => {
    fetchTasks(statusFilter ? { status: statusFilter } : undefined)
  }, [fetchTasks, statusFilter])

  const handleExecute = async (id: number, action: 'start' | 'complete') => {
    await executeTask(id, { action })
    fetchTasks(statusFilter ? { status: statusFilter } : undefined)
  }

  const handleViewHistory = async (id: number) => {
    if (showHistory === id) {
      setShowHistory(null)
      return
    }
    setShowHistory(id)
    await fetchTaskHistory(id)
  }

  const filteredTasks = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-portNavy mb-6">移箱任务</h1>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'in_progress', 'completed'].map((s) => (
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

      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-100 p-12 text-center text-slate-400">
          <Clock size={32} className="mx-auto mb-3 text-slate-300" />
          <p>暂无移箱任务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-4">
                <div className={`w-1.5 h-12 rounded-full ${STATUS_DOT[task.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-portNavy">{task.container_no || `箱#${task.container_id}`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.source_inspection_id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-portBlue/10 text-portBlue">
                        来源于查验#{task.source_inspection_id} 放行
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                    <span className="font-mono">{task.from_slot}</span>
                    <ArrowRight size={14} />
                    <span className="font-mono">{task.to_slot}</span>
                    <span className="text-slate-300 mx-1">|</span>
                    <span>{task.reason || '移箱'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    创建: {task.created_at?.slice(0, 16).replace('T', ' ')}
                    {task.started_at && ` · 开始: ${task.started_at?.slice(0, 16).replace('T', ' ')}`}
                    {task.completed_at && ` · 完成: ${task.completed_at?.slice(0, 16).replace('T', ' ')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleExecute(task.id, 'start')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-portOrange text-white rounded-lg text-sm font-medium hover:bg-portOrange/90"
                    >
                      <Play size={14} />
                      开始
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleExecute(task.id, 'complete')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      <CheckCircle size={14} />
                      完成
                    </button>
                  )}
                  <button
                    onClick={() => handleViewHistory(task.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                      showHistory === task.id ? 'bg-portBlue/10 text-portBlue' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Eye size={14} />
                    回看
                  </button>
                </div>
              </div>

              {showHistory === task.id && history?.task?.id === task.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                  <h3 className="text-sm font-bold text-portNavy mb-3">任务回看</h3>
                  <div className="space-y-2">
                    <div className="flex gap-3 text-sm">
                      <span className="text-slate-400 w-32 shrink-0">原堆位</span>
                      <span className="font-mono text-portNavy">{task.from_slot}</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span className="text-slate-400 w-32 shrink-0">目标堆位</span>
                      <span className="font-mono text-portNavy">{task.to_slot}</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span className="text-slate-400 w-32 shrink-0">关联查验</span>
                      <span className="text-portNavy">{task.source_inspection_id ? `查验#${task.source_inspection_id}` : '无'}</span>
                    </div>
                    {history.logs && history.logs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-sm font-medium text-slate-600 mb-2">操作日志</div>
                        {history.logs.map((log, i) => (
                          <div key={i} className="flex gap-3 text-sm py-1">
                            <span className="text-slate-400 shrink-0 w-36">{log.created_at?.slice(0, 16).replace('T', ' ')}</span>
                            <span className="text-portNavy">{log.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
