#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os

BASE_DIR = "/Users/liu/Documents/private/model-test/trae-20260601-4"

def write_file(path, content):
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ {path}")

# 1. App.tsx - 路由配置
app_tsx = '''import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Dashboard from "@/pages/Dashboard";
import VerificationList from "@/pages/VerificationList";
import VerificationDetailPage from "@/pages/VerificationDetailPage";
import ComplaintList from "@/pages/ComplaintList";
import ComplaintDetailPage from "@/pages/ComplaintDetailPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/verification" element={<VerificationList />} />
          <Route path="/verification/:id" element={<VerificationDetailPage />} />
          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
'''

write_file("src/App.tsx", app_tsx)

# 2. store/useAppStore.ts - 完善状态管理
store_ts = '''import { create } from "zustand";
import type { UserRole, Verification, Complaint, ActivityItem } from "@/types";
import { mockVerifications, mockComplaints, mockActivities, getRoleTodos, getRoleRisks } from "@/data/mockData";

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  verifications: Verification[];
  complaints: Complaint[];
  activities: ActivityItem[];
  getTodos: () => ReturnType<typeof getRoleTodos>;
  getRisks: () => ReturnType<typeof getRoleRisks>;
  updateComplaintStatus: (id: string, status: Complaint["status"], operator?: string) => void;
  addVisitLog: (complaintId: string, log: Omit<Complaint["visitLogs"][number], "id" | "complaintId">) => void;
  createComplaint: (data: Omit<Complaint, "id" | "visitLogs" | "createTime" | "status" | "handler"> & { verificationId: string }) => string;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  selectAll: (ids: string[]) => void;
  batchUpdateComplaintStatus: (ids: string[], status: Complaint["status"]) => void;
  updateKitchenNote: (id: string, note: string) => void;
}

function generateId(prefix: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}${date}${rand}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: "floor_manager",
  setCurrentRole: (role) => set({ currentRole: role, selectedIds: new Set() }),
  verifications: mockVerifications,
  complaints: mockComplaints,
  activities: mockActivities,
  getTodos: () => getRoleTodos(get().currentRole),
  getRisks: () => getRoleRisks(get().currentRole),

  createComplaint: (data) => {
    const id = generateId("TS");
    const roleMap = { cashier: "收银", kitchen_lead: "后厨主管", floor_manager: "前厅经理" } as const;
    const nameMap = { cashier: "张婷", kitchen_lead: "赵刚", floor_manager: "陈静" } as const;
    const roleName = roleMap[get().currentRole];
    const handlerName = nameMap[get().currentRole];
    const newComplaint: Complaint = {
      id,
      status: "pending",
      createTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      handler: `${roleName}-${handlerName}`,
      visitLogs: [],
      ...data,
    };
    set((state) => ({
      complaints: [newComplaint, ...state.complaints],
      verifications: state.verifications.map((v) =>
        v.id === data.verificationId ? { ...v, complaintId: id } : v
      ),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: handlerName,
          role: get().currentRole,
          action: "发起了客诉",
          target: id,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
    return id;
  },

  updateComplaintStatus: (id, status, operator) => {
    const nameMap = { cashier: "张婷", kitchen_lead: "赵刚", floor_manager: "陈静" } as const;
    const opName = operator || nameMap[get().currentRole];
    const statusLabel: Record<string, string> = {
      pending: "受理",
      processing: "开始处理",
      to_visit: "标记待回访",
      completed: "完成回访",
      escalated: "升级处理",
    };
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? { ...c, status } : c)),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: opName,
          role: get().currentRole,
          action: `${statusLabel[status] || "更新状态"}了客诉`,
          target: id,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },

  addVisitLog: (complaintId, log) => {
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              visitLogs: [
                ...c.visitLogs,
                { ...log, id: `HF${Date.now()}`, complaintId },
              ],
            }
          : c
      ),
      activities: [
        {
          id: `ACT${Date.now()}`,
          actor: log.visitor,
          role: get().currentRole,
          action: "添加了回访记录",
          target: complaintId,
          time: "刚刚",
        },
        ...state.activities,
      ],
    }));
  },

  batchUpdateComplaintStatus: (ids, status) => {
    set((state) => ({
      complaints: state.complaints.map((c) =>
        ids.includes(c.id) ? { ...c, status } : c
      ),
      selectedIds: new Set(),
    }));
  },

  updateKitchenNote: (id, note) => {
    set((state) => ({
      complaints: state.complaints.map((c) => (c.id === id ? { ...c, kitchenNote: note } : c)),
    }));
  },

  selectedIds: new Set(),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  clearSelected: () => set({ selectedIds: new Set() }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
}));
'''

