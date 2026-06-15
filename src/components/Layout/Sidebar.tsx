import { LayoutDashboard, Package, FileCheck, Truck, Settings, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

const navItems = [
  { icon: LayoutDashboard, label: '工作台', path: '/' },
  { icon: Package, label: '配件管理', path: '/parts' },
  { icon: FileCheck, label: '签认中心', path: '/signoff' },
  { icon: Truck, label: '设备档案', path: '/equipment' },
];

export function Sidebar() {
  const { currentUser } = useAuthStore();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">叉车维保系统</h1>
        <p className="text-sm text-slate-400 mt-1">停机处置与复工签认</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium">{currentUser?.name}</p>
            <p className="text-xs text-slate-400">
              {currentUser?.role === 'manager' && '维保主管'}
              {currentUser?.role === 'technician' && '现场技师'}
              {currentUser?.role === 'warehouse' && '仓管'}
            </p>
          </div>
        </div>
        <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Settings size={18} />
          <span>设置</span>
        </button>
      </div>
    </aside>
  );
}
