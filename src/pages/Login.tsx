import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, Lamp, Search, Wrench, ClipboardList, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { roleCredentials } from '../data/mockData';
import type { UserRole } from '../types';
import { roleLabels } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { selectedRole, setSelectedRole, login } = useAuthStore();

  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const roles: { id: UserRole; label: string; icon: typeof Lamp; description: string; color: string }[] = [
    {
      id: 'inspector',
      label: '巡检员',
      icon: Search,
      description: '上报故障，查看进度',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'electrician',
      label: '电工',
      icon: Wrench,
      description: '接收派工，到场反馈',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'dispatcher',
      label: '调度员',
      icon: ClipboardList,
      description: '工单派发，进度跟踪',
      color: 'from-primary-600 to-primary-700',
    },
    {
      id: 'supervisor',
      label: '主管',
      icon: BarChart3,
      description: '全局视图，进度追问',
      color: 'from-neutral-600 to-neutral-700',
    },
  ];

  useEffect(() => {
    if (selectedRole) {
      const cred = roleCredentials[selectedRole];
      if (cred) {
        setEmployeeNo(cred.employeeNo);
        setPassword(cred.password);
      }
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('请先选择角色');
      return;
    }

    if (!employeeNo || !password) {
      setError('请输入工号和密码');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(employeeNo, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('工号或密码错误，请重试');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Lamp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">市政路灯所</h1>
          <p className="text-primary-200">维修派工与到场反馈系统</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="grid md:grid-cols-5 min-h-[560px]">
            <div className="md:col-span-3 p-8 md:p-10 bg-gradient-to-br from-neutral-50 to-neutral-100">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">选择角色</h2>
                <p className="text-neutral-500">请选择您的身份登录系统</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]'
                          : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-md hover:scale-[1.01]'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-3 transition-transform duration-300 ${
                          isSelected ? 'scale-110' : ''
                        }`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-neutral-800 mb-1">{role.label}</h3>
                      <p className="text-xs text-neutral-500">{role.description}</p>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className="mt-6 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showGuide ? '收起操作指引' : '查看操作指引'}
              </button>

              {showGuide && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-neutral-200 animate-fade-in">
                  <h4 className="text-sm font-semibold text-neutral-800 mb-2">系统操作指引</h4>
                  <ul className="text-sm text-neutral-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-semibold">1.</span>
                      选择您的角色后，系统会自动填充测试账号
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-semibold">2.</span>
                      点击工单列表可查看详情和全流程时间线
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-semibold">3.</span>
                      派工备注会自动延续到到场反馈页面
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-semibold">4.</span>
                      主管可查看所有工单的完整追溯记录
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="md:col-span-2 p-8 md:p-10 bg-white flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">账号登录</h2>
                <p className="text-neutral-500">
                  {selectedRole
                    ? `以${roleLabels[selectedRole]}身份登录`
                    : '请先选择左侧角色'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    工号
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={employeeNo}
                      onChange={(e) => setEmployeeNo(e.target.value)}
                      placeholder="请输入工号"
                      className="input pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="input pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-sm text-danger-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !selectedRole}
                  className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    '登录系统'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-xs text-neutral-400 text-center">
                  默认密码：123456
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-primary-300 text-sm mt-6">
          © 2026 市政路灯所 · 维修派工与到场反馈系统
        </p>
      </div>
    </div>
  );
}
