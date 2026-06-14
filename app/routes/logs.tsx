import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "../auth/session";
import { getOperationLogs } from "../db/queries";
import Layout from "../components/Layout";
import { roleNames } from "../utils/roles";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId, role } = await requireUser(request);
  
  const users = await require("../db/connection").pool.query(
    "SELECT name FROM users WHERE id = $1",
    [userId]
  );
  const userName = users.length > 0 ? users[0].name : "";
  
  const logs = await getOperationLogs();
  
  return json({
    user: { userId, role, name: userName },
    logs,
  });
}

export default function LogsPage() {
  const { user, logs } = useLoaderData<typeof loader>();
  
  const getActionColor = (action: string) => {
    if (action.includes("训练")) return "#17a2b8";
    if (action.includes("发放")) return "#007bff";
    if (action.includes("收回")) return "#dc3545";
    return "#6c757d";
  };
  
  const formatDetails = (details: any) => {
    if (!details) return "-";
    const parts: string[] = [];
    if (details.student_name) parts.push(`学员: ${details.student_name}`);
    if (details.date) parts.push(`日期: ${details.date}`);
    if (details.duration) parts.push(`时长: ${details.duration}分钟`);
    if (details.items) {
      const items = Object.entries(details.items)
        .filter(([, value]) => value)
        .map(([key]) => {
          const map: Record<string, string> = { helmet: "头盔", jacket: "骑行服", gloves: "手套", boots: "靴子" };
          return map[key] || key;
        });
      if (items.length > 0) parts.push(`物品: ${items.join(", ")}`);
    }
    if (details.notes) parts.push(`备注: ${details.notes}`);
    return parts.join(" | ");
  };
  
  return (
    <Layout user={user}>
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>操作日志</h1>
          <div style={styles.roleInfo}>当前角色: {roleNames[user.role as keyof typeof roleNames]}</div>
        </div>
        
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>系统操作记录</h2>
          <div style={styles.logsContainer}>
            {logs.length === 0 ? (
              <div style={styles.emptyState}>
                暂无操作记录
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={styles.logCard}>
                  <div style={styles.logHeader}>
                    <span style={{ ...styles.actionBadge, color: getActionColor(log.action) }}>
                      {log.action}
                    </span>
                    <span style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div style={styles.logContent}>
                    <div style={styles.logRow}>
                      <span style={styles.label}>操作人:</span>
                      <span style={styles.value}>{log.operator_name || "未知"}</span>
                    </div>
                    <div style={styles.logRow}>
                      <span style={styles.label}>目标类型:</span>
                      <span style={styles.value}>{log.target_type || "-"}</span>
                    </div>
                    <div style={styles.logRow}>
                      <span style={styles.label}>目标ID:</span>
                      <span style={styles.value}>{log.target_id || "-"}</span>
                    </div>
                    <div style={styles.logRow}>
                      <span style={styles.label}>详情:</span>
                      <span style={styles.value}>{formatDetails(log.details)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    margin: 0,
  },
  roleInfo: {
    padding: "8px 16px",
    background: "#e7f3ff",
    color: "#1976d2",
    borderRadius: "20px",
    fontSize: "14px",
  },
  section: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    margin: "0 0 20px 0",
  },
  logsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
    background: "#f8f9fa",
    borderRadius: "8px",
  },
  logCard: {
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    overflow: "hidden",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#f8f9fa",
    borderBottom: "1px solid #e9ecef",
  },
  actionBadge: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  logTime: {
    fontSize: "12px",
    color: "#999",
  },
  logContent: {
    padding: "16px",
  },
  logRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
    fontSize: "14px",
  },
  label: {
    color: "#666",
    fontWeight: "500",
    minWidth: "80px",
  },
  value: {
    color: "#333",
  },
};
