import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { StatusBadge, UrgencyBadge, GradingBadge } from "@/components/StatusBadge"
import { formatRelativeTime, cn, formatDateTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import type { Procurement, GradingLevel, Urgency } from "@/types"
import { Check, X, AlertTriangle, Clock, FileText, TrendingDown, Loader2, ArrowRight, Link2, AlertCircle, Zap, Timer, Flame } from "lucide-react"

type FilterTab = "ALL" | Urgency

export default function DispatcherDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [pendingQueue, setPendingQueue] = useState<Procurement[]>([])
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<GradingLevel | null>(null)
  const [anomalyNote, setAnomalyNote] = useState("")
  const [gradingRemarks, setGradingRemarks] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [gradingSuccess, setGradingSuccess] = useState<{ level: GradingLevel; procurementId: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState<"grade" | "reject" | null>(null)
  const [, forceUpdate] = useState(0)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    countdownTimerRef.current = setInterval(() => {
      forceUpdate((n) => n + 1)
    }, 1000)
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [])

  const fetchPendingQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/gradings/pending")
      const result = await res.json()
      if (result.success) {
        setPendingQueue(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch pending queue:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingQueue()
  }, [fetchPendingQueue])

  useEffect(() => {
    if (pendingQueue.length > 0 && !selectedProcurement) {
      setSelectedProcurement(pendingQueue[0])
    }
  }, [pendingQueue, selectedProcurement])

  const filteredQueue = activeFilter === "ALL"
    ? pendingQueue
    : pendingQueue.filter((p) => p.urgency === activeFilter)

  const selectNextItem = useCallback(() => {
    const currentIndex = pendingQueue.findIndex((p) => p.id === selectedProcurement?.id)
    const nextIndex = currentIndex + 1
    if (nextIndex < pendingQueue.length) {
      setSelectedProcurement(pendingQueue[nextIndex])
    } else {
      setSelectedProcurement(null)
    }
  }, [pendingQueue, selectedProcurement])

  const handleGrade = async () => {
    if (!selectedProcurement || !selectedLevel || !user) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/gradings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procurementId: selectedProcurement.id,
          level: selectedLevel,
          gradedById: user.id,
          anomalyNote: anomalyNote || undefined,
          remarks: gradingRemarks || undefined,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setGradingSuccess({ level: selectedLevel, procurementId: selectedProcurement.id })
        setShowConfirm(null)
        setPendingQueue((prev) => prev.filter((p) => p.id !== selectedProcurement.id))
      }
    } catch (error) {
      console.error("Failed to submit grading:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedProcurement || !user) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/procurements/${selectedProcurement.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changedById: user.id,
          reason: rejectReason || "退回采购",
        }),
      })
      const result = await res.json()
      if (result.success) {
        setShowConfirm(null)
        setPendingQueue((prev) => prev.filter((p) => p.id !== selectedProcurement.id))
        setSelectedProcurement(null)
        resetForm()
      }
    } catch (error) {
      console.error("Failed to reject procurement:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedLevel(null)
    setAnomalyNote("")
    setGradingRemarks("")
    setRejectReason("")
    setGradingSuccess(null)
  }

  const handleContinueNext = () => {
    resetForm()
    selectNextItem()
  }

  const handleSelectItem = (procurement: Procurement) => {
    setSelectedProcurement(procurement)
    resetForm()
  }

  const getWaitTime = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    
    if (diffMins < 60) return `${diffMins}分钟`
    return `${diffHours}小时${diffMins % 60}分`
  }

  const getWaitTimeWarning = (createdAt: string, urgency: Urgency) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000)
    
    const thresholds: Record<Urgency, number> = {
      CRITICAL: 15,
      URGENT: 30,
      NORMAL: 60,
    }
    
    if (diffMins > thresholds[urgency] * 2) return "critical"
    if (diffMins > thresholds[urgency]) return "warning"
    return "normal"
  }

  const getItemBorderClass = (urgency: Urgency, createdAt: string) => {
    const warning = getWaitTimeWarning(createdAt, urgency)
    switch (urgency) {
      case "CRITICAL":
        return warning === "critical" 
          ? "border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse" 
          : "border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
      case "URGENT":
        return warning === "critical"
          ? "border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
          : "border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
      default:
        return warning === "critical"
          ? "border border-zinc-600"
          : "border border-zinc-800"
    }
  }

  const getLevelButtonClass = (level: GradingLevel, isSelected: boolean) => {
    const base = "flex-1 py-4 px-2 rounded-lg font-bold text-lg transition-all duration-200 border-2"
    const variants: Record<GradingLevel, string> = {
      A: isSelected
        ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30"
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50",
      B: isSelected
        ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30"
        : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50",
      C: isSelected
        ? "bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/30"
        : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50",
      SCRAP: isSelected
        ? "bg-red-600 text-white border-red-400 shadow-lg shadow-red-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50",
    }
    return cn(base, variants[level])
  }

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0f0f1a]">
      <div className="flex h-full overflow-hidden">
        <div className="w-2/5 border-r border-zinc-800 flex flex-col bg-[#14141f]">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">待分级队列</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                  {pendingQueue.length}
                </span>
              </div>
              <button
                onClick={fetchPendingQueue}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Clock size={16} className={cn(loading && "animate-spin")} />
              </button>
            </div>
            {pendingQueue.length > 0 && (
              <div className="flex gap-2 mb-3">
                {pendingQueue.filter(p => p.urgency === "CRITICAL").length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs animate-pulse">
                    <Flame size={12} className="text-red-400" />
                    <span className="text-red-400 font-bold">
                      {pendingQueue.filter(p => p.urgency === "CRITICAL").length} 特急待处理
                    </span>
                  </div>
                )}
                {pendingQueue.filter(p => p.urgency === "URGENT").length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs">
                    <Zap size={12} className="text-orange-400" />
                    <span className="text-orange-400 font-medium">
                      {pendingQueue.filter(p => p.urgency === "URGENT").length} 紧急
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-1">
              {([
                { key: "ALL", label: "全部" },
                { key: "CRITICAL", label: "特急" },
                { key: "URGENT", label: "紧急" },
                { key: "NORMAL", label: "普通" },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors",
                    activeFilter === tab.key
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-zinc-500" />
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Check size={32} className="mb-2 opacity-50" />
                <p className="text-sm">暂无待分级项</p>
              </div>
            ) : (
              filteredQueue.map((procurement) => {
                const warning = getWaitTimeWarning(procurement.createdAt, procurement.urgency)
                return (
                  <button
                    key={procurement.id}
                    onClick={() => handleSelectItem(procurement)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200 relative overflow-hidden",
                      "hover:bg-zinc-800/50",
                      selectedProcurement?.id === procurement.id
                        ? "bg-zinc-800/70 border-l-4 border-emerald-500"
                        : "border-l-4 border-transparent",
                      getItemBorderClass(procurement.urgency, procurement.createdAt)
                    )}
                  >
                    {warning === "critical" && (
                      <div className="absolute top-0 right-0 w-2 h-2">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                        <div className="absolute inset-0 bg-red-500 rounded-full" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {procurement.urgency === "CRITICAL" && (
                          <Flame size={14} className="text-red-500 flex-shrink-0 animate-pulse" />
                        )}
                        {procurement.urgency === "URGENT" && (
                          <Zap size={14} className="text-orange-500 flex-shrink-0" />
                        )}
                        <p className="font-bold text-sm truncate">{procurement.flowerName}</p>
                      </div>
                      <UrgencyBadge urgency={procurement.urgency} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
                      <span>{procurement.quantity}{procurement.unit}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="truncate">{procurement.supplier}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded",
                        warning === "critical" ? "bg-red-500/20 text-red-400" :
                        warning === "warning" ? "bg-amber-500/20 text-amber-400" :
                        "text-zinc-500"
                      )}>
                        <Timer size={10} />
                        <span>等待 {getWaitTime(procurement.createdAt)}</span>
                      </div>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500">{procurement.createdBy.name}</span>
                    </div>
                    {procurement.remarks && (
                      <p className="text-xs italic text-zinc-400/80 truncate mt-1">
                        <FileText size={10} className="inline mr-1 text-amber-400" />
                        {procurement.remarks}
                      </p>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-auto bg-[#0f0f1a]">
          {!selectedProcurement ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <TrendingDown size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">选择待分级花材开始操作</p>
              <p className="text-sm mt-1">从左侧队列中选择一条进行分级处理</p>
            </div>
          ) : gradingSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center max-w-md w-full">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">分级完成</h3>
                <p className="text-zinc-400 mb-4">已成功提交分级结果</p>
                <div className="mb-6">
                  <GradingBadge level={gradingSuccess.level} className="text-lg px-4 py-2" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleContinueNext}
                    className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    继续下一条
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate(`/trace/${gradingSuccess.procurementId}`)}
                    className="py-3 px-4 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium transition-colors flex items-center gap-2"
                  >
                    <Link2 size={16} />
                    查看链路
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-2xl font-bold">{selectedProcurement.flowerName}</h3>
                  <UrgencyBadge urgency={selectedProcurement.urgency} className="text-sm" />
                  <StatusBadge status={selectedProcurement.status} />
                </div>
                <div className={cn(
                  "p-3 rounded-lg border",
                  getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "critical"
                    ? "bg-red-500/10 border-red-500/30"
                    : getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "warning"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-zinc-800/50 border-zinc-700"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Timer size={16} className={cn(
                      getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "critical"
                        ? "text-red-400 animate-pulse"
                        : getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "warning"
                        ? "text-amber-400"
                        : "text-zinc-400"
                    )} />
                    <span className={cn(
                      "font-bold",
                      getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "critical"
                        ? "text-red-400"
                        : getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "warning"
                        ? "text-amber-400"
                        : "text-zinc-300"
                    )}>
                      已等待 {getWaitTime(selectedProcurement.createdAt)}
                    </span>
                    {getWaitTimeWarning(selectedProcurement.createdAt, selectedProcurement.urgency) === "critical" && (
                      <span className="text-xs text-red-400 ml-2">⚠️ 超时预警</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    创建于 {formatDateTime(selectedProcurement.createdAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">数量：</span>
                    <span className="text-zinc-200 font-medium">{selectedProcurement.quantity}{selectedProcurement.unit}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">供应商：</span>
                    <span className="text-zinc-200 font-medium">{selectedProcurement.supplier}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">花艺师：</span>
                    <span className="text-zinc-200 font-medium">{selectedProcurement.createdBy.name}</span>
                  </div>
                </div>
              </div>

              {selectedProcurement.remarks && (
                <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
                  <p className="text-amber-400 font-medium text-sm mb-2 flex items-center gap-2">
                    <span>📝</span>
                    来自花艺师的采购备注
                  </p>
                  <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedProcurement.remarks}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  执行分级
                </label>
                <div className="flex gap-3">
                  {(["A", "B", "C", "SCRAP"] as GradingLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={getLevelButtonClass(level, selectedLevel === level)}
                    >
                      {level === "SCRAP" ? "报废" : `${level}级`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    异常说明
                  </label>
                  <textarea
                    value={anomalyNote}
                    onChange={(e) => setAnomalyNote(e.target.value)}
                    placeholder="如有异常请在此说明..."
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    分级备注
                  </label>
                  <textarea
                    value={gradingRemarks}
                    onChange={(e) => setGradingRemarks(e.target.value)}
                    placeholder="分级备注信息..."
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm("grade")}
                  disabled={!selectedLevel || submitting}
                  className={cn(
                    "flex-1 py-3.5 rounded-lg font-bold text-base transition-all duration-200 flex items-center justify-center gap-2",
                    selectedLevel && !submitting
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  确认分级
                </button>
                <button
                  onClick={() => setShowConfirm("reject")}
                  disabled={submitting}
                  className="py-3.5 px-6 rounded-lg font-bold text-base transition-colors border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 flex items-center gap-2"
                >
                  <X size={18} />
                  退回采购
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-zinc-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {showConfirm === "grade" ? (
              <>
                <h3 className="text-lg font-bold mb-2">确认分级</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  确定将 <span className="text-zinc-200 font-medium">{selectedProcurement?.flowerName}</span> 分级为
                </p>
                <div className="mb-6 flex justify-center">
                  {selectedLevel && <GradingBadge level={selectedLevel} className="text-xl px-6 py-3" />}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleGrade}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    确认提交
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-2 text-red-400">退回采购</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  确定将 <span className="text-zinc-200 font-medium">{selectedProcurement?.flowerName}</span> 退回？
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    退回原因
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入退回原因..."
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    确认退回
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
