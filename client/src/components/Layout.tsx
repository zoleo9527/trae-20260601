import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { ROLE_LABELS, type Role } from '../types'

export default function Layout({ children }: { children: ReactNode }) {
  const { staff, role, switchRole, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>
            客房部 · 遗留物管理
          </h1>
          <div style={styles.roleSwitcher}>
            {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, label]) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                style={role === r ? styles.roleBtnActive : styles.roleBtn}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.staffInfo}>
            {staff!.name}（{ROLE_LABELS[staff!.role]}）
          </span>
          <button onClick={logout} style={styles.logoutBtn}>退出</button>
        </div>
      </header>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    padding: '0 24px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  logo: {
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  roleSwitcher: {
    display: 'flex',
    gap: 4,
    background: 'var(--color-bg)',
    borderRadius: 'var(--radius)',
    padding: 3,
  },
  roleBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    transition: 'all 0.15s',
  },
  roleBtnActive: {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  staffInfo: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  logoutBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  main: {
    flex: 1,
    padding: 24,
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
  },
}
