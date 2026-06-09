import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileCheck, ShoppingCart, Clock, AlertTriangle, TrendingUp, ArrowRight,
  User, CheckCircle, XCircle, Package, Truck, ClipboardCheck,
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import { QualificationBadge, PurchaseBadge } from '@/components/StatusBadge'
import type { Qualification, Purchase, QualificationStatus, PurchaseStatus } from '@/types'

interface DashboardStats {
  qualifications: { total: number; pending: number; expiring_soon: number; expired: number; approved: number }
  purchases: { total: number; pending_review: number; approved: number; shipped: number; completed: number; total_amount: number; completed_amount: number }
}

interface DashboardAlert {
  type: 'expired_qualification' | 'expiring_qualification' | 'pending_review_purchase' | 'purchase_with_expiring_qual' | 'purchase_blocked'
  message: string
  entityId: string
  entityName: string
  entityType: 'qualification' | 'purchase'
  responsible: string
  responsibleRole: string
  daysWaiting?: number
}

interface RecentActivity {
  type: 'qualification' | 'purchase'
  action: string
  operator: string
  role: string
  note: string | null
  created_at: string
  customer_name?: string
  request_no?: string
  entity_id?: string
}

interface PurchaseProgress {
  id: string
  request_no: string
  customer_name: string
  status: PurchaseStatus
  qualification_status: QualificationStatus
  total_amount: number
  created_by: string
  created_at: string
  updated_at: string
  currentStep: number
  totalSteps: number
  responsiblePerson: string
  responsibleRole: string
  isBlocked: boolean
  blockReason?: string
}

const alertConfig: Record<DashboardAlert['type'], { label: string; color: string; borderColor: string; dotColor: string; bgColor: string }> = {
  expired_qualification: { label: '资质已过期', color: 'text-red-700', borderColor: 'border-l-red-500', dotColor: 'bg-red-500', bgColor: 'bg-red-50' },
  expiring_qualification: { label: '资质即将到期', color: 'text-amber-700', borderColor: 'border-l-amber-500', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50' },
  pending_review_purchase: { label: '采购待审核', color: 'text-blue-700', borderColor: 'border-l-blue-500', dotColor: 'bg-blue-500', bgColor: 'bg-blue-50' },
  purchase_with_expiring_qual: { label: '采购关联资质即将到期', color: 'text-amber-700', borderColor: 'border-l-amber-500', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50' },
  purchase_blocked: { label: '采购被阻断', color: 'text-red-700', borderColor: 'border-l-red-500', dotColor: 'bg-red-500', bgColor: 'bg-red-50' },
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray-200', className)} />
}

function StatCard({ icon: Icon, label, count, iconBg, iconColor, loading, trend }: {
  icon: typeof FileCheck; label: string; count: number; iconBg: string; iconColor: string; loading: boolean; trend?: string
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div>
          {loading ? (
            <Skeleton className="mb-1 h-7 w-10" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          )}
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

const PURCHASE_STEPS = [
  { key: 'draft', label: '草稿', role: '销售内勤' },
  { key: 'pending_review', label: '待审核', role: '主管' },
  { key: 'approved', label: '已审核', role: '仓库员' },
  { key: 'confirmed_out', label: '已出库', role: '仓库员' },
  { key: 'shipped', label: '已发货', role: '售后专员' },
  { key: 'completed', label: '已完成', role: '' },
]

const STATUS_STEP_MAP: Record<PurchaseStatus, number> = {
  draft: 0,
  pending_review: 1,
  approved: 2,
  confirmed_out: 3,
  shipped: 4,
  completed: 5,
  rejected: -1,
}

function PurchaseProgressRow({ purchase, onClick }: { purchase: PurchaseProgress; onClick: () => void }) {
  const stepIndex = STATUS_STEP_MAP[purchase.status] ?? -1
  const isRejected = purchase.status === 'rejected'

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-gray-50 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-gray-900">{purchase.request_no}</span>
          <PurchaseBadge status={purchase.status} className="!px-1.5 !py-px !text-[10px]" />
          {purchase.isBlocked && (
            <span className="flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              阻断
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <span>{purchase.customer_name}</span>
          <span>·</span>
          <span>¥{purchase.total_amount.toLocaleString()}</span>
          <span>·</span>
          <span>{purchase.created_by}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {PURCHASE_STEPS.map((step, i) => {
          const isCompleted = !isRejected && i <= stepIndex
          const isCurrent = !isRejected && i === stepIndex
          const isBlocked = purchase.isBlocked && i === stepIndex
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  'flex h-6 items-center gap-0.5 rounded-full px-2 text-[10px] font-medium',
                  isCompleted && !isCurrent && 'bg-emerald-50 text-emerald-600',
                  isCurrent && !isBlocked && 'bg-amber-50 text-amber-700 ring-1 ring-amber-300',
                  isBlocked && 'bg-red-50 text-red-600 ring-1 ring-red-300',
                  !isCompleted && !isCurrent && 'bg-gray-50 text-gray-400',
                )}
              >
                {isCompleted && !isCurrent && <CheckCircle className="h-2.5 w-2.5" />}
                {isCurrent && !isBlocked && <Clock className="h-2.5 w-2.5" />}
                {isBlocked && <AlertTriangle className="h-2.5 w-2.5" />}
                {step.label}
              </div>
              {i < PURCHASE_STEPS.length - 1 && (
                <div className={cn('h-px w-3', isCompleted ? 'bg-emerald-300' : 'bg-gray-200')} />
              )}
            </div>
          )
        })}
      </div>

      <div className="shrink-0 text-right">
        <div className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
          isRejected ? 'bg-red-50 text-red-600' : purchase.isBlocked ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600',
        )}>
          <User className="h-3 w-3" />
          {isRejected ? '销售内勤' : purchase.responsiblePerson}
        </div>
        <p className="mt-0.5 text-[10px] text-gray-400">
          {isRejected ? '需重新提交' : purchase.responsibleRole}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
    </button>
  )
}

