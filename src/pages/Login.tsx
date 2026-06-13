import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, UserRole } from '../store/authStore'
import { Shield, Briefcase, Users } from 'lucide-react'

const roleConfig: { role: UserRole; label: string; description: string; icon: typeof Shield }[] = [
  { role: 'operator', label: '运营', description: '审核岗位信息、处理异常', icon: Shield },
  { role: 'consultant', label: '招聘顾问', description: '跟进岗位发布、管理面试', icon: Briefcase },
  { role: 'hr', label: '企业HR', description: '发布岗位、确认入职回执', icon: Users },
]

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('hr')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const success = await login(username, password, selectedRole)
    if (success) {
      navigate('/dashboard')
    } else {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">蓝领招聘平台</h1>
            <p className="text-gray-500 mt-2">岗位审核与发布管理系统</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {roleConfig.map(({ role, label, description, icon: Icon }) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === role
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${selectedRole === role ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${selectedRole === role ? 'text-blue-700' : 'text-gray-600'}`}>
                  {label}
                </div>
                <div className="text-xs text-gray-400 mt-1">{description}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder={`请输入${roleConfig.find(r => r.role === selectedRole)?.label}用户名`}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="请输入密码"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              登录
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              测试账号：用户名 <span className="font-mono bg-white px-2 py-1 rounded">operator/consultant/hr</span>，密码 <span className="font-mono bg-white px-2 py-1 rounded">123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}