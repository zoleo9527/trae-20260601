"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/context";

const POND_STATUS_DOT: Record<string, string> = {
  danger: "#ef4444",
  warning: "#f59e0b",
  normal: "#22c55e",
};

const ROLE_SUBTITLES: Record<string, string> = {
  FEED_MANAGER: "管理每日投喂计划，根据水质预警调整投喂量",
  TECHNICIAN: "查看投喂情况，结合巡检数据评估",
  FARM_DIRECTOR: "全局投喂概览",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isReduced(remarks: string | null | undefined) {
  if (!remarks) return false;
  return /减|减半|减量/.test(remarks);
}

export default function FeedRecordsPage() {
  const { user } = useCurrentUser();
  const [records, setRecords] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    pondId: "",
    feedType: "",
    amount: "",
    unit: "kg",
    remarks: "",
  });

  const fetchRecords = async () => {
    const res = await fetch("/api/feed-records");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  };

  const fetchPonds = async () => {
    const res = await fetch("/api/ponds");
    const data = await res.json();
    setPonds(data);
  };

  useEffect(() => {
    fetchRecords();
    if (user.role === "FEED_MANAGER") {
      fetchPonds();
    }
  }, [user.role]);

  const handleSubmit = async () => {
    if (!form.pondId || !form.feedType || !form.amount) return;
    setSubmitting(true);
    await fetch("/api/feed-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pondId: parseInt(form.pondId),
        operatorId: user.id,
        feedType: form.feedType,
        amount: parseFloat(form.amount),
        unit: form.unit,
        remarks: form.remarks,
        fedAt: new Date().toISOString(),
      }),
    });
    setSubmitting(false);
    setForm({ pondId: "", feedType: "", amount: "", unit: "kg", remarks: "" });
    setFormOpen(false);
    fetchRecords();
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayRecords = records.filter((r: any) => r.fedAt && r.fedAt.startsWith(todayStr));
  const todayTotal = todayRecords.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const todayPonds = new Set(todayRecords.map((r: any) => r.pondId));
  const reducedCount = todayRecords.filter((r: any) => isReduced(r.remarks)).length;

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, color: "#1e293b", marginBottom: 4 }}>投喂记录</h1>
      <p style={{ margin: 0, fontSize: 14, color: "#64748b", marginBottom: 20 }}>
        {ROLE_SUBTITLES[user.role] || ""}
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>今日投喂总量</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#1e293b" }}>{todayTotal} kg</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>已投塘口数</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#1e293b" }}>{todayPonds.size}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>减量塘口数</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: reducedCount > 0 ? "#f59e0b" : "#1e293b" }}>{reducedCount}</div>
        </div>
      </div>

      {user.role === "FEED_MANAGER" && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setFormOpen(!formOpen)}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "1px solid #1e293b",
              background: formOpen ? "#1e293b" : "#fff",
              color: formOpen ? "#fff" : "#1e293b",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            新增投喂记录
          </button>
          {formOpen && (
            <div style={{ marginTop: 12, padding: 20, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 13, color: "#475569" }}>
                  塘口
                  <select
                    value={form.pondId}
                    onChange={(e) => setForm({ ...form, pondId: e.target.value })}
                    style={{ display: "block", width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                  >
                    <option value="">请选择塘口</option>
                    {ponds.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 13, color: "#475569" }}>
                  饲料类型
                  <input
                    value={form.feedType}
                    onChange={(e) => setForm({ ...form, feedType: e.target.value })}
                    placeholder="如：配合饲料"
                    style={{ display: "block", width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                  />
                </label>
                <label style={{ fontSize: 13, color: "#475569" }}>
                  投喂量
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    style={{ display: "block", width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                  />
                </label>
                <label style={{ fontSize: 13, color: "#475569" }}>
                  单位
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={{ display: "block", width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                  />
                </label>
              </div>
              <label style={{ display: "block", fontSize: 13, color: "#475569", marginTop: 12 }}>
                备注
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  rows={3}
                  placeholder="如需减量请注明原因"
                  style={{ display: "block", width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14, resize: "vertical" }}
                />
              </label>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.pondId || !form.feedType || !form.amount}
                style={{
                  marginTop: 16,
                  padding: "8px 24px",
                  borderRadius: 6,
                  border: "none",
                  background: submitting || !form.pondId || !form.feedType || !form.amount ? "#94a3b8" : "#1e293b",
                  color: "#fff",
                  cursor: submitting || !form.pondId || !form.feedType || !form.amount ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {submitting ? "提交中..." : "提交"}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {records.map((r: any) => {
          const reduced = isReduced(r.remarks);
          const dotColor = POND_STATUS_DOT[r.pond?.status] || POND_STATUS_DOT.normal;
          return (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                padding: 16,
                borderLeft: reduced ? "4px solid #f59e0b" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{r.pond?.name}</span>
                  {r.pond?.species && (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.pond.species}</span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{formatTime(r.fedAt)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14, color: "#334155" }}>
                <span>{r.feedType} {r.amount}{r.unit}</span>
                <span style={{ color: "#64748b" }}>操作人：{r.operator?.name}</span>
              </div>
              {r.remarks && (
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>
                  {r.remarks}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {records.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>暂无投喂记录</div>
      )}
    </div>
  );
}
