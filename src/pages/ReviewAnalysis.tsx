import { useComplaintStore } from "@/store/complaintStore"
import {
  PROBLEM_TYPE_LABELS,
  ROOT_CAUSE_LABELS,
  COMPENSATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/types"
import type { RootCause, ProblemType, CompensationType } from "@/types"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const ROOT_CAUSE_COLORS: Record<RootCause, string> = {
  production: "#3D8558",
  delivery: "#F59E0B",
  note_understanding: "#E8734A",
  other: "#94A3B8",
}

const PROBLEM_TYPE_BAR_COLORS: Record<ProblemType, string> = {
  delivery_late: "#F59E0B",
  flower_replace: "#3D8558",
  card_error: "#E8734A",
  customer_reject: "#E63946",
}

export default function ReviewAnalysis() {
  const complaints = useComplaintStore((s) => s.complaints)

  const reviewedComplaints = complaints.filter((c) => c.reviewConclusion)
  const rootCauseData = Object.entries(
    reviewedComplaints.reduce<Record<string, number>>((acc, c) => {
      if (c.reviewConclusion) {
        acc[c.reviewConclusion.rootCause] = (acc[c.reviewConclusion.rootCause] || 0) + 1
      }
      return acc
    }, {})
  ).map(([name, value]) => ({
    name: ROOT_CAUSE_LABELS[name as RootCause],
    value,
    color: ROOT_CAUSE_COLORS[name as RootCause],
  }))

  const problemTypeStats = Object.entries(
    complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.problemType] = (acc[c.problemType] || 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({
    name: PROBLEM_TYPE_LABELS[name as ProblemType],
    count,
    color: PROBLEM_TYPE_BAR_COLORS[name as ProblemType],
  })).sort((a, b) => b.count - a.count)

  const compensationStats = Object.entries(
    complaints.filter((c) => c.compensation).reduce<Record<string, number>>((acc, c) => {
      if (c.compensation) {
        acc[c.compensation.type] = (acc[c.compensation.type] || 0) + 1
      }
      return acc
    }, {})
  ).map(([name, count]) => ({
    name: COMPENSATION_LABELS[name as CompensationType],
    count,
  }))

  const totalComplaints = complaints.length
  const reviewedCount = reviewedComplaints.length
  const reviewRate = totalComplaints > 0 ? Math.round((reviewedCount / totalComplaints) * 100) : 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-5 h-5 text-brand-500" />
          <h2 className="font-serif text-2xl font-semibold text-moss-900">复盘分析</h2>
        </div>
        <p className="text-sm text-moss-600/60 ml-8">问题归因与高频洞察，驱动持续改进</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="客诉总量" value={totalComplaints} accent="brand" />
        <StatCard label="已复盘" value={reviewedCount} accent="moss" />
        <StatCard label="复盘率" value={`${reviewRate}%`} accent="moss" />
        <StatCard label="待处理" value={complaints.filter((c) => c.status === "pending" || c.status === "processing").length} accent="blush" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-moss-100 p-5">
          <h3 className="font-serif text-base font-semibold text-moss-900 mb-4">问题归因分布</h3>
          {rootCauseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={rootCauseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {rootCauseData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #D4E8DB",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-sm text-moss-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-moss-200 mx-auto mb-2" />
                <p className="text-sm text-moss-400">暂无复盘数据</p>
                <p className="text-xs text-moss-300 mt-1">请先完成工单的复盘结论填写</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-moss-100 p-5">
          <h3 className="font-serif text-base font-semibold text-moss-900 mb-4">问题类型统计</h3>
          <div className="space-y-4">
            {problemTypeStats.map((stat) => {
              const maxCount = Math.max(...problemTypeStats.map((s) => s.count))
              const widthPct = maxCount > 0 ? (stat.count / maxCount) * 100 : 0
              return (
                <div key={stat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-moss-700">{stat.name}</span>
                    <span className="text-sm text-moss-500">{stat.count} 起</span>
                  </div>
                  <div className="h-2.5 bg-moss-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="floral-divider my-5" />

          <h4 className="text-sm font-medium text-moss-700 mb-3">补偿方式分布</h4>
          <div className="grid grid-cols-3 gap-3">
            {compensationStats.map((stat) => (
              <div key={stat.name} className="text-center p-3 rounded-lg bg-cream/70">
                <p className="text-lg font-serif font-semibold text-moss-800">{stat.count}</p>
                <p className="text-xs text-moss-500">{stat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-moss-100 p-5">
        <h3 className="font-serif text-base font-semibold text-moss-900 mb-4">近期工单明细</h3>
        <div className="overflow-hidden rounded-lg border border-moss-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50">
                <th className="text-left px-4 py-2.5 font-medium text-moss-600">工单号</th>
                <th className="text-left px-4 py-2.5 font-medium text-moss-600">客户</th>
                <th className="text-left px-4 py-2.5 font-medium text-moss-600">问题类型</th>
                <th className="text-left px-4 py-2.5 font-medium text-moss-600">补偿方式</th>
                <th className="text-left px-4 py-2.5 font-medium text-moss-600">归因</th>
                <th className="text-left px-4 py-2.5 font-medium text-moss-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c, i) => (
                <tr key={c.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-cream/30")}>
                  <td className="px-4 py-2.5 font-medium text-moss-800">{c.id}</td>
                  <td className="px-4 py-2.5 text-moss-600">{c.customerName}</td>
                  <td className="px-4 py-2.5 text-moss-600">{PROBLEM_TYPE_LABELS[c.problemType]}</td>
                  <td className="px-4 py-2.5 text-moss-600">
                    {c.compensation ? COMPENSATION_LABELS[c.compensation.type] : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-moss-600">
                    {c.reviewConclusion ? ROOT_CAUSE_LABELS[c.reviewConclusion.rootCause] : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[c.status])}>
                      {STATUS_LABELS[c.status]}
                    </span>
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

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  const accentStyles: Record<string, string> = {
    brand: "border-brand-200 bg-brand-50/50",
    moss: "border-moss-200 bg-moss-50/50",
    blush: "border-blush-200 bg-blush-50/50",
  }
  const valueStyles: Record<string, string> = {
    brand: "text-brand-600",
    moss: "text-moss-700",
    blush: "text-blush-500",
  }

  return (
    <div className={cn("rounded-xl border p-4", accentStyles[accent])}>
      <p className="text-xs text-moss-500 mb-1">{label}</p>
      <p className={cn("font-serif text-2xl font-semibold", valueStyles[accent])}>{value}</p>
    </div>
  )
}

