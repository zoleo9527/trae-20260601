
import { useState, useEffect } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { UserCheck, ClipboardList, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserRole, User } from '../../shared/types';
import { authApi, userApi } from '../api/client';
import { useUserStore } from '../store/userStore';

const roleConfig: Record<UserRole, { name: string; icon: React.ReactNode; color: string; desc: string }> = {
  store_manager: {
    name: '店长',
    icon: <UserCheck size={48} />,
    color: 'from-blue-500 to-blue-600',
    desc: '处理促销陈列、回复巡店整改',
  },
  supervisor: {
    name: '督导',
    icon: <ClipboardList size={48} />,
    color: 'from-orange-500 to-orange-600',
    desc: '发起巡店整改、审核整改结果',
  },
  product_specialist: {
    name: '商品专员',
    icon: <ShoppingBag size={48} />,
    color: 'from-green-500 to-green-600',
    desc: '创建促销陈列、确认执行效果',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    userApi.getDemoUsers().then(setDemoUsers).catch(console.error);
  }, []);

  const handleLogin = async (role: UserRole) => {
    const user = demoUsers.find((u) => u.role === role);
    if (!user) return;

    setLoading(true);
    try {
      const res = await authApi.login({ username: user.username, role });
      setUser(res.user, res.token);
      message.success(`欢迎，${res.user.name}！`);
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">便利店连锁管理系统</h1>
          <p className="text-blue-200 text-lg">促销陈列 · 巡店整改 · 责任清晰</p>
        </div>

        <Spin spinning={loading} tip="登录中...">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(roleConfig) as UserRole[]).map((role) => {
              const config = roleConfig[role];
              const user = demoUsers.find((u) => u.role === role);
              return (
                <Card
                  key={role}
                  hoverable
                  className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 rounded-2xl overflow-hidden"
                  onMouseEnter={() => setSelectedRole(role)}
                  onMouseLeave={() => setSelectedRole(null)}
                  onClick={() => handleLogin(role)}
                >
                  <div className={`bg-gradient-to-br ${config.color} p-8 text-white text-center`}>
                    <div className="mb-4 flex justify-center">{config.icon}</div>
                    <h3 className="text-2xl font-bold mb-2">{config.name}</h3>
                    <p className="text-white/80 text-sm">{config.desc}</p>
                  </div>
                  <div className="p-4 text-center">
                    {user ? (
                      <div>
                        <p className="text-gray-600 mb-3">演示账号</p>
                        <Button
                          type="primary"
                          size="large"
                          className={`bg-gradient-to-r ${config.color} border-0 w-full`}
                        >
                          以 {user.name} 身份登录
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-400">加载中...</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Spin>

        <div className="mt-12 text-center text-blue-300/60 text-sm">
          <p>点击角色卡片即可使用演示账号一键登录</p>
        </div>
      </div>
    </div>
  );
}
