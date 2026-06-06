import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_OPTIONS = [
  { username: 'assistant', name: '李助理', role: 'assistant' },
  { username: 'controller', name: '王场控', role: 'controller' },
  { username: 'lead', name: '张组长', role: 'lead' }
]

const ROLE_LABELS = {
  assistant: '主播助理',
  controller: '场控',
  lead: '售后组长'
}

export default function Header() {
  const { user, logout, switchRole } = useAuth()
  const navigate = useNavigate()

  const handleSwitchRole = (opt) => {
    const idx = ROLE_OPTIONS.findIndex(r => r.role === opt.role)
    switchRole({ ...opt, id: 'u' + (idx + 1) })
  }

  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 onClick={() => navigate('/')}>直播电商售后系统</h1>
        {user && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{ROLE_LABELS[user.role] || user.role}工作台</span>}
      </div>
      <div className="header-right">
        <div className="role-selector">
          {ROLE_OPTIONS.map((opt) => (
            <button key={opt.role} className={`role-btn ${user?.role === opt.role ? 'active' : ''}`} onClick={() => handleSwitchRole(opt)}>
              {opt.name}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '14px' }}>当前: {user?.name || '-'}</span>
        <button className="btn btn-default" style={{ padding: '4px 12px', fontSize: '13px' }} onClick={logout}>退出</button>
      </div>
    </div>
  )
}
