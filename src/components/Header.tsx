import { useAuth } from '@/context/AuthContext'
import { UserRoleLabels } from '@/types/types'
import { cn, getRoleColor } from '@/utils/helpers'
import { Bell, Search, User } from 'lucide-react'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索客户、交接记录..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{user?.name}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full border", getRoleColor(user?.role || ''))}>
                {user?.role ? UserRoleLabels[user.role] : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}