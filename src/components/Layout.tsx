import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  getCurrentUser,
  clearCurrentUser,
  type ApiUser,
} from '@/utils/api';
import { useEffect, useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  RECEPTIONIST: '前台',
  PROCESSOR: '处理人员',
  MANAGER: '店长',
};

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
}

export default function Layout({ children, activeTab }: LayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    clearCurrentUser();
    router.push('/');
  };

  if (!user) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  const rolePath = user.role.toLowerCase();

  const tabs = [
    { key: 'list', label: '订单列表', href: `/${rolePath}` },
    { key: 'create', label: '新建回收单', href: `/${rolePath}/create` },
  ];

  if (user.role === 'MANAGER') {
    tabs.push({ key: 'audit', label: '审计日志', href: `/${rolePath}/audit` });
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>♻️ 数码回收店</h1>
          <span style={styles.roleBadge}>
            {ROLE_LABELS[user.role]}工作台
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            👤 {user.userName}
          </span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            退出
          </button>
        </div>
      </header>

      {activeTab && (
        <nav style={styles.nav}>
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              style={{
                ...styles.navLink,
                ...(activeTab === tab.key ? styles.navLinkActive : {}),
              }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: 0,
  },
  roleBadge: {
    padding: '4px 12px',
    background: '#eff6ff',
    color: '#2563eb',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    fontSize: '14px',
    color: '#374151',
  },
  logoutBtn: {
    padding: '6px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#6b7280',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    padding: '0 24px',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
  },
  navLink: {
    padding: '14px 20px',
    textDecoration: 'none',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
  },
  navLinkActive: {
    color: '#2563eb',
    borderBottomColor: '#2563eb',
  },
  main: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
};
