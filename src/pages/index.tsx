import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { setCurrentUser, getCurrentUser, type ApiUser } from '@/utils/api';
import { STATUS_COLORS, STATUS_LABELS, URGENCY_LABELS } from '@/types/stateMachine';

const USERS: ApiUser[] = [
  { role: 'RECEPTIONIST', userId: 'rec-001', userName: '李前台' },
  { role: 'RECEPTIONIST', userId: 'rec-002', userName: '赵前台' },
  { role: 'PROCESSOR', userId: 'proc-001', userName: '陈师傅' },
  { role: 'PROCESSOR', userId: 'proc-002', userName: '王师傅' },
  { role: 'MANAGER', userId: 'mgr-001', userName: '刘店长' },
];

const ROLE_LABELS: Record<string, string> = {
  RECEPTIONIST: '前台',
  PROCESSOR: '处理人员',
  MANAGER: '店长',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  RECEPTIONIST: '负责创建回收单、发起客户确认、跟进客户异议',
  PROCESSOR: '负责设备检测、估价处理、响应客户异议重新估价',
  MANAGER: '负责审批估价、查看审计日志、处理纠纷',
};

const Home: NextPage = () => {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.push(`/${user.role.toLowerCase()}`);
    }
  }, [router]);

  const handleLogin = (user: ApiUser) => {
    setCurrentUser(user);
    setSelectedUser(user);
    router.push(`/${user.role.toLowerCase()}`);
  };

  const groupedUsers = USERS.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, ApiUser[]>);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>♻️ 数码回收店管理系统</h1>
        <p style={styles.subtitle}>回收估价与客户确认</p>
      </div>

      <div style={styles.warningBanner}>
        <div style={styles.warningIcon}>⚠️</div>
        <div>
          <div style={styles.warningTitle}>现场压力提示</div>
          <div style={styles.warningText}>
            客户在等待、电话在响、微信在催...
            <br />
            请准确记录每一步，每一条备注都可能成为责任判定依据！
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>请选择身份进入系统</h2>
        {Object.entries(groupedUsers).map(([role, users]) => (
          <div key={role} style={styles.roleSection}>
            <div style={styles.roleHeader}>
              <span style={styles.roleName}>{ROLE_LABELS[role]}</span>
              <span style={styles.roleDesc}>{ROLE_DESCRIPTIONS[role]}</span>
            </div>
            <div style={styles.userGrid}>
              {users.map((user) => (
                <button
                  key={user.userId}
                  style={{
                    ...styles.userBtn,
                    ...(selectedUser?.userId === user.userId ? styles.userBtnActive : {}),
                  }}
                  onClick={() => handleLogin(user)}
                >
                  <div style={styles.userName}>{user.userName}</div>
                  <div style={styles.userRole}>{ROLE_LABELS[user.role]}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.quickLinks}>
        <h3 style={styles.quickLinksTitle}>快速链接</h3>
        <div style={styles.linkGrid}>
          <a href="/receptionist" style={styles.linkCard}>
            <span style={styles.linkIcon}>👩‍💼</span>
            <span>前台工作台</span>
          </a>
          <a href="/processor" style={styles.linkCard}>
            <span style={styles.linkIcon}>🔧</span>
            <span>估价工作台</span>
          </a>
          <a href="/manager" style={styles.linkCard}>
            <span style={styles.linkIcon}>👨‍💼</span>
            <span>店长工作台</span>
          </a>
          <a href="/docs" style={styles.linkCard}>
            <span style={styles.linkIcon}>📋</span>
            <span>验收说明文档</span>
          </a>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '30px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  warningBanner: {
    display: 'flex',
    gap: '15px',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
    border: '1px solid #f59e0b',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
  },
  warningIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  warningTitle: {
    fontWeight: 'bold',
    color: '#92400e',
    fontSize: '15px',
    marginBottom: '4px',
  },
  warningText: {
    color: '#78350f',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    marginBottom: '25px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 25px 0',
  },
  roleSection: {
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  roleHeader: {
    marginBottom: '15px',
  },
  roleName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: '12px',
  },
  roleDesc: {
    fontSize: '13px',
    color: '#6b7280',
  },
  userGrid: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  userBtn: {
    padding: '15px 25px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    minWidth: '140px',
  },
  userBtnActive: {
    borderColor: '#3b82f6',
    background: '#eff6ff',
  },
  userName: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  userRole: {
    fontSize: '12px',
    color: '#6b7280',
  },
  quickLinks: {
    background: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  quickLinksTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  linkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
  },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    background: '#f9fafb',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  linkIcon: {
    fontSize: '20px',
  },
};

export default Home;
