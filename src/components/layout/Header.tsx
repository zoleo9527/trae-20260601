import { Flame, Bell, Settings } from 'lucide-react';
import { useStore } from '@/store/store';
import { seedUsers } from '@/data/seedData';
import type { Role } from '@/types';

export const Header = () => {
  const { currentUser, setCurrentUser, selectedRole, setSelectedRole } = useStore();

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    const user = seedUsers.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">火锅店后厨管理系统</h1>
              <p className="text-xs text-primary-200">锅底备料 · 沽清提醒 · 订单管理</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              {(['前厅经理', '后厨主管', '收银'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedRole === role
                      ? 'bg-white text-primary-700'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-white/20">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
                  {currentUser?.avatar || '👤'}
                </div>
                <div className="text-sm">
                  <p className="font-medium">{currentUser?.name || '未登录'}</p>
                  <p className="text-xs text-primary-200">{currentUser?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
