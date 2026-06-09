"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/context";

const STATUS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "PENDING", label: "待处理" },
  { value: "IN_PROGRESS", label: "处理中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "ABNORMAL", label: "异常" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "处理中",
  COMPLETED: "已完成",
  ABNORMAL: "异常",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef3c7", color: "#92400e" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  COMPLETED: { bg: "#d1fae5", color: "#065f46" },
  ABNORMAL: { bg: "#fee2e2", color: "#991b1b" },
};

const WARNING_LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  DANGER: { bg: "#fee2e2", color: "#991b1b" },
  WARNING: { bg: "#fef3c7", color: "#92400e" },
  INFO: { bg: "#dbeafe", color: "#1e40af" },
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

function getMetricColor(key: string, value: number | null) {
  if (value == null) return undefined;
  if (key === "dissolvedOx" && value < 4) return "#ef4444";
  if (key === "ammonia" && value > 1) return "#ef4444";
  if (key === "pH" && value < 6.5) return "#f59e0b";
  if (key === "waterTemp" && value > 30) return "#f59e0b";
  return undefined;
}

export default function InspectionsPage() {
  const { user } = useCurrentUser();
  const [inspections, setInspections] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    waterTemp: "",
    dissolvedOx: "",
    pH: "",
    ammonia: "",
    appearance: "",
    remarks: "",
    status: "IN_PROGRESS",
  });
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInspections = async (status = "") => {
    setLoading(true);
    const url = status ? `/api/inspections?status=${status}` : "/api/inspections";
    const res = await fetch(url);
    const data = await res.json();
    setInspections(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInspections(statusFilter);
  }, [statusFilter]);

  const openProcessing = (insp: any) => {
    setProcessingId(insp.id);
    setForm({
      waterTemp: insp.waterTemp != null ? String(insp.waterTemp) : "",
      dissolvedOx: insp.dissolvedOx != null ? String(insp.dissolvedOx) : "",
      pH: insp.pH != null ? String(insp.pH) : "",
      ammonia: insp.ammonia != null ? String(insp.ammonia) : "",
      appearance: insp.appearance || "",
      remarks: insp.remarks || "",
      status: "IN_PROGRESS",
    });
    setHistoryId(null);
  };

  const handleSubmit = async (inspId: number) => {
    const body: any = {
      waterTemp: form.waterTemp ? parseFloat(form.waterTemp) : null,
      dissolvedOx: form.dissolvedOx ? parseFloat(form.dissolvedOx) : null,
      pH: form.pH ? parseFloat(form.pH) : null,
      ammonia: form.ammonia ? parseFloat(form.ammonia) : null,
      appearance: form.appearance,
      remarks: form.remarks,
      status: form.status,
      inspectorId: user.id,
    };
    if (form.status === "COMPLETED" || form.status === "ABNORMAL") {
      body.completedAt = new Date().toISOString();
    }
    await fetch(`/api/inspections/${inspId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setProcessingId(null);
    fetchInspections(statusFilter);
  };

  const toggleHistory = async (inspId: number) => {
    if (historyId === inspId) {
      setHistoryId(null);
      setHistoryLogs([]);
      return;
    }
    setHistoryId(inspId);
    const res = await fetch(`/api/status-logs?entityType=Inspection&entityId=${inspId}`);
    const data = await res.json();
    setHistoryLogs(data);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, color: "#1e293b", marginBottom: 20 }}>塘口巡检管理</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {STATUS_OPTIONS.map((opt) => (
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {inspections.map((insp: any) => (
          <div key={insp.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{insp.pond.name}</span>
                <span style={{
                  padding: "2px 10px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: STATUS_COLORS[insp.status]?.bg || "#f1f5f9",
                  color: STATUS_COLORS[insp.status]?.color || "#475569",
                }}>{STATUS_LABELS[insp.status] || insp.status}</span>
                {insp.warnings && insp.warnings.length > 0 && (
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#fee2e2",
                    color: "#991b1b",
                  }}>{insp.warnings.length} 预警</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(insp.status === "PENDING" || insp.status === "IN_PROGRESS") && user.role === "TECHNICIAN" && (
                  <button
                    onClick={() => processingId === insp.id ? setProcessingId(null) : openProcessing(insp)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 4,
                      border: "1px solid #2563eb",
                      background: processingId === insp.id ? "#2563eb" : "#fff",
                      color: processingId === insp.id ? "#fff" : "#2563eb",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >处理</button>
                )}
                <button
                  onClick={() => toggleHistory(insp.id)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 4,
                    border: "1px solid #64748b",
                    background: historyId === insp.id ? "#64748b" : "#fff",
                    color: historyId === insp.id ? "#fff" : "#64748b",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >历史</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              巡检员：{insp.inspector.name} | 计划时间：{formatTime(insp.scheduledAt)}
              {insp.completedAt && (<> | 完成时间：{formatTime(insp.completedAt)}</>)}
            </div>
            {(insp.waterTemp != null || insp.dissolvedOx != null || insp.pH != null || insp.ammonia != null) && (
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#475569", marginBottom: 8, flexWrap: "wrap" }}>
                {insp.waterTemp != null && (
                  <span style={{ color: getMetricColor("waterTemp", insp.waterTemp) || "#475569" }}>
                    水温：{insp.waterTemp}°C
                  </span>
                )}
                {insp.dissolvedOx != null && (
                  <span style={{ color: getMetricColor("dissolvedOx", insp.dissolvedOx) || "#475569" }}>
                    溶解氧：{insp.dissolvedOx}mg/L
                  </span>
                )}
                {insp.pH != null && (
                  <span style={{ color: getMetricColor("pH", insp.pH) || "#475569" }}>
                    pH：{insp.pH}
                  </span>
                )}
                {insp.ammonia != null && (
                  <span style={{ color: getMetricColor("ammonia", insp.ammonia) || "#475569" }}>
                    氨氮：{insp.ammonia}mg/L
                  </span>
                )}
              </div>
            )}
            {insp.appearance && (
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>外观：{insp.appearance}</div>
            )}
            {insp.remarks && (
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>备注：{insp.remarks}</div>
            )}
            {insp.warnings && insp.warnings.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {insp.warnings.map((w: any) => {
                  const lc = WARNING_LEVEL_COLORS[w.level] || WARNING_LEVEL_COLORS.INFO;
                  return (
                    <span key={w.id} style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: lc.bg,
                      color: lc.color,
                    }}>{w.metric || w.message}</span>
                  );
                })}
              </div>
            )}
            {processingId === insp.id && (
              <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>巡检处理</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ fontSize: 13, color: "#475569" }}>
                    水温(°C)
                    <input
                      value={form.waterTemp}
                      onChange={(e) => setForm({ ...form, waterTemp: e.target.value })}
                      type="number"
                      step="0.1"
                      style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                    />
                  </label>
                  <label style={{ fontSize: 13, color: "#475569" }}>
                    溶解氧(mg/L)
                    <input
                      value={form.dissolvedOx}
                      onChange={(e) => setForm({ ...form, dissolvedOx: e.target.value })}
                      type="number"
                      step="0.1"
                      style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                    />
                  </label>
                  <label style={{ fontSize: 13, color: "#475569" }}>
                    pH
                    <input
                      value={form.pH}
                      onChange={(e) => setForm({ ...form, pH: e.target.value })}
                      type="number"
                      step="0.1"
                      style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                    />
                  </label>
                  <label style={{ fontSize: 13, color: "#475569" }}>
                    氨氮(mg/L)
                    <input
                      value={form.ammonia}
                      onChange={(e) => setForm({ ...form, ammonia: e.target.value })}
                      type="number"
                      step="0.1"
                      style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                    />
                  </label>
                </div>
                <label style={{ display: "block", fontSize: 13, color: "#475569", marginTop: 12 }}>
                  外观
                  <input
                    value={form.appearance}
                    onChange={(e) => setForm({ ...form, appearance: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                  />
                </label>
                <label style={{ display: "block", fontSize: 13, color: "#475569", marginTop: 12 }}>
                  备注
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    rows={3}
                    style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14, resize: "vertical" }}
                  />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>备注信息将自动同步到关联的水质预警</span>
                </label>
                <label style={{ display: "block", fontSize: 13, color: "#475569", marginTop: 12 }}>
                  状态
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #cbd5e1", marginTop: 4, fontSize: 14 }}
                  >
                    <option value="IN_PROGRESS">处理中</option>
                    <option value="COMPLETED">已完成</option>
                    <option value="ABNORMAL">异常</option>
                  </select>
                </label>
                <button
                  onClick={() => handleSubmit(insp.id)}
                  style={{ marginTop: 16, padding: "8px 24px", borderRadius: 6, border: "none", background: "#1e293b", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
                >提交</button>
              </div>
            )}
            {historyId === insp.id && (
              <div style={{ marginTop: 16, padding: 16, background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e", marginBottom: 12 }}>状态变更历史</div>
                {historyLogs.length > 0 ? (
                  <div style={{ position: "relative", paddingLeft: 20 }}>
                    {historyLogs.map((log: any, idx: number) => (
                      <div key={log.id} style={{ position: "relative", paddingBottom: idx < historyLogs.length - 1 ? 20 : 0 }}>
                        <div style={{
                          position: "absolute",
                          left: -20,
                          top: 4,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#3b82f6",
                          border: "2px solid #fff",
                          boxShadow: "0 0 0 1px #3b82f6",
                        }} />
                        {idx < historyLogs.length - 1 && (
                          <div style={{ position: "absolute", left: -16, top: 16, bottom: 0, width: 2, background: "#cbd5e1" }} />
                        )}
                        <div style={{ fontSize: 13, color: "#334155" }}>
                          <span style={{ fontWeight: 600 }}>{STATUS_LABELS[log.fromStatus] || log.fromStatus}</span>
                          {" → "}
                          <span style={{ fontWeight: 600 }}>{STATUS_LABELS[log.toStatus] || log.toStatus}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                          {log.operator.name} | {formatTime(log.createdAt)}
                        </div>
                        {log.remarks && (
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{log.remarks}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>暂无状态变更记录</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {inspections.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>暂无巡检记录</div>
      )}
    </div>
  );
}
