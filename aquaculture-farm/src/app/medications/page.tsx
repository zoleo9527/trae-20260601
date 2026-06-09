"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/context";

const POND_STATUS_DOT: Record<string, string> = { danger: "#ef4444", warning: "#f59e0b", normal: "#22c55e" };

const FOLLOW_UP_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  NONE: { label: "无需跟进", bg: "#f1f5f9", color: "#64748b" },
  PENDING_FOLLOW_UP: { label: "待跟进", bg: "#ede9fe", color: "#5b21b6" },
  PENDING_CONFIRM: { label: "待确认", bg: "#fef3c7", color: "#92400e" },
  CONFIRMED: { label: "已确认", bg: "#d1fae5", color: "#065f46" },
};

const FILTER_OPTIONS = [
  { value: "", label: "全部" },
  { value: "PENDING_FOLLOW_UP", label: "待跟进" },
  { value: "PENDING_CONFIRM", label: "待确认" },
  { value: "CONFIRMED", label: "已确认" },
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
  const [activeId, setActiveId] = useState<number | null>(null);
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

  useEffect(() => { fetchRecords(); }, []);

  const openForm = (id: number) => { setActiveId(id); setFollowUpRemarks(""); };
  const closeForm = () => { setActiveId(null); setFollowUpRemarks(""); };

  const submitAction = async (id: number, action: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/medications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, operatorId: user.id, followUpRemarks: followUpRemarks || null }),
      });
      if (!res.ok) throw new Error();
      const actionLabel = action === "SUBMIT_FOLLOW_UP" ? "跟进已提交，等待场长确认" : "确认完成";
      showToast("success", actionLabel);
      closeForm();
      fetchRecords();
    } catch {
      showToast("error", "操作提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayRecords = records.filter((r: any) => r.administeredAt && r.administeredAt.startsWith(todayStr));
  const pendingFollowUp = records.filter((r: any) => r.followUpStatus === "PENDING_FOLLOW_UP");
  const pendingConfirm = records.filter((r: any) => r.followUpStatus === "PENDING_CONFIRM");
  const openItems = [...pendingFollowUp, ...pendingConfirm];

  const filteredRecords = records.filter((r: any) => {
    if (statusFilter === "PENDING_FOLLOW_UP") return r.followUpStatus === "PENDING_FOLLOW_UP";
    if (statusFilter === "PENDING_CONFIRM") return r.followUpStatus === "PENDING_CONFIRM";
    if (statusFilter === "CONFIRMED") return r.followUpStatus === "CONFIRMED";
    return true;
  });

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>加载中...</div>;
  }

  const renderForm = (r: any) => {
    const isTech = user.role === "TECHNICIAN";
    const isDirector = user.role === "FARM_DIRECTOR";
    const canSubmit = isTech && r.followUpStatus === "PENDING_FOLLOW_UP";
    const canConfirm = isDirector && r.followUpStatus === "PENDING_CONFIRM";
    if (!canSubmit && !canConfirm) return null;
    const action = canSubmit ? "SUBMIT_FOLLOW_UP" : "CONFIRM_FOLLOW_UP";
    const title = canSubmit ? "提交跟进" : "确认跟进";
    const placeholder = canSubmit ? "填写跟进处理备注（提交后将等待场长确认）..." : "填写确认备注...";

    return (
      <div style={{ marginTop: 12, padding: 14, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10 }}>{title}</div>
        <textarea
          value={followUpRemarks}
          onChange={(e) => setFollowUpRemarks(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical", marginBottom: 8, boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
          处理人：{user.name} | {formatTime(new Date().toISOString())}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => submitAction(r.id, action)}
            disabled={submitting}
            style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: submitting ? "#94a3b8" : "#5b21b6", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500 }}
          >
            {submitting ? "提交中..." : title}
          </button>
          <button onClick={closeForm} style={{ padding: "8px 20px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", cursor: "pointer", fontSize: 13 }}>
            取消
          </button>
        </div>
      </div>
    );
  };

  const renderFollowUpTimeline = (r: any) => {
    const items: { label: string; person: string; time: string; remarks: string; bg: string }[] = [];
    if (r.followUpSubmitter) {
      items.push({
        label: "技术员跟进", person: r.followUpSubmitter.name,
        time: r.followUpSubmittedAt ? formatTime(r.followUpSubmittedAt) : "",
        remarks: r.followUpSubmittedRemarks || "", bg: "#dbeafe",
      });
    }
    if (r.followUpHandler) {
      items.push({
        label: "场长确认", person: r.followUpHandler.name,
        time: r.followUpHandledAt ? formatTime(r.followUpHandledAt) : "",
        remarks: r.followUpHandledRemarks || "", bg: "#d1fae5",
      });
    }
    if (items.length === 0) return null;
    return (
      <div style={{ marginTop: 8, padding: "10px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i < items.length - 1 ? 8 : 0, paddingBottom: i < items.length - 1 ? 8 : 0, borderBottom: i < items.length - 1 ? "1px solid #e2e8f0" : "none" }}>
            <span style={{ padding: "2px 8px", borderRadius: 4, background: item.bg, color: "#1e293b", fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{item.label}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#475569" }}>{item.person} {item.time && `| ${item.time}`}</div>
              {item.remarks && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>备注：{item.remarks}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 8, background: toast.type === "success" ? "#d1fae5" : "#fee2e2", color: toast.type === "success" ? "#065f46" : "#991b1b", border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#1e293b" }}>药品台账</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {FILTER_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #e2e8f0", background: statusFilter === opt.value ? "#1e293b" : "#fff", color: statusFilter === opt.value ? "#fff" : "#475569", cursor: "pointer", fontSize: 14 }}>
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
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>待跟进</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: pendingFollowUp.length > 0 ? "#5b21b6" : "#1e293b" }}>{pendingFollowUp.length}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>待确认</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: pendingConfirm.length > 0 ? "#92400e" : "#1e293b" }}>{pendingConfirm.length}</div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>今日用药</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#1e293b" }}>{todayRecords.length}</div>
        </div>
      </div>

      {openItems.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#ede9fe", borderRadius: 8, border: "1px solid #c4b5fd" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#5b21b6", marginBottom: 12 }}>跟进事项</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {openItems.map((r: any) => {
              const dotColor = POND_STATUS_DOT[r.pond?.status] || POND_STATUS_DOT.normal;
              const statusInfo = FOLLOW_UP_STATUS[r.followUpStatus] || FOLLOW_UP_STATUS.NONE;
              const canAct = (user.role === "TECHNICIAN" && r.followUpStatus === "PENDING_FOLLOW_UP") || (user.role === "FARM_DIRECTOR" && r.followUpStatus === "PENDING_CONFIRM");
              return (
                <div key={r.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{r.pond?.name}</span>
                    <span style={{ fontSize: 13, color: "#334155" }}>{r.medicationName}</span>
                    <span style={{ padding: "1px 8px", borderRadius: 4, background: statusInfo.bg, color: statusInfo.color, fontSize: 11, fontWeight: 600 }}>{statusInfo.label}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{timeSince(r.administeredAt)}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.administrator?.name}</span>
                    {canAct && (
                      <button onClick={() => openForm(r.id)} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 4, border: "1px solid #5b21b6", background: "#fff", color: "#5b21b6", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                        {r.followUpStatus === "PENDING_FOLLOW_UP" ? "跟进处理" : "确认跟进"}
                      </button>
                    )}
                  </div>
                  {r.followUpSubmitter && r.followUpStatus === "PENDING_CONFIRM" && (
                    <div style={{ marginTop: 6, padding: "6px 10px", background: "#dbeafe", borderRadius: 4, fontSize: 12, color: "#1e40af" }}>
                      技术员 {r.followUpSubmitter.name} 已跟进{r.followUpSubmittedAt && ` (${formatTime(r.followUpSubmittedAt)})`}{r.followUpSubmittedRemarks && `：${r.followUpSubmittedRemarks}`}
                    </div>
                  )}
                  {activeId === r.id && renderForm(r)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredRecords.map((r: any) => {
          const dotColor = POND_STATUS_DOT[r.pond?.status] || POND_STATUS_DOT.normal;
          const statusInfo = FOLLOW_UP_STATUS[r.followUpStatus] || FOLLOW_UP_STATUS.NONE;
          const canAct = (user.role === "TECHNICIAN" && r.followUpStatus === "PENDING_FOLLOW_UP") || (user.role === "FARM_DIRECTOR" && r.followUpStatus === "PENDING_CONFIRM");
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{r.pond?.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {r.needsFollowUp && (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                  )}
                  {!r.needsFollowUp && r.followUpStatus === "CONFIRMED" && (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: "#d1fae5", color: "#065f46" }}>已确认</span>
                  )}
                  {!r.needsFollowUp && r.followUpStatus === "NONE" && (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>无需跟进</span>
                  )}
                  {canAct && (
                    <button onClick={() => openForm(r.id)} style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid #5b21b6", background: "#fff", color: "#5b21b6", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                      {r.followUpStatus === "PENDING_FOLLOW_UP" ? "跟进处理" : "确认跟进"}
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
              {r.remarks && <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{r.remarks}</div>}
              {renderFollowUpTimeline(r)}
              {activeId === r.id && canAct && renderForm(r)}
            </div>
          );
        })}
      </div>

      {filteredRecords.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💊</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>
            {statusFilter === "PENDING_FOLLOW_UP" ? "暂无待跟进的药品记录" : statusFilter === "PENDING_CONFIRM" ? "暂无待确认的药品记录" : statusFilter === "CONFIRMED" ? "暂无已确认的药品记录" : "暂无药品记录"}
          </div>
        </div>
      )}
    </div>
  );
}
