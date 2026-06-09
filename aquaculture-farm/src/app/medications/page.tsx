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
  const [localFollowUp, setLocalFollowUp] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    const res = await fetch("/api/medications");
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getEffectiveFollowUp = (r: any) => {
    if (r.id in localFollowUp) return localFollowUp[r.id];
    return r.needsFollowUp;
  };

  const handleConfirmFollowUp = (id: number) => {
    setLocalFollowUp((prev) => ({ ...prev, [id]: false }));
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayRecords = records.filter((r: any) => r.administeredAt && r.administeredAt.startsWith(todayStr));
  const followUpCount = records.filter((r: any) => getEffectiveFollowUp(r)).length;
  const followUpItems = records.filter((r: any) => getEffectiveFollowUp(r));

  const filteredRecords = records.filter((r: any) => {
    const effective = getEffectiveFollowUp(r);
    if (statusFilter === "followUp") return effective;
    if (statusFilter === "completed") return !effective;
    return true;
  });

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>加载中...</div>;
  }

  return (
    <div>
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
                <div
                  key={r.id}
                  style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 6, padding: "10px 14px" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{r.pond?.name}</span>
                  <span style={{ fontSize: 13, color: "#334155" }}>{r.medicationName}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{r.purpose}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{timeSince(r.administeredAt)}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.administrator?.name}</span>
                  {user.role === "TECHNICIAN" && (
                    <button
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
                      跟进处理
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredRecords.map((r: any) => {
          const effectiveFollowUp = getEffectiveFollowUp(r);
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
                  {effectiveFollowUp ? (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: "#ede9fe", color: "#5b21b6" }}>需跟进</span>
                  ) : (
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: "#d1fae5", color: "#065f46" }}>已完成</span>
                  )}
                  {effectiveFollowUp && user.role === "FARM_DIRECTOR" && (
                    <button
                      onClick={() => handleConfirmFollowUp(r.id)}
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
                      确认跟进
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
            </div>
          );
        })}
      </div>
      {filteredRecords.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>暂无药品记录</div>
      )}
    </div>
  );
}
