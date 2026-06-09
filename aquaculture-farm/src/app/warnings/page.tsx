"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/context";

const levelMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DANGER: { label: "危险", color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  WARNING: { label: "警告", color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  INFO: { label: "提示", color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
};

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "活跃", color: "#991b1b", bg: "#fee2e2" },
  ACKNOWLEDGED: { label: "已知晓", color: "#92400e", bg: "#fef3c7" },
  RESOLVED: { label: "已解决", color: "#065f46", bg: "#d1fae5" },
  ESCALATED: { label: "已升级", color: "#5b21b6", bg: "#ede9fe" },
};

const FILTER_OPTIONS = [
  { value: "", label: "全部" },
  { value: "ACTIVE", label: "活跃" },
  { value: "ACKNOWLEDGED", label: "已知晓" },
  { value: "RESOLVED", label: "已解决" },
  { value: "ESCALATED", label: "已升级" },
];

const HANDLE_STATUS_OPTIONS = [
  { value: "ACKNOWLEDGED", label: "已知晓" },
  { value: "RESOLVED", label: "已解决" },
  { value: "ESCALATED", label: "升级处理" },
];

const sourceTypeLabels: Record<string, string> = {
  INSPECTION: "巡检",
  SENSOR: "传感器",
  MEDICATION: "药品",
};

