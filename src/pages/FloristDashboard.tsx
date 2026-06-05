import { useState, useEffect } from "react"
import { StatusBadge, UrgencyBadge, GradingBadge } from "@/components/StatusBadge"
import { formatRelativeTime, cn, formatDateTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import type { Procurement, ProcurementStatus, Urgency } from "@/types"
import { STATUS_LABELS, URGENCY_LABELS } from "@/types"
import { Plus, Search, Send, RotateCcw, Eye, FileText, AlertTriangle, Loader2 } from "lucide-react"

const FILTER_TABS: { key: ProcurementStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "PENDING", label: "待办" },
  { key: "IN_PROGRESS", label: "处理中" },
  { key: "REJECTED", label: "被退回" },
  { key: "CLOSED", label: "已关闭" },
  { key: "NEEDS_REVIEW", label: "需回查" },
]

const UNIT_OPTIONS = ["扎", "束", "枝", "盒", "箱"]
const URGENCY_OPTIONS: Urgency[] = ["NORMAL", "URGENT", "CRITICAL"]

interface FormData {
  flowerName: string
  quantity: number
  unit: string
  supplier: string
  urgency: Urgency
  remarks: string
}

const EMPTY_FORM: FormData = {
  flowerName: "",
  quantity: 1,
  unit: "扎",
  supplier: "",
  urgency: "NORMAL",
  remarks: "",
}

