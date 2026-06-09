import { useParcelStore } from '@/store/parcelStore'
import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ProblemPage() {
  const { problems, fetchProblems, resolveProblem } = useParcelStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<any>(null)
  const [resolution, setResolution] = useState<'reassign' | 'close' | ''>('')
  const [note, setNote] = useState('')

  useEffect(() => {
    fetchProblems()
  }, [])

  const handleOpenModal = (problem: any) => {
    setSelectedProblem(problem)
    setResolution('')
    setNote('')
    setModalOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedProblem || !resolution) return
    await resolveProblem(selectedProblem.parcel_id ?? selectedProblem.id, resolution, note)
    setModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-800">问题件处理</h1>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-medium">运单号</th>
              <th className="px-4 py-3 font-medium">问题类型</th>
              <th className="px-4 py-3 font-medium">上报人</th>
              <th className="px-4 py-3 font-medium">上报时间</th>
              <th className="px-4 py-3 font-medium">处理状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem: any) => (
              <tr key={problem.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-800">{problem.tracking_no}</td>
                <td className="px-4 py-3 text-slate-600">{problem.problem_type}</td>
                <td className="px-4 py-3 text-slate-600">{problem.reported_by_name}</td>
                <td className="px-4 py-3 text-slate-600">{problem.reported_at}</td>
                <td className="px-4 py-3">
                  {problem.resolution ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {problem.resolution === 'reassign' ? '已重新分配' : '已关闭'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      待处理
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!problem.resolution && (
                    <button
                      onClick={() => handleOpenModal(problem)}
                      className="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600"
                    >
                      处理
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {problems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">暂无问题件</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">处理问题件</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setResolution('reassign')}
                  className={`flex-1 rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    resolution === 'reassign'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:border-orange-300'
                  }`}
                >
                  重新分配
                </button>
                <button
                  onClick={() => setResolution('close')}
                  className={`flex-1 rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    resolution === 'close'
                      ? 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-slate-200 text-slate-600 hover:border-gray-400'
                  }`}
                >
                  关闭
                </button>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注（可选）"
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              />

              <button
                onClick={handleConfirm}
                disabled={!resolution}
                className="w-full rounded-md bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
