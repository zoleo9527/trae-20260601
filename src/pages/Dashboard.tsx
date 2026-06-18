import { useAppStore } from "@/store/useAppStore";
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
