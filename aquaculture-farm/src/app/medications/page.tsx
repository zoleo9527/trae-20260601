"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/context";

const POND_STATUS_DOT: Record<string, string> = {
  danger: "#ef4444",
  warning: "#f59e0b",
  normal: "#22c55e",
};

const FILTER_OPTIONS = [
  { value: "", label: "全部" },
  { value: "followUp", label: "需跟进" },
  { value: "completed", label: "已完成" },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeSince(iso: string) {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}小时前`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}天前`;
}

export default function MedicationsPage() {
  const { user } = useCurrentUser();
  const [records, setRecords] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [followUpId, setFollowUpId] = useState<number | null>(null);
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/medications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecords(data);
    } catch {
      showToast("error", "获取药品记录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFollowUp = (id: number) => {
    setFollowUpId(id);
    setFollowUpRemarks("");
  };

  const cancelFollowUp = () => {
    setFollowUpId(null);
    setFollowUpRemarks("");
  };

  const submitFollowUp = async (id: number) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/medications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          needsFollowUp: false,
          followUpHandledBy: user.id,
          followUpHandledAt: new Date().toISOString(),
          followUpRemarks: followUpRemarks || null,
          operatorId: user.id,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "跟进处理已提交，状态已更新");
      setFollowUpId(null);
      setFollowUpRemarks("");
      fetchRecords();
    } catch {
      showToast("error", "跟进处理提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayRecords = records.filter((r: any) => r.administeredAt && r.administeredAt.startsWith(todayStr));
  const followUpItems = records.filter((r: any) => r.needsFollowUp);
  const followUpCount = followUpItems.length;

  const filteredRecords = records.filter((r: any) => {
    if (statusFilter === "followUp") return r.needsFollowUp;
    if (statusFilter === "completed") return !r.needsFollowUp;
    return true;
  });

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>加载中...</div>;
  }

  return (
    <div>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 8,
            background: toast.type === "success" ? "#d1fae5" : "#fee2e2",
            color: toast.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#1e293b" }}>药品台账</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                background: statusFilter === opt.value ? "#1e293b" : "#fff",
                color: statusFilter === opt.value ? "#fff" : "#475569",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>总记录数</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#1e293b" }}>{records.length}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>需跟进</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: followUpCount > 0 ? "#5b21b6" : "#1e293b" }}>{followUpCount}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>今日用药</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#1e293b" }}>{todayRecords.length}</div>
        </div>
      </div>

      {followUpItems.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#ede9fe", borderRadius: 8, border: "1px solid #c4b5fd" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5b21b6", marginBottom: 12 }}>跟进事项</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {followUpItems.map((r: any) => {
              const dotColor = POND_STATUS_DOT[r.pond?.status] || POND_STATUS_DOT.normal;
              return (
                <div key={r.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{r.pond?.name}</span>
                    <span style={{ fontSize: 13, color: "#334155" }}>{r.medicationName}</span>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{r.purpose}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{timeSince(r.administeredAt)}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.administrator?.name}</span>
                    {(user.role === "TECHNICIAN" || user.role === "FARM_DIRECTOR") && (
                      <button
                        onClick={() => handleFollowUp(r.id)}
                        style={{
                          marginLeft: "auto",
                          padding: "4px 12px",
                          borderRadius: 4,
                          border: "1px solid #5b21b6",
                          background: "#fff",
                          color: "#5b21b6",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {user.role === "FARM_DIRECTOR" ? "确认跟进" : "跟进处理"}
                      </button>
                    )}
                  </div>
                  {followUpId === r.id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
                        {user.role === "FARM_DIRECTOR" ? "确认跟进" : "跟进处理"}
                      </div>
                      <textarea
                        value={followUpRemarks}
                        onChange={(e) => setFollowUpRemarks(e.target.value)}
                        placeholder="填写跟进处理备注..."
                        rows={2}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          resize: "vertical",
                          marginBottom: 8,
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                        处理人：{user.name} | {formatTime(new Date().toISOString())}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => submitFollowUp(r.id)}
                          disabled={submitting}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 6,
                            border: "none",
                            background: submitting ? "#94a3b8" : "#5b21b6",
                            color: "#fff",
                            cursor: submitting ? "not-allowed" : "pointer",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {submitting ? "提交中..." : "确认提交"}
                        </button>
                        <button
                          onClick={cancelFollowUp}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 6,
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            color: "#475569",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredRecords.map((r: any) => {
          const dotColor = POND_STATUS_DOT[r.pond?.status] || POND_STATUS_DOT.normal;
          return (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{r.pond?.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {r.needsFollowUp ? (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: "#ede9fe", color: "#5b21b6" }}>需跟进</span>
                  ) : (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: "#d1fae5", color: "#065f46" }}>已完成</span>
                  )}
                  {r.needsFollowUp && (user.role === "TECHNICIAN" || user.role === "FARM_DIRECTOR") && (
                    <button
                      onClick={() => handleFollowUp(r.id)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 4,
                        border: "1px solid #5b21b6",
                        background: "#fff",
                        color: "#5b21b6",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {user.role === "FARM_DIRECTOR" ? "确认跟进" : "跟进处理"}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{r.medicationName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14, color: "#334155", marginBottom: 4 }}>
                <span>{r.dosage}{r.unit}</span>
                <span style={{ color: "#64748b" }}>{r.purpose}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#94a3b8" }}>
                <span>{r.administrator?.name}</span>
                <span>{formatTime(r.administeredAt)}</span>
              </div>
              {r.remarks && (
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{r.remarks}</div>
              )}
              {!r.needsFollowUp && r.followUpHandler && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 2 }}>跟进完成</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    处理人：{r.followUpHandler.name}
                    {r.followUpHandledAt && ` | ${formatTime(r.followUpHandledAt)}`}
                  </div>
                  {r.followUpRemarks && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>备注：{r.followUpRemarks}</div>
                  )}
                </div>
              )}
              {followUpId === r.id && r.needsFollowUp && (
                <div style={{ marginTop: 12, padding: 14, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10 }}>
                    {user.role === "FARM_DIRECTOR" ? "确认跟进" : "跟进处理"}
                  </div>
                  <textarea
                    value={followUpRemarks}
                    onChange={(e) => setFollowUpRemarks(e.target.value)}
                    placeholder="填写跟进处理备注..."
                    rows={2}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      resize: "vertical",
                      marginBottom: 8,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                    处理人：{user.name} | {formatTime(new Date().toISOString())}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => submitFollowUp(r.id)}
                      disabled={submitting}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 6,
                        border: "none",
                        background: submitting ? "#94a3b8" : "#5b21b6",
                        color: "#fff",
                        cursor: submitting ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {submitting ? "提交中..." : "确认提交"}
                    </button>
                    <button
                      onClick={cancelFollowUp}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#475569",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredRecords.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>
            {statusFilter === "followUp" ? "暂无需跟进的药品记录" : statusFilter === "completed" ? "暂无已完成的药品记录" : "暂无药品记录"}
          </div>
        </div>
      )}
    </div>
  );
}
