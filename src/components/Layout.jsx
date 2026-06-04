import { useAuth } from '../contexts/AuthContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'

const ROLE_LABELS = {
  pharmacist: '审方药师',
  worker: '煎药员',
  delivery: '配送客服',
}

const ROLE_NAV = {
  pharmacist: [
    { path: '/pharmacist', label: '工作台' },
  ],
  worker: [
    { path: '/worker', label: '工作台' },
  ],
  delivery: [
    { path: '/delivery', label: '工作台' },
  ],
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: 1,
  },
  nav: {
    display: 'flex',
    gap: 4,
  },
  navItem: (active) => ({
    padding: '6px 16px',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
    color: '#fff',
    border: 'none',
    fontWeight: active ? 600 : 400,
  }),
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  roleTag: {
    background: '#e94560',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  userName: {
    fontSize: 14,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  },
  main: {
    padding: 20,
    maxWidth: 1400,
    margin: '0 auto',
  },
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const navItems = ROLE_NAV[user.role] || []

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>中药煎药房</span>
          <nav style={styles.nav}>
            {navItems.map(item => (
              <button
                key={item.path}
                style={styles.navItem(location.pathname === item.path)}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.roleTag}>{ROLE_LABELS[user.role]}</span>
          <span style={styles.userName}>{user.name}</span>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/login') }}>
            退出
          </button>
        </div>
      </header>
      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}
