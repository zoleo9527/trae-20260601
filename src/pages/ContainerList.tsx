import { useEffect, useState } from 'react'
import { useContainersStore } from '@/stores/containers'
import { problemApi, type ProblemOrder } from '@/lib/api'
import { Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const STATUS_MAP: Record<string, string> = {
  entered: '已进场',
  yarded: '已堆位',
  inspecting: '查验中',
  inspection_done: '查验完成',
  moving: '移箱中',
  ready_out: '待出场',
  exited: '已出场',
}

const STATUS_COLORS: Record<string, string> = {
  entered: 'bg-slate-100 text-slate-600',
  yarded: 'bg-blue-50 text-blue-600',
  inspecting: 'bg-orange-50 text-orange-600',
  inspection_done: 'bg-green-50 text-green-600',
  moving: 'bg-purple-50 text-purple-600',
  ready_out: 'bg-teal-50 text-teal-600',
  exited: 'bg-slate-100 text-slate-400',
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

export default function ContainerList() {
  const { containers, total, loading, fetchContainers, fetchContainer, current } = useContainersStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [containerProblems, setContainerProblems] = useState<Record<number, ProblemOrder[]>>({})

  useEffect(() => {
    fetchContainers({ search: search || undefined, status: statusFilter || undefined })
  }, [fetchContainers, search, statusFilter])

  useEffect(() => {
    problemApi.list({ status: 'open' }).then((problems) => {
      const map: Record<number, ProblemOrder[]> = {}
      for (const p of problems) {
        if (!map[p.container_id]) map[p.container_id] = []
        map[p.container_id].push(p)
      }
      setContainerProblems(map)
    })
  }, [])

  const problemCount = Object.keys(containerProblems).length

  const handleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    fetchContainer(id)
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-portNavy mb-6">集装箱查询</h1>

      {problemCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{problemCount} 个集装箱存在未处理的异常工单</span>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30 focus:border-portBlue"
            placeholder="搜索箱号..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portBlue/30"
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="px-4 py-3 text-left font-medium">箱号</th>
              <th className="px-4 py-3 text-left font-medium">船名/航次</th>
              <th className="px-4 py-3 text-left font-medium">堆位</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">进场时间</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">加载中...</td></tr>
            ) : containers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无数据</td></tr>
            ) : (
              containers.map((c) => {
                const problems = containerProblems[c.id] || []
                return (
                  <>
                    <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-portNavy">
                        <div className="flex items-center gap-2">
                          {c.container_no}
                          {problems.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              <AlertTriangle size={10} />
                              {problems.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.vessel} / {c.voyage}</td>
                      <td className="px-4 py-3 text-slate-600">{c.yard_slot || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'}`}>
                            {STATUS_MAP[c.status] || c.status}
                          </span>
                          {problems.map((p) => (
                            <span key={p.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-200">
                              {PROBLEM_TYPE_LABELS[p.type] || p.type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.entered_at?.slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleExpand(c.id)} className="text-portBlue hover:text-portOrange">
                          {expandedId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === c.id && current?.container?.id === c.id && (
                      <tr key={`${c.id}-detail`}>
                        <td colSpan={6} className="bg-slate-50/50 px-8 py-4">
                          <div className="text-sm text-slate-600 mb-2 font-medium">时间线</div>
                          {current.timeline?.length === 0 ? (
                            <div className="text-xs text-slate-400">暂无时间线记录</div>
                          ) : (
                            <div className="space-y-2">
                              {current.timeline?.map((evt, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                  <span className="text-slate-400 shrink-0 w-36">{evt.time?.slice(0, 16).replace('T', ' ')}</span>
                                  <span className="font-medium text-portNavy">{evt.type}</span>
                                  <span className="text-slate-500">{evt.detail}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-sm text-slate-400">共 {total} 条记录</div>
    </div>
  )
}
