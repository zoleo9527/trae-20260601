import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, Send, CheckCircle, XCircle, Archive, ArrowLeft } from "lucide-react";
import { useReferralStore } from "@/stores/referralStore";
import { useAuthStore } from "@/stores/authStore";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { URGENCY_LABELS, ROLE_LABELS } from "@/types";
import type { ReferralStatus, ReferralStatusChange, ReferralChangeSnapshot, ResultReturn } from "@/types";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";

const genderLabel = { male: "男", female: "女" };

function canAct(
  role: string,
  status: ReferralStatus,
  createdBy: number,
  userId: number
): { action: string; targetStatus: ReferralStatus; icon: typeof Edit3 }[] {
  if (role === "gp" && createdBy === userId) {
    if (status === "draft" || status === "rejected")
      return [{ action: "提交审核", targetStatus: "pending_review", icon: Send }];
  }
  if (role === "nurse") {
    if (status === "pending_review")
      return [
        { action: "审核通过", targetStatus: "approved", icon: CheckCircle },
        { action: "驳回", targetStatus: "rejected", icon: XCircle },
      ];
    if (status === "approved")
      return [{ action: "发送至上级医院", targetStatus: "sent", icon: Send }];
  }
  if (role === "pho") {
    if (status === "confirmed")
      return [{ action: "标记闭环", targetStatus: "closed", icon: Archive }];
  }
  return [];
}

function canEdit(
  role: string,
  status: ReferralStatus,
  createdBy: number,
  userId: number
): boolean {
  if (role !== "gp" || createdBy !== userId) return false;
  return ["draft", "rejected", "pending_review", "sent", "change_alerted"].includes(status);
}

export default function ReferralDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    current,
    statusChanges,
    snapshots,
    loading,
    fetchReferral,
    changeStatus,
    fetchStatusChanges,
    fetchSnapshots,
  } = useReferralStore();

  const [returns, setReturns] = useState<ResultReturn[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState<ReferralStatus>("draft");
  const [dialogNote, setDialogNote] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    fetchReferral(numId);
    fetchStatusChanges(numId);
    fetchSnapshots(numId);
    api.get<{ data: ResultReturn[] }>(`/returns?referralId=${numId}`).then(
      (res) => setReturns(res.data)
    ).catch(() => {});
  }, [id, fetchReferral, fetchStatusChanges, fetchSnapshots]);

  const openDialog = (target: ReferralStatus) => {
    setDialogTarget(target);
    setDialogNote("");
    setActionError("");
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!current) return;
    setActing(true);
    setActionError("");
    try {
      await changeStatus(current.id, dialogTarget, dialogNote || undefined);
      setDialogOpen(false);
      await fetchReferral(current.id);
      await fetchStatusChanges(current.id);
    } catch (err: any) {
      setActionError(err?.message || "操作失败，请重试");
    } finally {
      setActing(false);
    }
  };

  if (loading || !current) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        加载中...
      </div>
    );
  }

  const actions = user && current ? canAct(user.role, current.status, current.createdBy, user.id) : [];
  const showEdit = user && current ? canEdit(user.role, current.status, current.createdBy, user.id) : false;

  const timelineItems = [
    ...statusChanges.map(
      (sc: ReferralStatusChange) =>
        ({ type: "status_change" as const, data: sc })
    ),
    ...snapshots.map(
      (sn: ReferralChangeSnapshot) =>
        ({ type: "field_change" as const, data: sn })
    ),
    ...returns.map(
      (r: ResultReturn) =>
        ({ type: "result_return" as const, data: r })
    ),
  ].sort(
    (a, b) =>
      new Date(a.data.createdAt).getTime() -
      new Date(b.data.createdAt).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-zinc-800">
          {current.patientName}
        </h1>
        <StatusBadge status={current.status} />
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded",
            current.urgency === "emergency"
              ? "bg-red-50 text-red-600"
              : current.urgency === "urgent"
              ? "bg-amber-50 text-amber-600"
              : "bg-zinc-50 text-zinc-500"
          )}
        >
          {URGENCY_LABELS[current.urgency]}
        </span>
        <span className="text-xs text-zinc-400 ml-auto">
          版本 v{current.version}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-2">
          <h3 className="text-xs font-medium text-zinc-500">患者信息</h3>
          <p className="text-sm text-zinc-800">
            {current.patientName}，{current.patientAge}岁，
            {genderLabel[current.patientGender]}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-2">
          <h3 className="text-xs font-medium text-zinc-500">转诊信息</h3>
          <p className="text-sm text-zinc-800">{current.reason}</p>
          <p className="text-xs text-zinc-500">
            拟转: {current.targetDept} · 预期 {current.expectedReturnDays} 天回传
          </p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-2">
          <h3 className="text-xs font-medium text-zinc-500">时间信息</h3>
          <p className="text-xs text-zinc-600">
            创建: {new Date(current.createdAt).toLocaleString("zh-CN")}
          </p>
          <p className="text-xs text-zinc-600">
            更新: {new Date(current.updatedAt).toLocaleString("zh-CN")}
          </p>
        </div>
      </div>

      {(actions.length > 0 || showEdit) && (
        <div className="flex items-center gap-3">
          {showEdit && (
            <button
              onClick={() => navigate(`/referral/${current.id}/edit`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-zinc-300 rounded-md hover:bg-zinc-50 text-zinc-700"
            >
              <Edit3 className="w-4 h-4" /> 编辑修改
            </button>
          )}
          {actions.map((a) => (
            <button
              key={a.targetStatus}
              onClick={() => openDialog(a.targetStatus)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md",
                a.targetStatus === "rejected"
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              )}
            >
              <a.icon className="w-4 h-4" /> {a.action}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg border border-zinc-200 p-5">
        <h2 className="text-sm font-medium text-zinc-700 mb-4">时间线</h2>
        <Timeline items={timelineItems} />
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-800">确认操作</h3>
            {actionError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">备注</label>
              <textarea
                value={dialogNote}
                onChange={(e) => setDialogNote(e.target.value)}
                rows={3}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="填写备注说明（可选）"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                onClick={handleAction}
                disabled={acting}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {acting ? "处理中..." : "确认"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
