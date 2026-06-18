import { UserRole } from '../types';

interface LayoutProps {
  user: { name: string; role: UserRole };
  onLogout: () => void;
  children: React.ReactNode;
}

const roleLabels: Record<UserRole, string> = {
  social_worker: '站点社工',
  volunteer_leader: '志愿队长',
  community_officer: '社区干部',
};

const roleColors: Record<UserRole, string> = {
  social_worker: '#2196f3',
  volunteer_leader: '#4caf50',
  community_officer: '#ff9800',
};

export function Layout({ user, onLogout, children }: LayoutProps) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>社区志愿服务站</h1>
          <p style={styles.subtitle}>服务签到与时长确认系统</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={{ ...styles.roleBadge, backgroundColor: roleColors[user.role] }}>
              {roleLabels[user.role]}
            </span>
            <span style={styles.userName}>{user.name}</span>
          </div>
          <button onClick={onLogout} style={styles.logoutButton}>
            退出登录
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#fff',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0',
  },
  subtitle: {
    fontSize: '12px',
    color: '#999',
    margin: '4px 0 0 0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  },
  userName: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    padding: '24px',
  },
};
