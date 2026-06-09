import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useReferralStore } from "@/stores/referralStore";
import { useAuthStore } from "@/stores/authStore";
import { URGENCY_LABELS } from "@/types";
import type { Urgency, ReferralStatus } from "@/types";

const departments = [
  "内科", "外科", "妇产科", "儿科", "骨科", "心血管科", "呼吸科",
  "消化科", "神经内科", "内分泌科", "皮肤科", "眼科", "耳鼻喉科", "口腔科", "精神科",
];

export default function ReferralEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, fetchReferral, updateReferral } = useReferralStore();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [changeNote, setChangeNote] = useState("");

  const [form, setForm] = useState({
    reason: "",
    targetDept: "",
    urgency: "routine" as Urgency,
    expectedReturnDays: 7,
  });

  useEffect(() => {
    if (id) fetchReferral(Number(id));
  }, [id, fetchReferral]);

  useEffect(() => {
    if (current) {
      setForm({
        reason: current.reason,
        targetDept: current.targetDept,
        urgency: current.urgency,
        expectedReturnDays: current.expectedReturnDays,
      });
    }
  }, [current]);

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !changeNote.trim()) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await updateReferral(current.id, { ...form, changeNote });
      await fetchReferral(current.id);
      navigate(`/referral/${current.id}`);
    } catch (err: any) {
      setErrorMsg(err?.message || "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  const EDIT_ALLOWED: ReferralStatus[] = ["draft", "rejected", "pending_review", "sent", "change_alerted"];
  const canEditThis = current && user
    && user.role === "gp"
    && current.createdBy === user.id
    && EDIT_ALLOWED.includes(current.status);

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        加载中...
      </div>
    );
  }

  if (!canEditThis) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-sm text-red-700 font-medium">无法编辑此转诊申请</p>
          <p className="text-xs text-red-500 mt-2">
            仅全科医生且为申请创建者，在草稿/被驳回/待审核/已发送/变更提醒状态下可编辑
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <h1 className="text-lg font-bold text-zinc-800 mb-6">
        编辑转诊申请 - {current.patientName}
      </h1>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
          <legend className="text-sm font-medium text-zinc-600 px-2">
            转诊信息
          </legend>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">转诊原因</label>
            <textarea
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              rows={3}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">拟转科室</label>
              <select
                value={form.targetDept}
                onChange={(e) => update("targetDept", e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="">请选择</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">紧急程度</label>
              <div className="flex gap-3 mt-1">
                {(Object.keys(URGENCY_LABELS) as Urgency[]).map((u) => (
                  <label key={u} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value={u}
                      checked={form.urgency === u}
                      onChange={() => update("urgency", u)}
                      className="accent-teal-600"
                    />
                    {URGENCY_LABELS[u]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              预期回传天数: <span className="font-medium text-teal-700">{form.expectedReturnDays}</span> 天
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={form.expectedReturnDays}
              onChange={(e) => update("expectedReturnDays", Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>1天</span><span>30天</span>
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
          <legend className="text-sm font-medium text-zinc-600 px-2">
            变更说明
          </legend>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">变更原因 *</label>
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              rows={2}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              placeholder="请说明本次修改原因"
              required
            />
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !changeNote.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? "保存中..." : "保存修改"}
          </button>
        </div>
      </form>
    </div>
  );
}
