import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { useReturnStore } from "@/stores/returnStore";
import { useReferralStore } from "@/stores/referralStore";
import { useAuthStore } from "@/stores/authStore";
import StatusBadge from "@/components/StatusBadge";
import { URGENCY_LABELS } from "@/types";
import { cn } from "@/lib/utils";

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { current: ret, fetchReturn, confirmReturn } = useReturnStore();
  const { current: referral, fetchReferral, snapshots, fetchSnapshots } =
    useReferralStore();

  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    fetchReturn(numId);
  }, [id, fetchReturn]);

  useEffect(() => {
    if (ret) {
      fetchReferral(ret.referralId);
      fetchSnapshots(ret.referralId);
    }
  }, [ret, fetchReferral, fetchSnapshots]);

  useEffect(() => {
    if (ret?.changeAcknowledged) {
      setAcknowledged(true);
    }
  }, [ret?.changeAcknowledged]);

  const handleConfirm = async () => {
    if (!ret) return;
    setConfirming(true);
    setConfirmError("");
    try {
      await confirmReturn(ret.id, {
        changeAcknowledged: ret.referralModifiedAfterSent ? true : undefined,
      });
      await fetchReturn(ret.id);
      if (referral) {
        await fetchReferral(referral.id);
      }
    } catch (err: any) {
      setConfirmError(err?.message || "确认失败，请重试");
    } finally {
      setConfirming(false);
    }
  };

  if (!ret) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        加载中...
      </div>
    );
  }

  const canConfirm = !ret.confirmedAt && (user?.role === "nurse" || user?.role === "pho")
    && referral !== null
    && (referral?.status === "result_returned" || referral?.status === "change_alerted");
  const needsAck = ret.referralModifiedAfterSent && !ret.changeAcknowledged;
  const confirmDisabled = needsAck && !acknowledged;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <h1 className="text-lg font-bold text-zinc-800">结果回传详情</h1>

      {referral && (
        <div className="bg-white rounded-lg border border-zinc-200 p-5 space-y-3">
          <h3 className="text-xs font-medium text-zinc-500">转诊摘要</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-800">
              {referral.patientName}
            </span>
            <StatusBadge status={referral.status} />
            <span className="text-xs text-zinc-400">
              {URGENCY_LABELS[referral.urgency]}
            </span>
          </div>
          <p className="text-sm text-zinc-600">{referral.reason}</p>
          <p className="text-xs text-zinc-500">
            拟转: {referral.targetDept} · 预期 {referral.expectedReturnDays} 天
          </p>
        </div>
      )}

      {ret.referralModifiedAfterSent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-800">
              申请已变更
            </span>
          </div>
          {snapshots.length > 0 && (
            <div className="space-y-2">
              {snapshots.map((s) => (
                <div
                  key={s.id}
                  className="text-xs bg-white rounded p-2 border border-amber-100"
                >
                  <span className="font-medium text-zinc-700">{s.field}</span>
                  :{" "}
                  <span className="line-through text-zinc-400">
                    {s.oldValue}
                  </span>{" "}
                  →{" "}
                  <span className="font-medium text-amber-700">
                    {s.newValue}
                  </span>
                  {s.note && (
                    <p className="text-zinc-500 mt-1">变更说明: {s.note}</p>
                  )}
                  <p className="text-zinc-400 mt-0.5">
                    修改人: {s.operatorName} · {new Date(s.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              ))}
            </div>
          )}
          {needsAck && (
            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 accent-teal-600"
              />
              <span className="text-xs text-amber-700">
                我已阅读变更内容，了解申请修改情况
              </span>
            </label>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-zinc-200 p-5 space-y-3">
        <h3 className="text-xs font-medium text-zinc-500">回传结果</h3>
        <p className="text-sm text-zinc-800 leading-relaxed">
          {ret.resultContent}
        </p>
        <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          <span>回传科室: {ret.resultDept}</span>
          <span>回传医生: {ret.resultDoctor}</span>
          <span>
            回传时间: {new Date(ret.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>
      </div>

      {ret.confirmedAt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-emerald-800">
            已由 {ret.confirmedByName} 于{" "}
            {new Date(ret.confirmedAt).toLocaleString("zh-CN")} 确认签收
          </span>
        </div>
      )}

      {canConfirm && (
        <div className="space-y-3">
          {confirmError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{confirmError}</p>
            </div>
          )}
          <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={confirming || confirmDisabled}
            className={cn(
              "flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-md",
              confirmDisabled
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-teal-600 text-white hover:bg-teal-700"
            )}
          >
            <CheckCircle className="w-4 h-4" />
            {confirming ? "确认中..." : "确认签收"}
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
