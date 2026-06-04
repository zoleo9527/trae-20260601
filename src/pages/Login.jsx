import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../api.js'

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 40,
    width: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#909399',
    marginBottom: 32,
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: (selected) => ({
    padding: '16px 8px',
    border: selected ? '2px solid #409eff' : '2px solid #e4e7ed',
    borderRadius: 8,
    textAlign: 'center',
    cursor: 'pointer',
    background: selected ? '#ecf5ff' : '#fff',
    transition: 'all 0.2s',
  }),
  roleIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  roleLabel: (selected) => ({
    fontSize: 14,
    fontWeight: selected ? 600 : 400,
    color: selected ? '#409eff' : '#606266',
  }),
  roleDesc: {
    fontSize: 11,
    color: '#909399',
    marginTop: 4,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #dcdfe6',
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 16,
    background: '#fff',
  },
  passwordRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #dcdfe6',
    borderRadius: 6,
    fontSize: 14,
  },
  loginBtn: (disabled) => ({
    width: '100%',
    padding: '12px',
    background: disabled ? '#a0cfff' : '#409eff',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  error: {
    color: '#f56c6c',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#909399',
    marginTop: 16,
  },
}

const ROLES = [
  { role: 'pharmacist', icon: '📋', label: '审方药师', desc: '审核处方' },
  { role: 'worker', icon: '🔥', label: '煎药员', desc: '处理批次' },
  { role: 'delivery', icon: '📦', label: '配送客服', desc: '贴标配送' },
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('pharmacist')
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.role === 'pharmacist') navigate('/pharmacist')
      else if (user.role === 'worker') navigate('/worker')
      else if (user.role === 'delivery') navigate('/delivery')
    }
  }, [user])

  useEffect(() => {
    api.auth.users().then(data => {
      setUsers(data.users)
      const first = data.users.find(u => u.role === selectedRole)
      if (first) setSelectedUserId(String(first.id))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const first = users.find(u => u.role === selectedRole)
    if (first) setSelectedUserId(String(first.id))
  }, [selectedRole, users])

  const handleLogin = async () => {
    if (!selectedUserId) {
      setError('请选择用户')
      return
    }
    const u = users.find(u => String(u.id) === selectedUserId)
    if (!u) return
    setError('')
    setLoading(true)
    try {
      await login(u.name, password)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => u.role === selectedRole)

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>中药煎药房</div>
        <div style={styles.subtitle}>煎药批次与包装贴标管理系统</div>

        <div style={styles.roleGrid}>
          {ROLES.map(r => (
            <div
              key={r.role}
              style={styles.roleCard(selectedRole === r.role)}
              onClick={() => setSelectedRole(r.role)}
            >
              <div style={styles.roleIcon}>{r.icon}</div>
              <div style={styles.roleLabel(selectedRole === r.role)}>{r.label}</div>
              <div style={styles.roleDesc}>{r.desc}</div>
            </div>
          ))}
        </div>

        <select
          style={styles.select}
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
        >
          <option value="">选择用户</option>
          {filteredUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <div style={styles.passwordRow}>
          <input
            style={styles.input}
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={styles.loginBtn(loading || !selectedUserId)}
          onClick={handleLogin}
          disabled={loading || !selectedUserId}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div style={styles.hint}>演示账号密码均为 123456</div>
      </div>
    </div>
  )
}
