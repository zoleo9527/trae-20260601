import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "../auth/session";
import { getStudents, getTrainingRecords, getGearIssues, getOperationLogs } from "../db/queries";
import Layout from "../components/Layout";
import { statusNames, roleNames } from "../utils/roles";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId, role } = await requireUser(request);
  
  const userResult = await require("../db/connection").pool.query(
    "SELECT name FROM users WHERE id = $1",
    [userId]
  );
  const users = userResult.rows;
  const userName = users.length > 0 ? users[0].name : "";
  
  const [students, trainingRecords, gearIssues, logs] = await Promise.all([
    getStudents(),
    getTrainingRecords(),
    getGearIssues(),
    getOperationLogs(),
  ]);
  
  const pendingTraining = trainingRecords.filter(r => r.status === "pending").length;
  const inProgressTraining = trainingRecords.filter(r => r.status === "in_progress").length;
  const issuedGear = gearIssues.filter(g => g.status === "issued").length;
  const pendingGear = gearIssues.filter(g => g.status === "pending").length;
  
  return json({
    user: { userId, role, name: userName },
    students,
    trainingRecords: trainingRecords.slice(0, 5),
    gearIssues: gearIssues.slice(0, 5),
    logs: logs.slice(0, 10),
    stats: {
      totalStudents: students.length,
      pendingTraining,
      inProgressTraining,
      issuedGear,
      pendingGear,
    },
  });
}

export default function DashboardPage() {
  const { user, students, trainingRecords, gearIssues, logs, stats } = useLoaderData<typeof loader>();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return { bg: "#fff3cd", text: "#856404" };
      case "in_progress": return { bg: "#d1ecf1", text: "#0c5460" };
      case "completed": return { bg: "#d4edda", text: "#155724" };
      case "issued": return { bg: "#e7f3ff", text: "#1976d2" };
      case "returned": return { bg: "#d4edda", text: "#155724" };
      default: return { bg: "#f8f9fa", text: "#6c757d" };
    }
  };
  
  return (
    <Layout user={user}>
      <div style={styles.dashboard}>
        <div style={styles.header}>
          <h1 style={styles.title}>仪表盘</h1>
          <div style={styles.roleInfo}>当前角色: {roleNames[user.role as keyof typeof roleNames]}</div>
        </div>
        
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalStudents}</div>
            <div style={styles.statLabel}>学员总数</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.pendingTraining}</div>
            <div style={styles.statLabel}>待训练</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.inProgressTraining}</div>
            <div style={styles.statLabel}>训练中</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.issuedGear}</div>
            <div style={styles.statLabel}>护具发放中</div>
          </div>
        </div>
        
        <div style={styles.sections}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>待处理训练</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>学员</th>
                    <th>日期</th>
                    <th>状态</th>
                    <th>负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingRecords.filter(r => r.status !== "completed").map(record => (
                    <tr key={record.id}>
                      <td>{record.student_name}</td>
                      <td>{record.date}</td>
                      <td>
                        <span style={{ 
                          ...styles.statusBadge, 
                          background: getStatusColor(record.status).bg,
                          color: getStatusColor(record.status).text 
                        }}>
                          {statusNames[record.status]}
                        </span>
                      </td>
                      <td>{record.trainer_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>护具发放状态</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>学员</th>
                    <th>发放时间</th>
                    <th>状态</th>
                    <th>发放人</th>
                  </tr>
                </thead>
                <tbody>
                  {gearIssues.map(issue => (
                    <tr key={issue.id}>
                      <td>{issue.student_name}</td>
                      <td>{issue.issued_at ? new Date(issue.issued_at).toLocaleString() : "-"}</td>
                      <td>
                        <span style={{ 
                          ...styles.statusBadge, 
                          background: getStatusColor(issue.status).bg,
                          color: getStatusColor(issue.status).text 
                        }}>
                          {statusNames[issue.status]}
                        </span>
                      </td>
                      <td>{issue.issuer_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>最近操作日志</h2>
          <div style={styles.logsContainer}>
            {logs.length === 0 ? (
              <div style={styles.emptyState}>暂无操作记录</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={styles.logItem}>
                  <span style={styles.logTime}>{new Date(log.created_at).toLocaleString()}</span>
                  <span style={styles.logOperator}>{log.operator_name}</span>
                  <span style={styles.logAction}>{log.action}</span>
                  <span style={styles.logTarget}>{log.details?.student_name || log.target_type}</span>
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
  dashboard: {
    maxWidth: "1400px",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  statNumber: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "14px",
    color: "#666",
  },
  sections: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
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
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  logsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
    background: "#f8f9fa",
    borderRadius: "8px",
  },
  logItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    background: "#f8f9fa",
    borderRadius: "8px",
    fontSize: "14px",
  },
  logTime: {
    color: "#999",
    fontSize: "12px",
  },
  logOperator: {
    color: "#333",
    fontWeight: "500",
  },
  logAction: {
    color: "#666",
  },
  logTarget: {
    color: "#1976d2",
    marginLeft: "auto",
  },
};
