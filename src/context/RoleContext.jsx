import React, { createContext, useContext, useState } from 'react'

const RoleContext = createContext(null)

const ROLES = [
  { key: 'inspector',  name: '巡检工程师', userName: '王工' },
  { key: 'property',   name: '物业联系人', userName: '李经理' },
  { key: 'supervisor', name: '维保主管',   userName: '张主管' }
]

export function RoleProvider({ children }) {
  const [role, setRole] = useState('supervisor')
  const current = ROLES.find(r => r.key === role)
  return (
    <RoleContext.Provider value={{ role, setRole, current, ROLES }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
