import { useEffect } from 'react'
import { User as UserIcon, RefreshCw, Users } from 'lucide-react'
import { useUserStore } from '@/contexts/UserContext'
import { useAppStore } from '@/contexts/AppContext'
import { Card, CardHeader, CardContent } from '@/components/Card/Card'
import type { User } from '@/types'
import { clsx } from 'clsx'

export function Profile() {
  const { currentUser, users, loadUsers, switchUser } = useUserStore()
  const { resetData, loadAllData } = useAppStore()
  
  useEffect(() => {
    loadUsers()
  }, [loadUsers])
  
  const handleSwitchUser = (userId: string) => {
    switchUser(userId)
    loadAllData()
  }
  
  const handleResetData = () => {
    resetData()
    loadUsers()
  }
  
  const getRoleLabel = (role: User['role']) => {
    const labels = {
      customer_service: '客服',
      housekeeper: '家政员',
      quality_supervisor: '质检主管',
      admin: '系统管理员',
    }
    return labels[role]
  }
  
  const getRoleColor = (role: User['role']) => {
    const colors = {
      customer_service: 'blue',
      housekeeper: 'green',
      quality_supervisor: 'orange',
      admin: 'purple',
    }
    return colors[role]
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-gray-500 mt-1">管理用户信息和系统设置</p>
      </div>
      
      {currentUser && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent>
            <div className="flex items-center gap-4">
              <img 
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full bg-blue-200"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={clsx(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getRoleColor(currentUser.role) === 'blue' && 'bg-blue-200 text-blue-800',
                    getRoleColor(currentUser.role) === 'green' && 'bg-green-200 text-green-800',
                    getRoleColor(currentUser.role) === 'orange' && 'bg-orange-200 text-orange-800',
                    getRoleColor(currentUser.role) === 'purple' && 'bg-purple-200 text-purple-800',
                  )}>
                    {getRoleLabel(currentUser.role)}
                  </span>
                  {currentUser.online && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      在线
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          切换用户（模拟登录）
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
            <Card 
              key={user.id}
              highlight={currentUser?.id === user.id}
              onClick={() => handleSwitchUser(user.id)}
              className="cursor-pointer"
            >
              <CardContent>
                <div className="flex items-center gap-3">
                  <img 
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      getRoleColor(user.role) === 'blue' && 'bg-blue-100 text-blue-700',
                      getRoleColor(user.role) === 'green' && 'bg-green-100 text-green-700',
                      getRoleColor(user.role) === 'orange' && 'bg-orange-100 text-orange-700',
                      getRoleColor(user.role) === 'purple' && 'bg-purple-100 text-purple-700',
                    )}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  {currentUser?.id === user.id && (
                    <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                      当前
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-500" />
          系统设置
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">数据重置</h3>
                <p className="text-sm text-gray-500 mb-3">
                  将所有模拟数据恢复到初始状态，方便测试和演示
                </p>
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重置数据
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">模拟能力说明</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• <span className="font-medium">用户登录</span>: 使用固定的模拟用户，无需真实认证</p>
                  <p>• <span className="font-medium">实时推送</span>: 使用定时轮询模拟（每30秒），非WebSocket</p>
                  <p>• <span className="font-medium">数据持久化</span>: 使用localStorage存储，非真实数据库</p>
                  <p>• <span className="font-medium">后端API</span>: 所有API返回Mock数据，无真实后端</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">数据存储位置</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">所有数据存储在浏览器的localStorage中：</p>
                  <ul className="text-sm text-gray-500 mt-2 space-y-1">
                    <li>• orders - 订单数据</li>
                    <li>• feedbacks - 过程反馈数据</li>
                    <li>• additions - 加项记录数据</li>
                    <li>• users - 用户数据</li>
                    <li>• handles - 异常处理记录</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}