interface DashboardAlertsRaw {
  expired_qualifications: Qualification[]
  expiring_qualifications: Qualification[]
  pending_review_purchases: Purchase[]
  purchases_with_expiring_qualification: Purchase[]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [purchaseProgress, setPurchaseProgress] = useState<PurchaseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [progressFilter, setProgressFilter] = useState<'all' | 'blocked' | 'pending'>('all')

  useEffect(() => {
    Promise.all([
      apiGet<DashboardStats>('/dashboard/stats'),
      apiGet<DashboardAlertsRaw>('/dashboard/alerts'),
      apiGet<RecentActivity[]>('/dashboard/recent-activities', { limit: '15' }),
      apiGet<{ list: Purchase[] }>('/purchases', { page: '1', page_size: '50' }),
    ]).then(([statsData, alertsData, activitiesData, purchasesData]) => {
      setStats(statsData)
      const builtAlerts: DashboardAlert[] = []
      ;(alertsData.expired_qualifications ?? []).forEach((q: Qualification) => {
        builtAlerts.push({
          type: 'expired_qualification', message: `${q.customer_name} - ${q.license_type}`,
          entityId: q.id, entityName: q.customer_name, entityType: 'qualification',
          responsible: q.submitted_by, responsibleRole: '销售内勤',
        })
      })
      ;(alertsData.expiring_qualifications ?? []).forEach((q: Qualification) => {
        builtAlerts.push({
          type: 'expiring_qualification', message: `${q.customer_name} - ${q.license_type}，到期日 ${q.expire_date}`,
          entityId: q.id, entityName: q.customer_name, entityType: 'qualification',
          responsible: q.submitted_by, responsibleRole: '销售内勤',
        })
      })
      ;(alertsData.pending_review_purchases ?? []).forEach((p: Purchase) => {
        const daysSince = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
        builtAlerts.push({
          type: 'pending_review_purchase', message: `${p.request_no} - ${p.customer_name}`,
          entityId: p.id, entityName: p.request_no, entityType: 'purchase',
          responsible: '王五', responsibleRole: '主管', daysWaiting: daysSince,
        })
      })
      ;(alertsData.purchases_with_expiring_qualification ?? []).forEach((p: Purchase) => {
        builtAlerts.push({
          type: 'purchase_with_expiring_qual', message: `${p.request_no} - ${p.customer_name}`,
          entityId: p.id, entityName: p.request_no, entityType: 'purchase',
          responsible: p.created_by, responsibleRole: '销售内勤',
        })
      })
      setAlerts(builtAlerts)
      setActivities(activitiesData)

      const progressList: PurchaseProgress[] = (purchasesData.list || [])
        .filter(p => p.status !== 'completed')
        .map(p => {
          const stepIdx = STATUS_STEP_MAP[p.status] ?? -1
          const isBlocked = p.qualification_status === 'expired' || p.qualification_status === 'rejected'
          let responsiblePerson = ''
          let responsibleRole = ''
          if (p.status === 'draft') { responsiblePerson = p.created_by; responsibleRole = '销售内勤' }
          else if (p.status === 'pending_review') { responsiblePerson = '王五'; responsibleRole = '主管' }
          else if (p.status === 'approved') { responsiblePerson = '孙八'; responsibleRole = '仓库员' }
          else if (p.status === 'confirmed_out') { responsiblePerson = '孙八'; responsibleRole = '仓库员/售后' }
          else if (p.status === 'shipped') { responsiblePerson = '赵六'; responsibleRole = '售后专员' }
          else if (p.status === 'rejected') { responsiblePerson = p.created_by; responsibleRole = '销售内勤' }

          return {
            id: p.id,
            request_no: p.request_no,
            customer_name: p.customer_name,
            status: p.status,
            qualification_status: p.qualification_status,
            total_amount: p.total_amount,
            created_by: p.created_by,
            created_at: p.created_at,
            updated_at: p.updated_at,
            currentStep: stepIdx,
            totalSteps: 6,
            responsiblePerson,
            responsibleRole,
            isBlocked,
            blockReason: isBlocked ? '关联资质异常' : undefined,
          }
        })

      progressList.sort((a, b) => {
        if (a.isBlocked !== b.isBlocked) return a.isBlocked ? -1 : 1
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      })
      setPurchaseProgress(progressList)
    }).finally(() => setLoading(false))
  }, [])

