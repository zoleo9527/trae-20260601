import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { login as apiLogin, fetchStaff } from '../api'
import type { Staff } from '../types'

export default function LoginPage() {
  const { login } = useAuth()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchStaff()
      .then(list => {
        setStaffList(list)
        setLoaded(true)
      })
      .catch(() => setError('无法连接服务端'))
  }, [])

  const handleLogin = async () => {
    setError('')
    try {
      const staff = await apiLogin(selectedId, password)
      login(staff)
    } catch {
      setError('工号或密码错误')
    }
  }

  if (!loaded) {
    return <div style={styles.center}>加载中…</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>客房部 · 遗留物登记与客人认领</h2>
        <p style={styles.subtitle}>请选择身份登录</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>
          选择员工
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={styles.select}
          >
            <option value="">— 请选择 —</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.role === 'supervisor' ? '客房主管' : s.role === 'cleaner' ? '保洁员' : '工程师'}）
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          密码
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
          />
        </label>

        <button
          onClick={handleLogin}
          disabled={!selectedId}
          style={selectedId ? styles.loginBtn : styles.loginBtnDisabled}
        >
          登录
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 24,
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 12,
    padding: '32px 40px',
    boxShadow: 'var(--shadow)',
    width: 380,
    maxWidth: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    marginBottom: 24,
  },
  label: {
    display: 'block',
    marginBottom: 16,
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  input: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    fontSize: 14,
  },
  select: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    fontSize: 14,
    background: '#fff',
  },
  loginBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    marginTop: 8,
  },
  loginBtnDisabled: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-border)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    marginTop: 8,
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    color: 'var(--color-danger)',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  },
}
