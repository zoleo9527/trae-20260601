import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReferralStore } from "@/stores/referralStore";
import { URGENCY_LABELS } from "@/types";
import type { Urgency } from "@/types";

const departments = [
  "内科",
  "外科",
  "妇产科",
  "儿科",
  "骨科",
  "心血管科",
  "呼吸科",
  "消化科",
  "神经内科",
  "内分泌科",
  "皮肤科",
  "眼科",
  "耳鼻喉科",
  "口腔科",
  "精神科",
];

export default function ReferralNew() {
  const navigate = useNavigate();
  const { createReferral } = useReferralStore();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "male" as "male" | "female",
    reason: "",
    targetDept: "",
    urgency: "routine" as Urgency,
    expectedReturnDays: 7,
    notes: "",
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.reason || !form.targetDept) return;
    setSubmitting(true);
    try {
      await createReferral({
        patientName: form.patientName,
        patientAge: Number(form.patientAge) || 0,
        patientGender: form.patientGender,
        reason: form.reason,
        targetDept: form.targetDept,
        urgency: form.urgency,
        expectedReturnDays: form.expectedReturnDays,
        notes: form.notes,
      });
      navigate("/");
    } catch {
      alert("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-zinc-800 mb-6">新建转诊申请</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
          <legend className="text-sm font-medium text-zinc-600 px-2">
            患者信息
          </legend>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">姓名</label>
              <input
                type="text"
                value={form.patientName}
                onChange={(e) => update("patientName", e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">年龄</label>
              <input
                type="number"
                min={0}
                max={150}
                value={form.patientAge}
                onChange={(e) => update("patientAge", e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">性别</label>
              <select
                value={form.patientGender}
                onChange={(e) =>
                  update("patientGender", e.target.value as "male" | "female")
                }
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>
        </fieldset>

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
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                拟转科室
              </label>
              <select
                value={form.targetDept}
                onChange={(e) => update("targetDept", e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              >
                <option value="">请选择</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                紧急程度
              </label>
              <div className="flex gap-3 mt-1">
                {(Object.keys(URGENCY_LABELS) as Urgency[]).map((u) => (
                  <label
                    key={u}
                    className="flex items-center gap-1.5 text-sm cursor-pointer"
                  >
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
        </fieldset>

        <fieldset className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
          <legend className="text-sm font-medium text-zinc-600 px-2">
            时限设置
          </legend>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              预期回传天数:{" "}
              <span className="font-medium text-teal-700">
                {form.expectedReturnDays}
              </span>{" "}
              天
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={form.expectedReturnDays}
              onChange={(e) =>
                update("expectedReturnDays", Number(e.target.value))
              }
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>1天</span>
              <span>30天</span>
            </div>
          </div>
        </fieldset>

        <fieldset className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
          <legend className="text-sm font-medium text-zinc-600 px-2">
            备注
          </legend>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">创建备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              placeholder="补充说明（可选）"
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
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? "提交中..." : "创建申请"}
          </button>
        </div>
      </form>
    </div>
  );
}
