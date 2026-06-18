import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { CheckSquare, Square, Eye, Filter, ChevronDown, Download, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function ComplaintTable() {
  const complaints = useAppStore((s) => s.complaints);
  const { selectedIds, toggleSelected, selectAll, clearSelected, batchUpdateComplaintStatus } = useAppStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = complaints.filter((c) => {
    const statusMatch = statusFilter === "all" || c.status === statusFilter;
    const severityMatch = severityFilter === "all" || c.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const allChecked = filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  const pendingCount = complaints.filter((c) => c.status === "pending" || c.status === "processing").length;
  const toVisitCount = complaints.filter((c) => c.status === "to_visit").length;
  const completedCount = complaints.filter((c) => c.status === "completed").length;

  const isUrgentOrOverdue = (c: typeof complaints[0]) => {
    if (c.severity === "urgent") return true;
    if (c.deadline && c.status !== "completed") {
      return new Date(c.deadline) < new Date();
    }
    return false;
  };

  const handleBatchMarkToVisit = () => {
    const ids = Array.from(selectedIds);
    batchUpdateComplaintStatus(ids, "to_visit");
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-flame-50 rounded-lg">
            <Clock className="w-4 h-4 text-flame-600" />
            <span className="text-sm text-flame-700">待处理</span>
            <span className="font-mono font-bold text-flame-700">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">待回访</span>
            <span className="font-mono font-bold text-blue-700">{toVisitCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">已完成</span>
            <span className="font-mono font-bold text-green-700">{completedCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
                <Filter className="w-4 h-4" />
                客诉状态
                <ChevronDown className="w-4 h-4 text-ink-400" />
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="pending">待受理</option>
                <option value="processing">处理中</option>
                <option value="to_visit">待回访</option>
                <option value="completed">已完成</option>
                <option value="escalated">已升级</option>
              </select>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
                <Filter className="w-4 h-4" />
                严重程度
                <ChevronDown className="w-4 h-4 text-ink-400" />
              </button>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                <option value="all">全部程度</option>
                <option value="normal">一般</option>
                <option value="serious">严重</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">已选 {selectedIds.size} 项</span>
              <button
                onClick={handleBatchMarkToVisit}
                className="text-sm px-3 py-1.5 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                批量标记待回访
              </button>
              <button className="text-sm px-3 py-1.5 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors flex items-center gap-1">
                <Download className="w-4 h-4" />
                批量导出
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-50 text-xs text-ink-500 uppercase tracking-wider">
              <th className="px-5 py-3 text-left w-12">
                <button onClick={() => (allChecked ? clearSelected() : selectAll(filtered.map((v) => v.id)))}>
                  {allChecked ? (
                    <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-50" />
                  ) : (
                    <Square className="w-4 h-4 text-ink-400" />
                  )}
                </button>
              </th>
              <th className="px-5 py-3 text-left">客诉单号</th>
              <th className="px-5 py-3 text-left">关联核销单</th>
              <th className="px-5 py-3 text-left">投诉内容</th>
              <th className="px-5 py-3 text-left">来源</th>
              <th className="px-5 py-3 text-left">严重程度</th>
              <th className="px-5 py-3 text-left">处理人</th>
              <th className="px-5 py-3 text-left">创建时间</th>
              <th className="px-5 py-3 text-left">状态</th>
              <th className="px-5 py-3 text-center w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((c) => (
              <tr
                key={c.id}
                className={`hover:bg-ink-50/70 transition-colors ${
                  selectedIds.has(c.id) ? "bg-brand-50/30" : ""
                } ${isUrgentOrOverdue(c) ? "bg-flame-50/30" : ""}`}
              >
                <td className="px-5 py-4">
                  <button onClick={() => toggleSelected(c.id)}>
                    {selectedIds.has(c.id) ? (
                      <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-50" />
                    ) : (
                      <Square className="w-4 h-4 text-ink-400" />
                    )}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-ink-900">{c.id}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-ink-700">{c.verificationId}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-ink-900 max-w-xs truncate">{c.content}</div>
                </td>
                <td className="px-5 py-4 text-sm text-ink-700">{c.source}</td>
                <td className="px-5 py-4">
                  <StatusBadge type="severity" value={c.severity} />
                </td>
                <td className="px-5 py-4 text-sm text-ink-700">{c.handler}</td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-ink-500">{c.createTime.slice(5, 16)}</span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge type="complaint" value={c.status} />
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors inline-flex"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
