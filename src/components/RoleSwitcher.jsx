import React from 'react'
import { useRole } from '../context/RoleContext.jsx'

export default function RoleSwitcher() {
  const { role, setRole, ROLES } = useRole()
  return (
    <div className="role-switcher">
      <span className="rs-label">当前身份：</span>
      <div className="rs-group">
        {ROLES.map(r => (
          <button
            key={r.key}
            className={role === r.key ? 'rs-btn active' : 'rs-btn'}
            onClick={() => setRole(r.key)}
          >
            {r.name}
            <span className="rs-sub">（{r.userName}）</span>
          </button>
        ))}
      </div>
    </div>
  )
}
