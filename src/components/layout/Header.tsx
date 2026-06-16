import { Home, ListChecks, Scissors, Users } from 'lucide-react';
import type { User } from '@/types';

interface HeaderProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { key: 'outOfStock', label: '售罄处理', icon: Scissors },
  { key: 'replenish', label: '临时补货', icon: ListChecks },
  { key: 'logs', label: '操作日志', icon: FileText },
];

export default function Header({ currentUser, activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">餐饮连锁门店管理系统</h1>
              <p className="text-xs text-white/80">菜品售罄与临时补货</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === item.key
                      ? 'bg-white/20 text-white'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-white/80">
                {currentUser.role === 'manager' ? '店长' : currentUser.role === 'supervisor' ? '区域督导' : '采购'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
