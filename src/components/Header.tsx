
import { User, Building2, Crown, ShieldCheck } from 'lucide-react'
import { useTicketStore } from '../store/ticketStore'
import { mockUsers } from '../data/mockData'
import { UserRole } from '../types'

const roleIcons: Record<UserRole, typeof User> = {
  clerk: User,
  manager: Building2,
  admin: Crown,
}

const roleLabels: Record<UserRole, string> = {
  clerk: '店员',
  manager: '店长',
  admin: '片区管理员',
}

const roleColors: Record<UserRole, string> = {
  clerk: 'bg-blue-100 text-blue-700',
  manager: 'bg-green-100 text-green-700',
  admin: 'bg-amber-100 text-amber-700',
}

export function Header() {
  const { currentUser, setCurrentUser } = useTicketStore()
  const RoleIcon = roleIcons[currentUser.role]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">终端故障与维修跟踪</h1>
            <p className="text-sm text-gray-500">彩票门店业务工作台</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = mockUsers.find((u) => u.id === e.target.value)
                if (user) setCurrentUser(user)
              }}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              {mockUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {roleLabels[user.role]}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${roleColors[currentUser.role]} flex items-center justify-center`}>
              <RoleIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
              <p className={`text-xs ${roleColors[currentUser.role].split(' ')[1]}`}>
                {roleLabels[currentUser.role]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
