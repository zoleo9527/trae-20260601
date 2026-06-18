import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const roleDescriptions: Record<UserRole, string> = {
  social_worker: '站点社工',
  volunteer_leader: '志愿队长',
  community_officer: '社区干部',
};

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  const presetUsers: { username: string; password: string; role: UserRole }[] = [
    { username: 'admin', password: '123456', role: 'social_worker' },
    { username: 'leader', password: '123456', role: 'volunteer_leader' },
    { username: 'officer', password: '123456', role: 'community_officer' },
  ];

  const handleQuickSelect = (user: typeof presetUsers[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setSelectedRole(user.role);
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>社区志愿服务站</h1>
        <p style={styles.subtitle}>服务签到与时长确认系统</p>
        
        <div style={styles.roleSection}>
          <p style={styles.roleTitle}>选择入口</p>
          <div style={styles.roleButtons}>
            {Object.entries(roleDescriptions).map(([role, label]) => (
              <button
                key={role}
                style={{
                  ...styles.roleButton,
                  ...(selectedRole === role ? styles.roleButtonActive : {}),
                }}
                onClick={() => setSelectedRole(role as UserRole)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.presetSection}>
          <p style={styles.presetTitle}>快捷登录</p>
          <div style={styles.presetButtons}>
            {presetUsers.map((user) => (
              <button
                key={user.username}
                style={styles.presetButton}
                onClick={() => handleQuickSelect(user)}
              >
                {roleDescriptions[user.role]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="请输入用户名"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="请输入密码"
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  loginBox: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    margin: '0 0 30px 0',
  },
  roleSection: {
    marginBottom: '24px',
  },
  roleTitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px 0',
    fontWeight: '500',
  },
  roleButtons: {
    display: 'flex',
    gap: '10px',
  },
  roleButton: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  roleButtonActive: {
    borderColor: '#667eea',
    background: '#f0f4ff',
    color: '#667eea',
  },
  presetSection: {
    marginBottom: '24px',
  },
  presetTitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px 0',
    fontWeight: '500',
  },
  presetButtons: {
    display: 'flex',
    gap: '10px',
  },
  presetButton: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    background: '#fafafa',
    color: '#666',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#e74c3c',
    fontSize: '13px',
    margin: '-8px 0 0 0',
  },
  submitButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
  },
};
