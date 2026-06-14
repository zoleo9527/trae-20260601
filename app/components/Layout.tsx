import { Form, Link, useLoaderData } from "@remix-run/react";
import { roleNames } from "../utils/roles";

export async function loader({ request }: { request: Request }) {
  const session = await import("../auth/session").then(m => m.getSession(request));
  const userId = session.get("userId");
  const role = session.get("role");
  const username = session.get("username");
  
  return { userId, role, username };
}

export default function Layout({ children, user }: { children: React.ReactNode; user: { role: string; name?: string } }) {
  const navItems = [
    { path: "/", label: "仪表盘" },
    { path: "/training", label: "场地训练" },
    { path: "/gear", label: "护具发放" },
    { path: "/logs", label: "操作日志" },
  ];
  
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>摩托车驾培系统</h1>
          <span style={styles.roleBadge}>{roleNames[user.role as keyof typeof roleNames]}</span>
        </div>
        
        <nav style={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={styles.navLink}
              className={({ isActive }) => isActive ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            {user.name || "用户"}
          </span>
          <Form action="/logout" method="post">
            <button type="submit" style={styles.logoutButton}>退出</button>
          </Form>
        </div>
      </header>
      
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f5f7fa",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#333",
    margin: 0,
  },
  roleBadge: {
    padding: "4px 12px",
    background: "#e7f3ff",
    color: "#1976d2",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  nav: {
    display: "flex",
    gap: "8px",
  },
  navLink: {
    padding: "8px 20px",
    textDecoration: "none",
    color: "#666",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userInfo: {
    fontSize: "14px",
    color: "#666",
  },
  logoutButton: {
    padding: "8px 20px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#666",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  main: {
    flex: 1,
    padding: "24px",
  },
};