  const filteredProgress = purchaseProgress.filter(p => {
    if (progressFilter === 'blocked') return p.isBlocked || p.status === 'rejected'
    if (progressFilter === 'pending') return !p.isBlocked && p.status !== 'rejected'
    return true
  })

  const cards = stats ? [
    { icon: FileCheck, label: '待审核资质', count: stats.qualifications.pending, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: ShoppingCart, label: '待处理采购', count: stats.purchases.pending_review, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { icon: Clock, label: '即将到期资质', count: stats.qualifications.expiring_soon, iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { icon: AlertTriangle, label: '已过期资质', count: stats.qualifications.expired, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">总览看板</h1>
          <p className="mt-1 text-sm text-gray-500">主管追问进度一目了然：谁负责、卡在哪、等多久</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
        {loading && !stats && Array.from({ length: 4 }).map((_, i) => (
          <StatCard key={i} icon={FileCheck} label="" count={0} iconBg="bg-gray-100" iconColor="text-gray-400" loading />
        ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">采购进度追踪</h2>
            <p className="text-xs text-gray-400">未完成采购单的处理进度与当前责任人</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {[
              { key: 'all' as const, label: '全部' },
              { key: 'blocked' as const, label: '异常/阻断' },
              { key: 'pending' as const, label: '正常流转' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setProgressFilter(f.key)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  progressFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {f.label}
                {f.key === 'blocked' && purchaseProgress.filter(p => p.isBlocked || p.status === 'rejected').length > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                    {purchaseProgress.filter(p => p.isBlocked || p.status === 'rejected').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4"><Skeleton className="h-12 w-full" /></div>
            ))
          ) : filteredProgress.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">暂无{progressFilter === 'blocked' ? '异常' : progressFilter === 'pending' ? '流转中' : ''}采购单</div>
          ) : (
            filteredProgress.map(p => (
              <PurchaseProgressRow
                key={p.id}
                purchase={p}
                onClick={() => navigate(`/purchases/${p.id}`)}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">异常提醒</h2>
            <p className="text-xs text-gray-400">需要立即关注的问题项</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-3"><Skeleton className="h-5 w-full" /></div>
            ))}
            {!loading && alerts.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">暂无异常提醒</div>
            )}
            {alerts.map((alert, i) => {
              const cfg = alertConfig[alert.type]
              return (
                <div
                  key={i}
                  className={cn('flex cursor-pointer items-center gap-3 border-l-4 px-6 py-3 transition-colors hover:bg-gray-50', cfg.borderColor)}
                  onClick={() => navigate(alert.entityType === 'qualification' ? `/qualifications/${alert.entityId}` : `/purchases/${alert.entityId}`)}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg.dotColor)} />
                  <span className={cn('shrink-0 text-xs font-medium', cfg.color)}>{cfg.label}</span>
                  <span className="flex-1 truncate text-sm text-gray-700">{alert.message}</span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {alert.responsible}({alert.responsibleRole})
                  </span>
                  {alert.daysWaiting !== undefined && alert.daysWaiting > 0 && (
                    <span className="shrink-0 text-[10px] text-amber-500">
                      等待{alert.daysWaiting}天
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">最近操作</h2>
            <p className="text-xs text-gray-400">操作记录可追溯责任</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-3"><Skeleton className="h-5 w-full" /></div>
            ))}
            {!loading && activities.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">暂无操作记录</div>
            )}
            {activities.map((act, i) => (
              <div
                key={i}
                className={cn('flex items-center gap-3 px-6 py-2.5 text-sm', i % 2 === 1 && 'bg-gray-50/50')}
              >
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(act.created_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                {act.type === 'qualification' ? (
                  <QualificationBadge status="pending" className="!px-1.5 !py-px !text-[10px]" />
                ) : (
                  <PurchaseBadge status="pending_review" className="!px-1.5 !py-px !text-[10px]" />
                )}
                <span className="shrink-0 font-medium text-gray-700">{act.operator}</span>
                <span className="flex-1 truncate text-gray-600">{act.action}</span>
                <span
                  className="shrink-0 cursor-pointer text-blue-600 hover:underline"
                  onClick={() => navigate(act.type === 'qualification' ? `/qualifications/${act.entity_id}` : `/purchases/${act.entity_id}`)}
                >
                  {act.customer_name || act.request_no || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">资质概况</span>
              <span className="text-2xl font-bold text-gray-900">{stats.qualifications.total}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-gray-400" />待审核 {stats.qualifications.pending}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-green-500" />已通过 {stats.qualifications.approved}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-amber-500" />即将到期 {stats.qualifications.expiring_soon}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-red-500" />已过期 {stats.qualifications.expired}</span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">采购概况</span>
              <span className="text-2xl font-bold text-gray-900">{stats.purchases.total}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-blue-500" />待审核 {stats.purchases.pending_review}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-green-500" />已审核 {stats.purchases.approved}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-indigo-500" />已发货 {stats.purchases.shipped}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />已完成 {stats.purchases.completed}</span>
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">采购金额</span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">¥{stats.purchases.total_amount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">已完成 ¥{stats.purchases.completed_amount.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}
