import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticate, createSession } from "../auth/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  return json({ error });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  
  const user = await authenticate(username, password);
  
  if (!user) {
    return json({ error: "用户名或密码错误" });
  }
  
  const session = await createSession(user.id, user.role);
  
  return redirect("/", {
    headers: {
      "Set-Cookie": session,
    },
  });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  
  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>摩托车驾培系统</h1>
        <p style={styles.subtitle}>场地训练与护具发放管理</p>
        
        <Form method="post" style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              name="username"
              placeholder="请输入用户名"
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              name="password"
              placeholder="请输入密码"
              style={styles.input}
              required
            />
          </div>
          
          {actionData?.error && (
            <p style={styles.error}>{actionData.error}</p>
          )}
          
          <button type="submit" style={styles.button}>
            登录
          </button>
          
          <div style={styles.hint}>
            <p>测试账号：</p>
            <p>报名员: registrar / 123456</p>
            <p>场地教练: coach / 123456</p>
            <p>安全员: safety / 123456</p>
          </div>
        </Form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
  },
  loginBox: {
    background: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "30px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
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
    transition: "border-color 0.3s",
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
    transition: "opacity 0.3s",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    textAlign: "center",
  },
  hint: {
    marginTop: "20px",
    padding: "15px",
    background: "#f8f9fa",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#666",
    lineHeight: "1.8",
  },
};
