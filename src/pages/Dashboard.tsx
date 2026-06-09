import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useReferralStore } from "@/stores/referralStore";
import StatusBadge from "@/components/StatusBadge";
import { URGENCY_LABELS } from "@/types";
import type { ReferralStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  count: number;
  status: ReferralStatus;
  color: string;
}

function daysSince(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  return Math.floor((now - then) / 86400000);
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { referrals, fetchReferrals } = useReferralStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const stats: StatCard[] = useMemo(() => {
    const count = (s: ReferralStatus) =>
      referrals.filter((r) => r.status === s).length;
    return [
      { label: "待审核", count: count("pending_review"), status: "pending_review", color: "bg-blue-50 text-blue-700" },
      { label: "已发送", count: count("sent"), status: "sent", color: "bg-indigo-50 text-indigo-700" },
      { label: "待确认", count: count("result_returned") + count("change_alerted"), status: "result_returned", color: "bg-emerald-50 text-emerald-700" },
      { label: "已闭环", count: count("closed"), status: "closed", color: "bg-zinc-100 text-zinc-600" },
    ];
  }, [referrals]);

  const overdue = useMemo(
    () =>
      referrals.filter(
        (r) =>
          !["closed", "confirmed"].includes(r.status) &&
          daysSince(r.createdAt) > r.expectedReturnDays
      ),
    [referrals]
  );

  const pending = useMemo(() => {
    if (!user) return [];
    const role = user.role;
    return referrals
      .filter((r) => {
        if (role === "gp")
          return (
            (r.status === "draft" && r.createdBy === user.id) ||
            (r.status === "rejected" && r.createdBy === user.id)
          );
        if (role === "nurse")
          return r.status === "pending_review" || r.status === "approved";
        if (role === "pho")
          return (
            r.status === "result_returned" ||
            r.status === "change_alerted" ||
            r.status === "confirmed"
          );
        return false;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [referrals, user]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-800">工作台</h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.status}
            className="bg-white rounded-lg border border-zinc-200 p-4"
          >
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color.split(" ")[1])}>
              {s.count}
            </p>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              逾期提醒：{overdue.length} 条转诊已超过预期回传时限
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {overdue.map((r) => r.patientName).join("、")}
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-zinc-700 mb-3">待办事项</h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center text-sm text-zinc-400">
            暂无待办
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-lg border border-zinc-200 p-4 flex items-center gap-4 hover:border-zinc-300 transition-colors"
              >
                <div
                  className={cn(
                    "w-1 h-10 rounded-full shrink-0",
                    r.urgency === "emergency"
                      ? "bg-red-500"
                      : r.urgency === "urgent"
                      ? "bg-amber-500"
                      : "bg-teal-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-800">
                      {r.patientName}
                    </span>
                    <StatusBadge status={r.status} />
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        r.urgency === "emergency"
                          ? "bg-red-50 text-red-600"
                          : r.urgency === "urgent"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-zinc-50 text-zinc-500"
                      )}
                    >
                      {URGENCY_LABELS[r.urgency]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {daysSince(r.createdAt)}天前创建
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/referral/${r.id}`)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  处理
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
