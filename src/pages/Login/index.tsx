import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, message } from 'antd';
import { User, Briefcase, Building2 } from 'lucide-react';
import { useStore } from '../../contexts/AppContext';
import { mockUsers } from '../../data/mockUsers';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();

  const roles = [
    {
      role: 'operator',
      label: '运营',
      icon: User,
      color: 'blue',
      description: '全局数据查看、返费结算审核、异常申诉仲裁',
      path: '/operator',
    },
    {
      role: 'recruiter',
      label: '招聘顾问',
      icon: Briefcase,
      color: 'green',
      description: '岗位发布管理、面试名单维护、返费结算发起',
      path: '/recruiter',
    },
    {
      role: 'hr',
      label: '企业HR',
      icon: Building2,
      color: 'orange',
      description: '岗位需求发布、面试确认、返费结算确认',
      path: '/hr',
    },
  ];

  const handleLogin = (role: string) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      setUser(user);
      message.success(`登录成功！欢迎 ${user.name}`);
      const roleConfig = roles.find((r) => r.role === role);
      if (roleConfig) {
        navigate(roleConfig.path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">蓝领招聘平台</h1>
          <p className="text-lg text-gray-600">返费结算与异常申诉工作台</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {roles.map((roleConfig) => (
            <Card
              key={roleConfig.role}
              className={`hover:shadow-xl transition-all cursor-pointer border-2 ${
                roleConfig.color === 'blue'
                  ? 'border-blue-200 hover:border-blue-500'
                  : roleConfig.color === 'green'
                  ? 'border-green-200 hover:border-green-500'
                  : 'border-orange-200 hover:border-orange-500'
              }`}
            >
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    roleConfig.color === 'blue'
                      ? 'bg-blue-100 text-blue-600'
                      : roleConfig.color === 'green'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  <roleConfig.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {roleConfig.label}
                </h3>
                <p className="text-sm text-gray-600 mb-6">{roleConfig.description}</p>

                <div className="space-y-3">
                  <Input placeholder="账号" className="text-center" />
                  <Input.Password placeholder="密码" className="text-center" />
                  <Button
                    type="primary"
                    block
                    onClick={() => handleLogin(roleConfig.role)}
                    className={
                      roleConfig.color === 'blue'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : roleConfig.color === 'green'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }
                  >
                    登录
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>演示系统：点击登录按钮即可进入对应工作台</p>
        </div>
      </div>
    </div>
  );
};

export default Login;