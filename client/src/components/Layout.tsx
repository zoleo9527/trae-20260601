import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  sidebar: {
    width: 240,
    minWidth: 240,
    background: '#16213e',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  logo: {
    padding: '24px 20px',
    fontSize: 20,
    fontWeight: 700,
    color: '#e94560',
    borderBottom: '1px solid #0f3460',
    textAlign: 'center' as const,
  },
  nav: {
    flex: 1,
    padding: '12px 0',
  },
  navLink: {
    display: 'block',
    padding: '14px 24px',
    color: '#a0aec0',
    textDecoration: 'none',
    fontSize: 15,
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  navLinkActive: {
    display: 'block',
    padding: '14px 24px',
    color: '#e94560',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 600,
    background: 'rgba(233,69,96,0.08)',
    borderLeft: '3px solid #e94560',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #0f3460',
    fontSize: 13,
  },
  footerInfo: {
    color: '#a0aec0',
    marginBottom: 8,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #e94560',
    color: '#e94560',
    padding: '6px 16px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    width: '100%',
  },
  main: {
    flex: 1,
    marginLeft: 240,
    background: '#1a1a2e',
    color: '#e0e0e0',
    minHeight: '100vh',
  },
  content: {
    padding: 24,
  },
}

const navItems = [
  { to: '/', label: '仪表盘' },
  { to: '/patrols', label: '夜间巡场' },
  { to: '/exceptions', label: '异常处理' },
  { to: '/handovers', label: '交班管理' },
]

export default function Layout() {
  const navigate = useNavigate()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>网咖夜巡系统</div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.footer}>
          <div style={styles.footerInfo}>
            {user?.displayName || '未登录'} ({user?.role || '-'})
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>
      <div style={styles.main}>
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
