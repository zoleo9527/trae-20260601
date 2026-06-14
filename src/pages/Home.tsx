import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ClipboardCheck, ShieldCheck, BarChart3 } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { Role } from '../types';
import { ROLE_CONFIG } from '../utils/constants';

const roleIcons: Record<Role, React.ReactNode> = {
  dispatcher: <UserPlus className="w-12 h-12" />,
  inspector: <ClipboardCheck className="w-12 h-12" />,
  auditor: <ShieldCheck className="w-12 h-12" />,
  admin: <BarChart3 className="w-12 h-12" />,
};

export function Home() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const handleRoleSelect = (role: Role) => {
    setRole(role);
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            车辆年检站管理系统
          </h1>
          <p className="text-xl text-gray-600">
            报告发放与车主回访工作平台
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
            const config = ROLE_CONFIG[role];
            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-dispatcher transform hover:-translate-y-2"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-${config.color} text-white group-hover:scale-110 transition-transform`}>
                    {roleIcons[role]}
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {config.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            系统功能亮点
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">角色分岗</h4>
                <p className="text-sm text-gray-500">接车员、检测员、审核员、管理员独立入口</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">流程闭环</h4>
                <p className="text-sm text-gray-500">报告发放自动触发回访任务</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">数据联动</h4>
                <p className="text-sm text-gray-500">车辆、检测、报告、回访全流程追溯</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