write_file("src/store/useAppStore.ts", store_ts)

# 3. ComplaintTable.tsx - 客诉列表表格
complaint_table_tsx = '''import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { CheckSquare, Square, Eye, Filter, ChevronDown, Download, Users, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { ComplaintStatus, SeverityLevel } from "@/types";

export default function ComplaintTable() {
  const complaints = useAppStore((s) => s.complaints);
  const { selectedIds, toggleSelected, selectAll, clearSelected, batchUpdateComplaintStatus } = useAppStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = complaints.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    return true;
  });
  const allChecked = filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    processing: complaints.filter((c) => c.status === "processing").length,
    to_visit: complaints.filter((c) => c.status === "to_visit").length,
    completed: complaints.filter((c) => c.status === "completed").length,
    escalated: complaints.filter((c) => c.status === "escalated").length,
  };

  const handleBatchMarkVisit = () => {
    if (selectedIds.size === 0) return;
    batchUpdateComplaintStatus(Array.from(selectedIds), "to_visit");
  };

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
              <Filter className="w-4 h-4" />
              处理状态
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
              <AlertTriangle className="w-4 h-4" />
              严重程度
              <ChevronDown className="w-4 h-4 text-ink-400" />
            </button>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="all">全部</option>
              <option value="normal">一般</option>
              <option value="serious">严重</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-500 ml-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              待处理 <span className="font-mono font-bold text-flame-600">{stats.pending + stats.processing}</span>
            </span>
            <span className="text-ink-300">|</span>
            <span>待回访 <span className="font-mono font-bold text-blue-600">{stats.to_visit}</span></span>
            <span className="text-ink-300">|</span>
            <span>已完成 <span className="font-mono font-bold text-green-600">{stats.completed}</span></span>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">已选 {selectedIds.size} 项</span>
            <button
              onClick={handleBatchMarkVisit}
              className="text-sm px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              批量标记待回访
            </button>
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
                <button onClick={() => (allChecked ? clearSelected() : selectAll(filtered.map((v) => v.id)))}>
                  {allChecked ? (
                    <CheckSquare className="w-4 h-4 text-brand-600 fill-brand-50" />
                  ) : (
                    <Square className="w-4 h-4 text-ink-400" />
                  )}
                </button>
              </th>
              <th className="px-5 py-3 text-left">客诉单号</th>
              <th className="px-5 py-3 text-left">关联核销</th>
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
            {filtered.map((c) => {
              const isUrgent = c.severity === "urgent";
              const isOverdue = c.status === "pending" && c.severity === "urgent";
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-ink-50/70 transition-colors ${
                    selectedIds.has(c.id) ? "bg-brand-50/30" : ""
                  } ${isOverdue ? "bg-red-50/30" : ""}`}
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
                    <span className="font-mono text-sm text-ink-900 font-medium">{c.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                      {c.verificationId}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <div className="text-sm text-ink-900 line-clamp-1">{c.content}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-700">{c.source}</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge type="severity" value={c.severity as SeverityLevel} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-700">{c.handler}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-ink-500">{c.createTime.slice(5, 16)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge type="complaint" value={c.status as ComplaintStatus} />
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'''

write_file("src/components/complaint/ComplaintTable.tsx", complaint_table_tsx)

print("\\n✅ 第一批文件更新完成")
