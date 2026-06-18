#!/usr/bin/env python3
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
pages_dir = os.path.join(base_dir, 'src', 'pages')
components_dir = os.path.join(base_dir, 'src', 'components')

os.makedirs(pages_dir, exist_ok=True)

files = {}

# 1. Dashboard.tsx
files['Dashboard.tsx'] = '''import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import RiskPanel from "@/components/dashboard/RiskPanel";
import TodoList from "@/components/dashboard/TodoList";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import { Clock, AlertTriangle, Receipt, MessageSquare, CheckCircle } from "lucide-react";
import type { UserRole } from "@/types";

export default function Dashboard() {
  const { currentRole, verifications, complaints, getTodos, getRisks } = useAppStore();
  const navigate = useNavigate();
  const todos = getTodos();
  const risks = getRisks();

  const todayStr = "2026-06-18";
  const todayVerifications = verifications.filter((v) => v.verifyTime.startsWith(todayStr));
  const todayAmount = todayVerifications.reduce((sum, v) => sum + v.amount, 0);

  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
  const processingComplaints = complaints.filter((c) => c.status === "processing").length;
  const toVisitComplaints = complaints.filter((c) => c.status === "to_visit").length;
  const escalatedComplaints = complaints.filter((c) => c.status === "escalated").length;

  const roleStats: Record<UserRole, Array<{ title: string; value: number | string; icon: React.ReactNode; accent: string; trend?: { value: string; up: boolean } }>> = {
    cashier: [
      { title: "今日核销", value: todayVerifications.length, icon: <Receipt className="w-5 h-5" />, accent: "border-l-brand-500", trend: { value: "较昨日 +3", up: true } },
      { title: "今日核销金额", value: `¥${todayAmount}`, icon: <CheckCircle className="w-5 h-5" />, accent: "border-l-green-500", trend: { value: "较昨日 +12%", up: true } },
      { title: "异常核销", value: verifications.filter((v) => v.status === "abnormal").length, icon: <AlertTriangle className="w-5 h-5" />, accent: "border-l-flame-500" },
      { title: "待处理事项", value: todos.length, icon: <Clock className="w-5 h-5" />, accent: "border-l-blue-500" },
    ],
    kitchen_lead: [
      { title: "待处理客诉", value: pendingComplaints + processingComplaints, icon: <MessageSquare className="w-5 h-5" />, accent: "border-l-flame-500" },
      { title: "高风险项", value: risks.filter((r) => r.level === "danger").length, icon: <AlertTriangle className="w-5 h-5" />, accent: "border-l-red-500" },
      { title: "今日已处理", value: complaints.filter((c) => c.status === "completed").length, icon: <CheckCircle className="w-5 h-5" />, accent: "border-l-green-500", trend: { value: "较昨日 +1", up: true } },
      { title: "待回访支持", value: toVisitComplaints, icon: <Clock className="w-5 h-5" />, accent: "border-l-blue-500" },
    ],
    floor_manager: [
      { title: "待处理客诉", value: pendingComplaints, icon: <MessageSquare className="w-5 h-5" />, accent: "border-l-flame-500" },
      { title: "待回访", value: toVisitComplaints, icon: <Clock className="w-5 h-5" />, accent: "border-l-blue-500" },
      { title: "已升级", value: escalatedComplaints, icon: <AlertTriangle className="w-5 h-5" />, accent: "border-l-red-500" },
      { title: "今日已完成", value: complaints.filter((c) => c.status === "completed").length, icon: <CheckCircle className="w-5 h-5" />, accent: "border-l-green-500", trend: { value: "较昨日 +2", up: true } },
    ],
  };

  const stats = roleStats[currentRole];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">工作台</h1>
        <p className="text-sm text-ink-500 mt-1">欢迎回来，以下是今日待处理事项概览</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            accent={stat.accent}
            trend={stat.trend}
            onClick={() => {
              if (stat.title.includes("核销")) navigate("/verification");
              else if (stat.title.includes("客诉") || stat.title.includes("回访")) navigate("/complaints");
            }}
          />
        ))}
      </div>

      <RiskPanel />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <TodoList />
        </div>
        <div>
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}
'''

