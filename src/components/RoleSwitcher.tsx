import { useStore, Role } from '@/store'
import { User, Users, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const roleLabels: Record<Role, string> = {
  frontline: '一线员工',
  manager: '经理',
  admin: '管理员',
}

const roleDescriptions: Record<Role, string> = {
  frontline: '处理日常运营、库存盘点、现场问题',
  manager: '审核对账、处理升级问题、查看报表',
  admin: '系统配置、全量数据、权限管理',
}

export function RoleSwitcher() {
  const { currentUser, switchRole } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  const roles: Role[] = ['frontline', 'manager', 'admin']

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-primary-600" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
          <p className="text-xs text-gray-500">{roleLabels[currentUser.role]}</p>
        </div>
        <ChevronDown className={clsx('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium">切换角色视图</p>
              <p className="text-xs text-gray-400 mt-0.5">不同角色看到的操作和数据范围不同</p>
            </div>
            <div className="p-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg transition-colors',
                    currentUser.role === role
                      ? 'bg-primary-50 border border-primary-200'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">{roleLabels[role]}</span>
                    {currentUser.role === role && (
                      <span className="ml-auto text-xs px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">{roleDescriptions[role]}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
