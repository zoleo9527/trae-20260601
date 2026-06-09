import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  FileText,
  ArrowRight,
  ArrowRightLeft,
} from 'lucide-react'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { useVisitStore } from '@/stores/visitStore'
import { useRecallStore } from '@/stores/recallStore'
import { useHandoverStore } from '@/stores/handoverStore'

const ROLE_LABELS: Record<string, string> = {
  volunteer: '志愿者',
  vet: '兽医',
  adoption_officer: '领养审核员',
  admin: '管理员',
}

type StatusColor = 'amber' | 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'gray'

const STATUS_COLOR_MAP: Record<string, StatusColor> = {
  pending: 'amber',
  completed: 'green',
  need_followup: 'orange',
  transferred_to_recall: 'red',
  initiated: 'blue',
  reviewing: 'purple',
  executing: 'orange',
  recalled: 'red',
  closed: 'gray',
}

const STATUS_LABEL_MAP: Record<string, string> = {
  pending: '待处理',
  completed: '已完成',
  need_followup: '需复查',
  transferred_to_recall: '已转收回',
  initiated: '已发起',
  reviewing: '审核中',
  executing: '执行中',
  recalled: '已收回',
  closed: '已关闭',
}

const COLOR_CLASSES: Record<StatusColor, string> = {
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR_MAP[status] ?? 'gray'
  const label = STATUS_LABEL_MAP[status] ?? status
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_CLASSES[color]}`}>
      {label}
    </span>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  value: number
  label: string
  borderColor: string
  iconBg: string
  onClick?: () => void
}

function StatCard({ icon, value, label, borderColor, iconBg, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border-l-4 ${borderColor} p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

interface CardListProps {
  title: string
  badge?: number
  children: React.ReactNode
}

function CardList({ title, badge, children }: CardListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {badge != null && badge > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">{badge}</span>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

interface CardItemProps {
  children: React.ReactNode
  onClick?: () => void
}

function CardItem({ children, onClick }: CardItemProps) {
  return (
    <div
      onClick={onClick}
      className={`px-5 py-3 flex items-center justify-between gap-3 ${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
    >
      {children}
    </div>
  )
}

