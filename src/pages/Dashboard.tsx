import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Bell, FileX, Clock, XCircle, Calendar, ChevronRight } from 'lucide-react'
import AnomalyCard from '@/components/AnomalyCard'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

interface DiversionItem {
  id: string
  examNo: string
  patientName: string
  anomalyType: string[]
  urgency: 'normal' | 'urgent' | 'timeout'
  status: string
  createdAt: string
}

interface MissedItem {
  id: string
  examNo: string
  patientName: string
  itemName: string
  requiredDept: string
  status: string
  createdAt: string
}

interface DashboardData {
  urgentDiversions: DiversionItem[]
  pendingDiversions: DiversionItem[]
  missedStats: {
    pending: number
    reminded: number
    completed: number
    closed: number
    total: number
  }
  anomalyBreakdown: {
    missing_material: number
    timeout: number
    review_failed: number
  }
  recentMissed: MissedItem[]
  todayDate: string
}

const anomalyLabelMap: Record<string, string> = {
  missing_material: '缺材料',
  timeout: '超时',
  review_failed: '复核不通过',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        setData(json)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        加载中...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        暂无数据
      </div>
    )
  }

  const totalAnomalies = data.anomalyBreakdown.missing_material + data.anomalyBreakdown.timeout + data.anomalyBreakdown.review_failed

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5" />
              <span className="text-sm opacity-90">今日日期：{data.todayDate}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">今日待办总览</h1>
            <p className="text-sm opacity-80">共 {totalAnomalies} 条异常待处理，{data.missedStats.pending + data.missedStats.reminded} 条漏项待跟进</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{data.urgentDiversions.length}</div>
            <div className="text-sm opacity-80">紧急异常</div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-gray-800">优先处理 - 异常单</h2>
          <span className="text-sm text-red-500 font-medium ml-2">{data.urgentDiversions.length} 条需立即处理</span>
        </div>
        {data.urgentDiversions.length === 0 ? (
          <div className="bg-white rounded-lg border border-warm-300 p-8 text-center text-gray-400 text-sm">
            暂无紧急异常
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {data.urgentDiversions.map((d) => (
              <AnomalyCard key={d.id} diversion={d} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-800">异常类型分布</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <AnomalyStatCard
            icon={<FileX className="w-6 h-6" />}
            label="缺材料"
            count={data.anomalyBreakdown.missing_material}
            color="red"
            description="体检材料不完整，需补充后继续"
          />
          <AnomalyStatCard
            icon={<Clock className="w-6 h-6" />}
            label="超时"
            count={data.anomalyBreakdown.timeout}
            color="amber"
            description="已超过处理时限，需加急处理"
          />
          <AnomalyStatCard
            icon={<XCircle className="w-6 h-6" />}
            label="复核不通过"
            count={data.anomalyBreakdown.review_failed}
            color="red"
            description="报告审核未通过，需重新处理"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-800">今日待处理分流</h2>
            <span className="text-sm text-gray-400 ml-2">{data.pendingDiversions.length} 条待处理</span>
          </div>
          <button
            onClick={() => navigate('/diversion')}
            className="text-sm text-primary hover:text-primary-light inline-flex items-center gap-1 font-medium"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {data.pendingDiversions.length === 0 ? (
          <div className="bg-white rounded-lg border border-warm-300 p-8 text-center text-gray-400 text-sm">
            暂无待处理分流
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-warm-300 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-warm-50 border-b border-warm-300">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">优先级</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">体检编号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">异常类型</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">紧急程度</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingDiversions.map((d, idx) => (
                  <tr key={d.id} className="border-b border-warm-200 last:border-0 hover:bg-warm-50">
                    <td className="px-4 py-3">
                      {idx < 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                          {idx + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">{d.examNo}</td>
                    <td className="px-4 py-3 text-gray-700">{d.patientName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.anomalyType.length > 0
                        ? d.anomalyType.map((t) => anomalyLabelMap[t] || t).join('、')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {d.urgency === 'timeout' && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">已超时</span>}
                      {d.urgency === 'urgent' && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">紧急</span>}
                      {d.urgency === 'normal' && <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded">普通</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} type="diversion" /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/diversion/${d.id}`)}
                        className="text-xs text-primary hover:text-primary-light font-medium"
                      >
                        处理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-gray-800">漏项提醒</h2>
          </div>
          <button
            onClick={() => navigate('/missed')}
            className="text-sm text-primary hover:text-primary-light inline-flex items-center gap-1 font-medium"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard label="待处理" value={data.missedStats.pending} color="amber" />
          <StatCard label="已提醒" value={data.missedStats.reminded} color="blue" />
          <StatCard label="已补检" value={data.missedStats.completed} color="green" />
          <StatCard label="总计" value={data.missedStats.total} color="gray" />
        </div>
        {data.recentMissed.length > 0 && (
          <div className="bg-white rounded-lg border border-warm-300 overflow-hidden">
            <div className="px-4 py-2 bg-warm-50 border-b border-warm-300">
              <span className="text-xs font-medium text-gray-600">待跟进漏项</span>
            </div>
            {data.recentMissed.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/missed/${m.id}`)}
                className="flex items-center justify-between px-4 py-3 border-b border-warm-200 last:border-0 hover:bg-warm-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-accent" />
                  <div>
                    <span className="text-sm text-gray-800 font-medium">{m.patientName}</span>
                    <span className="text-sm text-gray-500 mx-2">|</span>
                    <span className="text-sm text-gray-600">{m.itemName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{m.examNo}</span>
                  <StatusBadge status={m.status} type="missed" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'border-l-accent text-accent',
    blue: 'border-l-blue-500 text-blue-600',
    green: 'border-l-emerald-500 text-emerald-600',
    gray: 'border-l-gray-400 text-gray-600',
  }

  return (
    <div className={`bg-white rounded-lg border border-warm-300 border-l-4 p-4 ${colorMap[color] ?? ''}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function AnomalyStatCard({
  icon,
  label,
  count,
  color,
  description,
}: {
  icon: React.ReactNode
  label: string
  count: number
  color: string
  description: string
}) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  }

  return (
    <div className={cn('bg-white rounded-lg border border-warm-300 p-4 flex items-start gap-4', count > 0 && colorMap[color])}>
      <div className={cn('p-2 rounded-lg', count > 0 ? 'bg-white' : 'bg-gray-100')}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          <span className={cn('text-lg font-bold', count > 0 ? (color === 'red' ? 'text-red-600' : 'text-amber-600') : 'text-gray-400')}>
            {count}
          </span>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}
