import { User, ChefHat, ShoppingCart, GraduationCap, Users } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Role } from '../types'
import { roleConfig, cn } from '../utils'

export function Header() {
  const { currentUser, users, switchRole } = useStore()

  const roleIcons: Record<Role, React.ReactNode> = {
    admin: <ChefHat className="w-4 h-4" />,
    purchaser: <ShoppingCart className="w-4 h-4" />,
    teacher: <GraduationCap className="w-4 h-4" />
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">学校食堂管理系统</h1>
              <p className="text-xs text-gray-500">采购验收与留样登记</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">当前角色：</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', roleConfig[currentUser.role].color)}>
                  {roleConfig[currentUser.role].label}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">切换身份：</span>
              <div className="flex items-center gap-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => switchRole(user.role)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      currentUser.id === user.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {roleIcons[user.role]}
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
