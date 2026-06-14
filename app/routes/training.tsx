import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUser } from "../auth/session";
import { getStudents, getTrainingRecords, createTrainingRecord, updateTrainingRecord, addOperationLog } from "../db/queries";
import Layout from "../components/Layout";
import { statusNames, roleNames } from "../utils/roles";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId, role } = await requireUser(request);
  
  const users = await require("../db/connection").pool.query(
    "SELECT name FROM users WHERE id = $1",
    [userId]
  );
  const userName = users.length > 0 ? users[0].name : "";
  
  const [students, trainingRecords] = await Promise.all([
    getStudents(),
    getTrainingRecords(),
  ]);
  
  return json({
    user: { userId, role, name: userName },
    students,
    trainingRecords,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { userId, role } = await requireUser(request);
  const formData = await request.formData();
  const actionType = formData.get("action") as string;
  
  if (actionType === "start_training") {
    const studentId = parseInt(formData.get("student_id") as string);
    const date = formData.get("date") as string;
    const duration = parseInt(formData.get("duration") as string);
    const content = formData.get("content") as string;
    
    const result = await createTrainingRecord(studentId, userId, date, duration, content);
    
    const student = await require("../db/connection").pool.query(
      "SELECT name FROM students WHERE id = $1",
      [studentId]
    );
    
    await addOperationLog(
      userId,
      "开始场地训练",
      "training_record",
      result.id,
      { 
        student_id: studentId, 
        student_name: student.rows[0]?.name,
        date, 
        duration, 
        content 
      }
    );
    
    return redirect("/training");
  } else if (actionType === "complete_training") {
    const recordId = parseInt(formData.get("record_id") as string);
    const notes = formData.get("notes") as string;
    
    const result = await updateTrainingRecord(recordId, "completed", notes);
    
    await addOperationLog(
      userId,
      "完成场地训练",
      "training_record",
      recordId,
      { notes }
    );
    
    return redirect("/training");
  }
  
  return json({ success: false });
}

export default function TrainingPage() {
  const { user, students, trainingRecords } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return { bg: "#fff3cd", text: "#856404" };
      case "in_progress": return { bg: "#d1ecf1", text: "#0c5460" };
      case "completed": return { bg: "#d4edda", text: "#155724" };
      case "cancelled": return { bg: "#f8d7da", text: "#721c24" };
      default: return { bg: "#f8f9fa", text: "#6c757d" };
    }
  };
  
  return (
    <Layout user={user}>
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>场地训练管理</h1>
          <div style={styles.roleInfo}>当前角色: {roleNames[user.role as keyof typeof roleNames]}</div>
        </div>
        
        <div style={styles.sections}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>开始训练</h2>
            <Form method="post" style={styles.form}>
              <input type="hidden" name="action" value="start_training" />
              
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
                  <label style={styles.label}>训练日期</label>
                  <input type="date" name="date" style={styles.input} required />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>时长(分钟)</label>
                  <input type="number" name="duration" style={styles.input} defaultValue="60" required />
                </div>
                
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>训练内容</label>
                  <textarea name="content" style={styles.textarea} placeholder="请输入训练内容" required></textarea>
                </div>
              </div>
              
              <button type="submit" style={styles.button}>
                开始训练
              </button>
            </Form>
          </div>
          
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>训练记录</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>学员</th>
                    <th>训练日期</th>
                    <th>时长</th>
                    <th>内容</th>
                    <th>教练</th>
                    <th>状态</th>
                    <th>备注</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.student_name}</td>
                      <td>{record.date}</td>
                      <td>{record.duration_minutes}分钟</td>
                      <td style={styles.contentCell}>{record.content}</td>
                      <td>{record.trainer_name || "-"}</td>
                      <td>
                        <span style={{ 
                          ...styles.statusBadge, 
                          background: getStatusColor(record.status).bg,
                          color: getStatusColor(record.status).text 
                        }}>
                          {statusNames[record.status]}
                        </span>
                      </td>
                      <td style={styles.contentCell}>{record.notes || "-"}</td>
                      <td>
                        {record.status === "in_progress" && (
                          <Form method="post" style={styles.inlineForm}>
                            <input type="hidden" name="action" value="complete_training" />
                            <input type="hidden" name="record_id" value={record.id} />
                            <input
                              type="text"
                              name="notes"
                              placeholder="训练备注"
                              style={styles.smallInput}
                            />
                            <button type="submit" style={styles.smallButton}>完成</button>
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
  input: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
  },
  select: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
  },
  textarea: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical",
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
  contentCell: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
  smallInput: {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "12px",
    width: "100px",
  },
  smallButton: {
    padding: "6px 16px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
};