# 2. VerificationList.tsx
files['VerificationList.tsx'] = '''import VerificationTable from "@/components/verification/VerificationTable";

export default function VerificationList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">团购核销</h1>
        <p className="text-sm text-ink-500 mt-1">管理所有团购核销记录，支持批量操作与异常处理</p>
      </div>
      <VerificationTable />
    </div>
  );
}
'''

# 3. VerificationDetailPage.tsx
files['VerificationDetailPage.tsx'] = '''import VerificationDetail from "@/components/verification/VerificationDetail";

export default function VerificationDetailPage() {
  return <VerificationDetail />;
}
'''

# 4. ComplaintList.tsx
files['ComplaintList.tsx'] = '''import ComplaintTable from "@/components/complaint/ComplaintTable";

export default function ComplaintList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">客诉回访</h1>
        <p className="text-sm text-ink-500 mt-1">客诉受理、处理跟进与回访记录全流程管理</p>
      </div>
      <ComplaintTable />
    </div>
  );
}
'''

# 5. ComplaintDetailPage.tsx
files['ComplaintDetailPage.tsx'] = '''import ComplaintDetail from "@/components/complaint/ComplaintDetail";

export default function ComplaintDetailPage() {
  return <ComplaintDetail />;
}
'''

# 6. ComplaintDetail.tsx component
complaint_dir = os.path.join(components_dir, 'complaint')
os.makedirs(complaint_dir, exist_ok=True)

