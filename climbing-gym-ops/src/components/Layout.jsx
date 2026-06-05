import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { users, ROLES } from '../mock/data'

const NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/route-opening', label: '线路开放', icon: '🧗' },
  { path: '/maintenance', label: '维护记录', icon: '🔧' },
  { path: '/history', label: '历史回看', icon: '📋' },
]

export default function Layout() {
  const [currentUserId, setCurrentUserId] = useState('u1')
  const currentUser = users.find(u => u.id === currentUserId)
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <aside style={{
        width: 240,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            🧗 攀岩馆运营
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.6 }}>
            线路开放与维护记录
          </p>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                borderRight: isActive ? '3px solid #4fc3f7' : '3px solid transparent',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, opacity: 0.5 }}>当前角色</p>
          <select
            value={currentUserId}
            onChange={e => setCurrentUserId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id} style={{ color: '#333' }}>
                {u.avatar} {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{
          background: '#fff',
          padding: '16px 32px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{currentUser?.avatar}</span>
            <div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{currentUser?.name}</span>
              <span style={{
                marginLeft: 8,
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 12,
                background: currentUser?.role === ROLES.FRONT_DESK ? '#e3f2fd'
                  : currentUser?.role === ROLES.BELAYER ? '#e8f5e9'
                  : '#fff3e0',
                color: currentUser?.role === ROLES.FRONT_DESK ? '#1565c0'
                  : currentUser?.role === ROLES.BELAYER ? '#2e7d32'
                  : '#e65100',
              }}>
                {currentUser?.role}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#999' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <Outlet context={{ currentUserId, setCurrentUserId }} />
        </div>
      </main>
    </div>
  )
}
