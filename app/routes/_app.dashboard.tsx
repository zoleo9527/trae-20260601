import { useLoaderData, Link } from '@remix-run/react'
import { json } from '@remix-run/node'
import { ClipboardList, AlertTriangle, UserX, RotateCcw } from 'lucide-react'
import { requireUser } from '~/lib/session.server'
import { getDashboardStats, getComplaintList } from '~/lib/complaints.server'
import StatusBadge from '~/components/StatusBadge'
import { COMPLAINT_TYPE_LABELS } from 'shared/types'
import type { LoaderFunctionArgs } from '@remix-run/node'
import type { Complaint } from 'shared/types'

interface DashboardLoaderData {
  stats: {
    today_tasks: number
    overdue: number
    unassigned: number
    recently_returned: number
  }
  todayItems: (Complaint & { assignee_name: string | null; parking_lot_name: string; is_overdue: boolean })[]
  overdueItems: (Complaint & { assignee_name: string | null; parking_lot_name: string; is_overdue: boolean })[]
  rejectedItems: (Complaint & { assignee_name: string | null; parking_lot_name: string; is_overdue: boolean })[]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireUser(request)

  const [stats, todayResult, overdueResult, rejectedResult] = await Promise.all([
    getDashboardStats(),
    getComplaintList({ group: 'today', limit: 10, sort_by: 'created_at', sort_order: 'desc' }),
    getComplaintList({ group: 'overdue', limit: 10, sort_by: 'deadline', sort_order: 'asc' }),
    getComplaintList({ group: 'rejected', limit: 10, sort_by: 'updated_at', sort_order: 'desc' }),
  ])

  return json<DashboardLoaderData>({
    stats,
    todayItems: todayResult.items,
    overdueItems: overdueResult.items,
    rejectedItems: rejectedResult.items,
  })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const statCards = [
  { key: 'today_tasks', label: '今日待办', icon: ClipboardList, iconColor: 'text-park-amber', bgColor: 'bg-amber-500/10' },
  { key: 'overdue', label: '已逾期', icon: AlertTriangle, iconColor: 'text-red-400', bgColor: 'bg-red-500/10' },
  { key: 'unassigned', label: '待指派', icon: UserX, iconColor: 'text-park-amber', bgColor: 'bg-amber-500/10' },
  { key: 'recently_returned', label: '刚刚被退回', icon: RotateCcw, iconColor: 'text-orange-400', bgColor: 'bg-orange-500/10' },
]

export default function Dashboard() {
  const { stats, todayItems, overdueItems, rejectedItems } = useLoaderData<typeof loader>()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.key} className="bg-park-card rounded-lg border border-park-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-sm text-park-muted">{card.label}</span>
              </div>
              <span className="text-3xl font-bold text-park-text">
                {stats[card.key as keyof typeof stats]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="px-5 py-3 border-b border-park-border">
          <h2 className="text-sm font-medium text-park-text">今日要办</h2>
        </div>
        <div className="divide-y divide-park-border/50">
          {todayItems.map((item) => (
            <Link
              key={item.id}
              to={`/complaints/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-park-hover/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-park-text font-medium text-sm">{item.complaint_no}</span>
                <span className="text-xs text-park-muted">
                  {COMPLAINT_TYPE_LABELS[item.type]}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-park-muted">
                  截止: {formatTime(item.deadline)}
                </span>
                <span className="text-xs text-park-muted">
                  {item.assignee_name || '未分配'}
                </span>
              </div>
            </Link>
          ))}
          {todayItems.length === 0 && (
            <div className="px-5 py-8 text-center text-park-muted text-sm">暂无数据</div>
          )}
        </div>
      </div>

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="px-5 py-3 border-b border-park-border">
          <h2 className="text-sm font-medium text-red-400">已经拖延</h2>
        </div>
        <div className="divide-y divide-park-border/50">
          {overdueItems.map((item) => (
            <Link
              key={item.id}
              to={`/complaints/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-park-hover/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-park-text font-medium text-sm">{item.complaint_no}</span>
                <span className="text-xs text-park-muted">
                  {COMPLAINT_TYPE_LABELS[item.type]}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-red-400 font-medium">
                  已逾期: {formatTime(item.deadline)}
                </span>
                <span className="text-xs text-park-muted">
                  {item.assignee_name || '未分配'}
                </span>
              </div>
            </Link>
          ))}
          {overdueItems.length === 0 && (
            <div className="px-5 py-8 text-center text-park-muted text-sm">暂无数据</div>
          )}
        </div>
      </div>

      <div className="bg-park-card rounded-lg border border-park-border">
        <div className="px-5 py-3 border-b border-park-border">
          <h2 className="text-sm font-medium text-orange-400">刚刚被退回</h2>
        </div>
        <div className="divide-y divide-park-border/50">
          {rejectedItems.map((item) => (
            <Link
              key={item.id}
              to={`/complaints/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-park-hover/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-park-text font-medium text-sm">{item.complaint_no}</span>
                <span className="text-xs text-park-muted">
                  {COMPLAINT_TYPE_LABELS[item.type]}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-park-muted">
                  更新: {formatTime(item.updated_at)}
                </span>
                <span className="text-xs text-park-muted">
                  {item.assignee_name || '未分配'}
                </span>
              </div>
            </Link>
          ))}
          {rejectedItems.length === 0 && (
            <div className="px-5 py-8 text-center text-park-muted text-sm">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}