function ActionButton({ label, to, primary }: { label: string; to: string; primary?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
        primary
          ? 'bg-orange-600 text-white hover:bg-orange-700'
          : 'border border-orange-600 text-orange-600 hover:bg-orange-50'
      }`}
    >
      <Plus size={16} />
      {label}
    </button>
  )
}

interface PendingHandover {
  id: number
  from_user_name?: string
  to_user_id: number
  to_user_name?: string
  status: string
  handover_date?: string
  pending_visits_count?: number
  active_recalls_count?: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { visits, fetchVisits } = useVisitStore()
  const { recalls, fetchRecalls } = useRecallStore()
  const fetchHandovers = useHandoverStore((s) => s.fetchHandovers)

  const [stats, setStats] = useState({
    totalAnimals: 0,
    pendingVisits: 0,
    activeRecalls: 0,
    recalledCount: 0,
  })

  const [pendingHandovers, setPendingHandovers] = useState<PendingHandover[]>([])

  useEffect(() => {
    async function loadStats() {
      try {
        const [animalsRes, pendingVisitsRes, recallsRes, recalledRes] = await Promise.all([
          fetch('/api/animals'),
          fetch('/api/visits?status=pending'),
          fetch('/api/recalls'),
          fetch('/api/recalls?status=recalled'),
        ])
        const [animalsData, pendingData, recallsData, recalledData] = await Promise.all([
          animalsRes.json(),
          pendingVisitsRes.json(),
          recallsRes.json(),
          recalledRes.json(),
        ])
        const animalList = animalsData.list ?? animalsData.data ?? (Array.isArray(animalsData) ? animalsData : [])
        const pendingList = pendingData.list ?? pendingData.data ?? (Array.isArray(pendingData) ? pendingData : [])
        const recallList = recallsData.list ?? recallsData.data ?? (Array.isArray(recallsData) ? recallsData : [])
        const recalledList = recalledData.list ?? recalledData.data ?? (Array.isArray(recalledData) ? recalledData : [])
        setStats({
          totalAnimals: animalsData.total ?? animalList.length,
          pendingVisits: pendingList.length,
          activeRecalls: recallList.filter(
            (r: Record<string, unknown>) => !['recalled', 'closed'].includes(r.status as string)
          ).length,
          recalledCount: recalledList.length,
        })
      } catch {
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    fetchVisits({ status: 'pending' })
  }, [fetchVisits])

  useEffect(() => {
    fetchRecalls()
  }, [fetchRecalls])

  useEffect(() => {
    fetchHandovers()
  }, [fetchHandovers])

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/handover`)
        .then((r) => r.json())
        .then((data) => {
          const list = data.data ?? data
          const mine = (Array.isArray(list) ? list : []).filter(
            (h: PendingHandover) => h.to_user_id === user.id && h.status === 'pending'
          )
          setPendingHandovers(mine)
        })
        .catch(() => setPendingHandovers([]))
    }
  }, [user])

  const role = user?.role

  const pendingVisits = visits.filter((v) => v.status === 'pending')
  const volunteerPendingVisits = pendingVisits.filter(
    (v) => v.visitor_id === user?.id || v.visitor_id == null
  )
  const needFollowupVisits = visits.filter((v) => v.status === 'need_followup')

  const volunteerRecalls = recalls.filter(
    (r) => (r as Record<string, unknown>).reporter_id === user?.id
  )
  const vetRecalls = recalls.filter(
    (r) => ['reviewing', 'executing'].includes(r.status)
  )
  const officerRecalls = recalls.filter(
    (r) => ['initiated', 'reviewing'].includes(r.status)
  )

  function renderPendingHandovers() {
    if (pendingHandovers.length === 0) return null
    return (
      <CardList title="待接收交班" badge={pendingHandovers.length}>
        {pendingHandovers.map((h) => (
          <CardItem key={h.id} onClick={() => navigate(`/handovers/${h.id}`)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {h.from_user_name ?? `用户`} → {h.to_user_name ?? '我'}
              </p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                {h.handover_date && <span>{dayjs(h.handover_date).format('YYYY-MM-DD')}</span>}
                {h.pending_visits_count != null && <span>待回访 {h.pending_visits_count} 条</span>}
                {h.active_recalls_count != null && <span>异常收回 {h.active_recalls_count} 条</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-600 font-medium">待确认</span>
              <ArrowRight size={14} className="text-gray-400" />
            </div>
          </CardItem>
        ))}
      </CardList>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">仪表盘</h1>
        <span className="text-sm text-gray-500">
          当前角色：{ROLE_LABELS[role ?? ''] ?? role}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Heart size={24} className="text-orange-500" />}
          value={stats.totalAnimals}
          label="救助总数"
          borderColor="border-l-orange-500"
          iconBg="bg-orange-50"
          onClick={() => navigate('/rescues')}
        />
        <StatCard
          icon={<ClipboardCheck size={24} className="text-blue-500" />}
          value={stats.pendingVisits}
          label="待回访"
          borderColor="border-l-blue-500"
          iconBg="bg-blue-50"
          onClick={() => navigate('/visits')}
        />
        <StatCard
          icon={<AlertTriangle size={24} className="text-red-500" />}
          value={stats.activeRecalls}
          label="异常进行中"
          borderColor="border-l-red-500"
          iconBg="bg-red-50"
          onClick={() => navigate('/recalls')}
        />
        <StatCard
          icon={<ArrowRightLeft size={24} className="text-amber-500" />}
          value={pendingHandovers.length}
          label="待接收交班"
          borderColor="border-l-amber-500"
          iconBg="bg-amber-50"
          onClick={() => navigate('/handovers')}
        />
      </div>

      {role === 'volunteer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPendingHandovers()}
          <CardList title="待处理回访">
            {volunteerPendingVisits.length === 0 ? (
              <EmptyItem text="暂无待处理回访" />
            ) : (
              volunteerPendingVisits.map((v) => (
                <CardItem key={v.id} onClick={() => navigate(`/visits/${v.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {((v as Record<string, unknown>).animal_name as string) ?? `动物 #${v.animal_id}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dayjs(v.visit_date).format('YYYY-MM-DD')}
                    </p>
                  </div>
                  <button className="px-3 py-1 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors">
                    处理
                  </button>
                </CardItem>
              ))
            )}
          </CardList>

          <CardList title="我发起的异常收回">
            {volunteerRecalls.length === 0 ? (
              <EmptyItem text="暂无记录" />
            ) : (
              volunteerRecalls.map((r) => (
                <CardItem key={r.id} onClick={() => navigate(`/recalls/${r.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {((r as Record<string, unknown>).animal_name as string) ?? `动物 #${r.animal_id}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{r.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                </CardItem>
              ))
            )}
          </CardList>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <ActionButton label="新建救助档案" to="/rescues" primary />
              <ActionButton label="新建回访" to="/visits/new" />
              <ActionButton label="创建交班" to="/handovers/new" />
            </div>
          </div>
        </div>
      )}

      {role === 'vet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPendingHandovers()}
          <CardList title="健康复查提醒">
            {needFollowupVisits.length === 0 ? (
              <EmptyItem text="暂无复查提醒" />
            ) : (
              needFollowupVisits.map((v) => (
                <CardItem key={v.id} onClick={() => navigate(`/visits/${v.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {((v as Record<string, unknown>).animal_name as string) ?? `动物 #${v.animal_id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        健康状态：{((v as Record<string, unknown>).health_status as string) ?? '-'}
                      </span>
                      <span className="text-xs text-gray-400">
                        下次：{((v as Record<string, unknown>).next_visit_date as string)
                          ? dayjs((v as Record<string, unknown>).next_visit_date as string).format('YYYY-MM-DD')
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors">
                    处理
                  </button>
                </CardItem>
              ))
            )}
          </CardList>

          <CardList title="异常收回中">
            {vetRecalls.length === 0 ? (
              <EmptyItem text="暂无进行中的异常收回" />
            ) : (
              vetRecalls.map((r) => (
                <CardItem key={r.id} onClick={() => navigate(`/recalls/${r.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {((r as Record<string, unknown>).animal_name as string) ?? `动物 #${r.animal_id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{r.reason}</span>
                      <span className="text-xs text-gray-400">
                        处理人：{((r as Record<string, unknown>).handler_name as string) ?? '-'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </CardItem>
              ))
            )}
          </CardList>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <ActionButton label="新建回访" to="/visits/new" primary />
              <ActionButton label="创建交班" to="/handovers/new" />
            </div>
          </div>
        </div>
      )}

      {role === 'adoption_officer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderPendingHandovers()}
          <CardList title="待审核异常收回">
            {officerRecalls.length === 0 ? (
              <EmptyItem text="暂无待审核记录" />
            ) : (
              officerRecalls.map((r) => (
                <CardItem key={r.id} onClick={() => navigate(`/recalls/${r.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {((r as Record<string, unknown>).animal_name as string) ?? `动物 #${r.animal_id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{r.reason}</span>
                      <span className="text-xs text-gray-400">
                        发起人：{((r as Record<string, unknown>).reporter_name as string) ?? '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <button className="px-3 py-1 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors">
                      审核
                    </button>
                  </div>
                </CardItem>
              ))
            )}
          </CardList>

          <CardList title="领养审核待处理">
            <EmptyItem text="暂无待审核领养记录" />
          </CardList>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <ActionButton label="新建回访" to="/visits/new" primary />
              <ActionButton label="发起异常收回" to="/recalls/new" />
              <ActionButton label="创建交班" to="/handovers/new" />
            </div>
          </div>
        </div>
      )}

      {role === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderPendingHandovers()}
            <CardList title="待处理回访">
              {pendingVisits.length === 0 ? (
                <EmptyItem text="暂无待处理回访" />
              ) : (
                pendingVisits.slice(0, 5).map((v) => (
                  <CardItem key={v.id} onClick={() => navigate(`/visits/${v.id}`)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {((v as Record<string, unknown>).animal_name as string) ?? `动物 #${v.animal_id}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dayjs(v.visit_date).format('YYYY-MM-DD')}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                  </CardItem>
                ))
              )}
            </CardList>

            <CardList title="健康复查提醒">
              {needFollowupVisits.length === 0 ? (
                <EmptyItem text="暂无复查提醒" />
              ) : (
                needFollowupVisits.slice(0, 5).map((v) => (
                  <CardItem key={v.id} onClick={() => navigate(`/visits/${v.id}`)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {((v as Record<string, unknown>).animal_name as string) ?? `动物 #${v.animal_id}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {((v as Record<string, unknown>).health_status as string) ?? '-'}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                  </CardItem>
                ))
              )}
            </CardList>

            <CardList title="异常收回动态">
              {recalls.length === 0 ? (
                <EmptyItem text="暂无异常收回记录" />
              ) : (
                recalls.slice(0, 5).map((r) => (
                  <CardItem key={r.id} onClick={() => navigate(`/recalls/${r.id}`)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {((r as Record<string, unknown>).animal_name as string) ?? `动物 #${r.animal_id}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{r.reason}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </CardItem>
                ))
              )}
            </CardList>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ActionButton label="新建救助档案" to="/rescues" primary />
            <ActionButton label="新建回访" to="/visits/new" />
            <ActionButton label="发起异常收回" to="/recalls/new" />
            <ActionButton label="创建交班" to="/handovers/new" />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyItem({ text }: { text: string }) {
  return (
    <div className="px-5 py-6 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
      <FileText size={16} />
      {text}
    </div>
  )
}
