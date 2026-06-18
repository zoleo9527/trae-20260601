import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { CheckSquare, Square, Eye, AlertTriangle, Filter, ChevronDown, Download } from "lucide-react";
import { useState } from "react";

export default function VerificationTable() {
  const verifications = useAppStore((s) => s.verifications);
  const { selectedIds, toggleSelected, selectAll, clearSelected } = useAppStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? verifications : verifications.filter((v) => v.status === statusFilter);
  const allChecked = filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
              <Filter className="w-4 h-4" />
              核销状态
              <ChevronDown className="w-4 h-4 text-ink-400" />
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="normal">正常核销</option>
              <option value="abnormal">异常核销</option>
              <option value="refunded">已退款</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <span>今日：</span>
            <span className="font-mono font-bold text-ink-900">{verifications.filter(v => v.verifyTime.startsWith("2026-06-18")).length}</span>
            <span className="text-ink-300">|</span>
            <span>总金额：</span>
            <span className="font-mono font-bold text-flame-700">¥{verifications.reduce((s, v) => s + v.amount, 0).toLocaleString()}</span>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">已选 {selectedIds.size} 项</span>
            <button className="text-sm px-3 py-1.5 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors flex items-center gap-1">
              <Download className="w-4 h-4" />
              批量导出
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-50 text-xs text-ink-500 uppercase tracking-wider">
              <th className="px-5 py-3 text-left w-12">
                <button onClick={() => allChecked ? clearSelected() : selectAll(filtered.map((v) => v.id))}>
                  {allChecked ? (
                    <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-50" />
                  ) : (
                    <Square className="w-4 h-4 text-ink-400" />
                  )}
                </button>
              </th>
              <th className="px-5 py-3 text-left">核销单号</th>
              <th className="px-5 py-3 text-left">团购平台</th>
              <th className="px-5 py-3 text-left">套餐信息</th>
              <th className="px-5 py-3 text-left">桌号/人数</th>
              <th className="px-5 py-3 text-right">金额</th>
              <th className="px-5 py-3 text-left">核销人</th>
              <th className="px-5 py-3 text-left">核销时间</th>
              <th className="px-5 py-3 text-left">状态</th>
              <th className="px-5 py-3 text-center w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((v) => (
              <tr
                key={v.id}
                className={`hover:bg-ink-50/70 transition-colors ${
                  selectedIds.has(v.id) ? "bg-brand-50/30" : ""
                } ${v.status === "abnormal" ? "bg-flame-50/30" : ""}`}
              >
                <td className="px-5 py-4">
                  <button onClick={() => toggleSelected(v.id)}>
                    {selectedIds.has(v.id) ? (
                      <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-50" />
                    ) : (
                      <Square className="w-4 h-4 text-ink-400" />
                    )}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-ink-900">{v.id}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-sm font-medium ${
                    v.platform === "美团" ? "text-yellow-600" : v.platform === "抖音" ? "text-ink-900" : "text-red-600"
                  }`}>
                    {v.platform}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-ink-900">{v.couponName}</div>
                  {v.complaintId && (
                    <div className="text-xs text-flame-600 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      关联客诉 {v.complaintId}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-ink-700">
                  <span className="font-medium">{v.tableNo}</span>
                  <span className="text-ink-400"> · {v.peopleCount}人</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="font-mono font-bold text-ink-900">¥{v.amount}</span>
                </td>
                <td className="px-5 py-4 text-sm text-ink-700">{v.cashier}</td>
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-ink-500">{v.verifyTime.slice(5, 16)}</span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge type="verification" value={v.status} />
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => navigate(`/verification/${v.id}`)}
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