export default function FloristDashboard() {
  const { user } = useAuthStore()
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<ProcurementStatus | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)

  const fetchProcurements = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "ALL") params.append("status", filterStatus)
      if (searchQuery) params.append("search", searchQuery)
      params.append("pageSize", "50")

      const res = await fetch(`/api/procurements?${params}`)
      const json = await res.json()
      if (json.success) {
        setProcurements(json.data.list)
      }
    } catch (error) {
      console.error("Failed to fetch procurements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProcurementDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/procurements/${id}`)
      const json = await res.json()
      if (json.success) {
        setSelectedProcurement(json.data)
        setFormData({
          flowerName: json.data.flowerName,
          quantity: json.data.quantity,
          unit: json.data.unit,
          supplier: json.data.supplier,
          urgency: json.data.urgency,
          remarks: json.data.remarks || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch procurement detail:", error)
    }
  }

  useEffect(() => {
    fetchProcurements()
  }, [filterStatus, searchQuery])

  useEffect(() => {
    if (selectedId && !isCreating) {
      fetchProcurementDetail(selectedId)
    }
  }, [selectedId, isCreating])

  const handleSelectCard = (id: string) => {
    setSelectedId(id)
    setIsCreating(false)
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedId(null)
    setSelectedProcurement(null)
    setFormData(EMPTY_FORM)
  }

  const handleCreate = async () => {
    if (!formData.flowerName.trim() || !user) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/procurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          createdById: user.id,
        }),
      })
      const json = await res.json()
      if (json.success) {
        await fetchProcurements()
        setSelectedId(json.data.id)
        setIsCreating(false)
        setSelectedProcurement(json.data)
      }
    } catch (error) {
      console.error("Failed to create procurement:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedId || !formData.flowerName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/procurements/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) {
        await fetchProcurements()
        setSelectedProcurement(json.data)
      }
    } catch (error) {
      console.error("Failed to save draft:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedId || !user) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/procurements/${selectedId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changedById: user.id }),
      })
      const json = await res.json()
      if (json.success) {
        await fetchProcurements()
        fetchProcurementDetail(selectedId)
      }
    } catch (error) {
      console.error("Failed to submit:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleResubmit = async () => {
    if (!selectedId || !user) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/procurements/${selectedId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changedById: user.id }),
      })
      const json = await res.json()
      if (json.success) {
        await fetchProcurements()
        fetchProcurementDetail(selectedId)
      }
    } catch (error) {
      console.error("Failed to resubmit:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isEditable = selectedProcurement?.status === "PENDING" || selectedProcurement?.status === "REJECTED" || isCreating
  const showForm = isCreating || isEditable

  return (
    <div className="flex h-screen bg-[#0f0f1a] text-zinc-100">
      <div className="w-1/3 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">花材采购</h1>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded text-sm transition-colors"
            >
              <Plus size={16} />
              新建采购单
            </button>
          </div>
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
                  filterStatus === tab.key
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="搜索花材名称或供应商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 bg-zinc-900/50 rounded animate-pulse">
                  <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2" />
                  <div className="flex gap-2 mb-2">
                    <div className="h-5 bg-zinc-800 rounded w-16" />
                    <div className="h-5 bg-zinc-800 rounded w-16" />
                  </div>
                  <div className="h-3 bg-zinc-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : procurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <FileText size={48} className="mb-3 opacity-50" />
              <p className="text-sm">暂无采购单</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {procurements.map((proc) => (
                <div
                  key={proc.id}
                  onClick={() => handleSelectCard(proc.id)}
                  className={cn(
                    "p-3 rounded cursor-pointer transition-all border-l-4",
                    selectedId === proc.id
                      ? "bg-zinc-800/50 border-amber-500"
                      : proc.status === "REJECTED"
                      ? "bg-zinc-900/50 border-red-500 hover:bg-zinc-800/30"
                      : "bg-zinc-900/50 border-transparent hover:bg-zinc-800/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="font-semibold text-sm">{proc.flowerName}</span>
                      <span className="text-zinc-400 text-sm ml-2">
                        {proc.quantity} {proc.unit}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">{proc.supplier || "未指定供应商"}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={proc.status} />
                    <UrgencyBadge urgency={proc.urgency} />
                  </div>
                  <p className="text-xs text-zinc-500 mb-1">
                    {formatRelativeTime(proc.createdAt)}
                  </p>
                  {proc.remarks && (
                    <p className="text-xs text-zinc-400 italic truncate">{proc.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedId && !isCreating ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Eye size={64} className="mb-4 opacity-30" />
            <p className="text-lg">选择采购单查看详情</p>
            <p className="text-sm mt-1">或</p>
            <button
              onClick={handleCreateNew}
              className="mt-3 text-amber-400 hover:text-amber-300 text-sm font-medium"
            >
              新建采购单
            </button>
          </div>
        ) : showForm ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-bold mb-6">
                {isCreating ? "新建采购单" : isEditable ? "编辑采购单" : "采购单详情"}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    花材名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.flowerName}
                    onChange={(e) => setFormData({ ...formData, flowerName: e.target.value })}
                    placeholder="请输入花材名称"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">数量</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">单位</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600"
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">供应商</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="请输入供应商名称"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600 placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">紧急度</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as Urgency })}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600"
                  >
                    {URGENCY_OPTIONS.map((u) => (
                      <option key={u} value={u}>{URGENCY_LABELS[u]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    此备注将传递到到货分级环节
                  </label>
                  <textarea
                    rows={5}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="请输入备注信息..."
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-amber-500/50 rounded text-sm focus:outline-none focus:border-amber-500 placeholder-zinc-500 resize-none"
                    style={{ boxShadow: "0 0 0 1px rgba(245, 158, 11, 0.3)" }}
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    配送调度人员将看到此备注，请填写关键要求
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
                {isCreating ? (
                  <button
                    onClick={handleCreate}
                    disabled={isSaving || !formData.flowerName.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-medium rounded transition-colors"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    创建
                  </button>
                ) : (
                  <>
                    {selectedProcurement?.status === "PENDING" && (
                      <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-medium rounded transition-colors"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        提交审核
                      </button>
                    )}
                    {selectedProcurement?.status === "REJECTED" && (
                      <button
                        onClick={handleResubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-medium rounded transition-colors"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                        重新提交
                      </button>
                    )}
                    <button
                      onClick={handleSaveDraft}
                      disabled={isSaving || !formData.flowerName.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50 text-white font-medium rounded transition-colors"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                      保存草稿
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              {selectedProcurement && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">采购单详情</h2>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedProcurement.status} />
                      <UrgencyBadge urgency={selectedProcurement.urgency} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-900/50 rounded">
                        <p className="text-xs text-zinc-500 mb-1">花材名称</p>
                        <p className="font-semibold">{selectedProcurement.flowerName}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/50 rounded">
                        <p className="text-xs text-zinc-500 mb-1">数量</p>
                        <p className="font-semibold">
                          {selectedProcurement.quantity} {selectedProcurement.unit}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded">
                      <p className="text-xs text-zinc-500 mb-1">供应商</p>
                      <p className="font-medium">{selectedProcurement.supplier || "未指定"}</p>
                    </div>
                    {selectedProcurement.remarks && (
                      <div className="p-4 bg-zinc-900/50 rounded border border-amber-500/30">
                        <p className="text-xs text-amber-400 mb-1.5 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          备注（传递至后续环节）
                        </p>
                        <p className="text-sm text-zinc-200">{selectedProcurement.remarks}</p>
                      </div>
                    )}
                    {selectedProcurement.grading && (
                      <div className="p-4 bg-zinc-900/50 rounded border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-3">到货分级结果</p>
                        <div className="flex items-center gap-3 mb-3">
                          <GradingBadge level={selectedProcurement.grading.level} />
                          <span className="text-sm text-zinc-400">
                            由 {selectedProcurement.grading.gradedBy?.name} 于 {formatDateTime(selectedProcurement.grading.gradedAt)}
                          </span>
                        </div>
                        {selectedProcurement.grading.anomalyNote && (
                          <div className="mb-2">
                            <p className="text-xs text-red-400 mb-1">异常说明</p>
                            <p className="text-sm text-zinc-300">{selectedProcurement.grading.anomalyNote}</p>
                          </div>
                        )}
                        {selectedProcurement.grading.remarks && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">分级备注</p>
                            <p className="text-sm text-zinc-300">{selectedProcurement.grading.remarks}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => (window.location.href = `/trace/${selectedProcurement.id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium transition-colors"
                    >
                      <FileText size={16} />
                      查看完整链路
                    </button>
                    {selectedProcurement.statusChanges && selectedProcurement.statusChanges.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-4">状态历史</h3>
                        <div className="relative">
                          <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-800" />
                          <div className="space-y-4">
                            {selectedProcurement.statusChanges.map((change, idx) => (
                              <div key={change.id} className="relative pl-8">
                                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-700 border-2 border-zinc-600" />
                                <div className="flex items-center gap-2 mb-1">
                                  <StatusBadge status={change.toStatus} />
                                  <span className="text-xs text-zinc-500">
                                    {formatDateTime(change.changedAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400">
                                  由 {change.changedBy?.name} 操作
                                  {idx > 0 && ` 从 ${STATUS_LABELS[change.fromStatus]}`}
                                </p>
                                {change.reason && (
                                  <p className="text-xs text-zinc-500 mt-1">原因: {change.reason}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
