import { useStore } from '@/store'
import { User, Shield, Database, Bell, Palette } from 'lucide-react'

export default function SettingsPage() {
  const { currentUser } = useStore()

  const menuItems = [
    { icon: User, label: '个人设置', description: '修改个人信息、密码等' },
    { icon: Shield, label: '权限管理', description: '配置角色权限、用户管理' },
    { icon: Database, label: '数据配置', description: '影厅、商品、场次基础数据' },
    { icon: Bell, label: '通知设置', description: '消息提醒、告警配置' },
    { icon: Palette, label: '界面设置', description: '主题、布局等个性化设置' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-500 mt-1">管理系统配置与个人偏好</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{currentUser.name}</h2>
            <p className="text-gray-500">
              {currentUser.role === 'frontline' ? '一线员工' : currentUser.role === 'manager' ? '经理' : '管理员'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
