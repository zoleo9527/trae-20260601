import { useAppStore } from '../store';
import { UserRole } from '../types';
import { Truck, Users, Headphones } from 'lucide-react';

const roles: { role: UserRole; name: string; icon: typeof Truck; color: string }[] = [
  { role: 'dispatcher', name: '调度员', icon: Truck, color: 'bg-blue-500' },
  { role: 'teamLead', name: '搬运组长', icon: Users, color: 'bg-green-500' },
  { role: 'customerService', name: '客服', icon: Headphones, color: 'bg-orange-500' },
];

export default function LoginPage() {
  const login = useAppStore((state) => state.login);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">搬家公司管理系统</h1>
          <p className="text-gray-500 mt-2">请选择您的角色登录</p>
        </div>

        <div className="space-y-4">
          {roles.map(({ role, name, icon: Icon, color }) => (
            <button
              key={role}
              onClick={() => login(role)}
              className={`w-full ${color} hover:opacity-90 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
            >
              <Icon className="w-6 h-6" />
              <span>{name}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>现场加项与费用确认系统</p>
        </div>
      </div>
    </div>
  );
}