complaint_detail_content = '''import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { ArrowLeft, User, Clock, AlertTriangle, MessageSquare, Phone, MapPin, FileText, ChefHat, Users, CheckCircle, Star, Plus } from "lucide-react";
import type { TimelineStep, Complaint } from "@/types";
import { useState } from "react";

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, verifications, updateComplaintStatus, addVisitLog, currentRole } = useAppStore();
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ method: "phone" as const, result: "", feedback: "", satisfaction: 3 });

  const complaint = complaints.find((c) => c.id === id);
  const verification = complaint ? verifications.find((v) => v.id === complaint.verificationId) : undefined;

  if (!complaint) {
    return <div className="p-10 text-center text-ink-500">未找到该客诉记录</div>;
  }

  const timeline = buildTimeline(complaint);

  const handleStatusChange = (nextStatus: Complaint["status"]) => {
    updateComplaintStatus(complaint.id, nextStatus);
  };

  const handleSubmitVisit = () => {
    if (!visitForm.result.trim()) return;
    addVisitLog(complaint.id, {
      visitor: currentRole === "floor_manager" ? "陈静" : currentRole === "kitchen_lead" ? "赵刚" : "张婷",
      visitTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      method: visitForm.method,
      result: visitForm.result,
      feedback: visitForm.feedback,
      satisfaction: visitForm.satisfaction,
    });
    if (complaint.status === "to_visit") {
      updateComplaintStatus(complaint.id, "completed");
    }
    setShowVisitModal(false);
    setVisitForm({ method: "phone", result: "", feedback: "", satisfaction: 3 });
  };

  const nextStatusOptions = getNextStatusOptions(complaint.status, currentRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/complaints")} className="p-2 rounded-lg hover:bg-ink-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-ink-600" />
        </button>
        <div>
          <div className="text-sm text-ink-500">客诉单号</div>
          <div className="text-xl font-bold text-ink-900 font-mono">{complaint.id}</div>
        </div>
        <div className="ml-2 flex items-center gap-2">
          <StatusBadge type="complaint" value={complaint.status} />
          <StatusBadge type="severity" value={complaint.severity} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-flame-600" />
              客诉信息
            </div>
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow icon={<MessageSquare className="w-4 h-4" />} label="投诉来源" value={complaint.source} />
              <DetailRow icon={<Users className="w-4 h-4" />} label="责任方" value={responsibilityLabel(complaint.responsibleParty)} />
              <DetailRow icon={<User className="w-4 h-4" />} label="处理人" value={complaint.handler} />
              <DetailRow icon={<Clock className="w-4 h-4" />} label="创建时间" value={<span className="font-mono">{complaint.createTime}</span>} />
              {complaint.deadline && (
                <DetailRow icon={<AlertTriangle className="w-4 h-4 text-flame-500" />} label="处理时限" value={<span className="text-flame-600 font-medium font-mono">{complaint.deadline}</span>} />
              )}
            </div>
            <div className="mt-5 pt-5 border-t border-ink-100">
              <div className="text-xs text-ink-400 mb-2">投诉内容</div>
              <p className="text-sm text-ink-700 leading-relaxed">{complaint.content}</p>
            </div>
          </div>

          {verification && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  关联核销单
                </div>
                <Link to={`/verification/${verification.id}`} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  查看详情
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                </Link>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-ink-50 border border-ink-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink-900">{verification.id}</span>
                    <StatusBadge type="verification" value={verification.status} />
                  </div>
                  <div className="text-sm text-ink-600 mt-1">{verification.couponName}</div>
                  <div className="text-xs text-ink-400 mt-1">
                    {verification.platform} · {verification.tableNo}桌 · {verification.peopleCount}人 · ¥{verification.amount}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              处理进度
            </div>
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-ink-200"></div>
              <div className="space-y-6">
                {timeline.map((step) => (
                  <div key={step.key} className="relative pl-11">
                    <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-card ${
                      step.status === "done" ? "bg-green-500 text-white" :
                      step.status === "current" ? "bg-brand-500 text-white animate-pulse" :
                      "bg-ink-200 text-ink-400"
                    }`}>
                      {step.status === "done" ? <CheckCircle className="w-4 h-4" /> :
                       step.status === "current" ? <Clock className="w-4 h-4" /> :
                       <div className="w-2 h-2 rounded-full bg-ink-400"></div>}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-medium ${step.status === "pending" ? "text-ink-400" : "text-ink-900"}`}>
                          {step.title}
                        </span>
                        {step.time && <span className="text-xs font-mono text-ink-400">{step.time}</span>}
                      </div>
                      {step.operator && (
                        <div className="text-xs text-ink-500 mt-0.5">处理人：{step.operator}</div>
                      )}
                      {step.description && (
                        <p className="text-sm text-ink-600 mt-1">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {complaint.visitLogs.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                回访记录回看
                <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">{complaint.visitLogs.length} 次</span>
              </div>
              <div className="space-y-4">
                {complaint.visitLogs.map((log, idx) => (
                  <div key={log.id} className="p-4 rounded-xl border border-ink-200 bg-ink-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-ink-900">第 {idx + 1} 次回访</div>
                          <div className="text-xs text-ink-400 font-mono">{log.visitTime}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`w-4 h-4 ${n <= log.satisfaction ? "text-yellow-400 fill-yellow-400" : "text-ink-300"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-ink-400">回访方式：</span>
                        <span className="text-ink-700">{visitMethodLabel(log.method)}</span>
                      </div>
                      <div>
                        <span className="text-ink-400">回访人：</span>
                        <span className="text-ink-700">{log.visitor}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-ink-200">
                      <div className="text-xs text-ink-400 mb-1">处理结果</div>
                      <p className="text-sm text-ink-700">{log.result}</p>
                    </div>
                    {log.feedback && (
                      <div className="mt-3">
                        <div className="text-xs text-ink-400 mb-1">客户反馈</div>
                        <p className="text-sm text-ink-600">{log.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {complaint.kitchenNote && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-3 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-flame-600" />
                后厨处理说明
              </div>
              <p className="text-sm text-ink-600 leading-relaxed">{complaint.kitchenNote}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-4">状态操作</div>
            <div className="space-y-2">
              {nextStatusOptions.map((opt) => (
                <button
                  key={opt.status}
                  onClick={() => handleStatusChange(opt.status)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${opt.primary ? "bg-flame-600 text-white hover:bg-flame-700" : "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50"}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
              {(complaint.status === "to_visit" || complaint.status === "processing") && currentRole === "floor_manager" && (
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  记录回访
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-flame-500 to-red-600 rounded-xl shadow-card p-6 text-white">
            <div className="text-sm text-white/80">当前状态</div>
            <div className="text-xl font-bold mt-2">{statusLabel(complaint.status)}</div>
            {complaint.deadline && (
              <div className="text-xs text-white/60 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                截止 {complaint.deadline.slice(5, 16)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-3">快捷操作</div>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors">
                <FileText className="w-4 h-4" />
                导出客诉单
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors">
                <MessageSquare className="w-4 h-4" />
                添加备注
              </button>
            </div>
          </div>
        </div>
      </div>

      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-pop w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <h3 className="text-lg font-medium text-ink-900">记录回访</h3>
              <button onClick={() => setShowVisitModal(false)} className="text-ink-400 hover:text-ink-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-ink-700 font-medium">回访方式</label>
                <div className="flex gap-2 mt-2">
                  {(["phone", "onsite", "wechat"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setVisitForm({ ...visitForm, method: m })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${visitForm.method === m ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}
                    >
                      {visitMethodLabel(m)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-ink-700 font-medium">处理结果</label>
                <textarea
                  value={visitForm.result}
                  onChange={(e) => setVisitForm({ ...visitForm, result: e.target.value })}
                  rows={3}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-brand-400 resize-none"
                  placeholder="请输入本次回访的处理结果..."
                />
              </div>
              <div>
                <label className="text-sm text-ink-700 font-medium">客户反馈</label>
                <textarea
                  value={visitForm.feedback}
                  onChange={(e) => setVisitForm({ ...visitForm, feedback: e.target.value })}
                  rows={2}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-brand-400 resize-none"
                  placeholder="客户的反馈和情绪状态..."
                />
              </div>
              <div>
                <label className="text-sm text-ink-700 font-medium">满意度评分</label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setVisitForm({ ...visitForm, satisfaction: n })}
                      className="p-1"
                    >
                      <Star className={`w-8 h-8 transition-colors ${n <= visitForm.satisfaction ? "text-yellow-400 fill-yellow-400" : "text-ink-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-3">
              <button
                onClick={() => setShowVisitModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitVisit}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-flame-600 text-white hover:bg-flame-700 transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center text-ink-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs text-ink-400">{label}</div>
        <div className="text-sm text-ink-800 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function buildTimeline(complaint: Complaint): TimelineStep[] {
  const steps: TimelineStep[] = [
    { key: "verify", title: "团购核销", time: complaint.createTime, status: "done" },
    { key: "create", title: "客诉受理", time: complaint.createTime, operator: complaint.handler, description: complaint.content, status: "done" },
  ];

  if (complaint.kitchenNote || complaint.status !== "pending") {
    steps.push({
      key: "kitchen",
      title: "后厨处理",
      description: complaint.kitchenNote,
      operator: "后厨主管",
      status: complaint.status === "processing" || complaint.status === "to_visit" || complaint.status === "completed" || complaint.status === "escalated" ? "done" : "current",
    });
  }

  if (complaint.status === "to_visit" || complaint.status === "completed" || complaint.status === "escalated") {
    steps.push({
      key: "visit",
      title: "客户回访",
      description: complaint.visitLogs.length > 0 ? `已回访 ${complaint.visitLogs.length} 次` : "待执行回访",
      operator: complaint.visitLogs.length > 0 ? complaint.visitLogs[complaint.visitLogs.length - 1].visitor : "前厅经理",
      status: complaint.status === "to_visit" ? "current" : complaint.status === "completed" ? "done" : "done",
    });
  }

  if (complaint.status === "completed") {
    steps.push({ key: "done", title: "处理完成", status: "done" });
  } else if (complaint.status === "escalated") {
    steps.push({ key: "escalate", title: "已升级处理", status: "current" });
  } else {
    steps.push({ key: "pending", title: "待完成", status: "pending" });
  }

  return steps;
}

function getNextStatusOptions(current: string, role: string) {
  const options: Array<{ status: Complaint["status"]; label: string; icon: React.ReactNode; primary: boolean }> = [];

  if (role === "floor_manager") {
    if (current === "pending") {
      options.push({ status: "processing", label: "受理并开始处理", icon: <CheckCircle className="w-4 h-4" />, primary: true });
    }
    if (current === "processing") {
      options.push({ status: "to_visit", label: "转入回访阶段", icon: <Phone className="w-4 h-4" />, primary: true });
    }
    if (current === "to_visit") {
      options.push({ status: "completed", label: "完成回访并归档", icon: <CheckCircle className="w-4 h-4" />, primary: true });
    }
    if (current !== "escalated" && current !== "completed") {
      options.push({ status: "escalated", label: "升级处理", icon: <AlertTriangle className="w-4 h-4" />, primary: false });
    }
  }

  if (role === "kitchen_lead") {
    if (current === "pending" || current === "processing") {
      options.push({ status: "processing", label: "录入处理结果", icon: <ChefHat className="w-4 h-4" />, primary: true });
    }
  }

  return options;
}

function responsibilityLabel(party: string) {
  const map: Record<string, string> = { front: "前厅", kitchen: "后厨", both: "双方" };
  return map[party] || party;
}

function visitMethodLabel(method: string) {
  const map: Record<string, string> = { phone: "电话", onsite: "现场", wechat: "微信" };
  return map[method] || method;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "待受理", processing: "处理中", to_visit: "待回访", completed: "已完成", escalated: "已升级",
  };
  return map[status] || status;
}
'''