const remarkSourceLabels: Record<string, { label: string; bg: string }> = {
  INSPECTION: { label: "巡检", bg: "#fef3c7" },
  HANDLER: { label: "处理", bg: "#dbeafe" },
  SYSTEM: { label: "系统", bg: "#f1f5f9" },
  MEDICATION: { label: "药品", bg: "#ede9fe" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WarningsPage() {
  const { user } = useCurrentUser();
  const [warnings, setWarnings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedWarning, setSelectedWarning] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [handleStatus, setHandleStatus] = useState("ACKNOWLEDGED");
  const [handleRemarks, setHandleRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWarnings = async (status = "") => {
    setLoading(true);
    const url = status ? `/api/warnings?status=${status}` : "/api/warnings";
    const res = await fetch(url);
    const data = await res.json();
    setWarnings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWarnings(statusFilter);
  }, [statusFilter]);

  const openDrawer = async (w: any) => {
    setSelectedWarning(w);
    setHandleStatus("ACKNOWLEDGED");
    setHandleRemarks("");
    const logsRes = await fetch(`/api/status-logs?entityType=Warning&entityId=${w.id}`);
    const logsData = await logsRes.json();
    setStatusLogs(logsData);
  };

  const closeDrawer = () => {
    setSelectedWarning(null);
    setStatusLogs([]);
  };

  const handleSubmit = async () => {
    if (!selectedWarning) return;
    setSubmitting(true);
    const body = {
      status: handleStatus,
      handlerId: user.id,
      handledAt: new Date().toISOString(),
      handleRemarks,
    };
    await fetch(`/api/warnings/${selectedWarning.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    closeDrawer();
    fetchWarnings(statusFilter);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, color: "#1e293b", marginBottom: 20 }}>水质预警</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {FILTER_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #e2e8f0",
              background: statusFilter === opt.value ? "#1e293b" : "#fff",
              color: statusFilter === opt.value ? "#fff" : "#475569", cursor: "pointer", fontSize: 14 }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {warnings.map((w: any) => {
          const lv = levelMap[w.level] || levelMap.INFO;
          const st = statusMap[w.status] || statusMap.ACTIVE;
          const inspectionRemarks = (w.remarks || []).filter((r: any) => r.sourceType === "INSPECTION");
          const latestInspectionRemark = inspectionRemarks.length > 0 ? inspectionRemarks[inspectionRemarks.length - 1] : null;
          return (
            <div key={w.id} onClick={() => openDrawer(w)}
              style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16, cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: lv.dot, flexShrink: 0,
                  animation: w.level === "DANGER" ? "pulse 1.5s infinite" : "none" }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{w.pond.name}</span>
                <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: lv.bg, color: lv.color }}>{lv.label}</span>
                <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                {w.sourceType && (
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: "#f1f5f9", color: "#64748b" }}>
                    {sourceTypeLabels[w.sourceType] || w.sourceType}
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>{formatTime(w.createdAt)}</span>
              </div>
              <div style={{ fontSize: 14, color: "#334155", marginBottom: 4 }}>{w.message}</div>
              {w.metric && (
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {"指标: "}{w.metric}
                  {w.value != null && ` | 当前值: ${w.value}`}
                  {w.threshold != null && ` | 阈值: ${w.threshold}`}
                </div>
              )}
              {w.handler && (
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  {"处理人: "}{w.handler.name}
                  {w.handledAt && ` | ${formatTime(w.handledAt)}`}
                </div>
              )}
              {latestInspectionRemark && (
                <div style={{ marginTop: 8, padding: 10, background: "#fffbeb", borderRadius: 6, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>来自巡检备注</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{latestInspectionRemark.content}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {warnings.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>暂无预警记录</div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {selectedWarning && (() => {
        const w = selectedWarning;
        const lv = levelMap[w.level] || levelMap.INFO;
        const st = statusMap[w.status] || statusMap.ACTIVE;
        const sortedRemarks = [...(w.remarks || [])].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return (
          <>
            <div onClick={closeDrawer}
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 999 }}
            />
            <div
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff",
                zIndex: 1000, boxShadow: "-4px 0 16px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>异常处理抽屉</span>
                <button onClick={closeDrawer} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b", padding: 0, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>{w.pond.name}</span>
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: lv.bg, color: lv.color }}>{lv.label}</span>
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "#334155", marginBottom: 6 }}>{w.message}</div>
                  {w.metric && (
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {"指标: "}{w.metric}
                      {w.value != null && ` | 当前值: ${w.value}`}
                      {w.threshold != null && ` | 阈值: ${w.threshold}`}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{formatTime(w.createdAt)}</div>
                </div>

                {sortedRemarks.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>备注时间线</div>
                    <div style={{ position: "relative", paddingLeft: 20 }}>
                      {sortedRemarks.map((r: any, idx: number) => {
                        const src = remarkSourceLabels[r.sourceType] || { label: r.sourceType, bg: "#f1f5f9" };
                        return (
                          <div key={r.id} style={{ position: "relative", paddingBottom: idx < sortedRemarks.length - 1 ? 16 : 0 }}>
                            <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: "50%",
                              background: "#3b82f6", border: "2px solid #fff", boxShadow: "0 0 0 1px #3b82f6" }} />
                            {idx < sortedRemarks.length - 1 && (
                              <div style={{ position: "absolute", left: -16, top: 16, bottom: 0, width: 2, background: "#cbd5e1" }} />
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ padding: "1px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: src.bg, color: "#475569" }}>{src.label}</span>
                              <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.author?.name}</span>
                              <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatTime(r.createdAt)}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{r.content}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {statusLogs.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>状态变更记录</div>
                    <div style={{ position: "relative", paddingLeft: 20 }}>
                      {statusLogs.map((log: any, idx: number) => {
                        const fromSt = statusMap[log.fromStatus];
                        const toSt = statusMap[log.toStatus];
                        return (
                          <div key={log.id} style={{ position: "relative", paddingBottom: idx < statusLogs.length - 1 ? 20 : 0 }}>
                            <div style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: "50%",
                              background: "#3b82f6", border: "2px solid #fff", boxShadow: "0 0 0 1px #3b82f6" }} />
                            {idx < statusLogs.length - 1 && (
                              <div style={{ position: "absolute", left: -16, top: 16, bottom: 0, width: 2, background: "#cbd5e1" }} />
                            )}
                            <div style={{ fontSize: 13, color: "#334155" }}>
                              <span style={{ fontWeight: 600, color: fromSt?.color || "#64748b" }}>{fromSt?.label || log.fromStatus}</span>
                              {" → "}
                              <span style={{ fontWeight: 600, color: toSt?.color || "#1e293b" }}>{toSt?.label || log.toStatus}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{log.operator.name} | {formatTime(log.createdAt)}</div>
                            {log.remarks && (
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{log.remarks}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>处理操作</div>
                  <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 8 }}>处理状态
                    <select value={handleStatus} onChange={(e) => setHandleStatus(e.target.value)}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}>
                      {HANDLE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "block", fontSize: 13, color: "#475569", marginBottom: 8 }}>处理备注
                    <textarea value={handleRemarks} onChange={(e) => setHandleRemarks(e.target.value)} rows={3}
                      style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14, resize: "vertical" }} />
                  </label>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                    {"处理人: "}{user.name}{" | "}{formatTime(new Date().toISOString())}
                  </div>
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{ width: "100%", padding: "10px 0", borderRadius: 6, border: "none",
                      background: submitting ? "#94a3b8" : "#1e293b", color: "#fff",
                      cursor: submitting ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
                    {submitting ? "提交中..." : "确认处理"}
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
