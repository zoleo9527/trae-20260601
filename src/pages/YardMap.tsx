import { useEffect, useState } from 'react'
import { useContainersStore } from '@/stores/containers'
import { problemApi, type ProblemOrder } from '@/lib/api'
import { AlertTriangle } from 'lucide-react'

const YARD_LAYOUT = [
  { zone: 'A', rows: 3, cols: 3, label: 'A区-普通堆位' },
  { zone: 'B', rows: 2, cols: 3, label: 'B区-普通堆位' },
  { zone: 'C', rows: 3, cols: 3, label: 'C区-查验区' },
  { zone: 'D', rows: 2, cols: 3, label: 'D区-出场区' },
]

const STATUS_COLORS: Record<string, string> = {
  entered: 'bg-blue-200 border-blue-400',
  yarded: 'bg-green-200 border-green-400',
  inspecting: 'bg-orange-200 border-orange-400',
  inspection_done: 'bg-emerald-200 border-emerald-400',
  moving: 'bg-purple-200 border-purple-400',
  ready_out: 'bg-teal-200 border-teal-400',
  exited: 'bg-slate-200 border-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  entered: '已进场',
  yarded: '已堆位',
  inspecting: '查验中',
  inspection_done: '查验完成',
  moving: '移箱中',
  ready_out: '待出场',
  exited: '已出场',
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

export default function YardMap() {
  const { containers, fetchContainers } = useContainersStore()
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [containerProblems, setContainerProblems] = useState<Record<number, ProblemOrder[]>>({})

  useEffect(() => {
    fetchContainers({ size: 200 })
  }, [fetchContainers])

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

  const slotMap = new Map<string, typeof containers[0]>()
  for (const c of containers) {
    if (c.yard_slot) {
      slotMap.set(c.yard_slot, c)
    }
  }

  const problemContainers = containers.filter((c) => containerProblems[c.id]?.length)
  const totalProblems = Object.values(containerProblems).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-portNavy mb-6">堆位状态图</h1>

      {totalProblems > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <div className="font-bold text-red-700">
              当前有 {totalProblems} 个未处理问题，涉及 {problemContainers.length} 个箱
            </div>
            <div className="text-sm text-red-600 mt-0.5">
              {Object.entries(
                Object.values(containerProblems)
                  .flat()
                  .reduce<Record<string, number>>((acc, p) => {
                    acc[p.type] = (acc[p.type] || 0) + 1
                    return acc
                  }, {})
              )
                .map(([type, count]) => `${PROBLEM_TYPE_LABELS[type] || type} ${count}`)
                .join('、')}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-sm border ${STATUS_COLORS[key]}`} />
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm border border-slate-200 bg-white" />
          <span className="text-xs text-slate-600">空闲</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm border border-red-400 bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
          </div>
          <span className="text-xs text-slate-600">异常</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {YARD_LAYOUT.map((zone) => (
          <div key={zone.zone} className="bg-white rounded-lg border border-slate-100 p-5">
            <h2 className="font-bold text-portNavy mb-4">{zone.label}</h2>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${zone.cols}, 1fr)` }}>
              {Array.from({ length: zone.rows * zone.cols }, (_, i) => {
                const row = Math.floor(i / zone.cols) + 1
                const col = (i % zone.cols) + 1
                const slot = `${zone.zone}-${String(row).padStart(2, '0')}-${String(col).padStart(2, '0')}`
                const container = slotMap.get(slot)
                const isHovered = hoveredSlot === slot
                const problems = container ? containerProblems[container.id] : undefined

                return (
                  <div
                    key={slot}
                    onMouseEnter={() => setHoveredSlot(slot)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={`relative rounded-md border p-2 min-h-[72px] transition-all ${
                      container
                        ? STATUS_COLORS[container.status] || 'bg-slate-200 border-slate-400'
                        : 'bg-white border-slate-200'
                    } ${problems?.length ? 'ring-2 ring-red-400' : ''} ${isHovered ? 'ring-2 ring-portBlue shadow-md z-10 scale-105' : ''}`}
                  >
                    {problems?.length ? (
                      <AlertTriangle className="absolute top-1 right-1 w-3.5 h-3.5 text-red-500" />
                    ) : null}
                    <div className="text-xs font-mono text-slate-500">{slot}</div>
                    {container && (
                      <div className="mt-1">
                        <div className="text-xs font-bold text-portNavy truncate">{container.container_no}</div>
                        <div className="text-[10px] text-slate-500">{STATUS_LABELS[container.status] || container.status}</div>
                        {problems?.length ? (
                          <div className="text-[10px] text-red-600 mt-0.5 truncate">
                            {problems.map((p) => PROBLEM_TYPE_LABELS[p.type] || p.type).join('、')}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {!container && (
                      <div className="mt-1 text-[10px] text-slate-300">空闲</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-lg border border-slate-100 p-5">
        <h2 className="font-bold text-portNavy mb-3">在场箱统计</h2>
        <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const count = containers.filter((c) => c.status === key && c.yard_slot).length
            return (
              <div key={key} className="text-center p-2 rounded-lg bg-slate-50">
                <div className="text-lg font-bold text-portNavy">{count}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