# 7. ComplaintTable.tsx
complaint_table_content = '''import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { CheckSquare, Square, Eye, Filter, ChevronDown, Download, AlertTriangle, Clock } from "lucide-react";
import { useState } from "react";
import type { ComplaintStatus } from "@/types";

const statusFilters: Array<{ value: "all" | ComplaintStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待受理" },
  { value: "processing", label: "处理中" },
  { value: "to_visit", label: "待回访" },
  { value: "completed", label: "已完成" },
  { value: "escalated", label: "已升级" },
];

export default function ComplaintTable() {
  const { complaints, selectedIds, toggleSelected, selectAll, clearSelected, currentRole } = useAppStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = complaints.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    return true;
  });

  const allChecked = filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
              <Filter className="w-4 h-4" />
              客诉状态
              <ChevronDown className="w-4 h-4 text-ink-400" />
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | "all")}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {statusFilters.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
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
              <option value="all">全部程度</option>
              <option value="normal">一般</option>
              <option value="serious">严重</option>
              <option value="urgent">紧急</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-sm text-ink-500">
            <span>共 <span className="font-mono font-bold text-ink-900">{filtered.length}</span> 条</span>
            <span className="text-ink-300">|</span>
            <span>待处理 <span className="font-mono font-bold text-flame-600">{complaints.filter(c => c.status === "pending" || c.status === "processing").length}</span></span>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-500">已选 {selectedIds.size} 项</span>
            {currentRole === "floor_manager" && (
              <>
                <button className="text-sm px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors flex items-center gap-1">
                  批量分配
                </button>
                <button className="text-sm px-3 py-1.5 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors flex items-center gap-1">
                  批量标记回访
                </button>
              </>
            )}
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
              <th className="px-5 py-3 text-left">客诉单号</th>
              <th className="px-5 py-3 text-left">投诉内容</th>
              <th className="px-5 py-3 text-left">来源</th>
              <th className="px-5 py-3 text-left">严重程度</th>
              <th className="px-5 py-3 text-left">责任方</th>
              <th className="px-5 py-3 text-left">处理人</th>
              <th className="px-5 py-3 text-left">状态</th>
              <th className="px-5 py-3 text-left">创建时间</th>
              <th className="px-5 py-3 text-center w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((c) => {
              const isUrgent = c.severity === "urgent";
              const isOverdue = c.deadline && new Date(c.deadline) < new Date("2026-06-18T13:00:00");
              return (
                <tr
                  key={c.id}
                  className={`hover:bg-ink-50/70 transition-colors ${
                    selectedIds.has(c.id) ? "bg-brand-50/30" : ""
                  } ${isUrgent ? "bg-red-50/30" : ""}`}
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
                    <div className="text-sm text-ink-900 max-w-xs truncate">{c.content}</div>
                    {isOverdue && c.status !== "completed" && (
                      <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        已超时
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-600">{c.source}</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge type="severity" value={c.severity} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-ink-600">
                      {c.responsibleParty === "front" ? "前厅" : c.responsibleParty === "kitchen" ? "后厨" : "双方"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-700">{c.handler}</td>
                  <td className="px-5 py-4">
                    <StatusBadge type="complaint" value={c.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-ink-500">{c.createTime.slice(5, 16)}</span>
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

# Write all files
for filename, content in files.items():
    filepath = os.path.join(pages_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created: src/pages/{filename}")

# Write complaint components
with open(os.path.join(complaint_dir, 'ComplaintDetail.tsx'), 'w', encoding='utf-8') as f:
    f.write(complaint_detail_content)
print("Created: src/components/complaint/ComplaintDetail.tsx")

with open(os.path.join(complaint_dir, 'ComplaintTable.tsx'), 'w', encoding='utf-8') as f:
    f.write(complaint_table_content)
print("Created: src/components/complaint/ComplaintTable.tsx")

print("\nAll files generated successfully!")
