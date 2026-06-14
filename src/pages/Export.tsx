import { useEffect, useState, type FormEvent } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ExportType, ExportStatus } from '../../shared/types'
import { Download } from 'lucide-react'

const TYPE_MAP: Record<ExportType, string> = { 'absence-violation': '缺考违纪数据', score: '成绩数据' }
const STATUS_MAP: Record<ExportStatus, { label: string; cls: string }> = {
  pending: { label: '处理中', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: '处理中', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', cls: 'bg-green-100 text-green-700' },
  failed: { label: '失败', cls: 'bg-red-100 text-red-700' },
}
const AV_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'supplemented', label: '已补录' },
]

export default function Export() {
  const { exportTasks, fetchExportTasks, createExportTask, rooms, subjects, fetchRooms } = useAppStore()
  const [type, setType] = useState<ExportType>('absence-violation')
  const [roomId, setRoomId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchRooms() }, [fetchRooms])
  useEffect(() => { fetchExportTasks() }, [fetchExportTasks])

  const hasActive = exportTasks.some((t) => t.status === 'pending' || t.status === 'processing')
  useEffect(() => {
    if (!hasActive) return
    const timer = setInterval(() => { fetchExportTasks() }, 3000)
    return () => clearInterval(timer)
  }, [hasActive, fetchExportTasks])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const filters: Record<string, string> = {}
      if (roomId) filters.roomId = roomId
      if (subjectId) filters.subjectId = subjectId
      if (type === 'absence-violation' && status) filters.status = status
      await createExportTask({ type, filters })
      setRoomId('')
      setSubjectId('')
      setStatus('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">创建导出任务</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">导出类型</label>
            <select
              value={type} onChange={(e) => setType(e.target.value as ExportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="absence-violation">缺考违纪数据</option>
              <option value="score">成绩数据</option>
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">考场</label>
            <select
              value={roomId} onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">全部考场</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
            <select
              value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">全部科目</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {type === 'absence-violation' && (
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                {AV_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <button
            type="submit" disabled={creating}
            className="px-5 py-2 rounded-lg bg-[#d97706] text-white font-medium hover:bg-[#b45309] transition-colors text-sm disabled:opacity-50"
          >
            {creating ? '创建中...' : '创建导出任务'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">导出任务列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['任务ID', '类型', '状态', '创建人', '创建时间', '完成时间', '操作'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exportTasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无导出任务</td></tr>
              ) : exportTasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-600 text-xs">{task.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_MAP[task.type]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_MAP[task.status].cls}`}>
                      {STATUS_MAP[task.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{task.createdBy}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(task.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {task.status === 'completed' && (
                      <a
                        href={`/api/export/${task.id}/download`}
                        className="inline-flex items-center gap-1 text-[#d97706] hover:underline font-medium"
                      >
                        <Download size={14} />下载
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
