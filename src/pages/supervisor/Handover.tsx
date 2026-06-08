import { useState } from 'react'
import { useAppStore } from '@/store/index'
import { Shirt, Wrench, ClipboardCheck, Wine, ChevronDown, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

type ChainGroup = {
  roomId: string
  roomNumber: string
  floor: string
  items: ChainItem[]
}

type ChainItem = {
  type: 'inspection' | 'linen' | 'maintenance' | 'minibar'
  date: string
  label: string
  detail: string
  status?: string
  statusCategory?: 'room' | 'inspection' | 'minibar' | 'maintenance'
}

const priorityLabel: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const actionLabel: Record<string, string> = {
  none: '无操作',
  replace: '更换',
  replenish: '补充',
}

const iconMap: Record<string, React.ReactNode> = {
  inspection: <ClipboardCheck size={14} className="text-[#1E3A5F]" />,
  linen: <Shirt size={14} className="text-[#D4A853]" />,
  maintenance: <Wrench size={14} className="text-red-500" />,
  minibar: <Wine size={14} className="text-emerald-500" />,
}

export default function Handover() {
  const { inspectionTasks, inspectionResults, linenRecords, maintenanceOrders, minibarChecks, rooms, users } = useAppStore()
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)

  const relevantTaskIds = inspectionTasks
    .filter((t) => t.status === 'completed' || t.status === 'in_progress')
    .map((t) => t.id)

  const groups: ChainGroup[] = []

  for (const task of inspectionTasks.filter((t) => relevantTaskIds.includes(t.id))) {
    const room = rooms.find((r) => r.id === task.roomId)
    if (!room) continue

    const items: ChainItem[] = []

    const assignee = task.assignedTo
      ? users.find((u) => u.id === task.assignedTo)?.name
      : undefined

    items.push({
      type: 'inspection',
      date: task.completedAt ?? task.createdAt,
      label: '退房查房',
      detail: assignee ? `执行人：${assignee}` : '未分配',
      status: task.status,
      statusCategory: 'inspection',
    })

    const result = inspectionResults.find((r) => r.taskId === task.id)
    if (result) {
      const issues: string[] = []
      if (!result.facilityOk) issues.push('设施问题')
      if (!result.cleanlinessOk) issues.push('卫生问题')
      if (result.linenStatus !== 'ok') issues.push('布草异常')
      items.push({
        type: 'inspection',
        date: result.createdAt,
        label: '查房结果',
        detail: issues.length > 0 ? issues.join('、') : '全部正常',
        status: issues.length > 0 ? 'anomaly' : undefined,
        statusCategory: issues.length > 0 ? 'minibar' : undefined,
      })
    }

    const taskLinenRecords = linenRecords.filter((lr) => lr.taskId === task.id)
    for (const lr of taskLinenRecords) {
      if (lr.action !== 'none') {
        items.push({
          type: 'linen',
          date: task.completedAt ?? task.createdAt,
          label: `布草：${lr.itemType}`,
          detail: `应${lr.expectedCount}/实${lr.actualCount} — ${actionLabel[lr.action]}`,
        })
      }
    }

    const taskOrders = maintenanceOrders.filter((o) => o.taskId === task.id)
    for (const order of taskOrders) {
      items.push({
        type: 'maintenance',
        date: order.createdAt,
        label: '维修工单',
        detail: order.description,
        status: order.status,
        statusCategory: 'maintenance',
      })
    }

    const taskMinibarChecks = minibarChecks.filter((c) => c.taskId === task.id)
    for (const check of taskMinibarChecks) {
      const anomalyCount = check.items.filter((i) => i.isAnomaly).length
      items.push({
        type: 'minibar',
        date: check.checkedAt ?? '',
        label: '迷你吧核对',
        detail: anomalyCount > 0 ? `${anomalyCount}项异常` : check.status === 'pending' ? '待核对' : '无异常',
        status: check.status,
        statusCategory: 'minibar',
      })
    }

    items.sort((a, b) => a.date.localeCompare(b.date))

    groups.push({
      roomId: room.id,
      roomNumber: room.number,
      floor: room.floor,
      items,
    })
  }

  groups.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[#1E3A5F]">交接总览</h1>
      <p className="mb-6 text-sm text-gray-500">
        查房→布草→维修→迷你吧 核对链条，按房间聚合
      </p>

      {groups.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无交接记录</div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedRoom === group.roomId
            return (
              <div key={group.roomId} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => setExpandedRoom(isExpanded ? null : group.roomId)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold text-[#1E3A5F]">
                      {group.roomNumber}
                    </span>
                    <span className="text-xs text-gray-400">{group.floor}层</span>
                    <span className="text-xs text-gray-400">
                      {group.items.length} 条记录
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    <div className="relative">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                      <div className="space-y-3">
                        {group.items.map((item, index) => (
                          <div key={index} className="relative pl-8">
                            <div className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center">
                              {iconMap[item.type]}
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-white p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                  {item.label}
                                </span>
                                <div className="flex items-center gap-2">
                                  {item.status && item.statusCategory && (
                                    <StatusBadge status={item.status} category={item.statusCategory} />
                                  )}
                                  {item.date && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(item.date).toLocaleString('zh-CN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">{item.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
