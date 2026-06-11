import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRole } from '../context/RoleContext.jsx'
import RoleSwitcher from './RoleSwitcher.jsx'

export default function Layout({ children }) {
  const { current } = useRole()
  const location = useLocation()
  const navs = [
    { to: '/',       label: '首页',       icon: '🏠' },
    { to: '/tasks',  label: '整改记录',   icon: '📋' }
  ]
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">🔥</span>
          <div>
            <h1>消防维保 · 整改派发与复检确认</h1>
            <p className="brand-sub">一线流程驱动 · 同记录派发/复检/驳回/补录</p>
          </div>
        </div>
        <RoleSwitcher />
      </header>

      <div className="app-body">
        <aside className="app-side">
          <div className="user-card">
            <div className="avatar">{current.userName[0]}</div>
            <div>
              <div className="user-name">{current.userName}</div>
              <div className="user-role">{current.name}</div>
            </div>
          </div>
          <nav className="side-nav">
            {navs.map(n => {
              const active = (n.to === '/' && location.pathname === '/') ||
                             (n.to !== '/' && location.pathname.startsWith(n.to))
              return (
                <Link key={n.to} to={n.to} className={active ? 'nav-item active' : 'nav-item'}>
                  <span className="nav-icon">{n.icon}</span>
                  <span>{n.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
