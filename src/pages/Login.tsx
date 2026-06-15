import { useAppStore } from '../store';
import { UserRole } from '../types';
import { Store, Palette, Package } from 'lucide-react';

const roleConfig: { role: UserRole; name: string; icon: typeof Store; color: string; bgColor: string }[] = [
  { role: 'sales', name: '导购', icon: Store, color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100' },
  { role: 'designer', name: '设计师', icon: Palette, color: 'text-purple-600', bgColor: 'bg-purple-50 hover:bg-purple-100' },
  { role: 'warehouse', name: '仓库员', icon: Package, color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
];

export default function Login() {
  const login = useAppStore((state) => state.login);

  const handleLogin = (role: UserRole) => {
    login(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-6">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">瓷砖门店管理系统</h1>
          <p className="text-slate-500">色号锁定与库存预留</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">选择您的角色</h2>
          
          <div className="space-y-4">
            {roleConfig.map(({ role, name, icon: Icon, color, bgColor }) => (
              <button
                key={role}
                onClick={() => handleLogin(role)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent transition-all duration-200 ${bgColor}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-')}${color.includes('blue') ? 'bg-blue-100' : color.includes('purple') ? 'bg-purple-100' : 'bg-green-100'}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${color}`}>{name}</div>
                  <div className="text-sm text-slate-500">
                    {role === 'sales' && '客户接待、色号锁定申请'}
                    {role === 'designer' && '量房设计、色号确认'}
                    {role === 'warehouse' && '库存管理、预留处理'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>系统支持色号锁定、库存预留全流程留痕</p>
        </div>
      </div>
    </div>
  );
}
