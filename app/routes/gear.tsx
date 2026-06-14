import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireUser } from "../auth/session";
import { getStudents, getTrainingRecords, getGearIssues, createGearIssue, returnGear, addOperationLog, getTrainingRecordById } from "../db/queries";
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
  
  const [students, trainingRecords, gearIssues] = await Promise.all([
    getStudents(),
    getTrainingRecords(),
    getGearIssues(),
  ]);
  
  const availableTrainingRecords = trainingRecords.filter(r => 
    r.status === "in_progress" || r.status === "completed"
  );
  
  return json({
    user: { userId, role, name: userName },
    students,
    trainingRecords: availableTrainingRecords,
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
    
    const trainingRecord = await getTrainingRecordById(trainingRecordId);
    
    if (!trainingRecord || trainingRecord.student_id !== studentId) {
      return json({ error: "训练记录与学员不匹配" });
    }
    
    const result = await createGearIssue(studentId, userId, trainingRecordId, helmet, jacket, gloves, boots);
    
    const studentResult = await require("../db/connection").pool.query(
      "SELECT name FROM students WHERE id = $1",
      [studentId]
    );
    const studentRows = studentResult.rows;
    
    await addOperationLog(
      userId,
      "发放护具",
      "gear_issue",
      result.id,
      { 
        student_id: studentId, 
        student_name: studentRows[0]?.name,
        training_record_id: trainingRecordId,
        trainer_name: trainingRecord.trainer_name,
        training_content: trainingRecord.content,
        training_notes: trainingRecord.notes,
        items: { helmet, jacket, gloves, boots },
        handover_info: `训练教练: ${trainingRecord.trainer_name || '未知'}, 训练内容: ${trainingRecord.content}, 训练备注: ${trainingRecord.notes || '无'}`
      }
    );
    
    return redirect("/gear");
  } else if (actionType === "return_gear") {
    const gearId = parseInt(formData.get("gear_id") as string);
    
    const gearResult = await require("../db/connection").pool.query(
      "SELECT student_id, training_record_id FROM gear_issues WHERE id = $1",
      [gearId]
    );
    const gearRows = gearResult.rows;
    const gearIssue = gearRows[0];
    
    const trainingRecord = gearIssue.training_record_id ? await getTrainingRecordById(gearIssue.training_record_id) : null;
    
    const result = await returnGear(gearId);
    
    await addOperationLog(
      userId,
      "收回护具",
      "gear_issue",
      gearId,
      { 
        student_id: gearIssue.student_id,
        training_record_id: gearIssue.training_record_id,
        trainer_name: trainingRecord?.trainer_name,
        training_notes: trainingRecord?.notes,
        handover_info: `护具已收回，训练教练: ${trainingRecord?.trainer_name || '未知'}, 训练备注: ${trainingRecord?.notes || '无'}`
      }
    );
    
    return redirect("/gear");
  }
  
  return json({ success: false });
}

export default function GearPage() {
  const { user, students, trainingRecords, gearIssues } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  useEffect(() => {
    setSelectedStudentId(null);
  }, [students]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return { bg: "#fff3cd", text: "#856404" };
      case "issued": return { bg: "#e7f3ff", text: "#1976d2" };
      case "returned": return { bg: "#d4edda", text: "#155724" };
      default: return { bg: "#f8f9fa", text: "#6c757d" };
    }
  };
  
  const getTrainingOptionsForStudent = (studentId: number) => {
    return trainingRecords.filter(r => r.student_id === studentId);
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
                  <select 
                    name="student_id" 
                    style={styles.select} 
                    required
                    onChange={(e) => setSelectedStudentId(parseInt(e.target.value) || null)}
                  >
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
                    {selectedStudentId && getTrainingOptionsForStudent(selectedStudentId).map(record => (
                      <option key={record.id} value={record.id}>
                        {record.date} - {record.trainer_name || "未分配教练"} 
                        ({record.status === "completed" ? "已完成" : "进行中"})
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
              
              {actionData?.error && (
                <p style={styles.error}>{actionData.error}</p>
              )}
              
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
                    <th>教练</th>
                    <th>训练内容</th>
                    <th>训练备注</th>
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
                      <td>{issue.trainer_name || "-"}</td>
                      <td style={styles.contentCell}>{issue.training_content || "-"}</td>
                      <td style={styles.contentCell}>{issue.training_notes || "-"}</td>
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
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    textAlign: "center",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  contentCell: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
