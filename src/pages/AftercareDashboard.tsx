import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { StatusBadge, UrgencyBadge, GradingBadge } from "@/components/StatusBadge"
import { formatRelativeTime, formatDateTime, cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import type { Procurement, ProcurementStatus } from "@/types"
import { Search, Eye, Clock, FileText, AlertCircle, Check, ArrowRight, RotateCcw, Flag, Loader2 } from "lucide-react"

type StatusTab = "ALL" | ProcurementStatus
type TimeRange = "TODAY" | "7DAYS" | "30DAYS"

export default function AftercareDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState<StatusTab>("ALL")
  const [timeRange, setTimeRange] = useState<TimeRange>("7DAYS")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [flagging, setFlagging] = useState<string | null>(null)

  const fetchProcurements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeStatus !== "ALL") {
        params.set("status", activeStatus)
      }
      if (searchQuery) {
        params.set("search", searchQuery)
      }
      params.set("pageSize", "50")

      const res = await fetch(`/api/procurements?${params.toString()}`)
      const result = await res.json()
      if (result.success) {
        setProcurements(result.data.list)
      }
    } catch (error) {
      console.error("Failed to fetch procurements:", error)
    } finally {
      setLoading(false)
    }
  }, [activeStatus, searchQuery])

  useEffect(() => {
    fetchProcurements()
  }, [fetchProcurements])

  const handleRowClick = (id: string) => {
    navigate(`/trace/${id}`)
  }

  const handleFlagReview = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    setFlagging(id)
    try {
      const res = await fetch(`/api/procurements/${id}/flag-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changedById: user.id }),
      })
      const result = await res.json()
      if (result.success) {
        setProcurements((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "NEEDS_REVIEW" as ProcurementStatus } : p))
        )
      }
    } catch (error) {
      console.error("Failed to flag review:", error)
    } finally {
      setFlagging(null)
    }
  }

  const getRowHighlightClass = (status: ProcurementStatus) => {
    switch (status) {
      case "NEEDS_REVIEW":
        return "bg-purple-500/5 hover:bg-purple-500/10"
      case "REJECTED":
        return "bg-red-500/5 hover:bg-red-500/10"
      default:
        return "hover:bg-zinc-800/50"
    }
  }

  const statusTabs: { key: StatusTab; label: string }[] = [
    { key: "ALL", label: "全部" },
    { key: "PENDING", label: "待办" },
    { key: "IN_PROGRESS", label: "处理中" },
    { key: "REJECTED", label: "被退回" },
    { key: "CLOSED", label: "已关闭" },
    { key: "NEEDS_REVIEW", label: "需回查" },
  ]

  const timeRangeOptions: { key: TimeRange; label: string }[] = [
    { key: "TODAY", label: "今天" },
    { key: "7DAYS", label: "7天" },
    { key: "30DAYS", label: "30天" },
  ]

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-zinc-100">
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">售后客服工作台</h1>
          <p className="text-zinc-400 text-sm">管理和追踪所有花材采购与分级流程</p>
        </div>

        <div className="bg-[#14141f] border border-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索花材名称或供应商..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    activeStatus === tab.key
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setTimeRange(option.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    timeRange === option.key
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchProcurements}
              className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RotateCcw size={16} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </div>

        <div className="bg-[#14141f] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/30">
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">花材</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">数量</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">供应商</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">紧急度</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">分级结果</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">创建时间</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Loader2 size={24} className="animate-spin text-zinc-500 mx-auto" />
                    </td>
                  </tr>
                ) : procurements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-zinc-500">
                      <Check size={32} className="mx-auto mb-2 opacity-50" />
                      <p>暂无数据</p>
                    </td>
                  </tr>
                ) : (
                  procurements.map((procurement) => (
                    <tr
                      key={procurement.id}
                      onClick={() => handleRowClick(procurement.id)}
                      className={cn(
                        "border-b border-zinc-800/50 cursor-pointer transition-colors",
                        getRowHighlightClass(procurement.status)
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200">{procurement.flowerName}</span>
                          {procurement.remarks && (
                            <FileText size={12} className="text-amber-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {procurement.quantity}{procurement.unit}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{procurement.supplier}</td>
                      <td className="px-4 py-3">
                        <UrgencyBadge urgency={procurement.urgency} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={procurement.status} />
                      </td>
                      <td className="px-4 py-3">
                        {procurement.grading ? (
                          <GradingBadge level={procurement.grading.level} />
                        ) : (
                          <span className="text-zinc-500 text-xs">未分级</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-300">{formatDateTime(procurement.createdAt)}</div>
                        <div className="text-zinc-500 text-xs">{formatRelativeTime(procurement.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {procurement.status !== "NEEDS_REVIEW" && (
                            <button
                              onClick={(e) => handleFlagReview(procurement.id, e)}
                              disabled={flagging === procurement.id}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                              title="标记需回查"
                            >
                              {flagging === procurement.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Flag size={14} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(procurement.id)
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                          >
                            <Eye size={12} />
                            查看链路
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
