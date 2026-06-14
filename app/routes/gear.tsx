import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUser } from "../auth/session";
import { getStudents, getTrainingRecords, getGearIssues, createGearIssue, returnGear, addOperationLog } from "../db/queries";
import Layout from "../components/Layout";
import { statusNames, roleNames } from "../utils/roles";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId, role } = await requireUser(request);
  
  const users = await require("../db/connection").pool.query(
    "SELECT name FROM users WHERE id = $1",
    [userId]
  );
  const userName = users.length > 0 ? users[0].name : "";
  
  const [students, trainingRecords, gearIssues] = await Promise.all([
    getStudents(),
    getTrainingRecords(),
    getGearIssues(),
  ]);
  
  const activeTrainingRecords = trainingRecords.filter(r => r.status === "in_progress");
  
  return json({
    user: { userId, role, name: userName },
    students,
    trainingRecords: activeTrainingRecords,
    gearIssues,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { userId, role } = await requireUser(request);
  const formData = await request.formData();
  const actionType = formData.get("action") as string;
  
  if (actionType === "issue_gear") {
    const studentId = parseInt(formData.get("student_id") as string);
    const trainingRecordId = parseInt(formData.get("training_record_id") as string);
    const helmet = formData.get("helmet") === "on";
    const jacket = formData.get("jacket") === "on";
    const gloves = formData.get("gloves") === "on";
    const boots = formData.get("boots") === "on";
    
    const result = await createGearIssue(studentId, userId, trainingRecordId, helmet, jacket, gloves, boots);
    
    const student = await require("../db/connection").pool.query(
      "SELECT name FROM students WHERE id = $1",
      [studentId]
    );
    
    await addOperationLog(
      userId,
      "发放护具",
      "gear_issue",
      result[0].id,
      { 
        student_id: studentId, 
        student_name: student[0]?.name,
        training_record_id: trainingRecordId,
        items: { helmet, jacket, gloves, boots }
      }
    );
    
    return json({ success: true });
  } else if (actionType === "return_gear") {
    const gearId = parseInt(formData.get("gear_id") as string);
    
    const result = await returnGear(gearId);
    
    await addOperationLog(
      userId,
      "收回护具",
      "gear_issue",
      gearId,
      {}
    );
    
    return json({ success: true });
  }
  
  return json({ success: false });
}

export default function GearPage() {
  const { user, students, trainingRecords, gearIssues } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return { bg: "#fff3cd", text: "#856404" };
      case "issued": return { bg: "#e7f3ff", text: "#1976d2" };
      case "returned": return { bg: "#d4edda", text: "#155724" };
      default: return { bg: "#f8f9fa", text: "#6c757d" };
    }
  };
  
  const getTrainingForStudent = (studentId: number) => {
    return trainingRecords.find(r => r.student_id === studentId);
  };
  
  return (
    <Layout user={user}>
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>护具发放管理</h1>
          <div style={styles.roleInfo}>当前角色: {roleNames[user.role as keyof typeof roleNames]}</div>
        </div>
        
        <div style={styles.sections}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>发放护具</h2>
            <Form method="post" style={styles.form}>
              <input type="hidden" name="action" value="issue_gear" />
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>学员</label>
                  <select name="student_id" style={styles.select} required>
                    <option value="">请选择学员</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>关联训练</label>
                  <select name="training_record_id" style={styles.select} required>
                    <option value="">请选择训练记录</option>
                    {trainingRecords.map(record => (
                      <option key={record.id} value={record.id}>
                        {record.student_name} - {record.date}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>发放物品</label>
                  <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" name="helmet" style={styles.checkbox} />
                      <span>头盔</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" name="jacket" style={styles.checkbox} />
                      <span>骑行服</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" name="gloves" style={styles.checkbox} />
                      <span>手套</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input type="checkbox" name="boots" style={styles.checkbox} />
                      <span>靴子</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <button type="submit" style={styles.button}>
                确认发放
              </button>
            </Form>
          </div>
          
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>护具发放记录</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>学员</th>
                    <th>关联训练</th>
                    <th>发放物品</th>
                    <th>发放人</th>
                    <th>发放时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {gearIssues.map(issue => (
                    <tr key={issue.id}>
                      <td>{issue.student_name}</td>
                      <td>{issue.training_date || "-"}</td>
                      <td>
                        <div style={styles.itemsList}>
                          {issue.helmet && <span style={styles.itemTag}>头盔</span>}
                          {issue.jacket && <span style={styles.itemTag}>骑行服</span>}
                          {issue.gloves && <span style={styles.itemTag}>手套</span>}
                          {issue.boots && <span style={styles.itemTag}>靴子</span>}
                        </div>
                      </td>
                      <td>{issue.issuer_name || "-"}</td>
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
                      <td>
                        {issue.status === "issued" && (
                          <Form method="post" style={styles.inlineForm}>
                            <input type="hidden" name="action" value="return_gear" />
                            <input type="hidden" name="gear_id" value={issue.id} />
                            <button type="submit" style={styles.returnButton}>收回</button>
                          </Form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  page: {
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
  sections: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "24px",
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  select: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#333",
  },
  checkbox: {
    width: "18px",
    height: "18px",
  },
  button: {
    padding: "12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  itemsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  itemTag: {
    padding: "2px 8px",
    background: "#e7f3ff",
    color: "#1976d2",
    borderRadius: "4px",
    fontSize: "12px",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  inlineForm: {
    display: "flex",
    gap: "8px",
  },
  returnButton: {
    padding: "6px 16px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
};
