import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Clock, AlertTriangle, Plus } from "lucide-react";
import { useReturnStore } from "@/stores/returnStore";
import { useReferralStore } from "@/stores/referralStore";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/api/client";
import { cn } from "@/lib/utils";
import type { Referral, ResultReturn } from "@/types";

export default function Returns() {
  const { returns, fetchReturns } = useReturnStore();
  const { referrals, fetchReferrals } = useReferralStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [showMockDialog, setShowMockDialog] = useState(false);
  const [mockReferralId, setMockReferralId] = useState<number | null>(null);
  const [mockContent, setMockContent] = useState("");
  const [mockDept, setMockDept] = useState("");
  const [mockDoctor, setMockDoctor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
    fetchReferrals();
  }, [fetchReturns, fetchReferrals]);

  const sentReferrals = referrals.filter((r) =>
    ["sent", "result_returned", "change_alerted"].includes(r.status)
  );

  const referralMap = new Map(referrals.map((r) => [r.id, r]));

  const handleMockSubmit = async () => {
    if (!mockReferralId || !mockContent || !mockDept || !mockDoctor) return;
    setSubmitting(true);
    try {
      await api.post<ResultReturn>("/returns", {
        referralId: mockReferralId,
        resultContent: mockContent,
        resultDept: mockDept,
        resultDoctor: mockDoctor,
      });
      setShowMockDialog(false);
      setMockContent("");
      setMockDept("");
      setMockDoctor("");
      setMockReferralId(null);
      fetchReturns();
      fetchReferrals();
    } catch {
      alert("模拟回传失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-800">结果回传</h1>
        <button
          onClick={() => setShowMockDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100"
        >
          <Plus className="w-3.5 h-3.5" /> 模拟回传
        </button>
      </div>

      {returns.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center text-sm text-zinc-400">
          暂无回传记录
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => {
            const ref = referralMap.get(r.referralId);
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/returns/${r.id}`)}
                className="w-full text-left bg-white rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ref && (
                        <span className="text-sm font-medium text-zinc-800">
                          {ref.patientName}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        转诊 #{r.referralId}
                      </span>
                      {r.referralModifiedAfterSent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          申请已变更
                        </span>
                      )}
                      {r.confirmedAt && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          已确认
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {r.resultDept}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {r.resultDoctor}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                  {r.referralModifiedAfterSent && !r.changeAcknowledged && (
                    <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showMockDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-800">模拟上级医院回传结果</h3>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">选择已发送转诊</label>
              <select
                value={mockReferralId || ""}
                onChange={(e) => setMockReferralId(Number(e.target.value) || null)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">请选择</option>
                {sentReferrals.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} {r.patientName} - {r.targetDept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">回传内容</label>
              <textarea
                value={mockContent}
                onChange={(e) => setMockContent(e.target.value)}
                rows={3}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="填写回传的诊断结果或处理意见"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">回传科室</label>
                <input
                  type="text"
                  value={mockDept}
                  onChange={(e) => setMockDept(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="如: 心血管科"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">回传医生</label>
                <input
                  type="text"
                  value={mockDoctor}
                  onChange={(e) => setMockDoctor(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="如: 张主任"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMockDialog(false)}
                className="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                onClick={handleMockSubmit}
                disabled={submitting || !mockReferralId || !mockContent || !mockDept || !mockDoctor}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? "提交中..." : "模拟回传"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
