"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/context";

const roleLabels: Record<string, string> = {
  TECHNICIAN: "养殖技术员",
  FEED_MANAGER: "饲料仓管",
  FARM_DIRECTOR: "场长",
};

const allStatusLabels: Record<string, string> = {
  ACTIVE: "活跃",
  ACKNOWLEDGED: "已知晓",
  RESOLVED: "已解决",
  ESCALATED: "已升级",
  PENDING: "待处理",
  IN_PROGRESS: "处理中",
  COMPLETED: "已完成",
  ABNORMAL: "异常",
  FOLLOW_UP_NEEDED: "需跟进",
  PENDING_FOLLOW_UP: "待跟进",
  PENDING_CONFIRM: "待确认",
  FOLLOW_UP_COMPLETED: "跟进完成",
  CONFIRMED: "已确认",
};

const entityTypeLabels: Record<string, string> = {
  WARNING: "预警",
  INSPECTION: "巡检",
  MedicationRecord: "药品",
  Pond: "塘口",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface PriorityItem {
  priority: number;
  pondName: string;
  action: string;
  person: string;
  href: string;
  urgency: "danger" | "warning" | "info";
}

function buildPriorityQueue(
  role: string,
  dangerWarnings: any[],
  pendingToday: any[],
  inProgressInspections: any[],
  followUpMeds: any[],
  warningWarnings: any[],
  todayFeed: any[],
  escalatedWarnings: any[],
  activeWarnings: any[],
  abnormalInspections: any[],
  pendingFollowUpMeds: any[],
  pendingConfirmMeds: any[]
): PriorityItem[] {
  const items: PriorityItem[] = [];
  let idx = 1;

  if (role === "TECHNICIAN") {
    dangerWarnings.forEach((w) => {
      items.push({
        priority: idx++,
        pondName: w.pond.name,
        action: `处理危险预警: ${w.metric} ${w.message}`,
        person: w.handler?.name || w.inspection?.inspector?.name || "未指派",
        href: "/warnings",
        urgency: "danger",
      });
    });
    pendingToday.forEach((i) => {
      items.push({
        priority: idx++,
        pondName: i.pond.name,
        action: `执行待处理巡检 (${formatTime(i.scheduledAt)})`,
        person: i.inspector.name,
        href: "/inspections",
        urgency: "info",
      });
    });
    inProgressInspections.forEach((i) => {
      items.push({
        priority: idx++,
        pondName: i.pond.name,
        action: "继续处理中巡检",
        person: i.inspector.name,
        href: "/inspections",
        urgency: "info",
      });
    });
    followUpMeds.forEach((m) => {
      items.push({
        priority: idx++,
        pondName: m.pond.name,
        action: `跟进用药: ${m.medicationName} (${m.purpose})`,
        person: m.administrator.name,
        href: "/medications",
        urgency: m.followUpStatus === "PENDING_CONFIRM" ? "warning" : "info",
      });
    });
  } else if (role === "FEED_MANAGER") {
    dangerWarnings.forEach((w) => {
      items.push({
        priority: idx++,
        pondName: w.pond.name,
        action: `危险预警影响投喂: ${w.metric} ${w.message}`,
        person: w.handler?.name || "未指派",
        href: "/warnings",
        urgency: "danger",
      });
    });
    todayFeed.forEach((f) => {
      items.push({
        priority: idx++,
        pondName: f.pond.name,
        action: `投喂: ${f.feedType} ${f.amount}${f.unit}${f.remarks ? ` — ${f.remarks}` : ""}`,
        person: f.operator.name,
        href: "/feed-records",
        urgency: "info",
      });
    });
    warningWarnings
      .filter((w) => w.status === "ACTIVE")
      .forEach((w) => {
        items.push({
          priority: idx++,
          pondName: w.pond.name,
          action: `减少投喂: ${w.metric} ${w.message}`,
          person: w.handler?.name || "待确认",
          href: "/warnings",
          urgency: "warning",
        });
      });
  } else if (role === "FARM_DIRECTOR") {
    dangerWarnings.forEach((w) => {
      items.push({
        priority: idx++,
        pondName: w.pond.name,
        action: `关注危险预警: ${w.metric} ${w.message}`,
        person: w.handler?.name || "未指派",
        href: "/warnings",
        urgency: "danger",
      });
    });
    escalatedWarnings.forEach((w) => {
      items.push({
        priority: idx++,
        pondName: w.pond.name,
        action: `处理升级预警: ${w.metric} ${w.message}`,
        person: w.handler?.name || "未指派",
        href: "/warnings",
        urgency: "warning",
      });
    });
    activeWarnings.forEach((w) => {
      items.push({
        priority: idx++,
        pondName: w.pond.name,
        action: `查看活跃预警: ${w.metric}`,
        person: w.handler?.name || "未指派",
        href: "/warnings",
        urgency: "info",
      });
    });
    abnormalInspections.forEach((i) => {
      items.push({
        priority: idx++,
        pondName: i.pond.name,
        action: "查看异常巡检概览",
        person: i.inspector.name,
        href: "/inspections",
        urgency: "warning",
      });
    });
    followUpMeds.forEach((m) => {
      items.push({
        priority: idx++,
        pondName: m.pond.name,
        action: m.followUpStatus === "PENDING_CONFIRM"
          ? `确认用药跟进: ${m.medicationName} (${m.purpose}) — 技术员${m.followUpSubmitter?.name || ""}已提交`
          : `待跟进用药: ${m.medicationName} (${m.purpose})`,
        person: m.followUpStatus === "PENDING_CONFIRM" ? (m.followUpSubmitter?.name || m.administrator.name) : m.administrator.name,
        href: "/medications",
        urgency: m.followUpStatus === "PENDING_CONFIRM" ? "warning" : "info",
      });
    });
  }

  return items;
}

const urgencyStyles: Record<string, { bg: string; border: string; numberBg: string; numberColor: string }> = {
  danger: { bg: "#fef2f2", border: "#fecaca", numberBg: "#dc2626", numberColor: "#fff" },
  warning: { bg: "#fffbeb", border: "#fde68a", numberBg: "#d97706", numberColor: "#fff" },
  info: { bg: "#eff6ff", border: "#bfdbfe", numberBg: "#2563eb", numberColor: "#fff" },
};

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const [warnings, setWarnings] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [feedRecords, setFeedRecords] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/warnings").then((r) => r.json()),
      fetch("/api/inspections").then((r) => r.json()),
      fetch("/api/feed-records").then((r) => r.json()),
      fetch("/api/medications").then((r) => r.json()),
      fetch("/api/status-logs").then((r) => r.json()),
      fetch("/api/ponds").then((r) => r.json()),
    ])
      .then(([w, i, f, m, s, p]) => {
        setWarnings(w);
        setInspections(i);
        setFeedRecords(f);
        setMedications(m);
        setStatusLogs(s);
        setPonds(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const dangerWarnings = warnings.filter((w) => w.level === "DANGER");
  const warningWarnings = warnings.filter((w) => w.level === "WARNING");
  const pendingInspections = inspections.filter((i) => i.status === "PENDING");
  const inProgressInspections = inspections.filter((i) => i.status === "IN_PROGRESS");
  const todayStr = new Date().toISOString().slice(0, 10);
  const pendingToday = pendingInspections.filter((i) => i.scheduledAt?.slice(0, 10) === todayStr);
  const followUpMeds = medications.filter((m) => m.followUpStatus === "PENDING_FOLLOW_UP" || m.followUpStatus === "PENDING_CONFIRM");
  const pendingFollowUpMeds = medications.filter((m) => m.followUpStatus === "PENDING_FOLLOW_UP");
  const pendingConfirmMeds = medications.filter((m) => m.followUpStatus === "PENDING_CONFIRM");
  const escalatedWarnings = warnings.filter((w) => w.status === "ESCALATED");
  const activeWarnings = warnings.filter((w) => w.status === "ACTIVE");
  const abnormalInspections = inspections.filter((i) => i.status === "ABNORMAL");
  const todayFeed = feedRecords.filter((f) => f.fedAt?.slice(0, 10) === todayStr);

  const dangerCount = dangerWarnings.length;
  const warnCount = warningWarnings.length;
  const pendingCount = pendingInspections.length;
  const followUpMedCount = followUpMeds.length;
  const pendingConfirmCount = pendingConfirmMeds.length;

  const priorityItems = buildPriorityQueue(
    user.role,
    dangerWarnings,
    pendingToday,
    inProgressInspections,
    followUpMeds,
    warningWarnings,
    todayFeed,
    escalatedWarnings,
    activeWarnings,
    abnormalInspections,
    pendingFollowUpMeds,
    pendingConfirmMeds
  );

  const pondGrid = ponds.map((p) => {
    const activePondWarnings = p.warnings || [];
    const hasDanger = activePondWarnings.some((w: any) => w.level === "DANGER");
    const hasWarning = activePondWarnings.some((w: any) => w.level === "WARNING");
    const level = hasDanger ? "danger" : hasWarning ? "warning" : "normal";
    return {
      id: p.id,
      name: p.name,
      species: p.species,
      warningCount: activePondWarnings.length,
      level,
    };
  });

  const recentLogs = statusLogs.slice(0, 5);

  const handleReset = async () => {
    await fetch("/api/reset", { method: "POST" });
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 15 }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>今日工作台</h1>
          <span
            style={{
              background: "#f1f5f9",
              color: "#475569",
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              border: "1px solid #e2e8f0",
            }}
          >
            {roleLabels[user.role]}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {dangerCount > 0 && (
            <span
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid #fecaca",
              }}
            >
              危险 {dangerCount}
            </span>
          )}
          {warnCount > 0 && (
            <span
              style={{
                background: "#fffbeb",
                color: "#d97706",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid #fde68a",
              }}
            >
              警告 {warnCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid #bfdbfe",
              }}
            >
              待巡检 {pendingCount}
            </span>
          )}
          {followUpMedCount > 0 && (
            <span
              style={{
                background: "#ede9fe",
                color: "#5b21b6",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid #c4b5fd",
              }}
            >
              药品跟进 {followUpMedCount}
            </span>
          )}
          {pendingConfirmCount > 0 && (
            <span
              style={{
                background: "#fef3c7",
                color: "#92400e",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid #fde68a",
              }}
            >
              待确认 {pendingConfirmCount}
            </span>
          )}
        </div>
      </div>

      {priorityItems.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
            优先处理队列
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {priorityItems.map((item) => {
              const style = urgencyStyles[item.urgency];
              return (
                <a
                  key={item.priority}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "#1e293b",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: style.numberBg,
                      color: style.numberColor,
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.priority}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.pondName}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.action}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", flexShrink: 0, textAlign: "right" }}>
                    {item.person}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {priorityItems.length === 0 && (
        <div
          style={{
            marginBottom: 28,
            padding: 24,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            textAlign: "center",
            color: "#16a34a",
            fontSize: 14,
          }}
        >
          当前无待处理事项
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
          塘口状态概览
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          {pondGrid.map((p) => {
            const colors: Record<string, { bg: string; border: string; dot: string; text: string }> = {
              danger: { bg: "#fef2f2", border: "#fecaca", dot: "#dc2626", text: "#991b1b" },
              warning: { bg: "#fffbeb", border: "#fde68a", dot: "#d97706", text: "#92400e" },
              normal: { bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a", text: "#166534" },
            };
            const c = colors[p.level];
            return (
              <div
                key={p.id}
                style={{
                  padding: "12px 14px",
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.dot,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{p.name}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{p.species}</div>
                <div style={{ fontSize: 12, color: c.text }}>
                  {p.warningCount > 0 ? `${p.warningCount} 条活跃预警` : "状态正常"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
          最近状态变更
        </h2>
        {recentLogs.length === 0 && (
          <div
            style={{
              padding: 20,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            暂无状态变更记录
          </div>
        )}
        {recentLogs.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {recentLogs.map((log, i) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderBottom: i < recentLogs.length - 1 ? "1px solid #f1f5f9" : "none",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {entityTypeLabels[log.entityType] || log.entityType}
                </span>
                <span style={{ color: "#64748b" }}>
                  {allStatusLabels[log.fromStatus] || log.fromStatus} → {allStatusLabels[log.toStatus] || log.toStatus}
                </span>
                <span style={{ color: "#94a3b8" }}>|</span>
                <span style={{ color: "#475569" }}>{log.operator?.name || "未知"}</span>
                <span style={{ color: "#94a3b8" }}>|</span>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{formatTime(log.createdAt)}</span>
                {log.remarks && (
                  <>
                    <span style={{ color: "#94a3b8" }}>|</span>
                    <span style={{ color: "#64748b", flex: 1 }}>{log.remarks}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: 20,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600, color: "#1e293b" }}>
          快捷操作
        </h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/inspections"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 20px",
              background: "#1e293b",
              color: "#f8fafc",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            新建巡检
          </a>
          <button
            onClick={handleReset}
            style={{
              padding: "8px 20px",
              background: "#f8fafc",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            数据重置
          </button>
        </div>
      </div>
    </div>
  );
}
